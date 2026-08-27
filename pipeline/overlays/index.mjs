/*
 * overlays/index.mjs — die Registry.
 *
 * Ein Overlay hinzuzufügen heisst: eine Datei schreiben und sie hier
 * eintragen. Sonst nichts — Speicher, Auslieferung, Protokoll und Viewer
 * ziehen alles Weitere aus der Deklaration.
 *
 * Pflichtfelder eines Overlays:
 *   id, name, gruppe, kodierung, ebenen[], quellen[], berechne(ctx)
 * Optional:
 *   einheit, notiz, klassen{} (kategorial), skala{} (kontinuierlich),
 *   braucht[] (andere Overlays derselben Ebene — die Reihenfolge ergibt
 *   sich daraus von selbst), ersetztDurch, mapper
 */
import { hoehe, steigung, relief, exposition, seegrund } from './grund.mjs'
import { wasser } from './wasser.mjs'
import { gangbarkeit, erhaltung } from './abgeleitet.mjs'
import { fels, boden, fundstelle } from './geocover.mjs'

export const OVERLAYS = [
  wasser,
  hoehe,
  steigung,
  relief,
  exposition,
  seegrund,
  gangbarkeit,
  erhaltung,
  fels,
  boden,
  fundstelle,
]

/** Topologische Ordnung nach `braucht`. Wirft bei Zyklen und Lücken. */
export function reihenfolge(overlays = OVERLAYS) {
  const nachId = new Map(overlays.map((o) => [o.id, o]))
  const fertig = new Set()
  const laufend = new Set()
  const out = []
  const besuche = (o) => {
    if (fertig.has(o.id)) return
    if (laufend.has(o.id))
      throw new Error(`Overlay-Zyklus über „${o.id}"`)
    laufend.add(o.id)
    for (const b of o.braucht ?? []) {
      const dep = nachId.get(b)
      if (!dep) throw new Error(`Overlay „${o.id}" braucht „${b}" — gibt es nicht`)
      besuche(dep)
    }
    laufend.delete(o.id)
    fertig.add(o.id)
    out.push(o)
  }
  for (const o of overlays) besuche(o)
  return out
}

/** Prüft die Deklarationen, bevor irgendetwas gerechnet wird. */
export function pruefeRegistry(overlays = OVERLAYS) {
  const ids = new Set()
  for (const o of overlays) {
    for (const feld of ['id', 'name', 'gruppe', 'kodierung', 'ebenen', 'quellen'])
      if (!o[feld]) throw new Error(`Overlay ohne ${feld}: ${o.id ?? '(namenlos)'}`)
    if (typeof o.berechne !== 'function')
      throw new Error(`Overlay „${o.id}" hat kein berechne()`)
    if (ids.has(o.id)) throw new Error(`Overlay-Id doppelt: ${o.id}`)
    ids.add(o.id)
    if (o.klassen)
      for (const [k, v] of Object.entries(o.klassen))
        if (!(v.wert > 0))
          throw new Error(`Overlay „${o.id}", Klasse „${k}": wert muss > 0 sein (0 heisst unbekannt)`)
  }
  return overlays
}
