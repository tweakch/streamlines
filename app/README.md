# Streamlines / Stromlinien — App

The playable product: a Vite + React 19 + TypeScript (strict) single-page app.
No backend, no env vars — clone and run.

## Quickstart

```
cd app
npm ci
npm run dev
```

Opens the dev server (default `http://localhost:5173`) with hot reload.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typechecks (`tsc -b`), builds (`vite build`), then regenerates the Handbuch data bundle |
| `npm run build:handbuch` | Regenerates only the Handbuch data bundle (`scripts/build-handbuch.mjs`), reading `prototype/drafts/stromlinien-handbuch.html` |
| `npm run lint` | ESLint |
| `npm run preview` | Serves the production build locally |

Run `npm run build` to typecheck — there's no separate `tsc --noEmit` script.

## Structure

- `src/shell/` — title screen, Klan creation, campaign/rules/about screens, router
  (`App.tsx`), and persistence (`storage.ts`: profiles, schema-versioned autosave, fog per profile).
- `src/stromlinien/` — the current core game: world map (`world.ts`), hex grid
  (`grid.ts`), engine (`engine.ts`), start screen and in-game view.
- `src/game/` + `src/components/` — an earlier research-loop prototype, kept for
  reference; not wired into `App.tsx`.

Game mechanics and UI are prototyped first in `../prototype/drafts/` (plain HTML,
no build step) before being ported here — see the repo root `CLAUDE.md` and
`../prototype/README.md`.
