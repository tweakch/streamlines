import type { Cell, GameState, NightResult, Terrain, TileKind } from './types'

export const YEARS = [
  10000, 9200, 8400, 7600, 6800, 6200, 5200, 4300, 3400, 2600,
]
export const ROUNDS = 10

/* Petroglyphen-Glyphen als Inline-SVG (stroke) — identisch zum Prototyp. */
export const GLYPHS: Record<string, string> = {
  fisch:
    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 20 Q16 10 27 16 Q33 19 34 20 Q33 21 27 24 Q16 30 6 20 Z"/><path d="M34 20 L39 14 M34 20 L39 26"/><circle cx="13" cy="18.5" r="1.4" fill="currentColor"/></svg>',
  ufer: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 26 L20 12 L32 26"/><path d="M20 12 V26"/><path d="M5 32 Q12 29 20 32 Q28 35 35 32"/></svg>',
  wald: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M13 32 V22 M13 22 L7 24 M13 22 L19 24 M13 15 L8 18 M13 15 L18 18 M13 8 L13 15"/><path d="M28 32 V20 M28 20 L22 23 M28 20 L34 23 M28 12 L23 16 M28 12 L33 16"/></svg>',
  terrasse:
    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 32 H35 M9 25 H31 M14 18 H26 M18 11 H22"/></svg>',
  hoehle:
    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 32 Q6 12 20 12 Q34 12 34 32"/><path d="M14 32 Q14 20 20 20 Q26 20 26 32"/></svg>',
  flint:
    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M20 6 L30 16 L26 34 L14 34 L10 16 Z"/><path d="M20 6 L18 20 L26 34 M18 20 L10 16"/></svg>',
  pfahl:
    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 18 L20 8 L32 18 M11 18 H29 V24 H11 Z"/><path d="M13 24 V34 M20 24 V34 M27 24 V34"/><path d="M6 35 Q13 32 20 35 Q27 38 34 35"/></svg>',
  wolf: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 28 L14 20 L18 22 L26 14 L30 8 L32 14 L28 20 L30 28 M14 20 L12 28 M22 18 L23 28"/></svg>',
}

export interface TileDef {
  nm: string
  fx: string
  glyph: string
  valid: (c: Cell) => boolean
  /** Flavor-Beschreibung für den Feld-Inspektor. */
  desc: string
}

export const TILES: Record<TileKind, TileDef> = {
  fisch: {
    nm: 'Fischgrund',
    fx: '+1 Nahrung/Tag',
    glyph: 'fisch',
    valid: (c) => c.t === 'water' || c.t === 'lake',
    desc: 'Reusen und Speerplätze an guter Stelle – der Fluss ernährt, wer ihn lesen kann.',
  },
  ufer: {
    nm: 'Lager am Ufer',
    fx: '+1 Nahrung/Tag',
    glyph: 'ufer',
    valid: (c) => c.t === 'ufer',
    desc: 'Feuerstelle, Zelte, Vorräte – das Herz des Stamms am Wasser.',
  },
  wald: {
    nm: 'Auenwald',
    fx: '+1 Material/Tag',
    glyph: 'wald',
    valid: (c) => c.t === 'ufer' || c.t === 'flach',
    desc: 'Weiden und Erlen der Aue: Holz für Feuer, Werkzeug und Bau.',
  },
  terrasse: {
    nm: 'Hochterrasse',
    fx: '+1 Schutz',
    glyph: 'terrasse',
    valid: (c) => c.t === 'flach' || c.t === 'hang',
    desc: 'Erhöhter Rastplatz mit Weitblick – wer oben sitzt, wird nicht überrascht.',
  },
  hoehle: {
    nm: 'Höhle',
    fx: '+2 Schutz',
    glyph: 'hoehle',
    valid: (c) => c.t === 'hang',
    desc: 'Fels über dem Kopf: der älteste Schutz, den das Tal kennt.',
  },
  flint: {
    nm: 'Feuerstein',
    fx: 'ermöglicht Werkzeug',
    glyph: 'flint',
    valid: (c) => c.t === 'hang' || c.t === 'flach',
    desc: 'Gutes Steinmaterial – Grundlage für Klingen, Schaber, Werkzeug.',
  },
  pfahl: {
    nm: 'Pfahlbau',
    fx: '−3 Mat · +1 N/Tag · +1 Schutz',
    glyph: 'pfahl',
    valid: (c) => c.t === 'lake' || c.lakeUfer,
    desc: 'Ein Haus auf Pfählen im flachen Wasser – die neue Bauweise vom See.',
  },
}

export interface TerrainDef {
  nm: string
  desc: string
}

/** Geländetypen für den Feld-Inspektor ('furt' überlagert 'water'). */
export const TERRAIN: Record<Terrain | 'furt', TerrainDef> = {
  water: {
    nm: 'Fluss',
    desc: 'Der junge Alpenrhein. Nur Fischgründe finden hier Halt; Menschen überqueren ihn nur an Furten.',
  },
  furt: {
    nm: 'Furt',
    desc: 'Eine flache Stelle im Fluss. Menschen können hier übersetzen, und Verbünde wirken über die Furt hinweg.',
  },
  lake: {
    nm: 'See',
    desc: 'Flaches Uferwasser des großen Sees – Fischgründe, und später stehen hier Häuser auf Pfählen.',
  },
  hang: {
    nm: 'Hang',
    desc: 'Sonniger Hang über dem Tal. Platz für Höhle, Hochterrasse und Feuerstein.',
  },
  ufer: {
    nm: 'Ufer',
    desc: 'Fruchtbarer Streifen am Wasser – der beste Platz für ein Lager.',
  },
  flach: {
    nm: 'Flachland',
    desc: 'Offenes Tal zwischen Fluss und Hang. Platz für Auenwald, Hochterrasse und Feuerstein.',
  },
}

export const DECK_WEIGHTS: Array<[TileKind, number]> = [
  ['ufer', 24],
  ['wald', 20],
  ['fisch', 16],
  ['terrasse', 15],
  ['hoehle', 13],
  ['flint', 12],
]

/* Fundstellen (vereinfacht, historisch inspiriert) — an feste
   Weltkoordinaten der gestalteten Weltkarte gebunden (siehe world.ts).
   Nur Fundstellen im gewählten Gebiet sind in einer Partie im Spiel. */
export interface FundDef {
  r: number
  c: number
  types: TileKind[]
  name: string
  txt: string
  k: number
  auth: number
}

export const FUND: FundDef[] = [
  {
    r: 8,
    c: 8,
    types: ['ufer', 'pfahl'],
    name: 'Pfahlbau-Fundstelle · Rheindelta',
    txt: 'An flachen Ufern wie diesem standen jahrtausendelang Pfahlbaudörfer – ihre Hölzer sind aufs Jahr genau datierbar. Heute UNESCO-Welterbe.',
    k: 2,
    auth: 2,
  },
  {
    r: 3,
    c: 1,
    types: ['ufer', 'pfahl'],
    name: 'Pfahlbau-Fundstelle · Westufer',
    txt: 'Rund um den ganzen See reihen sich Pfahlbaustationen ans flache Wasser – manche Dörfer wurden über Jahrhunderte immer wieder neu errichtet.',
    k: 2,
    auth: 2,
  },
  {
    r: 17,
    c: 17,
    types: ['hoehle', 'terrasse'],
    name: 'Jägerrastplatz · Hanglage',
    txt: 'Auf sonnigen Terrassen über dem Tal hinterließen mittelsteinzeitliche Jäger Feuerstellen und Klingen – lange bevor jemand sesshaft war.',
    k: 1,
    auth: 2,
  },
  {
    r: 35,
    c: 6,
    types: ['hoehle', 'terrasse'],
    name: 'Jägerrastplatz · Talenge',
    txt: 'Wo das Tal sich verengt, zog das Wild vorbei – und die Jäger warteten. Werkzeugfunde zeigen: Solche Plätze wurden über Jahrtausende immer wieder aufgesucht.',
    k: 1,
    auth: 2,
  },
  {
    r: 33,
    c: 16,
    types: ['flint'],
    name: 'Silex-Abbaustelle',
    txt: 'Gutes Steinmaterial war kostbar und wurde über weite Strecken getauscht – die ersten Handelswege des Tals, lange vor jeder Straße.',
    k: 1,
    auth: 2,
  },
  {
    r: 22,
    c: 8,
    types: ['terrasse', 'hoehle'],
    name: 'Siedlungshügel im Tal',
    txt: 'Einzelne Hügel im Talboden – vom Fluss umflossen, sicher vor Hochwasser – trugen Siedlungsspuren aus vielen Epochen übereinander.',
    k: 1,
    auth: 2,
  },
]

/* Nacht-Ereignisse: fx mutiert den State und liefert das Resultat.
   `schutz` ist der effektive Schutz inkl. Jäger. */
export interface NightDef {
  tag: string
  h: string
  p: string
  glyph?: string
  w?: number
  fx: (s: GameState, schutz: number) => NightResult
}

/*
 * Ein Anker ist mehr als eine Rundenzahl (Port aus ereignis-labor-v1).
 * Er hat eine Dramaturgie über mehrere Runden:
 *
 *   Vorzeichen   `vor` Runden vor dem Einschlag, im Morgenbericht
 *   Angebot      am Tag: `antworten`, solange das Fenster offen ist
 *   Einschlag    in der Nacht — `fx` liest die Wahl aus `s.antwort[runde]`
 *   Nachwirkung  am Morgen danach
 *
 * Das Datum gehört dem EINSCHLAG; die Vorzeichen laufen davor. Ohne
 * Handlungsfenster ist ein Anker eine Rechnung, die man bezahlt — mit
 * Fenster eine Entscheidung, die man beim zweiten Mal anders trifft.
 */
export interface AnswerDef {
  txt: string
  /** Preis im Klartext, steht auf dem Knopf. */
  kosten: string
  /** Was es bewirkt — vor der Wahl lesbar, nicht erst danach. */
  fx: string
  /** Ist der Preis bezahlbar? Fehlt sie, ist die Antwort immer wählbar. */
  can?: (s: GameState) => boolean
  /** Preis abbuchen. Läuft im Moment der Wahl, nicht beim Einschlag. */
  pay?: (s: GameState) => void
}

export interface AnchorDef extends NightDef {
  /** Runden Vorlauf für das Vorzeichen. 0 = kommt ohne Warnung. */
  vor: number
  vorT?: string
  nachT?: string
  antworten?: AnswerDef[]
}

/** Steht das Handlungsfenster dieses Ankers in Runde `round` offen? */
export function fensterOffen(s: GameState, ankerRunde: number): boolean {
  const a = ANCHORS[ankerRunde]
  if (!a?.antworten) return false
  if (s.antwort[ankerRunde] !== undefined) return false
  return s.round >= ankerRunde - a.vor && s.round <= ankerRunde
}

/* Anker-Ereignisse (belegt, vereinfacht) – geschehen IMMER in dieser Runde */
export const ANCHORS: Record<number, AnchorDef> = {
  3: {
    tag: 'Belegtes Ereignis · ~8 400 v. Chr.',
    h: 'Die Wälder erobern das Tal',
    p: 'Nach der Eiszeit kehrt der Wald zurück. Wo Tundra war, rauschen jetzt Auen. Holz gibt es im Überfluss.',
    vor: 1,
    vorT: 'Die Weiden am Ufer treiben früher als sonst, und im Süden steht ein Grün, das im letzten Sommer noch Stein war.',
    nachT: 'Der Wald steht. Holz gibt es im Überfluss — und Deckung für alles, was jagt.',
    /* Kein Handlungsfenster: nicht jeder Anker verlangt eine Antwort.
       Ein Geschenk bleibt ein Geschenk. */
    fx(s) {
      s.woodBoost = true
      s.b += 1
      return {
        txt: 'Auenwald liefert ab jetzt +2 Material/Tag. (+1 Material)',
        good: true,
      }
    },
  },
  5: {
    tag: 'Belegtes Ereignis · ~6 200 v. Chr.',
    h: 'Die große Kälte',
    p: 'Ein jäher Klimasturz – in Eisbohrkernen bis heute lesbar. Jahrzehnte aus Frost und Missjagd. Niemand im Tal hat so etwas je erlebt.',
    vor: 2,
    vorT: 'Der Sommer kommt zu spät und geht zu früh. Die Beeren bleiben klein, das Wild zieht tiefer als gewohnt.',
    nachT: 'Wer Vorräte und Schutz hatte, ist noch da. Die anderen sind fortgezogen oder nicht mehr.',
    antworten: [
      {
        txt: 'Vorräte anlegen',
        kosten: '−2 Material',
        fx: 'Der Winter kostet nur die Hälfte',
        can: (s) => s.b >= 2,
        pay: (s) => {
          s.b -= 2
        },
      },
      {
        txt: 'Holz schlagen, das Feuer durchbrennen lassen',
        kosten: '−1 Nahrung',
        fx: 'Schutz zählt in dieser Nacht doppelt',
        can: (s) => s.n >= 1,
        pay: (s) => {
          s.n -= 1
        },
      },
    ],
    fx(s, schutz) {
      const wahl = s.antwort[5]
      const wirkt = wahl === 1 ? schutz * 2 : schutz
      const halb = wahl === 0
      if (wirkt >= 5) {
        const kosten = halb ? 1 : 2
        s.n = Math.max(0, s.n - kosten)
        return {
          txt: `Euer Schutz hält stand. −${kosten} Nahrung.${
            wahl === 1 ? ' Das Feuer brannte durch.' : ''
          }`,
          good: true,
        }
      }
      const kosten = halb ? 2 : 4
      s.n = Math.max(0, s.n - kosten)
      return {
        txt: halb
          ? 'Die Vorräte federn die Kälte ab. −2 Nahrung.'
          : 'Ungeschützt trifft euch die Kälte. −4 Nahrung.',
        good: halb,
      }
    },
  },
  7: {
    tag: 'Belegtes Ereignis · ~4 300 v. Chr.',
    h: 'Die ersten Bauern am See',
    p: 'Fremde mit Saatgut und neuen Bauweisen erreichen das Seeufer. Ihre Häuser stehen auf Pfählen im flachen Wasser.',
    vor: 1,
    vorT: 'Am See sind Feuer, die niemandem gehören, den ihr kennt. Und Spuren von Booten, die anders gebaut sind.',
    nachT: 'Die Bauweise wandert flussaufwärts, langsamer als das Gerücht davon.',
    antworten: [
      {
        txt: 'Handeln und die Bauweise lernen',
        kosten: '−1 Nahrung',
        fx: 'Ein Plättchen mehr und +1 Kultur',
        can: (s) => s.n >= 1,
        pay: (s) => {
          s.n -= 1
        },
      },
      {
        txt: 'Auf Abstand bleiben',
        kosten: 'nichts',
        fx: 'Nur ein Pfahlbau — dafür bleibt das Tal euer',
      },
    ],
    fx(s) {
      const wahl = s.antwort[7]
      s.pfahlUnlocked = true
      const zahl = wahl === 0 ? 3 : wahl === 1 ? 1 : 2
      for (let i = 0; i < zahl; i++) s.pending.push('pfahl')
      s.k += wahl === 0 ? 2 : 1
      return {
        txt: `PFAHLBAU freigeschaltet – ${zahl} Plättchen ${
          zahl === 1 ? 'kommt' : 'kommen'
        } auf deine Hand. (+${wahl === 0 ? 2 : 1} Kultur)`,
        good: true,
      }
    },
  },
  9: {
    tag: 'Belegtes Ereignis · ~3 400 v. Chr.',
    h: 'Der See steigt',
    p: 'Nasse Jahrhunderte. Das Wasser holt sich die flachen Ufer zurück.',
    vor: 2,
    vorT: 'Nasse Jahre. Der Steg, der im Frühling gebaut wurde, steht im Herbst im Wasser.',
    nachT: 'Der See hat eine neue Linie. Wer auf Pfählen baute, wohnt jetzt weiter draussen — und trocken.',
    antworten: [
      {
        txt: 'Höher bauen — auf Pfähle',
        kosten: '−3 Material',
        fx: 'Was am Ufer steht, steht danach über dem Wasser',
        can: (s) => s.b >= 3,
        pay: (s) => {
          s.b -= 3
        },
      },
      {
        txt: 'Dem See das Ufer lassen',
        kosten: 'nichts',
        fx: 'Ihr weicht zurück — es kostet mehr Material',
      },
    ],
    fx(s) {
      const wahl = s.antwort[9]
      s.fishBlocked = true
      if (wahl === 0 || s.tiles.some((t) => t.type === 'pfahl')) {
        s.k += 2
        return {
          txt: 'Eure Bauten stehen über der Flut – die Bauweise besteht die Probe. (+2 Kultur, Fischgründe morgen gestört)',
          good: true,
        }
      }
      const kosten = wahl === 1 ? 3 : 2
      s.b = Math.max(0, s.b - kosten)
      return {
        txt: `Das Ufer versinkt. −${kosten} Material, Fischgründe morgen gestört.`,
        good: false,
      }
    },
  },
}

/* Streu-Nächte */
export const NIGHTS: NightDef[] = [
  {
    w: 22,
    tag: 'Die Nacht',
    h: 'Etwas umkreist das Lager',
    glyph: 'wolf',
    p: 'Zweige brechen. Augen im Dunkeln. Der Hund knurrt, das Feuer wird kleiner.',
    fx(s, schutz) {
      if (schutz >= 4)
        return {
          txt: 'Eure Wälle, Feuer und der Jäger halten es fern. Nichts verloren.',
          good: true,
        }
      s.n = Math.max(0, s.n - 2)
      return { txt: 'Am Morgen fehlen Vorräte. −2 Nahrung.', good: false }
    },
  },
  {
    w: 16,
    tag: 'Die Nacht',
    h: 'Frost kriecht ins Lager',
    p: 'Der Atem gefriert an den Fellen. Wer Holz hat, verbrennt es. Wer keins hat, friert.',
    fx(s) {
      if (s.b >= 3) {
        s.b -= 1
        return { txt: 'Ihr verbrennt Vorräte und haltet durch. −1 Material.', good: true }
      }
      s.n = Math.max(0, s.n - 2)
      return { txt: 'Die Kälte zehrt an euch. −2 Nahrung.', good: false }
    },
  },
  {
    w: 18,
    tag: 'Die Nacht',
    h: 'Stille',
    p: 'Nur der Fluss spricht. Die Sterne stehen so klar, dass die Ältesten Geschichten in sie hineinlesen.',
    fx() {
      return {
        txt: 'Nichts geschieht. Manchmal ist das das größte Geschenk.',
        good: true,
      }
    },
  },
  {
    w: 16,
    tag: 'Die Nacht',
    h: 'Gute Jagd im Morgengrauen',
    p: 'Noch vor Sonnenaufgang stellt ihr eine Hirschkuh am Wasser.',
    fx(s) {
      s.n += 2
      return { txt: '+2 Nahrung.', good: true }
    },
  },
  {
    w: 14,
    tag: 'Die Nacht',
    h: 'Fremde am Feuer',
    p: 'Eine kleine Gruppe bittet um Platz am Feuer. Sie kennen Stellen, die ihr nicht kennt.',
    fx(s) {
      s.extraDraw = true
      return { txt: 'Morgen ziehst du ein zusätzliches Plättchen.', good: true }
    },
  },
  {
    w: 14,
    tag: 'Die Nacht',
    h: 'Ein Fund im Kies',
    p: 'Bernstein, glatt wie Wasser. Er kommt von weit her – jemand hat ihn hierher getragen.',
    fx(s) {
      s.k += 1
      return { txt: '+1 Kultur.', good: true }
    },
  },
]

export function fmtYear(y: number): string {
  return y.toLocaleString('de-CH').replace(/[’,.]/g, ' ')
}
