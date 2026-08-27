/*
 * contract.d.ts — die Typen des Vertrags zwischen Server, app/ und Prototypen.
 *
 * Absichtlich handgeschrieben und ohne Build-Schritt: derselbe Ordner liefert
 * `contract.js` fuer die Laufzeit und diese Datei fuer die Typen. Damit kann
 * app/ (Vite + tsc), die API (node) und ein Prototyp (<script type=module>)
 * dasselbe Original benutzen, ohne dass irgendwer etwas kompilieren muss.
 *
 * Die Namen folgen bewusst app/src/shell/storage.ts — der Server bildet die
 * Aufrufe nach, die die App heute gegen localStorage macht.
 */

/** Version des Vertrags. Steigt, wenn eine Route inkompatibel wird. */
export declare const CONTRACT_VERSION: 1

/** Praefix aller Routen hinter dem Gateway. */
export declare const API_BASE: '/api'

/** Schema-Version des Spielstands, identisch zu SaveGame.v in storage.ts. */
export declare const SAVE_VERSION: 2

/** Ein Klan-Profil. Feldgleich mit Profile in storage.ts. */
export interface Profile {
  id: string
  name: string
  createdAt: number
}

/**
 * Ein Spielstand. `state` ist am Transport-Rand absichtlich opak: der Server
 * speichert und liefert ihn zurueck, die Form gehoert dem Client. So bleibt
 * die API stabil, waehrend sich das Spiel noch bewegt.
 */
export interface SaveGame<TState = unknown> {
  v: typeof SAVE_VERSION
  state: TState
  lastEvent: string | null
  savedAt: number
}

/** Antwort von GET /api/health. */
export interface Health {
  ok: boolean
  contract: number
  db: 'up' | 'down'
  cache: 'up' | 'down'
}

/** Die Routen an einer Stelle, damit kein Client Pfade zusammenbaut. */
export declare const ROUTES: {
  readonly health: '/api/health'
  readonly profiles: '/api/profiles'
  readonly profile: (id: string) => string
  readonly save: (profileId: string) => string
}

/** Fixtures fuer den file://-Fall — ein Draft bleibt ohne Harness benutzbar. */
export declare const FIXTURE_PROFILES: readonly Profile[]
export declare const FIXTURE_SAVE: SaveGame<Record<string, never>>

/** Woher die Daten kamen. Ein Prototyp darf das anzeigen. */
export type Herkunft = 'api' | 'fixture'

export interface Bezug<T> {
  data: T
  herkunft: Herkunft
}

/**
 * Holt `path` von der API; scheitert das (file://, Harness aus, 404), kommt
 * das Fixture zurueck. Das ist die Regel, die Drafts oeffenbar haelt: geteilt
 * wird ein Vertrag plus Fixture, nie eine Laufzeitabhaengigkeit.
 */
export declare function hole<T>(
  path: string,
  fixture: T,
  init?: RequestInit,
): Promise<Bezug<T>>
