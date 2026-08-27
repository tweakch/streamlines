#!/usr/bin/env node
/*
 * normalize-bathy.mjs — Stufe 1 der Karten-Pipeline: der SEEGRUND.
 *
 * Das Höhenmodell (normalize-dtm.mjs) ist ein GELÄNDEmodell: über einem See
 * führt es die Wasseroberfläche, nicht den Grund. Nachgemessen liest sich der
 * Bodensee quer über seine ganze Breite als ebene 400-m-Fläche, obwohl er
 * 251 m tief ist. Solange das so bleibt, ist im Modell keine Seewanne
 * vorhanden — und jede Aussage über Tiefe, Volumen oder eine wandernde
 * Uferlinie wäre erfunden statt gemessen.
 *
 * Diese Stufe legt den gemessenen Grund daneben: swissBATHY3D von swisstopo
 * (ESRI-ASCII-Kacheln in CH1903+/LV95, Höhen in LN02), abgetastet auf GENAU
 * dasselbe Lon/Lat-Raster wie die Höhenquelle — dieselbe Rasterweite, dieselbe
 * Nordwestecke. Damit liegen Gelände und Grund Zelle auf Zelle übereinander
 * und lassen sich ohne Umrechnung gegeneinander verrechnen.
 *
 * Aufruf:  node pipeline/fetch/normalize-bathy.mjs
 *          node pipeline/fetch/normalize-bathy.mjs --laden          (fehlende Seen holen)
 *          node pipeline/fetch/normalize-bathy.mjs --seen=thunersee,walensee
 *          node pipeline/fetch/normalize-bathy.mjs --probe=25       (Zielabstand der Stichproben, m)
 *
 * Ergebnis: sources/swissbathy3d.grid.json (kind "tiefe"), Int16-Meter.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data')
const SRC = join(ROOT, '..', 'sources')
const OUT = join(SRC, 'swissbathy3d.grid.json')

const argv = Object.fromEntries(
  process.argv.slice(2)
    .map((a) => a.match(/^--([a-zA-Z]+)(?:=(.*))?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2] ?? '1']),
)
const manifest = JSON.parse(readFileSync(join(SRC, 'tiefen.manifest.json'), 'utf8'))
const nurSeen = argv.seen ? argv.seen.split(',').map((x) => x.trim()).filter(Boolean) : null
const PROBE_M = Number(argv.probe || 25)

/* ---- Zielraster = das Raster der Höhenquelle, unverändert übernommen ----
   „In derselben Abtastung wie das Gelände" ist keine Näherung, sondern
   wörtlich dieselbe Geometrie: lon0/lat0/dLon/dLat/cols/rows werden aus der
   Höhenquelle gelesen. Fehlt sie, gibt es kein Ziel — dann lieber abbrechen
   als ein zweites, leicht verschobenes Raster in die Welt setzen. */
const hoehenDatei = ['sonny-dtm-50.grid.json', 'sonny-dtm-ch50.grid.json']
  .map((f) => join(SRC, f)).find((f) => existsSync(f))
if (!hoehenDatei) {
  console.error('Keine Höhenquelle in pipeline/sources/ — zuerst normalize-dtm.mjs laufen lassen.')
  console.error('Der Seegrund wird auf DEREN Raster abgetastet; ohne sie gibt es kein Ziel.')
  process.exit(1)
}
const M = JSON.parse(readFileSync(hoehenDatei, 'utf8')).meta
console.log(`Zielraster aus ${hoehenDatei.split(/[\\/]/).pop()}: ${M.cols}×${M.rows} · ` +
  `${M.lon0.toFixed(3)}–${(M.lon0 + M.dLon * (M.cols - 1)).toFixed(3)}°O, ` +
  `${(M.lat0 - M.dLat * (M.rows - 1)).toFixed(3)}–${M.lat0.toFixed(3)}°N`)

/* ---- LV95 → WGS84, swisstopo-Näherung (~1 m; das Ziel ist 200 m grob) ---- */
function lv95zuWgs(E, N) {
  const y = (E - 2600000) / 1000000, x = (N - 1200000) / 1000000
  const lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y * y * y
  const lat = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x
            - 0.0447 * y * y * x - 0.0140 * x * x * x
  return [lon * 100 / 36, lat * 100 / 36]
}

/* ---- Minimaler ZIP-Leser: die Pakete sind Sammlungen von .asc-Kacheln ----
   Kein ZIP64 nötig (grösstes Paket 248 MB, 751 Einträge); jede Kachel wird
   einzeln entpackt, nie das ganze Paket auf einmal. */
function zipEintraege(buf) {
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('kein ZIP-Ende gefunden')
  const n = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  const out = []
  for (let k = 0; k < n; k++) {
    const method = buf.readUInt16LE(off + 10)
    const csize = buf.readUInt32LE(off + 20)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const lho = buf.readUInt32LE(off + 42)
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen)
    out.push({ name, method, csize, lho })
    off += 46 + nameLen + extraLen + commentLen
  }
  return out
}
function zipLies(buf, e) {
  const nameLen = buf.readUInt16LE(e.lho + 26)
  const extraLen = buf.readUInt16LE(e.lho + 28)
  const start = e.lho + 30 + nameLen + extraLen
  const raw = buf.subarray(start, start + e.csize)
  return e.method === 0 ? raw : zlib.inflateRawSync(raw)
}

/* ---- Akkumulatoren über dem Zielraster ---- */
const CELLS = M.cols * M.rows
const summe = new Float64Array(CELLS)
const zahl = new Uint32Array(CELLS)
const tiefste = new Float64Array(CELLS).fill(Infinity)

/* ---- ESRI-ASCII-Kachel einlesen ---------------------------------------
   Von Hand über die Bytes statt split(/\s+/): ein Seepaket bringt ~0,8 GB
   Text mit, und davon sind über 90 % NoData. Ganze Zeilen und einzelne
   Werte lassen sich überspringen, ohne sie je in eine Zahl zu verwandeln —
   das ist der Unterschied zwischen Sekunden und Minuten. */
function liesAsc(buf, zaehler) {
  let p = 0
  const kopf = {}
  for (let k = 0; k < 6; k++) {
    let e = buf.indexOf(10, p)
    if (e < 0) e = buf.length
    const t = buf.toString('latin1', p, e).trim().split(/\s+/)
    kopf[t[0].toLowerCase()] = Number(t[1])
    p = e + 1
  }
  const ncols = kopf.ncols, nrows = kopf.nrows, cs = kopf.cellsize
  const nodata = kopf.nodata_value ?? -9999
  /* xllcenter/yllcenter statt xllcorner kommt vor — beide bedienen. */
  const xll = kopf.xllcorner ?? (kopf.xllcenter - cs / 2)
  const yll = kopf.yllcorner ?? (kopf.yllcenter - cs / 2)
  if (!(ncols > 0 && nrows > 0 && cs > 0)) return null

  const schritt = Math.max(1, Math.round(PROBE_M / cs))
  let row = 0
  while (p < buf.length && row < nrows) {
    if (row % schritt) {                       /* ganze Zeile überspringen */
      const e = buf.indexOf(10, p)
      if (e < 0) break
      p = e + 1; row++; continue
    }
    const N = yll + (nrows - 1 - row + 0.5) * cs
    let col = 0
    while (p < buf.length) {
      const ch = buf[p]
      if (ch === 10) { p++; break }
      if (ch === 32 || ch === 13 || ch === 9) { p++; continue }
      if (col % schritt) {                     /* Wert überspringen */
        while (p < buf.length && buf[p] > 32) p++
        col++; continue
      }
      let neg = false
      if (buf[p] === 45) { neg = true; p++ }
      let v = 0
      while (p < buf.length && buf[p] >= 48 && buf[p] <= 57) { v = v * 10 + (buf[p] - 48); p++ }
      if (buf[p] === 46) {
        p++; let f = 0.1
        while (p < buf.length && buf[p] >= 48 && buf[p] <= 57) { v += (buf[p] - 48) * f; f *= 0.1; p++ }
      }
      /* Exponent MUSS gelesen werden: ein Teil der Pakete schreibt NoData
         nicht als -9999, sondern als -3.4028230607370965e+38 (die kleinste
         float32-Zahl) — Brienzersee und Rotsee tun das. Wer den Exponenten
         überspringt, liest daraus -3.4 und hält es für einen Seegrund drei
         Meter unter dem Meer. */
      if (buf[p] === 101 || buf[p] === 69) {
        p++
        let esign = 1
        if (buf[p] === 43) p++
        else if (buf[p] === 45) { esign = -1; p++ }
        let ex = 0
        while (p < buf.length && buf[p] >= 48 && buf[p] <= 57) { ex = ex * 10 + (buf[p] - 48); p++ }
        v *= Math.pow(10, esign * ex)
      }
      while (p < buf.length && buf[p] > 32) p++   /* Rest des Tokens */
      if (neg) v = -v
      /* Zweiter Riegel, unabhängig vom Kopf: der NoData-Wert ist je Kachel
         verschieden (die beiden Pakete oben unterscheiden sich schon in der
         15. Stelle), ein Vergleich auf Gleichheit ist also brüchig. Kein
         Schweizer Seegrund liegt unter −500 m oder über 5000 m. */
      if (v > -500 && v < 5000 && v !== nodata) {
        const E = xll + (col + 0.5) * cs
        const [lon, lat] = lv95zuWgs(E, N)
        const c = Math.round((lon - M.lon0) / M.dLon)
        const r = Math.round((M.lat0 - lat) / M.dLat)
        if (c >= 0 && r >= 0 && c < M.cols && r < M.rows) {
          const i = r * M.cols + c
          summe[i] += v; zahl[i]++
          if (v < tiefste[i]) tiefste[i] = v
          zaehler.punkte++
          if (v < zaehler.min) zaehler.min = v
          if (v > zaehler.max) zaehler.max = v
        } else zaehler.daneben++
      }
      col++
    }
    row++
  }
  return kopf
}

/* ---- Fehlende Pakete holen ---- */
async function laden(see) {
  const url = manifest.muster.replace(/\{see\}/g, see)
  const ziel = join(DATA, `swissbathy3d_${see}_2056_5728.esriasciigrid.zip`)
  process.stdout.write(`  lade ${see} … `)
  const res = await fetch(url)
  if (!res.ok) { console.log(`FEHLER HTTP ${res.status}`); return null }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(ziel, buf)
  console.log(`${(buf.length / 1e6).toFixed(0)} MB`)
  return ziel
}

/* ---- Lauf ---- */
const seen = manifest.seen.filter((s) => !nurSeen || nurSeen.includes(s.see))
const bericht = []
let gesamtPunkte = 0

for (const s of seen) {
  const kandidaten = [
    join(DATA, `swissbathy3d_${s.see}_2056_5728.esriasciigrid.zip`),
    join(DATA, `swissbathy3d_${s.see}_2056_5728.xyz.zip`),
  ]
  let datei = kandidaten.find((f) => existsSync(f) && /esriasciigrid/.test(f))
  if (!datei && argv.laden) datei = await laden(s.see)
  if (!datei) { console.log(`  ${s.see.padEnd(22)} fehlt (mit --laden holen)`); continue }

  const buf = readFileSync(datei)
  const ein = zipEintraege(buf).filter((e) => /\.asc$/i.test(e.name))
  const z = { punkte: 0, daneben: 0, min: Infinity, max: -Infinity }
  for (const e of ein) liesAsc(zipLies(buf, e), z)
  gesamtPunkte += z.punkte
  /* Prüfstein: der tiefste gemessene Grund gegen Spiegel − bekannte Tiefe.
     Der HÖCHSTE Wert taugt nicht dafür — die Pakete führen am Rand auch
     Ufer und Flussstrecken oberhalb des Spiegels mit. */
  const soll = s.spiegelM != null && s.tiefeM != null ? s.spiegelM - s.tiefeM : null
  const abw = soll != null ? z.min - soll : null
  bericht.push({ see: s.see, name: s.name, kacheln: ein.length, punkte: z.punkte,
                 min: z.min, max: z.max, soll })
  console.log(`  ${s.name.padEnd(22)} ${String(ein.length).padStart(4)} Kacheln · ` +
    `${(z.punkte / 1e6).toFixed(2)} Mio. Proben · tiefster Grund ${z.min.toFixed(0)} m` +
    (soll != null ? ` (erwartet ${soll}, ${abw >= 0 ? '+' : ''}${abw.toFixed(0)} m)` : '') +
    (z.daneben ? ` · ${z.daneben} ausserhalb` : ''))
}

if (!gesamtPunkte) {
  console.error('Keine einzige Tiefenprobe eingelesen — nichts geschrieben.')
  process.exit(1)
}

const NODATA = -9999
const data = new Int16Array(CELLS).fill(NODATA)
let belegt = 0, gmin = Infinity, gmax = -Infinity
for (let i = 0; i < CELLS; i++) {
  if (!zahl[i]) continue
  const v = Math.round(summe[i] / zahl[i])
  data[i] = v; belegt++
  if (v < gmin) gmin = v
  if (v > gmax) gmax = v
}
console.log(`Zielraster belegt: ${belegt} Zellen (${(100 * belegt / CELLS).toFixed(2)} %) · ` +
  `Grund ${gmin}–${gmax} m · ${(gesamtPunkte / 1e6).toFixed(1)} Mio. Proben`)

const out = {
  kind: 'tiefe',
  provenance: {
    quelle: manifest.quelle,
    beschreibung: `Seegrund aus swissBATHY3D (ESRI-ASCII, CH1903+/LV95, LN02), auf das Raster der ` +
      `Höhenquelle abgetastet (${M.cols}×${M.rows}, gleiche Nordwestecke und Rasterweite). ` +
      `Mittelwert je Zielzelle, Stichprobenabstand ~${PROBE_M} m. Eingelesen: ` +
      bericht.map((b) => b.name).join(', ') + '.',
    lizenz: manifest.lizenz,
    rohdaten: bericht.map((b) => `pipeline/data/swissbathy3d_${b.see}_2056_5728.esriasciigrid.zip`).join(', ')
      + ' (nicht im Repo)',
    stand: new Date().toISOString().slice(0, 10),
  },
  meta: {
    region: M.region, lon0: M.lon0, lat0: M.lat0,
    dLon: M.dLon, dLat: M.dLat, cols: M.cols, rows: M.rows,
    unit: 'm', nodata: NODATA,
    encoding: 'base64 Int16 little-endian, row-major ab Nordwest',
    seen: bericht.map((b) => ({ see: b.see, name: b.name, grundMin: Math.round(b.min), spiegelNah: Math.round(b.max) })),
  },
  data: Buffer.from(data.buffer).toString('base64'),
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(statSync(OUT).size / 1024).toFixed(0)} KB)`)
