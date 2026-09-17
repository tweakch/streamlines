# Architecture (target)

v0 is folders and YAML. This page is the intended shape, not a running
system.

```
 curated repos / docs
        │
        ▼
    ingest          github-ingestor
        │
        ▼
    normalize       repository-analyzer
                    document-parser
                    code-analyzer
        │
        ▼
    typed graph     concept-extractor → graph-writer
                    (optional later: embedding-worker)
        │
        ▼
    context queries context-engine
```

Each stage has a stub folder under `pipelines/`. None of them run yet.

## Ingest

Input is a **curated list**, not a search. `seeds/curated-repos.example.yaml`
shows the record shape. A future `github-ingestor` fetches only what that
list names (clone or metadata). No org-wide crawl.

## Normalize

Turn a repo into boring facts: languages, layout, docs, notable types,
licenses. `repository-analyzer`, `document-parser`, and `code-analyzer`
are three views of the same source. They emit records, not graph nodes.

## Typed graph

`concept-extractor` maps facts onto the vocabulary in `graph/README.md`
(Repository, Concept, Capability, Technology, Evidence, Context).
`graph-writer` persists nodes and typed `Relationship` edges.

Extraction in a later slice can be rules-first. LLM extraction is out of
scope until the schema and 20–50 seeds are stable.

## Context queries

`context-engine` answers the questions in `contexts/*.yaml`: given
`before.hex-engine`, return evidence that actually speaks to odd-r
neighbors or tile-vs-cell — not “this repo is a hex game.”

Embeddings (`embedding-worker`) are optional retrieval on top of the
typed graph, not a replacement for it.

## Orleans grains (future model)

Long-lived identities — a world cell, a repository, a concept, a
context — fit **grains** better than request-scoped services. That is
the intended virtual-actor model when this stops being YAML.

Not implemented here. Do not add an Orleans cluster to the game host.

## Aspire (lab, later)

The game AppHost stays the Streamlines harness (Vite app, API, tiles,
pipeline). A **later** slice may add a second Aspire composition for
this lab (workers, a graph store, a query endpoint).

Until then:

- do not edit `apphost/apphost.mts`
- do not add research resources to `aspire.config.json`
- do not give this tree a `package.json` that the game host would run
