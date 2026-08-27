/*
 * ledger.mjs — das Herkunftsprotokoll jeder Quellenverarbeitung.
 *
 * Regel der Pipeline: **keine Stufe darf Daten verarbeiten, ohne Rechenschaft
 * abzulegen.** Jede Verarbeitung bilanziert ihre Eingabe in genau drei Töpfe:
 *
 *   übernommen   — 1:1 in die Ausgabe gelangt, unverändert
 *   reduziert    — verändert übernommen (gerundet, klassiert, aggregiert,
 *                  geschätzt): der Wert steht drin, aber nicht mehr so, wie
 *                  die Quelle ihn kannte
 *   ausgestossen — nicht übernommen (kein Mapping, NoData, ausserhalb,
 *                  bewusst verworfen)
 *
 * `abschluss()` prüft, dass die drei Töpfe die Eingabe exakt aufbrauchen.
 * Geht die Bilanz nicht auf, wirft die Stufe — **stilles Wegwerfen ist damit
 * unmöglich**, und das ist der ganze Zweck der Übung. Genau dieser Fehler ist
 * in dieser Pipeline schon einmal teuer geworden: eine Overpass-Abfrage unter
 * falschem Seenamen lieferte nichts, der Fehlschlag wurde übersprungen, und
 * der grösste See der Region fehlte stillschweigend.
 *
 * Aus den Töpfen fällt die **Realitätsnähe** — und zwar nicht als eine Zahl,
 * die Genauigkeit vortäuscht, sondern als Verteilung über die drei
 * Belegstufen des Projekts (Handbuch P6):
 *
 *   belegt                  ← 1:1 und gerundet
 *   historisch inspiriert   ← klassiert und aggregiert
 *   frei erfunden           ← geschätzt und erfunden
 *
 * So lässt sich für jedes Overlay sagen, welcher Anteil seiner Felder auf
 * Messung zurückgeht — und der Inspektor im Spiel kann es dem Spieler zeigen.
 */

/** Treuegrade einer Übernahme, absteigend. */
export const TREUE = {
  '1:1': { belegstatus: 'belegt', txt: 'unverändert übernommen' },
  gerundet: { belegstatus: 'belegt', txt: 'gerundet oder gestuft' },
  klassiert: { belegstatus: 'inspiriert', txt: 'in Spielklassen übersetzt' },
  aggregiert: { belegstatus: 'inspiriert', txt: 'über mehrere Quellwerte zusammengefasst' },
  geschaetzt: { belegstatus: 'erfunden', txt: 'aus Nachbarschaft geschätzt' },
  erfunden: { belegstatus: 'erfunden', txt: 'ohne Quelle gesetzt' },
}

export const BELEGSTATUS = ['belegt', 'inspiriert', 'erfunden']

const ALLE = []

/**
 * Legt ein Protokoll an. `quelle` benennt, woraus gelesen wird, `stufe`, wer
 * liest. Beide erscheinen im Bericht — ein Eintrag ohne beides ist wertlos.
 */
export function ledger({ quelle, stufe, ebene = null, notiz = null }) {
  if (!quelle || !stufe)
    throw new Error('ledger(): quelle und stufe sind Pflicht')

  const L = {
    quelle,
    stufe,
    ebene,
    notiz,
    eingabe: 0,
    posten: [],
    _abgeschlossen: false,
  }

  /** Grundgesamtheit der Eingabe. Mehrfach aufrufbar (summiert). */
  L.gelesen = (n) => {
    L.eingabe += n
    return L
  }

  const buche = (topf) => (n, was, opt = {}) => {
    if (!(n >= 0)) throw new Error(`ledger(${stufe}): ${topf} braucht eine Anzahl`)
    if (!was) throw new Error(`ledger(${stufe}): ${topf} braucht eine Beschreibung`)
    if (topf !== 'ausgestossen') {
      const t = opt.treue ?? (topf === 'uebernommen' ? '1:1' : null)
      if (!t || !TREUE[t])
        throw new Error(
          `ledger(${stufe}): treue fehlt oder unbekannt („${opt.treue}") — ` +
            `erlaubt: ${Object.keys(TREUE).join(', ')}`,
        )
      L.posten.push({ topf, n, was, treue: t, ...opt })
    } else {
      if (!opt.grund)
        throw new Error(
          `ledger(${stufe}): ausgestossen ohne grund — wer wegwirft, sagt warum`,
        )
      L.posten.push({ topf, n, was, ...opt })
    }
    return L
  }

  /** 1:1 in die Ausgabe gelangt. */
  L.uebernommen = buche('uebernommen')
  /** Verändert übernommen — `treue` ist Pflicht. */
  L.reduziert = buche('reduziert')
  /** Nicht übernommen — `grund` ist Pflicht, `beispiele` sehr erwünscht. */
  L.ausgestossen = buche('ausgestossen')

  const summe = (topf) =>
    L.posten.filter((p) => p.topf === topf).reduce((a, p) => a + p.n, 0)

  /** Prüft die Bilanz und friert das Protokoll ein. */
  L.abschluss = () => {
    const u = summe('uebernommen')
    const r = summe('reduziert')
    const a = summe('ausgestossen')
    const ist = u + r + a
    if (ist !== L.eingabe)
      throw new Error(
        `ledger(${stufe}, ${quelle}): Bilanz geht nicht auf — gelesen ${L.eingabe}, ` +
          `verbucht ${ist} (übernommen ${u} + reduziert ${r} + ausgestossen ${a}). ` +
          `Jede Eingabe gehört in genau einen Topf.`,
      )
    L._abgeschlossen = true
    return L
  }

  /** Verteilung über die Belegstufen, bezogen auf die AUSGABE. */
  L.realitaetsnaehe = () => {
    const aus = summe('uebernommen') + summe('reduziert')
    const nach = Object.fromEntries(BELEGSTATUS.map((b) => [b, 0]))
    for (const p of L.posten) {
      if (p.topf === 'ausgestossen') continue
      nach[TREUE[p.treue].belegstatus] += p.n
    }
    return {
      eingabe: L.eingabe,
      ausgabe: aus,
      ausgestossen: summe('ausgestossen'),
      anteil: Object.fromEntries(
        BELEGSTATUS.map((b) => [b, aus ? nach[b] / aus : 0]),
      ),
      zellen: nach,
    }
  }

  L.bericht = () => ({
    quelle,
    stufe,
    ebene,
    notiz,
    ...L.realitaetsnaehe(),
    posten: L.posten,
  })

  ALLE.push(L)
  return L
}

/** Alle in diesem Lauf angelegten Protokolle. */
export const alleLedger = () => ALLE

/**
 * Sammelbericht über alle Protokolle. Wirft, wenn eines nicht abgeschlossen
 * wurde — eine Stufe, die kein `abschluss()` ruft, hat nicht Rechenschaft
 * abgelegt, sondern nur so getan.
 */
export function gesamtbericht() {
  const offen = ALLE.filter((L) => !L._abgeschlossen)
  if (offen.length)
    throw new Error(
      `Protokoll nicht abgeschlossen: ${offen
        .map((L) => `${L.stufe} (${L.quelle})`)
        .join(', ')}`,
    )
  const eintraege = ALLE.map((L) => L.bericht())
  const gesamt = { eingabe: 0, ausgabe: 0, ausgestossen: 0, zellen: {} }
  for (const b of BELEGSTATUS) gesamt.zellen[b] = 0
  for (const e of eintraege) {
    gesamt.eingabe += e.eingabe
    gesamt.ausgabe += e.ausgabe
    gesamt.ausgestossen += e.ausgestossen
    for (const b of BELEGSTATUS) gesamt.zellen[b] += e.zellen[b]
  }
  gesamt.anteil = Object.fromEntries(
    BELEGSTATUS.map((b) => [b, gesamt.ausgabe ? gesamt.zellen[b] / gesamt.ausgabe : 0]),
  )
  return { gesamt, eintraege }
}

const pct = (x) => (x * 100).toFixed(1).padStart(5) + ' %'

/** Menschenlesbare Tabelle für die Konsole. */
export function berichtAlsText(bericht) {
  const z = []
  z.push('')
  z.push('  Herkunftsprotokoll — was aus den Quellen wurde')
  z.push('  ' + '─'.repeat(76))
  z.push(
    '  ' +
      'Stufe'.padEnd(26) +
      'Eingabe'.padStart(9) +
      'belegt'.padStart(9) +
      'inspir.'.padStart(9) +
      'erfund.'.padStart(9) +
      'ausgest.'.padStart(10),
  )
  for (const e of bericht.eintraege) {
    z.push(
      '  ' +
        `${e.stufe}`.padEnd(26) +
        String(e.eingabe).padStart(9) +
        pct(e.anteil.belegt).padStart(9) +
        pct(e.anteil.inspiriert).padStart(9) +
        pct(e.anteil.erfunden).padStart(9) +
        String(e.ausgestossen).padStart(10),
    )
  }
  z.push('  ' + '─'.repeat(76))
  const g = bericht.gesamt
  z.push(
    '  ' +
      'GESAMT'.padEnd(26) +
      String(g.eingabe).padStart(9) +
      pct(g.anteil.belegt).padStart(9) +
      pct(g.anteil.inspiriert).padStart(9) +
      pct(g.anteil.erfunden).padStart(9) +
      String(g.ausgestossen).padStart(10),
  )
  z.push('')
  /* Ausgestossenes ausdrücklich auflisten — es ist die Liste der Dinge, die
     wir über die Welt wissen könnten und nicht wissen. */
  const raus = bericht.eintraege.flatMap((e) =>
    e.posten
      .filter((p) => p.topf === 'ausgestossen' && p.n > 0)
      .map((p) => ({ stufe: e.stufe, ...p })),
  )
  if (raus.length) {
    z.push('  Ausgestossen:')
    for (const p of raus) {
      const bsp = p.beispiele?.length
        ? `  z. B. ${p.beispiele.slice(0, 4).join(', ')}`
        : ''
      z.push(`    ${String(p.n).padStart(8)}  ${p.was} — ${p.grund}${bsp}`)
    }
    z.push('')
  }
  return z.join('\n')
}
