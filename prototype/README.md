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
| `spielmenue-v1.html` | `drafts/` | **teilweise ported** | Session-Lifecycle-Details. **In die App portiert** (mit der Shell): Lager-Menü, Aufgeben-Confirm, überspringbare Nacht-Sequenz, Autosave selbst. **Noch offen** (bleibt deshalb Draft): Autosave-*Indikator* („speichert …/gespeichert"), Fehlerfall-Karte (Wiederherstellen aus Autosave nach Absturz). Debug: `?menu`, `?exit`, `?abandon`, `?night`, `?error`, `?demo`. |
| `shell-v2.html` | `archive/` | **ported** | **Die Shell** (Meta-UI rund ums Spiel) — nach `app/src/shell/` portiert (Titelbild, Klan gründen, Epochen, Regeln, Über + Router in `App.tsx`; Weltkarte = erweiterter `StartScreen`, Spiel mit ⬡/☰). Kernideen im Port: Resume-Karte mit „zuletzt:"-Kontext auf Titel und Weltkarte, Kampagne als Info-Station, Menü von rechts, Autosave nach jeder Aktion (`shell/storage.ts`, Schema-versioniert), Nebel pro Profil. Gemessen im Prototyp (420×860): erstes Spiel 3 Klicks / 72px (v1: 5 / 1109px). **Nicht portiert:** Chronik-&-Sync-Screen (braucht erst den Endpunkt, siehe `profil-hub-v2`), globale Enter/Esc-Tastatursteuerung. |
| `shell-v1.html` | `archive/` | superseded | Erste Fassung der Shell: Hub und „Gebiet formen" noch getrennte Screens, Kampagne im Pflichtweg, Menü fuhr von links unter einem Auslöser oben rechts ein. Durch v2 ersetzt (kürzere Wege, Weltkarte als Hub). |
| `profil-hub-v2.html` | `drafts/` | active | Profil, Hub **und Chronik-Sync**. Erweitert v1 um die Cloud-Anbindung: **Sync ist opt-in** (Standard aus), Identität über einen **Chronik-Code** (Wortkette, kopierbar als Code oder Link, `?chronik=CODE` füllt den Holen-Dialog vor), Konflikt-Dialog „Zwei Chroniken" (Gerät vs. Cloud, Runde + Zeitpunkt, eine Seite gewinnt), Offline-/Fehlerzustand, angepasster Erststart-Text („zunächst nur auf diesem Gerät"). Der Server ist durch einen zweiten `localStorage`-Schlüssel simuliert, damit der Rundlauf **sichern → Gerät leeren → holen in einem Browser** testbar ist. Debug: `?empty`, `?demo`, `?sync`, `?restore`, `?conflict`, `?offline`. |
| `profil-hub-v1.html` | `archive/` | superseded | Erste Version: lokales Profil, Profil-Umschalter, Hub-Karte für laufende Partien, Chronik-Export/Import als Datei — aber ohne Cloud-Sync. Durch v2 ersetzt (Chronik-Code, Konflikt, Opt-in-Sync). |
| `feld-labor-v1.html` | `drafts/` | active | **Anatomie eines Feldes** + der **Feld-Explorer**. Prüfstand für die Frage, wie ein Hexfeld aussieht, wenn es über die Epochen Landschaft, Plättchen, Menschen, Flora/Fauna, Ereignisse und Kanten-Mods gleichzeitig tragen muss: Mittelfeld + 6 Nachbarn, jedes Merkmal per Werkbank an/aus. Ergebnis-Modell: **Schichten** (Grund → Kern → Kanten → Slots) mit **festen Slots** (Kern Mitte · Krone oben rechts Menschen · Wange oben links Ereignis+Restdauer · Ferse unten links Arten · Fuss unten Mitte Zeichen ◈ · Zahl unten rechts Feldwert · Kanten sechs Seiten) und **Detailstufen** S/M/L nach Hexbreite (<52 / 52–75 / ≥76px), die Slots wegnehmen statt zu schrumpfen. Marken sind in `em` bemessen und skalieren mit `--hexw`; Slots liegen auf einem Ring bei ~22% (die Boxecken des Spitz-oben-Sechsecks sind leer); Kanten-Balken sitzen mittig auf der Kantenmitte, die Gegenkante wird mitgesetzt. Der **Feld-Explorer** ist nicht-diegetisch (Mono-Register, „Werkzeug"), mobil Vollbild, ab 900px Seitenpanel, das das Brett schmaler macht (und damit die Detailstufe sichtbar senkt) — mit Hero-Hex, Abschnitten und **Feldwert-Ledger** (jede Zeile mit Quelle: Plättchen, Verbund, Art, Mensch, Ereignis) statt einer nackten Zahl. Epochen-Vorlagen I–V zeigen dieselbe Zelle mit wachsender Last; „Volllast" als Stresstest. Debug: `?epoche=1..5`, `?explorer`, `?max`, `?lod=s|m|l`, `?size=42`, `?slots`, `?night`, `?feld=1,0`, `?leer`, `?demo`. |
| `rhein-gesamt-v1.html` | `drafts/` | active | Der **gesamte Rhein** vom Quellgebiet (Tomasee/Vorderrhein + Paradiesgletscher/Hinterrhein) bis zur Nordseemündung als eine Hexkarte (40×64, pointy-top, odd-r wie `grid.ts`). Nicht handgezeichnet: die Welt wird aus **Wegpunktlisten pro Abschnitt** generiert (Hex-Linien via cube lerp), Bergzonen grob als Rechtecke, Flusstäler werden freigeschnitten, Ufer abgeleitet. Sieben farbige Abschnitte (Alpenrhein · Bodensee · Hochrhein · Oberrhein · Mittelrhein · Niederrhein · Deltarhein), Nebenläufe als Stummel (Hinterrhein, Lek, Aare, Neckar, Main, Mosel, Ruhr), 16 Landmarken, ≈km-Skala ab Quelle (linear auf 1230 km, v1-Näherung). UI: Legende-Chips (Highlight + Scroll), Feld-Inspektor, km-Marken, Zoom, Demo „Den Fluss entlang" (Marke wandert Quelle→Meer). Geographie stark vereinfacht (v1). Debug: `?abschnitt=alpen\|bodensee\|hoch\|ober\|mittel\|nieder\|delta`, `?km`, `?labels=0`, `?demo`, `?hexw=13`, `?inspect=c,r`. |
| `rhein-tiles-v2.html` | `drafts/` | active | **Tileset-Viewer v2** — Konsument der Karten-Pipeline (`pipeline/`, siehe deren README): Quellenverzeichnis mit normalisierten WGS84-Geodaten (`pipeline/sources/`, mit Provenienz/Lizenz) → `node pipeline/bake.mjs` schreibt das Tileset als **`rhein-tiles-v2.data.js`** (generiert, nicht von Hand editieren — bewusste Ausnahme von der Ein-Datei-Regel, damit der Viewer per file:// läuft). **Neu in v2 — abgeleitete Ebenen:** das Flächen-Terrain wird nur noch einmal auf der feinsten Ebene gerastert (Basisraster = Ebene 2: Polygone + DTM) und Ebene 1/0 daraus aggregiert (Zellzentren-Zuordnung: Mehrheit fürs Terrain, Mittel für die Höhe; Linien wie der Flusslauf weiterhin pro Ebene, sonst überleben sie den Mehrheitsentscheid nicht) — damit erbt Ebene 1/0 das echte DTM-Relief (`pipeline/verify-cell.mjs` prüft Einzelzellen samt Basis-Verteilung). **Neu in v2 — Viewer-Performance:** Scene-Canvas (Schwenken = reines drawImage-Blitting), rAF-Koaleszenz, Farb-Batching (fertig gemischte Farben pro Terrain×Höhenstufe×Abschnitt, ~25 fill()-Aufrufe statt Tausender Stilwechsel), zweistufiger Refill (klein bei Eingabe, voller Rand im Idle). Gemessen headless (SwiftShader, worst case, `?bench`): Schwenken Ø ~4 ms, Zoom Ø ~33 ms (vorher 184/395 ms). Format: 32×32-Kacheln mit Terrain- und Abschnitts-Layer als base64-Uint8Array, leere Kacheln entfallen; Flusspfad mit echten km (Haversine), Landmarken mit `detail`-Flag. Viewer: Canvas mit Viewport-Culling, Lazy-Tile-Decode + Cache, Ebenenwechsel am Zoom, Pan/Zoom/Fit, Feld-Inspektor, Stats-Overlay (sichtbare Zellen / dekodierte Kacheln). Täler werden beim Bake freigeschnitten — das Mittelrhein-Durchbruchstal entsteht aus Bergland-Polygonen + Flusslinie von selbst. **Ebene 2 (0.4 km/Hex, Region Alpenrhein)** kommt aus dem echten Sonny-DTM (50 m, CC BY 4.0): `pipeline/fetch/normalize-dtm.mjs` (WGS84→UTM, bilineares 200-m-Raster) → Bake klassifiziert Steigung/Relief zu flach/**Hang**/Berg (Schwellen in `CLS`) + Höhen-Layer (Schummerung, „m ü. M." im Inspektor); Ebenen mit Region liefern nur Kacheln darin, der Viewer schaltet nur innerhalb um. Canvas zeichnet pointy-top (Ecke oben/unten). **Echte OSM-Geometrie** (Overpass, ODbL): der **Hauptlauf selbst** ist die OSM-Relation „Rhein" (inkl. Vorderrhein ab Tomasee; Waal-Route bis zum Haringvliet, dazu der Lek-Arm bis Hoek van Holland; Wege entlang einer Referenzlinie geordnet, Parallelkanäle verworfen; ~1265 km statt der 1050 der Hand-Polylinie), dazu Aare, Reuss, Limmat, Seez, Linth, Sihl als Nebenläufe und Bodensee (inkl. Untersee), Walensee, Zürichsee, Obersee, Sihlsee als echte See-Polygone. Sehenswert: das Wasserschloss bei Brugg (`?lon=8.28&lat=47.42&z=11`), die Linth-Seen-Kette (`?lon=8.90&lat=47.20&z=9`), das Delta mit zwei Armen (`?lon=4.9&lat=51.85&z=9`). Beim Vergröbern gewinnen Seen schon ab 25 % Anteil (Generalisierung), damit Zürich- und Walensee auf Ebene 0 sichtbar bleiben. Debug: `?stats`, `?bench` (synchroner Messlauf, Ergebnis im HUD), `?level=0\|1\|2`, `?lon=9.50&lat=46.90&z=25` (Ebene 2 bei Chur), `?inspect=lon,lat`, `?labels=0`. |
| `rhein-tiles-v1.html` | `archive/` | superseded | Erste Fassung des Tileset-Viewers (mit `rhein-tiles-v1.data.js`): Ebenen unabhängig voneinander gerastert (Ebene 1/0 wussten nichts vom DTM der Ebene 2), Vollbild-Neuzeichnung bei jedem Input-Event. Durch v2 ersetzt (abgeleitete Ebenen + Blit-Rendering). |
| `spielfeld-entlastung-v1.html` | `drafts/` | active | HUD-Entlastung im laufenden Spiel: kompakte Punkt-Timeline (Tap für Runden-Info), Ressourcen-Chips mit Delta-Pop-Animation, einklappbares Lager-Sammelpanel (aktive Boni, Werkzeug-Bau), Chronik als Bottom-Sheet (sammelt Toast-Historie), Feld-Inspektor als eigenes Bottom-Sheet (schiebt die Karte nicht). Debug: `?chronik`, `?sheet`, `?lager`, `?delta`, `?demo`. |
