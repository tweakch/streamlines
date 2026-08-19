import type {
  ClaimId,
  Confidence,
  EvidenceStatus,
  RunScore,
  ScenarioResult,
  Tile,
} from '../game/types'
import { statusLabel } from '../game/evidence'
import { confidenceLabel } from '../game/progress'

interface Props {
  tile: Tile
  result: ScenarioResult
  statuses: Record<ClaimId, EvidenceStatus>
  examined: ReadonlySet<string>
  confidence: Confidence
  score: RunScore
  onRestart: () => void
}

/**
 * Debrief: Annahme gegen Quellenlage gegen Restunsicherheit — plus die
 * Reputationsabrechnung. Bewertet wird die Begründung, nicht der Sieg.
 */
export function Debrief({
  tile,
  result,
  statuses,
  examined,
  confidence,
  score,
  onRestart,
}: Props) {
  const claim = tile.claims.find((c) => c.id === result.crossingUsed)!
  const status = statuses[claim.id]
  const pro = tile.sources.filter(
    (s) => examined.has(s.id) && s.stance[claim.id] === 'stuetzt',
  )
  const contra = tile.sources.filter(
    (s) => examined.has(s.id) && s.stance[claim.id] === 'widerspricht',
  )
  const unexamined = tile.sources.filter((s) => !examined.has(s.id))

  return (
    <div className="debrief">
      <p className="eyebrow">Debrief · Limmatraum Dietikon · 1799</p>
      <h2>
        {result.outcome === 'erreicht'
          ? `Ostufer erreicht — in ${result.turnsUsed} von ${result.turnLimit} Zügen.`
          : result.crossingFailed
            ? 'Der Übergang trug nicht — das Ostufer blieb unerreichbar.'
            : 'Das Ostufer wurde nicht erreicht.'}
      </h2>
      <p className="debrief-note">
        Die Simulation ist beendet. Sie war kontrafaktisch — geblieben ist,
        was du über die Quellenlage weisst.
      </p>

      <div className="debrief-grid">
        <section>
          <h3>Deine Annahme</h3>
          <p>
            <strong>{claim.title}</strong>
          </p>
          <p>{claim.description}</p>
          <p>
            Quellenlage:{' '}
            <span className={`stamp status-${status}`}>{statusLabel[status]}</span>
          </p>
          <p>
            Dein Urteil: <strong>{confidenceLabel[confidence]}</strong>
          </p>
        </section>

        <section>
          <h3>Was die Quellen hergeben</h3>
          {pro.length > 0 && (
            <>
              <p className="src-group">Dafür:</p>
              <ul>
                {pro.map((s) => (
                  <li key={s.id}>
                    {s.title} ({s.date}) — {s.quality === 'hoch' ? 'starke' : s.quality === 'mittel' ? 'mittlere' : 'schwache'} Quelle
                  </li>
                ))}
              </ul>
            </>
          )}
          {contra.length > 0 && (
            <>
              <p className="src-group">Dagegen:</p>
              <ul>
                {contra.map((s) => (
                  <li key={s.id}>
                    {s.title} ({s.date})
                  </li>
                ))}
              </ul>
            </>
          )}
          {pro.length === 0 && contra.length === 0 && (
            <p>Du hast keine Quelle untersucht, die diese Annahme betrifft.</p>
          )}
          {unexamined.length > 0 && (
            <p className="src-group muted">
              Nicht untersucht: {unexamined.map((s) => s.title).join(' · ')}
            </p>
          )}
        </section>

        <section>
          <h3>Was offen bleibt</h3>
          <p>{claim.uncertainty}</p>
          {status === 'umstritten' && result.outcome === 'erreicht' && (
            <p className="warning">
              Deine Route beruhte auf einer umstrittenen Annahme. Taktisch hat
              sie funktioniert — historisch ist sie nicht besser begründet als
              vorher.
            </p>
          )}
          {result.crossingFailed && (
            <p className="warning">
              Diesmal trug der Übergang nicht. Das beweist nichts über 1799 —
              es zeigt nur, was deine Quellenlage offenliess.
            </p>
          )}
        </section>
      </div>

      <section className="score-card" aria-labelledby="score-h">
        <h3 id="score-h">Reputation</h3>
        <table className="score-table">
          <tbody>
            {score.entries.map((entry) => (
              <tr key={entry.label}>
                <td>{entry.label}</td>
                <td className={entry.points < 0 ? 'neg' : entry.points > 0 ? 'pos' : ''}>
                  {entry.points > 0 ? `+${entry.points}` : entry.points}
                </td>
              </tr>
            ))}
            <tr className="score-total">
              <td>Ertrag dieses Laufs</td>
              <td>{score.total > 0 ? `+${score.total}` : score.total}</td>
            </tr>
          </tbody>
        </table>
        <p className="score-standing">
          Reputation gesamt: <strong>{score.newReputation}</strong>
        </p>
      </section>

      <button type="button" className="primary" onClick={onRestart}>
        Neue Untersuchung beginnen
      </button>
    </div>
  )
}
