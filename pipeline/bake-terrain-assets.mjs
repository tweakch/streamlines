#!/usr/bin/env node
/*
 * bake-terrain-assets.mjs — Terrain-Tile-Assets → gebündeltes Bundle für
 * den Kartenrenderer.
 *
 * Liest pipeline/assets/terrain/<kollektion>/*.svg (einzelne, von Hand oder
 * im asset-editor-v1-Prototyp editierbare Dateien — eine pro Terrain-Art,
 * siehe app/src/stromlinien/types.ts: Terrain) und schreibt ein einziges
 * Bundle mit ALLEN Kollektionen. Der Konsument (Karte) rastert jede Art
 * jeder Kollektion EINMAL zu einer Bitmap und blittet sie per drawImage —
 * so lässt sich zwischen Kollektionen umschalten, ohne erneut zu backen.
 *
 * Node ≥ 18, keine Dependencies.
 * Aufruf: node pipeline/bake-terrain-assets.mjs
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ASSET_DIR = join(ROOT, 'assets', 'terrain')
const OUT = join(ROOT, '..', 'prototype', 'drafts', 'terrain-assets.bundle.js')

/* Pointy-top, odd-r — identische Geometrie wie app/src/stromlinien/grid.ts.
   z = Kante-zu-Kante-Breite; die Hexkontur in jeder SVG steht zentriert
   in diesem Rahmen (50, h/2), also blittet drawImage(bitmap, x-w/2, y-h/2, w, h)
   ohne weiteren Versatz. */
const HEX = { w: 100, h: 200 / Math.sqrt(3) }

function sha(s) { return createHash('sha1').update(s).digest('hex').slice(0, 10) }

const collectionDirs = readdirSync(ASSET_DIR).filter((f) => statSync(join(ASSET_DIR, f)).isDirectory()).sort()
if (!collectionDirs.length) throw new Error(`keine Kollektions-Ordner in ${ASSET_DIR}`)

const collections = {}
for (const col of collectionDirs) {
  const dir = join(ASSET_DIR, col)
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()
  if (!files.length) continue
  const tiles = {}
  for (const f of files) {
    const key = f.replace(/\.svg$/, '')
    const svg = readFileSync(join(dir, f), 'utf8')
    tiles[key] = { svg, hash: sha(svg) }
  }
  const version = sha(files.map((f) => tiles[f.replace(/\.svg$/, '')].hash).join(','))
  collections[col] = { version, tiles }
}

/* Warnung statt Abbruch: Kollektionen dürfen (noch) unterschiedliche
   Terrain-Arten abdecken, z. B. während eine neue Kollektion entsteht. */
const keysPerCollection = Object.fromEntries(Object.entries(collections).map(([c, v]) => [c, Object.keys(v.tiles).sort().join(',')]))
const referenceKeys = Object.values(keysPerCollection)[0]
for (const [col, keys] of Object.entries(keysPerCollection)) {
  if (keys !== referenceKeys) console.warn(`Achtung: Kollektion "${col}" hat andere Terrain-Arten (${keys}) als die erste Kollektion (${referenceKeys})`)
}

const version = sha(collectionDirs.map((c) => collections[c]?.version || '').join(','))
const bundle = { version, generated: new Date().toISOString(), hex: HEX, collections }

const js = '/* Generiert von pipeline/bake-terrain-assets.mjs — NICHT von Hand editieren. Quelle: pipeline/assets/terrain/ */\n' +
  'window.TERRAIN_ASSETS = ' + JSON.stringify(bundle) + ';\n'
writeFileSync(OUT, js)

for (const col of collectionDirs) {
  if (!collections[col]) continue
  console.log(`Kollektion "${col}" (Version ${collections[col].version}): ${Object.keys(collections[col].tiles).join(', ')}`)
}
console.log(`geschrieben: ${OUT} (${(js.length / 1024).toFixed(1)} KB, ${collectionDirs.length} Kollektionen)`)
