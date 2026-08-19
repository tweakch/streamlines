export type EvidenceStatus =
  | 'unbekannt'
  | 'rekonstruiert'
  | 'belegt'
  | 'umstritten'
  | 'dokumentiert-leer'

export type Quality = 'hoch' | 'mittel' | 'niedrig'
export type SpatialPrecision = 'genau' | 'ungefaehr' | 'vage'
export type Stance = 'stuetzt' | 'widerspricht'

export type ClaimId = 'furt-nord' | 'ponton-sued'

export interface Claim {
  id: ClaimId
  title: string
  description: string
  /** Restunsicherheit, die auch nach vollständiger Untersuchung bestehen bleibt. */
  uncertainty: string
}

export type SourceKind =
  | 'Karte'
  | 'Gefechtsbericht'
  | 'Memoiren'
  | 'Naturwissenschaftlicher Befund'

export interface Source {
  id: string
  title: string
  kind: SourceKind
  date: string
  quality: Quality
  precision: SpatialPrecision
  /** Was die Quelle bei Untersuchung preisgibt. */
  finding: string
  /** Position der Quelle zu den Claims dieser Kachel. */
  stance: Partial<Record<ClaimId, Stance>>
}

export interface Tile {
  id: string
  name: string
  epoch: string
  description: string
  claims: Claim[]
  sources: Source[]
}

export interface ScenarioResult {
  outcome: 'erreicht' | 'gescheitert'
  turnsUsed: number
  turnLimit: number
  crossingUsed: ClaimId
  /** true, wenn der ungesicherte Übergang sich im Szenario als unpassierbar erwies. */
  crossingFailed: boolean
}

/** Wie sicher sich der Spieler seiner Hypothese ist — deklariert vor dem Szenario. */
export type Confidence = 'sicher' | 'eher-sicher' | 'unsicher'

export interface ScoreEntry {
  label: string
  points: number
}

export interface RunScore {
  entries: ScoreEntry[]
  total: number
  /** Reputationsstand nach Verbuchung dieses Laufs. */
  newReputation: number
}
