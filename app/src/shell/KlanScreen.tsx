import { useState } from 'react'
import './shell.css'

/**
 * Klan gründen: heute nur der Name. Der Screen ist als Abschnittsliste
 * angelegt, damit Startparameter-Würfeln, Deck und Ausrüstungskarten
 * später als Abschnitt 02 andocken können, ohne den Screen umzubauen.
 */
export function KlanScreen({
  onCreate,
  onBack,
}: {
  onCreate: (name: string) => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [hint, setHint] = useState('')

  function submit() {
    const n = name.trim()
    if (!n) {
      setHint('Bitte einen Namen eingeben.')
      return
    }
    onCreate(n)
  }

  return (
    <div className="sh">
      <div className="head">
        <button className="back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h2>Klan gründen</h2>
        <span className="tagr">Schritt 1</span>
      </div>
      <div className="scroll">
        <div className="narrow">
          <div className="onbhead">
            <div className="sub">Willkommen am Alpenrhein</div>
            <h1>Wie nennt man euren Stamm?</h1>
          </div>
          <div className="sec">
            <div className="num">01 · Name</div>
            <p>
              Unter diesem Namen liegen euer Nebel des Ungespielten, laufende
              Partien und eure Chronik — <b>zunächst nur auf diesem Gerät</b>.
              Kein Konto, keine Anmeldung.
            </p>
            <input
              type="text"
              value={name}
              maxLength={28}
              placeholder="z. B. Die Ufergänger"
              autoFocus
              onChange={(e) => {
                setName(e.target.value)
                if (hint) setHint('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            <div className="formhint">{hint}</div>
          </div>
          <div className="sec soon">
            <div className="num">02 · Herkunft &amp; Ausrüstung — später</div>
            <h3>Was der Klan mitbringt</h3>
            <p>
              Hier entstehen die Startparameter: würfeln, was euch die Herkunft
              mitgibt, und Deck sowie Ausrüstungskarten zusammenstellen. Der
              Platz ist vorgesehen — die Mechanik folgt.
            </p>
            <div className="chipline">
              <span>Startwerte würfeln</span>
              <span>Deck wählen</span>
              <span>Ausrüstung</span>
            </div>
          </div>
        </div>
      </div>
      <div className="zone">
        <button className="primary" onClick={submit}>
          Klan gründen
        </button>
      </div>
    </div>
  )
}
