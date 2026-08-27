#!/usr/bin/env node
/*
 * normalize-dtm.mjs — Stufe 1 der Karten-Pipeline (Fetch/Normalisieren).
 *
 * Liest die GeoTIFF-DTMs (Sonny, UTM) aus pipeline/data/, tastet ein
 * reguläres Lon/Lat-Raster über einer Region ab (bilinear) und schreibt
 * eine kompakte normalisierte Höhenquelle nach pipeline/sources/
 * (kind "hoehen": Int16-Meter, base64, row-major ab Nordwest).
 *
 * MEHRERE LÄNDER statt nur der Schweiz. Das Register hoehen.manifest.json
 * sagt seit jeher: "die REIHENFOLGE ist der Vorrang: die erste Quelle, die
 * für ein Feld einen Wert liefert, gewinnt" — eingelöst wird das erst hier.
 * Vorher las diese Stufe fest nur die Schweiz, und alles jenseits der
 * Landesgrenze (Vorarlberg, das deutsche Bodenseeufer, der Hochrhein, dessen
 * 2-km-Zellen teils auf deutschem Boden liegen) war NoData. Ein Abflussmodell
 * darauf kann den Rhein nicht aus der Schweiz herausführen: die Landesgrenze
 * wird zur Wasserscheide. Jede Quelle bringt ihre eigene UTM-Zone mit
 * (CH/DE/IT 32N, AT 33N, FR/NL 31N) — gelesen aus den GeoKeys, nicht geraten.
 *
 * Aufruf:  node pipeline/fetch/normalize-dtm.mjs
 *          node pipeline/fetch/normalize-dtm.mjs --lonW=5.9 --lonE=10.6 --latS=45.8 --latN=48.15
 *            [--name=rheineinzug] [--spacing=200] [--fuer=rhein] [--quellen=sonny-ch-50,sonny-at]
 *
 * Die Region ist bewusst NUR hier konfigurierbar: bake.mjs leitet die Region
 * der DTM-Ebene aus der geschriebenen Höhenquelle ab, statt dieselbe Box ein
 * zweites Mal zu führen. Der Dateiname ist deshalb regionsneutral — ein neuer
 * Lauf ERSETZT die Höhenquelle, statt eine zweite danebenzulegen (sonst
 * würde bake beide Regionen zusammenfassen).
 */
import { fromFile } from 'geotiff'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))

/* ---- Konfiguration: Standard = Rheineinzug CH + Vorarlberg + Südbaden ---- */
const DEFAULTS = { name: 'rheineinzug', lonW: 5.9, lonE: 10.6, latS: 45.8, latN: 48.15, spacing: 200 }
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
const OUT = join(ROOT, '..', 'sources', 'sonny-dtm-50.grid.json')
console.log(`Region ${REGION.name}: ${REGION.lonW}–${REGION.lonE}°O, ${REGION.latS}–${REGION.latN}°N · ${SPACING_M} m Raster`)

/* ---- WGS84 → UTM Zone N (Snyder-Reihen, cm-genau).
   Die Zone ist Parameter, weil Österreich in 33N liegt und die Schweiz in
   32N: mit fest verdrahteter 32 landet jede österreichische Probe hunderte
   Kilometer daneben — und damit stillschweigend im NoData. ---- */
function utm(lon, lat, zone) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996
  const lon0 = ((6 * zone - 183) * Math.PI) / 180
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

/* ---- Quellen aus dem Register, in der dort festgelegten Vorrangfolge ---- */
const manifest = JSON.parse(readFileSync(join(ROOT, '..', 'sources', 'hoehen.manifest.json'), 'utf8'))
const nurIds = argv.quellen ? argv.quellen.split(',').map((x) => x.trim()).filter(Boolean) : null
const FUER = argv.fuer || 'rhein'
const kandidaten = manifest.quellen.filter((q) => nurIds
  ? nurIds.includes(q.id)
  : String(q.fuer || '').split(',').map((x) => x.trim()).includes(FUER))
if (!kandidaten.length) { console.error(`Keine Hoehenquelle fuer "${FUER}" im Register.`); process.exit(1) }

const pad = 500
const quellen = []
for (const q of kandidaten) {
  const pfad = join(ROOT, '..', 'data', q.datei)
  let tiff, img
  try { tiff = await fromFile(pfad); img = await tiff.getImage() }
  catch { console.warn(`  ${q.id.padEnd(12)} uebersprungen — ${q.datei} liegt nicht in pipeline/data/`); continue }
  const gk = img.getGeoKeys?.() ?? img.geoKeys ?? {}
  const epsg = Number(gk.ProjectedCSTypeGeoKey)
  if (!(epsg >= 32601 && epsg <= 32660)) {
    console.warn(`  ${q.id.padEnd(12)} uebersprungen — unerwartetes Koordinatensystem (EPSG ${epsg})`)
    continue
  }
  const zone = epsg - 32600
  const [ox, oy] = img.getOrigin()
  const [rx, ry] = img.getResolution()
  const W = img.getWidth(), H = img.getHeight()
  const ecken = [
    utm(REGION.lonW, REGION.latS, zone), utm(REGION.lonE, REGION.latS, zone),
    utm(REGION.lonW, REGION.latN, zone), utm(REGION.lonE, REGION.latN, zone),
  ]
  const px0 = Math.max(0, Math.floor((Math.min(...ecken.map((c) => c[0])) - pad - ox) / rx))
  const px1 = Math.min(W, Math.ceil((Math.max(...ecken.map((c) => c[0])) + pad - ox) / rx))
  const py0 = Math.max(0, Math.floor((Math.max(...ecken.map((c) => c[1])) + pad - oy) / ry))
  const py1 = Math.min(H, Math.ceil((Math.min(...ecken.map((c) => c[1])) - pad - oy) / ry))
  if (px1 <= px0 || py1 <= py0) { console.log(`  ${q.id.padEnd(12)} liegt neben der Region — uebersprungen`); continue }
  const rasters = await img.readRasters({ window: [px0, py0, px1, py1] })
  quellen.push({
    q, zone, ox, oy, rx, ry, px0, py0,
    winW: px1 - px0, winH: py1 - py0,
    band: rasters[0], nodata: Number(img.getGDALNoData()), treffer: 0,
  })
  console.log(`  ${q.id.padEnd(12)} UTM ${zone}N · Fenster ${px1 - px0}x${py1 - py0} px`)
}
if (!quellen.length) {
  console.error('Keine einzige Hoehenquelle deckt diese Region ab.')
  console.error('Die bisherige Hoehenquelle bleibt unveraendert.')
  process.exit(1)
}

/* Bilinear im Pixelraum des jeweiligen Fensters; die erste Quelle mit
   gueltigem Wert gewinnt (Vorrang = Reihenfolge im Register). */
function sample(lon, lat) {
  for (const s of quellen) {
    const [ux, uy] = utm(lon, lat, s.zone)
    const fx = (ux - s.ox) / s.rx - s.px0
    const fy = (uy - s.oy) / s.ry - s.py0
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    if (x0 < 0 || y0 < 0 || x0 + 1 >= s.winW || y0 + 1 >= s.winH) continue
    const b = s.band, w = s.winW
    const v00 = b[y0 * w + x0], v10 = b[y0 * w + x0 + 1]
    const v01 = b[(y0 + 1) * w + x0], v11 = b[(y0 + 1) * w + x0 + 1]
    if ([v00, v10, v01, v11].some((v) => v === s.nodata || !Number.isFinite(v))) continue
    const tx = fx - x0, ty = fy - y0
    s.treffer++
    return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
  }
  return null
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
if (nd / (n + nd) > 0.9) console.warn(`Warnung: ${((100 * nd) / (n + nd)).toFixed(0)} % NoData — Region liegt grösstenteils neben den geladenen Laendern.`)
for (const s of quellen) console.log(`  Anteil ${s.q.id.padEnd(12)} ${((100 * s.treffer) / (n + nd)).toFixed(1)} %`)

/* ---- normalisierte Quelle schreiben ---- */
const out = {
  kind: 'hoehen',
  provenance: {
    quelle: `DTM 50 m by Sonny — ${quellen.map((s) => s.q.id).join(' + ')}`,
    beschreibung: `LiDAR-DTMs (50 m), bilinear auf ein ${SPACING_M}-m-Lon/Lat-Raster ueber der Region ${REGION.name} abgetastet und in der Vorrangfolge des Registers zusammengelegt (${quellen.map((s) => `${s.q.id} ${((100 * s.treffer) / (n + nd)).toFixed(0)} %`).join(', ')}). Jede Quelle in ihrer eigenen UTM-Zone gelesen.`,
    lizenz: 'CC BY 4.0 — Sonny, sonny.4lima.de',
    rohdaten: quellen.map((s) => `pipeline/data/${s.q.datei}`).join(', ') + ' (nicht im Repo)',
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
