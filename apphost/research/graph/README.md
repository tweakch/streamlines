# Graph vocabulary

Typed nodes and edges for the Before Research Graph. v0 records the
vocabulary; there is no store yet.

The point of typing is to keep **architectural evidence** separable from
“this looks like an RPG.” A Repository is never the answer to a context
question; Evidence hanging off a Concept is.

## Node types

### Repository

A curated project (Git URL, local path later). Source of evidence, not a
recommendation.

Example fields: `id`, `url`, `name`, `why` (see
`../seeds/curated-repos.example.yaml`).

### Concept

A stable idea we care about: `HexWorld`, `PersistentWorld`,
`SimulationTick`, `ActorGrain`, …

Example fields: `id`, `label`, `summary`, `contexts`.

### Capability

Something a system can *do*: stream chunks, run a dedicated tick, query
by context, attach provenance. Finer than a Concept, coarser than a
file.

### Technology

A concrete stack choice: Orleans, Godot, Aspire, Neo4j, odd-r hex kit.
A Repository **uses** a Technology; a Concept **may be implemented with**
one.

### Evidence

A located claim: path, commit, quote, or diagram in a Repository (or a
document) that supports or contradicts a Concept / Capability.

Must carry provenance (where, when, how sure). Unsourced notes are not
Evidence.

### Context

A question set from `../contexts/*.yaml` (`before.hex-engine`, …).
The unit of query. Contexts **seed** Concepts; they do not list repos.

## Edge type: Relationship

One typed edge. Suggested `type` values (open list, keep it short):

| type | meaning |
| --- | --- |
| `REQUIRES` | A is incomplete without B |
| `SPECIALIZES` | A is a narrower B |
| `DISTINGUISHES` | A is not B; keep the boundary |
| `MAY_USE` | A is often implemented with B |
| `MODELS` | A is an identity/runtime model for B |
| `OWNED_BY` | A’s lifecycle belongs to B |
| `APPLIES_TO` | A is a rule or overlay on B |
| `CARRIES` | A includes B as payload |
| `READS` | A queries B |
| `USES` | Repository or Capability uses Technology |
| `EVIDENCES` | Evidence supports Concept / Capability (or `CONTRADICTS`) |
| `SEEDED_BY` | Concept is in a Context’s `seed_concepts` |

`from` and `to` are node ids. Optional `note` is human; it is not a second graph.

## What not to add yet

- Generic `RELATED_TO` as a junk drawer
- User/player nodes, quest graphs, RPG taxonomies
- Embeddings as edges (vectors are a retrieval index, not a type)

See `../seeds/concepts.example.yaml` for a handful of example nodes and
edges. They are not loaded anywhere in v0.
