/*
 * mapper.mjs — handkuratierte Übersetzungstabellen Quellcode → Spielklasse.
 *
 * Die Pipeline nimmt Rohdaten entgegen und stösst alles aus, was kein Mapper
 * annimmt. Ein Mapper ist eine **Datendatei**, kein Code: wer die Tabelle
 * pflegt, gestaltet das Spiel; wer den Parser schreibt, tippt nur ab.
 *
 * Jeder Eintrag deklariert seine `treue` (siehe lib/ledger.mjs) — die
 * Übersetzung „Rbed311005 Kalkstein → kalk" ist `klassiert`, nicht `1:1`,
 * weil sie Information wegwirft. Genau das soll die Metrik sehen.
 *
 * Ein Code, der in keiner Tabelle steht, ist NICHT stillschweigend egal: er
 * landet als `unbekannt` im Protokoll, mit Beispielen — das ist die Arbeitsliste
 * für die nächste Kuratierungsrunde.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TREUE } from './ledger.mjs'

const HIER = dirname(fileURLToPath(import.meta.url))
export const MAPPER_DIR = join(HIER, '..', 'mappers')

export function ladeMapper(id) {
  const pfad = join(MAPPER_DIR, `${id}.json`)
  const def = JSON.parse(readFileSync(pfad, 'utf8'))

  /* --- Tabelle prüfen, bevor irgendetwas damit übersetzt wird --- */
  if (!def.klassen || !Object.keys(def.klassen).length)
    throw new Error(`Mapper ${id}: keine Zielklassen deklariert`)
  const gesehen = new Set()
  for (const e of def.eintraege ?? []) {
    if (gesehen.has(e.code))
      throw new Error(`Mapper ${id}: Code ${e.code} steht doppelt in der Tabelle`)
    gesehen.add(e.code)
    if (!(e.klasse in def.klassen))
      throw new Error(
        `Mapper ${id}: Code ${e.code} zeigt auf unbekannte Klasse „${e.klasse}"`,
      )
    if (!TREUE[e.treue])
      throw new Error(
        `Mapper ${id}: Code ${e.code} hat unbekannte treue „${e.treue}"`,
      )
  }
  for (const v of def.verworfen ?? []) {
    if (gesehen.has(v.code))
      throw new Error(
        `Mapper ${id}: Code ${v.code} ist gleichzeitig zugeordnet und verworfen`,
      )
    gesehen.add(v.code)
    if (!v.grund)
      throw new Error(`Mapper ${id}: Code ${v.code} verworfen ohne Grund`)
  }

  const tabelle = new Map((def.eintraege ?? []).map((e) => [e.code, e]))
  const verworfen = new Map((def.verworfen ?? []).map((v) => [v.code, v]))
  /* Zählwerk: was wurde wie oft getroffen, was blieb übrig. */
  const treffer = new Map()
  const abgelehnt = new Map()
  const unbekannt = new Map()

  const M = {
    id,
    titel: def.titel ?? id,
    ziel: def.ziel ?? null,
    quelle: def.quelle ?? null,
    klassen: def.klassen,
    /** Numerischer Wert je Klassenschlüssel — die Kodierung im Overlay. */
    werte: Object.fromEntries(
      Object.entries(def.klassen).map(([k, v]) => [k, v.wert]),
    ),
  }

  /** Übersetzt einen Quellcode. Zählt jeden Aufruf mit. */
  M.uebersetze = (code) => {
    const e = tabelle.get(code)
    if (e) {
      treffer.set(code, (treffer.get(code) ?? 0) + 1)
      return { klasse: e.klasse, wert: M.werte[e.klasse], treue: e.treue }
    }
    if (verworfen.has(code)) {
      abgelehnt.set(code, (abgelehnt.get(code) ?? 0) + 1)
      return null
    }
    unbekannt.set(code, (unbekannt.get(code) ?? 0) + 1)
    return null
  }

  M.zaehlung = () => ({
    treffer: [...treffer.values()].reduce((a, b) => a + b, 0),
    abgelehnt: [...abgelehnt.values()].reduce((a, b) => a + b, 0),
    unbekannt: [...unbekannt.values()].reduce((a, b) => a + b, 0),
    unbekannteCodes: [...unbekannt.entries()].sort((a, b) => b[1] - a[1]),
  })

  /**
   * Bucht das Ergebnis der Übersetzung in ein Protokoll. Ruft NICHT
   * `gelesen()` — die Stufe bestimmt selbst, was ihre Grundgesamtheit ist.
   */
  M.buche = (L) => {
    /* nach Treuegrad gruppieren, damit die Belegstufen stimmen */
    const nachTreue = new Map()
    for (const [code, n] of treffer) {
      const t = tabelle.get(code).treue
      nachTreue.set(t, (nachTreue.get(t) ?? 0) + n)
    }
    for (const [t, n] of nachTreue) {
      if (t === '1:1') L.uebernommen(n, `${id}: Code direkt übernommen`, { treue: t })
      else L.reduziert(n, `${id}: ${TREUE[t].txt}`, { treue: t })
    }
    const abg = [...abgelehnt.entries()]
    if (abg.length)
      L.ausgestossen(
        abg.reduce((a, [, n]) => a + n, 0),
        `${id}: bewusst verworfene Codes`,
        {
          grund: 'im Mapper als verworfen deklariert',
          beispiele: abg
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([c, n]) => `${c} (${n}× ${verworfen.get(c).grund})`),
        },
      )
    const unb = [...unbekannt.entries()]
    if (unb.length)
      L.ausgestossen(
        unb.reduce((a, [, n]) => a + n, 0),
        `${id}: Codes ohne Eintrag in der Tabelle`,
        {
          grund: 'kein Mapping — Arbeitsliste für die Kuratierung',
          beispiele: unb
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([c, n]) => `${c} (${n}×)`),
        },
      )
    return L
  }

  return M
}

/** Alle vorhandenen Mapper-Ids. */
export const alleMapper = () =>
  readdirSync(MAPPER_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5))
