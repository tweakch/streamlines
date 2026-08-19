# Shadows of Truth / Stromlinien

A history game about the Alpenrhein valley, built prototype-first. German game text,
English code.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | The real product: Vite + React 19 + TypeScript (strict). No framework beyond React. |
| `prototype/` | HTML prototyping workshop — **read `prototype/README.md` before touching it.** |

## Way of work: prototype first

Nothing lands in `app/` untried. Game mechanics, UI elements, screen layouts,
storytelling, and design decisions are first built as **self-contained HTML files**
in `prototype/drafts/` (inline CSS/JS, no build step), iterated there, and only then
ported "statically" into the app.

- `prototype/drafts/` — active experiments, editable.
- `prototype/ab/` — A/B comparisons (variants + `NOTES.md` with the decision).
- `prototype/archive/` — immutable history: superseded, rejected, or ported files.
- The ledger table in `prototype/README.md` tracks each prototype's status — update
  it whenever a file moves or gets ported.
- Give every prototype **debug query params** so inner states are reachable without
  clicking (`?autostart`, `?seed=…`, `?demo`, `?night`) — a screenshot can't click.

When asked to change game design, prefer editing/adding a prototype draft over
editing the app, unless the change is a port of an already-approved draft or a pure
code-quality fix.

## Verifying a prototype

Prototypes are standalone HTML — screenshot them with headless Chrome. Try this first:
the Playwright MCP browser is often locked by another session ("Browser is already in
use"), and the Chrome extension may be disconnected.

```
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --window-size=540,1150 --virtual-time-budget=5000 --screenshot="<out.png>" "file:///C:/dev/tweakch/shadows-of-truth/prototype/drafts/<file>.html"
```

- `--dump-dom` instead of `--screenshot` reads computed state (e.g. the `--hexw` a
  prototype set) — use it before guessing at a layout bug.
- `--user-data-dir=<dir>` keeps `localStorage` across runs — required to test anything
  persistent (fog of the unplayed, saved worlds).
- Content clipped at the right edge with a narrow `--window-size` is usually a capture
  artifact, not a layout bug; re-shoot wider before "fixing" it.

## Knowledge base: the Handbuch

`prototype/drafts/stromlinien-handbuch.html` is the project's **knowledge base** —
it records the rules *and* the design history (what was decided, what was rejected
and why). It has two views: **Entwicklung** (default; everything) and **Publish**
(`?mode=publish`; only cards with status `done`/Umgesetzt or `concept`/Konzept —
what is decided or already in the app).

- Every card carries `data-s`: `done` (in the app) · `concept` (decided, not built) ·
  `idea` · `rej` (rejected) · `open`. Publish mode derives from these — keep them
  truthful.
- When a design decision is made, or something is ported into the app, update the
  affected card's status/content in the Handbuch in the same change.
- Rejected ideas keep their card (status `rej`) with the reasoning — history is
  part of the document's purpose; never delete it.
- `/handbuch-sync` (project skill in `.claude/skills/handbuch-sync/`) audits the
  Handbuch against the conversation history and suggests additions, amendments
  and status changes — run it at the end of design-heavy sessions. With a
  numeric arg (`/handbuch-sync 3`) it also mines the N most recent past session
  transcripts.
- The Handbuch and `prototype/README.md` change on disk mid-session — re-read them
  immediately before editing; a read from earlier in the same session goes stale, and
  line numbers shift.

## App

```
cd app        # or pass absolute paths
npm ci        # install (package-lock.json is present)
npm run dev   # Vite dev server
npm run build # tsc -b && vite build  ← run this to typecheck
npm run lint
```

- `app/src/shell/` — the game shell / meta-UI (port of `shell-v2` prototype):
  title screen with resume card, Klan creation (profile), campaign/rules/about
  screens, router in `App.tsx`, and persistence (`storage.ts`: profiles,
  schema-versioned autosave after every action, fog per profile).
- `app/src/stromlinien/` — the current core game (ports of `stromlinien-epoche1`
  and `start-screen-v2` prototypes): designed world map (`world.ts`, Alpenrhein
  Landquart–Konstanz, fixed world coordinates — "gestaltete Welt" decision),
  world-map hub with fog-of-the-unplayed and shapeable region (`StartScreen.tsx`),
  then hex tile placement, day/night loop, anchor events, Fundstellen on the
  chosen region. In-game: ⬡ one-tap exit, ☰ Lager menu (slides from right),
  skippable night sequence.
- `app/src/game/` + `app/src/components/` — the earlier evidence/research game
  ("Shadows of Truth" research loop). Kept for reference; not wired into `App.tsx`.

## Conventions

- Hex grids use **pointy-top hexes, odd-r offset coordinates** (odd rows shifted
  right). Neighbor tables live in `prototype/drafts/stromlinien-epoche1.html` and
  `app/src/stromlinien/grid.ts` — keep them identical.
- All player-facing text is German; use the historical terms from the prototypes
  (Plättchen, Furt, Fundstelle, Anker-Ereignis, Sesshaftigkeit …).
- Game data (tiles, events, Fundstellen) is data-driven — extend the data tables,
  don't special-case logic.
- Historical events/finds are "historisch inspiriert und vereinfacht" — keep that
  disclaimer wherever they surface.
- Size hex grids **after** the container is visible — `clientWidth` is 0 while a parent
  still has `.hid`/`display:none`, silently leaving hexes at their CSS default size.
