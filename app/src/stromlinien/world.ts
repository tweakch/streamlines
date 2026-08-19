import { FUND } from './data'
import type { HintCat, RegionCell, Terrain } from './types'

/*
 * Die gestaltete Weltkarte: Alpenrhein von Landquart bis Konstanz.
 *
 * Entschieden statt prozedural erzeugt — Fundstellen, Landmarken und
 * Anker-Ereignisse sind an feste Weltkoordinaten gebunden (historisch
 * inspiriert und vereinfacht). Norden ist oben: der See (Bodensee) mit
 * Konstanz am Westende, das Rheintal zieht nach Süden bis Landquart.
 *
 * Pointy-top-Hexes, odd-r offset — identische Nachbarschaftstabellen wie
 * grid.ts und prototype/drafts/stromlinien-epoche1.html.
 *
 * Zeichenlegende: L See · ~ Fluss · f Furt · M Hang · . Flachland
 * (Ufer wird abgeleitet: Flachland neben Wasser.)
 */
const MAP: string[] = [
  '......LLLLLLLLL.......', // r0
  '....LLLLLLLLLLLL......', // r1   Konstanz am Westufer
  '...LLLLLLLLLLLLLL.....', // r2
  '..LLLLLLLLLLLLLLLL....', // r3
  '..LLLLLLLLLLLLLLLLL...', // r4
  '...LLLLLLLLLLLLLLLL...', // r5
  '....LLLLLLLLLLLLLLL...', // r6
  '......LLLLLLLLLLLL....', // r7
  '.........LLLLLLLL.....', // r8
  '...........LLLL.......', // r9
  '..MMM.......~....MMM..', // r10  Rheindelta
  '..MMM.......~....MMM..', // r11
  '..MMM.......~....MMM..', // r12
  '..MMM......~.....MMM..', // r13
  '..MMM......f.....MMM..', // r14  Furt im Ried
  '..MMM......~.....MMM..', // r15
  '..MMM......~..M.MMMM..', // r16  Inselberg im Tal
  '..MMM.....~......MMMM.', // r17
  '..MMM.....~~~~...MMM..', // r18  Illmündung
  '..MMM.....~......MMM..', // r19
  '..MMM......~.....MMM..', // r20
  '..MMM......~.....MMM..', // r21
  '...MMM..M..~....MMMM..', // r22  Siedlungshügel im Tal
  '...MMM.....~....MMMM..', // r23
  '...MMM.....~....MMMM..', // r24
  '...MMM.....~....MMMM..', // r25
  '...MMM.....f....MMMM..', // r26  Schaaner Furt
  '...MMM.....~....MMMM..', // r27
  '...MMM.....~....MMMM..', // r28
  '...MMMM...~....MMMM...', // r29
  '...MMMM...~....MMMM...', // r30
  '...MMMM...~....MMMM...', // r31
  '...MMMM....~...MMMM...', // r32
  '...MMMM....~...MMMM...', // r33
  '....MMMM...~...MMMM...', // r34
  '....MMMM...~...MMMM...', // r35
  '....MMMM...~...MMMM...', // r36
  '....MMMM...~...MMMM...', // r37
  '....MMMM...f...MMMM...', // r38  Tardisfurt
  '....MMMM...~...MMMM...', // r39
  '....MMMMM..~..MMMM....', // r40
  '....MMMMM..~..MMMM....', // r41
  '....MMMMM..~~~~MMMM...', // r42  Landquart mündet
  '...MMMMMM..~..MMMMM...', // r43
]

export const WORLD_H = MAP.length
export const WORLD_W = 22

/** Landmarken — Wissen über das Land, sichtbar auch unter dem Nebel. */
const LANDMARKS: Array<{ r: number; c: number; name: string }> = [
  { r: 1, c: 2, name: 'Konstanz' },
  { r: 10, c: 12, name: 'Rheindelta' },
  { r: 14, c: 11, name: 'Furt im Ried' },
  { r: 18, c: 13, name: 'Illmündung' },
  { r: 26, c: 11, name: 'Schaaner Furt' },
  { r: 38, c: 11, name: 'Tardisfurt' },
  { r: 42, c: 12, name: 'Landquart' },
]

/* Sechseck-Nachbarschaft: odd-r offset — identisch zu grid.ts. */
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
export const dirsOf = (r: number) =>
  ((r % 2) + 2) % 2 ? DIRS_ODD : DIRS_EVEN

export const isWaterTerrain = (t: Terrain) => t === 'water' || t === 'lake'

interface WorldCell {
  t: Terrain
  furt: boolean
  lakeUfer: boolean
  uferHang: boolean
  hint: HintCat | null
  landmark: string | null
}

/* Deterministischer Hash — nur für die Streuung der Zeichen ◈, mit festen
   Konstanten: dieselbe Welt für alle, keine Seeds. */
function hash(x: number, y: number, s: number): number {
  let h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(s | 0, 1440662683)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function buildWorld(): WorldCell[][] {
  const grid: WorldCell[][] = MAP.map((row, r) => {
    if (row.length !== WORLD_W)
      throw new Error(`Weltkarte: Reihe ${r} hat ${row.length} statt ${WORLD_W} Felder`)
    return [...row].map((ch) => {
      const t: Terrain =
        ch === 'L' ? 'lake' : ch === '~' || ch === 'f' ? 'water' : ch === 'M' ? 'hang' : 'flach'
      return {
        t,
        furt: ch === 'f',
        lakeUfer: false,
        uferHang: false,
        hint: null,
        landmark: null,
      }
    })
  })

  /* Ufer ableiten — gleiche Logik wie das feste 5×8-Raster zuvor. */
  for (let r = 0; r < WORLD_H; r++)
    for (let c = 0; c < WORLD_W; c++) {
      const cell = grid[r][c]
      if (cell.t !== 'flach' && cell.t !== 'hang') continue
      let nearWater = false
      let nearLake = false
      for (const [dr, dc] of dirsOf(r)) {
        const n = grid[r + dr]?.[c + dc]
        if (!n) continue
        if (isWaterTerrain(n.t)) nearWater = true
        if (n.t === 'lake') nearLake = true
      }
      if (nearWater) {
        if (cell.t === 'flach') cell.t = 'ufer'
        else cell.uferHang = true
      }
      if (nearLake) cell.lakeUfer = true
    }

  /* Zeichen ◈ streuen: nur auf Land, Kategorie aus dem Gelände.
     Die Kategorie „fund" wird NICHT gestreut — sie steht ausschließlich
     an echten Fundstellen (gestaltete Welt: kein Zeichen lügt). */
  for (let r = 0; r < WORLD_H; r++)
    for (let c = 0; c < WORLD_W; c++) {
      const cell = grid[r][c]
      if (isWaterTerrain(cell.t)) continue
      if (hash(c, r, 777) >= 0.05) continue
      if (cell.t === 'ufer' || cell.uferHang) cell.hint = 'wasser'
      else if (cell.t === 'hang') cell.hint = 'stein'
      else cell.hint = 'land'
    }
  for (const f of FUND) {
    const cell = grid[f.r]?.[f.c]
    if (!cell || isWaterTerrain(cell.t))
      throw new Error(`Fundstelle „${f.name}" liegt nicht auf Land (${f.r},${f.c})`)
    cell.hint = 'fund'
  }

  for (const lm of LANDMARKS) {
    const cell = grid[lm.r]?.[lm.c]
    if (!cell) throw new Error(`Landmarke „${lm.name}" außerhalb der Welt`)
    cell.landmark = lm.name
  }
  return grid
}

const WORLD = buildWorld()

export function worldCellAt(c: number, r: number): WorldCell | null {
  return WORLD[r]?.[c] ?? null
}

/* ================= Auswahl-Geometrie ================= */

export const HEXAGON_R = 3
export const MIN_TILES = 12
export const MAX_TILES = 55

export const keyOf = (c: number, r: number) => `${c},${r}`
export const parseKey = (k: string): [number, number] =>
  k.split(',').map(Number) as [number, number]

/** offset (odd-r) ↔ cube: Sechseck-Grundform um ein Zentrum. */
export function hexagonCells(cc: number, cr: number, R: number): Array<[number, number]> {
  const x0 = cc - ((cr - (cr & 1)) / 2)
  const cells: Array<[number, number]> = []
  for (let dx = -R; dx <= R; dx++)
    for (let dy = Math.max(-R, -dx - R); dy <= Math.min(R, -dx + R); dy++) {
      const dz = -dx - dy
      const x = x0 + dx
      const z = cr + dz
      cells.push([x + ((z - (z & 1)) / 2), z]) // [col,row]
    }
  return cells
}

export function selNeighbors(k: string): string[] {
  const [c, r] = parseKey(k)
  return dirsOf(r).map(([dr, dc]) => keyOf(c + dc, r + dr))
}

export function staysConnected(sel: ReadonlySet<string>, without: string): boolean {
  const rest = [...sel].filter((k) => k !== without)
  if (!rest.length) return false
  const seen = new Set([rest[0]])
  const queue = [rest[0]]
  while (queue.length) {
    const k = queue.pop()!
    for (const n of selNeighbors(k))
      if (sel.has(n) && n !== without && !seen.has(n)) {
        seen.add(n)
        queue.push(n)
      }
  }
  return seen.size === rest.length
}

/* ================= Gebiets-Statistik & Zeichen-Texte ================= */

export interface RegionStats {
  water: number
  furt: number
  lake: number
  hang: number
  flach: number
  ufer: number
  n: number
  hints: Array<{ c: number; r: number; cat: HintCat }>
}

export function regionStats(sel: ReadonlySet<string>): RegionStats {
  const s: RegionStats = {
    water: 0,
    furt: 0,
    lake: 0,
    hang: 0,
    flach: 0,
    ufer: 0,
    n: sel.size,
    hints: [],
  }
  for (const k of sel) {
    const [c, r] = parseKey(k)
    const cell = worldCellAt(c, r)
    if (!cell) continue
    if (cell.furt) s.furt++
    else s[cell.t]++
    if (cell.hint) s.hints.push({ c, r, cat: cell.hint })
  }
  return s
}

export function bucket(n: number): string {
  return n === 0 ? 'keines' : n <= 2 ? 'wenig' : n <= 5 ? 'etwas' : 'reichlich'
}

/** Vage Aussagen der Zeichen über das GESAMTE Gebiet (kein Ort, keine Art). */
export const HINTTXT: Record<HintCat, (s: RegionStats) => string> = {
  wasser: (s) =>
    'Wasser im Gebiet: ' +
    bucket(s.water + s.furt + s.lake) +
    (s.furt > 0 ? ' – und eine flache Stelle zum Übersetzen.' : '.'),
  stein: (s) => 'Steiniger Grund und Hänge: ' + bucket(s.hang) + '.',
  land: (s) => 'Offenes Land für Lager und Wald: ' + bucket(s.flach + s.ufer) + '.',
  fund: () => 'Die Alten erzählen von etwas Verborgenem in diesem Gebiet.',
}

/** Kurztexte für den Feld-Inspektor im Spiel. */
export const HINT_INSPECT: Record<HintCat, string> = {
  wasser: 'Die Alten ritzten Wellen in den Stein – gutes Wasser ist nah.',
  stein: 'Ein Zeichen für festen Grund und gutes Gestein.',
  land: 'Ein Zeichen für offenes, brauchbares Land.',
  fund: 'Die Alten erzählen von etwas Verborgenem an einem Ort wie diesem. Wer hier richtig baut, findet es vielleicht.',
}

/* ================= Epochen-Ausblick ================= */

export interface EpochForecast {
  name: string
  years: string
  score: number
  txt: string
}

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function epochForecast(s: RegionStats): EpochForecast[] {
  const fluss = s.water + s.furt
  const wasser = fluss + s.lake
  const land = s.flach + s.ufer
  return [
    {
      name: 'Überleben am Wasser, Pfahlbauten',
      years: '10 000–2 000 v. Chr.',
      score: cl(1 + (wasser > 0 ? 1 : 0) + (wasser > 2 ? 1 : 0) + (s.lake > 0 ? 1 : 0) + (s.hang > 0 ? 1 : 0), 1, 5),
      txt:
        'Fischgründe: ' +
        bucket(wasser) +
        ' · Seeufer für Pfahlbauten: ' +
        bucket(s.lake) +
        ' · Höhlen und Terrassen am Hang: ' +
        bucket(s.hang) +
        (wasser === 0 ? ' – ohne Wasser wird der Anfang hart.' : ''),
    },
    {
      name: 'Rätier, Römer, ferne Macht',
      years: '2 000 v. Chr.–500 n. Chr.',
      score: cl(1 + (s.furt > 0 ? 2 : 0) + (land > 3 ? 1 : 0) + (land > 7 ? 1 : 0), 1, 5),
      txt:
        (s.furt > 0
          ? 'Furten ziehen Wege an – Saumpfade, später eine Römerstrasse. '
          : 'Keine Furt: der grosse Verkehr zieht anderswo vorbei. ') +
        'Boden für Gehöfte: ' +
        bucket(land) +
        '.',
    },
    {
      name: 'Klöster, Städte, Konstanz',
      years: '500–1500',
      score: cl(1 + (land > 3 ? 1 : 0) + (land > 7 ? 1 : 0) + (s.furt > 0 ? 1 : 0) + (s.hang > 0 ? 1 : 0), 1, 5),
      txt:
        'Dorf-, Kloster- und Marktland: ' +
        bucket(land) +
        (s.furt > 0 ? ' · an der Furt kann ein Marktort wachsen' : '') +
        (s.hang > 0 ? ' · Weinberge an sonnigen Hängen: ' + bucket(s.hang) : '') +
        '.',
    },
    {
      name: 'Glaube, Grenzen, Schmuggel',
      years: '1500–1800',
      score: cl(1 + (fluss > 0 ? 2 : 0) + (s.hang > 0 ? 1 : 0) + (s.lake > 0 ? 1 : 0), 1, 5),
      txt:
        (fluss > 0
          ? 'Der Fluss wird Grenze – Zollstellen, Fähren, Schmuggelpfade: ' + bucket(fluss) + '. '
          : 'Ohne Fluss keine Grenze – ruhige Zeiten. ') +
        (s.hang > 0 ? 'Alpwirtschaft am Hang: ' + bucket(s.hang) + '.' : ''),
    },
    {
      name: 'Industrie, Rheinkorrektion',
      years: '1800–heute',
      score: cl(1 + (fluss > 0 ? 1 : 0) + (fluss > 2 ? 1 : 0) + (land > 5 ? 1 : 0) + (land > 9 ? 1 : 0), 1, 5),
      txt:
        (fluss > 0
          ? 'Hochwasser und Rheinkorrektion, dann Wasserkraft: ' + bucket(fluss) + '. '
          : '') +
        'Raum für Bahn, Fabriken, wachsende Dörfer: ' +
        bucket(land) +
        '.',
    },
  ]
}

/* ================= Übergabe an den Kernloop ================= */

export function buildRegion(sel: ReadonlySet<string>): RegionCell[] {
  const cells: RegionCell[] = []
  for (const k of sel) {
    const [c, r] = parseKey(k)
    const w = worldCellAt(c, r)
    if (!w) continue
    cells.push({
      r,
      c,
      t: w.t,
      furt: w.furt,
      lakeUfer: w.lakeUfer,
      uferHang: w.uferHang,
      hint: w.hint,
      landmark: w.landmark,
    })
  }
  return cells.sort((a, b) => a.r - b.r || a.c - b.c)
}

/** Startblick: die Talmitte an der Schaaner Furt. */
export const DEFAULT_VIEW = { c: 11, r: 26 }

/* ================= Nebel des Ungespielten (localStorage) ================= */

const FOG_KEY = 'stromlinien-fog-alpenrhein-v1'

export function loadPlayed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FOG_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function savePlayed(played: ReadonlySet<string>): void {
  try {
    localStorage.setItem(FOG_KEY, JSON.stringify([...played]))
  } catch {
    /* Speicher voll oder blockiert — der Nebel vergisst, mehr nicht. */
  }
}
