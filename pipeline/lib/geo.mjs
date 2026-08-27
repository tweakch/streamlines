/*
 * geo.mjs — die geteilte Karten-Geometrie der Pipeline.
 *
 * Projektion, Hex-Mathematik und Rasterhilfen liegen HIER und nur hier.
 * Vorher standen sie doppelt in bake.mjs und wären mit jedem neuen
 * Overlay ein drittes Mal abgetippt worden — und die Nachbarschaftstabellen
 * müssen mit app/src/stromlinien/grid.ts und prototype/kit/sot-hex.js
 * identisch bleiben (pointy-top, odd-r offset, ungerade Reihen nach rechts).
 *
 * Keine Abhängigkeiten. Wird von bake.mjs und bake-overlays.mjs benutzt.
 */

export const SQRT3 = Math.sqrt(3)

/* Projektion: lokale Plattkarte über der Bounding Box des Rheins, km-Raum. */
export const CFG = {
  lon0: 3.8,
  lat1: 52.2,
  lonSpan: 6.2,
  latSpan: 5.9,
  kmx: 72.7, // km pro Grad Länge bei ~49.25°N
  kmy: 110.6, // km pro Grad Breite
}

/* Die Ausgabe-Ebenen. `dtm: true` heisst: Region wird aus den Höhenquellen
   abgeleitet, Kacheln gibt es nur innerhalb. */
export const LEVELS = [
  { id: 0, hexKm: 10 }, // Rheinkarte (Kampagne)
  { id: 1, hexKm: 2 }, // Gebietskarte — die Spielauflösung
  { id: 2, hexKm: 0.4, dtm: true }, // Basisraster
]

export const TILE = 32

export const XMAX = CFG.lonSpan * CFG.kmx
export const YMAX = CFG.latSpan * CFG.kmy

/* Kantenlänge des Hex aus der Breite (Flat-to-flat) — pointy-top. */
export const sizeOf = (hexKm) => hexKm / SQRT3

export const kmOf = ([lon, lat]) => [
  (lon - CFG.lon0) * CFG.kmx,
  (CFG.lat1 - lat) * CFG.kmy,
]
export const lonlatOf = ([x, y]) => [
  x / CFG.kmx + CFG.lon0,
  CFG.lat1 - y / CFG.kmy,
]

export function haversine(a, b) {
  const R = 6371
  const d = Math.PI / 180
  const h =
    Math.sin(((b[1] - a[1]) * d) / 2) ** 2 +
    Math.cos(a[1] * d) *
      Math.cos(b[1] * d) *
      Math.sin(((b[0] - a[0]) * d) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/* ---------- odd-r offset ↔ axial/cube ---------- */
export const axialOf = (c, r) => c - ((r - (r & 1)) / 2)
export const offsetOf = (q, r) => [q + ((r - (r & 1)) / 2), r]

const DIRS_EVEN = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
const DIRS_ODD = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
/** Nachbarn als [dr, dc] — identisch mit grid.ts und sot-hex.js. */
export const dirsOf = (r) => (r % 2 ? DIRS_ODD : DIRS_EVEN)

export function cubeRound(x, y, z) {
  let rx = Math.round(x)
  let ry = Math.round(y)
  let rz = Math.round(z)
  const dx = Math.abs(rx - x)
  const dy = Math.abs(ry - y)
  const dz = Math.abs(rz - z)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy > dz) ry = -rx - rz
  else rz = -rx - ry
  return [rx, ry, rz]
}

export function cellAtKm(x, y, s) {
  const q = ((SQRT3 / 3) * x - y / 3) / s
  const r = ((2 / 3) * y) / s
  const [cx, , cz] = cubeRound(q, -q - r, r)
  return offsetOf(cx, cz)
}

export function centerKm(c, r, s) {
  const q = axialOf(c, r)
  return [s * SQRT3 * (q + r / 2), s * 1.5 * r]
}

export function hexLine(a, b) {
  const A = [axialOf(...a), 0, a[1]]
  A[1] = -A[0] - A[2]
  const B = [axialOf(...b), 0, b[1]]
  B[1] = -B[0] - B[2]
  const N = Math.max(
    1,
    Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])),
  )
  const out = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, , z] = cubeRound(
      A[0] + (B[0] - A[0]) * t,
      A[1] + (B[1] - A[1]) * t,
      A[2] + (B[2] - A[2]) * t,
    )
    out.push(offsetOf(x, z))
  }
  return out
}

/** Punkt-in-Polygon (Ray casting) über einem km-Ring. */
export function pip(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

export const gridDims = (s) => [
  Math.ceil(XMAX / (s * SQRT3)) + 1,
  Math.ceil(YMAX / (s * 1.5)) + 1,
]

/** Zellfenster einer lon/lat-Region auf einer Ebene. */
export const regionCellsOf = (region, s, cols, rows) => {
  const [x0, y0] = kmOf([region.lonW, region.latN])
  const [x1, y1] = kmOf([region.lonE, region.latS])
  return {
    km: [x0, y0, x1, y1],
    c0: Math.max(0, Math.floor(x0 / (s * SQRT3)) - 1),
    c1: Math.min(cols - 1, Math.ceil(x1 / (s * SQRT3)) + 1),
    r0: Math.max(0, Math.floor(y0 / (s * 1.5)) - 1),
    r1: Math.min(rows - 1, Math.ceil(y1 / (s * 1.5)) + 1),
  }
}

/* ---------- Rasterquellen (*.grid.json) ---------- */

/**
 * Bilineare Höhenprobe. Gibt null zurück, wenn keine Quelle die Stelle deckt
 * oder eine der vier Stützstellen NoData ist — NIE einen geschätzten Wert.
 * Wer schätzen will, tut das sichtbar und schreibt es ins Protokoll.
 */
export function sampleBilinear(grids, lon, lat) {
  for (const g of grids) {
    const m = g.meta
    const fx = (lon - m.lon0) / m.dLon
    const fy = (m.lat0 - lat) / m.dLat
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    if (x0 < 0 || y0 < 0 || x0 + 1 >= m.cols || y0 + 1 >= m.rows) continue
    const d = g.data
    const i = y0 * m.cols + x0
    const v00 = d[i]
    const v10 = d[i + 1]
    const v01 = d[i + m.cols]
    const v11 = d[i + m.cols + 1]
    if (
      v00 === m.nodata ||
      v10 === m.nodata ||
      v01 === m.nodata ||
      v11 === m.nodata
    )
      continue
    const tx = fx - x0
    const ty = fy - y0
    return (
      (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
    )
  }
  return null
}

/** Nächster Nachbar — für Quellen mit harten Rändern (Seegrund). */
export function sampleNearest(grids, lon, lat) {
  for (const g of grids) {
    const m = g.meta
    const c = Math.round((lon - m.lon0) / m.dLon)
    const r = Math.round((m.lat0 - lat) / m.dLat)
    if (c < 0 || r < 0 || c >= m.cols || r >= m.rows) continue
    const v = g.data[r * m.cols + c]
    if (v === m.nodata) continue
    return v
  }
  return null
}
