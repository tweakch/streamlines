import './shell.css'

export function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="sh">
      <div className="head">
        <button className="back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h2>Über dieses Spiel</h2>
        <span className="tagr">Stromlinien</span>
      </div>
      <div className="scroll">
        <div className="narrow ueber">
          <p>
            <b>STROMLINIEN</b> erzählt die Geschichte des Alpenrheintals von
            Landquart bis Konstanz — von den ersten Lagern am Wasser bis zur
            Rheinkorrektion. Gespielt wird auf einer gestalteten Weltkarte mit
            echten Orten.
          </p>
          <div className="box">
            <b>Historisch inspiriert und vereinfacht.</b> Ereignisse,
            Fundstellen und Jahreszahlen sind für das Spiel vereinfacht und
            gerundet. Was als „belegt" markiert ist, bezeichnet den angestrebten
            Datenstandard — die Recherche läuft.
          </div>
          <p>
            Belegte Ereignisse geschehen in jeder Partie zur selben Zeit;
            Fundstellen liegen dort, wo wirklich gegraben wurde. Das Spiel
            belohnt historisch plausibles Bauen — es verbietet nichts.
          </p>
          <p>
            Mehr zum Design — was entschieden ist und was geplant:{' '}
            <a href="/handbuch/">im Handbuch</a>.
          </p>
          <p>
            Eure Daten (Klan, Nebel, Spielstände) bleiben auf diesem Gerät —
            es gibt kein Konto und keinen Server dahinter.
          </p>
        </div>
      </div>
    </div>
  )
}
