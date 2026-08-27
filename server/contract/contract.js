/*
 * contract.js — die Laufzeitseite des Vertrags. Typen liegen in contract.d.ts.
 *
 * Keine Abhaengigkeiten, kein Build. Laeuft in node (API) und im Browser
 * (app/ und Prototypen). Wer hier etwas aendert, aendert es fuer alle drei —
 * das ist der Zweck.
 */

export const CONTRACT_VERSION = 1
export const API_BASE = '/api'
export const SAVE_VERSION = 2

export const ROUTES = {
  health: '/api/health',
  profiles: '/api/profiles',
  profile: (id) => `/api/profiles/${encodeURIComponent(id)}`,
  save: (profileId) => `/api/profiles/${encodeURIComponent(profileId)}/save`,
}

/*
 * Fixtures. Zwei Klane, damit eine Profilauswahl im Draft etwas zu zeigen hat.
 * Feste Zeitstempel: ein Screenshot soll zwischen zwei Laeufen gleich aussehen.
 */
export const FIXTURE_PROFILES = Object.freeze([
  Object.freeze({ id: 'fixture-tuscis', name: 'Tuscis', createdAt: 1_735_689_600_000 }),
  Object.freeze({ id: 'fixture-manna', name: 'Manna', createdAt: 1_735_776_000_000 }),
])

export const FIXTURE_SAVE = Object.freeze({
  v: SAVE_VERSION,
  state: Object.freeze({}),
  lastEvent: null,
  savedAt: 1_735_776_000_000,
})

/**
 * Holt `path`; faellt auf `fixture` zurueck, wenn keine API erreichbar ist.
 *
 * Absichtlich still: ein Draft, der per file:// geoeffnet wird, soll nicht mit
 * einer roten Konsole begruessen, sondern mit Fixture-Daten laufen. Wer den
 * Unterschied sehen will, liest `herkunft`.
 */
export async function hole(path, fixture, init) {
  try {
    const res = await fetch(path, init)
    if (!res.ok) return { data: fixture, herkunft: 'fixture' }
    return { data: await res.json(), herkunft: 'api' }
  } catch {
    return { data: fixture, herkunft: 'fixture' }
  }
}
