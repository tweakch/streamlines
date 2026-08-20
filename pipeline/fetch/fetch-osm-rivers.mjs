#!/usr/bin/env node
/*
 * fetch-osm-rivers.mjs — Stufe 1 der Karten-Pipeline (Fetch/Normalisieren).
 *
 * Holt Flussläufe als waterway-Relationen von OpenStreetMap (Overpass API),
 * verkettet die Mitglieds-Wege zu einer Linie (greedy, Seen-Lücken erlaubt),
 * vereinfacht sie (Douglas-Peucker) und schreibt eine normalisierte Quelle
 * nach pipeline/sources/osm-fluesse.geo.json (kind "nebenlauf").
 *
 * Rohantworten werden unter pipeline/data/ gecacht — löschen erzwingt Neuabruf.
 * Lizenz der Daten: ODbL 1.0, © OpenStreetMap contributors.
 *
 * Aufruf:  node pipeline/fetch/fetch-osm-rivers.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data')
const OUT = join(ROOT, '..', 'sources', 'osm-fluesse.geo.json')

/* Flüsse mit bekannter Mündung (zur Orientierung Quelle→Mündung). */
const RIVERS = [
  { name: 'Aare', mouth: [8.224, 47.606], note: 'mündet bei Koblenz AG in den Rhein' },
  { name: 'Reuss', mouth: [8.240, 47.483], note: 'mündet im Wasserschloss in die Aare' },
  { name: 'Limmat', mouth: [8.230, 47.501], note: 'mündet im Wasserschloss in die Aare' },
  { name: 'Seez', mouth: [9.305, 47.122], note: 'mündet bei Walenstadt in den Walensee', bbox: '46.95,9.15,47.15,9.45' },
  { name: 'Linth', mouth: [8.930, 47.220], note: 'seit der Linthkorrektion (1807–1816) durch Escher- und Linthkanal in Walensee und Zürichsee geführt' },
  { name: 'Sihl', mouth: [8.534, 47.383], note: 'fliesst durch den Sihlsee und mündet beim Platzspitz in Zürich in die Limmat' },
]
const BBOX = '45.8,5.5,48.0,10.6' // Schweiz (Overpass: süd,west,nord,ost)
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const UA = 'stromlinien-map-pipeline/1.0 (Prototyp-Werkstatt; einmaliger Abruf, gecacht)'
const SIMPLIFY_M = 150 // Douglas-Peucker-Toleranz; feinste Hexebene ist 400 m

/* ---------- Overpass ---------- */
async function overpass(query) {
  let lastErr
  for (let round = 0; round < 3; round++) {
    if (round) { console.warn(`  Runde ${round + 1} in 15 s …`); await new Promise((r) => setTimeout(r, 15000)) }
    for (const url of ENDPOINTS) {
    try {
      const ctl = new AbortController()
      const t = setTimeout(() => ctl.abort(), 200000)
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': UA,
          'Accept': 'application/json',
        },
        signal: ctl.signal,
      })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status} von ${url}`)
      return await res.json()
    } catch (e) { lastErr = e; console.warn(`  ${url}: ${e.message} — nächster Spiegel`) }
    }
  }
  throw lastErr
}
async function fetchCached(cacheName, query) {
  const cachePath = join(DATA, cacheName)
  if (existsSync(cachePath)) {
    console.log(`  aus Cache: ${cacheName}`)
    return JSON.parse(readFileSync(cachePath, 'utf8'))
  }
  console.log(`  frage Overpass … (${cacheName})`)
  const json = await overpass(query)
  writeFileSync(cachePath, JSON.stringify(json))
  return json
}
async function fetchRiver(name, bbox = BBOX) {
  const rel = await fetchCached(`osm-${name.toLowerCase()}.json`,
    `[out:json][timeout:180];relation["waterway"="river"]["name"="${name}"](${bbox});out geom qt;`)
  if ((rel.elements ?? []).some((e) => e.type === 'relation')) return rel
  /* Kleine Flüsse haben oft keine Relation — Fallback auf einzelne Wege. */
  return fetchCached(`osm-${name.toLowerCase()}-ways.json`,
    `[out:json][timeout:180];way["waterway"]["name"="${name}"](${bbox});out geom qt;`)
}

/* ---------- Geometrie ---------- */
const dist2 = (a, b) => {
  const kx = 111.32 * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180), ky = 110.6
  const dx = (a[0] - b[0]) * kx, dy = (a[1] - b[1]) * ky
  return dx * dx + dy * dy // km²
}

/* Wege greedy zu einer Kette verbinden (Quelle → Mündung).
   Lücken (Seen, Kanalwechsel) bis gapKm werden übersprungen. */
function stitch(ways, mouth, gapKm = 20) {
  if (!ways.length) throw new Error('keine Wege gefunden')

  /* Start: der Weg-Endpunkt, der am weitesten von der Mündung liegt. */
  let start = 0, rev = false, best = -1
  ways.forEach((w, i) => {
    const d0 = dist2(w[0], mouth), d1 = dist2(w[w.length - 1], mouth)
    if (d0 > best) { best = d0; start = i; rev = false }
    if (d1 > best) { best = d1; start = i; rev = true }
  })
  const used = new Set([start])
  let chain = rev ? [...ways[start]].reverse() : [...ways[start]]
  let gaps = 0
  while (used.size < ways.length) {
    const end = chain[chain.length - 1]
    let bi = -1, bRev = false, bd = Infinity
    ways.forEach((w, i) => {
      if (used.has(i)) return
      const d0 = dist2(w[0], end), d1 = dist2(w[w.length - 1], end)
      if (d0 < bd) { bd = d0; bi = i; bRev = false }
      if (d1 < bd) { bd = d1; bi = i; bRev = true }
    })
    if (bi < 0 || bd > gapKm * gapKm) break // Rest liegt zu weit weg (Nebenäste)
    if (bd > 0.5 * 0.5) gaps++
    used.add(bi)
    const w = bRev ? [...ways[bi]].reverse() : ways[bi]
    chain = chain.concat(w)
  }
  /* Orientierung sichern: Ende gehört zur Mündung. */
  if (dist2(chain[0], mouth) < dist2(chain[chain.length - 1], mouth)) chain.reverse()
  return { chain, waysUsed: used.size, waysTotal: ways.length, gaps }
}

/* Douglas-Peucker im km-Massstab. */
function simplify(pts, tolKm) {
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    if (b - a < 2) continue
    const kx = 111.32 * Math.cos(pts[a][1] * Math.PI / 180), ky = 110.6
    const ax = pts[a][0] * kx, ay = pts[a][1] * ky
    const bx = pts[b][0] * kx, by = pts[b][1] * ky
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1
    let mi = -1, md = -1
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] * kx - ax, py = pts[i][1] * ky - ay
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2))
      const ex = px - t * dx, ey = py - t * dy
      const d = ex * ex + ey * ey
      if (d > md) { md = d; mi = i }
    }
    if (md > tolKm * tolKm) { keep[mi] = 1; stack.push([a, mi], [mi, b]) }
  }
  return pts.filter((_, i) => keep[i])
}

/* ---------- Lauf ---------- */
const features = []
let first = true
for (const r of RIVERS) {
  if (!first) await new Promise((res) => setTimeout(res, 3000)) // Overpass nicht bedrängen
  first = false
  console.log(`${r.name}:`)
  const json = await fetchRiver(r.name, r.bbox)
  const rels = (json.elements ?? []).filter((e) => e.type === 'relation')
  let ways, osmRef
  if (rels.length) {
    const rel = rels.reduce((a, b) => (b.members.length > a.members.length ? b : a))
    osmRef = 'relation/' + rel.id
    ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === '' || m.role === 'main_stream') && m.geometry)
      .map((m) => m.geometry.map((g) => [g.lon, g.lat]))
  } else {
    const wayEls = (json.elements ?? []).filter((e) => e.type === 'way' && e.geometry)
    if (!wayEls.length) throw new Error(`${r.name}: weder Relation noch Wege gefunden`)
    osmRef = wayEls.length + ' ways'
    ways = wayEls.map((w) => w.geometry.map((g) => [g.lon, g.lat]))
  }
  const { chain, waysUsed, waysTotal, gaps } = stitch(ways, r.mouth)
  const simp = simplify(chain, SIMPLIFY_M / 1000)
  console.log(`  ${osmRef}, ${waysUsed}/${waysTotal} Wege verkettet ` +
    `(${gaps} Lücken überbrückt), ${chain.length} → ${simp.length} Punkte`)
  features.push({
    type: 'Feature',
    properties: { kind: 'nebenlauf', name: r.name, art: r.art ?? 'Zufluss', osm: osmRef, note: r.note },
    geometry: { type: 'LineString', coordinates: simp.map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)]) },
  })
}

const out = {
  type: 'FeatureCollection',
  provenance: {
    quelle: 'OpenStreetMap via Overpass API',
    beschreibung: `waterway-Relationen (${RIVERS.map((r) => r.name).join(', ')}), Mitglieds-Wege verkettet, Douglas-Peucker ${SIMPLIFY_M} m. Rohantworten gecacht unter pipeline/data/osm-*.json.`,
    lizenz: 'ODbL 1.0 — © OpenStreetMap contributors. Share-Alike gilt für abgeleitete Datenbanken (betrifft das gebackene Tileset).',
    stand: new Date().toISOString().slice(0, 10),
  },
  features,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
