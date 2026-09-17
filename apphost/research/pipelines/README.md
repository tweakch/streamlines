# Pipelines (stubs)

Intended stages for a later slice. Each folder is empty on purpose:
**no code, no Compose, no packages.** Names document the flow in
`../ARCHITECTURE.md`.

| Stage | Folder | Intended job |
| --- | --- | --- |
| 1 | `github-ingestor/` | Fetch only the curated list (clone or metadata). No crawl. |
| 2 | `repository-analyzer/` | Layout, languages, docs, license — repo-level facts. |
| 3 | `document-parser/` | README, ADRs, design notes → normalized documents. |
| 4 | `code-analyzer/` | Architecture signals in code (hex types, tick loops, grains). |
| 5 | `concept-extractor/` | Map facts onto Concept / Capability / Technology nodes. |
| 6 | `graph-writer/` | Persist nodes and typed relationships. |
| 7 | `embedding-worker/` | Optional later: vectors for retrieval, not the source of truth. |
| 8 | `context-engine/` | Answer `contexts/*.yaml` questions from the typed graph. |

v0 does not run any of these. Do not add a service entrypoint here until
AppHost wiring is an explicit follow-up.
