# Streamlines / Stromlinien

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

- `prototype/kit/` — the shared UI primitives. **Read `prototype/kit/README.md`
  and look at `kit/kit-demo.html` before building a new prototype**; don't retype
  buttons, tabs, toast, the hex grid or the Handbuch card. New drafts link
  `../kit/sot.css` + `../kit/sot.js` (plus `sot-hex.*` / `sot-doc.*` as needed);
  own CSS comes last and wins. A primitive moves into the kit only after it
  looked the same in two or more prototypes — the kit follows the prototypes.
- `prototype/lib/` — staging area *before* the kit: pure logic (no DOM) that got
  typed more than once, pinned with a `node:test` unit test. One folder per slug
  with `<slug>.js` + `<slug>.test.js` + `<slug>.md`. Run the tests with
  `node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"`
  (quote the glob; a directory argument does not work). `/lib-extract` (project
  skill in `.claude/skills/lib-extract/`) finds the candidates, writes the test
  first, then extracts — **it does not remove the duplication.** That takes two
  further steps: promote `lib/` → `kit/` by hand, then rewire the call sites per
  `kit/UMBAU.md`. Drafts never link `lib/` (`inline.mjs` would not embed it, so
  archiving would break); they adopt from the kit. The stage of each entry
  (`herausgezogen` / `befördert` / `umgebaut (n/m)` / `erledigt`) is tracked in
  `prototype/lib/README.md`.
- `prototype/drafts/` — active experiments, editable.
- `prototype/ab/` — A/B comparisons (variants + `NOTES.md` with the decision).
- `prototype/archive/` — immutable history: superseded, rejected, or ported files.
  Before moving a file here, inline the kit so the file is self-contained again:
  `node prototype/kit/inline.mjs <draft> --out <archive path>`.
- The ledger table in `prototype/README.md` tracks each prototype's status — update
  it whenever a file moves or gets ported.
- Give every prototype **debug query params** so inner states are reachable without
  clicking (`?autostart`, `?seed=…`, `?demo`, `?night`) — a screenshot can't click.
  Declare them via `SOT.params({…})`: that yields typed values, `?hilfe` (a table
  of every param) and `SOT.debug(P)` (a strip, shown only with `?debug`) for free.

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

The Handbuch is the project's **knowledge base** — it records the rules *and* the
design history (what was decided, what was rejected and why). It has two views:
**Entwicklung** (default; everything) and **Publish** (`?mode=publish`; only cards
with status `done`/Umgesetzt or `concept`/Konzept — what is decided or already in
the app).

- **Written in markdown, rendered to HTML.** Sources: `prototype/handbuch/*.md`
  (one chapter per file, cards as `## Titel {status}` — dialect in
  `prototype/handbuch/README.md`). The viewable file
  `prototype/drafts/stromlinien-handbuch.html` is **generated and committed** —
  never edit it by hand. After editing markdown run `npm run compose:handbuch`
  (in `app/`) to regenerate; `npm run check:handbuch` detects drift. Every card
  gets an id — `?karte=<id>` deep-links to it opened.
- Every card carries its status: `done` (in the app) · `concept` (decided, not
  built) · `idea` · `rej` (rejected) · `open`. Publish mode derives from these —
  keep them truthful.
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
  ("Streamlines" research loop). Kept for reference; not wired into `App.tsx`.

## Conventions

- Hex grids use **pointy-top hexes, odd-r offset coordinates** (odd rows shifted
  right). Neighbor tables live in `prototype/kit/sot-hex.js` (`SOT.hex.neighbors`),
  `prototype/drafts/stromlinien-epoche1.html` and `app/src/stromlinien/grid.ts` —
  keep all three identical.
- All player-facing text is German; use the historical terms from the prototypes
  (Plättchen, Furt, Fundstelle, Anker-Ereignis, Sesshaftigkeit …).
- **Terminology — one thing, one word** (canonical glossary: Handbuch `?karte=glossar`):
  **Plättchen/tile** = hex piece from the hand, placed and stays (1:1.155) ·
  **Feld/cell** = fixed hex position of the world · **Karte/card** = rectangular
  5:7, immediate effect (Effektkarte, Vorrat-Karte, Nachtkarte) · **Brett/board** =
  the playable grid · **Weltkarte/world map** = the valley overview. "hex" is a
  shape, never an object; "plate" and "Kachel" never mean a game piece; bare
  "Karte" never means the map.
- Game data (tiles, events, Fundstellen) is data-driven — extend the data tables,
  don't special-case logic.
- Historical events/finds are "historisch inspiriert und vereinfacht" — keep that
  disclaimer wherever they surface.
- Size hex grids **after** the container is visible — `clientWidth` is 0 while a parent
  still has `.hid`/`display:none`, silently leaving hexes at their CSS default size.
  In prototypes use `SOT.hex.autosize(map, cols)`; it observes the container, so it
  re-measures the moment the element becomes visible.
- Never hardcode a colour in a prototype — use the tokens from `kit/sot.css`, or
  day/night/werkbank breaks. Text **on** an accent surface uses `--on-ember` /
  `--on-river`, not `#fff`: the werkbank accent is light.
- **Icons are SVG. Always.** No character ever stands for a game thing — not
  `✦`/`➤` for the two people, not `▲ ● ◇` for the Vorkommen, and never an
  emoji. Use `SOT.icon(name)` / `SOT.iconEl(name, class)` from
  `kit/sot-icons.js` (`SOT.iconSVG(name, x, y, size)` inside an SVG map); in CSS
  use the SVG as a `mask` with `background-color`, never `content:'◆'`. A glyph
  inherits the font's metrics and baseline, falls back per device (`▨`/`⋔` are
  missing on iOS entirely), ignores `stroke`, and cannot be redrawn together
  with the rest. House style and the reasoning are in `prototype/kit/README.md`
  (*Der Zeichensatz*); `node prototype/kit/icons-audit.mjs` finds violations and
  names the replacement. Adding a drawing means: house style, entry in
  `SOT.iconGruppen`, and a check at 16 px in `kit-demo.html`.
