# hex-nachbarn-oddr

Wer grenzt an dieses Feld? Die sechs Nachbarn im odd-r-Offsetraster
(spitz-oben, ungerade Zeilen nach rechts versetzt) — die meistkopierte
Rechnung des ganzen Projekts.

## Gefunden in

Dieselben zwei Tabellen stehen **byte-gleich in 14 Dateien plus der App**.
Abweichungen gibt es nur in der Schreibweise der Zeilenparität.

| Datei | Zeile | Parität |
| --- | --- | --- |
| `app/src/stromlinien/grid.ts` | 8–24 | `((r % 2) + 2) % 2` |
| `drafts/stromlinien-epoche1.html` | 390–393 | `r % 2` |
| `drafts/eiszeit-labor-v3.html` | 577–581 | `r & 1` |
| `drafts/kartenwachstum-v1.html` | 175–177 | `((r % 2) + 2) % 2` |
| `drafts/ereignis-labor-v1.html` | 338–340 | `((r % 2) + 2) % 2` |
| `drafts/map-editor-v3.html` | 323–324 | `r % 2` |
| `drafts/mechanik-labor-v1.html` | 378–385 | `r % 2` |
| `drafts/nacht-effekte-v1.html` | 211–212 | `r % 2` |
| `drafts/rhein-gesamt-v1.html` | 161–163 | `r % 2` |
| `drafts/asset-editor-v1.html` | 125–126 | `((r % 2) + 2) % 2`, **gerechnet** |
| `archive/map-editor-v1.html` · `-v2` | 188 · 255 | `r % 2` |
| `archive/start-screen-v1.html` · `-v2` | 130 · 177 | `((r % 2) + 2) % 2` |
| `archive/eiszeit-labor-v1.html` · `-v2` | 303 · 444 | `r & 1` |

Nicht mitgezählt: `archive/erkundung-v1…v5.html` tragen den Baukasten
vollständig inline (Ergebnis von `kit/inline.mjs`) — deren Treffer sind
Maschinenausgabe, keine Handkopien.

## Entschieden

**Übernommen wurde die Fassung der App und der Prototypen** — `[dr, dc]` in
der Reihenfolge `W · E · NW · NE · SW · SE` —, nicht die des Baukastens.
Grund: 14 Fundorte und `grid.ts` gegen einen; und `CLAUDE.md` pinnt
ausdrücklich `stromlinien-epoche1.html` und `grid.ts` als die maßgebliche
Tabelle.

Bei der Parität gewinnt `((r % 2) + 2) % 2`. Das ist **keine Fehlerbehebung** —
siehe unten.

## Zwei Befunde, beide belegt im Test

### 1. Die drei Schreibweisen sind gleichwertig — der vermutete Fehler ist keiner

Naheliegende Annahme: `r % 2` sei für negative Zeilen falsch, weil
`-1 % 2 === -1`. **Stimmt nicht**, solange der Wert nur als Bedingung dient:
`-1` ist wahr, also wählt `r % 2 ? ODD : EVEN` für Zeile −1 korrekt die
ungerade Tabelle. Dasselbe gilt für `r & 1` (Zweierkomplement liefert `1`).
Über −10…10 durchgeprüft: alle drei Schreibweisen wählen dieselbe Tabelle.

**Es gibt hier also nichts zu reparieren**, und keiner der acht `r % 2`-Fundorte
ist deswegen kaputt.

Anders, sobald die Parität **gerechnet** statt verzweigt wird: der halbe
Zeilenversatz `c + 0.5 * par(r)` kippt mit rohem `r % 2` für Zeile −1 nach
links statt nach rechts. Genau dort steht die defensive Form auch schon
(`asset-editor-v1.html:126`) — richtig, aber aus einem Grund, den keiner der
Fundorte notiert. `rowShift()` hält ihn jetzt fest.

### 2. Der Baukasten widerspricht seiner eigenen Zusage

`kit/sot-hex.js` schreibt im Kopf: *„Diese Tabelle MUSS mit
`app/src/stromlinien/grid.ts` identisch bleiben — ein Prototyp, der anders
nachbart, beweist nichts über das Spiel."*

Sie ist es nicht. Der Baukasten speichert `[dc, dr]` in der Reihenfolge
`E · SE · SW · W · NW · NE`, die App `[dr, dc]` in `W · E · NW · NE · SW · SE`.

Die **Nachbarmenge** stimmt in beiden Zeilenparitäten überein — das ist im Test
nachgewiesen, es nachbart also niemand falsch. Aber der **Index** stimmt nicht,
und alle Fundorte indizieren positionsweise (`dirs[i]`, Kantenmarken, gegenüber-
liegende Seite). Der Baukasten ist damit **kein Drop-in-Ersatz**: wer
`SOT.hex.neighbors` gegen eine lokale Tabelle tauscht, dreht stillschweigend
jede Kantenzuordnung.

Die Zusage im Dateikopf ist so, wie sie dasteht, irreführend. Sie müsste von
„identisch" auf „gleiche Nachbarmenge, eigene Reihenfolge" korrigiert werden —
oder eine der beiden Seiten zieht nach.

## Nicht übernommen

- `SOT.hex.neighbors` als Rückgabeform mit `dir`-Namen wurde übernommen, die
  **Richtungsnamen des Baukastens** aber auf die hiesige Reihenfolge gelegt.
  Zwei Vokabulare für dieselben sechs Richtungen wären schlimmer als eins.
- `neighborsIn` filtert wie im Baukasten auf `cols × rows`. Die Fundorte, die
  stattdessen in einer Positions-Map nachschlagen (App: beliebig geformtes
  Gebiet), brauchen das nicht — sie geben ihre eigene Nachschlagefunktion.
- Kubus-Koordinaten, Distanz, Ring/Scheibe: kann der Baukasten schon
  (`SOT.hex.toCube/dist/ring/disc`), kommt hier nicht nochmal.

## Offen

- **Kein Prototyp ist umgestellt.** Diese Extraktion sagt bisher nur, *dass*
  die Tabelle 14-mal existiert und wie sie sich verhält.
- Die widersprüchliche Zusage in `kit/sot-hex.js` ist gemeldet, nicht behoben.
  Das ist eine Entscheidung, keine Aufräumarbeit: entweder der Baukasten dreht
  auf die App-Reihenfolge (bricht `erkundung-v6`, das über `GEO=[1,2,3,4,5,0]`
  bereits umrechnet), oder der Kommentar wird ehrlich.
- Bevor das in den Baukasten kann, muss diese Frage entschieden sein — sonst
  lägen dort zwei Nachbarschaftstabellen nebeneinander.
