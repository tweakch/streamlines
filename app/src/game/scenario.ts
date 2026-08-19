import type { ClaimId } from './types'

export type Terrain = 'feld' | 'wald' | 'fluss' | 'uebergang'

export interface Hex {
  col: number
  row: number
  terrain: Terrain
  /** Nur gesetzt bei terrain 'uebergang': welcher Claim diesen Hex begründet. */
  crossing?: ClaimId
}

export interface HexCoord {
  col: number
  row: number
}

export const TURN_LIMIT = 6
export const MOVE_POINTS = 3

/**
 * Szenariokarte als odd-r-Offset-Gitter (pointy-top).
 * Zeichen: . Feld, W Wald, ~ Limmat, F Furt Nord, P Ponton Süd,
 * S Start (Feld), Z Ziel (Feld).
 */
const MAP = [
  '..W.~.....',
  '..W.F.....',
  '.SW.~...Z.',
  '..W.~.....',
  '..WW~.....',
  '...WP.....',
  '....~.....',
]

function terrainOf(ch: string): Terrain {
  switch (ch) {
    case 'W':
      return 'wald'
    case '~':
      return 'fluss'
    case 'F':
    case 'P':
      return 'uebergang'
    default:
      return 'feld'
  }
}

export const COLS = MAP[0].length
export const ROWS = MAP.length

export const grid: Hex[] = MAP.flatMap((line, row) =>
  line.split('').map((ch, col) => ({
    col,
    row,
    terrain: terrainOf(ch),
    crossing:
      ch === 'F' ? ('furt-nord' as const) : ch === 'P' ? ('ponton-sued' as const) : undefined,
  })),
)

export const START: HexCoord = { col: 1, row: 2 }
export const ZIEL: HexCoord = { col: 8, row: 2 }

export function hexAt(col: number, row: number): Hex | undefined {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return undefined
  return grid[row * COLS + col]
}

/** Nachbarn im odd-r-Offset-Gitter (pointy-top). */
export function neighbors(c: HexCoord): HexCoord[] {
  const odd = c.row % 2 === 1
  const deltas = odd
    ? [
        [1, 0],
        [-1, 0],
        [0, -1],
        [1, -1],
        [0, 1],
        [1, 1],
      ]
    : [
        [1, 0],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [-1, 1],
        [0, 1],
      ]
  return deltas
    .map(([dc, dr]) => ({ col: c.col + dc, row: c.row + dr }))
    .filter((n) => hexAt(n.col, n.row) !== undefined)
}

/**
 * Bewegungskosten beim Betreten eines Hex — abhängig von der Hypothese:
 * Die Limmat ist nur am Übergang passierbar, den der Spieler begründet hat.
 * Rückgabe null = unpassierbar.
 */
export function entryCost(hex: Hex, hypothesis: ClaimId): number | null {
  switch (hex.terrain) {
    case 'feld':
      return 1
    case 'wald':
      return 2
    case 'uebergang':
      return hex.crossing === hypothesis ? 2 : null
    case 'fluss':
      return null
  }
}

export function sameHex(a: HexCoord, b: HexCoord): boolean {
  return a.col === b.col && a.row === b.row
}
