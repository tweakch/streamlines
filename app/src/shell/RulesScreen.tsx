import './shell.css'

export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="sh">
      <div className="head">
        <button className="back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h2>Regeln</h2>
        <span className="tagr">Kurzfassung</span>
      </div>
      <div className="scroll">
        <div className="narrow">
          <div className="rul">
            <b>Tag &amp; Nacht</b>
            <p>
              Am <span className="g">Tag</span> legst du ein Plättchen, kassierst
              Einkommen und bewegst deine Menschen. In der{' '}
              <span className="g">Nacht</span> deckst du auf, was im Dunkeln
              geschah — der Stamm isst −1 Nahrung.
            </p>
          </div>
          <div className="rul">
            <b>Vier Ressourcen</b>
            <p>
              Nahrung, Schutz, Baumaterial, Kultur. Fortschritt („Sesshaftigkeit")
              bringt pro Runde nur die <span className="g">schwächste</span>{' '}
              Ressource — wer eine vernachlässigt, kommt nicht voran.
            </p>
          </div>
          <div className="rul">
            <b>Zwei Menschen</b>
            <p>
              Die <span className="g">Sammlerin ✦</span> bewirtschaftet ihr
              Plättchen (+1 Ertrag), der <span className="g">Jäger ➤</span> gibt
              +2 Schutz, solange er im Tal steht. Höchstens zwei Schritte pro
              Tag; über den Fluss nur an <span className="g">Furten</span>.
            </p>
          </div>
          <div className="rul">
            <b>Verbünde</b>
            <p>
              Nachbarschaft zählt: Fischgrund oder Wald neben einem Lager liefern
              mehr, Höhle neben Terrasse schützt besser, zwei Pfahlbauten werden
              zum Dorf.
            </p>
          </div>
          <div className="rul">
            <b>◆ Belegte Ereignisse</b>
            <p>
              Manche Nächte geschehen in jeder Partie zur selben Zeit — sie sind
              wirklich passiert. Beim ersten Mal überraschen sie dich, beim
              zweiten bist du ein Zeitreisender.
            </p>
          </div>
          <div className="rul">
            <b>Fundstellen</b>
            <p>
              Echte (vereinfachte) Fundplätze liegen verdeckt im Tal. Wer das
              passende Plättchen am richtigen Ort baut, entdeckt sie — Kultur
              und Authentizität steigen.
            </p>
          </div>
          <div className="rul">
            <b>Die Zeremonie</b>
            <p>
              Am Ende jeder Epoche pausiert Tag/Nacht: Fünf Karten tragen euer
              Tal in die nächste Zeit — mit echten Entscheidungen und dem
              Realitätsabgleich.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
