import type { ClaimId, EvidenceStatus, Source } from './types'

/**
 * Leitet den Evidenzstatus eines Claims aus den bisher untersuchten Quellen ab.
 * Der Status ist nie direkt gesetzt — er ist immer eine Funktion der Quellenlage.
 */
export function deriveStatus(
  claimId: ClaimId,
  sources: Source[],
  examined: ReadonlySet<string>,
): EvidenceStatus {
  const relevant = sources.filter(
    (s) => examined.has(s.id) && s.stance[claimId] !== undefined,
  )
  if (relevant.length === 0) return 'unbekannt'

  const pro = relevant.filter((s) => s.stance[claimId] === 'stuetzt')
  const contra = relevant.filter((s) => s.stance[claimId] === 'widerspricht')

  if (pro.length > 0 && contra.length > 0) return 'umstritten'
  if (pro.length === 0) return 'dokumentiert-leer'
  return pro.some((s) => s.quality === 'hoch') ? 'belegt' : 'rekonstruiert'
}

export const statusLabel: Record<EvidenceStatus, string> = {
  unbekannt: 'Unbekannt',
  rekonstruiert: 'Rekonstruiert',
  belegt: 'Belegt',
  umstritten: 'Umstritten',
  'dokumentiert-leer': 'Dokumentiert leer',
}

/** Nur Claims mit diesen Status dürfen als Hypothese für das Szenario dienen. */
export function isPlayableHypothesis(status: EvidenceStatus): boolean {
  return (
    status === 'belegt' || status === 'rekonstruiert' || status === 'umstritten'
  )
}
