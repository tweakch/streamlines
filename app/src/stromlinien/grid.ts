import type { Cell, PersonState, PlacedTile, RegionCell } from './types'

/**
 * Sechseck-Nachbarschaft: pointy-top, odd-r offset
 * (ungerade Reihen nach rechts versetzt). Identisch zum Prototyp —
 * siehe prototype/drafts/stromlinien-epoche1.html.
 */
const DIRS_EVEN = [
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 0],
  [1, -1],
  [1, 0],
] as const
const DIRS_ODD = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [-1, 1],
  [1, 0],
  [1, 1],
] as const

const par = (r: number) => ((r % 2) + 2) % 2

/* Das Spielfeld ist ein beliebig geformtes Gebiet in Weltkoordinaten —
   Nachbarn werden über eine Positions-Map gefunden, nicht über Indexrechnung.
   structuredClone erzeugt pro Reducer-Schritt ein neues cells-Array, darum
   cached die WeakMap pro Array-Identität. */
const lookupCache = new WeakMap<readonly Cell[], Map<string, Cell>>()
function lookup(cells: readonly Cell[]): Map<string, Cell> {
  let m = lookupCache.get(cells)
  if (!m) {
    m = new Map(cells.map((c) => [`${c.r},${c.c}`, c]))
    lookupCache.set(cells, m)
  }
  return m
}

export function hexNeighbors(cells: readonly Cell[], cell: Cell): Cell[] {
  const map = lookup(cells)
  const dirs = par(cell.r) ? DIRS_ODD : DIRS_EVEN
  const out: Cell[] = []
  for (const [dr, dc] of dirs) {
    const n = map.get(`${cell.r + dr},${cell.c + dc}`)
    if (n) out.push(n)
  }
  return out
}

/** Nachbarschaft inkl. Furt: eine Furt verbindet ihre beiden Ufer. */
export function adjCells(cells: readonly Cell[], cell: Cell): Cell[] {
  const set = new Set<Cell>()
  for (const n of hexNeighbors(cells, cell)) {
    set.add(n)
    if (n.furt)
      for (const nn of hexNeighbors(cells, n)) if (nn !== cell) set.add(nn)
  }
  if (cell.furt) for (const n of hexNeighbors(cells, cell)) set.add(n)
  return [...set]
}

/** Das vom Startbildschirm geformte Gebiet wird zum Spielfeld. */
export function buildRegionGrid(region: readonly RegionCell[]): Cell[] {
  return [...region]
    .sort((a, b) => a.r - b.r || a.c - b.c)
    .map((rc, idx) => ({
      idx,
      r: rc.r,
      c: rc.c,
      t: rc.t,
      tile: null,
      lakeUfer: rc.lakeUfer,
      uferHang: rc.uferHang,
      furt: rc.furt,
      hint: rc.hint,
      landmark: rc.landmark,
    }))
}

export interface GridBounds {
  rMin: number
  rMax: number
  cMin: number
  cMax: number
}

export function gridBounds(cells: readonly Cell[]): GridBounds {
  let rMin = Infinity
  let rMax = -Infinity
  let cMin = Infinity
  let cMax = -Infinity
  for (const c of cells) {
    if (c.r < rMin) rMin = c.r
    if (c.r > rMax) rMax = c.r
    if (c.c < cMin) cMin = c.c
    if (c.c > cMax) cMax = c.c
  }
  return { rMin, rMax, cMin, cMax }
}

/**
 * Bewegungsziele: erster Einsatz = beliebiges eigenes Plättchen; danach
 * max. 2 Schritte über verbundene Plättchen (Furt zählt als Brücke).
 */
export function personTargets(
  cells: readonly Cell[],
  tiles: readonly PlacedTile[],
  person: PersonState,
): Set<number> {
  if (person.moved) return new Set()
  const placed = tiles.map((t) => t.cellIdx)
  if (person.cellIdx === null) return new Set(placed)
  const start = cells[person.cellIdx]
  const set = new Set<number>()
  const queue: Array<[Cell, number]> = [[start, 0]]
  const seen = new Set<Cell>([start])
  while (queue.length) {
    const [c, d] = queue.shift()!
    if (d >= 2) continue
    for (const n of adjCells(cells, c)) {
      if (seen.has(n)) continue
      seen.add(n)
      if (n.tile) {
        set.add(n.idx)
        queue.push([n, d + 1])
      } else if (n.furt) {
        // Furt ist begehbar, aber kein Ziel
        queue.push([n, d + 1])
      }
    }
  }
  set.delete(start.idx)
  return set
}
