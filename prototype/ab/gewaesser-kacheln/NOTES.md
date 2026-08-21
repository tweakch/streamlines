# A/B: Kacheln statt Flächenfarbe

## Die Frage

`gewaesser-labor-v1` malt Gelände als flache CSS-Farbe je Landklasse
(Flachland/Aue/Hang/Berg/See), mit Hatch-Mustern für Hang/Berg. Sieht das
hübscher aus, wenn die Grundflächen echte Textur-Kacheln statt Flächenfarbe
tragen — und lohnt sich der Weg über fertige Tile-Assets?

## Die Variantion

- **a-vektor.html** — unverändertes `gewaesser-labor-v1` (Referenz).
- **b-kacheln.html** — dieselbe Datei, nur die Flächenfüllung ersetzt:
  Flachland/Aue/Stillwasser bekommen ein wiederholtes Textur-Muster statt
  `var(--tile)`/`var(--aue)`/`var(--lake)`. Hang/Berg-Hatch und die gesamte
  Fluss-/Mensch-/Regelwerk-Logik sind identisch zu a — reine Render-Frage.

## Woher die Texturen kommen

**„Hex Tileset Pack"** von *adythewolf*, [OpenGameArt.org](https://opengameart.org/content/hex-tileset-pack),
Lizenz **CC0** (gemeinfrei, keine Attribution nötig — hier trotzdem
dokumentiert, aus Gewohnheit wie bei den anderen Quellen im Projekt).

Wichtig: **nicht die Hex-Grafiken selbst verwendet** — das Pack ist
flat-top orientiert (Spitzen links/rechts), unser Raster ist pointy-top
(Spitzen oben/unten). Ein direktes Einsetzen der fertigen Hex-Bilder hätte
die Kontur falsch herum gedreht, und die mitgelieferten Weg-/Fluss-Segmente
(vorgezeichnete Biegungen) wären ohnehin überflüssig gewesen — unser Fluss
entsteht ja schon prozedural. Stattdessen wurden drei kleine 20×20-Ausschnitte
aus der *Fläche* der Gras-/Erde-/Wasser-Hexe herausgeschnitten (die Textur,
nicht der Umriss) und als kleines wiederholtes Muster in unsere eigene
pointy-top-Kontur geklemmt. Die Kontur bleibt unser Code, nur der Inhalt
kommt aus dem Pack.

## Beobachtung

- Aue liest sich mit der Erde-Textur sofort als „Kies/Schotter" — der
  bisherige synthetische Punktraster (`#kies`) wurde deshalb in b entfernt,
  doppelte Textur wirkte unruhig.
- Die Stillwasser-Flächen (See-Gruppen, Weiher/Tümpel/Pfütze/Teich) wirken
  mit der Wasser-Textur weicher als die Flat-Fill-Variante.
- Der prozedurale Fluss (Vektor-Band) bleibt in beiden Varianten identisch
  und sticht in b eher noch klarer hervor, weil der Untergrund mehr Struktur
  hat, gegen die er sich abhebt.
- Hang/Berg haben keine passende Ersatz-Textur bekommen (das Pack liefert
  keine stimmige Fels-Fläche) — bleiben in b unverändert mit Hatch.

## Entscheidung

Noch offen — zur Ansicht für den Nutzer gebaut, keine Entscheidung getroffen.
