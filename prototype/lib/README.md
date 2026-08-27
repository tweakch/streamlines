# Zwischenlager (`prototype/lib/`)

Hier liegt, was in den Prototypen **mehr als einmal** getippt wurde und sich als
reine Logik herausziehen liess: Eingabe rein, Ergebnis raus, kein DOM, keine
Abhängigkeit. Je Sache ein Ordner mit drei Dateien — die Logik, ein Test, der
ihr Verhalten festnagelt, und eine Notiz, was gefunden und entschieden wurde.

`lib/` ist **nicht** der Baukasten, sondern die Vorstufe:

```
drafts/*.html          dreimal dasselbe getippt
   │
   │  1 · /lib-extract          Muster finden, Test schreiben, herausziehen
   ↓
prototype/lib/<slug>/  festgenagelt, getestet, beschrieben  ← hier
   │
   │  2 · von Hand              entscheiden + befördern (kit/README.md, Regel 1)
   ↓
prototype/kit/         Baukasten, global (SOT.*), im Musterbogen gezeigt
   │
   │  3 · kit/UMBAU.md          Fundorte umstellen, lokale Kopien löschen
   ↓
die Doppelung ist weg
```

> **Ein Eintrag hier räumt noch nichts auf.** Stufe 1 sagt nur, *dass* etwas
> mehrfach existiert und wie es sich verhält. Der Code steht danach immer noch
> in allen Fundorten. Weg ist er erst nach Stufe 3 — die ihre eigene Wegleitung
> hat (`kit/UMBAU.md`: Bezugsbild einfrieren, `audit.mjs`, `vergleich.mjs`,
> jeder Bildunterschied wird erklärt statt weggeräumt).

**Prototypen verlinken `lib/` nicht.** `kit/inline.mjs` kennt nur die
Baukasten-Dateien; ein `../lib/…`-Verweis bliebe beim Archivieren als totes
`<script src>` stehen und die Datei wäre nicht mehr in sich geschlossen. Der
Umbau geht deshalb immer gegen den Baukasten, nie gegen das Zwischenlager.

## Stufen

| Stufe | heisst | Doppelung weg? |
| --- | --- | --- |
| `herausgezogen` | in `lib/`, getestet — Fundorte unverändert | nein |
| `befördert` | liegt im Baukasten, Musterbogen ergänzt | nein |
| `umgebaut (n/m)` | n von m Fundorten benutzen den Baukasten | teilweise |
| `erledigt` | alle Fundorte umgestellt, lokale Kopien gelöscht | **ja** |

## Tests

Node-Bordmittel, keine Abhängigkeiten:

```
node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
```

Der Glob gehört in Anführungszeichen (Node expandiert selbst); ein Verzeichnis
als Argument funktioniert nicht.

## Bauart

Jede `<slug>.js` läuft in **beiden** Welten, ohne Build: in Node als
CommonJS (`require`), im Prototyp als klassisches Script, das sich an
`SOTLIB.<name>` hängt — dieselbe Bauart wie der Baukasten (Globale statt
Module), damit eine spätere Beförderung fast nur ein Verschieben ist.

## Bestand

| Slug | Was | Fundorte | Stufe |
| --- | --- | --- | --- |
| [`hex-nachbarn-oddr`](hex-nachbarn-oddr/hex-nachbarn-oddr.md) | die sechs Nachbarn im odd-r-Raster | 14 Dateien + `app/src/stromlinien/grid.ts` | `herausgezogen` (9 Tests). Beförderung **blockiert**: `SOT.hex` hat dieselbe Nachbarmenge in anderer Reihenfolge — erst entscheiden, wer nachzieht |
| [`dijkstra-budget`](dijkstra-budget/dijkstra-budget.md) | kürzeste Wege mit Kostendeckel und Überlebenswahrscheinlichkeit | 3 Dateien (`gewaesser-labor-v1` + beide `ab/gewaesser-kacheln`), byte-gleich | `herausgezogen` (11 Tests). Beförderung **offen**: der Baukasten führt bisher keine Algorithmen — vielleicht bleibt das dauerhaft hier |
| [`fluss-breite`](fluss-breite/fluss-breite.md) | Abfluss → Breite in Metern, gezeichnetes Band, Gewässerklasse, belegte Felder | `bandBreite` in 4 Dateien byte-gleich (`dynamic-rhein-tiles-with-seasons-v1`, `gewaesser-labor-v2`/`-v3`, `erkundung-v6`); die 1/3/5-Belegung nur in `dynamic-rhein-tiles-with-seasons-v1` | `herausgezogen` (34 Tests). Enthält **neue, ungenutzte** Funktionen: `korridorKm`/`radiusBeiRaster` (Belegung aus Abfluss *und* Feldgrösse) und `hangFaktor`/`gangFaktor`/`sinuositaet`/`breiteMitGefaelle` (Breite aus Gefälle und dessen Gang). **Rückfluss aus `fluss-gefaelle-labor-v2`** (2026-08): Strom-Leiter mit Korridorbreiten 1·2·3·4·5 (`klasseStrom`, `korridorFelder`, Strom ab 85), Laufmitte-Rastern (`rasteMitte` — gerade Breiten auf die Feldgrenze) und Felddeckung (`feldDeckung`/`gezaehlteFelder`, stetig·mehrheit·symmetrisch). Offen: Klassengrenzen Labor↔Karte · Klippe bei Q = 100 · Gelände-Exponenten nicht geeicht · **Befund 4: drei Belegungsrechnungen nebeneinander — eine muss kanonisch werden** |
| [`fluss-profil`](fluss-profil/fluss-profil.md) | ein Lauf als Abschnittsliste: Höhe mit Wasserfällen (Sprung am Blockrand) und Seen (glatter Spiegel, Abfall am Einlauf), Abfluss, Delta vor dem See | 2 Dateien: `fluss-gefaelle-labor-v2` (Regler-Kopie) + `lauf-korridor-v1` (wörtliche API-Kopie, zweiter Verbraucher) | `herausgezogen` (14 Tests). Der zweite Verbraucher hat die API **unverändert** getragen — Kit-Regel 1 erfüllt; offen bleibt, ob der Baukasten Fachrechnung führt (dieselbe Frage wie bei [`dijkstra-budget`](dijkstra-budget/dijkstra-budget.md)); für die App ein TS-Port mit denselben Tests |

## Was hier nicht hingehört

- Alles mit `document`, `window`, Canvas, `fetch`, `localStorage` — das ist
  Baukasten-Gebiet (`kit/sot.js`).
- Alles mit nur **einem** Fundort. Eine Idee, die es einmal gibt, bleibt in
  ihrer Datei.
- Spielregeln. Ressourcen, Decks, Ereignisse bleiben im Prototyp.
