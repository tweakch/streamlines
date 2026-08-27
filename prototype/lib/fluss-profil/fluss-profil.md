# fluss-profil

Ein Lauf als Abschnittsliste: Höhe am km-Punkt (mit Wasserfällen als Sprung
und Seen als glattem Spiegel), Abfluss aus Quellschüttung und Zuflüssen, und
das Delta, das sich vor einem See aufbaut.

## Gefunden in

| Datei | Zeile | Fassung |
| --- | --- | --- |
| `drafts/fluss-gefaelle-labor-v2.html` | 333 (`hoeheBei`), 346 (`abflussBei`), 356 (`naechsterSeeVon`), ~390 (Delta), 407 (Fälle→Zeilen) | einziger Fundort |

**Ein Fundort — nach der Regel der Skill kein Kandidat.** Es liegt trotzdem
hier, aus demselben Grund wie die Belegung in [[fluss-breite]]: es war der
ausdrückliche Gegenstand des Auftrags („Stufe 1: die Zahlen des Labors
zurückfliessen lassen und das neue Verhalten festnageln"), und das Modell ist
der Kern dessen, was Labore und Spielkarte künftig teilen sollen.
`fluss-gefaelle-labor-v1` (Archiv) hat KEIN Blockmodell — dort wächst Q
einfach mit der Lauflänge; die Abschnitte mit Abfall/Zufluss/See/Fall sind
eine v2-Erfindung.

## Das Modell

Ein Block: `{ kmVon, kmBis, abfall, zufluss, see, fall }` — lückenlos,
aufsteigend, Bezugshöhe 0 an der Mündung.

- **Höhe** linear im Block, kumuliert von unten. `steil` skaliert Abfälle
  und Fälle gemeinsam.
- **Fall** = Sprung genau am OBEREN Blockrand (`kmVon`). Punkte im Block
  liegen unter ihm, Punkte oberhalb über ihm. Im Labor liest sich die
  Zeile mit der Grenze dadurch von selbst als „Fall" (J springt).
- **See** = der Block ist glatt: sein Spiegel liegt auf Auslaufhöhe, der
  ganze Blockabfall sitzt am Einlauf. Emergent und getestet: ein Fall am
  Anfang des FOLGEBLOCKS ist der Auslauf-Wasserfall des Sees — der Spiegel
  steht über ihm.
- **Abfluss** wächst je Block linear um dessen Zufluss, Boden bei
  0.1 m³/s. Mit `q0 < 2` ist die Quelle ein Rinnsal (Kartengrenze) — der
  Anlass des ganzen Umbaus: das Labor stand mit `q0 = 2` GENAU auf der
  Grenze und konnte nie eines zeigen.
- **Delta** `deltaAnteil()`: 0 → 1 linear über `deltaKm` auf die Seekante
  zu, im See selbst 0 (der Kiesfächer im See ist Zeichnung, kein Modell).
  Nimmt die ganze Blockliste — ein Ausschnitt, der vor dem See endet, sieht
  das anlaufende Delta trotzdem.
- **`fallZeilen(bloecke, von, bis, dk)`** ordnet Fälle den Zeilen eines
  Ausschnitts zu; Grenzen exakt auf `von`/`bis` fallen heraus (streng), zwei
  Grenzen in einer Zeile summieren sich.

## Entschieden

Wörtlich die v2-Fassung, nur von den `P.*`-Globalen auf Argumente gestellt
(`bloecke`, `steil`, `q0`, `deltaKm` explizit statt Labor-Regler). Keine
Formel geändert.

## Nicht übernommen

- Das Vorgabeprofil (`VOR_ABFALL`/`VOR_ZUFLUSS`, Alpenrhein-artig, auf die
  Abschnittslänge skaliert) — Spieldaten des Labors, kein Rechenkern.
- Der Kiesfächer IM See (Breite/Blässe je Zeile) und die Schaumlinien des
  Falls — Zeichnung.
- Das Einfrieren der Laufmitte an der Mündung (`seeMitte`) — hängt am
  Mäander-Renderer, nicht am Profil.
- Die Zeilenrechnung `reihen()` selbst (km → J/Q je Hexzeile): sie ist der
  Ort, an dem Profil (hier) und Breite ([[fluss-breite]]) zusammenkommen,
  und noch zu sehr Labor-geformt (Ausschnitt, `P`, LAB-Fenster), um sie
  festzunageln. Kandidat für später, wenn ein zweiter Verbraucher steht.

## Offen

- **Kein Fundort ist umgestellt** — `fluss-gefaelle-labor-v2` trägt seine
  Regler-Kopie, und der zweite Verbraucher (unten) eine wörtliche Kopie.
- ~~Ein zweiter Verbraucher fehlt.~~ **Er steht:** `drafts/lauf-korridor-v1`
  legt den Lauf über den Korridor und trägt diese API-Fassung **wörtlich**
  (Kopie, ein Draft darf `lib/` nicht verlinken). Alle sechs Funktionen
  wurden unverändert gebraucht — `fallZeilen` und `deltaAnteil` trugen den
  Renderer ohne Anpassung. Kit-Regel 1 (zwei gleiche Auftritte) ist damit
  erfüllt; die Beförderungsfrage (führt der Baukasten Fachrechnung?) bleibt.
- Ob ein See-Block seinen `abfall` überhaupt führen soll (heute: erlaubt,
  konzentriert am Einlauf) oder ob das Labor ihn beim Setzen eines Sees auf
  0 stellen sollte, ist Designfrage — festgehalten, nicht entschieden.
- Für den Sprung in die App: TypeScript-Port mit denselben Tests, wie
  `grid.ts` die Nachbartabellen von `sot-hex.js` spiegelt.
