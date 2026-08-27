# fluss-breite

Vom Abfluss zur Breite: echte Meter (`b = 6·√Q`), das gezeichnete Band, die
Gewässerklasse — und die Zahl der Felder, die ein Lauf auf der Karte belegt.

## Gefunden in

`bandBreite` und `BFAK·√Q` stehen **viermal**, byte-gleich bis auf `var`/`let`:

| Datei | Zeile | Fassung |
| --- | --- | --- |
| `drafts/dynamic-rhein-tiles-with-seasons-v1.html` | 1227, 1447 | identisch |
| `drafts/gewaesser-labor-v3.html` | 127, 103 | identisch |
| `drafts/gewaesser-labor-v2.html` | 137, 102 | identisch |
| `drafts/erkundung-v6.html` | 1461, 764 | identisch (`let` statt `var`) |

Die **Belegung** (`fussRang` → Radius → Hex-Scheibe) hat dagegen nur **einen**
Fundort: `dynamic-rhein-tiles-with-seasons-v1.html:1344 + 1372`. Nach der
Regel dieser Skill wäre sie damit kein Kandidat — sie liegt hier trotzdem,
weil sie der ausdrückliche Gegenstand des Auftrags war und weil sie ohne die
Breitenrechnung nicht zu beurteilen ist.

`gewaesser-labor-v1` hat nichts davon: es ist die unumgebaute Urfassung.

## Entschieden

Übernommen ist die Fassung des Bestands, unverändert. Die Klassengrenzen der
**Karte** (Seasons) gewinnen gegen die des **Labors**; beide sind getestet.

## Drei Befunde

### 1. Karte und Labor klassieren nach verschiedenen Grössen

Das Labor schneidet nach **Breite** (`b < 5` / `b < 10`), die Karte nach
**Abfluss** (`Q < 2 / 10 / 60`). Der Seasons-Draft begründet den Wechsel im
Quelltext selbst: das Labor nannte alles über ~3 m³/s einen grossen Fluss,
auf der grossen Karte fliessen aber Aare (560) und Rhein (1000).

Die Folge ist grob: ein Bach von 2.8 m³/s ist in der Laborfassung ein
**grosser Fluss**, auf der Karte ein **Bach**. Beide Fassungen sind
festgenagelt, `klasseNachBreite` trägt die verworfene.

### 2. Von vier Klassen wirken sich nur zwei auf die Belegung aus

`radius()` bildet Rang 0 **und** 1 auf 0 ab. Rinnsal und Bach belegen dasselbe
eine Feld; die Belegung springt allein bei Q = 10 und Q = 60. Die vier Klassen
suggerieren eine Feinheit, die es in der Belegung nicht gibt.

### 3. Das gezeichnete Band und die belegten Felder widersprechen sich

Der eigentliche Befund, und er ist gemessen:

| | Q = 59 | Q = 60 | Zuwachs |
| --- | --- | --- | --- |
| gezeichnetes Band (Feldbreiten) | 0.1714 | 0.1717 | **0.21 %** |
| belegte Felder (Durchmesser) | 3 | 5 | **67 %** |

Ein Faktor von rund **300** zwischen zwei Zahlen, die dasselbe meinen sollten.
Und die Grössenordnung passt ohnehin nicht: das Band wird **nie breiter als
0.34 Feldbreiten** (der Deckel in `bandBreite`), gestempelt werden bis zu
**fünf ganze Felder**. Der Rhein wird als Haarstrich gezeichnet und als
5-Felder-Korridor markiert.

Das ist kein Fehler — die beiden Grössen beantworten verschiedene Fragen (das
Band ist Optik, die Belegung ist der *Flussraum*, also welche Plättchen als
Fluss ansprechbar sind). Aber sie stammen aus unverbundenen Formeln, und
darum lässt sich die eine aus der anderen nicht herleiten: über `bandBreite`
ist die heutige 1/3/5-Staffel **nicht** reproduzierbar, weil die Bandkurve in
diesem Bereich logarithmisch und fast flach ist, während der Rang springt.

## Neu: Belegung als Funktion von Abfluss **und** Feldgrösse

Der offene Punkt hinter dem Auftrag ist nicht, dass die Breite nicht vom
Abfluss abhinge — das tut sie längst (`b = 6·√Q`). Er ist, dass die
**Belegung die Feldgrösse nicht kennt**: `radius(q)` nimmt nur `q`. Auf der
Klima-Ebene (2 km/Feld) sind 5 Felder 10 km Landschaft, auf Ebene 2
(0.4 km/Feld) nur 2 km — derselbe Fluss, ein Fünftel des Raums.

Zwei neue Funktionen, beide **nicht im Bestand**:

- `korridorKm(q)` — Breite des Flussraums in Kilometern, stetig über
  `log10(Q)`. Geeicht auf die heutigen Sprünge: 4 km bei Q = 10, 8 km bei
  Q = 60. Die Konstanten sind daraus **gerechnet**, nicht gerundet — mit
  gerundeten verfehlt Q = 60 seine Schwelle um 3·10⁻⁴ und fällt eine Stufe
  zurück (beim Bauen passiert, im Test festgehalten).
- `radiusBeiRaster(q, hexKm, maxR)` — Radius aus Korridor und Feldgrösse.

Der Nachweis, dass das nichts kaputt macht: bei `hexKm = 2` ist
`radiusBeiRaster(q, 2, 2) === radius(q)` — über 4 000 Abflusswerte geprüft,
nicht nur an den Sprüngen. Auf feineren Rastern wächst die Belegung, und der
Korridor bleibt dabei physisch dieselbe Landschaft:

| Q | Korridor | R bei 2 km | R bei 1 km | R bei 0.4 km |
| --- | --- | --- | --- | --- |
| 5 (Bach) | 2.5 km | 0 | 1 | 3 |
| 560 (Aare) | 13.0 km | 3 | 6 | 16 |
| 1000 (Rhein) | 14.3 km | 3 | 7 | 17 |

Ungedeckelt gibt die neue Regel dem Rhein schon bei 2 km mehr als die alte
(R 3 statt 2) — die alte deckelt faktisch bei 2. Wer das nicht will, übergibt
`maxR`; mit `maxR = 2` ist sie an der Klima-Ebene exakt die alte.

**Ob 14 km Flussraum für den Rhein richtig sind, ist nicht geprüft.** Die Zahl
folgt aus der Eichung auf die heutigen Sprünge, nicht aus einer Quelle. Sie
ist plausibel für die Talaue zwischen Basel und Karlsruhe, aber das ist ein
Eindruck, kein Beleg.

## Neu: Gefälle und sein Gang

Bis hierher hängt die Breite allein am Abfluss — zwei Läufe mit gleichem Q
sind gleich breit, ob sie durch eine Klamm stürzen oder durchs Mittelland
mäandern. Das Gelände weiss mehr, und zwar über **J** und über den **Gang von
J** entlang des Laufs (Vorgänger, Feld, Nachfolger):

| Gelände | Ableitung | Wirkung |
| --- | --- | --- |
| wird flacher | dJ < 0 | Geschiebe fällt aus, das Bett verwildert → **breiter** |
| ist flach | J klein | der Lauf **mäandert** (Windungsgrad steigt) |
| wird steiler | dJ > 0 | der Lauf klemmt sich ein → **schmaler** |

**Die Schwellen sind nicht erfunden.** Sie stehen so in
`gewaesser-labor-v1.html:312–315` und sind dort an der Karte geeicht:
`jBraid = 0.012` (12 m/km) · `jSchnell = 0.055` · `jFall = 0.120` ·
Verzweigungsfaktor `3.0`. `verzweigt()` übernimmt die Bedingung aus Zeile 570
wörtlich (`J < jBraid && b >= 8 && b < 60`).

Vier Funktionen: `hangFaktor(J)` · `gangFaktor(jVor, j, jNach)` ·
`sinuositaet(J)` · `breiteMitGefaelle(q, profil, opt)`, dazu `gefaelleLage()`
für den Inspektor.

**Die Sicherheitseigenschaft**, getestet: ohne Profil ist
`breiteMitGefaelle(q) === breiteM(q)`, auf den Eichpunkten Alpenrhein 57 m und
Basel 194 m. Und bei `J = jBraid` mit gleichbleibendem Gefälle ändert sich
ebenfalls nichts. Das Gelände **moduliert** den geeichten Bezugspunkt, es
ersetzt ihn nicht.

Ein Längsprofil zur Anschauung (Q, J und Gang von Hand gesetzt, `verzweigung`
an):

| Lage | Q | J | Gang | b | Windung |
| --- | --- | --- | --- | --- | --- |
| Hinterrhein, Klamm | 12 | 0.090 | wird steiler | 10 m | 1.00 |
| Ausgang ins Domleschg | 60 | 0.030 | wird flacher | 53 m | 1.00 |
| Alpenrheintal | 90 | 0.004 | wird flacher | 181 m | 1.38 |
| Bodensee-Vorland | 110 | 0.002 | gleichbleibend | 65 m | 1.62 |
| Eintritt Hochrhein | 380 | 0.006 | wird steiler | 93 m | 1.24 |

Ohne Gelände wäre die Zeile „Alpenrheintal" 57 m — die verwilderte Furkation
macht daraus 181 m Gürtelbreite. Das ist gewollt und entspricht dem, was der
Alpenrhein vor der Korrektion war.

### Der Befund: eine dreifache Klippe bei Q = 100

Die Tabelle zeigt sie selbst — 90 m³/s ergeben **181 m**, 110 m³/s nur
**65 m**. Der grössere Fluss ist schmaler.

Ursache ist das **harte Fenster** des Labors: `b < 60` schliesst bei genau
Q = 100 (b = 60.0) die Verzweigung aus, und der Faktor 3 fällt in einem
Schritt weg.

| Q | b | verzweigt | Gürtel |
| --- | --- | --- | --- |
| 99.9 | 60.0 | ja | 180 m |
| 100 | 60.0 | nein | 60 m |

0.1 % mehr Abfluss, ein Drittel der Breite. Das ist **dieselbe Art Klippe wie
oben bei der Belegung** (Befund 3) und dieselbe Ursache: eine Stufenfunktion,
die auf eine stetige Grösse multipliziert wird.

Die Klippe steckt schon im Bestand — `verzweigt` ist dort ebenfalls ein
Boolescher Schalter mit Faktor 3. Sichtbar wird sie erst, wenn man die Breite
daraus rechnet statt nur zu zeichnen. **Nicht geglättet**, sondern
festgehalten: der Test beschreibt, was ist. Der naheliegende Ausweg wäre, den
Faktor an den Fensterrändern auszublenden statt zu schalten — das ist eine
Design-Entscheidung, kein Aufräumen, und steht unter „Offen".

## Rückfluss aus `fluss-gefaelle-labor-v2` (2026-08)

Das Labor hat den Prüfstand-Auftrag von oben eingelöst und Neues zurückgebracht
(Fundort jeweils `drafts/fluss-gefaelle-labor-v2.html`, Zeilen im Quelltext
vermerkt):

- **Die Strom-Leiter** (`KLASSEN_STROM`, `klasseStrom`, `korridorFelder`):
  fünf Klassen mit fester Korridorbreite — Rinnsal 1 · Bach 2 · kleiner
  Fluss 3 · grosser Fluss 4 · **Strom 5**. Entwicklerentscheid: die blaue
  Fläche ist der *Korridor*, in dem Wasser fliessen kann, nicht das Wasser;
  am Ende des Laufs steht das Meer, kurz davor wird der grosse Fluss zum
  Strom. Die Grenze **85 m³/s ist gewählt, nicht gemessen** — so, dass das
  Vorgabeprofil des Labors (Q ≈ 91 an der Mündung) den Strom auf den letzten
  10 km erreicht. Unterhalb 85 deckt sich die Leiter mit den Kartengrenzen
  (getestet): sie verfeinert `rang`, sie widerspricht ihm nicht.
- **Das Rastern der Laufmitte** (`rasteMitte`): ungerade Breiten mittig auf
  ein Feld, gerade auf die Feldgrenze. Der Befund dahinter: mittig um eine
  Feldmitte gelesen wird aus einer 2 immer eine 3 — erst das Überspannen der
  Feldgrenze macht gerade Breiten *konstant* statt zum Zufall des Mäanders.
- **Die Felddeckung** (`feldDeckung`, `gezaehlteFelder`): wann ein Feld als
  Wasser zählt — `stetig` (Teildeckung) · `mehrheit` (ab 50 % ganz,
  Voreinstellung des Labors) · `symmetrisch` (alte Fassung, nur 1/3/5).
  Getestet ist die Zusicherung hinter `breite=korridor`: nach `rasteMitte`
  zählt `mehrheit` exakt die Klassenbreite, für jede Klasse, egal wo die
  Mitte lag.
- **Der q0-Befund**: eine Quelle mit `q0 = 2` steht GENAU auf der
  Rinnsal/Bach-Grenze und kann nie ein Rinnsal sein — deshalb konnte das
  Labor keines zeigen. Labor-Voreinstellung jetzt 0.5; festgenagelt.

Das **Profilmodell** des Labors (Abschnitte mit Abfall/Zufluss/See/Fall,
glatte Seespiegel, Delta) liegt daneben in [[fluss-profil]].

### Neuer Befund 4: drei Antworten auf „wie viele Felder?"

Mit dem Rückfluss führt diese Datei nun **drei** Belegungsrechnungen:

| Rechnung | nimmt | liefert | Raster-bewusst? |
| --- | --- | --- | --- |
| `durchmesser(q)` (Bestand) | Q | 1 / 3 / 5 | nein |
| `radiusBeiRaster(q, hexKm)` (Vorschlag) | Q + Feldgrösse | stetig wachsend | **ja** |
| `korridorFelder(q)` (Labor v2) | Q | 1 / 2 / 3 / 4 / 5 | nein |

Sie widersprechen sich: für den Rhein (Q = 1000) sagt der Bestand 5, der
Vorschlag bei 0.4 km/Feld 35, die Labor-Leiter 5. `korridorFelder` und
`durchmesser` weichen im Mittelfeld ab (Q = 5: 2 statt 1 · Q = 70: 4 statt 5).
Das ist dieselbe Art Konflikt wie Befund 1 (zwei Klassensysteme) — **vor
einer Beförderung muss eine Rechnung kanonisch werden**, sonst erben Kit und
App den Widerspruch.

## Nicht übernommen

- `scheibeZellen()` (die Hex-Scheibe selbst) — der Baukasten kann das mit
  `SOT.hex.disc(c, r, n)`. Zwei Unterschiede, die ein Umbau bedenken muss:
  die Kit-Fassung gibt `{c, r}`-Objekte statt flacher Indizes `r*cols+c` und
  **beschneidet nicht** auf `cols`/`rows`. Ein Fundort — kein Extraktionsfall,
  eine Zeile Aufräumarbeit.
- Der Massstabsfaktor `skala = √(hexKm/W)` und `wLokal()` aus dem Renderer:
  sie mischen die Breite mit Zeichenkoordinaten und dem Übertreibungs-Grundsatz
  („je näher man herangeht, desto weniger muss die Karte übertreiben"). Das
  gehört zum Renderer, nicht hierher.
- `farbe()` — Tokens, also Optik.
- Die Saisonlogik (`0.8 · Sommerbreite` als Furt-Schwelle, Zeile 1567/1755):
  Spielregel.

## Offen

- **Kein Fundort ist umgestellt.** `bandBreite` steht weiterhin viermal da.
- Die neue Belegung ist **nirgends im Einsatz** — sie ist ein Vorschlag mit
  Test, kein Umbau. Ob der Seasons-Draft sie übernimmt, ist eine
  Design-Entscheidung: sie ändert das Kartenbild auf allen Ebenen ausser 2 km.
- Vor einer Beförderung nach `kit/`: dasselbe offene Thema wie bei
  [[dijkstra-budget]] — der Baukasten führt bewusst keine Fachrechnung.
  Hydraulische Geometrie ist noch weniger UI-Primitive als ein Wegefinder.
  `lib/` ist womöglich der Endzustand, und die App erbt es beim Port.
- Die Klassen-Abweichung (Befund 1) ist **nicht entschieden**: vier Dateien
  fahren die Laborgrenzen, eine die Kartengrenzen. Solange beide leben, ist
  „kleiner Fluss" kein eindeutiger Begriff im Projekt.
- **Die Klippe bei Q = 100** (dreifacher Sprung der Gürtelbreite). Ausweg wäre
  ein Ausblenden des Verzweigungsfaktors an den Fensterrändern statt eines
  Schalters — bewusst nicht gemacht, weil es das Verhalten des Bestands
  ändert. Zu entscheiden, bevor `breiteMitGefaelle` irgendwo läuft.
  **Zweite Fundstelle des Bedarfs:** `drafts/lauf-korridor-v1` (der zweite
  Verbraucher, trägt die API wörtlich) musste die harte Schaltung von
  `verzweigt()` selbst über ±2 Nachbarzeilen glätten, um die Nebenfäden
  weich ein- und auszublenden. Zwei Stellen, die dieselbe Ausblendung
  nachrüsten, sind das Signal, sie in die Bibliothek zu heben (etwa
  `verzweigtAnteil(q, j)` als stetige 0..1-Fassung neben dem Bool).
- **Ein Prüfstand steht:** `drafts/fluss-gefaelle-labor-v2.html` (v1 im
  Archiv) zeigt die Erweiterung an einem Längsprofil in Hexfeldern und macht
  jeden Regler live drehbar — samt `?fade` für die Klippe und `?nurAbfluss`
  als Gegenprobe. Er trägt eine **parametrisierte Kopie** dieser Formeln,
  weil ein Draft `lib/` nicht verlinken darf. Der erste Rückfluss ist
  passiert (Abschnitt oben); die Kopie im Draft steht weiterhin.
- **Befund 4 ist nicht entschieden:** drei Belegungsrechnungen nebeneinander
  (`durchmesser` · `radiusBeiRaster` · `korridorFelder`). Eine muss
  kanonisch werden, bevor irgendetwas hiervon in den Baukasten geht.
- **Die Gelände-Konstanten sind nicht geeicht.** Übernommen sind nur die
  Schwellen des Labors; die Exponenten und Deckel darauf (`0.25` im Hang,
  `0.5` im Gang, `0.8` in der Windung, die Deckel 0.45 / 1.6 / 0.7 / 2.6)
  sind plausibel gewählt, nicht gemessen. Sie geben die drei geforderten
  Verhaltensweisen in der richtigen Richtung und Grössenordnung wieder —
  mehr behaupten sie nicht. Ein Prüfstand am echten Längsprofil (die
  Höhendaten liegen in der Pipeline) wäre der nächste ehrliche Schritt.
- **Der Windungsgrad wird nirgends verzeichnet.** `sinuositaet()` liefert eine
  Zahl, aber kein Renderer krümmt danach einen Lauf. Bis das jemand
  einbaut, ist das Mäandern eine Behauptung.
