/*
 * overlays/wasser.mjs — Wasser aus den Vektorquellen (OSM + handkuratiert).
 *
 * Anders als die Rasterquellen kommt Wasser als Geometrie herein: Polygone
 * (See, Meer) und Linien (Hauptlauf, Nebenläufe). Beides wird auf das Hexnetz
 * gerastert. Das ist eine Aggregation — ein 2-km-Feld ist nie „ganz Fluss" —
 * und wird auch so protokolliert.
 */

export const wasser = {
  id: 'wasser',
  name: 'Wasser',
  gruppe: 'grund',
  einheit: null,
  kodierung: 'uint8 · Klassen',
  ebenen: [0, 1, 2],
  quellen: [
    'osm-rhein-hauptlauf.geo.json',
    'osm-fluesse.geo.json',
    'osm-seen.geo.json',
    'handkuratiert.rhein.geo.json',
  ],
  notiz:
    'Hauptlauf schlägt Nebenlauf, See und Meer bleiben stehen. Ufer wird nicht hier abgeleitet — das tut das Terrain im Tileset.',
  klassen: {
    fluss: { wert: 1, name: 'Hauptlauf', farbe: '#3d7ea6' },
    zufluss: { wert: 2, name: 'Zufluss', farbe: '#6fa8c4' },
    see: { wert: 3, name: 'See', farbe: '#2f6d8f' },
    meer: { wert: 4, name: 'Meer', farbe: '#1d4d66' },
  },
  berechne(ctx) {
    const L = ctx.ledger('vektorquellen (OSM + handkuratiert)')
    const werte = ctx.neuesFeld()
    let flaechen = 0
    let linien = 0
    let ausserhalb = 0

    /* Flächen zuerst — Linien schlagen sie danach, wo beides zutrifft. */
    for (const f of ctx.merkmale(['see', 'meer'])) {
      const wert = f.properties.kind === 'meer' ? 4 : 3
      const ringe =
        f.geometry.type === 'Polygon'
          ? [f.geometry.coordinates[0]]
          : f.geometry.coordinates.map((p) => p[0])
      let getroffen = 0
      for (const ring of ringe)
        for (const i of ctx.zellenInPolygon(ring)) {
          werte[i] = wert
          getroffen++
        }
      if (getroffen) flaechen += getroffen
      else ausserhalb++
    }

    for (const f of ctx.merkmale(['nebenlauf'])) {
      for (const i of ctx.zellenEntlang(f.geometry.coordinates)) {
        if (werte[i] === 3 || werte[i] === 4) continue
        werte[i] = 2
        linien++
      }
    }
    for (const f of ctx.merkmale(['hauptlauf'])) {
      for (const i of ctx.zellenEntlang(f.geometry.coordinates)) {
        if (werte[i] === 3 || werte[i] === 4) continue
        werte[i] = 1
        linien++
      }
    }

    L.gelesen(flaechen + linien + ausserhalb)
    L.reduziert(flaechen, 'Gewässerpolygone → Zellen (Zentrum im Polygon)', {
      treue: 'aggregiert',
    })
    L.reduziert(linien, 'Flusslinien → Zellfolge (Hex-Linie)', {
      treue: 'aggregiert',
    })
    L.ausgestossen(ausserhalb, 'Gewässer ohne getroffene Zelle', {
      grund: 'kleiner als eine Zelle oder ausserhalb des Ausschnitts',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}
