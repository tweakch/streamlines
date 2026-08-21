#!/usr/bin/env node
/*
 * bake.mjs — Stufe 2 der Karten-Pipeline (v2).
 *
 * Liest alle normalisierten Quellen (pipeline/sources/, WGS84) und baut ein
 * gekacheltes Hex-Tileset. Neu in v2: das Flächen-Terrain wird EINMAL auf der
 * feinsten Ebene gerastert (Basisraster: Polygone + DTM-Klassifikation) und
 * die gröberen Ebenen werden daraus ABGELEITET (Zellzentren-Zuordnung:
 * Mehrheit fürs Terrain, Mittel für die Höhe). Lineare Features (Hauptlauf,
 * Nebenläufe) werden weiterhin pro Ebene gerastert — dünne Linien überleben
 * keine Mehrheitsentscheide.
 *
 * Hexes pointy-top, odd-r — identische Nachbarschaft wie app/src/stromlinien/grid.ts.
 * Aufruf:  node pipeline/bake.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const SQRT3 = Math.sqrt(3)

/* Projektion: lokale Plattkarte über der Bounding Box des Rheins. */
const CFG = {
  lon0: 3.8, lat1: 52.2, lonSpan: 6.2, latSpan: 5.9,
  kmx: 72.7,   // km pro Grad Länge bei ~49.25°N
  kmy: 110.6,  // km pro Grad Breite
}
const LEVELS = [
  { id: 0, hexKm: 10 }, // Rheinkarte (Kampagne)
  { id: 1, hexKm: 2 },  // Gebietskarte (entspricht der Alpenrhein-Welt in world.ts)
  /* Ebene 2 = Basisraster. Kacheln werden nur innerhalb der Region geliefert
     (dort liegen Höhendaten); das Basisraster selbst ist global. Die Region
     wird NICHT hier festgelegt, sondern unten aus den vorhandenen
     Höhenquellen abgeleitet — sonst müsste dieselbe Bounding Box in
     fetch/normalize-dtm.mjs und hier doppelt gepflegt werden. */
  { id: 2, hexKm: 0.4, dtm: true },
]
const FINE = LEVELS[LEVELS.length - 1]
const TILE = 32
const TERR = { flach: 0, ufer: 1, berg: 2, fluss: 3, see: 4, meer: 5, zufluss: 6, hang: 7 }
/* Hang/Berg-Klassifikation aus dem DTM (erster Wurf, per Screenshot getunt). */
const CLS = { hangSlope: 0.12, bergSlope: 0.40, bergRelief: 650 }
const SECIDS = ['', 'alpen', 'bodensee', 'hoch', 'ober', 'mittel', 'nieder', 'delta']

/* ---------- Quellen einlesen ---------- */
const srcDir = join(ROOT, 'sources')
const feats = []
const provenance = [] // + bbox/bboxKm je Datei, fürs Quellenverzeichnis im Viewer (v3)
const grids = [] // normalisierte Höhenquellen (kind "hoehen")

/* Bbox (lon/lat) über beliebig verschachtelte GeoJSON-Koordinaten (Point/LineString/Polygon/...). */
function bboxOfFeatures(features) {
  let lonW = Infinity, lonE = -Infinity, latS = Infinity, latN = -Infinity
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords
      if (lon < lonW) lonW = lon; if (lon > lonE) lonE = lon
      if (lat < latS) latS = lat; if (lat > latN) latN = lat
      return
    }
    for (const c of coords) walk(c)
  }
  for (const f of features) walk(f.geometry.coordinates)
  return [lonW, latS, lonE, latN]
}
/* dieselbe km-Projektion wie kmOf() weiter unten, hier lokal auf lonW/latN + lonE/latS. */
const bboxKmOf = ([lonW, latS, lonE, latN]) => {
  const [x0, y0] = [(lonW - CFG.lon0) * CFG.kmx, (CFG.lat1 - latN) * CFG.kmy]
  const [x1, y1] = [(lonE - CFG.lon0) * CFG.kmx, (CFG.lat1 - latS) * CFG.kmy]
  return [x0, y0, x1, y1]
}

for (const f of readdirSync(srcDir)) {
  if (f.endsWith('.grid.json')) {
    const g = JSON.parse(readFileSync(join(srcDir, f), 'utf8'))
    if (g.kind !== 'hoehen') continue
    const m = g.meta
    const bbox = [m.lon0, m.lat0 - m.dLat * (m.rows - 1), m.lon0 + m.dLon * (m.cols - 1), m.lat0]
    provenance.push({ file: f, kind: 'hoehen', ...(g.provenance ?? {}), bbox, bboxKm: bboxKmOf(bbox) })
    const buf = Buffer.from(g.data, 'base64')
    grids.push({ meta: g.meta, data: new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2) })
    continue
  }
  if (!f.endsWith('.geo.json')) continue
  const gj = JSON.parse(readFileSync(join(srcDir, f), 'utf8'))
  const bbox = bboxOfFeatures(gj.features)
  const kinds = [...new Set(gj.features.map((x) => x.properties.kind))].sort()
  provenance.push({
    file: f, kind: 'geo', count: gj.features.length, kinds,
    ...(gj.provenance ?? {}), bbox, bboxKm: bboxKmOf(bbox),
  })
  feats.push(...gj.features)
}
/* Ebene mit dtm-Flag: Region = Hülle über alle vorhandenen Höhenquellen.
   Ohne Höhenquelle bleibt die Ebene ungegated (global) — dann greift der
   Polygon-Fallback wie auf den gröberen Ebenen. */
{
  const dtmLevel = LEVELS.find((L) => L.dtm)
  if (dtmLevel && grids.length) {
    let lonW = Infinity, lonE = -Infinity, latS = Infinity, latN = -Infinity
    for (const g of grids) {
      const m = g.meta
      lonW = Math.min(lonW, m.lon0); lonE = Math.max(lonE, m.lon0 + m.dLon * (m.cols - 1))
      latN = Math.max(latN, m.lat0); latS = Math.min(latS, m.lat0 - m.dLat * (m.rows - 1))
    }
    dtmLevel.region = { lonW, lonE, latS, latN }
    console.log(`Höhenregion aus ${grids.length} Quelle(n): ` +
      `${lonW.toFixed(2)}–${lonE.toFixed(2)}°O, ${latS.toFixed(2)}–${latN.toFixed(2)}°N`)
  }
}

const byKind = (k) => feats.filter((f) => f.properties.kind === k)
const hauptlauf = byKind('hauptlauf').sort((a, b) => a.properties.order - b.properties.order)
const nebenlaeufe = byKind('nebenlauf')
const seen = byKind('see')
const meere = byKind('meer')
const bergland = byKind('bergland')
const landmarken = byKind('landmarke')

/* ---------- Höhen: bilineares Sampling + lokaler Talboden ---------- */
function elevAt(lon, lat) {
  for (const g of grids) {
    const m = g.meta
    const fx = (lon - m.lon0) / m.dLon, fy = (m.lat0 - lat) / m.dLat
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    if (x0 < 0 || y0 < 0 || x0 + 1 >= m.cols || y0 + 1 >= m.rows) continue
    const d = g.data, i = y0 * m.cols + x0
    const v00 = d[i], v10 = d[i + 1], v01 = d[i + m.cols], v11 = d[i + m.cols + 1]
    if (v00 === m.nodata || v10 === m.nodata || v01 === m.nodata || v11 === m.nodata) continue
    const tx = fx - x0, ty = fy - y0
    return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
  }
  return null
}
/* Talboden: Blockminimum (~1.6 km), dann Min über 3×3 Blöcke (~5 km Umfeld). */
const FLOOR_B = 8
for (const g of grids) {
  const m = g.meta
  const bc = Math.ceil(m.cols / FLOOR_B), br = Math.ceil(m.rows / FLOOR_B)
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
function floorAt(lon, lat) {
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

/* ---------- Geometrie ---------- */
const kmOf = ([lon, lat]) => [(lon - CFG.lon0) * CFG.kmx, (CFG.lat1 - lat) * CFG.kmy]
const XMAX = CFG.lonSpan * CFG.kmx
const YMAX = CFG.latSpan * CFG.kmy

function haversine(a, b) {
  const R = 6371, d = Math.PI / 180
  const h = Math.sin(((b[1] - a[1]) * d) / 2) ** 2 +
    Math.cos(a[1] * d) * Math.cos(b[1] * d) * Math.sin(((b[0] - a[0]) * d) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/* odd-r offset ↔ axial/cube (wie grid.ts) */
const axialOf = (c, r) => c - ((r - (r & 1)) / 2)
const offsetOf = (q, r) => [q + ((r - (r & 1)) / 2), r]
const DIRS_EVEN = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
const DIRS_ODD = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
const dirsOf = (r) => (r % 2 ? DIRS_ODD : DIRS_EVEN)

function cubeRound(x, y, z) {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z)
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy > dz) ry = -rx - rz
  else rz = -rx - ry
  return [rx, ry, rz]
}
function cellAtKm(x, y, s) {
  const q = ((SQRT3 / 3) * x - y / 3) / s
  const r = ((2 / 3) * y) / s
  const [cx, , cz] = cubeRound(q, -q - r, r)
  return offsetOf(cx, cz)
}
function centerKm(c, r, s) {
  const q = axialOf(c, r)
  return [s * SQRT3 * (q + r / 2), s * 1.5 * r]
}
function hexLine(a, b) {
  const A = [axialOf(...a), 0, a[1]]; A[1] = -A[0] - A[2]
  const B = [axialOf(...b), 0, b[1]]; B[1] = -B[0] - B[2]
  const N = Math.max(1, Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])))
  const out = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, , z] = cubeRound(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
    out.push(offsetOf(x, z))
  }
  return out
}
function pip(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const gridDims = (s) => [Math.ceil(XMAX / (s * SQRT3)) + 1, Math.ceil(YMAX / (s * 1.5)) + 1]
const regionCellsOf = (region, s, cols, rows) => {
  const [x0, y0] = kmOf([region.lonW, region.latN])
  const [x1, y1] = kmOf([region.lonE, region.latS])
  return {
    km: [x0, y0, x1, y1],
    c0: Math.max(0, Math.floor(x0 / (s * SQRT3)) - 1), c1: Math.min(cols - 1, Math.ceil(x1 / (s * SQRT3)) + 1),
    r0: Math.max(0, Math.floor(y0 / (s * 1.5)) - 1), r1: Math.min(rows - 1, Math.ceil(y1 / (s * 1.5)) + 1),
  }
}

/* ---------- Hauptlauf: km entlang der realen Geometrie ---------- */
const mainVerts = []
{
  let km = 0
  for (const f of hauptlauf) {
    const secId = SECIDS.indexOf(f.properties.sec)
    for (const v of f.geometry.coordinates) {
      const last = mainVerts[mainVerts.length - 1]
      if (last && last.lonlat[0] === v[0] && last.lonlat[1] === v[1]) { last.secId = last.secId || secId; continue }
      if (last) km += haversine(last.lonlat, v)
      mainVerts.push({ lonlat: v, km, secId })
    }
  }
}
const TOTAL_KM = Math.round(mainVerts[mainVerts.length - 1].km)

/* ============================================================
   Phase A: Basisraster — Flächen-Terrain + Höhen EINMAL auf der
   feinsten Ebene (Polygone, dann DTM-Klassifikation wo Daten liegen).
   Keine Flüsse, kein Ufer — das passiert pro Ausgabe-Ebene.
   ============================================================ */
function buildBase() {
  const t0 = Date.now()
  const s = FINE.hexKm / SQRT3
  const [cols, rows] = gridDims(s)
  const terr = new Uint8Array(cols * rows)
  const elev = new Uint8Array(cols * rows)
  const idx = (c, r) => r * cols + c

  const fillPoly = (ring, t) => {
    const kmRing = ring.map(kmOf)
    const xs = kmRing.map((p) => p[0]), ys = kmRing.map((p) => p[1])
    const c0 = Math.max(0, Math.floor(Math.min(...xs) / (s * SQRT3)) - 1)
    const c1 = Math.min(cols - 1, Math.ceil(Math.max(...xs) / (s * SQRT3)) + 1)
    const r0 = Math.max(0, Math.floor(Math.min(...ys) / (s * 1.5)) - 1)
    const r1 = Math.min(rows - 1, Math.ceil(Math.max(...ys) / (s * 1.5)) + 1)
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const [x, y] = centerKm(c, r, s)
        if (pip(x, y, kmRing)) terr[idx(c, r)] = t
      }
  }
  for (const f of bergland) fillPoly(f.geometry.coordinates[0], TERR.berg)
  for (const f of seen) fillPoly(f.geometry.coordinates[0], TERR.see)
  for (const f of meere) fillPoly(f.geometry.coordinates[0], TERR.meer)

  /* DTM: Steigung + Relief ersetzen die Polygone, wo Höhendaten vorliegen. */
  if (FINE.dtm && grids.length && FINE.region) {
    const rc = regionCellsOf(FINE.region, s, cols, rows)
    const dKm = FINE.hexKm / 2, dM = dKm * 1000
    for (let r = rc.r0; r <= rc.r1; r++)
      for (let c = rc.c0; c <= rc.c1; c++) {
        const [x, y] = centerKm(c, r, s)
        const lon = CFG.lon0 + x / CFG.kmx, lat = CFG.lat1 - y / CFG.kmy
        const e0 = elevAt(lon, lat)
        if (e0 == null) continue
        elev[idx(c, r)] = Math.max(1, Math.min(255, Math.round(e0 / 25)))
        const t = terr[idx(c, r)]
        if (t === TERR.see || t === TERR.meer) continue
        const eE = elevAt(lon + dKm / CFG.kmx, lat), eW = elevAt(lon - dKm / CFG.kmx, lat)
        const eN = elevAt(lon, lat + dKm / CFG.kmy), eS = elevAt(lon, lat - dKm / CFG.kmy)
        if (eE == null || eW == null || eN == null || eS == null) continue
        const slope = Math.hypot((eE - eW) / (2 * dM), (eS - eN) / (2 * dM))
        const fl = floorAt(lon, lat)
        const relief = fl == null ? 0 : e0 - fl
        terr[idx(c, r)] =
          slope >= CLS.bergSlope || relief >= CLS.bergRelief ? TERR.berg :
          slope >= CLS.hangSlope ? TERR.hang : TERR.flach
      }
  }
  console.log(`Basisraster (${FINE.hexKm} km/Hex): ${cols}×${rows} Zellen in ${Date.now() - t0} ms`)
  return { s, cols, rows, terr, elev }
}
const BASE = buildBase()

/* ============================================================
   Phase B: Ausgabe-Ebenen — Terrain aus der Basis (kopiert oder
   aggregiert), dann Linien rastern, Täler freischneiden, Ufer,
   Kacheln schneiden.
   ============================================================ */
function bakeLevel(L) {
  const t0 = Date.now()
  const s = L.hexKm / SQRT3
  const [cols, rows] = gridDims(s)
  const terr = new Uint8Array(cols * rows)
  const sec = new Uint8Array(cols * rows)
  const elev = new Uint8Array(cols * rows)
  const idx = (c, r) => r * cols + c
  const inB = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows

  if (L === FINE) {
    terr.set(BASE.terr)
    elev.set(BASE.elev)
  } else {
    /* Aggregation: jede Basiszelle stimmt in ihrer Grobzelle ab.
       Mehrheit fürs Terrain, Mittel für die Höhe. */
    const K = 8
    const counts = new Uint32Array(cols * rows * K)
    const eSum = new Float64Array(cols * rows)
    const eN = new Uint32Array(cols * rows)
    for (let r = 0; r < BASE.rows; r++)
      for (let c = 0; c < BASE.cols; c++) {
        const [x, y] = centerKm(c, r, BASE.s)
        const [cc, cr] = cellAtKm(x, y, s)
        if (cc < 0 || cr < 0 || cc >= cols || cr >= rows) continue
        const i = cr * cols + cc
        counts[i * K + BASE.terr[r * BASE.cols + c]]++
        const e = BASE.elev[r * BASE.cols + c]
        if (e) { eSum[i] += e; eN[i]++ }
      }
    const CAND = [TERR.flach, TERR.hang, TERR.berg, TERR.see, TERR.meer]
    for (let i = 0; i < cols * rows; i++) {
      let best = TERR.flach, bn = 0, tot = 0
      for (const k of CAND) {
        const n = counts[i * K + k]
        tot += n
        if (n > bn) { bn = n; best = k }
      }
      /* Generalisierung: schmale Seen sollen beim Vergröbern nicht im
         Mehrheitsentscheid ertrinken — See gewinnt schon ab 25 % Anteil. */
      if (tot && counts[i * K + TERR.see] >= tot * 0.25) best = TERR.see
      terr[i] = best
      if (eN[i]) elev[i] = Math.max(1, Math.min(255, Math.round(eSum[i] / eN[i])))
    }
  }

  const region = L.region ? regionCellsOf(L.region, s, cols, rows) : null

  /* Polylinie → Zellfolge mit interpoliertem km. */
  const rasterVerts = (verts) => {
    const cells = []
    for (let i = 0; i < verts.length - 1; i++) {
      const a = cellAtKm(...kmOf(verts[i].lonlat), s)
      const b = cellAtKm(...kmOf(verts[i + 1].lonlat), s)
      const line = hexLine(a, b)
      for (let j = 0; j < line.length; j++) {
        const [c, r] = line[j]
        const km = verts[i].km + ((verts[i + 1].km - verts[i].km) * j) / Math.max(1, line.length - 1)
        const last = cells[cells.length - 1]
        if (last && last.c === c && last.r === r) continue
        cells.push({ c, r, km, secId: verts[i + 1].secId })
      }
    }
    return cells
  }
  const mainCells = rasterVerts(mainVerts)
  const branchSets = nebenlaeufe.map((f) => {
    const verts = f.geometry.coordinates.map((v) => ({ lonlat: v, km: 0, secId: 0 }))
    return { name: f.properties.name, art: f.properties.art, note: f.properties.note ?? null, cells: rasterVerts(verts) }
  })

  /* Täler freischneiden: Wasserzelle + Nachbarn verlieren Berg und Hang. */
  const hi = (t) => t === TERR.berg || t === TERR.hang
  const carve = (c, r) => {
    if (inB(c, r) && hi(terr[idx(c, r)])) terr[idx(c, r)] = TERR.flach
    for (const [dr, dc] of dirsOf(r))
      if (inB(c + dc, r + dr) && hi(terr[idx(c + dc, r + dr)])) terr[idx(c + dc, r + dr)] = TERR.flach
  }
  for (const p of mainCells) carve(p.c, p.r)
  for (const b of branchSets) for (const p of b.cells) carve(p.c, p.r)

  /* Wasser eintragen: See und Meer bleiben, Hauptlauf schlägt Nebenlauf. */
  for (const b of branchSets)
    for (const p of b.cells) {
      if (!inB(p.c, p.r)) continue
      const t = terr[idx(p.c, p.r)]
      if (t === TERR.see || t === TERR.meer) continue
      terr[idx(p.c, p.r)] = TERR.zufluss
    }
  for (const p of mainCells) {
    if (!inB(p.c, p.r)) continue
    sec[idx(p.c, p.r)] = p.secId
    const t = terr[idx(p.c, p.r)]
    if (t !== TERR.see && t !== TERR.meer) terr[idx(p.c, p.r)] = TERR.fluss
  }

  /* Ufer ableiten: Land neben Fluss oder See. */
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (terr[idx(c, r)] !== TERR.flach) continue
      for (const [dr, dc] of dirsOf(r)) {
        if (!inB(c + dc, r + dr)) continue
        const t = terr[idx(c + dc, r + dr)]
        if (t === TERR.fluss || t === TERR.see || t === TERR.zufluss) { terr[idx(c, r)] = TERR.ufer; break }
      }
    }

  /* In 32×32-Kacheln zerlegen; Ebenen mit Region nur innerhalb. */
  const tiles = {}
  let kept = 0, skipped = 0
  for (let ty = 0; ty * TILE < rows; ty++)
    for (let tx = 0; tx * TILE < cols; tx++) {
      if (region && (tx * TILE > region.c1 || (tx + 1) * TILE <= region.c0 ||
        ty * TILE > region.r1 || (ty + 1) * TILE <= region.r0)) { skipped++; continue }
      const t = new Uint8Array(TILE * TILE), sc = new Uint8Array(TILE * TILE), ev = new Uint8Array(TILE * TILE)
      let any = false, anyElev = false
      for (let j = 0; j < TILE; j++)
        for (let i = 0; i < TILE; i++) {
          const c = tx * TILE + i, r = ty * TILE + j
          if (!inB(c, r)) continue
          const v = terr[idx(c, r)], w = sec[idx(c, r)], e = elev[idx(c, r)]
          if (v || w) any = true
          if (e) anyElev = true
          t[j * TILE + i] = v; sc[j * TILE + i] = w; ev[j * TILE + i] = e
        }
      if (!any && !anyElev) { skipped++; continue }
      kept++
      tiles[tx + ',' + ty] = {
        t: Buffer.from(t).toString('base64'),
        s: Buffer.from(sc).toString('base64'),
        ...(anyElev ? { e: Buffer.from(ev).toString('base64') } : {}),
      }
    }

  console.log(`Ebene ${L.id} (${L.hexKm} km/Hex): ${cols}×${rows} Zellen, ` +
    `${kept} Kacheln behalten, ${skipped} übersprungen, Flusspfad ${mainCells.length} Zellen, ${Date.now() - t0} ms`)

  return {
    id: L.id, hexKm: L.hexKm, cols, rows, tile: TILE, tiles,
    ...(region ? { regionKm: region.km } : {}),
    path: mainCells.map((p) => [p.c, p.r, Math.round(p.km), p.secId]),
    branches: branchSets.map((b) => ({ name: b.name, art: b.art, ...(b.note ? { note: b.note } : {}), cells: b.cells.map((p) => [p.c, p.r]) })),
  }
}

/* ---------- Tileset schreiben ---------- */
const tileset = {
  version: 2,
  generated: new Date().toISOString(),
  cfg: CFG,
  totalKm: TOTAL_KM,
  sections: hauptlauf.map((f) => ({ id: f.properties.sec, name: f.properties.name, txt: f.properties.txt })),
  landmarks: landmarken.map((f) => ({
    lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1],
    name: f.properties.name, note: f.properties.note,
    detail: !!f.properties.detail, dy: f.properties.dy ?? 0,
  })),
  levels: LEVELS.map(bakeLevel),
  provenance,
}

const outPath = join(ROOT, '..', 'prototype', 'drafts', 'rhein-tiles-v4.data.js')
const js = '/* Generiert von pipeline/bake.mjs — NICHT von Hand editieren. Quelle: pipeline/sources/ */\n' +
  'window.RHEIN_TILESET = ' + JSON.stringify(tileset) + ';\n'
writeFileSync(outPath, js)
console.log(`Gesamtlänge des Hauptlaufs: ${TOTAL_KM} km (real ~1230 km)`)
console.log(`geschrieben: ${outPath} (${(js.length / 1024).toFixed(0)} KB)`)
