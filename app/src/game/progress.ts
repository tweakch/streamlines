import type {
  Confidence,
  EvidenceStatus,
  ScenarioResult,
  ScoreEntry,
} from './types'

/**
 * Persistente Progression (Legacy-lite): Reputation und Fundkatalog
 * überleben den einzelnen Lauf. Reputation belohnt Begründungsgüte,
 * nicht den Szenario-Sieg.
 */

const REP_KEY = 'sot-reputation'
const CATALOG_KEY = 'sot-katalog'

export function loadReputation(): number {
  try {
    const raw = localStorage.getItem(REP_KEY)
    const n = raw === null ? 0 : Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export function loadCatalog(): Set<string> {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    const parsed: unknown = raw === null ? [] : JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

export function persistRun(
  points: number,
  examined: ReadonlySet<string>,
): { reputation: number; catalog: Set<string> } {
  const reputation = loadReputation() + points
  const catalog = loadCatalog()
  examined.forEach((id) => catalog.add(id))
  try {
    localStorage.setItem(REP_KEY, String(reputation))
    localStorage.setItem(CATALOG_KEY, JSON.stringify([...catalog]))
  } catch {
    // Ohne localStorage läuft das Spiel weiter, nur ohne Persistenz.
  }
  return { reputation, catalog }
}

/**
 * Kalibrierungsmatrix: belohnt wird, wenn die deklarierte Gewissheit zur
 * Quellenlage passt — nicht die Gewissheit selbst. Eine umstrittene Annahme
 * selbstsicher zu vertreten kostet Reputation.
 */
const CALIBRATION: Record<string, Record<Confidence, number>> = {
  belegt: { sicher: 3, 'eher-sicher': 2, unsicher: 1 },
  rekonstruiert: { sicher: 1, 'eher-sicher': 3, unsicher: 2 },
  umstritten: { sicher: -2, 'eher-sicher': 1, unsicher: 3 },
}

export const confidenceLabel: Record<Confidence, string> = {
  sicher: 'sicher',
  'eher-sicher': 'eher sicher',
  unsicher: 'unsicher',
}

export function computeScore(
  result: ScenarioResult,
  status: EvidenceStatus,
  confidence: Confidence,
  examinedCount: number,
): { entries: ScoreEntry[]; total: number } {
  const entries: ScoreEntry[] = []

  if (examinedCount > 0) {
    entries.push({
      label: `Quellen katalogisiert (${examinedCount})`,
      points: examinedCount,
    })
  }

  const calibration = CALIBRATION[status]?.[confidence] ?? 0
  entries.push({
    label: `Kalibrierung: Quellenlage «${status}», Urteil «${confidenceLabel[confidence]}»`,
    points: calibration,
  })

  entries.push(
    result.outcome === 'erreicht'
      ? { label: 'Auftrag des Generalstabs erfüllt', points: 2 }
      : { label: 'Auftrag nicht erfüllt', points: 0 },
  )

  const total = entries.reduce((sum, e) => sum + e.points, 0)
  return { entries, total }
}

/** Wahrscheinlichkeit, dass ein Übergang im Szenario tatsächlich trägt. */
export function crossingReliability(status: EvidenceStatus): number {
  switch (status) {
    case 'belegt':
      return 1
    case 'rekonstruiert':
      return 0.75
    case 'umstritten':
      return 0.5
    default:
      return 0
  }
}
