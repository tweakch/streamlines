import './shell.css'
import type { ResumeMeta } from './TitleScreen'

/* Kampagnenstruktur aus dem Handbuch (Kap. 1). Info-Station:
   Epoche I ist spielbar, II–V öffnen sich nach der vorigen. */
const EPOCHS = [
  { n: 'I', name: 'Überleben am Wasser, Pfahlbauten', years: '10 000–2 000 v. Chr.' },
  { n: 'II', name: 'Rätier, Römer, ferne Macht', years: '2 000 v. Chr.–500 n. Chr.' },
  { n: 'III', name: 'Klöster, Städte, Konstanz', years: '500–1500' },
  { n: 'IV', name: 'Glaube, Grenzen, Schmuggel', years: '1500–1800' },
  { n: 'V', name: 'Industrie, Rheinkorrektion', years: '1800–heute' },
]
const ZEREM = [
  '„Sesshaft werden"',
  '„Rückzug und Neuanfang"',
  '(Zeremonie III→IV)',
  '(Zeremonie IV→V)',
]

export function EpochsScreen({
  resume,
  onBack,
  onPlay,
}: {
  resume: ResumeMeta | null
  onBack: () => void
  onPlay: () => void
}) {
  return (
    <div className="sh">
      <div className="head">
        <button className="back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h2>Fünf Epochen, ein Tal</h2>
        <span className="tagr">Kampagne</span>
      </div>
      <div className="scroll">
        <div className="narrow">
          {EPOCHS.map((e, i) => {
            const first = i === 0
            return (
              <div key={e.n}>
                <div className={`eprow${first ? ' now' : ' locked'}`}>
                  <div className="n">{e.n}</div>
                  <div className="info">
                    <b>{e.name}</b>
                    <span>{e.years}</span>
                  </div>
                  <div className="st">
                    {first
                      ? resume
                        ? `läuft · Runde ${resume.round}`
                        : 'bereit'
                      : 'verschlossen'}
                  </div>
                </div>
                {i < ZEREM.length && <div className="zerem">Zeremonie {ZEREM[i]}</div>}
              </div>
            )
          })}
          <p className="kamplegend">
            Jede Epoche ist ein eigenes Modul; die <b>Zeremonie</b> dazwischen
            trägt euer Tal in die nächste Zeit. Verschlossene Epochen öffnen
            sich, wenn die vorige abgeschlossen ist. Historisch inspiriert und
            vereinfacht.
          </p>
        </div>
      </div>
      <div className="zone">
        <button className="primary" onClick={onPlay}>
          {resume
            ? `Epoche I fortsetzen · Runde ${resume.round}`
            : 'Zur Weltkarte — Gebiet wählen'}
        </button>
      </div>
    </div>
  )
}
