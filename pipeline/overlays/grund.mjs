/*
 * overlays/grund.mjs — Schicht 1 (Grund): was das Gelände von sich aus ist.
 *
 * Alle Werte kommen aus den normalisierten Rasterquellen (Sonny-DTM,
 * swissBATHY3D). Kein Wert wird geschätzt: wo keine Quelle deckt, bleibt die
 * Zelle 0 („unbekannt") und wird als ausgestossen protokolliert.
 */

/* Höhe: 25-m-Stufen, 0 = unbekannt. Deckt 25–6375 m. */
export const hoehe = {
  id: 'hoehe',
  name: 'Höhe',
  gruppe: 'grund',
  einheit: 'm ü. M.',
  kodierung: 'uint8 · Wert × 25 m',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['sonny-dtm-50.grid.json'],
  notiz: 'Bilineare Probe im Zellzentrum, auf 25 m gestuft.',
  skala: { von: '#2d4a3e', bis: '#e8dcc0', max: 160 },
  berechne(ctx) {
    const L = ctx.ledger('sonny-dtm-50.grid.json')
    const werte = ctx.neuesFeld()
    let gut = 0
    let leer = 0
    ctx.jedeZelle((c, r, i, lon, lat) => {
      const z = ctx.hoeheAt(lon, lat)
      if (z === null) { leer++; return }
      werte[i] = Math.max(1, Math.min(255, Math.round(z / 25)))
      gut++
    })
    L.gelesen(gut + leer)
    L.reduziert(gut, 'Höhe in Meter → 25-m-Stufen', { treue: 'gerundet' })
    L.ausgestossen(leer, 'Zellen ohne Höhendeckung', {
      grund: 'NoData oder ausserhalb der Höhenquelle',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}

/* Steigung in Prozent × 2 (0–127 %), 0 = unbekannt. */
export const steigung = {
  id: 'steigung',
  name: 'Steigung',
  gruppe: 'grund',
  einheit: '%',
  kodierung: 'uint8 · Wert ÷ 2 = Prozent',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['sonny-dtm-50.grid.json'],
  notiz:
    'Zentrale Differenzen über ±hexKm/2. Wurde im Bake schon gerechnet und danach weggeworfen — hier bleibt sie erhalten, weil Gangbarkeit und Sonnenhang daran hängen.',
  skala: { von: '#f0ead6', bis: '#7a3b2e', max: 120 },
  berechne(ctx) {
    const L = ctx.ledger('sonny-dtm-50.grid.json')
    const werte = ctx.neuesFeld()
    let gut = 0
    let leer = 0
    ctx.jedeZelle((c, r, i, lon, lat) => {
      const g = ctx.gefaelleAt(lon, lat)
      if (!g) { leer++; return }
      werte[i] = Math.max(1, Math.min(255, Math.round(g.steigung * 100 * 2)))
      gut++
    })
    L.gelesen(gut + leer)
    L.reduziert(gut, 'Gefälle → Prozent, halbe Stufen', { treue: 'gerundet' })
    L.ausgestossen(leer, 'Zellen ohne vollständige Nachbarschaft im DTM', {
      grund: 'NoData an mindestens einer der vier Stützstellen',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}

/* Relief über dem lokalen Talboden, 10-m-Stufen (0–2550 m). */
export const relief = {
  id: 'relief',
  name: 'Relief über Talboden',
  gruppe: 'grund',
  einheit: 'm',
  kodierung: 'uint8 · Wert × 10 m',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['sonny-dtm-50.grid.json'],
  notiz:
    'Höhe minus lokalem Talboden (Blockminimum ~1.6 km, Min über 3×3 Blöcke). Sagt, wie hoch man über dem Tal steht — nicht über dem Meer.',
  skala: { von: '#eef2f0', bis: '#4a3b52', max: 120 },
  berechne(ctx) {
    const L = ctx.ledger('sonny-dtm-50.grid.json')
    const werte = ctx.neuesFeld()
    let gut = 0
    let leer = 0
    ctx.jedeZelle((c, r, i, lon, lat) => {
      const z = ctx.hoeheAt(lon, lat)
      const boden = ctx.talbodenAt(lon, lat)
      if (z === null || boden === null) { leer++; return }
      werte[i] = Math.max(1, Math.min(255, Math.round(Math.max(0, z - boden) / 10) + 1))
      gut++
    })
    L.gelesen(gut + leer)
    L.reduziert(gut, 'Höhe − Talboden → 10-m-Stufen', { treue: 'gerundet' })
    L.ausgestossen(leer, 'Zellen ohne Höhe oder ohne Talbodenblock', {
      grund: 'NoData',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}

/* Exposition: 1 = N, dann im Uhrzeigersinn, 9 = eben. 0 = unbekannt. */
const HIMMEL = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
export const exposition = {
  id: 'exposition',
  name: 'Exposition',
  gruppe: 'grund',
  einheit: null,
  kodierung: 'uint8 · Klassen',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['sonny-dtm-50.grid.json'],
  notiz:
    'Himmelsrichtung des Gefälles. Der Südhang ist der Sonnenhang — Rebberg, früher Schneeschmelze, wärmeres Lager. Stand seit v2 als Kandidat im README und ist jetzt gebaut.',
  klassen: Object.fromEntries([
    ...HIMMEL.map((h, k) => [
      h.toLowerCase(),
      {
        wert: k + 1,
        name: h,
        farbe: `hsl(${(k * 45 + 200) % 360} 45% ${k >= 3 && k <= 5 ? 62 : 42}%)`,
      },
    ]),
    ['eben', { wert: 9, name: 'eben', farbe: '#c9c4b4' }],
  ]),
  berechne(ctx) {
    const L = ctx.ledger('sonny-dtm-50.grid.json')
    const werte = ctx.neuesFeld()
    let gut = 0
    let eben = 0
    let leer = 0
    ctx.jedeZelle((c, r, i, lon, lat) => {
      const g = ctx.gefaelleAt(lon, lat)
      if (!g) { leer++; return }
      if (g.steigung < 0.02) { werte[i] = 9; eben++; return }
      /* Azimut der Falllinie, von Nord im Uhrzeigersinn. */
      let az = (Math.atan2(-g.dx, -g.dy) * 180) / Math.PI
      if (az < 0) az += 360
      werte[i] = (Math.round(az / 45) % 8) + 1
      gut++
    })
    L.gelesen(gut + eben + leer)
    L.reduziert(gut + eben, 'Falllinien-Azimut → 8 Sektoren + eben', {
      treue: 'klassiert',
    })
    L.ausgestossen(leer, 'Zellen ohne vollständige Nachbarschaft im DTM', {
      grund: 'NoData',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}

/* Seegrund: 5-m-Stufen mit Nullpunkt −200 m (Lago Maggiore liegt unter NN). */
export const seegrund = {
  id: 'seegrund',
  name: 'Seegrund',
  gruppe: 'grund',
  einheit: 'm ü. M.',
  kodierung: 'uint8 · (Wert × 5) − 200 m',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['swissbathy3d.grid.json'],
  braucht: ['wasser'],
  notiz:
    'Was unter dem Wasserspiegel liegt. Ein DTM führt über einem See die Oberfläche — ohne diese Quelle wäre der Bodensee eine ebene Fläche auf 400 m. Bilanziert wird gegen die Seefläche, nicht gegen die Karte: eine Landzelle ohne Seegrund ist keine Fehlstelle.',
  skala: { von: '#0d2a3d', bis: '#6fa8c4', max: 100 },
  berechne(ctx) {
    const L = ctx.ledger('swissbathy3d.grid.json')
    const werte = ctx.neuesFeld()
    const wa = ctx.holen('wasser')
    let gut = 0
    let leer = 0
    ctx.jedeZelleMit(wa, [3, 4], (c, r, i, lon, lat) => {
      const v = ctx.seegrundAt(lon, lat)
      if (v === null) { leer++; return }
      werte[i] = Math.max(1, Math.min(255, Math.round((v + 200) / 5)))
      gut++
    })
    L.gelesen(gut + leer)
    L.reduziert(gut, 'Seegrund in Meter → 5-m-Stufen ab −200 m', {
      treue: 'gerundet',
    })
    L.ausgestossen(leer, 'Seezellen ohne vermessenen Grund', {
      grund: 'See nicht in den 22 Paketen von swissBATHY3D (oder ausserhalb CH)',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}
