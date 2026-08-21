# meine gedanken zum Editor

Was ein guter Editor für ein Spiel wie dieses braucht — abgeleitet aus den Werkzeugen,
die in `prototype/drafts/` schon stehen, und aus dem, was beim Bauen jeweils schiefging.

Zwei Dinge sind mir dabei wichtiger als alle anderen: dass die **entworfene Karte spielbar**
ist (Anforderung 1) und dass die **Asset-Pipeline einen Screenshot annimmt** und daraus ein
Asset macht, das man weiter verändern kann (eigenes Kapitel unten).

## Ausgangslage: fünf Werkzeuge, kein Editor

Es existieren bereits mehr Editoren, als es Editoren-Konzepte gibt:

| Werkzeug | Was es kann | Was es bewiesen hat |
| --- | --- | --- |
| `map-editor-v3` (Designer-Werkstatt) | Gelände, Plättchen, Arten, Fundstellen, Ereignisse, Mechanik-Zahlen — fünf Gewerke als Linsen auf einer Karte | Ein Datenobjekt, mehrere Berufe. Belegstatus + Quelle an jedem Fakt funktionieren als *Angebot*, nicht als Schranke. |
| `mechanik-labor-v1` | headless Kernloop, Bots spielen tausende Partien | Balancing ist messbar. Die **gepinnte Basis** (Ergebnis merken → Werte ändern → Delta lesen) ist die eigentliche Erfindung. |
| `ereignis-labor-v1` | Drehbuch über Jahre, Phasen, Ort, Ausbreitung, Wirkung, Folge | Ein Drehbuch **ist ein Kartengenerator** — Epoche II muss nicht gemalt werden, sie ist das Ergebnis von Epoche I. |
| `gewaesser-labor-v1` | Läufe zeichnen, alles andere rechnen | **Benennung wird gerechnet, nicht gemalt.** Bach + Bach = kleiner Fluss ist keine Regel, sondern ein Resultat. |
| `asset-editor-v1` | SVG-Tiles als Einzeldateien + Bake/Publish | Assets bleiben Dateien: im Explorer sichtbar, mit jedem Editor bearbeitbar, git-diffbar. Editieren und Veröffentlichen sind **getrennte Schritte**. |

Und trotzdem fehlt das Entscheidende, das Handbuch nennt es die **Playtest-Brücke**: *kein
Mensch kann eine in der Werkstatt entworfene Karte spielen.* Das ist keine fehlende Funktion,
das ist die Anforderung Nr. 1. Alles andere unten ist nachgeordnet.

## Die zwölf Anforderungen

### 1. Was der Editor schreibt, muss das Spiel lesen — sonst ist es kein Editor
Ein Werkzeug, dessen Ergebnis von Hand nach `world.ts` übertragen wird, ist ein Skizzenblock.
Der Test ist hart und einfach: **ein Knopf „Spielen" im Editor**, der den aktuellen Stand in
den echten Kernloop wirft. Designer, die ihre Karte nicht spielen können, entwerfen blind —
und das Labor prüft nur, was messbar ist, nicht was sich gut anfühlt.

### 2. Ein Datenmodell, viele Linsen — nicht fünf Werkzeuge
Die Gewerke (Landschaft · Natur · Technologie · Ereignisse · Mechanik) sind Sichten, keine
Programme. Sobald zwei Werkzeuge zwei Formate haben — heute `{P, MAP, START_TILES}` im Labor
gegen `{rules, tiles, species, events, funds, epochs, ceremonies}` in der Werkstatt — hat man
nicht zwei Editoren, sondern einen Übersetzungsauftrag, der nie fertig wird.

### 3. Ort und Zeit absolut speichern
Weltkoordinaten in km statt Zellindizes, absolutes Jahr statt Rundennummer. Das war die Lehre
aus dem Zoomstufen-Labor (eine Karte in Zellindizes übersteht keinen Auflösungswechsel) und
gilt genauso für Ereignisse: Von/Bis/Rundenzahl eines Drehbuchs ändern sich, das Jahr des
Flimser Bergsturzes nicht. **Absolut speichern, erst beim Anzeigen aufs Raster rechnen.**

### 4. Ein gemeinsames Effekt-Vokabular, mit Freitext als Rückfall
`Bedingung × pass/fail × Ressourcendelta` ist im Mechanik-Labor erprobt und sollte der
Werkstatt vorgegeben werden. Freitext bleibt erlaubt für alles Atmosphärische — aber als
*bewusster* Rückfall, nicht als Standard. Ein Wirkungsfeld, das nur ein Mensch lesen kann,
ist eine Wirkung, die nie geprüft wird.

### 5. Ableiten, wo ableiten möglich ist
Das ist die stärkste Eigenschaft der bestehenden Labore und die, die ein Standard-Editor nicht
hat. Der Autor setzt **Ursachen**, das Werkzeug rechnet die Folgen:

- Flusslauf zeichnen → Abfluss, Breite, Klasse, Furt, Wasserfall fallen heraus
- Gelände + Epoche → Ufer ableiten; Kartengrösse als *Ergebnis* der begehbaren Wege
- Drehbuch laufen lassen → der Kartenzustand der nächsten Epoche

Was abgeleitet ist, muss **überschreibbar** bleiben — der dreistufige Stempel *an / aus /
automatisch* aus dem Gewässer-Labor ist dafür die richtige Form. Aber der Standardfall ist die
Ableitung, nicht die Handarbeit: handgemalte Redundanz ist der Ort, an dem Widersprüche
entstehen.

### 6. Zeit ist die erste Achse, nicht ein Filter
Fünf Epochen heissen nicht fünf Karten, sondern eine Karte mit fünf Zuständen. Nötig sind
darum *Aus voriger Epoche übernehmen*, eine **Diff-Ansicht** zwischen Epochen, und die
Möglichkeit, einen Zustand als **erzeugtes Ergebnis** des vorigen zu führen. Ohne das pflegt
man dieselbe Uferlinie fünfmal — und ab dem dritten Mal falsch.

### 7. Belegstatus und Quelle an jedem Fakt
Das ist die Anforderung, die dieses Spiel von jedem Aufbauspiel trennt: das bearbeitete Objekt
ist keine Szene, sondern eine **Behauptung über die Vergangenheit**. Jeder Eintrag trägt
*belegt / wahrscheinlich / rekonstruiert / frei erfunden* plus Quelle, und das Werkzeug zeigt
die Quellenlage als Zähler. Weiche Richtwerte statt Pflichtfelder — wer ein korrigiertes
Flutdatum nur nach Review eintragen darf, trägt es nicht ein.

### 8. Messen ist Teil des Editors, nicht ein zweites Programm
Zwei Prüfungen, beide gehören neben die Bearbeitung:

- **Balance**: tausend Bot-Partien, gepinnte Basis, Delta pro Kennzahl.
- **Wahrheit**: Quellenlage, Anker-Dichte pro Epoche, Widersprüche im Datensatz.

Der Wert liegt im Delta, nicht in der Absolutzahl. „Überlebensquote 64 %" sagt nichts;
„−7 Punkte, seit Schutz von 4 auf 5" ist eine Entwurfsaussage.

### 9. Spielsicht: zeigen, was der Spieler liest
Aus dem Ereignis-Labor: eine Ansicht pro Abschnitt (Morgen · Tag · Nacht · Rundenende), die
den Text zeigt, den der Spieler dort bekommt. Damit wird prüfbar, **wann** etwas sichtbar
wird, nicht nur **dass** es geschieht. Ein Ereignis, das nur im Protokoll auftaucht, existiert
im Spiel nicht.

### 10. Undo, stabile Slugs, Schema-Validierung
Der langweilige Teil, und er trägt: *Malen ist billig, das Löschen einer über fünf Epochen
platzierten Art nicht.* Dazu stabile Slugs statt laufender Nummern — sonst zeigt eine
Fundstellen-Referenz nach dem Löschen auf den Nachbarn — und ein Schema an der Grenze
Editor → Spiel, damit ein halb gültiges JSON dort scheitert, wo es entsteht.

### 11. Jeder Zustand adressierbar
Was für die Prototypen gilt, gilt für den Editor doppelt: Debug-Query-Parameter für jeden
inneren Zustand (`?collection=`, `?epoche=`, `?feld=c,r`, `?tab=`). Ein reproduzierbarer
Zustand ist ein teilbarer Zustand — er passt in eine Notiz, in einen Bugreport, in ein
Review. Und ein Screenshot kann nicht klicken.

### 12. Mit unvollständigen Daten arbeitsfähig
Der Datensatz wird nie fertig. Ebene 2 der Pipeline deckt nur den Alpenrhein ab, grau heisst
dort *keine Daten*, nicht *leer*; die Siedlungsschicht fehlt ganz. Ein Editor, der Lücken als
Fehler behandelt, blockiert genau die Arbeit, die die Lücken füllt. Lücken sichtbar machen,
Arbeit nicht verhindern.

## Die Asset-Pipeline: Screenshot rein, editierbares SVG raus

Das ist mir das Wichtigste, darum ein eigenes Kapitel. Ein Screenshot ist der schnellste Satz,
den man über ein Aussehen sagen kann — „so etwas, aber grüner". Die Pipeline muss ihn deshalb
als **Eingabe** annehmen, nicht nur fertige SVGs. Und sie muss ihn in etwas verwandeln, das
danach noch **veränderbar** ist; sonst hat man ein Bild importiert, kein Asset gewonnen.

### Der Ablauf

| Schritt | Was passiert | Warum genau hier |
| --- | --- | --- |
| 1 · Ablegen | Bild fällt in den Editor — Drag & Drop, vor allem aber **Einfügen aus der Zwischenablage** | Ein Screenshot lebt im Clipboard, nicht auf der Platte. Wer erst „speichern unter" verlangt, hat den Weg schon verloren. |
| 2 · Einordnen | Was ist das: **Hex-Tile · Glyphe/Icon · nur Referenzbild**? Vorschlag aus Seitenverhältnis und Alphakanal, Bestätigung durch den Menschen | Die drei Ziele sind unvereinbar: ein Tile bekommt sechs Layer und Palette, eine Glyphe ist **ein** Pfad in `currentColor`, ein Referenzbild wird nie zum Asset. |
| 3 · Einpassen | Hexkontur finden, auf `viewBox 0 0 100 115.47` normalisieren (Zuschnitt, Skalierung, ggf. flat-top → pointy-top drehen), Kantenmitten treffen | Ohne diesen Schritt sitzt das Bild schief im Feld und passt an keiner Kante zum Nachbarn — das Kanten-Matching des Art-Direction-Handbuchs fällt sonst still aus. |
| 4 · Palette angleichen | Farben auf die Variablen der Zielkollektion quantisieren (`--ground-base`, `--veg-primary`, `--water`, …) — **vor** dem Tracen | Das ist der Schritt, der aus einem Fremdbild ein Mitglied der Kollektion macht. Danach ist es umfärbbar, weil es nur noch `var()` kennt. |
| 5 · Vektorisieren | pro Farbband ein Pfadsatz, zugeordnet auf `base-terrain / vegetation-primary / vegetation-secondary / water-features / climate-indicators / human-traces`, geclippt mit `clipPath#hex` | Layer entstehen aus den Farbbändern quasi von selbst — aber nur, wenn die Palette vorher steht (Schritt 4). |
| 6 · Vorschlagen | Original · Trace · Trace über Original nebeneinander, dazu die Regler; **annehmen / nachregeln / verwerfen** | „Der Editor *schlägt vor*" ist die richtige Formulierung: nichts wird überschrieben, bevor jemand hingesehen hat. |
| 7 · Veröffentlichen | Datei in `pipeline/assets/<kollektion>/` schreiben, dann der bestehende Weg: Bake → `terrain-assets.bundle.js` → Karte | Unverändert übernehmen, was `asset-editor-v1` schon richtig macht — Editieren und Veröffentlichen bleiben getrennte Schritte. |

### Die Falle: „ist SVG" heisst nicht „ist editierbar"

Ein naiver Auto-Trace liefert 3 000 Pfade in 40 Farben. Das ist formal ein SVG und praktisch
ein Bitmap mit Zusatzkosten: nicht umfärbbar, nicht layerweise abschaltbar, im git-Diff nur
Rauschen, und bei 32 px Matsch. Der Zweck ist aber ausdrücklich, **dass das Asset danach
geändert werden kann** — also ist die Messlatte nicht „sieht aus wie das Original", sondern:

- eine **Handvoll Pfade pro Layer**, von Hand nachziehbar
- Farben ausschliesslich als `var(--…)` der Kollektionspalette
- die sechs Layernamen vorhanden und einzeln abschaltbar
- lesbar bei 32 px, nicht nur bei 256 px

Daraus folgt: **Vereinfachung ist ein Pflichtparameter, kein Feinschliff.** Die Regler, die es
braucht, sind Farbanzahl (= Palettengrösse der Kollektion), Glättung, Mindestfläche (Flecken
unter *x* % fallen weg) und Kurven statt Polygonzügen. Ein Trace mit 3 000 Pfaden ist nicht
„noch nicht optimiert", er ist gescheitert.

### Der Rückfall: Raster darf spielbar sein

Wenn der Trace nichts Brauchbares hergibt, wird das Bild **als Tile eingebettet** — das PNG in
`base-terrain`, mit `clipPath#hex` geclippt, der Eintrag als `raster` markiert. Damit ist die
Idee in derselben Minute auf der Karte sichtbar und die Vektorisierung eine offene Aufgabe
statt eines Blockers. Gleiche Haltung wie Anforderung 12: Lücken sichtbar machen, Arbeit nicht
verhindern.

### Herkunft mitschreiben

Screenshots kommen von irgendwoher. Ein Asset trägt darum ein **Herkunftsfeld** — *eigene
Skizze / Foto / erzeugt / fremdes Werk (nicht auslieferbar)* — analog zum Belegstatus an den
Fakten (Anforderung 7). Das kostet einen Klick beim Ablegen und beantwortet später die Frage,
die sonst niemand mehr beantworten kann. Der Bake kann darauf prüfen und alles, was als
fremd markiert ist, aus dem Bundle heraushalten: dann darf man während des Entwurfs mit einer
fremden Vorlage arbeiten, ohne dass sie versehentlich mit ausgeliefert wird.

### Das Rezept bleibt in der Datei

Neben dem `.svg` liegt die Vorlage als `<name>-source.png`, und im SVG steht als Kommentar das
**Trace-Rezept**: Quelldatei, Palette, Farbanzahl, Glättung, Mindestfläche. Damit ist der
Schritt reproduzierbar — wechselt die Kollektionspalette, wird nachgetract statt nachgemalt —
und die Datei erklärt sich selbst. Beides bleibt Text bzw. Bild im Repo: sichtbar im Explorer,
diffbar in git, öffenbar in jedem Vektoreditor. Das ist dieselbe Eigenschaft, die
`asset-editor-v1` gegenüber einer Blob-Datenbank gewonnen hat.

### Zwei Nebenwirkungen, die dafür sprechen

1. **Der Weg funktioniert rückwärts.** Ein Screenshot *aus dem laufenden Spiel* ist die
   schnellste Vorlage für die nächste Kollektion — Karte abfotografieren, überarbeiten,
   zurückwerfen.
2. **Die Kollektion wird zur Einheit der Arbeit.** Dieselbe Vorlage, zweimal durch verschiedene
   Paletten geschickt, ergibt zwei Epochen-Varianten desselben Motivs. Genau der Fall, den die
   sieben bestehenden Kollektionen von Hand durchspielen.

## Was er ausdrücklich nicht braucht

- **Review-Gates, Schreibrechte pro Schicht, Simulations-Zertifizierung.** Im Handbuch bereits
  verworfen und aus dem richtigen Grund: sie schützen ein System mit hunderten Beitragenden
  und kosten genau das, was die Werkstatt-Phase braucht — schnelles gemeinsames Basteln.
- **Prozedurale Weltgenerierung als Prinzip.** Entschieden ist die gestaltete Welt; eine
  erzeugte Landschaft kann keine belegte Fundstelle tragen. Erzeugt wird die *Folge* eines
  Entwurfs (Anforderung 5/6), nicht die Welt selbst.
- **Ein Universal-Inspektor im Engine-Stil.** Ein Property-Grid über beliebige Objekte erzeugt
  Dateneingabe, keine Entwurfsarbeit. Die Linsen der Gewerke sind mehr wert als jede
  generische Vollständigkeit.
- **Live-Kollaboration.** Ein JSON, git-diffbar, reicht in dieser Phase — und ist als
  Konfliktmodell ehrlicher.

## Prüfsteine

Fragen, mit denen sich jeder Editor-Entwurf in Minuten bewerten lässt:

1. Kann ich das Entworfene **jetzt spielen**, ohne eine Datei zu kopieren?
2. Wie viele Formate liegen zwischen Editor und Spiel? (Antwort > 1 ist ein Befund.)
3. Was passiert mit meiner Karte, wenn die Auflösung wechselt?
4. Wie sieht der Spieler, was ich gerade geändert habe — und in welchem Abschnitt?
5. Wo steht, woher dieser Fakt kommt?
6. Kann ich eine Änderung gegen einen gemerkten Stand messen?
7. Was kostet es, eine über fünf Epochen platzierte Art zu entfernen?
8. Ist der Zustand, den ich sehe, per URL wiederherstellbar?
9. Kann ich einen Screenshot **einfügen** und in derselben Minute sein Ergebnis auf der Karte
   sehen?
10. Ist dieses Ergebnis danach von Hand nachziehbar — zählbare Pfade, `var()`-Farben, die sechs
    Layer?
11. Steht in der Datei, woher das Bild kam und mit welchen Werten getract wurde?

## Nächste Schritte

Zwei Stränge, die sich nicht blockieren:

**Daten.** Nicht ein besserer Editor, sondern **ein Format und ein Loader**. Konkret: das
Effekt-Vokabular des Mechanik-Labors als gemeinsames festschreiben, ein Karten-JSON definieren,
`world.ts` und Prototypen daraus lesen lassen, Schema-Validierung an die Grenze. Danach ist
jedes der fünf bestehenden Werkzeuge eine Linse auf demselben Objekt — und die Frage nach „dem"
Editor löst sich in Arbeit auf, die man einzeln erledigen kann.

**Assets.** Der Ablegen-Weg war davon unabhängig baubar, weil beide Enden schon standen: der
`asset-server.mjs` liest und schreibt Dateien, `bake-terrain-assets.mjs` bündelt, die Karte
liest das Bundle, und `_template.svg` gibt die Zielform vor. Gefehlt hat genau das Stück in der
Mitte — **Einpassen → Quantisieren → Tracen → Vorschlagen**.

Das steht jetzt als `prototype/drafts/asset-drop-v1.html` (21. Aug 2026). Zwei Dinge daran
haben die Anforderungen oben korrigiert:

1. **Die Pfadzahl ist als Messlatte untauglich.** Oben stand „3 000 Pfade" als Bild des
   Scheiterns — das gilt für Tracer, die einen Pfad je Fleck ausgeben. Wer nach Farbbändern
   traced, hat *immer* eine Handvoll Pfade, mit beliebig viel Rauschen darin. Die ehrlichen
   Zahlen sind **Flecken** (Teilpfade) und **Punkte**; dazu kommt als Messwert für „lesbar bei
   32 px" die Zahl der Flecken, die dort unter einen Bildpunkt fallen — im Werkzeug *Splitter*.
2. **Der Umriss bricht an der Hexspitze.** Zeilen dicht am oberen Punkt tragen nur wenige
   Bildpunkte; eine Schwelle von 2 % der Breite verwarf sie, der Umriss kam 4 px zu kurz und
   das ganze Feld saß danach leicht vergrössert im Rahmen. Ein Zuschnitt, der auf „genug
   Inhalt in der Zeile" prüft, ist für ein Sechseck grundfalsch.

Gemessen am Prüfbild (`pastell/wald.svg` gerastert und zurückgetract): 3 Pfade, 66 Punkte,
3.7 kB gegen 0.7 kB im Original. Was verloren geht, ist benennbar — die
`opacity="0.6"`-Überlagerungen des Originals werden zu Flächenfarben eingebacken.
