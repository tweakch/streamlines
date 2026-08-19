# Prototype-Werkstatt

Self-contained HTML prototypes. Everything gets tried here first — game mechanics, UI
elements, screen layouts, storytelling beats, design directions. Fiddle until happy,
then port the result "statically" into `app/`. The app never receives untested ideas.

## Rules

- Every prototype is **one self-contained `.html` file**: inline CSS + JS, no build
  step, no external dependencies beyond Google Fonts. Double-click to open, or serve
  the folder (`npx http-server prototype`) if the browser blocks `file://` features.
- A prototype does not need to be a whole game. A single screen, a nav element, a
  dialogue card, or a color/typography study is a valid prototype.
- Naming: `<topic>-v<N>[-<variant>].html`, kebab-case. New iteration on the same
  topic = new version; the superseded file moves to `archive/`.
- Prototypes are throwaway by design: global mutable state, string templates and
  copy-paste are fine here. Quality standards apply at port time, not draft time.

## Directories

### `drafts/`
Active experiments — the current best version of each topic. At most one live file
per topic. This is the only directory whose files may be edited in place.

### `ab/`
A/B comparisons when a decision needs two (or more) competing variants. One subfolder
per experiment:

```
ab/<experiment>/
  a-<label>.html
  b-<label>.html
  NOTES.md        ← the question being tested, observations per variant, the DECISION and why
```

When decided: winner moves to `drafts/` (as the topic's next version), losers move to
`archive/`. The `NOTES.md` moves to `archive/<experiment>-NOTES.md` so the reasoning
survives.

### `archive/`
Immutable history. Superseded versions, rejected variants, and drafts that were ported
land here — never edited, never deleted. Keep the version suffix and, where helpful,
add what replaced it (e.g. `-v1-squares` after the hex upgrade).

## Lifecycle

```
idea → drafts/<topic>-v1.html
     → (optional) ab/<topic>-…/ with variants + NOTES.md
     → happy? → port into app/ → move html to archive/, update ledger
     → rejected? → straight to archive/, update ledger
```

## Ledger

| File | Where | Status | Notes |
| --- | --- | --- | --- |
| `stromlinien-epoche1.html` | `drafts/` | active, partly ported | Epoche-I-Kernloop (Tag/Nacht, Plättchen, Anker-Ereignisse, Fundstellen, Zeremonie). Hex-Version (v2). Kernloop nach `app/src/stromlinien/` portiert; die App spielt seit dem Startbildschirm-Port auf dem geformten Weltkarten-Gebiet statt auf der festen 5×8-Karte des Prototyps. |
| `stromlinien-epoche1-v1-squares.html` | `archive/` | superseded | Original mit 4-seitigen Plättchen; durch Hex-Version ersetzt. |
| `map-editor-v3.html` | `drafts/` | active | Designer-Werkstatt: eine Karte, fünf Gewerke (Kartografie/Biologie/Archäologie/Geschichte/Spieldesign) als umschaltbare Linsen auf demselben Objekt. Epochen + Zeremonien wie v2, dazu editierbarer Plättchen-Katalog, Arten mit Lebensräumen, Fundstellen, Anker-/Streu-Ereignisse, Mechanik-Werte. Belegstatus + Quelle als weiche Angebote (Quellenlage-Zähler, keine Schranken). JSON v3, liest v2/v1. |
| `map-editor-v2.html` | `archive/` | superseded | Kampagnenstruktur (5 Epochen + 4 Zeremonien), nur Kartograf-Sicht. Durch v3 (Multi-Gewerk) ersetzt. |
| `map-editor-v1.html` | `archive/` | superseded | Erste Version: eine einzelne Karte (Gelände + Plättchen), ohne Epochen/Zeremonien. Durch v2 ersetzt. |
| `start-screen-v2.html` | `archive/` | **ported** (adaptiert) | Startbildschirm v2 — nach `app/src/` portiert (`StartScreen.tsx` + `world.ts`). Bei der Portierung wurde die **Seed-Welt durch die gestaltete Weltkarte ersetzt** (Entscheidung: gestaltete Welt mit realen historischen Fakten; Alpenrhein Landquart–Konstanz, 22×44 Hexes, Fundstellen/Zeichen/Landmarken an festen Weltkoordinaten). Nebel des Ungespielten, formbares Gebiet (12–55 Felder, zusammenhängend), Zeichen ◈, Epochen-Ausblick und Startbedingung (≥1 Flussfeld) wurden 1:1 übernommen; das geformte Gebiet wird an den Kernloop übergeben. |
| `start-screen-v1.html` | `archive/` | superseded | Erste Version: sichtbares Gelände, fester 7×9-Rechteckrahmen. Durch v2 (Nebel, formbares Sechseck-Gebiet, Zeichen, Epochen-Ausblick) ersetzt. |
| `mechanik-labor-v1.html` | `drafts/` | active | Monte-Carlo-Prüfstand für Balancing: headless Port des Epoche-I-Kernloops, komplett datengetrieben. Editierbar: Karte (Gelände, Furten, Fundstellen, Start-Plättchen), Deck-Zusammensetzung, Plättchen-Werte, Verbünde, Arten (Flora/Fauna mit Lebensräumen, Standard aus), Technologien, Anker-/Streu-Ereignisse, Regeln. Bot spielt N Läufe (Strategien: ausgewogen/Nahrung/Schutz/Auth/Zufall, seedbar); Auswertung: Überlebensquote, Sesshaftigkeits-Histogramm mit Tier-Schwellen, Ressourcen-Verlauf, Ereignis-Bilanz, Belegungs-Heatmap, Einzellauf-Zeitleiste. Basis pinnen → Deltas nach Tweaks. JSON-Export/Import, localStorage. |
| `nacht-effekte-v1.html` | `drafts/` | active | Werkstatt-Prüfstand: Was passiert, wenn die Nacht **bleibende Zustände** statt Einmal-Effekte hinterlässt? Zeitweilige Effekte auf Feldern mit Restdauer (Wild zieht weiter, Schneebruch, Verlandung, Wildseuche, Hochwasserschlamm), davon drei mit **Ausbreitung** je Nacht (Wasser / Land / Ufer). Kern des Versuchs: Der Spieler **wählt selbst, welches Feld den Effekt trägt** (Kandidaten = die ertragreichsten) – Anwenden als Entscheidung statt Buchhaltung. Gegenmaßnahme „Beheben" −2 Material; der **Jäger ➤** blockt Ausbreitung von seinem Feld, die **Sammlerin ✦** bringt +1 Ertrag (auf befallenem Feld nichts). **Wanderer** zieht übers Brett aufs Lager zu → Aufnehmen (+Kultur/+Material, Seuchenrisiko) oder Abweisen (−Nahrung bei schwachem Schutz). Effekte bewusst natürlich, nicht übernatürlich (Epoche I fürchtet das Tier). Debug: `?autostart`, `?demo`, `?night`. |
| `stromlinien-handbuch.html` | `drafts/` | active, **knowledge base** | Handbuch & Designdokument — die Wissensbasis des Projekts. Zwei Ansichten: **Publish** (`?mode=publish`, nur Umgesetzt + Konzept) und **Entwicklung** (alles inkl. Ideen, Verworfenem, offenen Fragen). Bei Design-Entscheidungen hier den Status nachführen. |
| `spielmenue-v1.html` | `drafts/` | active | Session-Lifecycle: Lager-Menü (Fortsetzen/Regeln/Zur Weltkarte/Partie aufgeben), Autosave-Indikator, Confirm-Dialog (Zur Weltkarte, Partie aufgeben — destruktiv), überspringbare Nacht-Sequenz (Tap-to-skip), Fehlerfall-Karte (Wiederherstellen aus Autosave / Neu beginnen). Debug: `?menu`, `?exit`, `?abandon`, `?night`, `?error`, `?demo`. |
| `profil-hub-v2.html` | `drafts/` | active | Profil, Hub **und Chronik-Sync**. Erweitert v1 um die Cloud-Anbindung: **Sync ist opt-in** (Standard aus), Identität über einen **Chronik-Code** (Wortkette, kopierbar als Code oder Link, `?chronik=CODE` füllt den Holen-Dialog vor), Konflikt-Dialog „Zwei Chroniken" (Gerät vs. Cloud, Runde + Zeitpunkt, eine Seite gewinnt), Offline-/Fehlerzustand, angepasster Erststart-Text („zunächst nur auf diesem Gerät"). Der Server ist durch einen zweiten `localStorage`-Schlüssel simuliert, damit der Rundlauf **sichern → Gerät leeren → holen in einem Browser** testbar ist. Debug: `?empty`, `?demo`, `?sync`, `?restore`, `?conflict`, `?offline`. |
| `profil-hub-v1.html` | `archive/` | superseded | Erste Version: lokales Profil, Profil-Umschalter, Hub-Karte für laufende Partien, Chronik-Export/Import als Datei — aber ohne Cloud-Sync. Durch v2 ersetzt (Chronik-Code, Konflikt, Opt-in-Sync). |
| `spielfeld-entlastung-v1.html` | `drafts/` | active | HUD-Entlastung im laufenden Spiel: kompakte Punkt-Timeline (Tap für Runden-Info), Ressourcen-Chips mit Delta-Pop-Animation, einklappbares Lager-Sammelpanel (aktive Boni, Werkzeug-Bau), Chronik als Bottom-Sheet (sammelt Toast-Historie), Feld-Inspektor als eigenes Bottom-Sheet (schiebt die Karte nicht). Debug: `?chronik`, `?sheet`, `?lager`, `?delta`, `?demo`. |
