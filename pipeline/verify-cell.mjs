#!/usr/bin/env node
/* verify-cell.mjs — prüft die Ebenen-Herleitung an einzelnen Zellen.
   Aufruf:  node pipeline/verify-cell.mjs <ebene> <c> <r>
   Zeigt Terrain/Höhe der Zelle und (für Ebene < 2) die Terrainverteilung
   der Basiszellen (Ebene 2), die in diese Zelle aggregieren. */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(ROOT, '..', 'prototype', 'drafts', 'rhein-tiles-v2.data.js'), 'utf8')
const TS = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf(';')))
const TERRNAME = ['Flachland', 'Ufer', 'Bergland', 'Fluss', 'See', 'Meer', 'Zufluss', 'Hang']
const SQRT3 = Math.sqrt(3)

const cellData = (L, c, r) => {
  const tile = L.tiles[Math.floor(c / L.tile) + ',' + Math.floor(r / L.tile)]
  if (!tile) return { t: 0, e: 0 }
  const i = (r % L.tile) * L.tile + (c % L.tile)
  const dec = (b64) => Buffer.from(b64, 'base64')
  return { t: dec(tile.t)[i], e: tile.e ? dec(tile.e)[i] : 0 }
}
const axialOf = (c, r) => c - ((r - (r & 1)) / 2)
const centerKm = (c, r, s) => [s * SQRT3 * (axialOf(c, r) + r / 2), s * 1.5 * r]
function cellAtKm(x, y, s) {
  const q = ((SQRT3 / 3) * x - y / 3) / s, r = ((2 / 3) * y) / s
  let rx = Math.round(q), ry = Math.round(-q - r), rz = Math.round(r)
  const dx = Math.abs(rx - q), dy = Math.abs(ry - (-q - r)), dz = Math.abs(rz - r)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (!(dy > dz)) rz = -rx - ry
  return [rx + ((rz - (rz & 1)) / 2), rz]
}

const [lvl, C, R] = process.argv.slice(2).map(Number)
const L = TS.levels[lvl]
const d = cellData(L, C, R)
const s = L.hexKm / SQRT3
const [x, y] = centerKm(C, R, s)
const lon = TS.cfg.lon0 + x / TS.cfg.kmx, lat = TS.cfg.lat1 - y / TS.cfg.kmy
console.log(`Ebene ${lvl} (${C},${R}) → ${TERRNAME[d.t]}${d.e ? ` · ≈${d.e * 25} m` : ''} · lon ${lon.toFixed(3)}, lat ${lat.toFixed(3)}`)

if (lvl < 2) {
  const B = TS.levels[2]
  const sB = B.hexKm / SQRT3
  const dist = {}
  // Basiszellen suchen, deren Zentrum in die Grobzelle fällt (Fenster ums Zentrum).
  const [bc0, br0] = cellAtKm(x, y, sB)
  const w = Math.ceil((L.hexKm / B.hexKm) * 1.6)
  for (let r = br0 - w; r <= br0 + w; r++)
    for (let c = bc0 - w; c <= bc0 + w; c++) {
      const [bx, by] = centerKm(c, r, sB)
      const [cc, cr] = cellAtKm(bx, by, s)
      if (cc !== C || cr !== R) continue
      const t = TERRNAME[cellData(B, c, r).t]
      dist[t] = (dist[t] ?? 0) + 1
    }
  console.log('  Basiszellen (Ebene 2) darin:', JSON.stringify(dist))
}
