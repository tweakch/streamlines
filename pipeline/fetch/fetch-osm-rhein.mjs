#!/usr/bin/env node
/*
 * fetch-osm-rhein.mjs — Stufe 1 der Karten-Pipeline (Fetch/Normalisieren).
 *
 * Holt den RHEIN-HAUPTLAUF aus OpenStreetMap: Vorderrhein (name:de) +
 * Relation „Rhein" (123924). Letztere führt im Delta über die wasserreiche
 * Waal-Route (Nijmegen → Merwede → Haringvliet) bis zur Nordsee. Der
 * LEK-ARM (Lek → Nieuwe Maas → Scheur → Nieuwe Waterweg, bei Hoek van
 * Holland) wird zusätzlich als Deltaarm-Nebenlauf komponiert.
 *
 * Jedes Stück wird an seinem eigenen Unterlauf-Anker orientiert (Quelle →
 * Mündung), greedy verkettet (Lücke über den Bodensee erlaubt), vereinfacht
 * und der Hauptlauf an den Abschnittsgrenzen in die sieben sec-Segmente
 * geschnitten. Ersetzt die handkuratierte Hauptlauf-Polylinie.
 * Rohantworten gecacht unter pipeline/data/. ODbL, © OpenStreetMap contributors.
 *
 * Aufruf:  node pipeline/fetch/fetch-osm-rhein.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data')
const OUT = join(ROOT, '..', 'sources', 'osm-rhein-hauptlauf.geo.json')
const SIMPLIFY_M = 150

/* Hauptlauf: die Relation „Rhein" (123924) enthält den kompletten Lauf ab
   dem Tomasee (inkl. Vorderrhein) und endet an der Nordsee am Haringvliet
   (Waal-Route über Nijmegen — der wasserreiche Hauptstrom). */
const MAIN_PIECES = [
  { name: 'Rhein', bbox: '46.40,4.00,52.20,10.20', gap: 60, to: [4.05, 51.83], ref: true },
]

/* Grobe Referenzlinie (die frühere handkuratierte Polylinie): dient NUR zum
   Ordnen und Filtern der Relations-Wege — im engen Alpenrheintal liegen
   parallele main_stream-Kanäle, an denen jedes Anstückeln nach Nähe
   scheitert (die Kette pendelt und verdoppelt die Länge). Jeder Weg bekommt
   seine Bogenposition an dieser Linie; wer >15 km abweicht oder keinen
   neuen Bogen abdeckt (Parallelkanal), fliegt raus. */
const REF = [
  [8.67, 46.635], [8.85, 46.70], [9.20, 46.77], [9.41, 46.82], [9.50, 46.87], [9.55, 46.97],
  [9.49, 47.06], [9.51, 47.14], [9.53, 47.22], [9.57, 47.32], [9.60, 47.40], [9.64, 47.50],
  [9.40, 47.58], [9.18, 47.66], [9.03, 47.69], [8.86, 47.66], [8.62, 47.68], [8.56, 47.57],
  [8.42, 47.57], [8.24, 47.61], [8.06, 47.56], [7.79, 47.55], [7.59, 47.56], [7.53, 47.70],
  [7.53, 47.86], [7.58, 48.03], [7.57, 48.22], [7.68, 48.40], [7.80, 48.57], [7.90, 48.69],
  [8.03, 48.79], [8.23, 48.96], [8.30, 49.04], [8.37, 49.19], [8.45, 49.32], [8.46, 49.49],
  [8.38, 49.63], [8.34, 49.87], [8.28, 50.00], [7.90, 49.97], [7.73, 50.14], [7.59, 50.23],
  [7.60, 50.36], [7.40, 50.44], [7.22, 50.64], [7.10, 50.73], [6.96, 50.94], [6.99, 51.05],
  [6.77, 51.23], [6.73, 51.45], [6.61, 51.65], [6.40, 51.76], [6.25, 51.83], [6.03, 51.87],
  [5.86, 51.85], [5.43, 51.89], [5.10, 51.82], [4.80, 51.82], [4.66, 51.78], [4.40, 51.76],
  [4.20, 51.79], [4.05, 51.83],
]
/* Delta-Feinverlauf der Referenz: Waal → Nieuwe Merwede → Hollands Diep →
   Haringvliet, damit parallele Merwede-Arme sicher wegfallen. */
REF.splice(REF.length - 6, 6,
  [4.97, 51.82], [4.90, 51.79], [4.75, 51.72], [4.55, 51.69], [4.35, 51.72], [4.17, 51.79], [4.05, 51.83])
/* Deltaarm Lek bis Hoek van Holland. */
const LEK_PIECES = [
  { name: 'Lek', bbox: '51.80,4.50,52.05,5.60', gap: 20, to: [4.62, 51.89] },
  { name: 'Nieuwe Maas', bbox: '51.85,4.25,51.98,4.75', gap: 20, to: [4.32, 51.89] },
  { name: 'Scheur', regex: '^(Het )?Scheur$', bbox: '51.85,4.20,51.98,4.50', gap: 20, to: [4.17, 51.95] },
  { name: 'Nieuwe Waterweg', bbox: '51.90,3.95,52.02,4.45', gap: 20, to: [4.09, 51.98] },
]

/* Abschnittsgrenzen (Schnitt am nächstliegenden Stützpunkt). */
const SECTIONS = [
  { id: 'alpen', name: 'Alpenrhein',
    txt: 'Junger Gebirgsfluss: Vorder- und Hinterrhein vereinen sich bei Reichenau, das Tal führt an Chur vorbei nach Norden zum See.' },
  { id: 'bodensee', name: 'Bodensee', cutFrom: [9.64, 47.50],
    txt: 'Der Rhein durchquert den See: er beruhigt sich, lagert sein Geschiebe ab und verlässt ihn bei Konstanz.' },
  { id: 'hoch', name: 'Hochrhein', cutFrom: [8.86, 47.66],
    txt: 'Von Konstanz nach Westen bis Basel: Stromschnellen und der Rheinfall bei Schaffhausen.' },
  { id: 'ober', name: 'Oberrhein', cutFrom: [7.59, 47.56],
    txt: 'Am Rheinknie bei Basel wendet sich der Fluss nach Norden in die breite Oberrheinische Tiefebene.' },
  { id: 'mittel', name: 'Mittelrhein', cutFrom: [7.90, 49.97],
    txt: 'Das enge Durchbruchstal durch das Schiefergebirge: Burgen, Weinberge, die Loreley.' },
  { id: 'nieder', name: 'Niederrhein', cutFrom: [7.10, 50.73],
    txt: 'Breiter Strom durch flaches Land: Köln, Düsseldorf, Duisburg und der grösste Binnenhafen Europas.' },
  { id: 'delta', name: 'Deltarhein', cutFrom: [6.17, 51.84],
    txt: 'Im Delta teilt sich der Rhein: der Hauptstrom folgt der Waal und erreicht am Haringvliet die Nordsee, der Lek-Arm mündet bei Hoek van Holland.' },
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
        const t = setTimeout(() => ctl.abort(), 300000)
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
/* Zwei Phasen: (1) Teilketten mit KLEINEM Gap bilden (4 km) — Parallelarme
   und echte Hauptstrom-Stücke trennen sich sauber. (2) Ketten quellennah →
   mündungsnah anhängen, aber nur wenn sie FORTSCHRITT zur Mündung machen:
   Parallelarme machen keinen und werden verworfen; grosse gewollte Lücken
   (Bodensee) überbrückt bigGap. */
function stitch(ways, mouth, bigGapKm, smallGapKm = 4) {
  const unused = new Set(ways.map((_, i) => i))
  const chains = []
  while (unused.size) {
    let start = -1, rev = false, best = -1
    for (const i of unused) {
      const w = ways[i]
      const d0 = dist2(w[0], mouth), d1 = dist2(w[w.length - 1], mouth)
      if (d0 > best) { best = d0; start = i; rev = false }
      if (d1 > best) { best = d1; start = i; rev = true }
    }
    unused.delete(start)
    let chain = rev ? [...ways[start]].reverse() : [...ways[start]]
    for (;;) {
      const end = chain[chain.length - 1]
      let bi = -1, bRev = false, bd = Infinity
      for (const i of unused) {
        const w = ways[i]
        const d0 = dist2(w[0], end), d1 = dist2(w[w.length - 1], end)
        if (d0 < bd) { bd = d0; bi = i; bRev = false }
        if (d1 < bd) { bd = d1; bi = i; bRev = true }
      }
      if (bi < 0 || bd > smallGapKm * smallGapKm) break
      unused.delete(bi)
      chain = chain.concat(bRev ? [...ways[bi]].reverse() : ways[bi])
    }
    if (dist2(chain[0], mouth) < dist2(chain[chain.length - 1], mouth)) chain.reverse()
    chains.push(chain)
  }
  chains.sort((a, b) => dist2(b[0], mouth) - dist2(a[0], mouth))
  let chain = chains[0], used = 1, dropped = 0, gaps = 0
  for (let i = 1; i < chains.length; i++) {
    const c = chains[i]
    const curEnd = chain[chain.length - 1]
    const progress = Math.sqrt(dist2(curEnd, mouth)) - Math.sqrt(dist2(c[c.length - 1], mouth))
    const jump = Math.sqrt(dist2(curEnd, c[0]))
    if (progress < 1 || jump > bigGapKm) { dropped++; continue }
    if (jump > 0.5) gaps++
    chain = chain.concat(c)
    used++
  }
  return { chain, used, total: chains.length, gaps, dropped }
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

/* ---- Ordnen entlang der Referenzlinie ---- */
const REF_CUM = [0]
for (let i = 1; i < REF.length; i++) REF_CUM.push(REF_CUM[i - 1] + Math.sqrt(dist2(REF[i - 1], REF[i])))
function projArc(p) {
  let bestS = 0, bestD = Infinity
  for (let i = 0; i < REF.length - 1; i++) {
    const a = REF[i], b = REF[i + 1]
    const kx = 111.32 * Math.cos(a[1] * Math.PI / 180), ky = 110.6
    const ax = a[0] * kx, ay = a[1] * ky, bx = b[0] * kx, by = b[1] * ky
    const px = p[0] * kx, py = p[1] * ky
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
    const ex = px - ax - t * dx, ey = py - ay - t * dy
    const d = Math.sqrt(ex * ex + ey * ey)
    if (d < bestD) { bestD = d; bestS = REF_CUM[i] + t * Math.sqrt(len2) }
  }
  return { s: bestS, d: bestD }
}
function composeByRef(ways) {
  const items = []
  let farOff = 0
  for (const w of ways) {
    const mid = projArc(w[Math.floor(w.length / 2)])
    if (mid.d > 15) { farOff++; continue }
    const a = projArc(w[0]), b = projArc(w[w.length - 1])
    items.push({ w: a.s <= b.s ? w : [...w].reverse(), s0: Math.min(a.s, b.s), s1: Math.max(a.s, b.s) })
  }
  items.sort((x, y) => x.s0 - y.s0)
  let covered = -Infinity, chain = [], used = 0, dup = 0
  for (const it of items) {
    const fresh = it.s1 - Math.max(covered, it.s0)
    if (fresh < 0.5 * (it.s1 - it.s0 + 0.01)) { dup++; continue }
    chain = chain.concat(it.w)
    covered = Math.max(covered, it.s1)
    used++
  }
  return { chain, used, total: ways.length, gaps: 0, dropped: farOff + dup }
}

/* Stücke der Reihe nach holen, orientieren und aneinanderhängen. */
async function compose(pieces, label) {
  let full = []
  let first = true
  for (const p of pieces) {
    if (!first) await new Promise((r) => setTimeout(r, 2000))
    first = false
    console.log(`${p.name}:`)
    const nameFilter = p.filter ?? (p.regex ? `["name"~"${p.regex}"]` : `["name"="${p.name}"]`)
    let json
    try {
      json = await fetchCached(`osm-hauptlauf-${p.name.toLowerCase().replace(/[^a-z]+/g, '-')}.json`,
        `[out:json][timeout:280];relation["waterway"]${nameFilter}(${p.bbox});out geom qt;`)
    } catch (e) { console.warn(`  ÜBERSPRUNGEN (${e.message})`); continue }
    const rels = (json.elements ?? []).filter((e) => e.type === 'relation')
    if (!rels.length) { console.warn('  ÜBERSPRUNGEN (keine Relation)'); continue }
    const rel = rels.reduce((a, b) => (b.members.length > a.members.length ? b : a))
    /* Führt die Relation main_stream-Rollen, zählt NUR der Hauptstrom —
       sonst laufen parallele Arme (Restrhein/Kanäle) doppelt in die Kette. */
    const hasMain = rel.members.some((m) => m.role === 'main_stream')
    const ways = rel.members
      .filter((m) => m.type === 'way' && (hasMain ? m.role === 'main_stream' : m.role === '') && m.geometry)
      .map((m) => m.geometry.map((g) => [g.lon, g.lat]))
    if (!ways.length) { console.warn('  ÜBERSPRUNGEN (keine Wege)'); continue }
    const { chain, used, total, gaps, dropped } = p.ref ? composeByRef(ways) : stitch(ways, p.to, p.gap)
    console.log(`  relation/${rel.id}: ${used}/${total} ${p.ref ? 'Wege entlang der Referenz' : 'Teilketten'} ` +
      `(${dropped} verworfen), ${gaps} Lücken · ` +
      `von [${chain[0].map((v) => v.toFixed(2))}] bis [${chain[chain.length - 1].map((v) => v.toFixed(2))}]`)
    if (full.length) {
      const jump = Math.sqrt(dist2(full[full.length - 1], chain[0]))
      if (jump > 1) console.log(`  Übergang: ${jump.toFixed(1)} km Lücke überbrückt`)
    }
    full = full.concat(chain)
  }
  const simp = simplify(full, SIMPLIFY_M / 1000)
  console.log(`${label}: ${full.length} → ${simp.length} Punkte, ` +
    `Ende [${simp[simp.length - 1].map((v) => v.toFixed(2))}]`)
  return simp
}

const main = await compose(MAIN_PIECES, 'Hauptlauf')
const lek = await compose(LEK_PIECES, 'Lek-Arm')

/* ---- Hauptlauf an den Abschnittsgrenzen schneiden ---- */
const cuts = [0]
for (let sIdx = 1; sIdx < SECTIONS.length; sIdx++) {
  const target = SECTIONS[sIdx].cutFrom
  let bi = cuts[sIdx - 1], bd = Infinity
  for (let i = cuts[sIdx - 1] + 1; i < main.length - 1; i++) {
    const d = dist2(main[i], target)
    if (d < bd) { bd = d; bi = i }
  }
  cuts.push(bi)
  console.log(`Schnitt ${SECTIONS[sIdx].id} bei Punkt ${bi} (${Math.sqrt(bd).toFixed(1)} km von der Soll-Grenze)`)
}
cuts.push(main.length - 1)

/* Kontrolle: km je Abschnitt (Haversine). */
{
  const hav = (a, b) => {
    const d = Math.PI / 180
    const h = Math.sin(((b[1] - a[1]) * d) / 2) ** 2 +
      Math.cos(a[1] * d) * Math.cos(b[1] * d) * Math.sin(((b[0] - a[0]) * d) / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(h))
  }
  let tot = 0
  SECTIONS.forEach((s, i) => {
    let km = 0
    for (let j = cuts[i]; j < cuts[i + 1]; j++) km += hav(main[j], main[j + 1])
    tot += km
    console.log(`  ${s.id.padEnd(9)} ${km.toFixed(0).padStart(4)} km`)
  })
  console.log(`  gesamt    ${tot.toFixed(0).padStart(4)} km (offizielle Länge ~1230 km)`)
}

const rnd = (pts) => pts.map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)])
const features = SECTIONS.map((s, i) => ({
  type: 'Feature',
  properties: { kind: 'hauptlauf', order: i + 1, sec: s.id, name: s.name, txt: s.txt },
  geometry: { type: 'LineString', coordinates: rnd(main.slice(cuts[i], cuts[i + 1] + 1)) },
}))
features.push({
  type: 'Feature',
  properties: {
    kind: 'nebenlauf', name: 'Lek', art: 'Deltaarm',
    note: 'Nördlicher Deltaarm — führt Rheinwasser über Nieuwe Maas und Nieuwe Waterweg bei Hoek van Holland ins Meer.',
  },
  geometry: { type: 'LineString', coordinates: rnd(lek) },
})

const out = {
  type: 'FeatureCollection',
  provenance: {
    quelle: 'OpenStreetMap via Overpass API',
    beschreibung: `Rhein-Hauptlauf (Vorderrhein + Relation „Rhein", Waal-Route bis Haringvliet) und Lek-Arm (bis Hoek van Holland), Douglas-Peucker ${SIMPLIFY_M} m, Hauptlauf an den Abschnittsgrenzen geschnitten.`,
    lizenz: 'ODbL 1.0 — © OpenStreetMap contributors. Share-Alike gilt für abgeleitete Datenbanken (betrifft das gebackene Tileset).',
    stand: new Date().toISOString().slice(0, 10),
  },
  features,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
