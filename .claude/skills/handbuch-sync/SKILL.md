---
name: handbuch-sync
description: Review the conversation history (and optionally past session transcripts) against the STROMLINIEN Handbuch and suggest additions, amendments, status changes and improvements to it. Use when the user asks to update, sync, review or improve the Handbuch / instructions manual / knowledge base, or to capture this session's decisions in the manual.
---

# Handbuch-Sync — Wissensbasis mit dem Gesprächsverlauf abgleichen

The Handbuch at `prototype/drafts/stromlinien-handbuch.html` is the project's
**knowledge base**: rules *and* design history — what was decided, built,
rejected (and why), and what is still open. This skill compares what actually
happened in conversation with what the Handbuch records, then **suggests**
changes. It never edits the document before the user has picked from the
suggestions.

## Inputs

- **No args** (default): use the current conversation, which is already in
  context. Do not re-read the current session's transcript file.
- **Numeric arg N** (e.g. `/handbuch-sync 3`): additionally mine the N most
  recent *previous* sessions. Transcripts live in
  `C:\Users\akl\.claude\projects\C--dev-tweakch-shadows-of-truth\*.jsonl`
  (newest file = current session — skip it). Extract the dialogue with:

  ```
  node .claude/skills/handbuch-sync/extract-transcript.mjs <session.jsonl> [maxCharsPerBlock]
  ```

  Output is `USER:`/`ASSISTANT:` lines, tool noise stripped. User lines carry
  the decisions; assistant lines carry what was built and why.

## Workflow

### 1. Read the Handbuch completely

Read `prototype/drafts/stromlinien-handbuch.html` and build an inventory of
every card: chapter (`k1`–`k10`), title, status (`data-s`), and the gist of
its body. Note the "Stand <Monat Jahr>" in the hero kicker.

### 2. Harvest the history

From the conversation (and extracted transcripts, if requested), collect a
**decision inventory**:

- **Decisions made** — direction chosen, mechanic accepted, convention agreed
  ("i like to keep it that way", "lets do X", corrections of your approach)
- **Features built** — what now runs in the app or a prototype draft
- **Ideas floated** — mentioned but not decided
- **Rejections** — options discarded, and the stated reason
- **Corrections** — facts or numbers that changed (these often make existing
  cards stale)
- **Open questions** — raised but unanswered

User messages outrank assistant messages as evidence: something the user
asked for or confirmed is a decision; something only the assistant proposed
is at most an idea.

### 3. Diff against the Handbuch

For each inventory item, check whether the Handbuch already covers it —
in the right chapter, with the right status, and factually current. Look for:

| Finding | Suggestion type |
| --- | --- |
| Decided/built/rejected but no card exists | **Neue Karte** |
| Built but card still says Konzept/Idee (or rejected but still Idee) | **Statuswechsel** |
| Card content contradicts current reality (mechanics, numbers, UI) | **Korrektur** |
| `rej`-card without a "Warum verworfen" reasoning | **Ergänzung** (add `.why`) |
| Unanswered question worth tracking | **Neue offene Frage** (Kap. 10) |
| Card unclear, duplicated, or in the wrong chapter | **Verbesserung** |

When app reality is in doubt, verify against `app/src/stromlinien/` before
claiming a card is stale — the code outranks memory.

### 4. Present suggestions — do not edit yet

Output a numbered list, grouped by type. Each suggestion carries:

- **Kapitel** and proposed **Status** (`done`/`concept`/`idea`/`rej`/`open`)
- **Beleg**: one line quoting/paraphrasing the conversation moment that
  justifies it
- **Entwurf**: the drafted German card text (title + body), matching the
  document's voice — kompakt, konkret, mit `.why`-Block wo eine Entscheidung
  begründet wird

End by asking which numbers to apply (all / a selection / none).

### 5. Apply what the user picks

Edit `prototype/drafts/stromlinien-handbuch.html` following its conventions:

**Card template** (insert before the next `<!-- ============ ... -->` chapter
marker of the following chapter):

```html
<div class="card" data-s="STATUS"><div class="chead"><h3>TITEL</h3><span class="badge b-BADGE">LABEL</span><span class="chev">▶</span></div><div class="cbody">
<p>…</p>
<div class="why"><b>Warum</b>…</div>
</div></div>
```

**Status ↔ badge mapping** (keep `data-s` and badge class in sync):

| `data-s` | badge class | label |
| --- | --- | --- |
| `done` | `b-done` | Umgesetzt |
| `concept` | `b-concept` | Konzept |
| `idea` | `b-idea` | Idee |
| `rej` | `b-rej` | Verworfen (or Korrigiert) |
| `open` | `b-open` | Offen |

**Rules:**

- All content in **German**, matching the existing tone.
- **Never delete a card.** Superseded ideas become `rej` with a `.why`
  explaining the decision — history is the document's purpose.
- Statuses must stay truthful: `done` only for things running in the app,
  `concept` for decided-but-not-built. Publish mode (`?mode=publish`) derives
  from these.
- TOC and chapter visibility are computed by the page's script — never edit
  the TOC, chapter numbering, `<script>`, or `<style>` for a content change.
- If content changed, update the hero kicker's "Stand <Monat Jahr>" to the
  current month.
- Finish with a one-line summary per applied change, and remind the user the
  Handbuch renders at `prototype/drafts/stromlinien-handbuch.html` (serve the
  folder if `file://` is blocked).
