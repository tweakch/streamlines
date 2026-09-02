#!/usr/bin/env node
/*
 * normalize-geocover.mjs — Stufe 1 der Karten-Pipeline: der UNTERGRUND.
 *
 * Bis hierher wusste die Karte, wie das Gelände geformt ist (DTM), wo Wasser
 * steht (OSM) und wie tief die Seen sind (swissBATHY3D) — aber nicht, woraus
 * der Boden besteht. Damit waren drei Overlays angemeldet und leer: `fels`,
 * `boden` und `fundstelle` meldeten `quelleFehlt` und eine Eingabe von 0.
 * Diese Stufe füllt sie aus swissGEOCOVER2D (swisstopo).
 *
 * Ergebnis: sources/geocover-fels.geo.json · -boden.geo.json ·
 *           -archaeologie.geo.json  (WGS84, mit Provenienz und Lizenz)
 *
 * Aufruf:
 *   node pipeline/fetch/normalize-geocover.mjs            aus data/ vorhandene Blätter
 *   node pipeline/fetch/normalize-geocover.mjs --laden     fehlende Blätter holen
 *   node pipeline/fetch/normalize-geocover.mjs --bbox=9.30,46.80,9.85,47.70
 *   node pipeline/fetch/normalize-geocover.mjs --toleranz=100   (Douglas-Peucker, m)
 *   node pipeline/fetch/normalize-geocover.mjs --blaetter=1155,1175
 *
 * ---------------------------------------------------------------------------
 * DREI DINGE, DIE BEIM ERSTEN LADEN HERAUSKAMEN — sie erklären, warum das
 * Skript so aussieht und nicht kürzer:
 *
 * 1. Die Mapper zeigten auf ein Vokabular, das die Daten nicht führen.
 *    `geocover-fels.json` war auf `Rbed…` geschlüsselt (Katalogklasse
 *    „Bedrock_PLG_Sedimentary_Rocks_Main_Com"), `geocover-boden.json` auf
 *    `Runc308…` („Composit"). Ausgeliefert wird beides nicht: das GeoPackage
 *    führt `Bedrock_PLG.LITHO_MAIN` (110 Werte, 0 % leer) und
 *    `Unconsolidated_Deposits_PLG.RUNC_LITHO` (41 Werte, 0 % leer) — das
 *    Vokabular `Vlit…`. Die Spalte `COMPOSIT_D`, auf die der Boden-Mapper
 *    zielte, ist zu 99 % leer. Im Katalog GeologyModelLookUp_V2_1 gibt es
 *    KEINE Brücke zwischen den Vokabularen: beide sind flache Aufzählungen
 *    aus Code und Text, ohne Hierarchie. Die Mapper sind deshalb auf die
 *    ausgelieferten Texte umgeschlüsselt worden.
 *
 * 2. Dieses Skript klassifiziert NICHT. Es schreibt den Quelltext
 *    unverändert als `properties.code` — „Kalkstein: mikritisch: Chert"
 *    steht so in der Datei, wie GeoCover ihn führt. Die Übersetzung in
 *    Spielklassen bleibt ganz in den Mappern, wo sie handkuratiert und
 *    prüfbar ist. Wer hier reduzierte, würde die Entscheidung aus der
 *    Datendatei in den Parser verschieben — genau verkehrt (lib/mapper.mjs).
 *    Folge: ein Text ohne Mapper-Eintrag verschwindet nicht still, er landet
 *    als `unbekannt` im Herkunftsprotokoll und ist die Arbeitsliste.
 *
 * 3. Die swisstopo-Zips tragen BACKSLASHES als Pfadtrenner
 *    („GPKG\\de\\157_Sargans.gpkg"). Das ist nicht konform — die ZIP-Spezifikation
 *    verlangt „/" —, aber so ausgeliefert. Ein Filter auf „GPKG/de/" findet
 *    darum nichts und das Skript liefe stumm ins Leere.
 * ---------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data')
const SRC = join(ROOT, '..', 'sources')
const UNPACK = join(DATA, '_gc-unpack')

const STAC =
  'https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.geologie-geocover/items'
const LIZENZ =
  'swisstopo, freie Geodaten — Namensnennung («Bundesamt für Landestopografie swisstopo»)'

const argv = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.match(/^--([a-zA-Z]+)(?:=(.*))?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2] ?? '1']),
)
/* Standardfenster: der Alpenrhein, Landquart–Konstanz plus Rand. */
const BBOX = (argv.bbox ?? '9.30,46.80,9.85,47.70').split(',').map(Number)
const TOL_M = Number(argv.toleranz ?? 100)
const NUR = argv.blaetter ? new Set(argv.blaetter.split(',').map((s) => s.trim())) : null

/* ---------- Projektion: CH1903+/LV95 (EPSG:2056) → WGS84 ----------
 * Näherungsformeln von swisstopo („Näherungslösungen für die direkte
 * Transformation ETRS89 ↔ LV95"), genau auf etwa einen Meter. Das ist für ein
 * 400-m-Hexraster mehr als genug und erspart eine proj4-Abhängigkeit.
 * Kontrollpunkt: E 2600000 / N 1200000 → 7.43863 °O / 46.95108 °N (Bern). */
function wgs84(E, N) {
  const y = (E - 2600000) / 1000000
  const x = (N - 1200000) / 1000000
  const lon =
    (2.6779094 +
      4.728982 * y +
      0.791484 * y * x +
      0.1306 * y * x * x -
      0.0436 * y * y * y) *
    (100 / 36)
  const lat =
    (16.9023892 +
      3.238272 * x -
      0.270978 * y * y -
      0.002528 * x * x -
      0.0447 * y * y * x -
      0.0140 * x * x * x) *
    (100 / 36)
  return [lon, lat]
}

/* Ungefähre km je Grad auf der Höhe des Alpenrheins — nur für die
   Vereinfachung, damit die Toleranz in beiden Achsen dieselbe Länge meint. */
const KMX = 76.0
const KMY = 111.2

/* ---------- GeoPackage-Geometrie ----------
 * Ein GPKG-BLOB ist ein eigener Kopf („GP", Version, Flags, SRS, optionale
 * Hülle) und danach gewöhnliches WKB. Beides wird hier gelesen; bei einem
 * unbekannten Geometrietyp wird GEWORFEN und nicht geraten — eine still
 * übersprungene Geometrie wäre ein Loch in der Karte, das niemand sieht. */
function geomAusBlob(u8) {
  if (u8[0] !== 0x47 || u8[1] !== 0x50)
    throw new Error('kein GeoPackage-BLOB (Magic ≠ "GP")')
  const flags = u8[3]
  const huelleArt = (flags >> 1) & 0x07
  const huelleBytes = [0, 32, 48, 48, 64][huelleArt]
  if (huelleBytes === undefined)
    throw new Error(`unbekannte Hüllen-Kennung ${huelleArt}`)
  let p = 8 + huelleBytes
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)

  const punkt = (le) => {
    const lon = dv.getFloat64(p, le)
    const lat = dv.getFloat64(p + 8, le)
    p += 16
    return wgs84(lon, lat)
  }
  const kopf = () => {
    const le = u8[p] === 1
    p += 1
    let typ = dv.getUint32(p, le)
    p += 4
    if (typ & 0x20000000) { p += 4; typ &= ~0x20000000 } // eingebettete SRID
    return [le, typ % 1000] // 1000er-Stufen sind Z/M — die Ebene interessiert nicht
  }
  const ring = (le) => {
    const n = dv.getUint32(p, le)
    p += 4
    const out = new Array(n)
    for (let i = 0; i < n; i++) out[i] = punkt(le)
    return out
  }
  const polygon = (le) => {
    const n = dv.getUint32(p, le)
    p += 4
    const ringe = new Array(n)
    for (let i = 0; i < n; i++) ringe[i] = ring(le)
    return ringe
  }

  const [le, typ] = kopf()
  switch (typ) {
    case 1:
      return { type: 'Point', coordinates: punkt(le) }
    case 3:
      return { type: 'Polygon', coordinates: polygon(le) }
    case 4: {
      const n = dv.getUint32(p, le)
      p += 4
      const pts = []
      for (let i = 0; i < n; i++) { const [l] = kopf(); pts.push(punkt(l)) }
      return pts.length === 1
        ? { type: 'Point', coordinates: pts[0] }
        : { type: 'MultiPoint', coordinates: pts }
    }
    case 6: {
      const n = dv.getUint32(p, le)
      p += 4
      const polys = []
      for (let i = 0; i < n; i++) { const [l] = kopf(); polys.push(polygon(l)) }
      return polys.length === 1
        ? { type: 'Polygon', coordinates: polys[0] }
        : { type: 'MultiPolygon', coordinates: polys }
    }
    default:
      throw new Error(`WKB-Typ ${typ} nicht behandelt`)
  }
}

/* ---------- Douglas-Peucker ----------
 * Wie in den OSM-Stufen: die Zielauflösung ist ein 400-m-Hex, jeder Stützpunkt
 * darunter ist Ballast. Ein Ring behält immer mindestens vier Punkte, sonst
 * wäre er keine Fläche mehr. */
function dp(pts, tolKm) {
  if (pts.length < 3) return pts
  const [ax, ay] = pts[0]
  const [bx, by] = pts[pts.length - 1]
  let maxD = -1
  let idx = 0
  const dx = (bx - ax) * KMX
  const dy = (by - ay) * KMY
  const len2 = dx * dx + dy * dy
  for (let i = 1; i < pts.length - 1; i++) {
    const px = (pts[i][0] - ax) * KMX
    const py = (pts[i][1] - ay) * KMY
    let d
    if (len2 === 0) d = Math.hypot(px, py)
    else {
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2))
      d = Math.hypot(px - t * dx, py - t * dy)
    }
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD <= tolKm) return [pts[0], pts[pts.length - 1]]
  return [...dp(pts.slice(0, idx + 1), tolKm).slice(0, -1), ...dp(pts.slice(idx), tolKm)]
}

const rd = (v) => Math.round(v * 1e5) / 1e5
const runde = (pts) => pts.map(([a, b]) => [rd(a), rd(b)])

/*
 * Ein GESCHLOSSENER Ring lässt sich nicht in einem Zug durch Douglas-Peucker
 * schicken: Anfang und Ende sind derselbe Punkt, die Basislinie hat damit die
 * Länge 0, und der Algorithmus misst Abstände zu einem PUNKT statt zu einer
 * Sehne. Das ist nicht bloss ungenau, es dreht die Wirkung der Toleranz um —
 * bei 250 m fielen mehr Ringe auf zwei Punkte zusammen als bei 100 m, jeder
 * zusammengefallene Ring landete in der Notbremse „nimm das Original", und die
 * Dateien wurden bei GRÖBERER Toleranz GRÖSSER (16.3 → 24.0 MB). Gemessen,
 * nicht überlegt.
 *
 * Richtig ist: den Ring am entferntesten Punkt aufschneiden und die zwei
 * offenen Ketten einzeln vereinfachen. Bleibt dann noch immer keine Fläche
 * übrig, wird die Toleranz für diesen einen Ring geviertelt, statt gleich das
 * Original zu behalten — sonst zahlt man für jedes Polygon unter Toleranzgrösse
 * die volle Stützpunktzahl.
 */
function vereinfacheRing(r, tolKm) {
  if (r.length <= 5) return runde(r)
  const zu =
    r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]
  if (!zu) return runde(dp(r, tolKm))

  const offen = r.slice(0, -1)
  let fi = 1
  let fd = -1
  for (let i = 1; i < offen.length; i++) {
    const d = Math.hypot(
      (offen[i][0] - offen[0][0]) * KMX,
      (offen[i][1] - offen[0][1]) * KMY,
    )
    if (d > fd) { fd = d; fi = i }
  }

  for (const t of [tolKm, tolKm / 4, tolKm / 16]) {
    const a = dp(offen.slice(0, fi + 1), t)
    const b = dp(offen.slice(fi), t)
    const v = [...a.slice(0, -1), ...b]
    if (v.length >= 3) {
      v.push(v[0])
      return runde(v)
    }
  }
  return runde(r)
}

function vereinfache(geom, tolKm) {
  if (geom.type === 'Polygon')
    return { ...geom, coordinates: geom.coordinates.map((r) => vereinfacheRing(r, tolKm)) }
  if (geom.type === 'MultiPolygon')
    return {
      ...geom,
      coordinates: geom.coordinates.map((p) => p.map((r) => vereinfacheRing(r, tolKm))),
    }
  if (geom.type === 'Point') return { ...geom, coordinates: runde([geom.coordinates])[0] }
  if (geom.type === 'MultiPoint') return { ...geom, coordinates: runde(geom.coordinates) }
  return geom
}

/* ---------- Blätter besorgen ---------- */
async function blaetterImFenster() {
  const url = `${STAC}?bbox=${BBOX.join(',')}&limit=200`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`STAC ${r.status} für ${url}`)
  const j = await r.json()
  return j.features
    .filter((f) => f.id !== 'geologie-geocover') // die 1.6-GB-Vollabdeckung
    .map((f) => f.id.replace('geologie-geocover_', ''))
    .filter((id) => !NUR || NUR.has(id))
}

async function ladeBlatt(id) {
  const ziel = join(DATA, `geocover-${id}.gpkg.zip`)
  if (existsSync(ziel) && statSync(ziel).size > 0) return ziel
  const url =
    `https://data.geo.admin.ch/ch.swisstopo.geologie-geocover/` +
    `geologie-geocover_${id}/geologie-geocover_${id}_2056.gpkg.zip`
  process.stdout.write(`  lade Blatt ${id} … `)
  const r = await fetch(url)
  if (!r.ok) { console.log(`FEHLER ${r.status}`); return null }
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(ziel, buf)
  console.log(`${(buf.length / 1048576).toFixed(1)} MB`)
  return ziel
}

/** Entpackt aus einem Blatt-Zip die deutsche .gpkg (gecacht in _gc-unpack). */
function gpkgVonBlatt(zipPfad, blatt) {
  mkdirSync(UNPACK, { recursive: true })
  const schon = readdirSync(UNPACK).find((f) => f.startsWith(blatt + '_'))
  if (schon) return join(UNPACK, schon)
  const eintraege = unzipSync(new Uint8Array(readFileSync(zipPfad)), {
    /* Beide Trenner: die Zips tragen Backslashes (siehe Kopf, Punkt 3). */
    filter: (f) => /GPKG[/\\]de[/\\].*\.gpkg$/.test(f.name),
  })
  const namen = Object.keys(eintraege)
  if (!namen.length) return null
  const out = join(UNPACK, blatt + '_' + namen[0].split(/[/\\]/).pop())
  writeFileSync(out, eintraege[namen[0]])
  return out
}

/* ---------- Die drei Ebenen ---------- */
const EBENEN = [
  {
    datei: 'geocover-fels.geo.json',
    kind: 'fels',
    tabelle: 'Bedrock_PLG',
    code: 'LITHO_MAIN',
    extra: ['LITHO_SEC', 'CHRONO_TOP', 'TECTO'],
    was: 'Anstehendes Festgestein, Hauptlithologie',
  },
  {
    datei: 'geocover-boden.geo.json',
    kind: 'lockergestein',
    tabelle: 'Unconsolidated_Deposits_PLG',
    code: 'RUNC_LITHO',
    extra: ['CHARACT_D', 'COMPOSIT_D', 'RUNC_CHRONO_T'],
    was: 'Lockergestein, Ablagerungsart',
  },
  {
    datei: 'geocover-archaeologie.geo.json',
    kind: 'archaeologie',
    tabelle: 'Archaeology_PT',
    code: 'KIND',
    extra: ['AARC_EPOCH', 'AARC_PERIOD', 'AARC_AGE'],
    was: 'Archäologische Fundstellen',
  },
]

/* ---------- Lauf ---------- */
const tolKm = TOL_M / 1000

let blaetter
if (argv.laden) {
  console.log(`STAC-Abfrage für bbox ${BBOX.join(', ')} …`)
  blaetter = await blaetterImFenster()
  console.log(`${blaetter.length} Blätter im Fenster: ${blaetter.join(' ')}\n`)
  for (const id of blaetter) await ladeBlatt(id)
  console.log()
} else {
  blaetter = readdirSync(DATA)
    .map((f) => f.match(/^geocover-(\d+)\.gpkg\.zip$/))
    .filter(Boolean)
    .map((m) => m[1])
    .filter((id) => !NUR || NUR.has(id))
  if (!blaetter.length) {
    console.error(
      'Keine Blätter in pipeline/data/. Einmalig holen:\n' +
        '  node pipeline/fetch/normalize-geocover.mjs --laden\n',
    )
    process.exit(1)
  }
}

const rohGpkgs = []
for (const id of blaetter.sort()) {
  const zip = join(DATA, `geocover-${id}.gpkg.zip`)
  if (!existsSync(zip)) { console.log(`  ! Blatt ${id}: Zip fehlt`); continue }
  const g = gpkgVonBlatt(zip, id)
  if (!g) { console.log(`  ! Blatt ${id}: keine deutsche .gpkg im Zip`); continue }
  rohGpkgs.push({ id, pfad: g })
}

/* ---------- Dasselbe Kartenblatt zweimal ----------
 * Die Sammlung liefert manche Blätter unter ZWEI Kennungen: einmal unter der
 * Kachelnummer (1175), einmal unter der Blattnummer des Geologischen Atlas
 * (178) — und zwar in verschiedenen Fassungen des Datenmodells. Vättis kam so
 * doppelt: 1157 Polygone mit den alten Spalten `LITHO_D`/`LITHO_F` und 1161
 * mit den heutigen `LITHO_MAIN`/`_SEC`/`_TER`.
 *
 * Aufgefallen ist es nicht an den Polygonen, sondern an einer Fundstelle mit
 * identischer Koordinate auf zwei Blättern — und vorher hatte das Skript
 * `LITHO_MAIN fehlt` gemeldet, wo die Spalte in der anderen Fassung sehr wohl
 * da war. Ohne diese Auswahl würde das Gebiet doppelt gezählt UND aus der
 * schlechteren Fassung gelesen.
 *
 * Geschlüsselt wird auf den Blattnamen IM Zip (`178_Vaettis`), nicht auf die
 * Kennung; gewinnt die Fassung, die mehr der erwarteten Spalten führt. */
const ERWARTET = EBENEN.map((e) => [e.tabelle, e.code])

function modellPunkte(pfad) {
  const db = new DatabaseSync(pfad, { readOnly: true })
  const tabellen = new Set(
    db.prepare('select table_name from gpkg_contents').all().map((r) => r.table_name),
  )
  let punkte = 0
  for (const [t, c] of ERWARTET) {
    if (!tabellen.has(t)) continue
    const spalten = db.prepare(`pragma table_info("${t}")`).all().map((r) => r.name)
    if (spalten.includes(c)) punkte++
  }
  db.close()
  return punkte
}

const nachBlattname = new Map()
for (const g of rohGpkgs) {
  /* "1175_178_Vaettis.gpkg" → "178_Vaettis" */
  const name = g.pfad.split(/[/\\]/).pop().replace(/^\d+_/, '').replace(/\.gpkg$/, '')
  const punkte = modellPunkte(g.pfad)
  const groesse = statSync(g.pfad).size
  const vorher = nachBlattname.get(name)
  if (
    !vorher ||
    punkte > vorher.punkte ||
    (punkte === vorher.punkte && groesse > vorher.groesse)
  ) {
    if (vorher) console.log(
      `  Blatt „${name}" doppelt: Kennung ${g.id} (${punkte} Modellspalten) ` +
        `ersetzt ${vorher.id} (${vorher.punkte})`,
    )
    nachBlattname.set(name, { ...g, name, punkte, groesse })
  } else {
    console.log(
      `  Blatt „${name}" doppelt: Kennung ${g.id} (${punkte} Modellspalten) ` +
        `verworfen, ${vorher.id} (${vorher.punkte}) behalten`,
    )
  }
}
const gpkgs = [...nachBlattname.values()]
console.log(
  `\n${gpkgs.length} Kartenblätter aus ${rohGpkgs.length} Kennungen` +
    (rohGpkgs.length !== gpkgs.length
      ? ` (${rohGpkgs.length - gpkgs.length} Doppelung entfernt)`
      : '') +
    '\n',
)

const luecken = []

for (const E of EBENEN) {
  const features = []
  const werte = new Map()
  let blattlose = 0

  for (const { id, pfad } of gpkgs) {
    const db = new DatabaseSync(pfad, { readOnly: true })
    const tabellen = new Set(
      db.prepare('select table_name from gpkg_contents').all().map((r) => r.table_name),
    )
    if (!tabellen.has(E.tabelle)) {
      luecken.push(`${E.tabelle} fehlt auf Blatt ${id}`)
      blattlose++
      db.close()
      continue
    }
    const spalten = new Set(
      db.prepare(`pragma table_info("${E.tabelle}")`).all().map((r) => r.name),
    )
    if (!spalten.has(E.code)) {
      luecken.push(`${E.tabelle}.${E.code} fehlt auf Blatt ${id}`)
      db.close()
      continue
    }
    const mit = E.extra.filter((c) => spalten.has(c))
    const sql =
      `select GEOM as g, "${E.code}" as code` +
      (mit.length ? ', ' + mit.map((c) => `"${c}"`).join(', ') : '') +
      ` from "${E.tabelle}"`

    for (const row of db.prepare(sql).all()) {
      if (!row.g || row.code == null) continue
      let geom
      try {
        geom = vereinfache(geomAusBlob(new Uint8Array(row.g)), tolKm)
      } catch (err) {
        luecken.push(`${E.tabelle} Blatt ${id}: ${err.message}`)
        continue
      }
      const props = { kind: E.kind, code: row.code, blatt: id }
      for (const c of mit) if (row[c] != null) props[c.toLowerCase()] = row[c]
      features.push({ type: 'Feature', properties: props, geometry: geom })
      werte.set(row.code, (werte.get(row.code) ?? 0) + 1)
    }
    db.close()
  }

  const out = {
    type: 'FeatureCollection',
    provenance: {
      quelle: 'swissGEOCOVER2D (swisstopo), GeoPackage MN95 / EPSG:2056',
      beschreibung:
        `${E.was} aus ${E.tabelle}.${E.code}, ${gpkgs.length} Blätter des ` +
        `Geologischen Atlas 1:25 000 im Fenster ${BBOX.join('/')}. ` +
        `MN95 → WGS84 mit den swisstopo-Näherungsformeln (~1 m), ` +
        `Douglas-Peucker ${TOL_M} m, Koordinaten auf 5 Dezimalen (~1 m). ` +
        `Der Quelltext steht UNVERÄNDERT in properties.code — klassiert wird ` +
        `erst im Mapper (pipeline/mappers/). ${werte.size} verschiedene Werte.` +
        (blattlose ? ` ${blattlose} Blätter führen diese Tabelle nicht.` : ''),
      lizenz: LIZENZ,
      crs: 'WGS84 [lon, lat]',
      katalog:
        'GeologyModelLookUp_V2_1 (models.geo.admin.ch) — beschreibt das ' +
        'Vokabular, enthält aber KEINE Brücke von Vlit… zu Rbed…',
      rohdaten: `pipeline/data/geocover-*.gpkg.zip (${gpkgs.length} Blätter, nicht im Repo)`,
      stand: new Date().toISOString().slice(0, 10),
    },
    features,
  }
  const pfad = join(SRC, E.datei)
  writeFileSync(pfad, JSON.stringify(out))
  const mb = (statSync(pfad).size / 1048576).toFixed(1)
  console.log(
    `${E.datei.padEnd(30)} ${String(features.length).padStart(6)} Merkmale · ` +
      `${String(werte.size).padStart(3)} Werte · ${mb.padStart(6)} MB`,
  )
  const top = [...werte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  console.log(`   häufigste: ${top.map(([v, n]) => `${v} (${n})`).join(' · ')}`)
}

if (luecken.length) {
  console.log(`\n  ${luecken.length} Lücken — bewusst gemeldet, nicht verschwiegen:`)
  const gezaehlt = new Map()
  for (const l of luecken) {
    const k = l.replace(/Blatt \d+/, 'Blatt …')
    gezaehlt.set(k, (gezaehlt.get(k) ?? 0) + 1)
  }
  for (const [k, n] of [...gezaehlt.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`    ${String(n).padStart(3)}×  ${k}`)
}
console.log(`\n  geschrieben nach ${SRC}\n`)
