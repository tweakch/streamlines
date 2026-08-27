#!/usr/bin/env node
/*
 * bake-overlays.mjs — Stufe 3 der Karten-Pipeline: statische Feldparameter
 * als abfragbare Overlays.
 *
 * Rohdaten rein → handkuratierte Mapper übersetzen → alles andere wird
 * ausgestossen und protokolliert. Ergebnis ist EIN Erzeugnis in zwei Formen:
 *
 *   out/karte.sqlite   Kacheln als BLOB (Auslieferung) + Zellwerte mit Index
 *                      (Abfrage) + Legenden + das Herkunftsprotokoll
 *   out/bericht.json   dasselbe Protokoll für Menschen und für den Viewer
 *
 * Aufruf:
 *   node --no-warnings pipeline/bake-overlays.mjs
 *   node --no-warnings pipeline/bake-overlays.mjs --ebenen=1      (nur Spielebene)
 *   node --no-warnings pipeline/bake-overlays.mjs --overlay=hoehe,steigung
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CFG, LEVELS, TILE, SQRT3, sizeOf, gridDims, kmOf, cellAtKm, centerKm,
  lonlatOf, dirsOf, hexLine, pip, regionCellsOf, sampleBilinear, sampleNearest,
} from './lib/geo.mjs'
import { ledger, gesamtbericht, berichtAlsText } from './lib/ledger.mjs'
import { OVERLAYS, reihenfolge, pruefeRegistry } from './overlays/index.mjs'
import { neuerStore } from './lib/store.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = join(ROOT, 'out')
const arg = (k, d = null) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`))
  return a ? a.slice(k.length + 3) : d
}

/* ---------- Quellen einlesen ---------- */
const srcDir = join(ROOT, 'sources')
const feats = []
const grids = []
const bett = []
const quellen = []

for (const f of readdirSync(srcDir)) {
  if (f.endsWith('.grid.json')) {
    const g = JSON.parse(readFileSync(join(srcDir, f), 'utf8'))
    if (g.kind !== 'hoehen' && g.kind !== 'tiefe') continue
    const buf = Buffer.from(g.data, 'base64')
    const eintrag = {
      meta: g.meta,
      data: new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2),
    }
    ;(g.kind === 'tiefe' ? bett : grids).push(eintrag)
    quellen.push({ datei: f, kind: g.kind, ...(g.provenance ?? {}) })
    continue
  }
  if (!f.endsWith('.geo.json')) continue
  const gj = JSON.parse(readFileSync(join(srcDir, f), 'utf8'))
  feats.push(...gj.features)
  quellen.push({
    datei: f, kind: 'geo', anzahl: gj.features.length, ...(gj.provenance ?? {}),
  })
}
console.log(`Quellen: ${quellen.length} Dateien, ${feats.length} Merkmale, ` +
  `${grids.length} Höhenraster, ${bett.length} Tiefenraster`)

/* Region der feinen Ebene = Hülle über die Höhenquellen (wie in bake.mjs). */
let REGION = null
if (grids.length) {
  let lonW = Infinity, lonE = -Infinity, latS = Infinity, latN = -Infinity
  for (const g of grids) {
    const m = g.meta
    lonW = Math.min(lonW, m.lon0)
    lonE = Math.max(lonE, m.lon0 + m.dLon * (m.cols - 1))
    latN = Math.max(latN, m.lat0)
    latS = Math.min(latS, m.lat0 - m.dLat * (m.rows - 1))
  }
  REGION = { lonW, lonE, latS, latN }
  console.log(`Höhenregion: ${lonW.toFixed(2)}–${lonE.toFixed(2)}°O, ` +
    `${latS.toFixed(2)}–${latN.toFixed(2)}°N`)
}

/* Talboden-Blöcke (Blockminimum ~1.6 km) — einmal je Höhenquelle. */
const FLOOR_B = 8
for (const g of grids) {
  const m = g.meta
  const bc = Math.ceil(m.cols / FLOOR_B)
  const br = Math.ceil(m.rows / FLOOR_B)
  const blk = new Float64Array(bc * br).fill(Infinity)
  for (let r = 0; r < m.rows; r++)
    for (let c = 0; c < m.cols; c++) {
      const v = g.data[r * m.cols + c]
      if (v === m.nodata) continue
      const bi = Math.floor(r / FLOOR_B) * bc + Math.floor(c / FLOOR_B)
      if (v < blk[bi]) blk[bi] = v
    }
  g.floor = { bc, br, blk }
}
function talbodenAt(lon, lat) {
  for (const g of grids) {
    const m = g.meta
    const bx = Math.floor((lon - m.lon0) / m.dLon / FLOOR_B)
    const by = Math.floor((m.lat0 - lat) / m.dLat / FLOOR_B)
    if (bx < 0 || by < 0 || bx >= g.floor.bc || by >= g.floor.br) continue
    let mn = Infinity
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const x = bx + i, y = by + j
        if (x < 0 || y < 0 || x >= g.floor.bc || y >= g.floor.br) continue
        const v = g.floor.blk[y * g.floor.bc + x]
        if (v < mn) mn = v
      }
    if (mn < Infinity) return mn
  }
  return null
}

/* ---------- Kontext je Ebene ---------- */
function baueKontext(L) {
  const s = sizeOf(L.hexKm)
  const [cols, rows] = gridDims(s)
  const region = L.dtm && REGION ? regionCellsOf(REGION, s, cols, rows) : null
  const voll = { c0: 0, c1: cols - 1, r0: 0, r1: rows - 1 }
  const regionF = REGION
    ? (() => {
        const rc = regionCellsOf(REGION, s, cols, rows)
        return { c0: rc.c0, c1: rc.c1, r0: rc.r0, r1: rc.r1 }
      })()
    : voll
  /* Das Fenster ist der Anspruch des Overlays, nicht die Grösse der Karte.
     Ein Overlay aus dem DTM bilanziert gegen die Höhenregion — sonst meldet
     es 79 % „ausgestossen", nur weil die Rheinkarte bis Rotterdam reicht,
     und die Zahl sagt nichts mehr über die Datenlage aus. */
  let fenster = L.dtm && region ? regionF : voll
  const idx = (c, r) => r * cols + c
  const inF = (c, r) =>
    c >= fenster.c0 && c <= fenster.c1 && r >= fenster.r0 && r <= fenster.r1

  /* Halbe Feldbreite in Grad — die Schrittweite der zentralen Differenzen. */
  const halbKm = L.hexKm / 2
  const dLon = halbKm / CFG.kmx
  const dLat = halbKm / CFG.kmy

  const berechnet = new Map()

  const ctx = {
    ebene: L,
    cols,
    rows,
    s,
    region,
    idx,
    get fenster() {
      return fenster
    },
    /** Der Runner setzt vor jedem Overlay dessen Anspruch. */
    _fenster(nurRegion) {
      fenster = nurRegion ? regionF : L.dtm && region ? regionF : voll
    },
    neuesFeld: () => new Uint8Array(cols * rows),

    jedeZelle(fn) {
      for (let r = fenster.r0; r <= fenster.r1; r++)
        for (let c = fenster.c0; c <= fenster.c1; c++) {
          const [x, y] = centerKm(c, r, s)
          const [lon, lat] = lonlatOf([x, y])
          fn(c, r, idx(c, r), lon, lat)
        }
    },

    /** Nur Zellen, in denen ein anderes Overlay einen der Werte trägt. */
    jedeZelleMit(feld, werte, fn) {
      for (let r = fenster.r0; r <= fenster.r1; r++)
        for (let c = fenster.c0; c <= fenster.c1; c++) {
          const i = idx(c, r)
          if (!werte.includes(feld[i])) continue
          const [x, y] = centerKm(c, r, s)
          const [lon, lat] = lonlatOf([x, y])
          fn(c, r, i, lon, lat)
        }
    },

    hoeheAt: (lon, lat) => sampleBilinear(grids, lon, lat),
    seegrundAt: (lon, lat) => sampleNearest(bett, lon, lat),
    talbodenAt,

    /** Gefälle als {steigung, dx, dy} — dx nach Osten, dy nach Norden. */
    gefaelleAt(lon, lat) {
      const zW = sampleBilinear(grids, lon - dLon, lat)
      const zE = sampleBilinear(grids, lon + dLon, lat)
      const zS = sampleBilinear(grids, lon, lat - dLat)
      const zN = sampleBilinear(grids, lon, lat + dLat)
      if (zW === null || zE === null || zS === null || zN === null) return null
      const dx = (zE - zW) / (2 * halbKm * 1000)
      const dy = (zN - zS) / (2 * halbKm * 1000)
      return { steigung: Math.hypot(dx, dy), dx, dy }
    },

    merkmale: (kinds) =>
      feats.filter((f) => kinds.includes(f.properties.kind)),

    zelleBei([lon, lat]) {
      const [c, r] = cellAtKm(...kmOf([lon, lat]), s)
      return inF(c, r) ? idx(c, r) : null
    },

    *zellenInPolygon(ring) {
      const kmRing = ring.map(kmOf)
      const xs = kmRing.map((p) => p[0])
      const ys = kmRing.map((p) => p[1])
      const c0 = Math.max(fenster.c0, Math.floor(Math.min(...xs) / (s * SQRT3)) - 1)
      const c1 = Math.min(fenster.c1, Math.ceil(Math.max(...xs) / (s * SQRT3)) + 1)
      const r0 = Math.max(fenster.r0, Math.floor(Math.min(...ys) / (s * 1.5)) - 1)
      const r1 = Math.min(fenster.r1, Math.ceil(Math.max(...ys) / (s * 1.5)) + 1)
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const [x, y] = centerKm(c, r, s)
          if (pip(x, y, kmRing)) yield idx(c, r)
        }
    },

    *zellenEntlang(coords) {
      let letzte = null
      for (let i = 0; i < coords.length - 1; i++) {
        const a = cellAtKm(...kmOf(coords[i]), s)
        const b = cellAtKm(...kmOf(coords[i + 1]), s)
        for (const [c, r] of hexLine(a, b)) {
          if (letzte && letzte[0] === c && letzte[1] === r) continue
          letzte = [c, r]
          if (inF(c, r)) yield idx(c, r)
        }
      }
    },

    nachbarschaftHat(feld, c, r, werte) {
      for (const [dr, dc] of dirsOf(r)) {
        const nc = c + dc, nr = r + dr
        if (!inF(nc, nr)) continue
        if (werte.includes(feld[idx(nc, nr)])) return true
      }
      return false
    },

    holen(id) {
      const v = berechnet.get(id)
      if (!v)
        throw new Error(
          `Overlay-Reihenfolge falsch: „${id}" wurde vor seinem Nutzer gebraucht`,
        )
      return v
    },
    _setze: (id, werte) => berechnet.set(id, werte),

    ledger: (quelle) =>
      ledger({ quelle, stufe: `overlay:${ctx._aktuell}@${L.id}`, ebene: L.id }),
  }
  return ctx
}

/* ---------- Lauf ---------- */
pruefeRegistry()
const nurEbenen = arg('ebenen')?.split(',').map(Number) ?? null
const nurOverlay = arg('overlay')?.split(',') ?? null
const gewaehlt = reihenfolge(
  nurOverlay ? OVERLAYS.filter((o) => nurOverlay.includes(o.id)) : OVERLAYS,
)

mkdirSync(OUT, { recursive: true })
const store = neuerStore(join(OUT, 'karte.sqlite'))
const naeheJeOverlay = new Map()
const statistik = []

store.transaktion(() => {
  for (const L of LEVELS) {
    if (nurEbenen && !nurEbenen.includes(L.id)) continue
    const t0 = Date.now()
    const ctx = baueKontext(L)
    store.setzeEbene(L, ctx.cols, ctx.rows, TILE, ctx.region?.km ?? null)

    let kacheln = 0
    let zellen = 0
    for (const o of gewaehlt) {
      if (!o.ebenen.includes(L.id)) continue
      ctx._aktuell = o.id
      ctx._fenster(!!o.nurRegion)
      const { werte, ledger: Led, quelleFehlt } = o.berechne(ctx)
      ctx._setze(o.id, werte)

      const naehe = Led.realitaetsnaehe()
      const vorher = naeheJeOverlay.get(o.id)
      /* Für die Overlay-Zeile zählt die feinste gerechnete Ebene. */
      if (!vorher || L.id > vorher.ebene)
        naeheJeOverlay.set(o.id, { ...naehe, ebene: L.id, quelleFehlt })

      /* Kacheln schreiben (Auslieferung). */
      for (let ty = 0; ty * TILE < ctx.rows; ty++)
        for (let tx = 0; tx * TILE < ctx.cols; tx++) {
          if (
            tx * TILE > ctx.fenster.c1 || (tx + 1) * TILE <= ctx.fenster.c0 ||
            ty * TILE > ctx.fenster.r1 || (ty + 1) * TILE <= ctx.fenster.r0
          )
            continue
          const buf = new Uint8Array(TILE * TILE)
          for (let j = 0; j < TILE; j++)
            for (let i = 0; i < TILE; i++) {
              const c = tx * TILE + i, r = ty * TILE + j
              if (c >= ctx.cols || r >= ctx.rows) continue
              buf[j * TILE + i] = werte[ctx.idx(c, r)]
            }
          if (store.schreibeKachel(o.id, L.id, tx, ty, buf)) kacheln++
        }

      /* Zellwerte schreiben (Abfrage) — nur Spielebenen. */
      if (L.id <= 1)
        ctx.jedeZelle((c, r, i) => {
          if (!werte[i]) return
          store.schreibeZellwert(L.id, o.id, c, r, werte[i])
          zellen++
        })
    }
    statistik.push({ ebene: L.id, hexKm: L.hexKm, cols: ctx.cols, rows: ctx.rows,
      kacheln, zellen, ms: Date.now() - t0 })
    console.log(
      `Ebene ${L.id} (${L.hexKm} km): ${ctx.cols}×${ctx.rows} Zellen, ` +
        `${kacheln} Kacheln, ${zellen} Zellwerte, ${Date.now() - t0} ms`,
    )
  }

  for (const o of gewaehlt) {
    const n = naeheJeOverlay.get(o.id)
    store.setzeOverlay({ ...o, quelleFehlt: n?.quelleFehlt ?? false }, n)
  }
})

const bericht = gesamtbericht()
store.transaktion(() => {
  store.schreibeLedger(bericht)
  store.setzeMeta('erzeugt', new Date().toISOString())
  store.setzeMeta('projektion', JSON.stringify(CFG))
  store.setzeMeta('kachel', TILE)
  store.setzeMeta('quellen', JSON.stringify(quellen))
  store.setzeMeta('realitaetsnaehe', JSON.stringify(bericht.gesamt))
})
store.abschluss()

writeFileSync(
  join(OUT, 'bericht.json'),
  JSON.stringify({ erzeugt: new Date().toISOString(), quellen, statistik, ...bericht }, null, 2),
)

console.log(berichtAlsText(bericht))
const fehlend = [...naeheJeOverlay.entries()].filter(([, n]) => n.quelleFehlt)
if (fehlend.length)
  console.log(
    `  ⚠ Overlays ohne Quelle: ${fehlend.map(([id]) => id).join(', ')} — ` +
      `Mapper stehen bereit, Geometrie fehlt.\n`,
  )
console.log(`  geschrieben: ${join(OUT, 'karte.sqlite')} · ${join(OUT, 'bericht.json')}\n`)
