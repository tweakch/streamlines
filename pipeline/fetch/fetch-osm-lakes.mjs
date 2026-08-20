#!/usr/bin/env node
/*
 * fetch-osm-lakes.mjs — Stufe 1 der Karten-Pipeline (Fetch/Normalisieren).
 *
 * Holt Seen als natural=water von OpenStreetMap (Overpass API), setzt aus
 * den outer-Wegen der Multipolygon-Relation einen Ring zusammen, vereinfacht
 * ihn (Douglas-Peucker) und schreibt kind-"see"-Polygone nach
 * pipeline/sources/osm-seen.geo.json. Rohantworten gecacht unter pipeline/data/.
 * Lizenz der Daten: ODbL 1.0, © OpenStreetMap contributors.
 *
 * Aufruf:  node pipeline/fetch/fetch-osm-lakes.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data')
const OUT = join(ROOT, '..', 'sources', 'osm-seen.geo.json')
const SIMPLIFY_M = 100

const LAKES = [
  { name: 'Walensee', bbox: '47.08,9.05,47.18,9.35',
    note: 'Fjordartiger See zwischen Churfirsten und Kerenzerberg — die Seez mündet, die Linth durchfliesst ihn seit der Linthkorrektion.' },
  { name: 'Zürichsee', bbox: '47.15,8.52,47.40,8.85',
    note: 'Gletscherzungenbecken der Linth — am Ausfluss in Zürich beginnt die Limmat.' },
  { name: 'Obersee', label: 'Zürichsee (Obersee)', bbox: '47.17,8.78,47.30,9.00',
    note: 'Oberer Teil des Zürichsees, vom Seedamm abgetrennt — hier mündet die Linth.' },
  { name: 'Sihlsee', bbox: '47.07,8.74,47.18,8.85',
    note: 'Stausee von 1937, der grösste Speichersee der Schweiz nach Fläche — die Sihl durchfliesst ihn.' },
  /* Relation 1156846 umfasst den ganzen Bodensee inkl. Untersee. */
  { name: 'Bodensee', bbox: '47.42,8.85,47.65,9.80',
    note: 'Der Rhein durchquert den See — Pfahlbauten an den Ufern, Konstanz am Seerhein, bei Stein am Rhein beginnt der Hochrhein.' },
]

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const UA = 'stromlinien-map-pipeline/1.0 (Prototyp-Werkstatt; einmaliger Abruf, gecacht)'

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
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, 'Accept': 'application/json' },
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
  if (existsSync(cachePath)) { console.log(`  aus Cache: ${cacheName}`); return JSON.parse(readFileSync(cachePath, 'utf8')) }
  console.log(`  frage Overpass … (${cacheName})`)
  const json = await overpass(query)
  writeFileSync(cachePath, JSON.stringify(json))
  return json
}

const dist2 = (a, b) => {
  const kx = 111.32 * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180), ky = 110.6
  const dx = (a[0] - b[0]) * kx, dy = (a[1] - b[1]) * ky
  return dx * dx + dy * dy
}
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

/* outer-Wege zu einem geschlossenen Ring verketten (grösster Ring gewinnt). */
function ring(ways) {
  const unused = new Set(ways.map((_, i) => i))
  const rings = []
  while (unused.size) {
    const start = unused.values().next().value
    unused.delete(start)
    let chain = [...ways[start]]
    for (;;) {
      const end = chain[chain.length - 1]
      if (chain.length > 2 && dist2(end, chain[0]) < 0.05 * 0.05) break // geschlossen
      let bi = -1, bRev = false, bd = Infinity
      for (const i of unused) {
        const w = ways[i]
        const d0 = dist2(w[0], end), d1 = dist2(w[w.length - 1], end)
        if (d0 < bd) { bd = d0; bi = i; bRev = false }
        if (d1 < bd) { bd = d1; bi = i; bRev = true }
      }
      if (bi < 0 || bd > 2 * 2) break
      unused.delete(bi)
      chain = chain.concat(bRev ? [...ways[bi]].reverse() : ways[bi])
    }
    rings.push(chain)
  }
  /* grössten Ring nehmen (Inseln/Reststücke fallen weg) */
  const area = (r) => {
    let a = 0
    for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
    return Math.abs(a)
  }
  const best = rings.reduce((a, b) => (area(b) > area(a) ? b : a))
  if (dist2(best[best.length - 1], best[0]) > 1e-12) best.push([...best[0]])
  return best
}

const features = []
let first = true
for (const l of LAKES) {
  if (!first) await new Promise((r) => setTimeout(r, 3000))
  first = false
  console.log(`${l.name}:`)
  let json
  try {
    json = await fetchCached(`osm-see-${l.name.toLowerCase()}.json`,
      `[out:json][timeout:180];(relation["natural"="water"]["name"="${l.name}"](${l.bbox});way["natural"="water"]["name"="${l.name}"](${l.bbox}););out geom qt;`)
  } catch (e) { console.warn(`  ÜBERSPRUNGEN (${e.message}) — nochmal ausführen, sobald Overpass will`); continue }
  const els = json.elements ?? []
  let ways = [], osmRef = null
  const rels = els.filter((e) => e.type === 'relation')
  if (rels.length) {
    const rel = rels.reduce((a, b) => (b.members.length > a.members.length ? b : a))
    osmRef = 'relation/' + rel.id
    ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === 'outer' || m.role === '') && m.geometry)
      .map((m) => m.geometry.map((g) => [g.lon, g.lat]))
  } else {
    const wayEls = els.filter((e) => e.type === 'way' && e.geometry)
    if (!wayEls.length) { console.warn(`  ÜBERSPRUNGEN (nichts unter diesem Namen gefunden)`); continue }
    const w = wayEls.reduce((a, b) => (b.geometry.length > a.geometry.length ? b : a))
    osmRef = 'way/' + w.id
    ways = [w.geometry.map((g) => [g.lon, g.lat])]
  }
  const r = ring(ways)
  const simp = simplify(r, SIMPLIFY_M / 1000)
  console.log(`  ${osmRef}, ${ways.length} Wege → Ring ${r.length} → ${simp.length} Punkte`)
  features.push({
    type: 'Feature',
    properties: { kind: 'see', name: l.label ?? l.name, osm: osmRef, note: l.note },
    geometry: { type: 'Polygon', coordinates: [simp.map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)])] },
  })
}

const out = {
  type: 'FeatureCollection',
  provenance: {
    quelle: 'OpenStreetMap via Overpass API',
    beschreibung: `natural=water (${LAKES.map((l) => l.name).join(', ')}), outer-Ring verkettet, Douglas-Peucker ${SIMPLIFY_M} m.`,
    lizenz: 'ODbL 1.0 — © OpenStreetMap contributors. Share-Alike gilt für abgeleitete Datenbanken (betrifft das gebackene Tileset).',
    stand: new Date().toISOString().slice(0, 10),
  },
  features,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
