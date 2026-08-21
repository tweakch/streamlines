#!/usr/bin/env node
/*
 * hoehen-quellen.mjs — mehrere DTMs als ein Höhenstapel.
 *
 * Das Problem, das dieses Modul löst: das Sonny-DTM der Schweiz endet exakt an
 * der Landesgrenze. Für das Eiszeit-Raster sind damit 6 220 von 28 576 Feldern
 * (21.8 %) geschätzt — und darunter liegt das östliche Nährgebiet des
 * Alpenrheingletschers selbst (Rätikon, Silvretta, Verwall). Die kalibrierte
 * Maximalausdehnung steht auf erfundenem Gelände. Also: mehr Quellen.
 *
 * Zwei Dinge macht dieses Modul deshalb anders als der alte Einzelleser in
 * bake-eiszeit.mjs:
 *
 * 1. VORRANG statt einer Quelle. Das Register (sources/hoehen.manifest.json)
 *    ist eine geordnete Liste; die erste Quelle, die für einen Punkt einen Wert
 *    liefert, gewinnt. LiDAR (Sonny) vor Radar (Copernicus). Welche Quelle ein
 *    Feld getragen hat, wird mitgeschrieben — „geschätzt“ ist danach nicht mehr
 *    die einzige Auskunft über die Herkunft einer Höhe.
 *
 * 2. BLOCKWEISE lesen und beim Lesen ausdünnen. Der alte Leser holte das
 *    Rasterfenster in EINEM Stück (~40 MB beim CH-DTM mit 50 m). Bei einer
 *    10-m-Quelle für Österreich wären das über 1 GB — für eine Abtastung auf
 *    200 m, also 400-fach überzählig. Hier wird die passende Übersichtsebene
 *    des GeoTIFF gewählt, mit ganzzahligem Schritt ausgedünnt und in Blöcken
 *    von wenigen Millionen Pixeln gelesen. Der Speicher hängt damit an der
 *    Zielauflösung, nicht an der Quelle.
 *
 * Bei `--maxAufl=50` (Vorgabe) liest die CH-Quelle mit Schritt 1, also ihr
 * natives 50-m-Raster: die Höhen sind Wert für Wert dieselben wie bisher, und
 * die Kalibrierung des Eismodells verschiebt sich durch den Umbau nicht.
 *
 * Aufruf als Werkzeug:
 *   node pipeline/fetch/hoehen-quellen.mjs --pruefen
 *   node pipeline/fetch/hoehen-quellen.mjs --pruefen --lonW=7.95 --lonE=10.35 --latS=46.4 --latN=47.85
 *
 * Als Modul:
 *   const stapel = await stapelOeffnen(REGION, { maxAuflM: 50 })
 *   const t = stapel.hoehe(lon, lat)      // → { h, q } oder null
 *   stapel.bericht(); stapel.provenance()
 */
import { fromFile } from 'geotiff'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(ROOT, '..', 'data')
const MANIFEST = join(ROOT, '..', 'sources', 'hoehen.manifest.json')

/* ---------- Projektionen ----------
   Sonnys Länder-DTMs liegen meist geographisch (EPSG:4326), das CH-DTM in
   UTM 32N. Beide Fälle werden aus den GeoKeys der Datei erkannt; alles andere
   bricht mit einer Meldung ab, statt stillschweigend falsch zu rechnen. */
export function utm(lon, lat, zone) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996
  const lon0 = ((zone * 6 - 183) * Math.PI) / 180
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2)
  const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180
  const N = a / Math.sqrt(1 - e2 * Math.sin(p) ** 2)
  const T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = (l - lon0) * Math.cos(p)
  const M = a * ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256) * p
    - ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * p)
    + ((15 * e2 * e2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * p)
    - ((35 * e2 ** 3) / 3072) * Math.sin(6 * p))
  const x = 500000 + k0 * N * (A + ((1 - T + C) * A ** 3) / 6
    + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120)
  const y = k0 * (M + N * Math.tan(p) * ((A * A) / 2 + ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24
    + ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720))
  return [x, y]
}
export const utm32 = (lon, lat) => utm(lon, lat, 32)

/* GeoKeys → Projektor lon/lat → Dateikoordinaten, plus Metergrösse eines
   Rasterschritts (für die Wahl der Übersichtsebene). */
function projektorAus(geoKeys, midLat) {
  const proj = geoKeys?.ProjectedCSTypeGeoKey
  const geog = geoKeys?.GeographicTypeGeoKey
  if (proj) {
    /* 326xx = WGS84/UTM, 258xx = ETRS89/UTM — für unsere Zwecke identisch
       (Abweichung deutlich unter einem Meter). */
    const zone = proj % 100
    const familie = Math.floor(proj / 100)
    if ((familie === 326 || familie === 258) && zone >= 1 && zone <= 60)
      return { art: `UTM ${zone}N`, fn: (lon, lat) => utm(lon, lat, zone), meterProEinheit: [1, 1] }
    throw new Error(`unbekanntes projiziertes CRS (EPSG:${proj})`)
  }
  if (!geog || geog === 4326 || geog === 4258) {
    const mLon = 111320 * Math.cos((midLat * Math.PI) / 180)
    return { art: 'geographisch (EPSG:4326)', fn: (lon, lat) => [lon, lat], meterProEinheit: [mLon, 111320] }
  }
  throw new Error(`unbekanntes geographisches CRS (EPSG:${geog})`)
}

/* ---------- Eine Quelle öffnen und ihr Fenster einlesen ---------- */
async function quelleOeffnen(eintrag, region, maxAuflM, log) {
  const pfad = join(DATA_DIR, eintrag.datei)
  if (!existsSync(pfad)) return { eintrag, fehlt: true }
  const tiff = await fromFile(pfad)
  const anzahl = await tiff.getImageCount()
  const midLat = (region.latS + region.latN) / 2

  /* Übersichtsebene wählen: die grobste, die noch mindestens so fein ist wie
     maxAuflM. Fehlen Übersichten, bleibt es bei Ebene 0 und der Schritt unten
     dünnt aus. */
  let bild = null, ebene = 0, pro = null, auflM = 0
  for (let k = 0; k < anzahl; k++) {
    const img = await tiff.getImage(k)
    const p = projektorAus(img.getGeoKeys?.() ?? img.geoKeys, midLat)
    const [rx, ry] = img.getResolution()
    const mx = Math.abs(rx) * p.meterProEinheit[0], my = Math.abs(ry) * p.meterProEinheit[1]
    const m = Math.max(mx, my)
    if (bild === null || (m <= maxAuflM && m > auflM)) { bild = img; ebene = k; pro = p; auflM = m }
  }

  const [ox, oy] = bild.getOrigin()
  const [rx, ry] = bild.getResolution() // ry ist negativ (Nord oben)
  const W = bild.getWidth(), H = bild.getHeight()
  const nodata = Number(bild.getGDALNoData())

  /* Fenster: die vier Ecken der Region in Dateikoordinaten, plus Rand. */
  const ecken = [
    pro.fn(region.lonW, region.latS), pro.fn(region.lonE, region.latS),
    pro.fn(region.lonW, region.latN), pro.fn(region.lonE, region.latN),
  ]
  const einheitProM = [1 / pro.meterProEinheit[0], 1 / pro.meterProEinheit[1]]
  const padX = 1000 * einheitProM[0], padY = 1000 * einheitProM[1]
  const px0 = Math.max(0, Math.floor((Math.min(...ecken.map((c) => c[0])) - padX - ox) / rx))
  const px1 = Math.min(W, Math.ceil((Math.max(...ecken.map((c) => c[0])) + padX - ox) / rx))
  const py0 = Math.max(0, Math.floor((Math.max(...ecken.map((c) => c[1])) + padY - oy) / ry))
  const py1 = Math.min(H, Math.ceil((Math.min(...ecken.map((c) => c[1])) - padY - oy) / ry))
  if (px1 <= px0 || py1 <= py0) return { eintrag, ausserhalb: true, auflM, art: pro.art }

  /* Ausdünnen: ganzzahliger Schritt, damit die Rasterkanten erhalten bleiben. */
  const schritt = Math.max(1, Math.floor(maxAuflM / auflM))
  const gw = Math.ceil((px1 - px0) / schritt), gh = Math.ceil((py1 - py0) / schritt)
  const gitter = new Float32Array(gw * gh)

  /* Blockweise lesen: höchstens ~4 Mio Quellpixel pro readRasters-Aufruf. */
  const winW = px1 - px0
  const zeilenProBlock = Math.max(schritt, Math.floor(4e6 / winW / schritt) * schritt)
  let gelesen = 0
  for (let y = py0; y < py1; y += zeilenProBlock) {
    const y1 = Math.min(py1, y + zeilenProBlock)
    const band = (await bild.readRasters({ window: [px0, y, px1, y1] }))[0]
    const bh = y1 - y
    for (let by = 0; by < bh; by += schritt) {
      const gy = (y - py0 + by) / schritt | 0
      if (gy >= gh) break
      for (let bx = 0, gx = 0; bx < winW && gx < gw; bx += schritt, gx++)
        gitter[gy * gw + gx] = band[by * winW + bx]
    }
    gelesen += winW * bh
  }
  log?.(`  ${eintrag.id}: Ebene ${ebene}/${anzahl}, ${auflM.toFixed(1)} m, Schritt ${schritt}`
    + ` → Gitter ${gw}×${gh} (${(gw * gh * 4 / 1048576).toFixed(1)} MB, gelesen ${(gelesen / 1e6).toFixed(1)} Mio Px)`)

  const sx = rx * schritt, sy = ry * schritt
  const gx0 = ox + px0 * rx, gy0 = oy + py0 * ry
  return {
    eintrag, gitter, gw, gh, sx, sy, gx0, gy0, nodata, auflM, art: pro.art, ebene,
    treffer: 0,
    probe(lon, lat) {
      const [ux, uy] = pro.fn(lon, lat)
      const fx = (ux - gx0) / sx, fy = (uy - gy0) / sy
      const x0 = Math.floor(fx), y0 = Math.floor(fy)
      if (x0 < 0 || y0 < 0 || x0 + 1 >= gw || y0 + 1 >= gh) return null
      const v00 = gitter[y0 * gw + x0], v10 = gitter[y0 * gw + x0 + 1]
      const v01 = gitter[(y0 + 1) * gw + x0], v11 = gitter[(y0 + 1) * gw + x0 + 1]
      if (v00 === nodata || v10 === nodata || v01 === nodata || v11 === nodata) return null
      if (!(Number.isFinite(v00) && Number.isFinite(v10) && Number.isFinite(v01) && Number.isFinite(v11))) return null
      const tx = fx - x0, ty = fy - y0
      return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
    },
  }
}

/* ---------- Der Stapel ---------- */
export function ladeManifest() {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'))
}

export async function stapelOeffnen(region, opt = {}) {
  const { maxAuflM = 50, fuer = null, log = console.log } = opt
  const manifest = ladeManifest()
  const gewuenscht = manifest.quellen.filter((q) => !fuer || (q.fuer ?? []).includes(fuer))
  log?.(`Höhenquellen (${fuer ?? 'alle'}, Vorrang in dieser Reihenfolge):`)
  const offen = [], fehlend = [], draussen = []
  for (const e of gewuenscht) {
    const q = await quelleOeffnen(e, region, maxAuflM, log)
    if (q.fehlt) { fehlend.push(e); log?.(`  ${e.id}: FEHLT (${e.datei})`); continue }
    if (q.ausserhalb) { draussen.push(e); log?.(`  ${e.id}: überlappt die Region nicht`); continue }
    offen.push(q)
  }
  if (!offen.length) throw new Error('keine einzige Höhenquelle lesbar — pipeline/data/ prüfen')

  /* Vorrang-ID je Quelle: 1..n in Manifestreihenfolge, 0 = keine Quelle. */
  offen.forEach((q, k) => { q.nr = k + 1 })
  return {
    quellen: offen, fehlend, draussen, maxAuflM,
    hoehe(lon, lat) {
      for (const q of offen) {
        const h = q.probe(lon, lat)
        if (h != null) { q.treffer++; return { h, q: q.nr } }
      }
      return null
    },
    legende: () => offen.map((q) => ({ nr: q.nr, id: q.eintrag.id, land: q.eintrag.land,
      auflM: +q.auflM.toFixed(1), crs: q.art })),
    bericht() {
      const ges = offen.reduce((s, q) => s + q.treffer, 0) || 1
      for (const q of offen)
        log?.(`  ${q.eintrag.id}: ${q.treffer.toLocaleString('de-CH')} Stichproben`
          + ` (${(100 * q.treffer / ges).toFixed(1)} %)`)
      if (fehlend.length) log?.(`  fehlende Quellen: ${fehlend.map((e) => e.id).join(', ')}`)
    },
    provenance: () => offen.map((q) => ({
      file: q.eintrag.datei,
      quelle: `${q.eintrag.id} (${q.eintrag.land})`,
      beschreibung: `${q.art}, gelesen mit ${q.auflM.toFixed(1)} m aus Ebene ${q.ebene}.`
        + (q.eintrag.note ? ` ${q.eintrag.note}` : ''),
      lizenz: q.eintrag.lizenz,
      rohdaten: `pipeline/data/${q.eintrag.datei} (nicht im Repo; ${q.eintrag.herkunft})`,
      stand: q.eintrag.stand,
    })),
  }
}

/* ---------- Werkzeugmodus: --pruefen ---------- */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = Object.fromEntries(process.argv.slice(2)
    .map((a) => a.match(/^--([a-zA-Z]+)(?:=(.*))?$/)).filter(Boolean)
    .map((m) => [m[1], m[2] ?? true]))
  if (!argv.pruefen) {
    console.log('Aufruf: node pipeline/fetch/hoehen-quellen.mjs --pruefen [--lonW= --lonE= --latS= --latN= --maxAufl= --fuer=eiszeit]')
    process.exit(0)
  }
  const region = {
    lonW: +(argv.lonW ?? 7.95), lonE: +(argv.lonE ?? 10.0),
    latS: +(argv.latS ?? 46.4), latN: +(argv.latN ?? 47.85),
  }
  const manifest = ladeManifest()
  console.log(`Region ${region.lonW}–${region.lonE} °O, ${region.latS}–${region.latN} °N`)
  console.log(`Register: ${manifest.quellen.length} Quellen, ${manifest.quellen.filter((q) => existsSync(join(DATA_DIR, q.datei))).length} davon vorhanden\n`)

  for (const e of manifest.quellen) {
    const pfad = join(DATA_DIR, e.datei)
    const da = existsSync(pfad)
    const mb = da ? (statSync(pfad).size / 1048576).toFixed(0) + ' MB' : '—'
    console.log(`${da ? '✓' : '·'} ${e.id.padEnd(18)} ${e.land.padEnd(3)} ${String(e.aufloesungM).padStart(3)} m  ${mb.padStart(8)}`
      + `  für: ${(e.fuer ?? []).join('+') || '(aus)'}`)
    if (!da) console.log(`    fehlt: ${e.datei} — ${e.herkunft}`)
  }
  const dtms = readdirSync(DATA_DIR).filter((f) => /\.(tif|tiff)$/i.test(f))
  console.log(`\nGeoTIFFs in pipeline/data/: ${dtms.length ? dtms.join(', ') : '(keine)'}`)

  const stapel = await stapelOeffnen(region, { maxAuflM: +(argv.maxAufl ?? 50), fuer: argv.fuer || null })
  /* Deckungsprobe auf einem 2-km-Gitter — sagt vor jedem Bake, was die
     vorhandenen Quellen abdecken und wo Schätzung bliebe. */
  const kmx = 72.7, kmy = 110.6 // dieselbe lokale Plattkarte wie bake.mjs
  const nx = Math.round((region.lonE - region.lonW) * kmx / 2)
  const ny = Math.round((region.latN - region.latS) * kmy / 2)
  let n = 0, ok = 0
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const lon = region.lonW + (region.lonE - region.lonW) * i / nx
    const lat = region.latS + (region.latN - region.latS) * j / ny
    n++
    if (stapel.hoehe(lon, lat)) ok++
  }
  console.log(`\nDeckung auf einem 2-km-Gitter (${n} Punkte):`)
  stapel.bericht()
  console.log(`  gedeckt ${ok} von ${n} (${(100 * ok / n).toFixed(1)} %) — ohne Quelle: ${n - ok} (${(100 * (n - ok) / n).toFixed(1)} %)`)
}
