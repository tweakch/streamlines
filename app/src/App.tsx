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
import { newState } from './stromlinien/engine'
import type { RegionCell } from './stromlinien/types'

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

function App() {
  const [store, setStore] = useState(loadProfileStore)
  const [screen, setScreen] = useState<Screen>('titel')
  const [pendingRegion, setPendingRegion] = useState<RegionCell[] | null>(null)
  const backRef = useRef<Screen[]>([])

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
      const initial = save?.state ?? (pendingRegion ? newState(pendingRegion) : null)
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
