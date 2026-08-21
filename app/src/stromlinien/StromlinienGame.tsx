import { useEffect, useMemo, useReducer, useState } from 'react'
import type { CSSProperties } from 'react'
import './stromlinien.css'
import { clearSave, writeSave } from '../shell/storage'
import { FUND, GLYPHS, ROUNDS, TERRAIN, TILES, YEARS, fmtYear } from './data'
import {
  canBuildWerkzeug,
  effectiveSchutz,
  finalScore,
  fundIndexesInRegion,
  reducer,
  tileEffects,
} from './engine'
import { ANCHORS, fensterOffen } from './data'
import { gridBounds, personTargets } from './grid'
import { HINT_INSPECT } from './world'
import type { Cell, GameState, PersonId, TileKind } from './types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V']

function Glyph({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={className ?? 'glyph'}
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
    />
  )
}

export function StromlinienGame({
  initial,
  initialLastEvent,
  profileId,
  onExit,
  onNav,
}: {
  /** Frischer Zustand (neues Gebiet) oder wiederhergestellter Autosave. */
  initial: GameState
  initialLastEvent: string | null
  profileId: string
  onExit: () => void
  onNav: (s: 'regeln' | 'epochen') => void
}) {
  const [state, dispatch] = useReducer(reducer, initial, (i: GameState) => i)
  const [selIdx, setSelIdx] = useState<number | null>(null)
  const [selPerson, setSelPerson] = useState<PersonId | null>(null)
  const [inspectIdx, setInspectIdx] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [abandonOpen, setAbandonOpen] = useState(false)

  const night = state.phase === 'night' || state.phase === 'gameover'

  /* „zuletzt: …" für die Resume-Karten der Shell — jetzt aus der Chronik
     abgeleitet statt in einem eigenen Ref mitgeführt. Eine Quelle, kein
     Nebenzustand, der auseinanderlaufen kann. */
  const lastEvent =
    state.chronik.length > 0
      ? state.chronik[state.chronik.length - 1].txt
      : initialLastEvent

  /* Autosave nach jeder Aktion: Schliessen verliert nie mehr als die
     aktuelle Eingabe. Beendete Partien räumen ihren Stand weg.
     Der Indikator macht das sichtbar — sonst muss man es glauben. */
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (state.phase === 'gameover' || state.phase === 'final') {
      clearSave(profileId)
      return
    }
    if (state.phase === 'intro') return
    writeSave(profileId, state, lastEvent)
    /* Quittung für einen Schreibvorgang nach aussen: der Punkt blinkt kurz
       und fällt von selbst zurück. Der Zeitgeber beendet die Kette, ein
       Render-Kreis ist damit ausgeschlossen. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaving(true)
    const t = setTimeout(() => setSaving(false), 650)
    return () => clearTimeout(t)
  }, [state, profileId, lastEvent])

  function abandonRun() {
    clearSave(profileId)
    onExit()
  }

  /*
   * Der Morgenbericht ist vollständig aus der Runde ABGELEITET — kein
   * eigener Zustand, also auch nichts, was ein Spielstand mitschleppen oder
   * eine Migration nachziehen müsste. Vorzeichen laufen von `r − vor` bis
   * zur Runde vor dem Einschlag, die Nachwirkung steht am Morgen danach.
   */
  const bericht = useMemo(() => {
    const zeilen: Array<{ art: string; txt: string }> = []
    const offen: number[] = []
    /* Was die Nacht hinterliess: der jüngste Chronik-Eintrag der Vorrunde.
       Bisher stand das nur flüchtig im Toast und war beim Weiterspielen weg. */
    const nacht = [...state.chronik]
      .reverse()
      .find(
        (e) =>
          e.round === state.round - 1 &&
          (e.art === 'nacht' || e.art === 'anker'),
      )
    if (nacht) zeilen.push({ art: 'nachtrag', txt: `In der Nacht: ${nacht.txt}` })
    for (const key of Object.keys(ANCHORS)) {
      const r = Number(key)
      const a = ANCHORS[r]
      if (a.vorT && state.round >= r - a.vor && state.round < r)
        zeilen.push({ art: 'vor', txt: a.vorT })
      if (a.nachT && state.round === r + 1)
        zeilen.push({ art: 'nach', txt: a.nachT })
      if (fensterOffen(state, r)) offen.push(r)
    }
    return { zeilen, offen }
  }, [state])

  /* Das Spielfeld ist das geformte Weltkarten-Gebiet: gerendert wird sein
     Begrenzungsrechteck, Lücken bleiben unsichtbare Geisterzellen. */
  const bounds = useMemo(() => gridBounds(state.cells), [state.cells])
  const byPos = useMemo(
    () => new Map(state.cells.map((c) => [`${c.r},${c.c}`, c])),
    [state.cells],
  )
  const regionFunds = useMemo(
    () => fundIndexesInRegion(state.cells),
    [state.cells],
  )
  const mapCols = bounds.cMax - bounds.cMin + 1
  const mapRows = bounds.rMax - bounds.rMin + 1
  const mapAspect = (1.1547 * (0.75 * mapRows + 0.25)) / (mapCols + 0.5)

  /* Nacht-Sequenz: Botschaft blendet per CSS ein/aus, danach Ereignis aufdecken */
  useEffect(() => {
    if (!state.nightPending) return
    const t = setTimeout(() => dispatch({ type: 'REVEAL_NIGHT' }), 1900)
    return () => clearTimeout(t)
  }, [state.nightPending])

  const moveTargets = useMemo(
    () =>
      selPerson
        ? personTargets(state.cells, state.tiles, state.people[selPerson])
        : null,
    [selPerson, state.cells, state.tiles, state.people],
  )

  function isValidPlacement(cell: Cell): boolean {
    if (selIdx === null || cell.tile || state.phase !== 'day') return false
    const tk = state.hand[selIdx]
    if (!tk) return false
    if (tk === 'pfahl' && !state.pfahlUnlocked) return false
    return TILES[tk].valid(cell)
  }

  function clickCell(cell: Cell) {
    if (moveTargets?.has(cell.idx) && selPerson) {
      dispatch({ type: 'MOVE_PERSON', person: selPerson, cellIdx: cell.idx })
      setSelPerson(null)
    } else if (selIdx !== null && isValidPlacement(cell)) {
      dispatch({ type: 'PLACE', handIdx: selIdx, cellIdx: cell.idx })
      setSelIdx(null)
    } else {
      setInspectIdx(inspectIdx === cell.idx ? null : cell.idx)
    }
  }

  function startFresh(type: 'START' | 'RESTART') {
    setInspectIdx(null)
    setSelIdx(null)
    setSelPerson(null)
    dispatch({ type })
  }

  function togglePerson(pid: PersonId) {
    if (state.phase !== 'day') return
    if (state.people[pid].moved) {
      dispatch({ type: 'TOAST', msg: 'Heute schon bewegt – morgen wieder.' })
      return
    }
    const next = selPerson === pid ? null : pid
    setSelPerson(next)
    setSelIdx(null)
    if (next) {
      const targets = personTargets(state.cells, state.tiles, state.people[next])
      dispatch({
        type: 'TOAST',
        msg:
          targets.size === 0
            ? 'Kein erreichbares Plättchen – erst bauen.'
            : next === 'sammler'
              ? 'Sammlerin: +1 Ertrag auf Wald, Feuerstein, Fischgrund oder Lager.'
              : 'Jäger: +2 Schutz, solange er im Tal steht.',
      })
    }
  }

  function selectHand(i: number) {
    setSelIdx(selIdx === i ? null : i)
    setSelPerson(null)
  }

  /* ---------------- screens ---------------- */

  if (state.phase === 'intro') {
    return (
      <div className="sl">
        <div className="full">
          <div className="full-inner">
            <div className="sub">Epoche I · 10 000 – 2 000 v. Chr.</div>
            <h1>
              Das Tal,
              <br />
              bevor es Namen trug.
            </h1>
            <p>
              Der Gletscher ist fort. Ein junger Fluss sucht seinen Weg zum
              großen See. Dein kleiner Stamm folgt ihm.
            </p>
            <p>
              <b>Am Tag</b> legst du ein Plättchen und sicherst Nahrung, Schutz,
              Baumaterial.
              <br />
              <b>In der Nacht</b> deckst du auf, was im Dunkeln geschah.
            </p>
            <p className="dim">
              <b>Zwei Menschen</b> gehören zu dir: Die <b>Sammlerin ✦</b>{' '}
              bewirtschaftet ein Plättchen (+1 Ertrag), der <b>Jäger ➤</b> gibt
              +2 Schutz, wo immer er steht. Sie ziehen höchstens zwei Schritte
              pro Tag – nur an den <b>Furten</b> kommen sie über den Fluss.
            </p>
            <p className="dim">
              <b>Verbünde</b>: Jedes sechseckige Plättchen hat bis zu sechs
              Nachbarn. Fischgrund oder Wald neben einem Lager liefern mehr.
              Höhle neben Terrasse schützt besser. Zwei Pfahlbauten nebeneinander
              werden zum Dorf. Die Furt verbindet auch Plättchen über den Fluss
              hinweg.
            </p>
            <p className="dim">
              ◆ An manchen Stellen der Zeit warten <b>belegte Ereignisse</b> –
              sie geschehen immer, ob du bereit bist oder nicht. Beim ersten Mal
              wirst du überrascht. Beim zweiten Mal bist du ein Zeitreisender.
            </p>
            <p className="dim">
              {regionFunds.length > 0
                ? regionFunds.length === 1
                  ? 'In eurem Tal liegt eine echte Fundstelle verborgen. Wer richtig baut, entdeckt sie.'
                  : `In eurem Tal liegen ${regionFunds.length} echte Fundstellen verborgen. Wer richtig baut, entdeckt sie.`
                : 'In eurem Tal ist keine Fundstelle belegt – die Archäologie fand ihre Spuren anderswo. Baut trotzdem, wie es die Zeit erlaubt hätte.'}
            </p>
            <button
              className="primary"
              style={{ width: '100%' }}
              onClick={() => startFresh('START')}
            >
              Der erste Morgen bricht an
            </button>
            <button
              style={{ width: '100%', marginTop: 8 }}
              onClick={onExit}
            >
              ← Zurück zur Weltkarte
            </button>
            <p className="legend">
              Prototyp. Ereignisse &amp; Fundstellen sind historisch inspiriert
              und für das Spiel vereinfacht – Jahreszahlen gerundet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'gameover') {
    return (
      <div className="sl night">
        <div className="full">
          <div className="full-inner">
            <div className="sub">
              {fmtYear(YEARS[Math.min(state.round, ROUNDS) - 1])} v. Chr.
            </div>
            <h1>Der Stamm zieht weiter.</h1>
            <p>
              Zwei Winter ohne Vorräte – das Tal gibt euch nichts mehr. Ihr folgt
              dem Wild nach Norden. Vielleicht kehren eure Enkel zurück.
            </p>
            <p className="dim">
              So endeten die meisten Geschichten dieser Zeit. Die Archäologie
              findet nur die, die blieben.
            </p>
            <div className="rule" />
            <button
              className="primary"
              style={{ width: '100%' }}
              onClick={() => startFresh('RESTART')}
            >
              Noch einmal – diesmal weißt du, was kommt
            </button>
            <button
              style={{ width: '100%', marginTop: 8 }}
              onClick={onExit}
            >
              ← Zurück zur Weltkarte
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'ceremony' || state.phase === 'final') {
    return (
      <div className="sl">
        <div className="full">
          <div className="full-inner">
            <Ceremony
              state={state}
              regionFundCount={regionFunds.length}
              onNext={() => dispatch({ type: 'CEREM_NEXT' })}
              onSacrifice={(i) => dispatch({ type: 'CEREM_SACRIFICE', tileIdx: i })}
              onChoice={(take) => dispatch({ type: 'CEREM_CHOICE', take })}
              onRestart={() => startFresh('RESTART')}
              onExit={onExit}
            />
          </div>
        </div>
        {state.toast && (
          <div className="toast" key={state.toast.id}>
            {state.toast.msg}
          </div>
        )}
      </div>
    )
  }

  /* ---------------- day/night game screen ---------------- */

  const schutz = effectiveSchutz(state)

  return (
    <div className={`sl${night ? ' night' : ''}`}>
      <div className="sl-wrap">
        <div className="side">
        <header>
          <div className="brand">
            STROMLINIEN
            <small>EPOCHE I · ALPENRHEIN</small>
          </div>
          <div className="year">
            <b>{fmtYear(YEARS[state.round - 1])}</b>
            <span>
              <span className="phase-dot" />
              v. Chr. · {state.phase === 'night' ? 'NACHT' : 'TAG'}
            </span>
          </div>
          <div className="hdrbtns">
            {/* Nur der Punkt: der Kopf trägt schon Marke, Jahr und Phase.
                Der Wortlaut steht im Lager-Menü, wo man nachsieht, wenn man
                um seinen Fortschritt fürchtet. */}
            <span
              className={`autosave${saving ? ' saving' : ''}`}
              title={saving ? 'speichert …' : 'Stand gespeichert'}
              aria-label={saving ? 'speichert' : 'Stand gespeichert'}
            >
              <span className="dot" />
            </span>
            <button
              className="iconbtn"
              onClick={onExit}
              aria-label="Zur Weltkarte"
              title="Zur Weltkarte — gespeichert"
            >
              ⬡
            </button>
            <button
              className="iconbtn"
              onClick={() => setMenuOpen(true)}
              aria-label="Menü"
            >
              ☰
            </button>
          </div>
        </header>

        <div className="timeline">
          {Array.from({ length: ROUNDS }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className={`tl-seg${i < state.round ? ' done' : ''}${
                i === state.round ? ' now' : ''
              }${ANCHORS[i] ? ' anchor' : ''}`}
            >
              {i <= state.round ? i : ANCHORS[i] ? '?' : i}
            </div>
          ))}
        </div>

        <div className="res">
          <div className="chip">
            <b>{state.n}</b>
            <span>Nahrung</span>
          </div>
          <div className="chip">
            <b>{schutz}</b>
            <span>Schutz</span>
          </div>
          <div className="chip">
            <b>{state.b}</b>
            <span>Material</span>
          </div>
          <div className="chip">
            <b>{state.k}</b>
            <span>Kultur</span>
          </div>
        </div>

        <div className="prog">
          <div className="lbl">
            <span>Sesshaftigkeit</span>
            <span>{state.prog} / 20</span>
          </div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${Math.min(100, (state.prog / 20) * 100)}%` }}
            />
          </div>
        </div>

        <div className="peoplebar">
          {(['sammler', 'jaeger'] as const).map((pid) => {
            const p = state.people[pid]
            return (
              <div
                key={pid}
                className={`pbtn${selPerson === pid ? ' sel' : ''}${
                  p.moved && selPerson !== pid ? ' moved' : ''
                }`}
                onClick={() => togglePerson(pid)}
              >
                <div className="pico">{pid === 'sammler' ? '✦' : '➤'}</div>
                <div className="ptxt">
                  <b>{pid === 'sammler' ? 'Sammlerin' : 'Jäger'}</b>
                  <span>
                    {p.cellIdx === null
                      ? 'nicht im Tal'
                      : p.moved
                        ? 'im Einsatz · bewegt'
                        : 'im Einsatz'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {state.phase === 'day' && bericht.zeilen.length > 0 && (
          <div className="morgen">
            <div className="mtag">Der Morgen</div>
            {bericht.zeilen.map((z, i) => (
              <p key={i} className={`mz k-${z.art}`}>
                {z.txt}
              </p>
            ))}
            {bericht.offen.map((r) => {
              const a = ANCHORS[r]
              return (
                <div className="fenster" key={r}>
                  <b>Was tut das Tal?</b>
                  {a.antworten!.map((opt, i) => {
                    const kann = !opt.can || opt.can(state)
                    return (
                      <button
                        key={i}
                        className="antw"
                        disabled={!kann}
                        onClick={() =>
                          dispatch({ type: 'ANSWER', anchorRound: r, idx: i })
                        }
                      >
                        <span className="atxt">{opt.txt}</span>
                        <span className="ako">
                          {opt.kosten} · {opt.fx}
                        </span>
                      </button>
                    )
                  })}
                  <div className="ahint">
                    Nichts tun ist auch eine Antwort — dann trifft das Ereignis
                    das Tal, wie es ist.
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {inspectIdx !== null && (
          <TileInfo
            state={state}
            cell={state.cells[inspectIdx]}
            onClose={() => setInspectIdx(null)}
            onMove={(pid) => {
              dispatch({ type: 'MOVE_PERSON', person: pid, cellIdx: inspectIdx })
              setSelPerson(null)
            }}
            onBuild={(handIdx) => {
              dispatch({ type: 'PLACE', handIdx, cellIdx: inspectIdx })
              setSelIdx(null)
            }}
          />
        )}
        </div>

        <div
          className="mapwrap"
          style={{ '--aspect': mapAspect } as CSSProperties}
        >
          <div className="map" style={{ '--cols': mapCols } as CSSProperties}>
            {Array.from({ length: mapRows }, (_, ri) => {
              const r = bounds.rMin + ri
              return (
                <div key={r} className={`hexrow${r % 2 ? ' odd' : ''}`}>
                  {Array.from({ length: mapCols }, (_, ci) => {
                    const c = bounds.cMin + ci
                    const cell = byPos.get(`${r},${c}`)
                    if (!cell) return <div key={c} className="cell ghost" />
                    const valid =
                      (moveTargets?.has(cell.idx) ?? false) || isValidPlacement(cell)
                    const cls = cell.furt
                      ? 'furt'
                      : cell.t === 'water'
                        ? 'water'
                        : cell.t === 'lake'
                          ? 'lake'
                          : cell.t === 'hang'
                            ? 'hang'
                            : ''
                    return (
                      <div
                        key={c}
                        className={`cell ${cls}${cell.tile ? ' placed' : ''}${
                          valid ? ' valid' : ''
                        }${cell.idx === inspectIdx ? ' inspect' : ''}`}
                        onClick={() => clickCell(cell)}
                      >
                        {cell.furt && <div className="furtlabel">FURT</div>}
                        {cell.tile && <Glyph name={TILES[cell.tile].glyph} />}
                        {cell.hint && <div className="hintmark">◈</div>}
                        {(['sammler', 'jaeger'] as const).map(
                          (pid) =>
                            state.people[pid].cellIdx === cell.idx && (
                              <div key={pid} className="person">
                                {pid === 'sammler' ? '✦' : '➤'}
                              </div>
                            ),
                        )}
                        {cell.landmark && (
                          <div
                            className={`riverlabel${
                              cell.t === 'water' || cell.t === 'lake' ? '' : ' dark'
                            }`}
                          >
                            {cell.landmark.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className="handwrap">
        <div className="hand">
          {state.hand.map((tk, i) => (
            <div
              key={`${tk}-${i}`}
              className={`tcard${selIdx === i ? ' sel' : ''}`}
              onClick={() => selectHand(i)}
            >
              <Glyph name={TILES[tk].glyph} />
              <div className="nm">{TILES[tk].nm}</div>
              <div className="fx">{TILES[tk].fx}</div>
            </div>
          ))}
        </div>
        <div className="actionrow">
          <button
            className="small"
            disabled={!canBuildWerkzeug(state)}
            onClick={() => dispatch({ type: 'WERKZEUG' })}
          >
            Werkzeug (−2 Mat, +2 Schutz)
          </button>
          <button
            className="primary"
            disabled={state.placedThisDay === 0 || state.phase !== 'day'}
            onClick={() => dispatch({ type: 'BEGIN_NIGHT' })}
          >
            {state.placedThisDay === 0
              ? 'Erst ein Plättchen legen …'
              : 'Nacht anbrechen lassen'}
          </button>
        </div>
        </div>
      </div>

      {state.nightPending && (
        /* Quickwin: erzwungene Animation ist antippbar-überspringbar. */
        <div
          className="nightveil"
          onClick={() => dispatch({ type: 'REVEAL_NIGHT' })}
        >
          <div className="nightmsg seq">Die Nacht bricht an …</div>
          <div className="nightskip">tippen zum Überspringen</div>
        </div>
      )}

      {menuOpen && (
        <div
          className="shellmenu on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuOpen(false)
          }}
        >
          <div className="menupanel">
            <h2>Das Lager</h2>
            <div className="msub">
              Runde {state.round} · {state.phase === 'night' ? 'Nacht' : 'Tag'}
            </div>
            <button className="menu-item" onClick={() => setMenuOpen(false)}>
              <span className="ic">▶</span>
              <span>
                Fortsetzen<small>zurück zum Spiel</small>
              </span>
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setMenuOpen(false)
                onNav('regeln')
              }}
            >
              <span className="ic">📜</span>
              <span>
                Regeln<small>Tag/Nacht, Verbünde, Zeremonie</small>
              </span>
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setMenuOpen(false)
                onNav('epochen')
              }}
            >
              <span className="ic">≡</span>
              <span>
                Epochen<small>Kampagnen-Übersicht</small>
              </span>
            </button>
            <div className="mspacer" />
            <button
              className="menu-item mdanger"
              onClick={() => {
                setMenuOpen(false)
                setAbandonOpen(true)
              }}
            >
              <span className="ic">✕</span>
              <span>
                Partie aufgeben<small>unwiderruflich</small>
              </span>
            </button>
            <div className="mfoot">
              <span className={`autosave${saving ? ' saving' : ''}`}>
                <span className="dot" />
                <span className="autosave-txt">
                  {saving ? 'speichert …' : 'gespeichert'}
                </span>
              </span>
              Autosave nach jeder Aktion — Schliessen verliert nie mehr als die
              aktuelle Eingabe. Verlassen geht direkt über ⬡ oben.
            </div>
          </div>
        </div>
      )}

      {abandonOpen && (
        <div
          className="shellconfirm on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbandonOpen(false)
          }}
        >
          <div className="confirmcard">
            <h3>Partie wirklich aufgeben?</h3>
            <p>
              Der Fortschritt geht verloren. Das Gebiet bleibt auf der Weltkarte
              aufgedeckt.
            </p>
            <div className="crow">
              <button onClick={() => setAbandonOpen(false)}>Abbrechen</button>
              <button className="dangersolid" onClick={abandonRun}>
                Ja, aufgeben
              </button>
            </div>
          </div>
        </div>
      )}

      <OverlayCard
        state={state}
        onClose={() =>
          dispatch({
            type: state.overlay?.kind === 'night' ? 'END_NIGHT' : 'CLOSE_OVERLAY',
          })
        }
      />

      {state.toast && (
        <div className="toast" key={state.toast.id}>
          {state.toast.msg}
        </div>
      )}
    </div>
  )
}

function TileInfo({
  state,
  cell,
  onClose,
  onMove,
  onBuild,
}: {
  state: GameState
  cell: Cell
  onClose: () => void
  onMove: (pid: PersonId) => void
  onBuild: (handIdx: number) => void
}) {
  const ter = cell.furt ? TERRAIN.furt : TERRAIN[cell.t]
  const title = cell.tile ? TILES[cell.tile].nm : ter.nm
  let loc = cell.landmark ?? `${cell.c}·${cell.r}`
  if (cell.lakeUfer && !cell.landmark && !cell.tile) loc += ' · Seeufer'

  const people = (['sammler', 'jaeger'] as const).filter(
    (pid) => state.people[pid].cellIdx === cell.idx,
  )
  const moves = (['sammler', 'jaeger'] as const).filter(
    (pid) =>
      state.phase === 'day' &&
      !state.people[pid].moved &&
      personTargets(state.cells, state.tiles, state.people[pid]).has(cell.idx),
  )
  const builds: Array<{ i: number; tk: TileKind }> = []
  if (state.phase === 'day' && !cell.tile) {
    const seen = new Set<TileKind>()
    state.hand.forEach((tk, i) => {
      if (seen.has(tk)) return
      seen.add(tk)
      if (TILES[tk].valid(cell) && !(tk === 'pfahl' && !state.pfahlUnlocked))
        builds.push({ i, tk })
    })
  }

  return (
    <div className="tileinfo">
      <div className="ti-head">
        <b>{title}</b>
        <span className="ti-loc">{loc}</span>
        <button className="ti-close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      </div>
      <p className="ti-desc">
        <b>{ter.nm}</b> · {ter.desc}
      </p>
      <div className="ti-sec">
        <span className="ti-lbl">Plättchen</span>
        {cell.tile ? (
          <>
            <div className="ti-row">
              <Glyph name={TILES[cell.tile].glyph} />
              {TILES[cell.tile].nm}
            </div>
            <p className="ti-desc">{TILES[cell.tile].desc}</p>
            <ul>
              {tileEffects(state, cell).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="ti-desc">Noch unbebaut.</p>
        )}
      </div>
      {cell.hint && (
        <div className="ti-sec">
          <span className="ti-lbl">Zeichen ◈</span>
          <p className="ti-desc">{HINT_INSPECT[cell.hint]}</p>
        </div>
      )}
      {people.length > 0 && (
        <div className="ti-sec">
          <span className="ti-lbl">Menschen</span>
          <ul>
            {people.map((pid) => (
              <li key={pid}>
                <b>{pid === 'sammler' ? 'Sammlerin ✦' : 'Jäger ➤'}</b> –{' '}
                {pid === 'sammler'
                  ? 'bewirtschaftet dieses Plättchen: +1 Ertrag/Tag'
                  : '+2 Schutz für den Stamm, solange er im Tal steht'}
                {state.people[pid].moved ? ' · heute schon bewegt' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(moves.length > 0 || builds.length > 0) && (
        <div className="ti-sec">
          <span className="ti-lbl">Aktionen</span>
          <div className="ti-actions">
            {moves.map((pid) => (
              <button key={pid} onClick={() => onMove(pid)}>
                {pid === 'sammler' ? 'Sammlerin ✦' : 'Jäger ➤'} hierher ziehen
              </button>
            ))}
            {builds.map(({ i, tk }) => (
              <button key={tk} onClick={() => onBuild(i)}>
                {TILES[tk].nm} hier bauen
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OverlayCard({
  state,
  onClose,
}: {
  state: GameState
  onClose: () => void
}) {
  const visible = state.overlay !== null || state.nightPending
  /* Fund-Karten flippen per CSS-Animation direkt nach dem Einblenden;
     Nachtkarten erst, wenn das Ereignis aufgedeckt ist. */
  const flipCls =
    state.overlay?.kind === 'night'
      ? ' flip'
      : state.overlay?.kind === 'fund'
        ? ' fundflip'
        : ''

  return (
    <div className={`overlay${visible ? ' on' : ''}`}>
      <div className={`ncard${flipCls}`}>
        <div className="ncard-inner">
          <div className="nface nback">
            <div className="moon">☾</div>
            <div className="nback-lbl">WAS GESCHIEHT IM DUNKELN?</div>
          </div>
          {state.overlay?.kind === 'night' && (
            <div className={`nface nfront${state.overlay.anchor ? ' anchor' : ''}`}>
              <div className="tag">
                {state.overlay.anchor ? '◆ ' : ''}
                {state.overlay.tag}
              </div>
              {state.overlay.glyph && (
                <Glyph name={state.overlay.glyph} className="nglyph" />
              )}
              <h2>{state.overlay.h}</h2>
              <p>{state.overlay.p}</p>
              <div className={`result ${state.overlay.result.good ? 'good' : 'bad'}`}>
                {state.overlay.result.txt}
              </div>
              <p className="eats">Der Stamm isst: −1 Nahrung</p>
              <button onClick={onClose}>Den Morgen erwarten</button>
            </div>
          )}
          {state.overlay?.kind === 'fund' && (
            <div className="nface nfront anchor">
              <div className="tag">Fundstelle entdeckt</div>
              <h2>{FUND[state.overlay.fundIdx].name}</h2>
              <p>{FUND[state.overlay.fundIdx].txt}</p>
              <div className="result good">
                +{FUND[state.overlay.fundIdx].k} Kultur · +
                {FUND[state.overlay.fundIdx].auth} Authentizität
              </div>
              <button onClick={onClose}>Weiterbauen</button>
            </div>
          )}
          {!state.overlay && <div className="nface nfront" />}
        </div>
      </div>
    </div>
  )
}

function Ceremony({
  state,
  regionFundCount,
  onNext,
  onSacrifice,
  onChoice,
  onRestart,
  onExit,
}: {
  state: GameState
  regionFundCount: number
  onNext: () => void
  onSacrifice: (tileIdx: number) => void
  onChoice: (take: boolean) => void
  onRestart: () => void
  onExit: () => void
}) {
  if (state.phase === 'final') {
    const f = finalScore(state)
    return (
      <>
        <div className="cnum">ZEREMONIE · KARTE V / V</div>
        <div className="sub">Realitätsabgleich · 2 000 v. Chr.</div>
        <h1 style={{ fontSize: 30 }}>{f.tier}</h1>
        <p>{f.tierTxt}</p>
        <div className="scorebox">
          <div className="score">
            <b>{f.balance}%</b>
            <span>Balance</span>
          </div>
          <div className="score">
            <b>{f.auth}%</b>
            <span>Authentizität</span>
          </div>
          {regionFundCount > 0 && (
            <div className="score">
              <b>
                {f.fundFound}/{regionFundCount}
              </b>
              <span>Fundstellen</span>
            </div>
          )}
        </div>
        <p className="dim">
          <b>Balance</b>: schwächste Ressource geteilt durch Durchschnitt – wer
          nichts vernachlässigt, gewinnt. <b>Authentizität</b>: Wie oft hast du
          gebaut, wo Menschen wirklich bauten?
        </p>
        {regionFundCount === 0 ? (
          <p className="dim">
            In diesem Tal war keine Fundstelle belegt – die Geschichte hat ihre
            Spuren anderswo hinterlassen.
          </p>
        ) : f.fundFound < regionFundCount ? (
          <p className="dim">
            {regionFundCount - f.fundFound === 1
              ? 'Eine Fundstelle liegt noch unentdeckt im Tal …'
              : `Es liegen noch ${regionFundCount - f.fundFound} Fundstellen unentdeckt im Tal …`}
          </p>
        ) : (
          <p className="dim">
            Alle Fundstellen entdeckt – das Tal hat dir alles gezeigt.
          </p>
        )}
        <div className="rule" />
        <button className="primary" style={{ width: '100%' }} onClick={onRestart}>
          Noch einmal durch die Zeit reisen
        </button>
        <button style={{ width: '100%', marginTop: 8 }} onClick={onExit}>
          ← Zurück zur Weltkarte
        </button>
        <p className="legend">
          ◆ Belegte Ereignisse geschehen in jeder Partie zur selben Zeit. Wer sie
          kennt, spielt anders.
          <br />
          Prototyp – Daten historisch inspiriert und vereinfacht, Jahre gerundet.
        </p>
      </>
    )
  }

  const head = (n: number, title: string) => (
    <>
      <div className="cnum">ZEREMONIE · KARTE {ROMAN[n - 1]} / V</div>
      <h1 style={{ fontSize: 27 }}>{title}</h1>
    </>
  )
  const nextBtn = (label: string) => (
    <>
      <div className="rule" />
      <button className="primary" style={{ width: '100%' }} onClick={onNext}>
        {label}
      </button>
    </>
  )

  if (state.ceremStep === 1)
    return (
      <>
        {head(1, 'Der letzte Sommer')}
        <p>
          Die Alten spüren es zuerst: Diese Art zu leben geht zu Ende. Ein
          letztes Mal zieht der Stamm jagend durchs ganze Tal.
        </p>
        <div className="fundnote">
          <b>+1 Nahrung</b>Ein Abschied in Fülle.
        </div>
        {nextBtn('Weiter')}
      </>
    )

  if (state.ceremStep === 2) {
    const opts = state.tiles
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.type === 'fisch' || t.type === 'hoehle')
      .slice(0, 3)
    return (
      <>
        {head(2, 'Das Opfer')}
        <p>
          Wer bleibt, muss loslassen. Wähle, was der alten Lebensweise geopfert
          wird – es verschwindet für immer vom Tal.
        </p>
        {opts.length === 0 ? (
          <>
            <p className="dim">
              Ihr besitzt nichts Provisorisches mehr – das Opfer wurde längst
              gebracht.
            </p>
            {nextBtn('Weiter')}
          </>
        ) : (
          opts.map(({ t, i }) => (
            <button key={i} className="choice" onClick={() => onSacrifice(i)}>
              {TILES[t.type].nm} aufgeben
              <small>{t.type === 'hoehle' ? '−2 Schutz' : '−1 Nahrung/Tag'}</small>
            </button>
          ))
        )}
      </>
    )
  }

  if (state.ceremStep === 3) {
    return (
      <>
        {head(3, 'Das Fundament')}
        {state.ceremFundament === 'pfahl' && (
          <>
            <p>
              Euer Pfahlbau wird zum Kern eines Dorfes, das Jahrhunderte stehen
              wird. Kinder werden geboren, die nie etwas anderes kennen als:{' '}
              <i>hier</i>.
            </p>
            <div className="fundnote">
              <b>+2 Kultur</b>Ein Ort bekommt Dauer.
            </div>
          </>
        )}
        {state.ceremFundament === 'ufer' && (
          <>
            <p>
              Euer Uferlager wird fest: Pfosten statt Zelte, Vorratsgruben statt
              Bündel.
            </p>
            <div className="fundnote">
              <b>+1 Kultur</b>Der Anfang von Dauer.
            </div>
          </>
        )}
        {state.ceremFundament === 'none' && (
          <p className="dim">
            Kein Lager, das bleiben könnte. Die Sesshaftigkeit wird andere finden
            – nicht euch.
          </p>
        )}
        {nextBtn('Weiter')}
      </>
    )
  }

  return (
    <>
      {head(4, 'Fremde am Fluss')}
      <p>
        Eine Familie steht am Ufer. Andere Sprache, andere Werkzeuge, dieselbe
        Müdigkeit. Sie bitten um einen Platz.
      </p>
      <button className="choice" onClick={() => onChoice(true)}>
        Aufnehmen
        <small>+2 Nahrung, +1 Kultur · aber Unruhe: −1 Schutz</small>
      </button>
      <button className="choice" onClick={() => onChoice(false)}>
        Abweisen
        <small>+1 Schutz · das Tal bleibt, wie es ist</small>
      </button>
    </>
  )
}
