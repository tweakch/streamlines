---
nummer: 08
id: k8
titel: Prototyp: Epoche I spielbar
untertitel: Was du jetzt im Browser/auf dem Handy spielen kannst.
banner: 8 PROTOTYP
---

## Spielregeln des Prototyps auf einen Blick {done openc}

- **10 Runden = 8 000 Jahre** (10 000–2 000 v. Chr.), **Sechseck**-Raster (odd-r, versetzte Reihen, jedes Plättchen bis zu sechs Nachbarn) mit Fluss, See, Hang, Ufer und Furten. Im HTML-Prototyp eine feste 5×8-Karte; in der App ist das Spielbrett das auf der Weltkarte **geformte Gebiet** (12–55 Felder, Weltkoordinaten)
- **Tag**: 1 Plättchen ziehen & legen (Fischgrund, Uferlager, Auenwald, Hochterrasse, Höhle, Feuerstein; später Pfahlbau), Einkommen kassieren, optional Werkzeug bauen (Feuerstein + 2 Material → +2 Schutz), Sammlerin/Jäger bewegen
- **Nacht**: Seite verdunkelt sich, Karte flippt – Raubtier/Frost (Schutz-/Materialprüfung), Stille, gute Jagd, Fremde, Fund. Der Stamm isst −1 Nahrung
- **◆ Vier Anker** auf der Zeitleiste (als "?" markiert): ~8 400 Wiederbewaldung, ~6 200 große Kälte, ~4 300 erste Bauern (Pfahlbau frei), ~3 400 der See steigt
- **Verlustrisiko**: zwei Hungernächte in Folge → "Der Stamm zieht weiter"
- **Fortschritt** "Sesshaftigkeit" = min(Nahrung, Schutz, Material), Ziel 20 → Endstufen: *Die Pfahlbauer / Am Ufer angekommen / Das Tal bleibt wild*
- **Zeremonie I→II** mit 5 Karten und Realitätsabgleich (Balance %, Authentizität %, Fundstellen x/y — y = Fundstellen im gewählten Gebiet)

UI: Tag/Nacht-Farbwechsel als Signatur, Petroglyphen-Ikonografie, responsive – mobil Kompakt-Layout (Safe-Areas, dvh, Hand fixiert unten), auf dem Desktop bildschirmfüllend (Karte links auf Viewporthöhe skaliert, Status & Hand als Seitenleiste rechts). Datenhinweis im Spiel: historisch inspiriert und vereinfacht, Jahre gerundet. {.dim}

## Feld-Inspektor: jedes Feld ist anklickbar {done}

Ein Klick auf ein beliebiges Feld wählt es aus (dunkle Kante, unterscheidbar vom Glut-Leuchten gültiger Züge) und öffnet ein Info-Panel:

- **Geländetyp** mit Beschreibung (Fluss, Furt, See, Hang, Ufer, Flachland)
- **Position** als Raster A–E / 1–8, plus Landmarken (Landquart, Bodensee, Seeufer)
- **Gelegtes Plättchen** mit Glyphe, Beschreibung und aktuellen Wirkungen – inkl. aktiver Verbünde, Wiederbewaldungs-Bonus, gestörter Fischgründe
- **Menschen** auf dem Feld mit ihren Effekten und Tagesstatus
- **Aktionen**: Sammlerin/Jäger hierher ziehen (falls erreichbar), passende Handplättchen direkt bauen

Platzierungs- und Bewegungsklicks behalten Vorrang; Inspektion ist der Fallback für alle übrigen Klicks. Bekannter Kompromiss mobil: Das Panel steht über der Karte und schiebt sie beim Öffnen nach unten. {.dim}

Nachfolger entschieden: Der **Feld-Explorer** (Kap. 8, eigene Karte) ersetzt dieses Panel – Klick lädt *immer* in den Explorer, mobil Vollbild, ab 900px Seitenpanel. Damit fällt auch der Kompromiss oben weg. {.dim}

## Startbildschirm: Weltkarte im Nebel, forme dein Tal {done}

Portiert nach `app/src/stromlinien/StartScreen.tsx` + `world.ts` (Prototyp `start-screen-v2.html`, archiviert). Beim Port wurde die endlose Seed-Welt des Prototyps durch die **gestaltete Weltkarte** ersetzt (siehe Entscheidung in Kap. 10): Vor dem Spiel liegt der Alpenrhein von Landquart bis Konstanz (22×44 Hexes, Norden oben) unter dem **Nebel des Ungespielten**. Man erkundet durch Ziehen und Zoomen, formt ein Gebiet und startet darin.

- **Nebel des Ungespielten**: Gelände ist unsichtbar, bis ein Gebiet gespielt wurde (localStorage). Gespielte Gebiete bleiben dauerhaft aufgedeckt – die eine Weltkarte wird zur persönlichen Entdeckungsgeschichte. **Landmarken** (Konstanz, Rheindelta, Furt im Ried, Illmündung, Schaaner Furt, Tardisfurt, Landquart) sind auch unter dem Nebel lesbar – Wissen über das Land, nicht über das Gelände.
- **Formbares Sechseck-Gebiet**: Startform ist ein Hexagon (Radius 3 = 37 Felder) an der Schaaner Furt. Tippen fügt Randfelder hinzu oder entfernt Felder – das Gebiet muss **zusammenhängen** (12–55 Felder). „Neu formen" setzt das Hexagon an die aktuelle Bildmitte.
- **Zeichen ◈ (Kundschaft)**: an festen Weltpositionen. Ungespielt sehen *alle gleich aus* (anonyme Stele) und verraten weder Ort noch Art; jedes Zeichen *im gewählten Gebiet* liefert **eine vage Aussage über das Gesamtgebiet** (keines/wenig/etwas/reichlich). Nach dem Spielen zeigen Zeichen ihre wahre Glyphe am wahren Ort. **Fund-Zeichen stehen ausschließlich an echten Fundstellen** – in der gestalteten Welt lügt kein Zeichen; Wasser-/Stein-/Land-Zeichen sind deterministisch aus dem Gelände gestreut (feste Konstante, kein Seed).
- **Epochen-Ausblick**: Panel mit allen fünf Epochen und einer Erwartung fürs gewählte Gebiet (Punktwertung + Text aus dem aggregierten Gelände). Grobe Erwartungen ohne Orte; „historisch inspiriert und vereinfacht".
- **Startbedingung**: mindestens ein Flussfeld im Gebiet. Wegen des Nebels wird nur Ja/Nein verraten („✓/✕ Wasser zu hören") – Wasser-Zeichen und der bekannte Flusslauf der Landmarken helfen.
- **Übergabe an den Kernloop**: Das Gebiet wird in seiner Form (Weltkoordinaten) zum Spielbrett — `buildRegionGrid()` statt fester 5×8-Karte. Fundstellen mit Weltkoordinate im Gebiet sind im Spiel; Zeichen erscheinen als ◈ auf den Feldern und werden im Feld-Inspektor erklärt; Intro und Realitätsabgleich zählen die Fundstellen des Gebiets dynamisch. Sammlerin ✦ und Jäger ➤ betreten das Tal wie bisher über gelegte Plättchen.

v1 (7×9-Rechteckrahmen, sichtbares Gelände) ist archiviert. Mit dem Port entfallen (Seed-Welt-Erbe): „Andere Welt"-Knopf und `?seed`. Offen weiterhin: ob der Epochen-Ausblick erst durch Zeichen freigeschaltet werden soll (aktuell liest er das Gelände direkt, nur vergröbert), Zeichen-Dichte, ob Zeichen im Spiel mechanisch wirken (bisher informativ). {.dim}

## Designer-Werkstatt: eine Karte, fünf Gewerke {idea}

Editor-Prototyp (`map-editor-v3.html`): eine Weltkarte ist ein **gemeinsames Objekt für fünf Gewerke**, umschaltbar als Linsen auf denselben Daten – Kartendesign, Spieldesign, Biologie, Archäologie und Geschichte arbeiten am selben Tal:

- **Landschaft** (Kartografie): Gelände + vorplatzierte Plättchen je Epoche malen (pointy-top, odd-r offset, identische Nachbarschaftstabellen wie das Spiel); "Ufer ableiten", "Aus voriger Epoche übernehmen", Diff-Ansicht zwischen Epochen.
- **Natur** (Biologie): Arten (Flora/Fauna) mit Lebensraum-Gelände, Epochen-Vorkommen und Spielwirkung definieren, Vorkommen als Punkte auf die Karte klicken.
- **Technologie** (Archäologie): der Plättchen-Katalog selbst wird editierbar – Name, Glyphe (Petroglyphen-Set), erlaubtes Gelände, Epochen-Verfügbarkeit, Beschreibung. Dazu Fundstellen mit Text und Entdeckungs-Plättchen, platzierbar per Klick.
- **Ereignisse** (Geschichte): Anker-Ereignisse (feste Runde, geschehen immer) und Streu-Ereignisse (Nachtdeck mit Gewichten) je Epoche, mit Spielwirkungs-Feld.
- **Mechanik** (Spieldesign): Kosten/Erträge/Deck-Gewichte als Tabelle über den Katalog, Startressourcen, Sesshaftigkeits-Ziel, Rundenzahl – Zahlen getrennt von Geschichten.

**Belegstatus & Quelle statt Schranken**: Fakten-Einträge (Plättchen, Arten, Ereignisse, Fundstellen) tragen einen Status (*belegt / wahrscheinlich / rekonstruiert / frei erfunden*) und ein Quellenfeld. Nichts wird erzwungen – ein Quellenlage-Zähler im Kopf und weiche "Richtwerte" (3–5 Anker/Epoche, Deck-Gewichte ~100) laden zur Sorgfalt ein, statt Beiträge abzulehnen. Damit greift die Idee der Schichtentrennung (Fakten / Deutung / Mechanik) aus der Kollaborations-Skizze, ohne deren Gate-Workflow zu übernehmen.

**Struktur wie v2**: 5 Epochen (je eigener Kartenzustand, Kernthema, Zeitraum) + 4 Zeremonien (Karten-Journey, Bogen Ruhe → Entscheidung → Aufbau → Kontakt → Abschluss; I→II "Sesshaft werden" vorbefüllt). Speichern in localStorage, Export/Import als JSON v3 (`{rules, tiles, species, events, funds, epochs, ceremonies}`; liest v2/v1) – gedacht als Austauschformat Richtung `app/src/stromlinien/`, wo Karte und Daten bisher fest kodiert sind.

Status: Draft (v1 Einzelkarte, v2 Kartograf-only archiviert). Bewusst NICHT übernommen aus der Skizze: Schreibrechte pro Schicht, Zwei-Personen-Review-Gates, Simulations-Zertifizierung – legitime Ideen für ein Community-System mit hunderten Beitragenden, aber zu restriktiv für die Werkstatt-Phase. Offen: Deutungsvektor/Nachtkarten-Generierung, Sensibilitäts-Leitlinien für Modul-IV-Material, ob Karten datengetrieben in die App wandern. {.dim}

## Mechanik-Labor: Monte-Carlo-Prüfstand für Balancing {idea}

Prototyp (`mechanik-labor-v1.html`): ein headless Port des Epoche-I-Kernloops, komplett datengetrieben — Designer und Balancer verändern Karte (Gelände, Furten, Fundstellen, Start-Plättchen), Deck-Zusammensetzung, Plättchen-Werte, Verbünde, Arten (Flora/Fauna mit Lebensräumen), Technologien, Anker-/Streu-Ereignisse und Grundregeln, und lassen einen Bot tausende Partien spielen (seedbar, Strategien: ausgewogen/Nahrung/Schutz/Authentizität/Zufall).

Auswertung: Überlebensquote, Sesshaftigkeits-Verteilung mit Endstufen-Schwellen, Ressourcen-Verlauf pro Runde, Ereignis-Bilanz (wie oft ausgelöst, wie oft gut ausgegangen), Belegungs-Heatmap auf der Hexkarte, Einzellauf-Zeitleiste (eine Partie Runde für Runde). Kernstück ist die **gepinnte Basis**: Ergebnis merken, Werte ändern, neu simulieren — jede Kennzahl zeigt das Delta. JSON-Export/Import als Austauschformat, gleiche Datenphilosophie wie die Designer-Werkstatt.

::: why Warum
Die offene Balancing-Frage (Kap. 5) verlangte bisher Papier-Simulation; jetzt lassen sich Zahlenänderungen in Sekunden gegen tausende Läufe prüfen, bevor sie in die App wandern. Enthält als Experiment ein Arten-System (Flora/Fauna verstärken Plättchen in/neben ihrem Lebensraum, Standard: aus) — Kandidat für die „Tierwanderungen"-Idee aus Kap. 2.
:::

## Ereignis-Labor: gescriptete Ereignisse mit Ort, Ausbreitung und Spur {idea}

Prototyp (`ereignis-labor-v1.html`): ein **Drehbuch** läuft Runde für Runde über die gestaltete Weltkarte (22×44, dieselbe Karte wie die App). Was ein Ereignis dort ist:

| Angabe | Inhalt |
| --- | --- |
| Zeit | absolutes Jahr; die Runde wird gerechnet (Von/Bis/Rundenzahl je Drehbuch) |
| Phasen | Vorzeichen (n Runden davor) → Einschlag → Nachwirkung (n Runden danach) |
| Ort | eine oder mehrere Quellen – auch **abseits der Karte**, oder erst zur Laufzeit bestimmt |
| Ausbreitung | Art + Tempo je Runde + Reichweite (Kap. 3: die Geometrien als Kostenfunktionen) |
| Wirkung | Gelände umschreiben, Wald setzen/nehmen, Merkmal setzen; Narbe, optional mit Heilfrist |
| Folge | löst nach n Runden ein weiteres Ereignis aus |
| Beleg | belegt / wahrscheinlich / rekonstruiert / frei erfunden + Quellentext, pro Ereignis sichtbar |

Zwei Drehbücher zum Prüfen: **Epoche I** (Wiederbewaldung als Front, Flimser Bergsturz, Ausbruch des Bergsturzsees, Blitz-Waldbrand, 8.2-ka-Kälte, Pfahlbauten am Seeufer, Seespiegelanstieg) und **Epoche II** (Höhensiedlungen, Rom als Front aus zwei Richtungen, Talstraße, Hochwasser) – letzteres prüft das Schichtenmodell aus Kap. 3. Regie-Panel mit Reglern und umschaltbarer Ausbreitungsart samt Live-Vorschau; Protokoll; **Spuren-Ansicht**.

**Der Rundenablauf ist eingebaut**: Das Labor läuft nicht in Runden, sondern in den **vier Abschnitten** des Kernloops (Morgen · Tag · Nacht · Rundenende, siehe Kap. 2), und jede Ereignisphase hat darin ihren Platz (Kap. 3, „Ereignis-Dramaturgie"). Dazu drei Dinge, die vorher fehlten:

- **Spielsicht** — eine Ansicht, die für jeden Abschnitt zeigt, was der Spieler dort liest: Tagesbericht mit Vorzeichen und Ertrag, der Handlungsraum des Tages, die Aufdeckung der Nacht mit namentlichen Verlusten, die Rundenrechnung. Damit ist prüfbar, *wann* ein Ereignis sichtbar wird, nicht nur *dass* es geschieht.
- **Eine Beispiel-Siedlung im Tal** (16 Plättchen, Sammlerin und Jäger). Ein Ereignis, das nur Gelände umschreibt, bleibt Kulisse; erst wenn es Plättchen zerstört und Menschen vertreibt, wird es Mitspieler. Ressourcen rechnet das Labor bewusst **nicht** — das ist die Aufgabe des Mechanik-Labors.
- **Handlungsfenster** — je Ereignis zwei benannte Antworten mit Preis, wählbar am Morgen und am Tag, wirksam beim Einschlag.

::: why Was das Handlungsfenster über die Mechanik verrät
Beim Bauen zeigte sich, dass der naheliegende Modifikator meist der falsche ist. Erster Versuch für „römische Dämme aufwerfen": *Reichweite des Korridors −14*. Gemessen: keine Wirkung — der Korridor läuft die Talachse hinunter und braucht dafür rund 42 Kostenpunkte, ob mit oder ohne Damm. **Ein Damm verkürzt den Fluss nicht, er verhindert das Übertreten.** Der richtige Modifikator ist darum nicht die Länge, sondern der Sprung vom Bett aufs Ufer — dieselbe Kostenregel, die den Überflutungsstreifen erzeugt. Danach messbar: 294 → 232 dauerhaft veränderte Felder, 9 → 5 verlorene Plättchen. Die Lehre gilt allgemein: eine Antwort greift an *einer Kostenregel* der Ausbreitung an, nicht an einer Zahl — und welche Regel es ist, sagt die Physik des Ereignisses, nicht das Balancing.
:::

::: why Drei Erkenntnisse, die über das Werkzeug hinausgehen
1) **Das Drehbuch ist ein Kartengenerator.** Die Spuren-Ansicht blendet alles aus, was das Drehbuch nicht angefasst hat – und übrig bleibt eine zweite Karte: Schwemmland dort, wo die Flut lief, Brandlichtungen, eine neue Uferlinie, Pfahlbauten am See. „Die Karte verändert sich pro Epoche" (Kap. 2) muss also nicht von Hand pro Epoche gezeichnet werden; der Endzustand von Epoche I *ist* der Ausgangszustand von Epoche II. Dasselbe Prinzip wie „Das Erbe der Eiszeit" (Kap. 2), nur eine Zeitebene höher.<br><br>2) **Die Ursache darf abseits der Karte liegen.** Der Flimser Bergsturz geschah am Vorderrhein – oberhalb von Landquart, also ausserhalb des Weltkartenausschnitts. Genau das macht ihn *besser* spielbar: sichtbar ist nur, was talwärts ankommt (Staub im Süden, weisses Wasser, dann ein trockenes Flussbett), und zwei Runden später die Flutwelle. Ereignisse brauchen keinen Ort *im* Ausschnitt, nur eine Kante, durch die sie eintreten.<br><br>3) **Ketten erzählen, was Einzelereignisse nicht können.** Felssturz → trockenes Bett → Ausbruch des Stausees ist als eine Karte nicht darstellbar, als drei verbundene sofort verständlich. Die Kette braucht dafür nur ein Feld (*löst X nach n Runden aus*) – und ergibt ein Spielgefühl, das kein Ereignisdeck erzeugt: die zwei Runden mit trockenem Fluss sind Gelegenheit und Vorzeichen zugleich.
:::

Offen: **Kalibrierung der Tempi** (Kap. 3) – beim Bauen musste die Flutwelle von Tempo 22 auf 10 herunter, weil sie die Siedlung in einer einzigen Nacht wegräumte: „kein Ereignis, ein Urteil". Wie viele Nächte ein Ereignis dauern *darf*, ist unentschieden. Dazu: wo die Vorzeichen-Zeile im Spiel wohnt (Kap. 3); das Austauschformat mit der Designer-Werkstatt (dort Freitext, hier ausführbare Struktur); ob die **Deutungsrahmen** der Nacht (Kap. 3) denselben Weg über Geometrien nehmen wie die Ereignisse; und ob das Labor eigene Ressourcen bekommt oder die Zahlen beim Mechanik-Labor bleiben. Die Ereignistexte sind historisch inspiriert und vereinfacht, Jahre gerundet. {.dim}

## Die Welt wächst mit den Wegen — bekanntes Land ist begangenes Land {concept}

Prototyp (`kartenwachstum-v1.html`). **Die Dichte ändert sich nie** – 2 km je Feld, 3,5 km² Land, in jeder Epoche. Grösser wird nicht das Feld, sondern die **Zahl der bekannten Felder**, und zwar entlang der Wege, die Menschen dieser Zeit tatsächlich gehen konnten. Die Kartengrösse ist damit kein Fahrplan mehr, sondern ein **Ergebnis**.

Gerechnet wird mit einer Kostensuche über das echte Gelände. Zwei Budgets je Epoche, weil zwei verschiedene Dinge wachsen:

| Budget | bedeutet | Form |
| --- | --- | --- |
| **heim** | das Gebiet, das die Gruppe im Jahreslauf wirklich abläuft | Fläche – man kennt es *ganz* |
| **fern** | wie weit Wege zu *anderen Orten* reichen | Linien mit Sichtstreifen – man kennt den Weg, nicht das Land daneben |

Der Unterschied ist der ganze Punkt: **man reist zu Orten, nicht durch Flächen.** Ein Modell, das nur den Erreichbarkeits-Kreis kennt, behauptet, ein Händler kenne alles im Umkreis von 200 km. Er kennt einen Weg.

::: why Vier Befunde, alle gemessen
1) **Die Kurve fällt beim Sesshaftwerden.** Mesolithikum 420 Felder (1 455 km²) → Neolithikum **112** (388 km²), −73 %. Bauern kennen *weniger* Welt als Jäger, und sie kennen sie genauer. Das Modell trifft dabei die ethnographischen 100–2 000 km² für Wildbeuter-Streifgebiete und die 5–50 km² neolithischer Dorfterritorien, ohne darauf getrimmt zu sein. Für das Spiel heisst das: der Epochenübergang I→II ist **ein Verlust an Welt** – und die verlorene Welt bleibt als Nebel sichtbar.<br><br>2) **Korridore entstehen nur, wenn Wasser billiger ist als Land.** Erste Fassung hatte Fluss 3 und Flachland 2 – es kam nie ein Band heraus, immer ein Fleck. Mit Einbaum 1,0 und Plankenboot 0,6 gegen Land 2 folgt die bekannte Welt von selbst dem Fluss, mit blinden Flanken. Die Bootstechnik ist damit keine Verzierung, sondern der Formgeber der Karte.<br><br>3) **Die Römerstrasse senkt die bekannte Fläche** (−95 Felder gegenüber der Eisenzeit), weil sie Wege *verkürzt*. Infrastruktur verbindet Orte und ent-kennt den Raum dazwischen. Ein Modellartefakt – aber eines, das historisch etwas Wahres sagt.<br><br>4) **Sicht folgt dem Tal, nicht dem Zirkel.** Ein Sichtkreis von 7 Feldern überstrahlte in den frühen Epochen alles und machte den Sesshaftigkeits-Einbruch unsichtbar. Sicht ist darum eine Breitensuche durch offenes Gelände: Bergland wird *gesehen*, aber nicht durchschaut. Damit hat der Nebel die Form der Grate – und die Karte sieht aus wie ein Tal, nicht wie ein Radar.
:::

**Seit August 2026 ist das Modell sichtbar, nicht nur gerechnet.** `feld-labor-threejs-v1` fährt es als **Wissenslinse** auf echtem Gelände: begangenes Land trägt sein Relief, gesehenes ein gedrücktes, vergessenes nur noch seine Umrisse, unbegangenes liegt flach und blass. Damit ist die Aussage dieser Karte kein Diagramm mehr, sondern eine Landschaft – und die drei Befunde unten sind im Bild nachprüfbar: der Korridor entlang des Rheins mit blinden Flanken entsteht wirklich nur, solange Wasser billiger ist als Land, und die Sicht nimmt die Form der Grate an statt die eines Zirkels. Gerechnet wird immer auf Ebene 1, nie auf der gezeichneten – Zoomen ist Hinschauen, nicht Hingehen. Das Lager lässt sich im Feld-Explorer versetzen; was aus dem Heim-Budget fällt, sinkt zurück.

**Nebel des Vergessens** – der dritte Zustand. Neben *bekannt* und *nie gesehen* gibt es *vergessen*: was verlassen wird, fällt zurück in Nebel und behält nur seine Umrisse. Das verlassene Dorf bleibt liegen, im Nebel. Damit wird der „Nebel des Ungespielten" (Kap. 2) von einer Auswahlhilfe zu dem, was er vorgibt zu sein: Unwissen, das man begeht – und Wissen, das verfällt, wenn niemand mehr hingeht. Erzählerisch ist das der Ort, an dem **Sagen** wohnen: Orte, die man erinnert, aber nicht mehr kennt.

Offen: **das Modell sättigt ab der Eisenzeit**, weil alle 23 Landmarken des Datensatzes erreichbar sind – Wachstum über Wege braucht eine **Siedlungsschicht** (Orte als Ziele), die die Pipeline nicht hat. Dazu: Flora und Fauna fehlen als eigene Schicht, das Labor nimmt Ufer und Flachland als Ertragsproxy (die Biologie-Schicht aus Kap. 1 wäre der richtige Ort); flussaufwärts kostet gleich viel wie flussabwärts, was für Boote falsch ist; und wie schnell Wissen verfällt, ist gesetzt (sofort) statt gestaffelt – eine Generation Erinnerung wäre plausibler. **Und die Grenze der Metrik**: bis ins 16. Jh. ist bekanntes Land begangenes Land. Danach bringen Druck, Karte und Post Wissen über Orte, die niemand betreten hat – ab der Neuzeit müsste die Karte **durch Nachrichten wachsen, nicht durch Füsse**. Das ist ein anderer Mechanismus, nicht ein grösseres Budget. {.dim}

## Zoomstufen-Labor: der Epochenübergang als Zoomwechsel {rej badge="Verworfen als Übergangs-Mechanik"}

::: why Verworfen am 21. Aug 2026 – und warum die Karte trotzdem bleibt
Der Einwand, der das entschied: *„ich finde nicht, dass diese Art von Epochenübergang die Realität spiegelt … es geht ums Überleben. Ein Mensch hat kaum mal ein Tal verlassen, wenn es ihm alles gegeben hat, was er brauchte."* Das trifft zu. Der Zoomwechsel modelliert **Kartografie** – wie genau eine Karte ein Gebiet auflöst. Das Spiel handelt aber von **Wissen** – wie viel Welt eine Gruppe kennt. Für dieselbe Frage („wie wird die Welt zwischen den Epochen grösser?") ist das reichweitenbasierte Modell der nächsten Karte belegbar, spielbar und historisch näher; es erzeugt ausserdem den Nebel, den das Spiel schon hat. Diese Karte bleibt, weil ihre **Messungen** weitergelten (Ebene 1 ist die Spielauflösung; Weltkoordinaten statt Zellindizes; ×25 statt ×7) und weil der Zoom als *einmaliger* Schritt für die industriellen Epochen offen bleibt – dort schrumpft der Gegenstand des Interesses wirklich auf Dorf- und Stadtgrösse.
:::

Prototyp (`zoomstufen-labor-v1.html`): Beim Epochenwechsel wird **nicht die Karte grösser, sondern das Feld kleiner**. Die Geodaten-Pipeline liefert dafür bereits drei echte Ebenen – 10, 2 und 0.4 km je Hex –, also muss nichts erfunden werden. Das Labor lädt `rhein-tiles-v4.data.js`, stellt eine bespielte Beispiel-Siedlung ins Alpenrheintal und lässt jedes Feld beim Übergang in seine *echten* Kinder aufbrechen.

::: why Der Zoom fügt Wissen hinzu, er unterteilt nicht
Das ist der Grund, warum diese Idee mit echten Daten funktioniert und mit erzeugten nicht funktionieren würde. Dieselbe Stelle bei Chur ist auf Ebene 0 **Fluss**, auf Ebene 1 **Ufer**, auf Ebene 2 **Flachland** – die feinere Ebene weiss von sich aus mehr über dasselbe Land, statt den Grundton des Elternfelds zu wiederholen. Ein Epochenübergang heisst damit inhaltlich: *je näher die Zeit, je genauer kennt man das Tal.* Wer den Übergang aus einem Interpolat baut, bekommt hübschere Kanten und keinen Erkenntnisgewinn.
:::

**Vier Messungen, die Entwurfsentscheidungen sind:**

| Gemessen | Folge |
| --- | --- |
| Faktor **5** in der Länge je Ebene, also **25×** in der Fläche | Ein Feld zerfällt in ~25 Kinder, **nicht in 7**. Für *einen* Epochenschritt ist das viel: 16 bespielte Felder werden zu einem Spielfeld von 401 |
| Kinderzahl je Feld schwankt: **21–27**, Mittel 25.07 (140 Felder) | **Hex-Raster verschachteln sich nicht exakt.** „Jedes Feld zerfällt in n" ist keine Regel, sondern ein Mittelwert – die Zuordnung muss über Mittelpunkte gerechnet werden, nicht über eine Formel |
| Ebene 1 (2 km/Hex) liegt am nächsten an der gestalteten Weltkarte (22×44 Felder auf ~90 km Tal ≈ 4 km/Hex) | **Ebene 0 ist keine Spielebene**, sondern die Kampagnen-Übersicht. Gespielt wird ab Ebene 1 – damit bleibt für die ganze Kampagne genau *ein* Zoomschritt in den vorhandenen Daten |
| Die Siedlung sitzt nach dem Wechsel auf **4.0 %** ihres Spielfelds | Der Übergang verdünnt den Fortschritt, ohne eine Strafe zu erfinden – „dieselbe Siedlung, aber wieder Rand" |

**Die eigentliche Entscheidung ist die Kamera**, und das Labor zeigt beide Seiten:

- **Land halten** – derselbe Ausschnitt, feinere Felder. Die Felderzahl im Blick springt von 525 auf 12 221. Das ganze alte Tal bleibt bespielbar, aber es ist plötzlich 25× so viel Fläche zu verwalten.
- **Felderzahl halten** – der Ausschnitt schrumpft um Faktor 5. Ein altes Feld füllt den halben Bildschirm, die Siedlung liegt darin als ein Punkt, und der Rest des alten Tals ist *ausserhalb*. Man spielt in einem **Bruchstück** weiter.

::: why Was daran technisch die Lehre ist
Die bespielte Karte muss in **Weltkoordinaten** (km) verankert sein, nicht in Zellindizes – sonst übersteht sie keinen Zoomwechsel. Das ist dieselbe Regel, nach der `world.ts` Fundstellen, Landmarken und Zeichen an feste Weltkoordinaten bindet, und derselbe Grund, aus dem Ereignisse ihr **absolutes Jahr** tragen statt einer Rundennummer (Kap. 3). Ort wie Zeit: absolut speichern, erst beim Anzeigen aufs Raster rechnen.
:::

Offen: **ob ×25 je Übergang tragbar ist** – die Alternativen sind eine Zwischenebene in der Pipeline (~4–5 km/Hex, dann ×5 je Schritt) oder der Zoomwechsel nur an ausgewählten Modulgrenzen statt an jeder Epochengrenze. Dazu: was mit dem Teil des alten Tals geschieht, der bei „Felderzahl halten" aus dem Blick fällt (verloren? als Nachbarschaft weiterlaufend? Ziel späterer Ausbreitung?); ob die Plättchen beim Aufbruch ihre Art behalten oder sich in feinere Arten aufspalten (ein 3.5-km²-„Uferlager" ist auf 0.14 km² eher ein Dorf mit Feldern); und wie sich der Wechsel zur Zeremonie verhält – Vorschlag aus den Notizen: **Modulgrenze = Zeremonie = Zoomwechsel**. Die Ebene 2 der Pipeline deckt bewusst nur den Alpenrhein ab; ausserhalb heisst grau „keine Daten", nicht „leer". {.dim}

## Playtest-Brücke: die entworfene Karte selbst spielen {idea}

Es fehlt das Bindeglied zwischen den drei Werkzeugen: Das **Mechanik-Labor** lässt Bots datengetriebene Karten spielen, die **Designer-Werkstatt** entwirft sie – aber **kein Mensch kann eine in der Werkstatt entworfene Karte spielen**. Der erste Schritt ist getan: Seit dem Startbildschirm-Port nimmt der Kernloop ein geformtes Weltkarten-Gebiet entgegen (`buildRegionGrid()` in `app/src/stromlinien/grid.ts` statt des parameterlosen `buildGrid()`). Was fehlt, ist der Weg Werkstatt-JSON → Weltkarte/Spiel.

Vorschlag: Prototyp und App lesen eine Karten-JSON statt des fest kodierten Rasters – dieselbe Datei, die Werkstatt und Labor schreiben.

::: why Warum vor dem Port
Designer, die ihre Karte nicht spielen können, entwerfen blind – und das Labor prüft nur, was messbar ist, nicht was sich gut anfühlt. Die Brücke erzwingt zudem, dass das Austauschformat wirklich funktioniert, bevor es in die App wandert: genau die Reihenfolge, für die die Prototypen-Werkstatt existiert.
:::

## Die Shell: alle Screens rund ums Spiel in einem Fluss {done}

**In der App** (`app/src/shell/`: Titelbild, Klan gründen, Epochen, Regeln, Über; Router in `App.tsx`; Weltkarte = erweiterter `StartScreen`; Spiel mit ⬡-Ausstieg und ☰-Lager-Menü). Prototyp `shell-v2.html` ist archiviert. Was in der Spieleentwicklung **Shell** oder **Meta-UI** heißt — Titelbild, Menüs, Profil, Kampagnen-Auswahl, Aux-Seiten — als ein durchspielbarer Fluss:

- **Titelbild** (Title Screen): Wortmarke, animierte Flusslinie, und bei laufender Partie eine **Resume-Karte** mit Gebiet, Epoche, Runde, Fortschrittsbalken und einer **Kontextzeile „zuletzt: …"** aus der Chronik — man sieht, was man fortsetzt, bevor man klickt.
- **Die Weltkarte ist der Hub**: Gebietswahl und Fortsetzen liegen auf einem Screen — so wie es die App mit `StartScreen.tsx` ohnehin tut. In v1 waren das noch zwei getrennte Screens.
- **Klan gründen**: der Stammesname bleibt ein eigener Schritt — und der Screen ist als Abschnittsliste angelegt, damit **Startparameter würfeln, Deck und Ausrüstungskarten** dort andocken können, ohne den Screen umzubauen (Abschnitt 02 ist als Platzhalter sichtbar).
- **Kampagnen-Screen** (5 Epochen, Zeremonien als Verbinder, I spielbar, II–V verschlossen) ist **Info-Station statt Pflichtstation**: „Hier starten" führt direkt ins Spiel. Solange nur Epoche I existiert, wäre ein Zwischenstopp reine Reibung — er wird zum echten Auswahlschritt, sobald es etwas auszuwählen gibt.
- **Verlassen in einem Klick**: ⬡ in der Spielkopfzeile führt ohne Rückfrage zur Weltkarte (Autosave macht es verlustfrei). Das **Lager-Menü ☰ fährt von rechts unter seinem Auslöser ein** — in v1 lag der Auslöser rechts und das Panel kam von links, also die maximale Diagonale.
- **Stabile Primär-Zone**: Die Hauptaktion sitzt auf jedem Screen an derselben Stelle unten (Daumenzone), „Zurück" immer oben links. **Destruktives nie neben dem Primär-Button** — „Aufgeben" sitzt klein in der Nebenzeile, nicht neben „Fortsetzen".
- **Tastatur**: Enter/Leertaste löst die Hauptaktion aus, Esc schliesst Overlays bzw. geht zurück.

::: why Gemessen statt behauptet
Klickzahl und Cursordistanz wurden im Prototyp automatisiert gemessen (420×860 px): **erstes Spiel 3 Klicks / 72 px** Cursorweg gegenüber 5 Klicks / 1 109 px in v1 — die ersten beiden Klicks liegen dank der Primär-Zone exakt übereinander. **Verlassen → Wiederaufnahme: 2 Klicks** statt 3. Der Cursorweg beim Wiedereinstieg blieb dabei fast gleich (665 statt 768 px), weil ⬡ oben und „Fortsetzen" unten sitzt — abgefedert, indem die **ganze Resume-Karte (386×154 px) Klickziel** ist statt nur der Knopf.
:::

Bewusst **nicht** übernommen: Auto-Resume (App öffnet direkt im Spiel) — es kostet den Markenmoment und verwirrt, wenn man eigentlich zur Weltkarte wollte; mit der Resume-Karte auf dem Titelbild ist der Gewinn ein einziger Klick. **Beim Port ausgelassen** (bewusst): der Chronik-&-Sync-Screen (braucht erst den echten Endpunkt) und die globale Enter/Esc-Tastatursteuerung. Offen: ob die Kampagne pro Tal oder pro Stamm zählt (aktuell implizit pro Stamm); Übergang Zeremonie → nächste Epoche im Kampagnen-Screen. {.dim}

## Session-Lifecycle: Lager-Menü, Autosave, überspringbare Nacht {done badge="Umgesetzt (Kern)"}

**In der App:** Die laufende Partie wird nach **jeder Aktion** gespeichert (`app/src/shell/storage.ts`, Schema-versioniert, ein Spielstand pro Klan) — Reload, Verlassen über ⬡ und Wiederaufnehmen über die Resume-Karte sind verlustfrei; beendete Partien räumen ihren Stand selbst weg. Ebenfalls portiert: Lager-Menü (von rechts), Aufgeben-Bestätigung, überspringbare Nacht-Sequenz, zweistufiges „Nebel zurücksetzen". Prototyp `spielmenue-v1.html` zeigte das Drumherum zuerst:

- **Lager-Menü** (☰ oben rechts, Slide-in-Panel): Fortsetzen · Regeln · Zur Weltkarte (speichert) · Partie aufgeben (destruktiv, mit Bestätigung).
- **Autosave-Indikator**: kleiner Punkt + „gespeichert" / „speichert …" – macht sichtbar, dass Schließen nie mehr als die aktuelle Eingabe verliert.
- **Confirm-Dialog** für jede unwiderrufliche Aktion: Partie aufgeben, Nebel zurücksetzen, Zeremonie-Opfer. Einheitliche Karte (Titel, Folge-Text, Abbrechen/Bestätigen).
- **Überspringbare Nacht-Sequenz**: „Die Nacht bricht an …" ist heute eine erzwungene 1,9-s-Animation ohne Interaktion; der Prototyp macht sie per Tap überspringbar (Skip-Hinweis blendet nach 0,5 s ein).
- **Fehlerfall-Karte**: Ersetzt den weißen Absturz-Bildschirm durch „Aus Autosave wiederherstellen" / „Neu beginnen" – setzt Autosave voraus.

::: why Warum vor weiterem Ausbau
Jede der drei prototypisierten Ideen dieser Session hängt am selben fehlenden Baustein: einem serialisierbaren, versionierten Spielstand. `GameState` ist bereits reine, JSON-taugliche Daten (alle Funktionen liegen in `data.ts`) – das Fehlende ist nur die Persistenzschicht selbst.
:::

**Vollständig portiert (21. Aug 2026).** Die beiden letzten Stücke sind in der App: der Autosave-*Indikator* und die *Fehlerfall-Karte* als React-`ErrorBoundary`. Zwei Dinge, die dabei auffielen — **der Indikator passt nicht mit Text in den Spielkopf** (Marke, Jahr und Phase stehen schon dort; der Text drängte die Jahreszahl in die zweite Zeile), also trägt der Kopf nur den Punkt und der Wortlaut steht im Lager-Menü, wo man nachsieht, wenn man um seinen Fortschritt fürchtet. Und die Fehlerfall-Karte **nennt den Stand statt Verlustfreiheit zu behaupten**: Gebiet, Runde, Phase, Alter in Sekunden. Sie funktioniert überhaupt nur, weil der Autosave darunter liegt — ein Absturz ist damit kein Datenverlust, sondern ein Neuladen. Der Prototyp `spielmenue-v1` ist archiviert. Offen bleibt: ob ein Undo-Fenster *innerhalb* des Tages sinnvoll ist (nach der Nacht unmöglich — Aufdeckung ist final). {.dim}

## Profil & Chronik-Sync: lokaler Stammesname, Cloud nur als Kopie {concept}

Prototyp (`profil-hub-v2.html`, v1 archiviert): Kein Login, kein Konto – das Profil ist der `localStorage`-Schlüssel, nur sichtbar gemacht. Beim ersten Start fragt das Spiel „Wie nennt man euren Stamm?"; unter diesem Namen liegen Nebel, Spielstand und Chronik.

- **Profilchip** (oben rechts auf der Weltkarte) öffnet einen **Umschalter** für mehrere Stämme auf einem Gerät – jeder mit eigenem Nebel und eigener laufender Partie.
- **Weltkarte als Fortsetzen-Hub**: Liegt ein Spielstand vor, zeigt die Weltkarte statt „Neues Gebiet formen" eine Karte „Laufende Partie · Runde 4" mit Fortsetzen/Aufgeben (Aufgeben mit Bestätigung).
- **Sync ist opt-in**, Standard aus. Solange er aus ist, verlässt nichts das Gerät – und der Erststart-Text sagt genau das.
- **Chronik-Code als Identität**: eine Wortkette (`furt-adler-see-wolf-7291`), kopierbar als Code oder als Link (`?chronik=CODE` füllt den Holen-Dialog vor). Kein Konto, keine Mailadresse.
- **Konflikt-Dialog „Zwei Chroniken"**: Gerät und Cloud nebeneinander mit Runde und Zeitpunkt, „▲ neuer" markiert; eine Seite gewinnt, die andere wird überschrieben. Kein Mischen – Spielstände sind ganze Dokumente.
- **Offline ist ein normaler Zustand**, kein Fehler: „Kein Netz – die Chronik bleibt auf diesem Gerät."

::: why Warum local-first und die Cloud nur als Kopie
Das Spiel ist Solo und offline-fähig. Ein Server als primärer Speicher würde jedem Plättchen-Zug Latenz aufzwingen und Offline-Spiel unmöglich machen – für nichts. `localStorage` bleibt die Wahrheit; hochgeladen wird eine Kopie, wenn der Spieler es will.
:::

::: why Der Code ist ein Passwortersatz
Wer den Code hat, hat die Chronik. Die Wortliste des Prototyps (32 Wörter × 4 Glieder + 4 Ziffern ≈ 33 bit) ist dafür **zu kurz** – produktiv braucht es ≥60 bit *und* Rate-Limiting auf dem Endpunkt, sonst ist Durchprobieren möglich. Im Prototyp steht das als Kommentar im Code.
:::

**Teilweise in der App:** Der Profilteil ist portiert (Klan gründen mit Stammesname, Profilchip & Umschalter auf der Weltkarte, Nebel und Spielstand pro Klan) — der **Sync-Teil wartet auf den echten Endpunkt** (`api/chronik` + Vercel Blob) und lebt bis dahin nur im Prototyp. Der Server ist dort durch einen zweiten `localStorage`-Schlüssel simuliert, damit der Rundlauf *sichern → Gerät leeren → holen* in einem einzigen Browser durchspielbar ist. Debug: `?empty`, `?demo`, `?sync`, `?restore`, `?conflict`, `?offline`. Offen: ob „ein aktiver Spielstand pro Stamm" reicht; ob der Code zusätzlich als QR angeboten wird; wann die Kopie in der Cloud gelöscht wird, wenn ein Spieler Sync wieder abschaltet. {.dim}

## Das Handbuch wird veröffentlicht – gefiltert zur Build-Zeit {done}

Dieses Dokument wird mit der Anwendung zusammen deployt und ist unter `/handbuch/` erreichbar. Veröffentlicht wird aber **nur, was entschieden ist**: Karten mit Status *Umgesetzt* und *Konzept*. Ideen, Verworfenes und offene Fragen bleiben im Arbeitsdokument.

::: why Warum nicht einfach ?mode=publish ausliefern
Der Publish-Schalter blendet Karten nur per CSS aus – der vollständige Text steht weiterhin im ausgelieferten HTML und ist über „Seitenquelltext anzeigen" lesbar. Ein Deployment der Datei, wie sie ist, würde also genau das öffentlich machen, was die Publish-Ansicht verbergen soll. Deshalb schneidet `app/scripts/build-handbuch.mjs` die Karten **vor dem Ausliefern** aus dem Dokument.
:::

- **Build**: `npm run build` baut die App und schreibt danach die gefilterte Fassung nach `dist/handbuch/index.html`. Das Skript meldet, wie viele Karten veröffentlicht und wie viele zurückgehalten wurden, und bricht ab, wenn gar keine Publish-Karte übrig bleibt.
- **Nur das Handbuch bauen**: `npm run build:handbuch` – danach `npm run preview` und `/handbuch/` aufrufen (mit Schrägstrich; ohne ihn greift lokal der SPA-Fallback).
- **Leere Kapitel verschwinden von selbst**, weil das Seitenskript sie beim Rendern ausblendet und das Inhaltsverzeichnis neu aufbaut – Kapitel 9 („Verworfen") ist in der veröffentlichten Fassung deshalb gar nicht vorhanden.
- **Vercel**: Root Directory `app`, dazu die Einstellung *„Include source files outside of the Root Directory in the Build Step"* – das Handbuch liegt in `prototype/`, also ausserhalb des Root-Verzeichnisses.

Die Statusfelder `data-s` sind damit nicht mehr nur Dokumentation, sondern steuern, was öffentlich sichtbar ist. Ein falsch gesetzter Status veröffentlicht etwas – oder verbirgt es. {.dim}

## Ein Knopf, der die Welt einliest: die Pipeline als Aspire-Ressource {done}

> Im Aspire-Dashboard steht eine Ressource `pipeline` auf *Not started*. Ein Klick auf Start liest die gebackene Karte in die Datenbank ein und beendet sich wieder.

Die Werkzeugkette hat damit vier Stufen: `sources/*.json` → `bake.mjs` (Tileset für den Viewer) und `bake-overlays.mjs` (`out/karte.sqlite`) → `ingest/ingest.mjs` → `welten.natur`. Das Harness (`apphost/apphost.mts`) hält daneben wie bisher Postgres, Valkey, die Spielstand-API, den Vite-Dev-Server und das Gateway auf der einen festen Adresse `:8080`.

Ein gemessener Lauf überträgt: 6 Datenquellen mit Lizenz, 3 Ebenen, 11 Overlays, 33 Legendenklassen, **3 219 Kacheln** (je 32×32 Byte als BLOB), **108 168 Zellwerte** auf der Spielebene und 23 Einträge Herkunftsprotokoll – in 2,2 s. Die Realitätsnähe der ganzen Karte steht am Ende der Ausgabe: **belegt 49,9 % · inspiriert 17,1 % · erfunden 33,0 %.**

::: why Warum ein Stapelverarbeiter und kein Dienst
`withExplicitStart()` ist die ganze Pointe: ohne das würde jedes `aspire run` die Datenbank neu schreiben. Die Ressource hat auch keinen Endpunkt – es gibt nichts, worauf man zeigen könnte. Dass ein Ingest ein *Knopf* ist und nicht ein Nebeneffekt des Startens, ist der Unterschied zwischen einer Datenbank, der man traut, und einer, die sich unter der Hand ändert. Ohne `--bake` überträgt die Stufe nur, was schon gebacken ist; fehlt die SQLite ganz, backt sie selbst. Und es gibt bewusst **keinen Vorgabewert für die Verbindung**: läuft der Ingest ohne Harness, bricht er ab, statt stumm in eine fremde Datenbank zu schreiben.
:::

Das ist zugleich die Abfrageschicht, auf der der Feld-Explorer (unten) seine Zeilen *Landschaft* und *Flora & Fauna* füllen kann: „was weiss ich über dieses Feld" ist ein Ortsindex über alle Overlays, „wo liegt dieser Wert" ein Attributindex. Die Overlay-Stufe selbst bleibt dependency-frei (`node:sqlite`); nur `fetch/` und `ingest/` dürfen npm-Pakete haben. {.dim}

## Spielfeld entlasten: Chronik, Lager-Panel, Inspektor als Bottom-Sheet {idea}

Prototyp (`spielfeld-entlastung-v1.html`): Auf Mobile konkurrieren Header, Timeline, Ressourcen, Sesshaftigkeit, Peoplebar, Feld-Inspektor, Karte, Hand und Action-Row um denselben schmalen Bildschirm. Vier Entlastungen im Prototyp:

- **Kompakte Punkt-Timeline** statt zehn Kästen: schmale Balken, Anker mit ◆, Tap zeigt Runden-Info als Popover statt permanent Platz zu beanspruchen.
- **Ressourcen-Deltas an den Chips** (+2/−1, kurz aufblendend) statt Erklär-Toasts – die Zahl bleibt der Ort der Wahrheit.
- **Lager-Sammelpanel** (einklappbar): aktive Boni (Wiederbewaldung, gestörte Fischgründe, Verbünde) und der Werkzeug-Bau an einem Ort statt verstreut über Toasts und einen dauerhaft sichtbaren, oft disabled Button.
- **Chronik als Bottom-Sheet** („Erzählungen der Alten"): sammelt jeden Toast und jedes Nacht-Ergebnis nachlesbar, mit Runden-Marke. Löst nebenbei das Toast-Verlust-Problem (schnelle Folge überschreibt heute den vorigen Toast).
- **Feld-Inspektor als eigenes Bottom-Sheet**, das von unten hereinfährt statt die Karte nach unten zu verschieben – behebt den im Prototyp `stromlinien-epoche1` dokumentierten „bekannten Kompromiss mobil". *Überholt:* Statt eines Bottom-Sheets wurde der **Feld-Explorer** entschieden (Vollbild mobil, Seitenpanel ab 900px) – siehe eigene Karte.

::: why Warum diese vier zuerst
Alle vier sind additive HUD-Elemente ohne Eingriff in Spielregeln oder Datenmodell – geringstes Risiko, sichtbarster Effekt auf kleinen Bildschirmen.
:::

Debug: `?chronik`, `?sheet`, `?lager`, `?delta+`/`?delta-`, `?demo`. Offen: ob die Chronik zusätzlich als globale Session-Historie (über mehrere Partien) im Profil landen soll (Anschluss an die Profil-Idee oben). {.dim}

## Der Feld-Explorer: ein Klick, alles über dieses Feld {concept}

Entschieden: **Ein Klick auf ein Feld lädt es immer in den Feld-Explorer** – auch auf leeres Gelände, auch mitten im Zug. Der Explorer ist **nicht-diegetisch**: ein Werkzeug, das erklärt und rechnet, kein Ort der Welt. Er hat darum ein eigenes Register (Mono-Beschriftungen, Haarlinien, Datenblatt-Anmutung) statt der warmen Karten der Nacht-Ereignisse.

- **Responsiv in zwei Gestalten**: mobil **Vollbild** (fährt von unten ein), ab 900px **Seitenpanel rechts**, das das Spielbrett schmaler macht statt es zu verdecken. Nebeneffekt, der zum Prinzip gehört: das schmalere Brett senkt die Detailstufe der Felder – die Information wandert dorthin, wo Platz ist.
- **Aufbau**: Hero-Hex (dasselbe Feld gross, volle Detailstufe) · Landschaft · Plättchen · Menschen · Flora & Fauna · Ereignisse mit Restdauer · Verbünde & Störungen · **Feldwert-Ledger** · Wissen (Fundstelle, Zeichen ◈, Landmarke, „historisch inspiriert und vereinfacht").
- **Feldwert als Ledger, nicht als Zahl**: jede Zeile nennt ihre Quelle (Plättchen, Verbund, Art im Lebensraum, Mensch, Ereignis) und ihren Beitrag; unwirksame Posten stehen ausgegraut dabei („Lebensraum passt nicht", „ohne Plättchen ohne Wirkung"). Der Spieler soll die Summe *nachvollziehen*, nicht glauben.
- **Handlungen in einer Zone unten** (Beheben, Plättchen legen, Sammlerin hierher) – diegetische Aktionen im nicht-diegetischen Rahmen, Geometrie wie in der Shell. Navigation ◀ ▶ durch die Nachbarfelder, Esc schliesst.

::: why Warum ein eigenes Element und nicht mehr Marken aufs Feld
Ab Epoche II trägt ein Feld Landschaft, Plättchen, mehrere Menschentypen, Flora, Fauna, Ereignisse und Kanten-Mods gleichzeitig. Auf ein 52px-Hex passt das nie. Die Antwort ist nicht ein volleres Feld, sondern eine **klare Arbeitsteilung**: das Feld zeigt Identität, Dringlichkeit und Ertrag – der Explorer trägt den Rest. Das ersetzt den bisherigen Feld-Inspektor (Kap. 8) und den Bottom-Sheet-Vorschlag aus `spielfeld-entlastung-v1`.
:::

Prototyp: `feld-labor-v1.html`. Debug: `?explorer`, `?feld=1,0`, `?epoche=1..5`. {.dim}

## Anatomie eines Feldes: Schichten, feste Slots, Detailstufen {idea}

Prototyp (`feld-labor-v1.html`): Mittelfeld + sechs Nachbarn, jedes Merkmal per Werkbank an- und abschaltbar, dazu Epochen-Vorlagen I–V, die dieselbe Zelle mit wachsender Last zeigen, und eine „Volllast" als Stresstest. Vorgeschlagenes Darstellungsmodell:

- **Vier Schichten**: *Grund* (Gelände, Furt-Streifen, Hang-Schraffur, Arten-Tönung, Ereignis-Schleier) → *Kern* (Petroglyphen-Glyphe des Plättchens) → *Kanten* (Verbünde/Störungen) → *Slots* (Marken).
- **Feste Slots**, damit Spieler Positionen lernen statt zu suchen: `Kern` Mitte · `Krone` oben rechts (Menschen) · `Wange` oben links (Ereignis mit Restdauer) · `Ferse` unten links (Arten als Punkte) · `Fuss` unten Mitte (Zeichen ◈) · `Zahl` unten rechts (Feldwert) · `Kanten` sechs Seiten.
- **Drei Aussagen pro Feld, hart begrenzt**: *Identität* (was ist das?), *Dringlichkeit* (braucht es mich?), *Ertrag* (was bringt es?). Budget: höchstens zwei Figuren-Scheiben, drei Artenpunkte, ein Ereignis; Überzähliges wird `+n`, nie eine Reihe aus Marken.
- **Detailstufen nach Hexbreite** – sie **nehmen Slots weg** statt alles zu verkleinern: `S <52px` nur Kern, Kanten, Zahl und ein Achtung-Punkt · `M 52–75px` zusätzlich Krone, Wange, Fuss · `L ≥76px` alles. Auf Mobile mit grossem Gebiet landet man bei S – dort trägt der Explorer die ganze Information.

::: why Drei Geometrie-Regeln, die der Prüfstand erzwungen hat
Erstens: beim Spitz-oben-Sechseck sind die **vier Boxecken leer** – Marken in `top:5%;left:5%` liegen ausserhalb der Silhouette. Alle Slots sitzen darum auf einem Ring bei ~22% Höhe. Zweitens: Marken werden in `em` relativ zu `--hexw` bemessen; feste Pixelgrössen ersticken kleine Felder. Drittens: eine Kante gehört **zwei** Feldern – der Balken sitzt mittig auf der Kantenmitte und die Gegenkante wird mitgesetzt, sonst zeichnen beide Nachbarn übereinander.
:::

Offen: ob die `Zahl` (Feldwert am Feld) dauerhaft bleibt oder nur auf Tap erscheint – sie ist bei S die einzige Zahl und zugleich das erste, was bei Gedränge stört. Ebenso offen: Menschen-Glyphen sind im Prototyp Zeichen (✦ ➤ ⌇ ⚘ ⇄ ⚔) und müssen als Petroglyphen-SVGs neu gezeichnet werden. Debug: `?lod=s|m|l`, `?size=42`, `?slots`, `?max`, `?night`. {.dim}

