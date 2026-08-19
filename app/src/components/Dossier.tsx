import type {
  ClaimId,
  Confidence,
  EvidenceStatus,
  Source,
  Tile,
} from '../game/types'
import { isPlayableHypothesis, statusLabel } from '../game/evidence'
import { confidenceLabel, crossingReliability } from '../game/progress'

const claimShort: Record<ClaimId, string> = {
  'furt-nord': 'Furt Nord',
  'ponton-sued': 'Ponton Süd',
}

const qualityLabel = { hoch: 'hohe Qualität', mittel: 'mittlere Qualität', niedrig: 'geringe Qualität' }
const precisionLabel = { genau: 'räumlich genau', ungefaehr: 'räumlich ungefähr', vage: 'räumlich vage' }

const CONFIDENCES: Confidence[] = ['sicher', 'eher-sicher', 'unsicher']

interface Props {
  tile: Tile
  examined: ReadonlySet<string>
  statuses: Record<ClaimId, EvidenceStatus>
  hypothesis: ClaimId | null
  confidence: Confidence | null
  seasonsLeft: number
  seasonsTotal: number
  catalog: ReadonlySet<string>
  onExamine: (sourceId: string) => void
  onHypothesis: (claim: ClaimId) => void
  onConfidence: (c: Confidence) => void
  onStart: () => void
}

export function Dossier({
  tile,
  examined,
  statuses,
  hypothesis,
  confidence,
  seasonsLeft,
  seasonsTotal,
  catalog,
  onExamine,
  onHypothesis,
  onConfidence,
  onStart,
}: Props) {
  const anyExamined = examined.size > 0
  const canStart =
    hypothesis !== null &&
    isPlayableHypothesis(statuses[hypothesis]) &&
    confidence !== null

  return (
    <div className="dossier">
      <header className="dossier-head">
        <p className="eyebrow">{tile.epoch}</p>
        <h2>{tile.name}</h2>
        <p className="dossier-question">{tile.description}</p>
      </header>

      <section className="auftrag" aria-labelledby="auftrag-h">
        <h3 id="auftrag-h">Forschungsauftrag</h3>
        <p>
          Der Generalstab verlangt Klarheit über die Übergangsfrage bei
          Dietikon. Deine Feldzeit ist begrenzt — dann muss deine Einschätzung
          stehen. Ertrag: Reputation nach Begründungsgüte.
        </p>
        <p className="season-budget">
          Feldzeit: <strong>{seasonsLeft}</strong> von {seasonsTotal} Saisons
          übrig — jede Untersuchung kostet eine Saison.
        </p>
      </section>

      <section aria-labelledby="claims-h">
        <h3 id="claims-h">Behauptungen</h3>
        <ul className="claim-list">
          {tile.claims.map((claim) => (
            <li key={claim.id} className="claim">
              <div className="claim-text">
                <strong>{claim.title}</strong>
                <p>{claim.description}</p>
              </div>
              <span
                key={statuses[claim.id]}
                className={`stamp status-${statuses[claim.id]}`}
              >
                {statusLabel[statuses[claim.id]]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sources-h">
        <h3 id="sources-h">Quellen</h3>
        <ul className="source-list">
          {tile.sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              examined={examined.has(source.id)}
              known={catalog.has(source.id)}
              disabled={seasonsLeft === 0}
              onExamine={() => onExamine(source.id)}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="hyp-h" className="hypothesis">
        <h3 id="hyp-h">Hypothese</h3>
        {!anyExamined ? (
          <p className="hint">
            Untersuche zuerst mindestens eine Quelle — ohne Quellenlage gibt es
            nichts zu begründen.
          </p>
        ) : (
          <>
            <p className="hint">Wo überquerst du die Limmat?</p>
            {tile.claims.map((claim) => {
              const status = statuses[claim.id]
              const playable = isPlayableHypothesis(status)
              const reliability = crossingReliability(status)
              return (
                <label
                  key={claim.id}
                  className={`hyp-option${playable ? '' : ' disabled'}`}
                >
                  <input
                    type="radio"
                    name="hypothese"
                    checked={hypothesis === claim.id}
                    disabled={!playable}
                    onChange={() => onHypothesis(claim.id)}
                  />
                  <span className="hyp-body">
                    <span>
                      {claim.title}
                      <em> — {statusLabel[status].toLowerCase()}</em>
                    </span>
                    {playable ? (
                      <span className="rel-line">
                        <span
                          className="rel-meter"
                          role="img"
                          aria-label={`Verlässlichkeit ${Math.round(reliability * 100)} Prozent`}
                        >
                          <span
                            className={`rel-fill${reliability < 0.6 ? ' low' : ''}`}
                            style={{ width: `${reliability * 100}%` }}
                          />
                        </span>
                        <em>trägt zu {Math.round(reliability * 100)} %</em>
                      </span>
                    ) : (
                      <span className="rel-line">
                        <em>keine begründbare Querung — erst Quellen finden</em>
                      </span>
                    )}
                  </span>
                </label>
              )
            })}

            {hypothesis && (
              <>
                <p className="hint confidence-q">
                  Wie sicher bist du, dass dieser Übergang 1799 nutzbar war?
                </p>
                <div className="confidence-row">
                  {CONFIDENCES.map((c) => (
                    <label key={c} className="hyp-option">
                      <input
                        type="radio"
                        name="konfidenz"
                        checked={confidence === c}
                        onChange={() => onConfidence(c)}
                      />
                      <span>{confidenceLabel[c]}</span>
                    </label>
                  ))}
                </div>
                <p className="hint">
                  Bewertet wird nicht die Gewissheit, sondern ob sie zur
                  Quellenlage passt.
                </p>
              </>
            )}

            <button
              type="button"
              className="primary"
              disabled={!canStart}
              onClick={onStart}
            >
              Szenario beginnen
            </button>
            {hypothesis && statuses[hypothesis] === 'umstritten' && (
              <p className="warning">
                Du stützt dich auf eine umstrittene Annahme. Ob der Übergang
                trägt, zeigt sich erst, wenn deine Kolonne ihn betritt.
              </p>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="katalog-h" className="katalog">
        <h3 id="katalog-h">Fundkatalog</h3>
        <p className="hint">
          Dauerhaft katalogisiert — über alle Untersuchungen hinweg.
        </p>
        <ul className="katalog-list">
          {tile.sources.map((source) => (
            <li
              key={source.id}
              className={`katalog-chip${catalog.has(source.id) || examined.has(source.id) ? ' collected' : ''}`}
            >
              {source.kind}
              {source.date ? ` · ${source.date}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function SourceCard({
  source,
  examined,
  known,
  disabled,
  onExamine,
}: {
  source: Source
  examined: boolean
  known: boolean
  disabled: boolean
  onExamine: () => void
}) {
  const stances = Object.entries(source.stance) as Array<
    [ClaimId, 'stuetzt' | 'widerspricht']
  >

  return (
    <li className={`source${examined ? ' examined' : ''}`}>
      <div className="source-head">
        <div>
          <strong>{source.title}</strong>
          <p className="source-meta">
            {source.kind} · {source.date} · {qualityLabel[source.quality]} ·{' '}
            {precisionLabel[source.precision]}
            {known && !examined && ' · bereits katalogisiert'}
          </p>
          <p className="stance-row">
            {stances.map(([claimId, stance]) => (
              <span
                key={claimId}
                className={`stance-chip${examined ? ` ${stance}` : ''}`}
              >
                {examined
                  ? `${stance === 'stuetzt' ? '✓ stützt' : '✗ widerspricht'} ${claimShort[claimId]}`
                  : `betrifft ${claimShort[claimId]}`}
              </span>
            ))}
          </p>
        </div>
        {!examined && (
          <button type="button" disabled={disabled} onClick={onExamine}>
            Untersuchen · 1 Saison
          </button>
        )}
      </div>
      {examined && <p className="source-finding">{source.finding}</p>}
    </li>
  )
}
