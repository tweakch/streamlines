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

When asked to change game design, prefer editing/adding a prototype draft over
editing the app, unless the change is a port of an already-approved draft or a pure
code-quality fix.

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

## App

```
cd app        # or pass absolute paths
npm ci        # install (package-lock.json is present)
npm run dev   # Vite dev server
npm run build # tsc -b && vite build  ← run this to typecheck
npm run lint
```

- `app/src/stromlinien/` — the current core game (port of `stromlinien-epoche1`
  prototype): hex tile placement, day/night loop, anchor events, Fundstellen.
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
