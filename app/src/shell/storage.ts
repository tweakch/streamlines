import type { GameState, RegionCell } from '../stromlinien/types'

/*
 * Persistenz der Shell: Profile (Klans), Autosave der laufenden Partie,
 * Nebel des Ungespielten pro Profil. localStorage ist die Wahrheit —
 * ein Sync in die Cloud (Chronik-Code, siehe profil-hub-v2) käme später
 * als Kopie obendrauf.
 *
 * Alle Formate tragen eine Schema-Version: Ändert sich die Struktur,
 * werden alte Stände erkannt statt still falsch gelesen.
 */

const PROFILES_KEY = 'stromlinien-profiles-v1'
const SAVE_PREFIX = 'stromlinien-save-v1'
/** Auch der Legacy-Nebelschlüssel aus der Zeit vor den Profilen. */
const FOG_PREFIX = 'stromlinien-fog-alpenrhein-v1'

export interface Profile {
  id: string
  name: string
  createdAt: number
}

export interface ProfileStore {
  v: 1
  profiles: Profile[]
  activeId: string | null
}

export function loadProfileStore(): ProfileStore {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? 'null') as
      | ProfileStore
      | null
    if (raw && raw.v === 1 && Array.isArray(raw.profiles)) return raw
  } catch {
    /* kaputter Eintrag → Neustart mit leerem Store */
  }
  return { v: 1, profiles: [], activeId: null }
}

export function saveProfileStore(store: ProfileStore): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(store))
  } catch {
    /* Speicher blockiert — Profile leben dann nur diese Sitzung */
  }
}

export function activeProfile(store: ProfileStore): Profile | null {
  return store.profiles.find((p) => p.id === store.activeId) ?? null
}

export function createProfile(store: ProfileStore, name: string): ProfileStore {
  const profile: Profile = { id: `p${Date.now()}`, name, createdAt: Date.now() }
  /* Der erste Klan erbt den Nebel aus der Zeit vor den Profilen. */
  if (store.profiles.length === 0) {
    try {
      const legacy = localStorage.getItem(FOG_PREFIX)
      if (legacy && !localStorage.getItem(fogKey(profile.id)))
        localStorage.setItem(fogKey(profile.id), legacy)
    } catch {
      /* Nebel-Übernahme ist Komfort, kein Muss */
    }
  }
  const next: ProfileStore = {
    ...store,
    profiles: [...store.profiles, profile],
    activeId: profile.id,
  }
  saveProfileStore(next)
  return next
}

export function switchProfile(store: ProfileStore, id: string): ProfileStore {
  const next = { ...store, activeId: id }
  saveProfileStore(next)
  return next
}

export function fogKey(profileId: string): string {
  return `${FOG_PREFIX}:${profileId}`
}

/* ---------------- Autosave ---------------- */

export interface SaveGame {
  v: 1
  state: GameState
  lastEvent: string | null
  savedAt: number
}

export function loadSave(profileId: string): SaveGame | null {
  try {
    const raw = JSON.parse(
      localStorage.getItem(`${SAVE_PREFIX}:${profileId}`) ?? 'null',
    ) as SaveGame | null
    if (raw && raw.v === 1 && raw.state && Array.isArray(raw.state.cells))
      return raw
  } catch {
    /* unlesbarer Stand zählt als kein Stand */
  }
  return null
}

export function writeSave(
  profileId: string,
  state: GameState,
  lastEvent: string | null,
): void {
  try {
    const save: SaveGame = { v: 1, state, lastEvent, savedAt: Date.now() }
    localStorage.setItem(`${SAVE_PREFIX}:${profileId}`, JSON.stringify(save))
  } catch {
    /* Speicher voll — die Partie läuft im Reducer weiter */
  }
}

export function clearSave(profileId: string): void {
  try {
    localStorage.removeItem(`${SAVE_PREFIX}:${profileId}`)
  } catch {
    /* nichts zu tun */
  }
}

/** Anzeigename des Gebiets, abgeleitet aus seinen Landmarken. */
export function regionLabel(region: readonly RegionCell[]): string {
  const lm = region.find((c) => c.landmark)?.landmark
  return lm ? `Tal bei ${lm}` : 'Euer Tal'
}
