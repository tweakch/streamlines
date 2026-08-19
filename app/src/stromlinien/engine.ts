import { ANCHORS, DECK_WEIGHTS, FUND, NIGHTS, ROUNDS, TILES } from './data'
import { adjCells, buildRegionGrid } from './grid'
import type {
  Cell,
  GameState,
  PersonId,
  PlacedTile,
  RegionCell,
  TileKind,
} from './types'

export function newState(region: RegionCell[]): GameState {
  return {
    phase: 'intro',
    round: 1,
    n: 4,
    s: 1,
    b: 1,
    k: 0,
    prog: 0,
    placedThisDay: 0,
    hand: [],
    pending: [],
    tiles: [],
    cells: buildRegionGrid(region),
    region,
    woodBoost: false,
    pfahlUnlocked: false,
    fishBlocked: false,
    extraDraw: false,
    hungry: 0,
    authGot: 0,
    authMax: 0,
    fundFound: FUND.map(() => false),
    werkzeug: false,
    people: {
      sammler: { cellIdx: null, moved: false },
      jaeger: { cellIdx: null, moved: false },
    },
    combos: [],
    overlay: null,
    nightPending: false,
    toast: null,
    ceremStep: 0,
    ceremFundament: 'none',
  }
}

/** Effektiver Schutz inkl. Jäger (+2, solange er im Tal steht). */
export function effectiveSchutz(s: GameState): number {
  return s.s + (s.people.jaeger.cellIdx !== null ? 2 : 0)
}

/** Indizes der Fundstellen, deren Weltkoordinate im Gebiet liegt. */
export function fundIndexesInRegion(cells: readonly Cell[]): number[] {
  return FUND.map((f, i) =>
    cells.some((c) => c.r === f.r && c.c === f.c) ? i : -1,
  ).filter((i) => i >= 0)
}

export function canBuildWerkzeug(s: GameState): boolean {
  return s.tiles.some((t) => t.type === 'flint') && s.b >= 2 && !s.werkzeug
}

function setToast(s: GameState, msg: string) {
  s.toast = { msg, id: (s.toast?.id ?? 0) + 1 }
}

function drawTile(s: GameState): TileKind {
  if (s.pending.length) return s.pending.shift()!
  const total = DECK_WEIGHTS.reduce((a, [, w]) => a + w, 0)
  let x = Math.random() * total
  for (const [k, w] of DECK_WEIGHTS) {
    x -= w
    if (x <= 0) return k
  }
  return 'ufer'
}

/* Verbund-Boni: statisch (einmalig) bei Entstehung */
function checkCombos(s: GameState, cell: Cell): string | null {
  const tk = cell.tile
  const adj = adjCells(s.cells, cell).filter((c) => c.tile)
  const key = (a: string, b: string, c1: Cell, c2: Cell) =>
    [`${a}:${c1.r},${c1.c}`, `${b}:${c2.r},${c2.c}`].sort().join('|')
  let msg: string | null = null
  const once = (k: string, fx: () => void, m: string) => {
    if (s.combos.includes(k)) return
    s.combos.push(k)
    fx()
    msg = 'VERBUND · ' + m
  }
  if (tk === 'hoehle') {
    const o = adj.find((c) => c.tile === 'terrasse')
    if (o)
      once(key('hoehle', 'terrasse', cell, o), () => (s.s += 1), 'Höhle + Terrasse: +1 Schutz')
  }
  if (tk === 'terrasse') {
    const o = adj.find((c) => c.tile === 'hoehle')
    if (o)
      once(key('hoehle', 'terrasse', o, cell), () => (s.s += 1), 'Höhle + Terrasse: +1 Schutz')
  }
  if (tk === 'pfahl') {
    const o = adj.find((c) => c.tile === 'pfahl')
    if (o)
      once(
        key('pfahl', 'pfahl', cell, o),
        () => (s.k += 1),
        'Zwei Pfahlbauten: ein Dorf entsteht. +1 Kultur',
      )
  }
  return msg
}

/* laufende Verbund-Erträge (im Tageseinkommen) */
function comboIncome(s: GameState, t: PlacedTile): { n: number; b: number } {
  const adj = adjCells(s.cells, s.cells[t.cellIdx]).filter((c) => c.tile)
  const nearCamp = adj.some((c) => c.tile === 'ufer' || c.tile === 'pfahl')
  if (t.type === 'fisch' && nearCamp) return { n: 1, b: 0 }
  if (t.type === 'wald' && nearCamp) return { n: 0, b: 1 }
  return { n: 0, b: 0 }
}

function authFor(
  s: GameState,
  tk: TileKind,
  cell: Cell,
): { pts: number; max: number; fundIdx: number | null } {
  const fundIdx = FUND.findIndex(
    (f, i) =>
      f.r === cell.r && f.c === cell.c && f.types.includes(tk) && !s.fundFound[i],
  )
  let pts = 0
  let max = 3
  if (tk === 'fisch') {
    pts = 2
    max = 2
  } else if (tk === 'pfahl') {
    pts = cell.t === 'lake' || cell.lakeUfer ? 3 : 1
    max = 3
  } else if (tk === 'hoehle') {
    pts = cell.t === 'hang' ? 2 : 0
    max = 2
  } else if (tk === 'terrasse') {
    pts = cell.t === 'hang' ? 2 : 1
    max = 2
  } else if (tk === 'ufer') {
    pts = 1
    max = 1
  } else if (tk === 'wald') {
    pts = cell.t === 'ufer' ? 1 : 0
    max = 1
  } else if (tk === 'flint') {
    pts = cell.t === 'hang' ? 1 : 0
    max = 2
  }
  if (fundIdx >= 0) {
    const f = FUND[fundIdx]
    pts += f.auth
    s.fundFound[fundIdx] = true
    s.k += f.k
  }
  return { pts, max, fundIdx: fundIdx >= 0 ? fundIdx : null }
}

function dayIncome(s: GameState) {
  let n = 0
  let b = 0
  const sammlerCell = s.people.sammler.cellIdx
  for (const t of s.tiles) {
    if (t.type === 'fisch' && !s.fishBlocked) n++
    if (t.type === 'ufer') n++
    if (t.type === 'pfahl') n++
    if (t.type === 'wald') b += s.woodBoost ? 2 : 1
    if (!(t.type === 'fisch' && s.fishBlocked)) {
      const cb = comboIncome(s, t)
      n += cb.n
      b += cb.b
    }
    if (sammlerCell === t.cellIdx) {
      // Sammlerin bewirtschaftet
      if (t.type === 'wald' || t.type === 'flint') b++
      else if ((t.type === 'fisch' && !s.fishBlocked) || t.type === 'ufer') n++
    }
  }
  s.fishBlocked = false
  s.n += n
  s.b += b
}

function startDay(s: GameState) {
  s.phase = 'day'
  s.placedThisDay = 0
  s.people.sammler.moved = false
  s.people.jaeger.moved = false
  const draws = s.extraDraw ? 2 : 1
  s.extraDraw = false
  for (let i = 0; i < draws; i++) if (s.hand.length < 4) s.hand.push(drawTile(s))
  while (s.hand.length < 3) s.hand.push(drawTile(s))
  dayIncome(s)
}

function pickNight(s: GameState) {
  const a = ANCHORS[s.round]
  if (a) return { def: a, anchor: true }
  const total = NIGHTS.reduce((sum, n) => sum + (n.w ?? 0), 0)
  let x = Math.random() * total
  for (const n of NIGHTS) {
    x -= n.w ?? 0
    if (x <= 0) return { def: n, anchor: false }
  }
  return { def: NIGHTS[2], anchor: false }
}

export type Action =
  | { type: 'START' }
  | { type: 'RESTART' }
  | { type: 'TOAST'; msg: string }
  | { type: 'PLACE'; handIdx: number; cellIdx: number }
  | { type: 'MOVE_PERSON'; person: PersonId; cellIdx: number }
  | { type: 'WERKZEUG' }
  | { type: 'BEGIN_NIGHT' }
  | { type: 'REVEAL_NIGHT' }
  | { type: 'END_NIGHT' }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'CEREM_NEXT' }
  | { type: 'CEREM_SACRIFICE'; tileIdx: number }
  | { type: 'CEREM_CHOICE'; take: boolean }

function ceremEnter(s: GameState, step: number) {
  s.ceremStep = step
  if (step === 1) {
    s.n += 1 // Der letzte Sommer: ein Abschied in Fülle
  }
  if (step === 3) {
    const pf = s.tiles.find((t) => t.type === 'pfahl')
    const uf = s.tiles.find((t) => t.type === 'ufer')
    if (pf) {
      s.k += 2
      s.ceremFundament = 'pfahl'
    } else if (uf) {
      s.k += 1
      s.ceremFundament = 'ufer'
    } else {
      s.ceremFundament = 'none'
    }
  }
  if (step === 5) s.phase = 'final'
}

export function reducer(prev: GameState, action: Action): GameState {
  const s = structuredClone(prev)
  switch (action.type) {
    case 'START': {
      const fresh = newState(s.region)
      fresh.phase = 'day'
      for (let i = 0; i < 3; i++) fresh.hand.push(drawTile(fresh))
      if (!fresh.hand.some((t) => t === 'fisch' || t === 'ufer'))
        fresh.hand[0] = 'ufer'
      fresh.toast = {
        msg: 'Tippe ein Plättchen an, dann eine leuchtende Stelle im Tal.',
        id: 1,
      }
      return fresh
    }
    case 'RESTART':
      return newState(s.region)
    case 'TOAST':
      setToast(s, action.msg)
      return s
    case 'PLACE': {
      const tk = s.hand[action.handIdx]
      const cell = s.cells[action.cellIdx]
      if (!tk || !cell || cell.tile || s.phase !== 'day') return prev
      if (!TILES[tk].valid(cell) || (tk === 'pfahl' && !s.pfahlUnlocked)) return prev
      if (tk === 'pfahl') {
        if (s.b < 3) {
          setToast(s, 'Pfahlbau braucht 3 Material.')
          return s
        }
        s.b -= 3
        s.s += 1
      }
      if (tk === 'hoehle') s.s += 2
      if (tk === 'terrasse') s.s += 1
      cell.tile = tk
      s.tiles.push({ type: tk, cellIdx: cell.idx })
      s.hand.splice(action.handIdx, 1)
      s.placedThisDay++
      const comboMsg = checkCombos(s, cell)
      const a = authFor(s, tk, cell)
      s.authGot += a.pts
      s.authMax += a.max
      if (a.fundIdx !== null) {
        s.overlay = { kind: 'fund', fundIdx: a.fundIdx }
        setToast(s, `FUNDSTELLE ENTDECKT · +${FUND[a.fundIdx].k} Kultur`)
      } else {
        setToast(
          s,
          comboMsg ??
            (a.pts >= a.max
              ? `+${a.pts} Authentizität – so bauten sie wirklich`
              : a.pts > 0
                ? `+${a.pts} Authentizität`
                : 'Hier gab es das nie. +0 Authentizität'),
        )
      }
      return s
    }
    case 'MOVE_PERSON': {
      const p = s.people[action.person]
      const first = p.cellIdx === null
      p.cellIdx = action.cellIdx
      p.moved = true
      setToast(
        s,
        (action.person === 'sammler' ? 'Die Sammlerin' : 'Der Jäger') +
          (first ? ' betritt das Tal.' : ' zieht weiter.'),
      )
      return s
    }
    case 'WERKZEUG': {
      if (!canBuildWerkzeug(s)) return prev
      s.b -= 2
      s.s += 2
      s.werkzeug = true
      setToast(s, 'Werkzeuge aus Feuerstein – +2 Schutz')
      return s
    }
    case 'BEGIN_NIGHT': {
      if (s.placedThisDay === 0 || s.phase !== 'day') return prev
      s.phase = 'night'
      s.nightPending = true
      return s
    }
    case 'REVEAL_NIGHT': {
      if (!s.nightPending) return prev
      s.nightPending = false
      const { def, anchor } = pickNight(s)
      const result = def.fx(s, effectiveSchutz(s))
      s.n = Math.max(0, s.n - 1) // der Stamm isst
      s.overlay = {
        kind: 'night',
        anchor,
        tag: def.tag,
        h: def.h,
        p: def.p,
        glyph: def.glyph ?? null,
        result,
      }
      return s
    }
    case 'END_NIGHT': {
      s.overlay = null
      if (s.n <= 0) {
        s.hungry++
        setToast(s, `Die Vorräte sind leer. Der Stamm hungert (${s.hungry}/2).`)
      } else s.hungry = 0
      if (s.hungry >= 2) {
        s.phase = 'gameover'
        return s
      }
      const gain = Math.max(0, Math.min(3, Math.min(s.n, effectiveSchutz(s), s.b)))
      s.prog += gain
      s.round++
      if (s.round > ROUNDS) {
        s.phase = 'ceremony'
        ceremEnter(s, 1)
        return s
      }
      startDay(s)
      setToast(
        s,
        gain > 0
          ? `Sesshaftigkeit +${gain} (schwächste Ressource zählt)`
          : 'Keine Sesshaftigkeit – eine Ressource liegt bei null.',
      )
      return s
    }
    case 'CLOSE_OVERLAY':
      s.overlay = null
      return s
    case 'CEREM_NEXT':
      ceremEnter(s, s.ceremStep + 1)
      return s
    case 'CEREM_SACRIFICE': {
      const t = s.tiles[action.tileIdx]
      if (!t) return prev
      if (t.type === 'hoehle') s.s = Math.max(0, s.s - 2)
      s.cells[t.cellIdx].tile = null
      s.tiles.splice(action.tileIdx, 1)
      setToast(s, `${TILES[t.type].nm} geopfert.`)
      ceremEnter(s, 3)
      return s
    }
    case 'CEREM_CHOICE': {
      if (action.take) {
        s.n += 2
        s.k += 1
        s.s = Math.max(0, s.s - 1)
        setToast(s, 'Die Fremden bleiben. Das Tal wird größer als ein Stamm.')
      } else {
        s.s += 1
        setToast(s, 'Sie ziehen weiter, seewärts.')
      }
      ceremEnter(s, 5)
      return s
    }
  }
}

/** Aktuelle Wirkungen eines gelegten Plättchens (für den Feld-Inspektor). */
export function tileEffects(s: GameState, cell: Cell): string[] {
  const t = cell.tile
  const fx: string[] = []
  if (!t) return fx
  const adj = adjCells(s.cells, cell).filter((c) => c.tile)
  const nearCamp = adj.some((c) => c.tile === 'ufer' || c.tile === 'pfahl')
  if (t === 'fisch') {
    fx.push(
      s.fishBlocked
        ? 'Fischgründe gestört – morgen kein Ertrag'
        : '+1 Nahrung/Tag',
    )
    if (nearCamp)
      fx.push('Verbund Fangplatz (Lager/Pfahlbau nebenan): +1 Nahrung/Tag')
  }
  if (t === 'ufer') fx.push('+1 Nahrung/Tag')
  if (t === 'pfahl') {
    fx.push('+1 Nahrung/Tag')
    fx.push('+1 Schutz (beim Bau erhalten)')
  }
  if (t === 'wald') {
    fx.push(
      s.woodBoost ? '+2 Material/Tag (Wiederbewaldung)' : '+1 Material/Tag',
    )
    if (nearCamp) fx.push('Verbund (Lager/Pfahlbau nebenan): +1 Material/Tag')
  }
  if (t === 'terrasse') fx.push('+1 Schutz (beim Bau erhalten)')
  if (t === 'hoehle') fx.push('+2 Schutz (beim Bau erhalten)')
  if (t === 'flint') fx.push('ermöglicht Werkzeug (−2 Material → +2 Schutz)')
  const keypart = `${t}:${cell.r},${cell.c}`
  if (s.combos.some((k) => k.includes(keypart))) {
    if (t === 'hoehle' || t === 'terrasse')
      fx.push('Verbund aktiv: Höhle + Terrasse (+1 Schutz, einmalig erhalten)')
    if (t === 'pfahl')
      fx.push('Verbund aktiv: Dorf (+1 Kultur, einmalig erhalten)')
  }
  return fx
}

/* -------- Endauswertung (pure Ableitung für den Final-Screen) -------- */
export interface FinalScore {
  balance: number
  auth: number
  fundFound: number
  tier: string
  tierTxt: string
}

export function finalScore(s: GameState): FinalScore {
  const vals = [s.n, effectiveSchutz(s), s.b, s.k]
  const avg = vals.reduce((a, b) => a + b, 0) / 4
  const balance = avg > 0 ? Math.round((Math.min(...vals) / avg) * 100) : 0
  const auth = s.authMax > 0 ? Math.round((s.authGot / s.authMax) * 100) : 0
  const fundFound = s.fundFound.filter(Boolean).length
  let tier: string
  let tierTxt: string
  if (s.prog >= 16) {
    tier = 'Die Pfahlbauer'
    tierTxt =
      'Euer Dorf steht auf Pfählen im flachen Wasser – genau dort, wo Jahrtausende später Taucher seine Reste finden werden. Epoche II wartet: Von Süden her erzählen Händler von einem Volk, das Straßen baut.'
  } else if (s.prog >= 10) {
    tier = 'Am Ufer angekommen'
    tierTxt =
      'Ihr seid geblieben – noch nicht fest verwurzelt, aber das Tal kennt jetzt eure Namen. Die nächste Epoche wird entscheiden, ob es sie behält.'
  } else {
    tier = 'Das Tal bleibt wild'
    tierTxt =
      'Ihr habt überlebt, mehr nicht. Andere werden es sein, deren Spuren die Archäologie findet. Aber jetzt kennst du das Tal – und weißt, wann die Kälte kommt.'
  }
  return { balance, auth, fundFound, tier, tierTxt }
}
