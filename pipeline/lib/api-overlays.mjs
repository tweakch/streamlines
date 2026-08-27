/*
 * api-overlays.mjs — die Abfrageschicht über dem Kartenspeicher.
 *
 * Vier Endpunkte, die den beiden Speicherformen entsprechen:
 *
 *   /api/karte                     Metadaten: Ebenen, Overlays, Legenden,
 *                                  Realitätsnähe, Quellen. Einmal geholt.
 *   /api/kacheln/<ov>/<ebene>      Welche Kacheln es gibt, mit Inhalts-Hash.
 *   /api/kachel/<ov>/<eb>/<tx>/<ty>  1024 rohe Bytes zum Zeichnen.
 *                                  Mit ?h=<hash> unveränderlich cachebar —
 *                                  der Hash steht im Index, also holt der
 *                                  Client eine Kachel genau einmal, für immer.
 *   /api/zelle?ebene&c&r           Alles über eine Zelle (Ortsindex).
 *   /api/abfrage?ebene&f=…         Zellen, die auf Bedingungen passen
 *                                  (Attributindex) — „wo ist Südhang UND flach".
 *
 * Das ist die Trennung aus store.mjs, nach aussen gedreht: Kacheln zum
 * Zeichnen, Zeilen zum Fragen.
 */
import { existsSync } from 'node:fs'
import { oeffneStore } from './store.mjs'

const JSONH = { 'content-type': 'application/json; charset=utf-8' }

export function overlayApi(sqlitePfad) {
  /* Pro Anfrage öffnen und wieder schliessen. Eine dauerhaft offene
     Verbindung wäre schneller, aber sie hält die Datei unter Windows fest —
     und dann scheitert der nächste `bake-overlays.mjs` mit EPERM, während
     der Server läuft. Für ein Entwicklungswerkzeug ist das der falsche
     Handel: Öffnen kostet Mikrosekunden, ein blockierter Bake kostet eine
     Denkpause. */
  let db = null
  const holeDb = () => db

  /** Erlaubte Overlay-Ids — jede Eingabe wird dagegen geprüft, nie interpoliert. */
  const overlayIds = () =>
    new Set(holeDb().prepare('select id from overlay').all().map((o) => o.id))

  const jsonAntwort = (res, daten, cache = 'no-store') => {
    res.writeHead(200, { ...JSONH, 'cache-control': cache })
    res.end(JSON.stringify(daten))
  }
  const fehler = (res, code, txt) => {
    res.writeHead(code, JSONH)
    res.end(JSON.stringify({ fehler: txt }))
  }

  /**
   * Behandelt eine Anfrage. Gibt true zurück, wenn sie zu dieser API gehörte.
   */
  return function behandle(url, req, res) {
    if (!url.pathname.startsWith('/api/')) return false
    const teile = url.pathname.split('/').filter(Boolean) // ['api', …]
    const was = teile[1]
    if (!['karte', 'kacheln', 'kachel', 'zelle', 'abfrage', 'bericht'].includes(was))
      return false

    if (!existsSync(sqlitePfad)) {
      fehler(res, 503, 'Kartenspeicher fehlt — erst `node pipeline/bake-overlays.mjs` laufen lassen')
      return true
    }
    db = oeffneStore(sqlitePfad)
    try {
      return beantworte(teile, was, url, req, res)
    } finally {
      db.close()
      db = null
    }
  }

  function beantworte(teile, was, url, req, res) {
    const D = holeDb()

    /* ---- Metadaten ---- */
    if (was === 'karte') {
      const ebenen = D.prepare('select * from ebene order by id').all()
      const overlays = D.prepare('select * from overlay').all()
      const klassen = D.prepare('select * from klasse order by overlay, wert').all()
      const meta = Object.fromEntries(
        D.prepare('select schluessel, wert from meta').all().map((m) => [m.schluessel, m.wert]),
      )
      const kacheln = D.prepare(
        'select overlay, ebene, count(*) n from kachel group by overlay, ebene',
      ).all()
      jsonAntwort(res, {
        ebenen: ebenen.map((e) => ({ ...e, region: e.region ? JSON.parse(e.region) : null })),
        overlays: overlays.map((o) => ({
          ...o,
          ebenen: JSON.parse(o.ebenen),
          quellen: JSON.parse(o.quellen),
          quelleFehlt: !!o.quelle_fehlt,
          skala: o.skala ? JSON.parse(o.skala) : null,
          kacheln: Object.fromEntries(
            kacheln.filter((k) => k.overlay === o.id).map((k) => [k.ebene, k.n]),
          ),
          klassen: klassen
            .filter((k) => k.overlay === o.id)
            .map((k) => ({ ...k, extra: k.extra ? JSON.parse(k.extra) : null })),
        })),
        projektion: JSON.parse(meta.projektion),
        kachelGroesse: Number(meta.kachel),
        erzeugt: meta.erzeugt,
        quellen: JSON.parse(meta.quellen),
        realitaetsnaehe: JSON.parse(meta.realitaetsnaehe),
      })
      return true
    }

    /* ---- Das Herkunftsprotokoll ---- */
    if (was === 'bericht') {
      jsonAntwort(res, {
        eintraege: D.prepare('select * from ledger order by stufe').all().map((e) => ({
          ...e, posten: JSON.parse(e.posten),
        })),
        gesamt: JSON.parse(
          D.prepare("select wert from meta where schluessel='realitaetsnaehe'").get().wert,
        ),
      })
      return true
    }

    /* ---- Kachelindex: was es gibt, mit Hash ---- */
    if (was === 'kacheln') {
      const [, , ov, eb] = teile
      if (!overlayIds().has(ov)) return fehler(res, 404, `Overlay „${ov}" unbekannt`), true
      const rows = D.prepare(
        'select tx, ty, hash, gesetzt from kachel where overlay=? and ebene=? order by ty, tx',
      ).all(ov, Number(eb))
      jsonAntwort(res, { overlay: ov, ebene: Number(eb), kacheln: rows })
      return true
    }

    /* ---- Eine Kachel: rohe Bytes ---- */
    if (was === 'kachel') {
      const [, , ov, eb, tx, ty] = teile
      if (!overlayIds().has(ov)) return fehler(res, 404, `Overlay „${ov}" unbekannt`), true
      const row = D.prepare(
        'select hash, daten from kachel where overlay=? and ebene=? and tx=? and ty=?',
      ).get(ov, Number(eb), Number(tx), Number(ty))
      if (!row) return fehler(res, 404, 'Kachel leer oder ausserhalb'), true
      /* Wer den Hash mitschickt, bekommt sie als unveränderlich — dann fragt
         der Browser nie wieder nach. Ohne Hash: normale Revalidierung. */
      const unveraenderlich = url.searchParams.get('h') === row.hash
      if (req.headers['if-none-match'] === `"${row.hash}"`) {
        res.writeHead(304, { etag: `"${row.hash}"` })
        res.end()
        return true
      }
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        etag: `"${row.hash}"`,
        'cache-control': unveraenderlich
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=0, must-revalidate',
      })
      res.end(Buffer.from(row.daten))
      return true
    }

    /* ---- Eine Zelle: alles, was über sie bekannt ist ---- */
    if (was === 'zelle') {
      const ebene = Number(url.searchParams.get('ebene') ?? 1)
      const c = Number(url.searchParams.get('c'))
      const r = Number(url.searchParams.get('r'))
      if (![ebene, c, r].every(Number.isFinite))
        return fehler(res, 400, 'ebene, c, r müssen Zahlen sein'), true
      const werte = D.prepare(
        `select z.overlay, z.wert, o.name, o.einheit, o.kodierung,
                o.belegt, o.inspiriert, o.erfunden, k.schluessel, k.name klasse
         from zellwert z
         join overlay o on o.id = z.overlay
         left join klasse k on k.overlay = z.overlay and k.wert = z.wert
         where z.ebene=? and z.c=? and z.r=?`,
      ).all(ebene, c, r)
      jsonAntwort(res, { ebene, c, r, werte })
      return true
    }

    /* ---- Abfrage über den Attributindex ---- */
    if (was === 'abfrage') {
      const ebene = Number(url.searchParams.get('ebene') ?? 1)
      const limit = Math.min(5000, Number(url.searchParams.get('limit') ?? 500))
      const filter = url.searchParams.getAll('f')
      if (!filter.length) return fehler(res, 400, 'mindestens ein f=overlay:wert nötig'), true
      const erlaubt = overlayIds()
      const joins = []
      const wo = []
      const werte = []
      try {
        filter.forEach((f, k) => {
        const m = f.match(/^([a-z_]+):(\d+)(?:-(\d+))?$/)
        if (!m) throw Object.assign(new Error(`Filter „${f}" unverständlich`), { code: 400 })
        const [, ov, von, bis] = m
        if (!erlaubt.has(ov))
          throw Object.assign(new Error(`Overlay „${ov}" unbekannt`), { code: 404 })
        const a = `z${k}`
        joins.push(
          k === 0
            ? `from zellwert ${a}`
            : `join zellwert ${a} on ${a}.ebene=z0.ebene and ${a}.c=z0.c and ${a}.r=z0.r`,
        )
          wo.push(`${a}.overlay=? and ${a}.ebene=? and ${a}.wert between ? and ?`)
          werte.push(ov, ebene, Number(von), bis === undefined ? Number(von) : Number(bis))
        })
        const sql = `select z0.c, z0.r ${joins.join(' ')} where ${wo.join(' and ')} limit ?`
        const t0 = Date.now()
        const treffer = D.prepare(sql).all(...werte, limit)
        jsonAntwort(res, { ebene, filter, treffer, n: treffer.length, ms: Date.now() - t0 })
      } catch (e) {
        fehler(res, e.code ?? 500, String(e.message || e))
      }
      return true
    }

    return false
  }
}
