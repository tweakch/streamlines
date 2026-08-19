import type { Tile } from './types'

/**
 * Seed-Inhalt des vertikalen Schnitts: eine Kachel, eine Zeitschicht (1799),
 * zwei konkurrierende Claims zum Limmatübergang bei Dietikon.
 *
 * Historischer Anker: Massénas Limmatübergang am 25. September 1799
 * (Zweite Schlacht von Zürich). Quellen sind für den Prototyp fiktionalisiert,
 * aber im Typus realistisch.
 */
export const limmatTile: Tile = {
  id: 'limmat-dietikon',
  name: 'Limmatraum Dietikon',
  epoch: '1799 — Zweiter Koalitionskrieg',
  description:
    'Flussabschnitt zwischen Kloster Fahr und Dietikon. Die Limmat trennt ' +
    'die französischen Stellungen am linken vom russischen Korps am rechten ' +
    'Ufer. Wo war der Fluss überquerbar?',
  claims: [
    {
      id: 'furt-nord',
      title: 'Furt an der Nordschlaufe',
      description:
        'An der nördlichen Flussschlaufe soll eine seichte Stelle die ' +
        'Überquerung zu Fuss erlaubt haben.',
      uncertainty:
        'Kartensignatur und Veteranenbericht stehen gegen den morphologischen ' +
        'Befund. Ob die Signatur eine reale Furt, einen Fährbetrieb oder einen ' +
        'älteren Zustand abbildet, ist nicht entscheidbar — der Pegel von 1799 ' +
        'ist nicht überliefert.',
    },
    {
      id: 'ponton-sued',
      title: 'Pontonstelle an der Südwiese',
      description:
        'An der ruhigen Südwiese soll die französische Division eine ' +
        'Pontonbrücke geschlagen haben.',
      uncertainty:
        'Der Brückenschlag selbst ist gut belegt. Die exakte Lage auf ' +
        'wenige Dutzend Meter genau bleibt offen — der Rapport nennt nur ' +
        '«unterhalb des Dorfes», keine vermessene Position.',
    },
  ],
  sources: [
    {
      id: 'usteri-karte',
      title: 'Handkarte des Zürcher Gebiets, J. H. Usteri',
      kind: 'Karte',
      date: '1793',
      quality: 'mittel',
      precision: 'ungefaehr',
      finding:
        'Die Karte trägt an der Nordschlaufe die Signatur «Furth». Sie ist ' +
        'sechs Jahre vor dem Feldzug entstanden und nicht vermessen — die ' +
        'Signatur kann verschoben oder veraltet sein.',
      stance: { 'furt-nord': 'stuetzt' },
    },
    {
      id: 'rapport-lorge',
      title: 'Rapport der Division Lorge',
      kind: 'Gefechtsbericht',
      date: '25. September 1799',
      quality: 'hoch',
      precision: 'genau',
      finding:
        'Der Divisionsrapport beschreibt den Brückenschlag «unterhalb des ' +
        'Dorfes, an der flachen Wiese» — mit Uhrzeiten, Pontonzahl und ' +
        'beteiligten Einheiten. Ein zeitgenössisches, dienstliches Dokument.',
      stance: { 'ponton-sued': 'stuetzt' },
    },
    {
      id: 'veteran-memoiren',
      title: 'Erinnerungen eines Voltigeurs',
      kind: 'Memoiren',
      date: '1846, rückblickend',
      quality: 'niedrig',
      precision: 'vage',
      finding:
        'Der Veteran erinnert sich 47 Jahre später, man sei «weiter oben ' +
        'durch das Wasser gewatet». Ort und Datum bleiben unscharf; Memoiren ' +
        'dieser Zeit verdichten oft mehrere Episoden.',
      stance: { 'furt-nord': 'stuetzt' },
    },
    {
      id: 'morphologie-gutachten',
      title: 'Flussmorphologisches Gutachten',
      kind: 'Naturwissenschaftlicher Befund',
      date: '2011',
      quality: 'hoch',
      precision: 'genau',
      finding:
        'Sedimentprofile zeigen: Die Rinne an der Nordschlaufe war im ' +
        '18. Jahrhundert über zwei Meter tief eingeschnitten — als Furt kaum ' +
        'passierbar. An der Südwiese dagegen flaches Ufer und gleichmässige ' +
        'Strömung, ideal für einen Brückenschlag.',
      stance: { 'furt-nord': 'widerspricht', 'ponton-sued': 'stuetzt' },
    },
  ],
}
