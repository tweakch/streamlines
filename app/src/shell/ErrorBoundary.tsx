import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import './shell.css'
import {
  activeProfile,
  clearSave,
  loadProfileStore,
  loadSave,
  regionLabel,
} from './storage'

/*
 * Fehlerfall-Karte statt weissem Bildschirm (Port aus spielmenue-v1).
 *
 * Sie funktioniert nur, weil der Autosave darunterliegt: nach jeder Aktion
 * steht ein vollständiger Stand in localStorage, also ist ein Absturz kein
 * Datenverlust, sondern ein Neuladen. Die Karte sagt genau das — mit Runde
 * und Alter des Stands, damit man es nicht glauben muss.
 */

interface State {
  err: Error | null
}

function letzterStand(): string {
  const store = loadProfileStore()
  const profile = activeProfile(store)
  if (!profile) return 'Es läuft keine Partie — es kann nichts verloren gehen.'
  const save = loadSave(profile.id)
  if (!save) return 'Es läuft keine Partie — es kann nichts verloren gehen.'
  const alter = Math.max(0, Math.round((Date.now() - save.savedAt) / 1000))
  const min = Math.round(alter / 60)
  const wann =
    alter < 60
      ? `vor ${alter} Sekunde${alter === 1 ? '' : 'n'}`
      : `vor ${min} Minute${min === 1 ? '' : 'n'}`
  const phase = save.state.phase === 'night' ? 'Nacht' : 'Tag'
  return `Der letzte gespeicherte Stand ist ${regionLabel(
    save.state.region,
  )}, Runde ${save.state.round}, ${phase} — ${wann}. Nichts vor diesem Punkt geht verloren.`
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    /* Sichtbar in der Konsole bleiben — die Karte ersetzt den Absturz für
       den Spieler, nicht die Diagnose für die Entwicklung. */
    console.error('Stromlinien: Ansicht abgestürzt', err, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.err) return this.props.children
    return (
      <div className="sh errwrap">
        <div className="errorcard">
          <div className="tag">Etwas ist schiefgelaufen</div>
          <h3>Die Ansicht ist abgestürzt.</h3>
          <p>Kein Grund zur Sorge — {letzterStand()}</p>
          <div className="row">
            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              Aus Autosave wiederherstellen
            </button>
            <button
              className="ghost"
              onClick={() => {
                const p = activeProfile(loadProfileStore())
                if (p) clearSave(p.id)
                window.location.reload()
              }}
            >
              Neue Partie beginnen
            </button>
          </div>
          <p className="errdetail">{this.state.err.message}</p>
        </div>
      </div>
    )
  }
}
