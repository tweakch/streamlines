import { useRef, useState } from 'react'
import { AboutScreen } from './shell/AboutScreen'
import { EpochsScreen } from './shell/EpochsScreen'
import { KlanScreen } from './shell/KlanScreen'
import { RulesScreen } from './shell/RulesScreen'
import { TitleScreen } from './shell/TitleScreen'
import type { ResumeMeta } from './shell/TitleScreen'
import {
  activeProfile,
  clearSave,
  createProfile,
  loadProfileStore,
  loadSave,
  regionLabel,
  switchProfile,
} from './shell/storage'
import { StartScreen } from './stromlinien/StartScreen'
import { StromlinienGame } from './stromlinien/StromlinienGame'
import { newState, reducer } from './stromlinien/engine'
import type { GameState, RegionCell } from './stromlinien/types'
import {
  DEFAULT_VIEW,
  HEXAGON_R,
  buildRegion,
  hexagonCells,
  keyOf,
  worldCellAt,
} from './stromlinien/world'

/*
 * Die Shell (Meta-UI, Port von shell-v2): Titelbild → Klan gründen →
 * Weltkarte (Hub + Gebietswahl) → Spiel, dazu Epochen/Regeln/Über mit
 * Rücksprung. Die laufende Partie wird nach jeder Aktion gespeichert
 * (shell/storage.ts) — Verlassen und Wiederaufnehmen sind verlustfrei.
 *
 * Der frühere Recherche-Loop ("Shadows of Truth") liegt weiter unter
 * src/game + src/components.
 */

type Screen =
  | 'titel'
  | 'klan'
  | 'welt'
  | 'epochen'
  | 'spiel'
  | 'regeln'
  | 'ueber'

/*
 * Dev-Hook: `?dev=spiel` springt mit einem Beispielgebiet (Sechseck um die
 * Schaaner Furt) direkt ins Spiel, `?dev=welt` auf die Weltkarte. Nur im
 * Dev-Server — im Produktionsbündel ist `import.meta.env.DEV` falsch und der
 * Block fällt beim Bauen weg.
 *
 * Grund: die Prototypen haben laut prototype/README alle Debug-Parameter,
 * damit sich jeder Innenzustand ohne Klicken erreichen (und per Screenshot
 * prüfen) lässt. Die App hatte keine — damit war kein Bildschirm hinter der
 * Gebietswahl verifizierbar.
 */
const devFlag = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('dev')
  : null

function devRegion(): RegionCell[] {
  const keys = hexagonCells(DEFAULT_VIEW.c, DEFAULT_VIEW.r, HEXAGON_R)
    .filter(([c, r]) => worldCellAt(c, r))
    .map(([c, r]) => keyOf(c, r))
  return buildRegion(new Set(keys))
}

function App() {
  const [store, setStore] = useState(() => {
    const s = loadProfileStore()
    if (devFlag && !activeProfile(s)) return createProfile(s, 'Dev-Klan')
    return s
  })
  const [screen, setScreen] = useState<Screen>(
    devFlag === 'spiel' || devFlag === 'intro' || devFlag === 'nacht'
      ? 'spiel'
      : devFlag === 'welt'
        ? 'welt'
        : 'titel',
  )
  const [pendingRegion, setPendingRegion] = useState<RegionCell[] | null>(
    devFlag === 'spiel' || devFlag === 'intro' || devFlag === 'nacht'
      ? devRegion()
      : null,
  )
  /* `?dev=spiel` überspringt das Intro über den echten START-Pfad, damit der
     laufende Tag prüfbar ist; `?dev=intro` hält davor an. */
  const [devInitial] = useState<GameState | null>(() => {
    if (devFlag !== 'spiel' && devFlag !== 'nacht') return null
    const s = reducer(newState(devRegion()), { type: 'START' })
    const q = new URLSearchParams(window.location.search)
    /* `&runde=N` setzt die Runde, ohne sie zu spielen — Ressourcen bleiben
       auf Startwerten. Reicht, um rundenabhängige Anzeigen zu prüfen
       (Vorzeichen, Handlungsfenster, Zeitleiste). */
    const r = Number(q.get('runde'))
    if (r >= 1 && r <= 10) s.round = r
    /* `&antwort=5:1` wählt vorab eine Antwort, `?dev=nacht` deckt sofort
       auf — damit ist prüfbar, dass die Wahl den Ausgang ändert. */
    for (const paar of (q.get('antwort') ?? '').split(',').filter(Boolean)) {
      const [ar, ai] = paar.split(':').map(Number)
      if (ar >= 1 && ai >= 0) s.antwort[ar] = ai
    }
    if (devFlag === 'nacht') {
      s.phase = 'night'
      s.nightPending = true
    }
    return s
  })
  const backRef = useRef<Screen[]>([])

  /* `?dev=fehler` prüft die Fehlerfall-Karte — im Prototyp spielmenue-v1 war
     das ein Menüeintrag „Fehlerfall testen". */
  if (devFlag === 'fehler') throw new Error('Absturz-Test über ?dev=fehler')

  const profile = activeProfile(store)
  const save = profile ? loadSave(profile.id) : null
  const resume: ResumeMeta | null = save
    ? {
        round: save.state.round,
        label: regionLabel(save.state.region),
        lastEvent: save.lastEvent,
      }
    : null

  /* Randfall: „spiel" ohne Spielstand und ohne Gebiet zeigt die Weltkarte. */
  const effectiveScreen: Screen =
    screen === 'spiel' && !save && !pendingRegion ? 'welt' : screen

  function go(next: Screen) {
    backRef.current.push(screen)
    setScreen(next)
  }
  function back() {
    setScreen(backRef.current.pop() ?? 'titel')
  }
  /** Harte Navigation (Spiel verlassen, Klan gegründet): Stack zurücksetzen. */
  function reset(next: Screen) {
    backRef.current = []
    setScreen(next)
  }

  if (screen === 'klan' || !profile) {
    /* Ohne Profil führt jeder Weg zuerst über die Klan-Gründung —
       ausser Regeln/Über, die auch anonym lesbar sind. */
    if (profile === null && (screen === 'regeln' || screen === 'ueber')) {
      return screen === 'regeln' ? (
        <RulesScreen onBack={back} />
      ) : (
        <AboutScreen onBack={back} />
      )
    }
    if (profile === null && screen === 'titel') {
      return (
        <TitleScreen
          profile={null}
          resume={null}
          onPlay={() => go('klan')}
          onResume={() => go('klan')}
          onWorld={() => go('klan')}
          onNav={(s) => go(s)}
        />
      )
    }
    return (
      <KlanScreen
        onCreate={(name) => {
          setStore((s) => createProfile(s, name))
          reset('welt')
        }}
        onBack={back}
      />
    )
  }

  switch (effectiveScreen) {
    case 'titel':
      return (
        <TitleScreen
          profile={profile}
          resume={resume}
          onPlay={() => go('welt')}
          onResume={() => go('spiel')}
          onWorld={() => go('welt')}
          onNav={(s) => go(s)}
        />
      )
    case 'welt':
      return (
        <StartScreen
          key={profile.id}
          profile={profile}
          profiles={store.profiles}
          resume={resume}
          onStart={(region) => {
            setPendingRegion(region)
            go('spiel')
          }}
          onResume={() => go('spiel')}
          onAbandon={() => {
            clearSave(profile.id)
            setPendingRegion(null)
            reset('welt')
          }}
          onSwitchProfile={(id) => {
            setStore((s) => switchProfile(s, id))
            setPendingRegion(null)
            reset('welt')
          }}
          onNewKlan={() => go('klan')}
          onNav={(s) => go(s)}
        />
      )
    case 'epochen':
      return (
        <EpochsScreen
          resume={resume}
          onBack={back}
          onPlay={() => (resume ? go('spiel') : reset('welt'))}
        />
      )
    case 'regeln':
      return <RulesScreen onBack={back} />
    case 'ueber':
      return <AboutScreen onBack={back} />
    case 'spiel': {
      const initial =
        save?.state ??
        devInitial ??
        (pendingRegion ? newState(pendingRegion) : null)
      if (!initial) return null /* durch effectiveScreen nicht erreichbar */
      return (
        <StromlinienGame
          initial={initial}
          initialLastEvent={save?.lastEvent ?? null}
          profileId={profile.id}
          onExit={() => {
            setPendingRegion(null)
            reset('welt')
          }}
          onNav={(s) => go(s)}
        />
      )
    }
  }
}

export default App
