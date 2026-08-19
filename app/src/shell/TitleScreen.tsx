import './shell.css'
import type { Profile } from './storage'

export interface ResumeMeta {
  round: number
  label: string
  lastEvent: string | null
}

/** Titelbild (Title Screen): Marke, dynamische CTA, Resume-Karte mit Kontext. */
export function TitleScreen({
  profile,
  resume,
  onPlay,
  onResume,
  onWorld,
  onNav,
}: {
  profile: Profile | null
  resume: ResumeMeta | null
  onPlay: () => void
  onResume: () => void
  onWorld: () => void
  onNav: (s: 'regeln' | 'ueber') => void
}) {
  return (
    <div className="sh">
      <div className="titelart">
        <div className="kicker">Ein Fluss · Zwölftausend Jahre</div>
        <h1 className="wordmark">
          STROM
          <br />
          LINIEN
        </h1>
        <p className="titeltag">
          Die Geschichte des Alpenrheintals — Plättchen für Plättchen, Nacht für
          Nacht.
        </p>
        <div className="riverline" />
        <div className="hexdeco">
          <i className="h" />
          <i />
          <i className="w" />
          <i className="w" />
          <i />
          <i />
          <i className="h" />
        </div>
      </div>
      <div className="zone">
        {resume && (
          <div className="resume" onClick={onResume}>
            <div className="tg">Laufende Partie · tippen zum Fortsetzen</div>
            <h3>{resume.label}</h3>
            <div className="meta">
              Epoche I · Runde {resume.round} / 10
              {profile ? ` · ${profile.name}` : ''}
            </div>
            <div className="bar">
              <i style={{ width: `${Math.round((resume.round / 10) * 100)}%` }} />
            </div>
            {resume.lastEvent && (
              <div className="last">
                <span className="k">zuletzt</span>
                <span>{resume.lastEvent}</span>
              </div>
            )}
          </div>
        )}
        <button className="primary" onClick={resume ? onResume : onPlay}>
          {resume ? 'Weiterspielen' : 'Spielen'}
        </button>
        <div className="subrow">
          {profile && <button className="ghost" onClick={onWorld}>Weltkarte</button>}
          <button className="ghost" onClick={() => onNav('regeln')}>
            Regeln
          </button>
          <button className="ghost" onClick={() => onNav('ueber')}>
            Über
          </button>
        </div>
        <div className="titelfoot">historisch inspiriert und vereinfacht</div>
      </div>
    </div>
  )
}
