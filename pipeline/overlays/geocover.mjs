/*
 * overlays/geocover.mjs — Untergrund und Fundstellen aus swissGEOCOVER2D.
 *
 * Die Mapper stehen (pipeline/mappers/geocover-*.json), die Geometrie fehlt:
 * swissGEOCOVER2D muss als GeoPackage/INTERLIS geladen, von MN95 nach WGS84
 * transformiert und als sources/geocover-*.geo.json normalisiert werden.
 *
 * Diese Overlays melden sich trotzdem an — mit `quelleFehlt` und einer
 * Eingabe von 0. Das ist Absicht: eine fehlende Quelle soll im Bericht
 * SICHTBAR sein, nicht durch Abwesenheit verschwinden. Genau so ist der
 * Genfersee einmal aus dem Datensatz gefallen, ohne dass es jemand merkte.
 */
import { ladeMapper } from '../lib/mapper.mjs'

function ausMapper(id, meta) {
  /* Einmal für die DEKLARATION — die Klassen des Overlays sind dieselben,
     egal auf welcher Ebene gerechnet wird. */
  const deklaration = ladeMapper(id)
  return {
    ...meta,
    kodierung: 'uint8 · Klassen',
    mapper: id,
    klassen: Object.fromEntries(
      Object.entries(deklaration.klassen).map(([k, v]) => [k, v]),
    ),
    berechne(ctx) {
      /* Und je Lauf einmal frisch für die ZÄHLUNG. Ein Mapper zählt seine
         Treffer intern mit; dieselbe Instanz über zwei Ebenen zu führen
         summiert sie auf, und `buche()` verbucht auf Ebene 2 dann auch noch
         die Treffer der Ebene 1. Die Bilanz ginge um genau den Faktor 2 nicht
         auf — und tat es lange nicht, weil ohne Geometrie alle Zähler auf 0
         standen und 0 = 0 auf jeder Ebene aufgeht. Aufgefallen ist es in der
         Sekunde, in der die Quelle da war: „gelesen 20155, verbucht 40310". */
      const M = ladeMapper(id)
      const L = ctx.ledger(meta.quellen[0])
      const werte = ctx.neuesFeld()
      const merkmale = ctx.merkmale(meta.kinds)
      let getroffen = 0
      let ohneZelle = 0
      for (const f of merkmale) {
        const code = f.properties.code ?? f.properties.geolcode
        const t = M.uebersetze(code)
        if (!t) continue
        let n = 0
        if (f.geometry.type === 'Point') {
          const i = ctx.zelleBei(f.geometry.coordinates)
          if (i !== null) { werte[i] = t.wert; n++ }
        } else {
          const ringe =
            f.geometry.type === 'Polygon'
              ? [f.geometry.coordinates[0]]
              : f.geometry.coordinates.map((p) => p[0])
          for (const ring of ringe)
            for (const i of ctx.zellenInPolygon(ring)) { werte[i] = t.wert; n++ }
        }
        if (n) getroffen += n
        else ohneZelle++
      }
      /* Grundgesamtheit: jedes Merkmal einmal, plus die getroffenen Zellen
         der übersetzten. Der Mapper bucht seine eigene Bilanz. */
      L.gelesen(merkmale.length)
      M.buche(L)
      if (ohneZelle)
        L.ausgestossen(0, 'Merkmale ohne getroffene Zelle', {
          grund: `kleiner als eine Zelle (${ohneZelle} Stück, in obiger Zahl enthalten)`,
        })
      if (!merkmale.length)
        L.ausgestossen(0, 'Quelle nicht geladen', {
          grund:
            'swissGEOCOVER2D fehlt in sources/ — Mapper steht bereit, Geometrie nicht',
        })
      L.abschluss()
      return { werte, ledger: L, quelleFehlt: merkmale.length === 0 }
    },
  }
}

export const fels = ausMapper('geocover-fels', {
  id: 'fels',
  name: 'Fels',
  gruppe: 'anlage',
  einheit: null,
  ebenen: [1, 2],
  quellen: ['geocover-fels.geo.json'],
  kinds: ['fels'],
  notiz:
    'Anstehendes Festgestein, nach dem klassiert, was es dem Menschen gibt: Kieselgestein → Silex, Kalk → Karst und Höhlen, Kristallin → Beilklingen.',
})

export const boden = ausMapper('geocover-boden', {
  id: 'boden',
  name: 'Boden',
  gruppe: 'anlage',
  einheit: null,
  ebenen: [1, 2],
  quellen: ['geocover-boden.geo.json'],
  kinds: ['lockergestein'],
  notiz:
    'Lockergestein. Ersetzt das Platzhalter-Overlay `erhaltung`, sobald die Geometrie da ist: torfig erhält Organisches, kiesig erhält nichts.',
})

export const fundstelle = ausMapper('geocover-fundstellen', {
  id: 'fundstelle',
  name: 'Fundstellen',
  gruppe: 'anlage',
  einheit: null,
  ebenen: [1, 2],
  quellen: ['geocover-archaeologie.geo.json'],
  kinds: ['archaeologie'],
  notiz:
    'UNGEPRÜFT: das INTERLIS-Modell definiert diese Klassen, der Datenbestand füllt sie vielleicht nicht. Höhlensiedlung und Pfahlbau decken sich eins zu eins mit den Plättchen `hoehle` und `pfahl`.',
})
