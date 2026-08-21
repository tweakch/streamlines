#!/usr/bin/env node
/*
 * normalize-dtm.mjs — Stufe 1 der Karten-Pipeline (Fetch/Normalisieren).
 *
 * Liest ein GeoTIFF-DTM (Sonny, UTM) aus pipeline/data/, tastet ein
 * reguläres Lon/Lat-Raster über einer Region ab (bilinear) und schreibt
 * eine kompakte normalisierte Höhenquelle nach pipeline/sources/
 * (kind "hoehen": Int16-Meter, base64, row-major ab Nordwest).
 *
 * Aufruf:  node pipeline/fetch/normalize-dtm.mjs
 *          node pipeline/fetch/normalize-dtm.mjs --lonW=9.25 --lonE=9.9 --latS=46.75 --latN=47.55
 *            [--name=alpenrhein] [--spacing=200]
 *
 * Die Region ist bewusst NUR hier konfigurierbar: bake.mjs leitet die Region
 * der DTM-Ebene aus der geschriebenen Höhenquelle ab, statt dieselbe Box ein
 * zweites Mal zu führen. Der Dateiname ist deshalb regionsneutral — ein neuer
 * Lauf ERSETZT die Höhenquelle, statt eine zweite danebenzulegen (sonst
 * würde bake beide Regionen zusammenfassen).
 */
import { fromFile } from 'geotiff'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))

/* ---- Konfiguration: Standard = Region Alpenrhein, 200-m-Stichprobenraster ---- */
const DEFAULTS = { name: 'alpenrhein', lonW: 9.25, lonE: 9.90, latS: 46.75, latN: 47.55, spacing: 200 }
const argv = Object.fromEntries(
  process.argv.slice(2)
    .map((a) => a.match(/^--([a-zA-Z]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const num = (key) => {
  if (argv[key] == null) return DEFAULTS[key]
  const v = Number(argv[key])
  if (!Number.isFinite(v)) { console.error(`--${key} ist keine Zahl: ${argv[key]}`); process.exit(1) }
  return v
}
const REGION = {
  name: (argv.name || DEFAULTS.name).replace(/[^a-zA-Z0-9_-]/g, '') || DEFAULTS.name,
  lonW: num('lonW'), lonE: num('lonE'), latS: num('latS'), latN: num('latN'),
}
const SPACING_M = num('spacing')
if (!(REGION.lonW < REGION.lonE) || !(REGION.latS < REGION.latN)) {
  console.error('Ungültige Region: lonW < lonE und latS < latN erforderlich.')
  process.exit(1)
}
if (!(SPACING_M >= 20 && SPACING_M <= 5000)) {
  console.error(`Ungültige Rasterweite: ${SPACING_M} m (erlaubt 20–5000).`)
  process.exit(1)
}
const NODATA_OUT = -9999
const SRC_TIF = join(ROOT, '..', 'data', 'dtm-switzerland-50m-v2-sonny.tif')
const OUT = join(ROOT, '..', 'sources', 'sonny-dtm-ch50.grid.json')
console.log(`Region ${REGION.name}: ${REGION.lonW}–${REGION.lonE}°O, ${REGION.latS}–${REGION.latN}°N · ${SPACING_M} m Raster`)

/* ---- WGS84 → UTM Zone 32N (Snyder-Reihen, cm-genau) ---- */
function utm32(lon, lat) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, lon0 = (9 * Math.PI) / 180
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2)
  const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180
  const N = a / Math.sqrt(1 - e2 * Math.sin(p) ** 2)
  const T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = (l - lon0) * Math.cos(p)
  const M = a * ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256) * p
    - ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * p)
    + ((15 * e2 * e2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * p)
    - ((35 * e2 ** 3) / 3072) * Math.sin(6 * p))
  const x = 500000 + k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120)
  const y = k0 * (M + N * Math.tan(p) * ((A * A) / 2 + ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24
    + ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720))
  return [x, y]
}

/* ---- GeoTIFF öffnen, Fenster über der Region lesen ---- */
const tiff = await fromFile(SRC_TIF)
const img = await tiff.getImage()
const [ox, oy] = [img.getOrigin()[0], img.getOrigin()[1]]
const [rx, ry] = [img.getResolution()[0], img.getResolution()[1]] // ry ist negativ
const W = img.getWidth(), H = img.getHeight()
const NODATA_IN = Number(img.getGDALNoData())

const corners = [
  utm32(REGION.lonW, REGION.latS), utm32(REGION.lonE, REGION.latS),
  utm32(REGION.lonW, REGION.latN), utm32(REGION.lonE, REGION.latN),
]
const pad = 500
const uxMin = Math.min(...corners.map((c) => c[0])) - pad
const uxMax = Math.max(...corners.map((c) => c[0])) + pad
const uyMin = Math.min(...corners.map((c) => c[1])) - pad
const uyMax = Math.max(...corners.map((c) => c[1])) + pad
const px0 = Math.max(0, Math.floor((uxMin - ox) / rx))
const px1 = Math.min(W, Math.ceil((uxMax - ox) / rx))
const py0 = Math.max(0, Math.floor((uyMax - oy) / ry)) // ry<0: Nord = kleine Pixelzeile
const py1 = Math.min(H, Math.ceil((uyMin - oy) / ry))
console.log(`Fenster: Pixel [${px0},${py0}]–[${px1},${py1}] (${px1 - px0}×${py1 - py0})`)
/* Region liegt komplett neben dem DTM: dann ist das Fenster leer/negativ und
   geotiff würde mit "Invalid subsets" abstürzen — lieber sauber melden. */
if (px1 <= px0 || py1 <= py0) {
  console.error('Region liegt ausserhalb des Höhenmodells — das DTM deckt nur die Schweiz ab.')
  console.error('Die bisherige Höhenquelle bleibt unverändert.')
  process.exit(1)
}
const rasters = await img.readRasters({ window: [px0, py0, px1, py1] })
const band = rasters[0]
const winW = px1 - px0

/* Bilinear im Pixelraum des Fensters; NoData-Pixel machen die Probe ungültig. */
function sample(lon, lat) {
  const [ux, uy] = utm32(lon, lat)
  const fx = (ux - ox) / rx - px0
  const fy = (uy - oy) / ry - py0
  const x0 = Math.floor(fx), y0 = Math.floor(fy)
  if (x0 < 0 || y0 < 0 || x0 + 1 >= winW || y0 + 1 >= py1 - py0) return null
  const v00 = band[y0 * winW + x0], v10 = band[y0 * winW + x0 + 1]
  const v01 = band[(y0 + 1) * winW + x0], v11 = band[(y0 + 1) * winW + x0 + 1]
  if ([v00, v10, v01, v11].some((v) => v === NODATA_IN || !Number.isFinite(v))) return null
  const tx = fx - x0, ty = fy - y0
  return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
}

/* ---- Reguläres Lon/Lat-Raster abtasten ---- */
const latMid = (REGION.latS + REGION.latN) / 2
const dLat = SPACING_M / 110600
const dLon = SPACING_M / (111320 * Math.cos((latMid * Math.PI) / 180))
const cols = Math.round((REGION.lonE - REGION.lonW) / dLon) + 1
const rows = Math.round((REGION.latN - REGION.latS) / dLat) + 1
/* Schutz vor versehentlich riesigen Gebieten (die Ausgabedatei wächst mit
   cols*rows*2 Byte und landet als Inline-JS im Prototyp). */
const MAX_CELLS = 4_000_000
if (cols * rows > MAX_CELLS) {
  console.error(`Region zu gross: ${cols}×${rows} = ${cols * rows} Rasterpunkte (max ${MAX_CELLS}).`)
  console.error('Kleineres Gebiet ziehen oder --spacing erhöhen.')
  process.exit(1)
}
const data = new Int16Array(cols * rows)
let n = 0, nd = 0, min = Infinity, max = -Infinity
for (let r = 0; r < rows; r++) {
  const lat = REGION.latN - r * dLat
  for (let c = 0; c < cols; c++) {
    const v = sample(REGION.lonW + c * dLon, lat)
    if (v == null) { data[r * cols + c] = NODATA_OUT; nd++ }
    else {
      const m = Math.round(v)
      data[r * cols + c] = m; n++
      if (m < min) min = m
      if (m > max) max = m
    }
  }
}
console.log(`Raster: ${cols}×${rows} (${SPACING_M} m) · ${n} Werte, ${nd} NoData (${((100 * nd) / (n + nd)).toFixed(1)} %) · Höhe ${min}–${max} m`)
/* Ganz ausserhalb der Schweiz gezogen: das DTM deckt nur CH ab. Lieber hart
   abbrechen, als eine leere Höhenquelle zu schreiben — sonst verlöre der
   nächste Bake das Relief der bisherigen Region stillschweigend. */
if (n === 0) {
  console.error('Keine Höhenwerte in dieser Region — das DTM deckt nur die Schweiz ab.')
  console.error('Die bisherige Höhenquelle bleibt unverändert.')
  process.exit(1)
}
if (nd / (n + nd) > 0.9) console.warn(`Warnung: ${((100 * nd) / (n + nd)).toFixed(0)} % NoData — Region liegt grösstenteils ausserhalb der Schweiz.`)

/* ---- normalisierte Quelle schreiben ---- */
const out = {
  kind: 'hoehen',
  provenance: {
    quelle: 'DTM Switzerland 50m v2 by Sonny',
    beschreibung: `LiDAR-DTM der Schweiz (50 m, UTM 32N), bilinear auf ein ${SPACING_M}-m-Lon/Lat-Raster über der Region ${REGION.name} abgetastet. NoData ausserhalb der Schweizer Landesgrenze (Vorarlberg/Liechtenstein).`,
    lizenz: 'CC BY 4.0 — Sonny, sonny.4lima.de',
    rohdaten: 'pipeline/data/dtm-switzerland-50m-v2-sonny.tif (nicht im Repo; bit.ly/dtm-switzerland-50m-v2)',
    stand: new Date().toISOString().slice(0, 10),
  },
  meta: {
    region: REGION.name,
    lon0: REGION.lonW, lat0: REGION.latN, // Nordwest-Ecke, row-major nach Süden/Osten
    dLon, dLat, cols, rows,
    unit: 'm', nodata: NODATA_OUT,
    encoding: 'base64 Int16 little-endian, row-major ab Nordwest',
  },
  data: Buffer.from(data.buffer).toString('base64'),
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
