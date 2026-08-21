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
  { name: 'Walensee', tiefe: 151, bbox: '47.08,9.05,47.18,9.35',
    note: 'Fjordartiger See zwischen Churfirsten und Kerenzerberg — die Seez mündet, die Linth durchfliesst ihn seit der Linthkorrektion.' },
  { name: 'Zürichsee', tiefe: 136, bbox: '47.15,8.52,47.40,8.85',
    note: 'Gletscherzungenbecken der Linth — am Ausfluss in Zürich beginnt die Limmat.' },
  { name: 'Obersee', tiefe: 48, label: 'Zürichsee (Obersee)', bbox: '47.17,8.78,47.30,9.00',
    note: 'Oberer Teil des Zürichsees, vom Seedamm abgetrennt — hier mündet die Linth.' },
  { name: 'Sihlsee', tiefe: 23, bbox: '47.07,8.74,47.18,8.85',
    note: 'Stausee von 1937, der grösste Speichersee der Schweiz nach Fläche — die Sihl durchfliesst ihn.' },
  /* Relation 1156846 umfasst den ganzen Bodensee inkl. Untersee. */
  { name: 'Bodensee', tiefe: 251, bbox: '47.42,8.85,47.65,9.80',
    note: 'Der Rhein durchquert den See — Pfahlbauten an den Ufern, Konstanz am Seerhein, bei Stein am Rhein beginnt der Hochrhein.' },

  /* ---- Zungenbecken des ganzen Alpenbogens (ab Aug 2026, für eiszeit-labor-v3) ----
     Jeder dieser Seen liegt in einem Becken, das ein Eisstrom ausgeschürft hat;
     mehrere sind übertieft (Sohle unter dem Meeresspiegel). Sie sind damit nicht
     Kulisse, sondern der Beleg: wo heute ein Fjordsee liegt, stand eine Zunge.
     Für das Eismodell zählen sie doppelt — als Becken mit weichem Bett (kleinere
     Fliessgrenze) und als Ort, an dem die Zunge ins Wasser kalben konnte.       */
  /* OSM führt den See als „Le Léman“ (name:de = Genfersee) — nicht als „Lac Léman“. */
  { name: 'Le Léman', tiefe: 310, label: 'Genfersee', bbox: '46.18,6.08,46.55,6.98',
    note: 'Grösstes Zungenbecken der Alpen — der Rhônegletscher hat es ausgeschürft, die Rhône durchfliesst es.' },
  { name: 'Lac du Bourget', tiefe: 145, bbox: '45.65,5.75,45.93,5.95',
    note: 'Zungenbecken am Westrand der Savoyer Alpen, tiefster natürlicher See Frankreichs.' },
  { name: 'Lac de Neuchâtel', tiefe: 152, label: 'Neuenburgersee', bbox: '46.75,6.55,47.05,7.15',
    note: 'Jurarandsee am Nordrand des Rhône-/Aaregletschers — an seinen Ufern liegen die Pfahlbaudörfer.' },
  { name: 'Bielersee', tiefe: 74, bbox: '47.02,7.05,47.15,7.30',
    note: 'Jurarandsee; die Aare wurde erst durch die Juragewässerkorrektion hineingeleitet.' },
  { name: 'Thunersee', tiefe: 217, bbox: '46.63,7.58,46.78,7.85',
    note: 'Zungenbecken des Aaregletschers, vom Brienzersee durch den Schwemmkegel von Interlaken getrennt.' },
  { name: 'Brienzersee', tiefe: 260, bbox: '46.68,7.83,46.80,8.10',
    note: 'Der zweite Teil desselben ausgeschürften Trogs — Interlaken liegt auf der Schwelle dazwischen.' },
  { name: 'Vierwaldstättersee', tiefe: 214, bbox: '46.90,8.28,47.12,8.72',
    note: 'Verzweigtes Zungenbecken des Reussgletschers; der Urnersee ist sein südlichster Arm.' },
  { name: 'Lago Maggiore', tiefe: 372, label: 'Lago Maggiore (Verbano)', bbox: '45.65,8.42,46.22,8.95',
    note: 'Übertieft: die Sohle liegt gut 170 m unter dem Meeresspiegel. Der Verbano-Lappen endete bei Sesto Calende.' },
  { name: 'Lago di Lugano', tiefe: 288, label: 'Luganersee', bbox: '45.88,8.82,46.08,9.15',
    note: 'Verzweigter Fjordsee zwischen den Lappen von Verbano und Como.' },
  { name: 'Lago di Como', tiefe: 410, label: 'Comersee', bbox: '45.78,9.02,46.22,9.48',
    note: 'Übertieft bis 200 m unter dem Meeresspiegel; sein Lappen endete in der Brianza.' },
  { name: "Lago d'Iseo", tiefe: 251, label: 'Iseosee', bbox: '45.60,9.92,45.88,10.18',
    note: 'Zungenbecken des Oglio-Gletschers, mit eigenem Endmoränenkranz im Süden.' },
  { name: 'Lago di Garda', tiefe: 346, label: 'Gardasee', bbox: '45.40,10.48,45.92,10.92',
    note: 'Grösster See Italiens und das tiefste Zungenbecken der Südalpen — sein Amphitheater bei Rivoli–Villafranca markiert den tiefsten Eisrand der Alpen.' },
  { name: 'Ammersee', tiefe: 81, bbox: '47.90,11.02,48.10,11.22',
    note: 'Zungenbecken des Ammergletschers im bayerischen Vorland.' },
  { name: 'Starnberger See', tiefe: 128, label: 'Starnberger See (Würmsee)', bbox: '47.80,11.20,48.02,11.40',
    note: 'Zungenbecken des Isar-Loisach-Gletschers. Sein Abfluss, die Würm, hat der ganzen Eiszeit den Namen gegeben.' },
  { name: 'Chiemsee', tiefe: 73, bbox: '47.78,12.32,47.95,12.55',
    note: 'Zungenbecken des Salzachgletschers — das „bayerische Meer“ ist der Rest eines viel größeren Eisstausees.' },
  { name: 'Attersee', tiefe: 169, bbox: '47.72,13.42,47.98,13.62',
    note: 'Zungenbecken des Traungletschers am Nordrand der Ostalpen.' },
  { name: 'Traunsee', tiefe: 191, bbox: '47.75,13.72,47.95,13.88',
    note: 'Tiefster See Österreichs, ausgeschürft vom Traungletscher.' },
  { name: 'Wörthersee', tiefe: 85, bbox: '46.58,14.02,46.68,14.28',
    note: 'Im Klagenfurter Becken, dem Zungenbecken des Draugletschers — des östlichsten grossen Lappens.' },
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
    /* `tiefe` ist die Maximaltiefe in Metern — HANDKURATIERT aus der Literatur,
       nicht aus OSM. Sie ist der einzige Weg, die Übertiefung der Zungenbecken
       überhaupt in die Pipeline zu bekommen: ein DTM liefert für eine
       Wasserfläche den Wasserspiegel, nicht den Seeboden. */
    properties: { kind: 'see', name: l.label ?? l.name, osm: osmRef, note: l.note,
      ...(l.tiefe ? { tiefe: l.tiefe } : {}) },
    geometry: { type: 'Polygon', coordinates: [simp.map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)])] },
  })
}

const out = {
  type: 'FeatureCollection',
  provenance: {
    quelle: 'OpenStreetMap via Overpass API',
    beschreibung: `natural=water (${LAKES.map((l) => l.name).join(', ')}), outer-Ring verkettet, Douglas-Peucker ${SIMPLIFY_M} m. Dazu je See eine handkuratierte MAXIMALTIEFE (Feld „tiefe", Meter, Literaturwert): das DTM kennt nur den Wasserspiegel, und ohne die Tiefe fehlt der Pipeline die Übertiefung der Zungenbecken.`,
    lizenz: 'ODbL 1.0 — © OpenStreetMap contributors. Share-Alike gilt für abgeleitete Datenbanken (betrifft das gebackene Tileset).',
    stand: new Date().toISOString().slice(0, 10),
  },
  features,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
