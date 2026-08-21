export type Terrain = 'flach' | 'hang' | 'ufer' | 'water' | 'lake'

/** Kategorien der Zeichen ◈ auf der Weltkarte. */
export type HintCat = 'wasser' | 'stein' | 'land' | 'fund'

/**
 * Eine Zelle der gestalteten Weltkarte, wie der Startbildschirm sie an den
 * Kernloop übergibt. r/c sind Weltkoordinaten (odd-r offset) und bleiben es
 * auch im Spiel – Fundstellen und Landmarken sind daran gebunden.
 */
export interface RegionCell {
  r: number
  c: number
  t: Terrain
  furt: boolean
  lakeUfer: boolean
  uferHang: boolean
  hint: HintCat | null
  landmark: string | null
}

export type TileKind =
  | 'fisch'
  | 'ufer'
  | 'wald'
  | 'terrasse'
  | 'hoehle'
  | 'flint'
  | 'pfahl'

export interface Cell {
  idx: number
  /** Weltkoordinate Reihe (odd-r offset). */
  r: number
  /** Weltkoordinate Spalte. */
  c: number
  t: Terrain
  tile: TileKind | null
  /** Land direkt am See — Pfahlbau-tauglich. */
  lakeUfer: boolean
  /** Hang, der zugleich Ufer ist. */
  uferHang: boolean
  furt: boolean
  /** Zeichen ◈ der Weltkarte auf diesem Feld. */
  hint: HintCat | null
  /** Landmarke der gestalteten Weltkarte (z. B. „Schaaner Furt"). */
  landmark: string | null
}

export type PersonId = 'sammler' | 'jaeger'

export interface PersonState {
  cellIdx: number | null
  moved: boolean
}

export interface PlacedTile {
  type: TileKind
  cellIdx: number
}

export interface NightResult {
  txt: string
  good: boolean
}

/**
 * Ein Eintrag der Chronik. Sie ersetzt den einzelnen `lastEvent`-String:
 * dieselbe Quelle bedient jetzt den Morgenbericht („was die Nacht
 * hinterliess"), die Resume-Karten der Shell und später den Chronik-Screen.
 */
export interface ChronikEintrag {
  round: number
  art: 'nacht' | 'anker' | 'fund' | 'wahl'
  txt: string
}

export type Overlay =
  | { kind: 'fund'; fundIdx: number }
  | {
      kind: 'night'
      anchor: boolean
      tag: string
      h: string
      p: string
      glyph: string | null
      result: NightResult
    }
  | null

export type GamePhase =
  | 'intro'
  | 'day'
  | 'night'
  | 'ceremony'
  | 'gameover'
  | 'final'

export interface GameState {
  phase: GamePhase
  round: number
  n: number
  s: number
  b: number
  k: number
  prog: number
  placedThisDay: number
  hand: TileKind[]
  pending: TileKind[]
  tiles: PlacedTile[]
  cells: Cell[]
  /** Das gewählte Weltkarten-Gebiet — Quelle für RESTART. */
  region: RegionCell[]
  woodBoost: boolean
  pfahlUnlocked: boolean
  fishBlocked: boolean
  extraDraw: boolean
  hungry: number
  authGot: number
  authMax: number
  /** parallel zu FUND */
  fundFound: boolean[]
  werkzeug: boolean
  people: Record<PersonId, PersonState>
  combos: string[]
  overlay: Overlay
  /** Nacht angebrochen, Ereignis noch nicht aufgedeckt. */
  nightPending: boolean
  /**
   * Gewählte Antwort je Anker-Runde (Index in ANCHORS[r].antworten).
   * Das Handlungsfenster steht von der Vorzeichen-Runde bis zum Tag des
   * Einschlags offen; danach liest `fx` die Wahl und der Ausgang hängt daran.
   */
  antwort: Record<number, number>
  /** Jüngster Eintrag zuletzt; auf die letzten 40 begrenzt. */
  chronik: ChronikEintrag[]
  toast: { msg: string; id: number } | null
  ceremStep: number
  ceremFundament: 'pfahl' | 'ufer' | 'none'
}
