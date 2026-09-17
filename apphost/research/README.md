# Before Research Graph

Structure-only scaffold for an **engineering precedent engine**.

It lives next to the Streamlines Aspire host (`apphost/`) so the lab can
share that folder later. **It is not connected to the live game host.**
Nothing here is referenced by `apphost.mts`, `aspire.config.json`, or
`package.json`. Do not start services from this tree.

## What this is

A typed graph of **architectural evidence** for BEFORE contexts:

- How do other projects persist a designed world?
- How do they run a hex grid, a simulation tick, a dedicated server?
- How do they attach provenance to claims, and query that later?

The unit of work is a **context question**, not a repository. Repos are
sources of evidence. Concepts (`HexWorld`, `PersistentWorld`,
`SimulationTick`, …) are the nodes we actually want.

## What this is not

- **Not** “find RPG repos” or a catalogue of games that look like
  Streamlines.
- **Not** a mass GitHub crawl, a Docker Compose stack, or an LLM
  extraction pipeline. Those come later, if at all.
- **Not** a second Handbuch. The Handbuch (`prototype/handbuch/`) is the
  design knowledge base for Stromlinien. This graph is engineering
  precedent for BEFORE.
- **Not** a change to `prototype/`, `app/`, or playable drafts.

## How it relates to BEFORE and Streamlines

| | Streamlines (this repo) | BEFORE |
| --- | --- | --- |
| Product | Hex history game, Alpenrhein, browser client | Engine / world questions this graph is for |
| Knowledge | Handbuch (design truth, Belegstatus) | Typed evidence for architecture questions |
| Host | `apphost/` — game Aspire harness | Same folder, later a **lab** host; not this slice |
| Identity model | Node services + Postgres today | Orleans grains as the **future** model |

Streamlines is a living precedent of its own (hex cells vs tiles,
gestaltete Welt, fog of the unplayed, Aspire). BEFORE asks what that
becomes at engine scale. This folder collects *other* projects so those
questions have evidence, not vibes.

## v0 (this slice)

**Structure + curated seed examples only.**

- Context YAML under `contexts/`
- Empty pipeline stage folders under `pipelines/`
- Example seeds under `seeds/` (placeholders; nothing is fetched)
- Node/edge vocabulary under `graph/`

No runnable workers. No package installs. No AppHost wiring.

A later slice may attach this lab to Aspire. Until then, treat
`apphost/research/` as documentation and stubs.

## Start small

The first real ingest — **not this PR** — should be **20–50 curated
projects**, chosen because they answer a context question.

Not thousands. Not a crawl. Quality of evidence over size of graph.

## Layout

```
apphost/research/
  README.md              this file
  ARCHITECTURE.md        ingest → normalize → typed graph → queries
  contexts/              BEFORE question sets (one YAML each)
  pipelines/             intended stages; stubs only
  seeds/                 example repos + concepts; not fetched
  graph/                 node and edge types
```
