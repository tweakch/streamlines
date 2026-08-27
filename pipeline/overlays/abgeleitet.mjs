/*
 * overlays/abgeleitet.mjs — Schicht 2 (Anlage), soweit sie sich heute aus
 * vorhandenen Quellen ableiten lässt.
 *
 * Diese Overlays sind MODELLE, keine Messungen. Sie tragen darum `geschaetzt`
 * und landen in der Metrik unter „frei erfunden" — bis GeoCover da ist und
 * `erhaltung` durch echten Untergrund ersetzt wird. Das ist der Sinn der
 * Metrik: sie zeigt, wieviel vom Spielfeld heute noch Behauptung ist.
 */

/* Gangbarkeit: Kosten, ein Feld zu durchqueren. 1 = mühelos … 250 = unpassierbar.
   Aus kartenwachstum-v1 wissen wir: Korridore entstehen nur, wenn Wasser
   billiger ist als Land — die Bootstechnik ist der Formgeber der Karte. */
export const gangbarkeit = {
  id: 'gangbarkeit',
  name: 'Gangbarkeit',
  gruppe: 'anlage',
  einheit: 'Kosten',
  kodierung: 'uint8 · 10 = ebenes Land, höher = teurer',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['sonny-dtm-50.grid.json', 'osm-* (Wasser)'],
  braucht: ['steigung', 'wasser'],
  notiz:
    'Modell, keine Messung: Grundkosten nach Steigung, Wasser je nach Bootstechnik billiger oder teurer. Der Prüfstein ist die gemessene Kurve aus kartenwachstum-v1 (Mesolithikum 420 Felder, Neolithikum 112).',
  skala: { von: '#dfe7dd', bis: '#5a2f2f', max: 120 },
  berechne(ctx) {
    const L = ctx.ledger('abgeleitet aus Steigung + Wasser')
    const werte = ctx.neuesFeld()
    const st = ctx.holen('steigung')
    const wa = ctx.holen('wasser')
    let gesetzt = 0
    let ohne = 0
    ctx.jedeZelle((c, r, i) => {
      const w = wa[i]
      if (w) {
        /* Wasser ohne Boot ist teuer, mit Boot der billigste Weg überhaupt.
           Hier steht der Zustand OHNE Boot — die Epochenschicht senkt ihn. */
        werte[i] = w === 3 || w === 4 ? 200 : 120
        gesetzt++
        return
      }
      const s = st[i]
      if (!s) { ohne++; return }
      const prozent = s / 2
      /* 10 auf ebenem Land, quadratisch steigend; ab ~65 % praktisch dicht. */
      werte[i] = Math.max(1, Math.min(250, Math.round(10 + prozent * prozent * 0.055)))
      gesetzt++
    })
    L.gelesen(gesetzt + ohne)
    L.reduziert(gesetzt, 'Steigung und Wasser → Wegkosten (Modell)', {
      treue: 'geschaetzt',
      verlust: 'keine Vegetation, keine Jahreszeit, keine Bootstechnik',
    })
    L.ausgestossen(ohne, 'Zellen ohne Steigung und ohne Wasser', {
      grund: 'keine Grundlage für ein Kostenmodell',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}

/* Erhaltung: was der Boden von einem vergrabenen Depot übriglässt.
   Der Parameter, an dem der ganze Vergrabungs-Weg hängt — und heute der
   ehrlichste Beleg dafür, dass uns eine Quelle fehlt. */
export const erhaltung = {
  id: 'erhaltung',
  name: 'Erhaltung im Boden',
  gruppe: 'anlage',
  einheit: null,
  kodierung: 'uint8 · Klassen',
  ebenen: [1, 2],
  nurRegion: true,
  quellen: ['abgeleitet aus Wasser + Relief'],
  braucht: ['wasser', 'relief', 'steigung'],
  ersetztDurch: 'geocover-boden',
  notiz:
    'PLATZHALTER. Richtig kommt das aus GeoCover-Lockergestein (torfig → organisch, kiesig → nichts). Bis dahin eine Ableitung: flaches Ufer nahe stehendem Wasser erhält organisch, steile Hänge erhalten nichts. Alles hier ist frei erfunden und wird auch so gezählt.',
  klassen: {
    organisch: { wert: 1, name: 'organisch (Holz, Textil, Korb)', farbe: '#3f5138' },
    gut: { wert: 2, name: 'gut (Knochen, Keramik)', farbe: '#6d7a55' },
    mittel: { wert: 3, name: 'mittel (Keramik, Stein)', farbe: '#a89a72' },
    gering: { wert: 4, name: 'gering (nur Stein)', farbe: '#c4b79a' },
    keine: { wert: 5, name: 'keine', farbe: '#d8d2c6' },
  },
  berechne(ctx) {
    const L = ctx.ledger('abgeleitet aus Wasser + Relief (Platzhalter)')
    const werte = ctx.neuesFeld()
    const wa = ctx.holen('wasser')
    const rel = ctx.holen('relief')
    const st = ctx.holen('steigung')
    let gesetzt = 0
    let ohne = 0
    ctx.jedeZelle((c, r, i) => {
      if (wa[i] === 3 || wa[i] === 4) { werte[i] = 2; gesetzt++; return } // Seegrund
      if (!rel[i] && !st[i]) { ohne++; return }
      const prozent = st[i] / 2
      const ueberTal = (rel[i] - 1) * 10
      const amWasser = ctx.nachbarschaftHat(wa, c, r, [1, 2, 3])
      if (amWasser && prozent < 6 && ueberTal < 30) werte[i] = 1
      else if (prozent < 6 && ueberTal < 60) werte[i] = 3
      else if (prozent < 20) werte[i] = 4
      else werte[i] = 5
      gesetzt++
    })
    L.gelesen(gesetzt + ohne)
    L.reduziert(gesetzt, 'Lage am Wasser + Hangneigung → Erhaltungsklasse', {
      treue: 'erfunden',
      verlust: 'kein Untergrund, kein Grundwasser, keine Bodenkunde',
    })
    L.ausgestossen(ohne, 'Zellen ohne Relief und ohne Steigung', {
      grund: 'keine Grundlage',
    })
    L.abschluss()
    return { werte, ledger: L }
  },
}
