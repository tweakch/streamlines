# Gedanken zum Userinterface

## Die Frage

Plättchen, Karten und Personen sollen besser organisiert wirken. Der
Vorschlag: eine **Basisplatte** für den Spieler — ein HUD mit einem
Lager-Bereich (Material, Schutz, Nahrung, Kultur), einem Raster je Person
(Jäger, Sammlerin) für das, was sie tragen (Runen, Werkzeug, Material), und
Slots für Effekte.

Die Antwort ist in drei Teile zerfallen, weil die drei Ideen sehr
unterschiedlich weit vom heutigen Stand entfernt sind: **die Lager-Anzeige
ist ein Ein-Zeilen-Upgrade, das Effekt-Slot ist ein bereits entworfenes
Bauteil, das nur noch niemand gebaut hat, und das Traglast-Raster ist eine
Entscheidung, die auf eine andere Entscheidung wartet, die noch nicht
gefallen ist.** Alle drei laufen ausserdem in denselben Namen — „Lager" —
den die App schon zweimal vergeben hat.

## Der Prüfstein, gegen den jede Idee hier läuft

`notes/kernpfeiler.md` (P1) ist unmissverständlich: **„Das Brett ist die
Bedienung […] Keine Hand, keine Leiste, kein Menü im Spielfeld, keine
Aktionspunkte-Buchhaltung."** Eine Basisplatte ist per Definition eine
zweite, dauerhafte Fläche neben dem Brett — sie muss sich also nicht nur
gut anfühlen, sondern begründen, warum sie *keine* Leiste ist. Das ist der
Massstab für alles Folgende, nicht Geschmack.

## Was heute schon da ist

### Die Lager-Anzeige existiert — als Handarbeit, nicht als Baukasten-Primitive

`StromlinienGame.tsx:392-406` rendert vier `.chip`-Divs (Nahrung, Schutz,
Material, Kultur) mit einer **app-eigenen** `.chip`-Klasse aus
`stromlinien.css` — die App bindet den Prototyp-Baukasten (`kit/`) gar nicht
ein, sondern hat ihr eigenes, gleichnamiges Duplikat gebaut.

Der Baukasten hat dafür längst das richtige Bauteil, nur unter anderem
Namen: `.stat` (`sot.css:274-281`) — große Zahl, Beschriftung, optionales
`.delta`, das bei Änderung aufblitzt (`.flash`). Genau diese vier Werte,
genau in dieser Form, sind in `erkundung-v2.html:281-284` bereits als
`#chipN/S/B/K` gebaut. Die App hat das Rad also zweimal erfunden, einmal
schlechter.

**Ein echter, bisher unsichtbarer Fehler dabei:** der angezeigte Schutzwert
ist `effectiveSchutz(state)` — die +2 des Jägers auf dem Feld sind bereits
eingerechnet, der rohe `state.s` wird nirgends gezeigt. Steht der Jäger im
Tal, ändert sich die Zahl um 2, ohne dass die App sagt, warum. Das ist kein
Basisplatten-Problem, das ist ein Anzeige-Bug, der acht Zeilen kostet.

### Personen tragen heute nichts, sichtbar

`types.ts:52-55`: `PersonState = { cellIdx, moved }`. Das ist die gesamte
Person — kein Name, kein Icon, kein Zustand ausser Ort und „heute schon
bewegt". Icon und Name stehen hart im JSX (`StromlinienGame.tsx:440`).

`erkundung-v2.html` ist einen Schritt weiter (`basis`, `rest`, `schuhwerk`),
aber selbst dort ist **Schuhwerk — eine dauerhafte, verdiente Verbesserung —
nur angehängter Text** in einer Liste: `p.nm+' · Ausdauer '+p.rest+'/'+
ausdauerVon(p)+(p.schuhwerk?' · Schuhwerk':'')` (`:944`, `:1067`). Nirgends
in App oder Prototyp trägt eine Person etwas als **eigenes visuelles
Element** — kein Icon-Slot, keine Marke, kein Badge. Das ist die Lücke, die
die „Traglast"-Idee eigentlich schliessen will, und sie ist real.

### Das einzige „Slot"-System, das existiert, gehört dem Feld, nicht der Person

`sot-hex.css:137-188` definiert genau sechs feste Positionen — Kern, Krone,
Wange, Ferse, Fuss, Zahl, Kanten — aber **auf einem Hexfeld**, nicht auf
einem Menschen. Die Handbuch-Karte dazu begründet das explizit: *„das Feld
zeigt Identität, Dringlichkeit und Ertrag — der Explorer trägt den Rest."*
Ein zweites Slot-System mit denselben Namen, diesmal auf der Person, würde
sofort mit diesem verwechselt. Wer eine Traglast-Anzeige baut, braucht ein
eigenes Wort — dazu unten mehr.

### Das Effekt-Slot ist keine neue Idee — es liegt fertig entworfen im Ordner

`prototype/drafts/spielfeld-entlastung-v1.html:143-149` baut bereits ein
einklappbares **„⛺ Das Lager"**-Panel zwischen den Ressourcen-Chips und der
Karte: eine Liste aus Icon + fetter Titel + kleiner Zusatzzeile, je eine
Zeile pro aktivem Bonus (z. B. „Wiederbewaldung — Auenwald: +2 statt +1
Material/Tag"), auf- und zuklappbar, per `?lager` auch ohne Klick erreichbar.
Sein `::: why` begründet genau das, was P1 verlangt: *„additive HUD-Elemente
ohne Eingriff in Spielregeln oder Datenmodell — geringstes Risiko,
sichtbarster Effekt."* Status im Handbuch: `idea`, nie gebaut.

Das ist deshalb wichtig, weil die App heute **echte, unsichtbare
Dauerzustände** trägt: `woodBoost`, `pfahlUnlocked`, `extraDraw`,
`fishBlocked` (`engine.ts`) — vier Booleans, die das Spiel verändern und die
kein Pixel je zeigt. Ein Spieler mit `woodBoost` sieht nirgends, dass sein
Wald mehr gibt. **Das ist die schärfste der drei Lücken, weil sie schon
heute, ohne jede neue Mechanik, einen Effekt betrifft, der wirklich existiert
— und die Lösung liegt bereits fertig entworfen da.**

### Ausrüstung ist eine Idee, keine Mechanik — und ihre Form ist noch offen

Der Dreistapel-Gedanke (Mensch · Ausrüstung · Land) und der Wirkungspunkt ◆
stehen im Handbuch (`02-kernmechaniken.md`) und in
`notes/gedanken-zum-spielablauf.md:133-137`. Status: `concept`/`idea`,
nichts gebaut — `types.ts` kennt kein Ausrüstungsfeld.

Wichtiger als der Status ist die **Formensprache**-Karte (`concept`,
`02-kernmechaniken.md:59-77`): in diesem Spiel trägt die *Form* bereits
Bedeutung — Sechseck geht aufs Brett, rechteckige Karte feuert einmal und
ist verbraucht, Knopf ist eine nackte Wahl ohne Karte. **Für „Ausrüstung, die
ein Mensch dauerhaft trägt" ist noch keine vierte Form entschieden.** Die
Wünschelrute-Karte (`idea`, `04-die-datenschicht.md:50-56`) hält genau diese
Frage offen: *„ob der Wirkungspunkt der richtige Ort ist, an dem das
Erlöschen sichtbar wird."*

Und `notes/kernpfeiler.md` (Schichten) sortiert Ausrüstung explizit in
**Schicht 3, „Nervensystem"** — nach dem Vier-Phasen-Tag und der Sammlerin,
nicht davor.

## Die drei Ideen, einzeln beurteilt

### a) Lager-Anzeige — bauen, aber als Ersatz, nicht als Zusatz

Das ist kein Basisplatten-Thema, das ist ein Migrationsschritt: die vier
`.chip`-Divs durch `.stat` aus dem Baukasten ersetzen (Delta-Blitz bei
Änderung ist bereits mitgeliefert, kein neuer Code), und `effectiveSchutz`
so anzeigen, dass die Jäger-Boni sichtbar bleiben (z. B. „5 ⟵ 3 +2" oder ein
kleines Feld-Symbol neben der Zahl, solange der Jäger im Tal steht). Kein
neuer Bildschirmbereich, keine neue Entscheidung für den Spieler — reine
Schärfung von etwas, das schon da ist. Passt zu P1, weil sich nichts an der
Interaktion ändert.

### b) Effekt-Slots — bauen, indem die vorhandene Idee fertiggestellt wird

Das Lager-Sammelpanel aus `spielfeld-entlastung-v1` von `idea` zu
`concept`/gebaut heben, statt eine neue Lösung zu entwerfen. Es sitzt schon
an der richtigen Stelle im Layout (zwischen Chips und Karte, einklappbar,
Standardzustand zu), löst schon das richtige Problem (unsichtbare
Boni/Mali), und sein `::: why` ist bereits die Begründung, die P1 verlangt.
Der einzige offene Punkt ist der Name — dazu gleich.

### c) Traglast-Raster pro Person — noch nicht, und ein Raster ist vermutlich die falsche Form

Drei Gründe, in aufsteigender Wichtigkeit:

1. **Die Mechanik, die es zeigen soll, existiert nicht.** Ausrüstung ist
   `idea`/`concept`, Schicht 3. Einen Container für Inhalte zu bauen, deren
   Form noch nicht entschieden ist (Formensprache-Karte, s. o.), heisst
   raten. Erst die Form der Ausrüstungskarte entscheiden, dann ihren Platz
   auf der Person.
2. **Ein Raster ist eine Inventar-Metapher, und P1 warnt genau davor.** Ein
   Raster mit mehreren Slots lädt zu Anordnen, Vergleichen, Ziehen ein —
   genau die „Aktionspunkte-Buchhaltung", die das Spiel bewusst nicht sein
   will. Ein Wirkungspunkt ◆ „verschwindet nach Gebrauch und kommt morgen
   wieder" — das ist eine Mechanik, die sich *selbst* begrenzt, ohne dass
   der Spieler etwas verwaltet. Eine Rasterfläche verwaltet.
3. **Der Realraum ist bereits da und ungenutzt.** `.peoplebar` zeigt heute
   Icon, Name und einen Satz Status je Person (`StromlinienGame.tsx:429-452`).
   Schuhwerk steht dort schon als Text — es fehlt nur ein Symbol statt des
   Wortes. Das ist der naheliegende erste Schritt: **ein bis zwei kleine
   Icon-Marken direkt am Personen-Knopf**, keine eigene Fläche, keine neue
   Interaktion. Wenn Ausrüstung später wirklich mehrere gleichzeitig
   getragene Dinge erlaubt, wird daraus vielleicht eine Reihe von zwei bis
   drei Marken — aber das ist ein Anbau am Bestehenden, kein neues Bauteil,
   und erst nötig, wenn die Zahl der getragenen Dinge das rechtfertigt.

**Wenn** eine eigene Fläche je Person doch kommt, dann nicht „Slots" heissen
— das Wort ist an Kern/Krone/Wange/Ferse/Fuss/Zahl auf dem Feld vergeben,
und eine zweite Bedeutung würde beide Systeme verwischen. Ein eigenes Wort
(„Traglast" ist im obigen Text als Arbeitsbegriff benutzt) hält die beiden
sauber getrennt.

## Die Namenskollision „Lager"

„Lager" ist im Spiel bereits doppelt vergeben: das ☰-Menü heisst „Das
Lager" (reine Sitzungsnavigation: Fortsetzen · Regeln · Epochen · Aufgeben,
`StromlinienGame.tsx:626-686`, zeigt nirgends Ressourcen oder Effekte), und
das gelegte Plättchen `ufer` heisst „Lager am Ufer" (`data.ts:42-48`). Ein
drittes UI-Element mit demselben Namen — das Effekt-/Ressourcenpanel —
würde in Gesprächen wie diesem hier ständig Rückfragen erzeugen: welches
Lager?

Der einfachste Ausweg braucht kein neues Wort: `notes/kernpfeiler.md`
benutzt in der Schleifenkarte bereits **„Bestand"** für genau das, was das
Panel zeigen soll (*„Ertrag → Bestand (Vorrat, Zeichen, Kultur) → Nacht"*).
Das Panel hiesse also **„Bestand"**, das ☰-Menü bleibt „Das Lager", das
Plättchen bleibt „Lager am Ufer" — drei Wörter, drei Dinge, keine
Verwechslung, und keines davon musste neu erfunden werden.

## Bildschirmfläche: passt es hinein, ohne etwas zu verdrängen?

Mobil stapeln sich heute Header, Rundenleiste, Ressourcen-Chips,
Sesshaftigkeits-Balken und `.peoplebar` über der Karte, mit der Hand fest am
unteren Rand (`stromlinien.css:52-56`). Ein einklappbares Bestand-Panel
reiht sich genau dort ein, wo `spielfeld-entlastung-v1` es schon vorsieht —
zugeklappt nimmt es eine Zeile, aufgeklappt verdrängt es vorübergehend
Kartenraum, aber freiwillig. Am Desktop (≥900 px) liegt ohnehin eine feste
400-px-Spalte neben der Karte (`:1166-1206`) — dort ist Platz, ohne dass
irgendetwas enger wird. Das ist dieselbe Lösung, die der bereits
entschiedene Feld-Explorer für sich gewählt hat: **gleicher Zustand,
unterschiedliche Dichte je Bildschirmgrösse**, keine eigene dritte
Darstellung nötig.

Eine Basisplatte im vollen Sinn — ein permanent sichtbarer, grosser eigener
Bereich für Lager und Traglast gemeinsam — würde auf dem Telefon mit der
Karte um Höhe konkurrieren, die heute schon knapp ist (Hand fest am unteren
Rand, `calc(168px + …)` fest reserviert). Der Ordner enthält keinen
Präzedenzfall für einen dauerhaften Bereich dieser Grösse; alles, was es
gibt, ist einklappbar. Das ist ein Hinweis, kein Beweis — aber ein Hinweis,
den man nicht ignorieren sollte, ohne ihn zu widerlegen.

## Antwort auf die eigentliche Frage

Eine Basisplatte im Sinn eines dauerhaften Ressourcen- und Statuspanels: ja,
mit einem anderen Namen, gebaut aus dem, was schon entworfen ist. Ein
Rasterinventar je Person: noch nicht — erst muss die Formensprache
entscheiden, wie Ausrüstung überhaupt aussieht, und dann reicht am Anfang
vermutlich ein Symbol am bestehenden Personen-Knopf statt einer neuen
Fläche. Slots für Effekte: die Idee ist fertig, sie muss nur noch gebaut
werden.

## Offene Entscheidungen

1. **„Bestand" als Name** für das Effekt-/Ressourcenpanel — oder ein anderes
   Wort, das nicht mit „Lager" (Menü) und „Lager am Ufer" (Plättchen)
   kollidiert.
2. **`.chip` → `.stat`**: reiner Austausch, oder gleich mit sichtbarer
   Jäger-Schutz-Aufschlüsselung (die heute unsichtbare +2)?
3. **Formensprache für Ausrüstung** zuerst entscheiden (Kap. 2) — welche
   vierte Form (neben Sechseck/Karte/Knopf) trägt ein Mensch dauerhaft?
   Erst danach die Frage, wie sie am Menschen sichtbar wird.
4. **Wie viele Dinge trägt eine Person gleichzeitig?** Solange die Antwort
   „eins, vielleicht zwei" ist, reicht ein Symbol am Personen-Knopf; erst ab
   drei oder mehr lohnt sich eine eigene Fläche.
5. **Lager-Sammelpanel von `idea` auf Bauliste heben** — passt in Schicht
   1–2 (Skelett/Fleisch) und braucht keine der Schicht-3-Mechaniken
   (Ausrüstung, Ereignis-Dramaturgie), auf die es in `kernpfeiler.md`
   eigentlich wartet.

## Nachtrag: die rechte Spalte in `erkundung-v3`

Vorschlag aus dem Spieltest von v3: die vier `.stat`-Chips, die `.pbtn`s der
Personen, die Hand samt `btnPhase` und die Phasenfläche wandern gemeinsam in
einen Behälter am rechten Rand. **Das ist die konkrete Form dessen, was oben
unter „Bildschirmfläche" schon empfohlen war** — und die App macht es ab
900 px mit der Hand bereits vor (`stromlinien.css:1166-1206`); v3 hing hier
hinter der App zurück.

Was der Umzug zusätzlich gewinnt: **Frage und Antwort kommen zusammen.** Die
Phasenfläche stellt die Frage der Phase, `btnPhase` beantwortet sie — heute
liegen beide an entgegengesetzten Bildschirmrändern.

Drei Fussnoten zur Umsetzung:

1. **Desktop-only.** `.seite` ist unter 900 px `display:none`; mobil bleibt
   der Stapel + die feste Hand (Daumen-Ergonomie) die richtige Form. Der
   Doppel-Schreib-Shim von `renderPhase` (`:1340`, schreibt in `#phasenpane`
   *und* `#phasenpaneM`) skaliert nicht auf fünf weitere Elemente — besser
   **ein DOM-Knoten, zwei Parkplätze**: `matchMedia('(min-width:900px)')`
   hängt denselben Knoten in Spalte oder Fluss um.
2. **Hand und Phasenknopf sind Übergangsmieter.** Der Kernloop
   (`gedanken-zum-spielablauf.md`) schafft beide ab: Karten kommen per
   Kartenpunkt ○ aufs Brett, der Tag endet am Nachtpunkt ☾. Einquartieren ja,
   darum herum bauen nein. Dauerbewohner der Spalte sind die Referenz-Anzeigen
   (Stats, Sesshaftigkeit, Personen, später das Bestand-Panel).
3. **Die Spalte liest, das Brett handelt.** Sie besteht P1, weil sie
   nicht-diegetischer Anzeigeraum ist (Feld-Explorer-Register: „ein Werkzeug,
   das erklärt und rechnet, kein Ort der Welt"). Wachlinie: keine neuen
   Aktionen in der Spalte ansammeln — jede neue Handlung gehört als Punkt aufs
   Brett.

`.prog` (Sesshaftigkeit) zieht mit den Stats mit — allein im oberen Fluss
wäre er gestrandet. Ordnung in der Spalte, oben nach unten: Phasenfläche +
`btnPhase` (*was jetzt?*) → Hand (*womit?*) → Stats/Prog/Personen
(*stehender Zustand*).

## Nachtrag 2: gebaut in `erkundung-v4` — und der Weg in die App

Die rechte Spalte ist gebaut (`erkundung-v4.html`, v3 archiviert). Ordnung wie
entschieden: Phasenfläche + Phasenknopf → Hand → Stats/Sesshaftigkeit/Menschen
→ Inspektor. Der `heimat()`-Umzug (ein Knoten, zwei Parkplätze, `matchMedia
901px`) ersetzt den Doppel-Schreib-Shim; mobil ist v4 pixelgleich zu v3 —
belegt per Screenshot-Vergleich. Der schönste Beleg ist der Abend: Erntebuch,
Verarbeitungen und „Nacht anbrechen lassen" stehen jetzt untereinander in
einer Leserichtung.

### Was die App davon heute schon übernehmen kann (vor der Hochzeit)

Die App hat die Spalte längst (`stromlinien.css:1166`: Grid `1fr | 400px`,
Hand wird dort `static`) — ihr fehlen nur **Ordnung und Mieter**. Der Port ist
darum ein reines Umsortieren plus ein Klassentausch, kein Engine-Eingriff:

1. **Ordnung der Spalte** wie v4: Phasen-/Morgenbereich (heute `.morgen` +
   Ereignisfenster) zuoberst, direkt darunter der primäre Phasenknopf („Nacht
   anbrechen lassen"), dann Hand, dann `.res`/`.prog`/`.peoplebar`, Inspektor
   zuletzt.
2. **`.chip` → `.stat`** (offene Entscheidung 2 dieses Dokuments) — die App
   spricht damit erstmals das Vokabular des Baukastens; der Delta-Blitz kommt
   gratis mit.
3. **Kein `heimat()` nötig**: in React ist der Umzug deklarativ — ein
   `matchMedia`-Hook (oder CSS `grid-template-areas`) rendert dieselben
   Komponenten in Spalte oder Fluss. Die Spielzustände liegen im Reducer,
   nicht im DOM; ein Remount beim Breakpoint-Wechsel ist folgenlos.

### Was die Hochzeit wirklich braucht (und hier bewusst NICHT passiert)

Die Spalte ist Layout; die Ehe ist Engine. `engine.ts` kennt zwei Phasen
(`day`/`night`), v4 spielt vier; es fehlen Ausdauer-Bewegung, Nebel,
Erntebuch, Effektkarten, Wasser als Band. Das ist exakt **Schicht 1 aus
`kernpfeiler.md`** (Vier-Phasen-Tag, Punkt-Interaktion) — der Spaltenport
darf ihr vorausgehen, weil er additiv ist, aber er ersetzt sie nicht. Die
richtige Reihenfolge bleibt: Spalte jetzt (billig, sichtbar), Vier-Phasen-Tag
als nächster Engine-Schritt, und erst dann trägt die Spalte auch in der App
das, wofür sie gebaut wurde — den Abend.

## Nachtrag 3: die Uhr, die vier Namen und das ruhige Layout

Drei Nachbesserungen an `erkundung-v4`, alle aus dem Spieltest.

**Die Uhr ist ein Instrument geworden.** Kopfzeile (Jahr + Phasenwort) und
Zeitleiste standen an zwei Orten und sagten zusammen weniger, als sie
gekostet haben. Jetzt: EIN Block zuoberst in der Seite mit dem Runden-Balken
oben und den vier Tageszeiten-Zeichen darunter. Das Jahr wanderte nach einem
Spieltest **zurück in den Kopf** (dort sass es besser): der Kopf trägt das
Langsame (Marke, Jahr), die Uhr das Schnelle (Runde, Tageszeit).

**„vor 12 000 Jahren" statt „10 000 v. Chr."** — ein Mensch der Epoche zählt
nicht rückwärts auf eine Zahl zu, die es noch nicht gibt; „v. Chr." ist die
Perspektive eines späteren Buchhalters. Die neue Zahl misst vom Spieler aus
und *schrumpft* über die Kampagne: die Gegenwart kommt näher.

**Die Zeitleiste verliert ihre Ziffern**, behält aber die Ankermarke ◆. Die
Regel dahinter taugt über diesen Fall hinaus: *weg mit dem, was der Balken
ohnehin zeigt (wie weit) — bleiben muss, was er nicht zeigt (dass dort etwas
Belegtes wartet).*

**Vier Namen: Morgen · Mittag · Abend · Nacht.** „Dämmerung/Tag" mischte eine
Tageszeit mit einem ganzen Tag, war unsymmetrisch und liess sich nicht als
Zeichenreihe zeichnen. Die inneren Schlüssel bleiben `daemmerung/tag/…`
(Zustand, Speicher, Debug); `?phase=` nimmt beide Schreibweisen. Handbuch
Kap. 2 und `kernpfeiler.md` sind nachgezogen.

### Ruhe ist eine Anordnung, keine Animation

Der eigentliche Befund. Erscheinende Bedienelemente („zurücklegen" beim
Wählen einer Karte) schoben Werte und Menschen nach unten — nicht weil sie
falsch gestaltet waren, sondern weil sie **über** ihnen standen. Die Antwort
ist die Reihenfolge, nicht ein sanfter Übergang:

> **Fester Block oben, Wachsendes darunter.** Uhr · Werte · Sesshaftigkeit ·
> Menschen ändern nie ihre Höhe; Phasenfläche, Antwortknopf, Hand und
> Inspektor stehen darunter und dürfen wachsen.

Dazu zwei Handgriffe: „zurücklegen" wird **unsichtbar geschaltet statt
ausgeblendet** (es behält seinen Platz), und die Hand hält ihre Zeile
(`--cardw:76px`, damit vier Karten nebeneinander passen; der Hinweis bekommt
immer eine eigene Zeile). Gemessen am Bildvergleich: zwischen „Karte gewählt"
und „nicht gewählt" verschiebt sich in der Seite **nichts** — Werte,
Sesshaftigkeit und Phasenfläche sind pixelgleich, der beste Zeilenversatz ist
überall 0.

**Ein echter Fehler kam dabei ans Licht:** `.seite` ist eine Flex-Spalte mit
Höhenschranke — ohne `flex:none` schrumpfen die Kinder, statt zu scrollen.
Die Verarbeitungsliste des Abends war unten abgeschnitten. Das ist die Art
Fehler, die man nur im längsten Zustand sieht; ein Grund mehr, jede Phase per
`?phase=` einzeln aufrufen zu können.

**Für den Port in die App** kommt damit eine Regel dazu, die dort noch nicht
gilt: die App stapelt heute Kopf, Rundenleiste, Werte, Sesshaftigkeit und
Menschen über der Karte und schiebt bei jedem Zustandswechsel. Die Ordnung
„fester Block oben" ist Layout, kein Spielinhalt — sie kann mit dem
Spaltenport zusammen kommen, vor jedem Engine-Schritt.

## Nachtrag 4: die Werte-Pane

Nahrung · Schutz · Material · Kultur tragen jetzt **eigene Zeichen**
(Beerenzweig · Palisade · Reisigbündel · Spirale, dieselbe Strichsprache wie
die Plättchen-Glyphen) und wohnen mit der Sesshaftigkeit in **einem Rahmen
fester Höhe**. Jede Kachel reserviert unter der Zahl eine **Marken-Zeile**:
Wirkung (Vorrat ×2, später die Boni/Mali der Nacht-Waage) erscheint in ihr,
statt die Kachel zu dehnen — Platz für Effekte wird geplant, bevor es sie
gibt. Dieselbe Regel wie beim „zurücklegen"-Knopf: Platz statt Sprung.

Parallel dazu (eigene Arbeit im selben Draft): Personen und Kartenmarken
sprechen jetzt eine SVG-Zeichensprache (`data-ico`) statt Unicode-Glyphen —
die Werte-Zeichen fügen sich in diese Reihe ein.

## Nachtrag 5: die Seite bekommt eine Anatomie und einen Commit (erkundung-v5)

Der Befund aus dem Spielen von v4: die Seite ist immer noch nicht ruhig —
Flächen **erscheinen** (Inspektor beim Feldtippen, „zurücklegen" beim
Kartenwählen) und **verschwinden** (die gelegte Karte aus der Hand). Die
Nachbesserungen von v4 haben Sprünge *innerhalb* der Panes beseitigt; jetzt
geht es um die Panes selbst. Vier Entscheidungen:

### 1. Skelett statt Auftritt

**Jede Pane der Seite ist immer da.** Leer heisst nicht weg, leer heisst
Skelett: gepunktete Kontur, stiller Platzhalter.

- Der **Inspektor** zeigt ohne Auswahl ein Skelett („kein Feld gewählt")
  statt zu fehlen.
- Die **Hand** hat vier feste Plätze. Eine gelegte Karte hinterlässt ihren
  Platz als gepunktete Silhouette — man sieht, *dass* man gelegt hat und
  *wie viel* Hand übrig ist, ohne zu zählen.
- Die **Phasenfläche** hielt ihre Höhe schon (v2-Regel); neu gilt das
  überall.

Damit wird aus „Platz statt Sprung" (Nachtrag 3/4, Element-Ebene) ein
Gesetz auf Pane-Ebene: **die Seite hat eine feste Anatomie; Zustände füllen
sie, sie bauen sie nicht um.** Der Spieler lernt EINE Geografie — wo etwas
steht, steht es immer.

### 2. Personen zeigen Werte: Ausdauer · Gesundheit · Angriff · Verteidigung

Der Personen-Knopf wird eine kleine Wertekarte: unter Zeichen und Name vier
Mini-Werte. Zwei sind geerdet, zwei sind Gerüst:

| Wert | Zeichen | Stand |
| --- | --- | --- |
| Ausdauer | lauf | existiert (basis + Schuhwerk + Bonus) |
| Verteidigung | schutz | existiert versteckt: die +2 des Jägers im effektiven Schutz — endlich sichtbar an der Person statt eingerechnet in der Zahl |
| Gesundheit | herz (neu) | **neues Konzept**, nur Anzeige — der Haken für die Risikoleiter („draussen bleiben": die Nachtkarte trifft die Person) |
| Angriff | bogen | **neues Konzept**, nur Anzeige — der Haken für die Jagd (heute pauschales Jagdglück) |

Gesundheit und Angriff sind bewusst **Anzeige ohne Mechanik** — dieselbe
Denkweise wie die Marken-Zeile der Werte: Platz für etwas schaffen, bevor
es existiert. Die Mechanik dazu ist im Spielablauf-Notizbuch schon
skizziert (Risikoleiter, oberste Sprosse) und im Handbuch als Idee zu
führen. Wachlinie aus kernpfeiler.md: **kein Survival-Horror** — Gesundheit
misst Erschöpfung/Verletzung, nicht ein Leben, das auf null läuft; scheitern
heisst weiterhin „Der Stamm zieht weiter".

### 3. Die Phasenfläche wird eine Kartenfläche

Die Prosa fliegt raus. Die Phasenfläche zeigt: Kopfzeile (Phase · Runde),
die Frage der Phase, und **Karten** — Effektkarten am Morgen, das Erntebuch
(Daten, keine Prosa) und die Verarbeitungen als Karten am Abend. Erklärtext
gehört ins Intro und in die Feldsprache, nicht in den täglichen Loop: wer
Runde 6 spielt, hat die Anleitung von Runde 1 gelesen.

### 4. Vorschau am Ziel, nicht am Auslöser

Wer über einer Effektkarte schwebt (oder sie vorgemerkt hat), sieht die
Wirkung **dort, wo sie eintreten wird**: „−1" klein neben der Nahrung in der
Werte-Pane, „+1" klein an der Ausdauer jeder betroffenen Person. Die
Marken-Zeile und die Mini-Werte sind genau die dafür reservierten Plätze.
Das ist die UI-Hälfte der Punktregel „ein Punkt sagt seinen Preis, bevor man
ihn antippt" — der Preis steht nicht auf der Karte allein, er steht an den
Konten, die er trifft. Debug: `?vorschau=<id>` zeigt die Vorschau ohne Maus
(ein Screenshot kann nicht schweben).

### 5. Der Phasenknopf ist ein Commit

Die wichtigste Entscheidung, weil sie eine Semantik festlegt:

> **Brett = Welt, sofort und endgültig. Seite = Plan, offen bis zum
> Commit.** Plättchen legen und Menschen bewegen geschehen auf dem Brett
> und sind nicht rücknehmbar. Alles, was in der Seite gewählt wird
> (Vorbereitung am Morgen, Verarbeitung am Abend), ist bis zum Druck auf
> den Phasenknopf eine **Vormerkung**: wieder antippen wählt ab, eine
> andere antippen wechselt. Erst der Knopf bucht.

Das ersetzt das bisherige Sofort-Ausführen (`tun()` beim Klick) durch
Vormerken + Buchen beim Phasenwechsel. Es beantwortet auch einen Teil der
offenen Undo-Frage aus dem Spielablauf-Notizbuch („Undo-Fenster = Tag"):
**innerhalb der Seite ist Undo trivial (nichts ist gebucht), auf dem Brett
gibt es keins** — die Grenze ist die Fläche, nicht die Zeit. Ob das Brett
je ein Undo bekommt, bleibt offen; die Seite braucht jetzt keins mehr.

Konsequenz für die App-Ehe: der Reducer bekommt zwei Klassen von Actions —
Brett-Actions (sofort, autosave) und Seiten-Vormerkungen (Teil des
UI-Zustands, erst der Phasen-Commit erzeugt die Engine-Action). Das passt
zur bestehenden Architektur: heute ist jede Aktion sofort eine
Engine-Action; die Vormerkungen sind reiner UI-State und berühren
`engine.ts` nicht.

Dazu: die **Werte-Pane wird kompakter** (Zeichen und Zahl nebeneinander
statt untereinander, Name fällt weg — das Zeichen trägt die Identität, der
Titel bleibt als Tooltip), denn die Personen-Wertekarten brauchen die Höhe.

## Nachtrag 6: ein Kartensystem (erkundung-v6)

Die Beobachtung aus dem Spielen von v5: Morgen-Effektkarten und
Abend-Verarbeitungen sind **dieselbe Transaktion** — Ressourcen zahlen,
Wirkung erhalten — nur die Dauer unterscheidet sie (heute vs. für immer).
Zwei UI-Systeme für eine Sache; die Abend-Knöpfe verletzten obendrein die
Formensprache (Wahl mit Preis und Lohn = Karte, nicht Knopf).

Die Auflösung ist ein Kreis: **der Abend stellt her, was der Morgen
spielt.**

- **Eine Kartenfläche.** Die Hand trägt beide Formen in denselben vier
  Plätzen: Sechsecke (Land) spielen am Mittag, Rechteckkarten (Vorrat) am
  Morgen. Die Formensprache unterscheidet sie, die Phase dämpft die gerade
  unspielbare Form. Die Phasenfläche schrumpft auf Frage + Wahlen.
- **Die Werkbank.** Die Verarbeitungen sind Karten, die Dinge herstellen:
  Trockenfleisch → eine Vorrat-Karte **in die Hand**, Schuhwerk → an die
  Person, Werkzeug → an den Schutz-Wert, Schnitzwerk → in die Welt (+1
  Kultur). Eine Sache je Abend — die Knappheit der Belohnungsschleife
  bleibt.
- **Die Vorrat-Karte hat zwei Leben:** gespielt Wegzehrung (+1 Ausdauer
  alle), ungespielt fängt sie eine Hungernacht. Beides verbraucht sie.
  Die freien Morgen-Effektkarten sind weg — wer Wegzehrung will, hat sie
  am Abend zuvor gemacht. Damit wird „Gutes Laufen kauft besseres Laufen"
  ein Objekt, das durch die Hand wandert, statt einer Abstraktion.
- **Die Hand ist die Traglast.** Trockenfleisch braucht einen freien
  Platz; wer Vorräte hortet, zieht weniger Plättchen. Die offene Frage 4
  dieses Dokuments („wie viele Dinge trägt eine Person?") beantwortet die
  Hand selbst — ohne Raster, ohne Inventarverwaltung.
- **Späher und Rasttag sind Knöpfe.** Sie sind Entschlüsse, keine
  Objekte — die Formensprache hatte recht, sie waren als Karten falsch
  angezogen.

Nebenbei gelöst: die offene Handbuch-Frage „Effektkarten aus eigenem
Stapel ziehen (dann wären sie knapp)?" — **Knappheit kommt aus der
Produktion, nicht aus einem Deck.** Man hat genau die Karten, die man
gemacht hat.

Zwei Wachlinien: die Werkbank darf keine Fabrik werden (eine Sache je
Abend ist das Rückgrat der Abend-Entscheidung), und Schnitzwerk will
langfristig **aufs Brett** (ein Zeichen auf einem Feld → künftige
Fundstelle, „Trophäen heissen hier Funde") — in v6 bewusst noch direkte
Kultur-Umwandlung.

## Nachtrag 7: drei Spalten, und der Akzent trägt den Typ

Zwei Spieltest-Befunde an v6.

### Links liest, rechts greift

Auf breiten Bildschirmen lag Totraum links und rechts (`.wrap` war auf
1100 px gedeckelt), und trotzdem scrollte die Seite — die eine Spalte war
zu voll für einen Bildschirm. Ab 1280 px teilt sie sich jetzt um das Brett:

> **Der Entscheider ist die Berührung.** Was man nur liest, steht links
> (Uhr, Werte, Inspektor); was man antippt, rechts (Menschen, Karten,
> Wahlen, Commit). Das Brett dazwischen bekommt die Breite, die vorher
> Totraum war.

Damit passt die ganze Partie auf einen Bildschirm. Drei Brüche insgesamt:
Telefon (Stapel + feste Hand) · eine Spalte (901–1279) · zwei Spalten
(ab 1280). `heimat()` trägt jetzt drei Parkordnungen; die Regel „fester
Block oben, Wachsendes darunter" gilt in jeder Spalte für sich.

**Zum zweiten Mal dieselbe CSS-Falle:** eine Regel im Media-Block verliert
gegen eine SPÄTER notierte Basisregel gleicher Spezifität (erst
`.peoplebar`, jetzt `.spielraum` — die Dreispalten-Vorgabe wurde still von
der Zweispalten-Basis überstimmt, während `.wrap{max-width}` aus demselben
Block galt: halb kaputte Layouts dieser Art riechen nach genau diesem
Fehler). Merksatz für den Baukasten: **Media-Blöcke stehen NACH den
Basisregeln, die sie übersteuern.**

### Alles mit Preis und Wirkung ist eine Karte

Nachtrag 6 hatte Späher und Rasttag zu Knöpfen zurückgestuft („Entschlüsse,
keine Objekte") — der Spieltest hat das verworfen: **Einheitlichkeit der
Wahl schlägt Objekt-Reinheit.** Der Spieler soll eine Sorte Ding lernen,
nicht zwei. Alle Wahlen mit Preis und Wirkung sind Karten; was den Typ
unterscheidet, ist ein **Tageszeit-Akzent**:

| Typ | Oberkante | Zeichen in der Art-Zeile |
| --- | --- | --- |
| Morgen-Karte (spielen) | warm, `--ember` | Sonnenaufgang |
| Abend-Karte (herstellen) | kühl, `--riverdeep` | Sonnenuntergang |

Die Vorrat-Karte in der Hand trägt den Morgen-Akzent — man sieht ihr an,
wann sie lebt, ohne zu lesen. Die Formensprache-Karte im Handbuch ist
präzisiert: Knopf bleibt für Wahlen ohne Preis (schließen, ansehen,
Phasen-Commit); sobald etwas kostet und wirkt, ist es eine Karte.

## Nachtrag 8: Tageszeit-Grundtöne im Baukasten

Drei Tageslichter + die Nacht apart, definiert im Art-Direction-Handbuch
(Kap. 03): **Morgenrot** (Rosé) · **Hohes Licht** (Sonnengold) · **Stilles
Wasser** (Teal) — und **Mondlicht** (Blauviolett) als Akzent *innerhalb* des
Nacht-Registers, das ohnehin die ganze Palette wechselt. Je Ton Tag- und
Nachtwert und Schrift-auf-Ton. Erste Fassung führte den Morgen als
Ember-Orange („Morgenglut") — im Spieltest zu nah am Mittagsgold; die
Tageslichter spannen jetzt den Farbkreis (Rosé → Gold → Teal), damit sie
NEBENEINANDER unterscheidbar sind, nicht nur je für sich stimmig.

Die tragende Entscheidung sind **zwei Ebenen**: der *feste* Ton einer Karte
sagt, wann sie lebt (Oberkante + Art-Zeile, `.z-*` + `.zeitrand`); der
*laufende* Ton sagt, wie spät es ist (`SOT.zeit('…')` → `body[data-zeit]`
→ `--zeit`). Fielen sie zusammen, löge am Abend entweder die Karte oder die
Uhr. Getrennt trägt der Vergleich Information: leuchtet eine Karte im
laufenden Ton, ist jetzt ihr Moment.

**Kit-Einbau additiv:** Prototypen, die `SOT.zeit()` nie rufen, ändern sich
um kein Pixel (kein `data-zeit`, kein Griff). Sobald einer es ruft, nehmen
`.primary` und `.tl-seg.now` automatisch den laufenden Ton — der
Phasenknopf von `erkundung-v6` bekam seinen Abend-Teal ohne eine Zeile
eigenes CSS. Die automatischen Griffe stehen am **Dateiende** von `sot.css`
(Merksatz aus Nachtrag 7: Zustandsgriffe nach den Basisregeln).

Belegt in `tageszeit-akzente-v1` (Prüfstand) und `erkundung-v6` (Spiel) —
zwei Fundstellen, womit die Karten-Anatomie (Art-Zeile · Name · Wirkung ·
Preis, Akzent-Oberkante) offiziell Baukasten-Kandidat ist. Offen:
`kit-demo.html` nachziehen.

## Nachtrag 9: die Bühne — die Karte hört auf, ein Kasten zu sein

Letzter Schritt der v6-Reihe. Die Karte lag als Spalte ZWISCHEN den Panes;
jetzt liegt sie als fixe Vollbild-Fläche HINTER ihnen (ab 901px; mobil
bleibt der Fluss). Vier Bausteine:

1. **Der endlose Schleier.** Ein Hex-Muster in ECHTER Zellgeometrie setzt
   das Raster über den Weltrand hinaus fort — zur Laufzeit aus den
   gemessenen Zellmassen gebaut (Breite, Reihenschritt, Versatz), nicht aus
   den CSS-Vorgaben, darum sitzt es deckungsgleich; es folgt dem
   Tag/Nacht-Register, weil Farben beim Bau aus den Tokens gelesen und bei
   Registerwechsel neu gebaut werden. Die Welt hat 9×12 Felder, aber kein
   sichtbares Ende.
2. **Schwebende Panes.** `.wrap` lässt den Zeiger durch
   (`pointer-events:none`), nur Panes und Kopf fangen ihn. Die leere
   `.brett`-Spalte bleibt im Grid — als **Mess-Ziel**: ihr Rechteck IST
   „zwischen den Panes". (Falle dabei: eine leere Grid-Spalte hat Breite,
   aber KEINE Höhe — die Höhe fürs Einpassen muss vom Viewport kommen,
   sonst zentriert man auf einen Strich.)
3. **Ziehen und Zoomen.** Drag verschiebt die Welt (Schwelle 6px, danach
   schluckt ein Capture-Click-Guard den Loslass-Klick, damit kein Feld
   ausgelöst wird); das Rad zoomt ZUM CURSOR — der Weltpunkt unter der Maus
   bleibt liegen (t' = p − (p − t)·k'/k). Beides auch ins Unbesuchte.
4. **⌖ zentrieren.** Bounding-Box aller entdeckten Felder (über die echten
   Zell-Rechtecke, nicht über Indizes) + 2 Felder Rand, eingepasst zwischen
   die Panes, Zoom gedeckelt. Läuft beim Start und auf Knopfdruck — nie
   ungefragt während des Spielens: die Kamera gehört dem Spieler.

Damit ist das Brett zum ersten Mal grösser als sein Fenster — die
Voraussetzung für alles, was die Notizen über wachsende Karten sagen
(Kartenwachstum, Epochen, 217-Felder-Tal): das UI skaliert jetzt über die
9×12-Welt hinaus, ohne dass eine Pane sich bewegen müsste.

### Nachtrag 9a: die pointer-events-Erbfalle

Der Bühnen-Umbau war einen Abend lang komplett tot — kein Legen, kein Zug,
kein Zoom, und die Fehlermeldung („Dort kann das nicht stehen") kam aus dem
Fallback-Pfad. Ursache: **`pointer-events` erbt.** Die Bühne ist Kind von
`.wrap` (#game trägt die Klasse), `.wrap{pointer-events:none}` machte die
gesamte Karte untreffbar — `elementsFromPoint` auf einer leuchtenden Zelle
lieferte nur `[BODY, HTML]`. Jede Pane hatte ihr `auto` zurückbekommen, die
Bühne nicht.

Merksatz neben dem Media-Block-Satz aus Nachtrag 7: **wer einen Umschlag
durchlässig macht, muss JEDES fangende Kind einzeln zurückholen — und der
Beweis ist `elementsFromPoint`, nicht das Auge.** Der Fehler war in jedem
Screenshot unsichtbar; erst echte Klicks (Playwright gegen einen lokalen
Server, `file://` blockt der Treiber) haben ihn gezeigt. Seither gilt für
Interaktions-Umbauten: einmal echt klicken, zoomen, ziehen, legen —
Screenshots belegen Layout, nicht Treffbarkeit.

Nebenbefund: `file://` genügt weiterhin zum Spielen der Drafts — der
„Unsafe attempt to load URL"-Konsoleneintrag stammte aus einer veralteten,
noch offenen Fassung, nicht vom Protokoll. Und das fehlende `herz`-Zeichen
(Gesundheit der Personen-Wertekarte) ist jetzt im Kit-Register.
