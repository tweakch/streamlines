---
nummer: 02
id: k2
titel: Kernmechaniken
untertitel: Das Regelgerüst, das für alle Epochen gilt.
banner: 2 KERNMECHANIKEN
---

## Tag/Nacht-Rhythmus {done}

Inspiriert von Werwolf: **Tag** = bauen, bewirtschaften, planen. **Nacht** = gleichzeitiges Aufdecken dessen, was im Dunkeln geschah. Der Übergang ist immer gleich (Konsistenz), aber die *Bedeutung* der Nacht ändert sich pro Epoche radikal:

| Modul | Nacht-Thema |
| --- | --- |
| I | Überleben (Raubtier, Kälte – Furcht ist real) |
| II | Sichtbare vs. verwaltete Macht |
| III | Weltlich vs. geistlich |
| IV | Erlaubt vs. verboten |
| V | Fortschritt vs. Kosten – das elektrische Licht *bricht* die eigene Mechanik |

::: why Alleinstellung
Die Spielmechanik selbst wird Teil der Geschichtserzählung, statt nur die Kulisse zu tauschen. In Modul I im Prototyp umgesetzt.
:::

**Der Rundenablauf, wie er gebaut ist** (`app/src/stromlinien/engine.ts`) — bis August 2026 stand er nirgends geschrieben:

| Abschnitt | Was geschieht | Was der Spieler tut |
| --- | --- | --- |
| **Morgen**<br><span class="dim">startDay</span> | Plättchen nachziehen (Hand 3–4, eines mehr wenn ein Ereignis es gab), **Einkommen kassieren** aus allen gelegten Plättchen inkl. Verbünden und Sammlerin-Bonus; Tagesmarken zurücksetzen | liest, was über Nacht geschah |
| **Tag** | freier Handlungsraum, keine Zugreihenfolge — es gibt keine getrennten Züge | **ein Plättchen legen** (Pflicht, sonst endet der Tag nicht) · optional Werkzeug bauen · Sammlerin ✦ und Jäger ➤ je bis 2 Schritte · Felder inspizieren |
| **Nacht**<br><span class="dim">BEGIN → REVEAL</span> | Verdunkelung (1,9 s, überspringbar), dann wird **genau eine Karte aufgedeckt**: der **Anker**, wenn die Runde einen hat — sonst eine gewichtete Streu-Nacht. Ihr Effekt greift sofort, der Stamm isst **−1 Nahrung** | nichts — Aufdeckung ist final, es gibt kein Undo über die Nacht hinweg |
| **Rundenende**<br><span class="dim">END_NIGHT</span> | Hungerprüfung (zweimal hintereinander leer → „Der Stamm zieht weiter"), **Sesshaftigkeit += min(N, Schutz, Material)** gekappt 0–3, Runde++; nach der letzten Runde die **Zeremonie** | bestätigt |

Darüber liegen zwei größere Takte: die **Epoche** (im Prototyp 10 Runden = 8 000 Jahre, also ~800 Jahre je Runde) und die **Kampagne** (5 Epochen, dazwischen je eine Zeremonie). {.dim}

Der Rhythmus wird gerade auf **vier Takte** erweitert — siehe die nächste Karte. Der „Morgen" oben ist dabei kein Abschnitt mit eigener Entscheidung, sondern eine Verbuchung vor dem Zug; genau das ändert sich. {.dim}

## Vier Tageszeiten: jeder Takt stellt eine andere Frage {concept}

Aus dem Spieltest von `erkundung-v1`: der Zweitakt Tag/Nacht bündelt zu viel im „Tag" und lässt den Ertrag unsichtbar. **Dämmerung** und **Abenddämmerung** kommen dazu — nicht als Zierrat, sondern weil jeder Takt *eine* Frage bekommt und Kosten und Lohn dadurch auseinandertreten. Gebaut in `erkundung-v2`.

| Takt | Die Frage | Was geschieht |
| --- | --- | --- |
| **Morgendämmerung** | Was gibt das Land, was nimmst du mit? | Plättchen liefern ihr Einkommen, die Hand füllt sich — dann höchstens **eine Effektkarte**: Wegzehrung (−1 Nahrung → +1 Ausdauer für alle, heute) · Späher (−1 Nahrung → +1 Sichtweite, heute) · Rasttag (+2 Nahrung, *Sperre:* niemand geht diese Runde). Keine zu spielen ist auch ein Zug — dann einfach aufbrechen (Knopf, keine Karte; siehe „Formensprache“) |
| **Tag** | Wohin gehen die Menschen? | Bewegen über das Gelände (Ausdauer), entdecken, **ein Plättchen legen** |
| **Abenddämmerung** | Was hat der Weg eingebracht? | **Erntebuch**: jede Zeile mit Quelle (bewirtschaftetes Plättchen · Vorkommen · Jagdglück · Neuland) — dann **eine Verarbeitung**: Werkzeug (−2 Mat → +2 Schutz) · **Schuhwerk** (−2 Mat → +1 Ausdauer, dauerhaft) · Trockenfleisch (−2 Nahrung → 1 Vorrat, fängt eine Hungernacht) · Schnitzwerk (→ +1 Kultur) |
| **Nacht** | Was geschieht im Dunkeln? | unverändert: eine Karte, Anker oder Streu-Nacht, −1 Nahrung, Hungerprüfung, Sesshaftigkeit |

::: why Warum der Ertrag einen eigenen Takt braucht
Bis v1 verschwand der Lohn im Einkommen des nächsten Morgens: Bewegung hatte sichtbare *Kosten* (Ausdauer) und keine sichtbare *Gegenbuchung*. Der Abend ist die Lohnkasse, und weil er die Ernte **Zeile für Zeile mit Quelle** ausweist, wird zum ersten Mal ablesbar, *welcher Weg* sich bezahlt hat — nicht nur, dass es mehr wurde. Die Verarbeitung direkt danach macht aus dem Ertrag eine Entscheidung, statt ihn nur gutzuschreiben.
:::

::: why Schuhwerk: die Schleife, die sich selbst antreibt
Gutes Laufen kauft besseres Laufen — Material vom Weg wird zu +1 Ausdauer auf Dauer, und die trägt am nächsten Tag weiter. Das ist die eine Stelle, an der eine Belohnung die *Fähigkeit* erhöht statt den Vorrat, und sie stand in der Reichweiten-Tabelle dieses Kapitels schon als „wie sie wächst: Schuhwerk, Späher, Hund" — jetzt ist sie eine Regel.
:::

Offen: ob Vorbereitung und Verarbeitung je *eine* Wahl bleiben (derzeit ja — die Knappheit macht sie interessant), ob spätere Epochen eigene Takt-Bedeutungen bekommen wie die Nacht, und wie sich die vier Takte zum „Punkt als Interaktionssprache" verhalten. Die Vorbereitung ist inzwischen keine Knopfliste mehr, sondern sind **Effektkarten** (siehe „Formensprache"); die Abend-Verarbeitungen sind noch Knöpfe — offen, ob auch sie Karten werden sollten. {.dim}

## Formensprache: die Form sagt, was eine Karte tut {concept}

Bis `erkundung-v2` sahen Landplättchen, Sofort-Effekte und bloße Entscheidungen alle gleich aus — abgerundete Rechtecke in einer Reihe. Der Spieler musste den Text lesen, um zu wissen, was ein Ding *ist*. Jetzt entscheidet die **Silhouette**:

| Form | Bedeutung | Beispiele |
| --- | --- | --- |
| **Sechseck** | kommt aufs Brett — dieselbe Silhouette wie das Feld, das es aufnimmt | die Handkarten: Uferlager, Auenwald, Fischgrund, Höhle, Hochterrasse, Feuerstein, Pfahlbau |
| **Rechteckige Karte** | wirkt *sofort* und ist danach verbraucht; trägt Art, Wirkung, Preis — und die Sperre, wenn sie eine hat | die Effektkarten der Dämmerung: **Wegzehrung**, **Späher**, **Rasttag** |
| **Knopf** | keine Karte, bloße Wahl — auch „nichts spielen“ ist ein Zug | »Aufbrechen · Tag beginnen«, »Abend · Ernte einbringen«, die Abend-Verarbeitungen |

::: why Warum „ohne Umstände aufbrechen“ keine Karte sein darf
Als vierte Option in der Reihe stand sie da wie eine Karte, die man spielt — und log damit über ihre Natur: sie kostet nichts, gibt nichts und ist beliebig oft „verfügbar“. Eine Karte, die nichts tut, entwertet die drei, die etwas tun. Als Knopf gelesen kippt die Frage von „welche der vier spiele ich?“ zu „lohnt eine Karte den Preis — oder gehe ich einfach los?“. Das ist dieselbe Entscheidung mit ehrlicherer Grammatik.
:::

::: why Der Rasttag ist der Beweis, dass die Kartenform trägt
Er ist die einzige Vorbereitung mit einer **Sperre**: +2 Nahrung, aber niemand geht diese Runde (alle Ausdauer auf 0). Genau dafür braucht eine Karte einen eigenen Platz für die Kehrseite — auf der Karte steht die Sperre in Rot unter der Wirkung. Ein Knopf mit Untertitel hätte das nie sauber tragen können.
:::

**Ziehen & Ablegen** gehört zur Sechseckform: die Karte wandert als Schatten am Finger aufs Feld, nur gültige Felder nehmen sie an (grüner Rand). Umgesetzt über **Pointer Events**, nicht HTML5-Drag-and-Drop — das gibt es auf dem Telefon nicht, und dort wird gespielt. Unter 8&nbsp;px Bewegung gilt der Zug als **Tipp**, damit der alte Weg (antippen, dann Feld) erhalten bleibt.

Offen: ob die Effektkarten aus einem eigenen Stapel *gezogen* werden (dann wären sie knapp und die Dämmerung hätte echte Varianz) statt immer dieselben drei zu sein — das wäre der Anschluss an den „Kartenpunkt“ aus der Interaktionssprache-Karte. Ebenfalls offen: ob gelegte Plättchen sich wieder aufnehmen lassen (heute ist ein Zug endgültig). {.dim}

## Der Lohn der Höhe: warum man den Hang hochsteigt {concept}

Der schärfste Befund des Spieltests: „*Ich hatte keinen Grund, den Hang hochzugehen — was ist da oben für mich?*" In `erkundung-v1` kostete der Aufstieg 2 Ausdauer und gab nichts, was der Talboden nicht auch gab. Ein Gelände, das teurer ist, **muss** etwas geben, das nur es gibt. Vier Antworten, alle in `erkundung-v2` gebaut:

| Was die Höhe gibt | Regel |
| --- | --- |
| **Weitblick** | Die Sichtweite kommt vom Gelände, auf dem man *steht*: Hang **4** Felder, Talboden 2. Ein Aufstieg deckt einen halben Talabschnitt auf; Bergland wird gesehen, aber nicht durchschaut. |
| **Vorkommen** | **▲ Silex · ● Ocker · ◇ Bergkristall** liegen ausschließlich am Hang. Eingebracht wird, wer am Abend darauf steht. **Ohne Silex gibt es kein Werkzeug** — die Werkzeugschleife hängt am Aufstieg, nicht an einer Handkarte. |
| **Jagd von oben** | Wildrudel ziehen jede Nacht ein Feld durchs offene Land. Der Jäger im Nachbarfeld bringt +1 Nahrung, **der Jäger auf dem Hang mit Blick darauf +2 und die Fährte** (er weiß, wohin es zieht). Gute Aufstellung wird bezahlt, nicht bloße Anwesenheit. |
| **Übersicht über die Funde** | Spuren ◈ scheinen auf, sobald ihr Feld gesichtet ist. Der Aufstieg zeigt damit, *wo die Archäologie liegt* — die Höhe ist der Survey. |

::: why Die Einladung muss vor dem Schritt stehen
Ein Lohn, den man erst nach dem Zug sieht, ändert das Verhalten nicht — er bestätigt es nur. Darum trägt in v2 *jedes Zielfeld* die Zahl `+n`: so viele unbekannte Felder deckt genau dieser Schritt auf, gerechnet mit der Sichtweite des Zielgeländes. Hänge sind dadurch schon vor dem Antippen die auffälligsten Ziele auf dem Brett (zusätzlich grün gerandet), und der Spieler entscheidet mit der Information, statt sie sich zu erarbeiten.
:::

::: why Warum die Vorkommen nicht als Plättchen kommen
Sie liegen *im Gelände*, nicht in der Hand. Damit ist der Wert eines Feldes zum ersten Mal eine Eigenschaft der Karte und nicht des Decks — und die Frage „wohin gehen wir?" hat eine Antwort, die das Deck nicht überstimmen kann. Das Feuerstein-Plättchen bleibt: auf einer Silexader gebaut liefert es dauerhaft (+1 Material/Tag) und gibt die volle Authentizität, daneben gebaut liefert es nichts — die Fundstelle „Silex-Abbaustelle" liegt genau dort.
:::

Offen: ob Vorkommen erschöpfen (endlicher Ertrag statt Dauerquelle), ob Wild in späteren Epochen zu Weidevieh wird, und ob die Sichtweite an Ausrüstung hängen darf (Fernsicht als Technologie). {.dim}

## Der Punkt: eine Interaktionssprache statt Menüs {idea}

Aus den Notizen zum Spielablauf (`notes/gedanken-zum-spielablauf.md`): Alles, was der Spieler tun *kann*, liegt als leuchtender Punkt auf dem Brett. Keine Hand, keine Werkzeugleiste, kein Menü im Spielfeld – das Brett ist die Bedienung.

| Punkt | erscheint | gibt genau |
| --- | --- | --- |
| **Kartenpunkt** ○ | am Morgen, einer je Stapel | eine Karte (Mensch · Ausrüstung · Land) |
| **Legepunkt** | wenn eine Karte auf der Hand liegt | die Wahl des Feldes |
| **Schrittpunkt** | auf jeder eigenen Person | ein Ziel in Reichweite |
| **Wirkungspunkt** ◆ | wo Ausrüstung oder Verbund etwas erlaubt | den Effekt („Zum Wasser &gt;") |
| **Ereignispunkt** ! | am Vorzeichen-Morgen | das Handlungsfenster (2 Antworten mit Preis) |
| **Nachtpunkt** ☾ | wenn kein anderer Punkt mehr offen ist | die Aufdeckung |

::: why Der Nachtpunkt ist der Trick
Heute endet der Tag, weil eine versteckte Bedingung erfüllt ist (mindestens ein Plättchen gelegt, `engine.ts: BEGIN_NIGHT`). Mit dem Nachtpunkt wäre die Bedingung sichtbar: Solange irgendwo noch ein Punkt leuchtet, ist Tag – leuchtet nur noch der Mond, ist der Tag zu Ende. Kein „Nacht beginnen"-Knopf, den man zu früh drückt, keine Regel, die man nicht kennt.
:::

**Ein Zug = ein Punkt**, nicht eine Runde, nicht eine Person – die Einheit, in der gedacht, gespeichert und rückgängig gemacht wird: **atomar** (ein Antippen führt zu genau einem neuen Zustand), **speicherbar** (jeder Punkt ist ein Autosave-Punkt), **rückholbar bis zur Nacht** (innerhalb des Tages darf zurückgenommen werden, über die Nacht hinweg nie – Aufdeckung ist final), **beschriftet** (ein Punkt sagt seinen Preis, bevor man ihn antippt).

Daraus folgt eine Zug-Ökonomie **ohne Zähler**: je Stapel ein Kartenpunkt am Tag, je Person ein Schrittpunkt, je Ausrüstung ein Wirkungspunkt (verschwindet nach Gebrauch, kommt morgen wieder – Ausrüstung begrenzt sich damit selbst, ohne Aktionspunkte-Buchhaltung), Legepunkte solange Karten auf der Hand liegen – das **Handlimit ist die eigentliche Bremse**. Ein Tag in Epoche I wären damit ~5–7 Antippen, die richtige Grösse für einen Bus-Halt.

**Ein Punkt erscheint nur, wo es etwas zu entscheiden gibt** – kein allgemeines Tutorial-Konzept, sondern eine Spielregel: Die erste Personenkarte hat kein Wohin, also fragt das Spiel nicht, sondern legt sie sofort („weil es die erste ist"). Damit erklärt sich der Einstieg von selbst und verschwindet, sobald es echte Wahlen gibt – ohne „Tutorial überspringen"-Knopf.

Passt zum bestehenden Drei-Stapel-Rhythmus (Mensch, Ausrüstung, Land, Kap. 1) und dem Ereignisebenen-Schichtenmodell (Kap. 4): je Epoche kommt ein Stapel dazu, statt Regeln zu ersetzen – Kandidaten Tier (Epoche 2, Zähmen), Bau/Institution, Wissen/Schrift, Maschine. Offen: die Handlimit-Zahl (Notizen schlagen 3–4 vor), ob die im Tag freie Reihenfolge irgendeine Sperre braucht (z. B. Bewegung nach dem Legen, damit Kundschaften nicht immer dominiert), und wie sich das konkret in `engine.ts` verzahnt. {.dim}

## Der Auftakt: ein Licht aus dem Nebel {concept}

Was zwischen „Spielen“ und dem ersten Zug passiert — entschieden im August 2026, gebaut als Prototyp `prototype/drafts/auftakt-v1.html`, in der App noch nicht.

| Schritt | Was zu sehen ist |
| --- | --- |
| **1 · Das UI geht** | Titelbild blendet *langsam* weg (≈1,5 s, Unschärfe und ein Hauch Verkleinerung) — es verlässt die Szene, es schaltet nicht um |
| **2 · Ein Feld, sechs Nachbarn** | Das Mittelfeld tritt aus dem Nebel, dann die sechs Nachbarn der Reihe nach (220 ms Abstand). Die Nachbarn bleiben **halb** verdeckt: Nebelhaube von oben, unten bleibt Gelände sichtbar |
| **3 · Das Licht** | Aus dem **Süden** wächst ein Schein, daraus tritt der **Glut-Orb**, kommt über dem Mittelfeld zur Ruhe, wiegt sich, beleuchtet das Feld — und **lockt**: zwei Ringe laufen nach außen, ein Wort steht darunter. Er ist **klein und golden** und sein Schein schwach — ein Licht im Nebel leuchtet, es strahlt nicht. Er **steht nicht still**: er zieht eine flache Ellipse über dem Blatt, und was sein Schein streift, gibt Antwort — **die Hexkanten fangen das Gold, der Nebel weicht**. Kommt jemand nahe — Zeiger drüber oder Finger drauf — sammelt sich ein **Tropfenkranz** um den Kern und beantwortet die Frage „ist das anfassbar?“, bevor sie gestellt wird |
| **4 · Die erste Entscheidung** | Antippen → der Orb verglüht, zwei Karten steigen auf: **Jäger** (Fleisch & Fell · weite Wege · Ertrag schwankt) oder **Sammler** (Beeren & Wurzeln · kurze Wege · Ertrag verlässlich). Eine davon wählen, dann eine Folgekarte und der erste Tag |

::: why Warum das Licht wandert
Ein stehendes Licht beleuchtet eine Kachel; ein wanderndes beleuchtet *die Welt Stück für Stück* und sagt damit in einer Bewegung, was das ganze Spiel ist: der Nebel weicht dort, wo ihr hinschaut. Die Kanten, die es streift, sind derselbe Gedanke wie die Fundstelle, die man erst sieht, wenn man dort war.
:::

::: why Warum ein Orb und kein Knopf
An dieser Stelle ist noch nichts erklärt — kein Bedienelement hätte einen Ort, an dem es verständlich wäre. Ein Licht, das sich bewegt und ruft, braucht keine Beschriftung, um „antippen“ zu bedeuten. Es ist damit die erste Instanz der **Interaktionssprache aus leuchtenden Punkten** (Karte oben): der Auftakt ist der Punkt, den man nicht verpassen kann.
:::

::: why Warum die Nachbarn nur halb im Nebel liegen
Ein ganz zugedecktes Feld ist ein grauer Fleck und erzählt nichts. Halb verdeckt heißt: dort *ist* etwas, ihr wisst nur noch nicht was — dieselbe Haltung wie der Nebel des Ungespielten auf der Weltkarte, nur einen Maßstab tiefer.
:::

**Jäger oder Sammler ist keine Klassenwahl.** Der Prototyp sagt es im Text: „Beides lernt ihr später. Der Anfang bestimmt nur, was euch leichter fällt.“ Die Wahl färbt den Einstieg (wanderndes Lager mit Fundstellen an den Wechseln ↔ Lager am Ufer, Wissen um die Hänge wächst schneller), sie schneidet nichts ab. Sie passt damit zu den zwei Personenarten, die das Spiel ohnehin kennt (Sammlerin ✦ und Jäger ➤).

::: gap Was fehlt
Zwei Fragen sind offen: (1) läuft der Auftakt bei *jeder* neuen Partie oder nur beim ersten Mal je Profil? (2) kostet die Wahl mechanisch etwas (Startressourcen, Plättchen) oder färbt sie nur? Beides erst nach dem ersten Spielgefühl entscheiden.
:::

Der Glut-Orb ist als Baukasten-Primitive gebaut (`SOT.orb()` in `prototype/kit/`, Musterbogen-Abschnitt „Glut-Orb“) — er soll auch anderswo einladen können, wo eine Stelle zum Antippen sonst unsichtbar bliebe. {.dim}

## Vier Ressourcen & min()-Fortschritt {done}

Nahrung, Schutz, Baumaterial, Kultur – pro Epoche unterschiedlich gewichtet. Fortschritt ("Sesshaftigkeit") pro Runde = `min(schwächste Ressourcen)`, gekappt auf 0–3.

::: why Warum min() statt Summe
Erzwingt echte Balance: Wer nur Nahrung hortet und Schutz vernachlässigt, kommt nicht voran – und ist zugleich anfälliger für Nachtereignisse. Formel und Erlebnis hängen spürbar zusammen.
:::

## Der Fluss als aktiver Akteur {done badge="Umgesetzt (teilweise)"}

Nicht Kulisse, sondern Mitspieler: Pegel und Hochwasser als Ereignisse (Anker "Der See steigt" im Prototyp), Furten als Überquerungspunkte. Geplant für Modul V: der Spieler begradigt den Fluss selbst – Landgewinn gegen späteres Risiko, historisch die Rheinkorrektion.

Hochwasser durchläuft alle Epochen, aber die Antwortmöglichkeiten wandeln sich: ausweichen → römische Dämme → kollektive Hilfe → Grenzprobleme → Regulierung mit unbeabsichtigten Folgen. {.dim}

## Verbund-Boni {done}

- Fischgrund neben Lager/Pfahlbau → +1 Nahrung/Tag ("Fangplatz")
- Auenwald neben Lager/Pfahlbau → +1 Material/Tag
- Höhle neben Hochterrasse → +1 Schutz (einmalig)
- Zwei Pfahlbauten nebeneinander → Dorf, +1 Kultur (einmalig)

Verbünde wirken auch **über Furten hinweg** – gutes Platzieren wird räumliches Denken.

## Menschen als bewegliche Elemente {done}

Zwei Figuren mit täglicher Entscheidung, max. 2 Schritte über verbundene Plättchen:

- **Sammlerin ✦** – bewirtschaftet ihr Plättchen: +1 Ertrag auf Wald, Feuerstein, Fischgrund oder Lager
- **Jäger ➤** – +2 Schutz, solange er im Tal steht (zählt in Nachtprüfungen, Fortschritt, Endwertung)

**Ausdauer statt Schritte** (`erkundung-v2`): Sammlerin 1, Jäger 2. Das Gelände kostet — Flachland und Furt 1, der Aufstieg auf einen Hang 2, Berg gar nicht. Damit ist der Jäger nicht „schneller", sondern **der einzige, der aus dem Stand hinaufkommt**, und die beiden Rollen teilen sich das Tal von selbst: sie den Talboden, er die Höhe. Dauerhaft wächst die Ausdauer nur über **Schuhwerk** (Abendverarbeitung, +1 für immer), heute zusätzlich über **Wegzehrung** in der Dämmerung.

Offen: weitere Rollen in späteren Epochen (Händler, Mönch, Ingenieur?) und ob ein dritter Mensch die Aufteilung Tal/Höhe kaputt macht. {.dim}

## Reichweite als Wachstumsschraube: das gespielte Gebiet wächst durch Bewegung {concept}

Aus den Notizen zum Spielablauf: Die Karte wächst nicht nach Fahrplan, sondern **als Folge der Züge der eigenen Menschen** – die Reichweite der Sammlerin/des Jägers ist die einzige Wachstumsschraube. Wer nicht wandert, spielt die Epoche auf wenigen Feldern: weniger Ertrag, weniger Fundstellen, weniger Zeichen, ohne dass das verboten wäre. Die Karte selbst wird damit zum Fortschrittsbalken, und der Nebel des Ungespielten (Kap. 8) hört auf, reine Auswahlhilfe zu sein.

| Träger | Reichweite | wie sie wächst |
| --- | --- | --- |
| Sammlerin ✦ | 1 | Pfade, Träger, Boot |
| Jäger ➤ | 2 | Schuhwerk, Späher, Hund |
| geritten | 3–4 | Zähmen (ab Epoche 3+: Pferd, Rind als Zugtier) |
| Ereignis | — | schiebt die Grenze ohne Zutun (Flut legt Kies frei, Rom baut die Strasse) |

::: why Karte gewinnen ist nicht immer gut
Wenn ein Ereignis die Grenze verschiebt, geschieht das gegen den Willen des Spielers: Die römische Strasse öffnet das Ried, das vorher niemand betrat, und mit ihr kommen Durchmarsch-Ereignisse. Das ist der ehrlichste Weg, Kartenwachstum nicht zu einer reinen Belohnungskurve zu machen.
:::

Löst direkt die oben offene Frage der „Menschen als bewegliche Elemente"-Karte („Bewegungsreichweite skalieren, wenn das Tal wächst"). Offen: ob der Spieler ein kartenvergrösserndes Ereignis ablehnen darf („Wir gehen nicht ins Ried"). Bewusst ausgeklammert: Kartengrösse/Zoomstufe je Epoche selbst – das wird derzeit separat abgeklärt (Kap. 8, Zoomstufen-Labor). {.dim}

**Prototypisiert in `erkundung-v1`, weitergeführt in `erkundung-v2`:** der Epoche-I-Kernloop auf einer 9×12-Karte mit Nebel — bekannt ist, was begangen wurde. Sammlerin ✦ 1 **Ausdauer** am Tag, Jäger ➤ 2; Flachland und Furt kosten 1 Schritt, der Hang 2 (nur der Jäger steigt), Berg sperrt Weg und Blick, der Fluss trägt sein Ufer im selben Feld und ist nur an Furten querbar. Sicht folgt dem Tal (Breitensuche statt Zirkel, aus `kartenwachstum-v1` übernommen und von km-Äquivalenten auf Ausdauer-Schritte vereinfacht), gebaut und gegangen wird nur auf bekanntem Land, und entdeckte Fundstellen zeigen eine **Spur ◈**, bevor sie gehoben sind — Erkundung hat einen sichtbaren Lohn.

v2 zieht daraus die Folgerung, die v1 noch fehlte: **die Sichtweite kommt vom Gelände** (Hang 4, Talboden 2), und damit ist Erkundung nicht mehr eine Nebenwirkung des Laufens, sondern ihr eigener Zug — siehe „Der Lohn der Höhe" oben in diesem Kapitel. Der Neuland-Ertrag ist dabei **gedeckelt** (ab 6 Feldern +1 Kultur, höchstens +2 je Abend): ein einziger Aufstieg mit Sicht 4 war sonst mehr wert als die halbe Runde.

::: why Der Spielbericht, der die Idee zum Konzept machte
Drei Höhlen auf der Hand, kein Hang in Reichweite, keine Möglichkeit, vom Wasser weg die Berge zu suchen: Auf der festen 5×8-Karte des Epoche-I-Prototyps sind Menschen an gelegte Plättchen gekettet, und unpassende Karten verstopfen die Hand. Bewegung über das Gelände selbst plus Nebel des Unbegangenen löst beides — als Sicherheitsventil darf zusätzlich einmal am Tag eine tote Handkarte zurück in den Beutel, und ist gar nichts baubar, lässt sich die Nacht trotzdem anbrechen.
:::

## Furten – flache Stellen im Fluss {done}

Zwei markierte Flusszellen erlauben Menschen die Überquerung und verbinden Plättchen beider Ufer für Verbund-Boni.

::: why Historischer Bonus
Furten waren real Keimzellen späterer Siedlungen – in Epoche II können genau dort die römischen Brücken entstehen. Eine Mechanik, die zur Erzählbrücke zwischen Modulen wird.
:::

Gesetzt wird die Furt bisher von Hand. Im `gewaesser-labor-v1` entsteht sie stattdessen aus dem Lauf selbst – siehe die nächste Karte. {.dim}

## Das Wasser fließt *durch* das Feld – das Ufer wohnt im Flussfeld {concept}

Ein Hexfeld ist 1 km breit, ein Bach 3 m. Ein Feld als „Fluss" zu färben rendert also einen **1 km breiten Fluss** – für alles unterhalb eines Stroms schlicht falsch. Der Prototyp `gewaesser-labor-v1` dreht das um: Das Wasser läuft als **Band von Kantenmitte zu Kantenmitte** über die Feldmitte. Damit hat ein Lauf im Feld genau drei Formen – **gerade** (Gegenkanten), **gebogen** (120°), **geknickt** (60°) –, und weil Nachbarfelder dieselbe Kantenmitte teilen, ist er über Feldgrenzen hinweg stetig.

**Folge: eigene Uferfelder entfallen.** Was neben dem Band bleibt, ist Land – bei einem 47 m breiten Fluss sind das je Seite rund 477 m Ufer *im selben Feld*. Das Ufer ist damit keine Geländeart mehr, sondern eine Eigenschaft des Flussfeldes.

::: why Warum die Benennung gerechnet wird
Aus den Läufen wird ein gerichteter Graph, darauf läuft eine Abflussbilanz; die Breite folgt der hydraulischen Geometrie **b = 6·√Q**, die Klasse folgt der Breite. Dadurch kann das Netz nicht mehr lügen: Bach + Bach ergibt einen kleinen Fluss, ohne dass jemand daran denkt, und eine Ausleitung (Mühlkanal) stuft den Lauf darunter sichtbar zurück. Die ganze limnologische Systematik ist damit abgedeckt – Rinnsal · Bach · kleiner Fluss · grosser Fluss · Strom · Kanal, Pfütze · Tümpel · Weiher · See · Teich · Stausee – ohne eine einzige gemalte Zuweisung. Ein „Strom" heißt nur so, wenn sein Wasser die Karte Richtung Meer verlässt; ein Stausee entsteht nicht als Fläche, sondern aus einem **Damm**, der flussaufwärts flutet.
:::

**Passierbarkeit läuft von Ufer zu Ufer.** k Wasserkanten ergeben k Strahlen zur Feldmitte und damit genau k **Landsektoren**; jeder ist ein eigener Knoten im Wegegraph. Ein Fluss ist dadurch eine *Linie quer über die Karte* statt einer Reihe gesperrter Felder – das Nachbarfeld kann unerreichbar sein, obwohl es anliegt. Eine Quelle hat nur einen Strahl und trennt nichts: um sie geht man herum. Kosten wahlweise aus der Klassentabelle (Bach −1 · kleiner Fluss −2 · grosser Fluss −3 · Strom ✕ · Furt −1 · Stromschnelle −5 bei 50 % · Wasserfall/Klamm ✕ · Brücke 0) oder aus der Hydraulik über **t·v** – letztere weiß, dass ein knietiefer Wildbach gefährlicher ist als ein hüfttiefer, träger Fluss.

**Merkmale kommen aus dem Gelände**, nicht aus dem Pinsel: Wasserfall ab 120 m/km, Stromschnelle ab 55, Klamm wo die Flanken 150 m über dem Bett stehen, Verzweigung/Schotterflur wo es flach und breit genug ist. Der Stempel überschreibt jederzeit.

::: why Die Furt ist ein Ort, keine Schwelle
Eine Furt rein absolut zu definieren (Wassertiefe × Geschwindigkeit unter einem Grenzwert) machte im Versuch *fast jedes Feld* zur Furt – rechnerisch richtig, spielerisch wertlos. Sie muss zusätzlich das flachste Feld ihrer Strecke sein. Ihre Lieblingsstelle ist dann die verzweigte Strecke, weil sich dort dasselbe Wasser auf die dreifache Breite verteilt – also genau dort, wo die historischen Furten des Alpenrheins tatsächlich lagen (Schaan, Tardis). Die Furt wird damit wieder das, was sie im Spiel sein soll: ein rarer Ort, für den man Umwege geht.
:::

Offen: Übernahme ins Feldmodell aus `feld-labor-v1` (das Band ist eine neue Schicht zwischen Grund und Kern), Verhältnis zu den Kanten-Verbünden (wirkt ein Verbund über das Band hinweg?), Boote/Fähren als eigener Bewegungsmodus, und ob die App zwei Sektoren je Flussfeld tragen soll oder eine vereinfachte Fassung genügt. {.dim}

Eine erste spielbare Vereinfachung läuft in `erkundung-v1`: das Flussfeld trägt sein Ufer (eigene Uferfelder entfallen), das Uferlager liegt auf Flachland am Wasser. {.dim}

## Berg: Gelände, das Grenzen zieht {concept}

Der Alpenrhein ist ein Tal, **weil** Berge es begrenzen – das Raster kennt bisher nur Flachland, Ufer, Hang, Fluss und See. **Berg** kommt hinzu: nicht bebaubar, für Menschen nicht begehbar. Damit erhalten Karten Ränder, Talengen und echte Wegewahl statt eines offenen Felds. Später erschließt Berg eigene Plättchen (Steinbruch, Alp).

::: why Warum das Gestaltungsfreiheit gibt
Ein Gelände, das *nichts erlaubt*, ist gestalterisch stärker als eines, das etwas gibt: Erst Sperrflächen machen die freien Flächen zu einer Komposition. Kartografen können Talengen, Seitentäler und Sackgassen formen, ohne dass eine neue Regel dazukommt.
:::

Erstmals bespielt in `erkundung-v1`: Berg sperrt Weg *und* Sicht — er ist die Wand, die den Blick beendet. {.dim}

## Die Karte verändert sich pro Epoche {concept}

Nicht nur die Bebauung wandert – **das Gelände selbst hat pro Epoche einen eigenen Zustand**: der See steigt, der Fluss verlagert sein Bett, Ried wird Kulturland. Jede Epoche trägt darum ihren vollständigen Kartenzustand; Designer übernehmen den Stand der Vorepoche als Ausgangspunkt und ändern, was die Geschichte ändert.

::: why Warum nicht eine Karte mit Zeitschichten
Ein einziges Raster mit Änderungslisten wäre kompakter, aber für die Gewerke unlesbar. Fünf vollständige Zustände plus Differenzansicht zeigen sofort, *was* eine Epoche mit dem Tal gemacht hat – die Veränderung wird selbst zum Entwurfsgegenstand.
:::

Ergänzt die "archäologischen Schichten" aus Kap. 1: Dort bleiben frühere Module unter der Bebauung sichtbar, hier ändert sich der Untergrund selbst. {.dim}

Seit dem Ereignis-Labor (Kap. 8) präzisiert und durch die Notizen zum Spielablauf bestätigt: Nicht der volle Kartenzustand wird von Hand neu entworfen, sondern die Epoche **erbt ihren Endzustand** aus dem Gespielten der Vorepoche – „jede Epoche trägt die Narben der vorigen" statt eines unabhängig gezeichneten Zustands. Was am Übergang sonst noch gleichzeitig geschieht (Zeremonie, Zoomstufenwechsel), steht in Kap. 6 bzw. im Zoomstufen-Labor (Kap. 8) – Letzteres wird derzeit separat abgeklärt. {.dim}

## Weitere Mechanik-Kandidaten für Modul I (geparkt) {idea}

Bei der Suche nach der "fehlenden Mechanik" diskutiert, dann zugunsten der Geschichts-Anbindung zurückgestellt:

- **Saisonzyklus** (Sommer sammeln, Winter zehren) – sichere Wahl, evtl. Überlagerung mit Tag/Nacht
- **Tierwanderungen** (bewegliche Wild-/Fischmarker) – passt zu "Natur als Akteur"
- **Generationenwechsel** (Wissen geht verloren, wenn nicht weitergegeben)
- **Namen & Erinnerung** (Spieler benennt Orte, Namen bleiben über alle Epochen)
- **Mythos-Karten** (große Erlebnisse werden Legenden, in Modul III Heiligengeschichten)
- **Unbekanntes Terrain / Höhenprofil / NPC-Nachbargruppen**

Mobiles Lager (Wanderung) siehe Kapitel 9 – als Vollmechanik verworfen. {.dim}

## Gelände als Daten – und weitere Geländekandidaten {idea}

Heute ist Gelände hart kodiert: `Terrain` ist eine feste Aufzählung von fünf Werten (`app/src/stromlinien/types.ts`), Palette und Farben liegen im Code – **Berg wäre eine Code-Änderung**. Vorschlag: Gelände wird Daten wie der Plättchen-Katalog, mit **Eigenschaften statt Namen** (`bebaubar`, `wasser`, `sperrt Bewegung`, `Übergang`). Dann ist Berg ein Eintrag, und fremde Weltkarten (Rhône, Donau, Nil) bringen eigenes Gelände mit, ohne die Engine anzufassen.

Weitere Kandidaten:

- **Pass** – verhält sich zum Berg wie die Furt zum Fluss: ein Übergang durch die Sperre. Nutzt die bestehende Furt-Logik fast unverändert und gibt Designern Routenführung (Saumpfade, Splügen/San Bernardino in späteren Epochen).
- **Moor/Ried** – der Talboden vor der Rheinkorrektion: leicht zu queren, schlecht zu bebauen. In Modul V zahlt es sich aus (Torfstich, Melioration) und wird durch die Regulierung zu Flachland – ein Geländewandel, den die Epochen-Karten bereits abbilden können.
- **Kiesbank/Aue** – die Kiesflächen des wandernden Flusses: fruchtbar, aber hochwassergefährdet (hoher Ertrag gegen Ereignisrisiko).

## Eis: die erste Plättchen-Art, die kommt und geht {idea}

**Eis** ist ein Grund-Terrain wie Flachland oder Bergland – aber das erste, das **Felder überschreibt und sie wieder freigibt**: solange es liegt, ist das Feld kein Hügel und kein Bergland mehr, sondern Eis; zieht es sich zurück, kommt das Gelände darunter zum Vorschein. Es ist damit auch der erste Beleg dafür, dass „die Karte verändert sich pro Epoche" nicht nur Austausch von Plättchen heisst, sondern eine *Front* sein kann, die über die Karte läuft.

Zustände, aus denen die Marke gebaut ist (Prototyp `eiszeit-labor-v3`, Kap. 8):

- **Dicke → Helligkeit.** Dünnes Eis lässt das Relief des Untergrunds durchscheinen, dickes Eis wird flach und weiss. Ein Eisstrom im Trog sieht anders aus als eine Eiskappe über einem Grat.
- **Firn** im Nährgebiet (oberhalb der Schneegrenze) – wärmerer, weisserer Ton als das zehrende Eis der Zunge.
- **Eisrand** als Kantenmarke: nur die Kanten zu eisfreien Nachbarn tragen den hellen Saum. Die Front ist dadurch als Linie lesbar, nicht bloss als Farbwechsel.
- **Nunatak** – Fels, der im Feld über die Eisoberfläche ragt: das Feld bleibt Eis, trägt aber eine dunkle Felsspitze. Auf 1 km pro Feld ist beides gleichzeitig wahr.

::: why Warum nicht einfach „weiss = Eis"
Eine einzige Eisfarbe macht aus dem Vorstoss eine wachsende Fläche – die Karte verliert genau die Information, die den Vorgang erzählt: wo das Eis mächtig ist, wo es dünn ausläuft, wo Land herausschaut. Dicke, Firn, Rand und Nunatak sind vier Zustände *derselben* Plättchen-Art und kosten nichts als eine Farbtabelle.
:::

Dazu kommen mit v2 **vier Marken, die bleiben, wenn das Eis weg ist** – dieselbe Plättchen-Logik, aber sie überdauern die Front: **Endmoräne** (Hügelzug, wo die Zunge lange stand), **Schotterflur** (das Vorfeld, das die Schmelzwasser aufgeschüttet haben), **Findling** (ein Fels mit Herkunft – Fundstellen-Kandidat) und **Eisstausee** (kurzlebig: er kommt und geht mit der Front). Erst damit ist Eis nicht nur eine Front, die vorbeizieht, sondern eine, die *Gelände hinterlässt*.

Offen: ob Eis nur Kulisse (Prolog/Kartenzustand) oder spielbares Gelände wird (Sperre wie Bergland? Übergang wie Furt/Pass? Ertrag am Eisrand: Jagd am Gletschertor?), und ob dieselbe Front-Logik später andere Übergänge trägt (Verlandung, Moor, Rheinkorrektion). Die vier Erbe-Marken sind bisher nur Kartenzustände – ob Moräne und Schotterflur eigene Gelände-Eigenschaften bekommen (Moräne: Hügel mit Sicht? Schotterflur: fruchtbar aber hochwassergefährdet?), gehört zur Frage „Gelände als Daten". {.dim}

## Eiszeit als Prolog: die Karte, bevor gespielt wird {idea}

Die Kampagne beginnt 10 000 v. Chr. – **genau dann, als das Eis das Tal freigab**. Der Prototyp `eiszeit-labor-v3` spielt die 30 000 Jahre davor auf echtem Gelände durch (fünf Sonny-DTMs, 1 km pro Feld): Vorstoss ins Vorland, Hochglazial mit dem Maximum bei Schaffhausen und Killwangen, Zusammenbruch, Entstehen der Alpenrandseen, der letzte Kälterückschlag (Egesen) – und am Ende steht das Tal offen, in dem Modul I beginnt.

::: why Zwei Zeitachsen, und eine Naht, die noch nicht passt (21. Aug 2026)
Die Kampagne rechnet in **v. Chr.** – 10 000 v. Chr. bis heute, Pfahlbauten, Rätier, Römer. Das Eiszeit-Labor rechnet in **cal BP**, in kalibrierten Jahren vor heute, weil die Eiszeitliteratur das so tut. Bis August 2026 stand am Labor fälschlich „v. Chr." dran; dass die Zahlen immer BP waren, lässt sich an der eigenen Phasentabelle ablesen (Jüngere Dryas 13 000–11 700, belegt 12 900–11 700 *cal BP* – in v. Chr. wären es 10 950–9 750). Die Beschriftung ist korrigiert, die Zahlen sind unverändert.<br><br>**Damit fällt aber eine Naht auf:** das Labor endet bei 10 000 cal BP, und das sind **8 050 v. Chr.** – nicht 10 000 v. Chr. Der Satz „die Kampagne beginnt genau dann, als das Eis das Tal freigab" stimmt also derzeit nicht auf das Jahr: zwischen Laborende und Kampagnenbeginn liegen 1 950 Jahre. Zu entscheiden ist, welche Seite nachgibt – das Labor bis 11 950 cal BP weiterlaufen lassen (dann deckt es 10 000 v. Chr. ab, kostet aber 78 zusätzliche Zeitschritte und verschiebt Egesen und Ausgang), oder die Kampagne bei 10 000 cal BP beginnen lassen (dann rutscht Epoche I um 1 950 Jahre und die Pfahlbau-Datierungen müssen mitwandern). Offen, bis entschieden.
:::

**Seit v3 ist das nicht mehr nur das Rheintal, sondern der ganze Alpenbogen** – von den Endmoränen des Rhônegletschers in der Dombes bei Lyon bis zum Murgletscher bei Judenburg, von den Amphitheatern der Po-Ebene bis an die Donau. Das ist nicht Grössenwahn, sondern der einzige Weg zu *unabhängigen* Prüfpunkten: bisher stand jede Kalibriermarke in demselben Tal, an dem das Modell justiert wurde. Jetzt gibt es **elf △-Marken in fünf Ländern** (Dombes, Wangen a. d. Aare, Killwangen, Schaffhausen, Ivrea, Verbano, Brianza, Villafranca, Memmingen, Salzachlappen, Judenburg) und – ebenso wichtig – **sieben Gegenproben, die eisfrei bleiben müssen**: Lyon, Basel, Mailand, Turin, Verona, München, Ulm. Eine Karte, die Mailand unter Eis begräbt, ist widerlegt, auch wenn sie Schaffhausen trifft.

Der Rückzug ist **nicht** eine rückwärts abgespielte Aufnahme des Vorstosses. In v1 war er es allerdings fast: dort war der Zustand eine *reine Funktion der Schneegrenze* – bei gleicher Schneegrenze sahen Vorstoss und Rückzug identisch aus, und der Unterschied kam allein daher, dass die Klimakurve unsymmetrisch verläuft. Was das Handbuch hier früher behauptete („Zungenbecken bleiben liegen, Hochtäler halten länger"), konnte v1 also gar nicht leisten.

v2 macht daraus einen **Lauf durch die Zeit**: die Eisdicke wandert in Schritten aufs Gleichgewicht zu, aber mit begrenzten Raten – die Front kriecht (≈ 40 m im Jahr; das ist keine Willkür, sondern die Rate, die der belegte Vorstoss über ~100 km in ~3000 Jahren verlangt), die Dicke wächst langsam, und zurück geht es nur mit der Schmelzrate am Ort. Damit ist die Hysterese **messbar**: bei gleicher Schneegrenze trägt der Rückzug mehr Eis als der Vorstoss (2 400/2 420 m Schneegrenze: 3 122 gegen 2 887 km²), beim Egesen-Wiedervorstoss hinkt das Eis dem Klima 4 % nach, danach bleibt es 4 % zu lange liegen – und in den Zungenbecken steht **totes Eis**, dessen Gleichgewicht längst null ist.

::: why Warum das mehr ist als eine Animation
Drei Dinge, die das Spiel ohnehin braucht, fallen hier ab: Erstens erklärt der Prolog die Landschaft, auf der gespielt wird – Seen, Trogtäler, Moränen sind Hinterlassenschaften dieser Front. Zweitens ist es der Prüfstand für eine Karte, die sich über die Zeit *selbst* verändert, statt von Hand pro Epoche gezeichnet zu werden. Drittens liefert es die Plättchen-Art Eis samt Zuständen.
:::

::: why Was das Gedächtnis über das Modell verraten hat
Drei Fehler wurden erst sichtbar, als der Zustand nicht mehr jedes Jahr neu erfunden wurde, sondern eine Geschichte hatte. Erstens nukleierte jeder Hügel über der Schneegrenze sofort mit der *regionalen* Gleichgewichtsdicke – die Front war überflüssig, das Fronttempo ohne jede Wirkung. Zweitens stieg der Deckel der Eisoberfläche mit der Schneegrenze: ein *wärmeres* Klima erlaubte lokal mehr Eis, und mit Gedächtnis rastete dieser Überschuss ein (ein Talfeld bei Chur stand 10 000 cal BP noch unter 1 533 statt 464 m Eis). Drittens lag die Egesen-Delle der Klimakurve zu tief *und* zeitlich nach dem Ende der Jüngeren Dryas – sie füllte das Rheintal 1 000 Jahre vor Spielbeginn erneut mit 1 661 m Eis. Alle drei sind korrigiert, und die Kalibrierung am Kartenbild blieb erhalten: der tiefste Eisrand liegt im Hochglazial bei 420 m ü. M. (v1: 421), die Front erreicht die belegten Marken bei Schaffhausen und Killwangen. (Die *Flächenzahl* ist mit v1 nicht vergleichbar – v2 zählt genau die Felder, die es auch zeichnet, während v1 nur die vom Dijkstra besuchten zählte: eigenständige Firnfelder fehlten in der Zahl, hauchdünner Randabfall zählte mit.) Ein Modell ohne Zeitachse kann solche Fehler nicht zeigen: es hat keinen Zustand, den es falsch fortschreiben könnte.
:::

::: why Was echtes Gelände über die Kalibrierung verraten hat
Mit AT/DE/IT als echte Höhen statt geschätzter Füllung (Aug 2026) brach die Kalibrierung: bei unveränderten Parametern erreichte das Eis weder Schaffhausen noch Killwangen mehr (Fläche 19&nbsp;592 → 10&nbsp;950&nbsp;km², Eisrand 420 → 523&nbsp;m). Die geschätzte Füllung – nächster Nachbar plus 30 Glättungsschritte – war glatter als das echte Relief im Nährgebiet und liess mehr Eis Richtung Vorland fliessen, als real ankommt. Kontrollprobe: mit `?nurecht` (schliesst die verbliebenen 10 geschätzten Felder aus) ändert sich die Fläche nur noch um 0.03&nbsp;% – die alte 42-%-Lücke war ausschliesslich der geschätzte Bogen um die Schweiz, nicht Rauschen. Die Fliessgrenze τ (plastisches Fliessgesetz) war deshalb an einer fiktiven Landschaft kalibriert, nicht an echter; ein Sweep über 24 Läufe (echte Uhr, headless, `?tau=`) fand bei **98&nbsp;kPa** wieder den dokumentierten Eisrand exakt bei 420&nbsp;m und beide Marken mit Abstand statt auf der Kippe – und liegt damit näher an publizierten Werten für Talgletscher (50–150&nbsp;kPa) als die alten 140. Die übrige Zeitreihe blieb dabei unauffällig: Chur wird weiterhin vor 15 000 cal BP eisfrei, die Egesen-Delle bleibt moderat (2 065&nbsp;km², kein Wiederauftreten des v1-Fehlers), Säntis und Tödi bleiben Fels mit dünnem Firnfeld.
:::

::: why Was die Ausweitung über das Modell verraten hat – und der eine Versuch, der scheiterte
Zwei Eingriffe standen für v3 auf der Liste, beide klein, beide falsifizierbar, und beide haben etwas anderes ergeben als erwartet.<br><br>**1. Die Fliessgrenze hängt vom Untergrund ab.** Bis v2 war τ *eine Zahl* für die ganze Karte – der Fels der Bündner Alpen und der Talboden des Rheintals flossen gleich. Real liegt τ über Fels bei 100–150 kPa, über wassergesättigtem Moränen- und Seesediment bei 40–60; genau deshalb sind Vorlandlappen flach und breit. Die Erwartung war, dass ein kleineres τ im Vorland die überdehnten Zungen ausdünnt. **Gemessen war das Vorzeichen umgekehrt:** die Hochglazial-Fläche stieg von 163&nbsp;251 auf 186&nbsp;776&nbsp;km², und über Turin (1 917&nbsp;m), Mailand (994&nbsp;m) und Basel (629&nbsp;m) stand plötzlich Eis. Der Grund ist die Rechenrichtung: das Modell trägt die Eisoberfläche vom *Nährgebiet nach aussen*, ein flacheres Gefälle hält sie also länger hoch – und über der tiefen Po-Ebene wird das Eis dadurch dicker, nicht dünner. Die Aussage „weiches Bett → flacher Lappen" gilt vom **Rand** her: H ≤ √(2τx/ρg) mit x = Abstand zum Eisrand. Erst als dieselbe Fliessgrenze zusätzlich als **Deckel von der Front her** eingebaut wurde (in zwei Bilanz-Durchgängen, weil eine gekappte Zunge tiefer liegt, oft unter der Schneegrenze, und dann von selbst aufhört zu wachsen – und mit einer Ausnahme für eingezwängte Täler, wo die Seitenreibung mitträgt), tat das Bett, was es sollte: **Turin und Mailand eisfrei**, Eisvolumen 111&nbsp;855 → 86&nbsp;463&nbsp;km³, der Ivrea-Lappen erreicht die Po-Ebene, und Chur, Innsbruck, Genf, Killwangen, Schaffhausen bleiben stehen. Dieselbe Physik, zwei Angriffspunkte – und nur einer davon zeigt in die gewünschte Richtung.<br><br>**2. Kalben als Zusammenbruchsmechanismus – widerlegt.** In v2 lief die Eisstausee-Rechnung *nach* dem Zeitschritt: das Eismodell wusste nichts von den Seen, die es selbst erzeugte. Die Vermutung war, dass die Zungen nicht bloss geschmolzen, sondern in ihre eigenen übertieften Becken *gekalbt* sind, und dass das erklären würde, warum Chur im Modell 16 000 cal BP noch unter Eis liegt. Das Kalben ist jetzt eingebaut, läuft im Zeitschritt, hängt an der Wassertiefe an der Front, ist durch eine Aufschwimm-Schranke gedämpft – und ist **messbar wirkungslos**: 148&nbsp;019&nbsp;km² ohne Kalben gegen 147&nbsp;981 bei der dreifachen Literaturrate, 0.03&nbsp;% Unterschied, Chur unverändert bei 1 518&nbsp;m. Der Grund ist nicht das Gesetz – 0.6, 1.2, 2.4 und „ohne Schranke" liegen alle gleich –, sondern die Geometrie, und er ist *gezählt*: zu jedem Zeitpunkt stehen höchstens rund **100 Eisfelder wirklich im Wasser** (24 000 cal BP: 11 von 585 Feldern am Wasser eingetaucht; 18 000: 35 von 93; 14 000: gar keines). Dieses Modell zieht sich zurück, indem Eis *an Ort und Stelle* dünner wird, nicht indem eine Front durch ein Becken wandert – ein Feld ist Eis **oder** See, nie beides. Der Zustand „gegründete Front in tiefem Wasser", an dem ein Kalbungsgesetz angreifen müsste, existiert also gar nicht. Was fehlt, ist eine **Aufsetzlinie**: Eisdicke und Wassertiefe im *selben* Feld. Und die Ausgangsfrage hat sich derweil selbst beantwortet – dass Chur zu lange unter Eis liegt, ist **nicht** die Trägheit: das Gleichgewicht sagt dort 148&nbsp;m, der Lauf 570&nbsp;m. Der grössere Teil ist die Klimakurve, nicht das tote Eis.<br><br>**Zwei echte Fehler hat der Versuch trotzdem freigelegt**, beide schon in v2 vorhanden und dort folgenlos, weil die Eisstauseen bloss Kulisse waren: „NIVEAU &lt; 0 = noch nicht besucht" hängte den Flutalgorithmus auf, sobald eine Zelle unter dem Meeresspiegel liegt (Adriaküste, 1 225 Zellen) – ein Vorzeichen ist kein Sentinel. Und „hat ein Niveau" wurde mit „ist ein See" verwechselt: der Algorithmus setzt für *jedes* eisfreie Feld ein Niveau (bei trockenen die eigene Geländehöhe), also galt jede Bergflanke neben einer Talzunge als See mit der Höhendifferenz als Wassertiefe – **35 024 Kalbungsfelder** mit Fronttiefen bis 770 m, und die Talzungen waren binnen weniger Schritte weg. Dazu die Auflösung selbst: bei 1 km pro Feld verschwindet jede Schlucht im Mittelwert, der Algorithmus sieht dort einen Riegel, und aus 27&nbsp;772 „See"-Feldern wurden nach dem Aussieben von Kleinstflächen rund 7 000 echte in etwa 140 Flächen. **Ein Feature, das Kulisse war, wird beim Einbau in die Physik zum Prüfstand für die Daten.**
:::

<div class="why"><b>Der Rückzug: monoton von Bauart, und was Streckung kostet (21. Aug 2026)</b>Ausgangsbeobachtung: der Linthlappen zieht sich zu schnell zurück. Nachgemessen ergibt das Modell für das <b>Zürichseebecken</b> (94 Felder mit heutiger Seefläche) die Freigabe bei <b>16 800 cal BP</b>; bei 18 000 tragen noch 46 der 94 Felder Eis, im Mittel 635 m dick. Die Einzelzelle „Seemitte" fällt bei 18 575 – wer eine Zelle statt des Beckens liest, sieht den Rückzug also 1 800 Jahre zu früh.<br><br><b>Der Antrieb ist eine einzige Zahl je Jahr</b>, und die Kurve verrät den Rest: von 21 000 bis 16 500 cal BP steigt die Schneegrenze um <b>760 m in 4 500 Jahren</b> (17 cm/a, steilster Abschnitt 20), und zwischen 21 500 und 14 200 gibt es <b>keinen einzigen Rückschritt und kein Plateau</b> – 7 300 Jahre monoton. Das Modell kann die belegte Stadialgliederung (Zürich, Hurden, Schmerikon) deshalb nicht abbilden: seine Front kriecht gleichmässig und steht nur da still, wo das Gelände sie festhält. <i>Nicht</i> limitierend ist dabei die Schmelze – die Obergrenze von 12 m/a würde 635 m in 53 Jahren wegräumen –, und auch kein Eisstausee hält die Zunge (das Kalben ist gemessen wirkungslos, siehe oben).<br><br><b>Eine Erwartung war falsch:</b> ohne Klimastufen dürfte es keine Rückzugsmoränen geben. Gemessen baut das Modell im Linth-Fenster <b>303 Moränenfelder</b> mit Freigabe zwischen 19 000 und 15 000 cal BP, längste Frontverweildauer 5 350 Jahre. Die Topografie pinnt die Front auch ohne Klima. Fehlende Stadiale zeigen sich also nicht als fehlende Wälle, sondern als Wälle mit <b>falschem Datum</b> – was schwerer zu bemerken ist.<br><br><b>Zwei Regler, um es zu prüfen</b> (<code>?dehn=</code> streckt den Erwärmungsast ab dem Anker bei 21 000 cal BP, <code>?stadial=17500,800</code> legt ein Plateau ein), und ein Sweep darüber:<br><table><tr><th>Variante</th><th class="n">Becken frei</th><th class="n">Killwangen</th><th class="n">Chur</th><th class="n">Maximum</th></tr><tr><td>Vorgaben</td><td class="n">16 800</td><td class="n">20 650</td><td class="n">15 925</td><td class="n">170 912 km²</td></tr><tr><td><code>dehn=1.25</code></td><td class="n">15 900</td><td class="n">20 550</td><td class="n">14 675</td><td class="n">170 912 km²</td></tr><tr><td><code>dehn=1.5</code></td><td class="n">14 900</td><td class="n">20 475</td><td class="n">13 400</td><td class="n">170 912 km²</td></tr><tr><td><code>dehn=2</code></td><td class="n">12 875</td><td class="n">20 300</td><td class="n">10 850</td><td class="n">170 912 km²</td></tr><tr><td><code>stadial=17500,800</code></td><td class="n">16 000</td><td class="n">20 650</td><td class="n">15 125</td><td class="n">170 912 km²</td></tr></table><b>Das Maximum überlebt jede Variante unverändert</b> – dieselbe Fläche, dieselben 5 von 11 Marken, weil erst ab dem Anker gestreckt wird. Damit ist auch die Flächenübereinstimmung mit der swisstopo-LGM-Karte (82.9 %) unberührt: sie hängt allein am Maximum.<br><br><b>Der Preis steht in der Chur-Spalte.</b> Streckung verzögert das Innere viel stärker als das Zungenende (Killwangen bewegt sich selbst bei <code>dehn=2</code> nur 350 Jahre, das Becken 3 900) – und Chur, das ohnehin als „zu lange unter Eis" in dieser Liste steht, rutscht von 15 925 auf 13 400 (bei <code>dehn=1.5</code>). Ein langsamerer Rückzug am Zürichsee macht das Rheintal also schlechter. Beides zusammen geht nur mit einem Ast, der <i>nicht</i> gleichmässig gestreckt ist, sondern gestuft – also mit echten Stadialen an belegten Daten. <b>Offen, bis die Zieldaten und ihre Zeitachse feststehen</b>; die Regler bleiben auf 1 (aus).</div>

Offen: ob der Prolog ins Spiel kommt (Titelbild-Animation? Kampagnen-Auftakt? Info-Station in der Kampagne wie die Epochen-Karten?) – und mobil ist die Werkbank noch nicht, das Panel ist für den Schreibtisch gebaut. **Schnell genug ist sie inzwischen:** die Übersicht kostete gemessen 392 ms pro Bild (1 066 ms bei jedem Zoomschritt), heute 2 ms – die Karte wird unterhalb von 8 px Hexradius als Zellbild geblittet statt als 28 576 Vektorhexe gezeichnet. Das Modell war daran nie beteiligt (unter 7 ms pro Bild). Beschrieben im [Technik-Handbuch](stromlinien-technik.html). Das Modell selbst ist historisch inspiriert und stark vereinfacht (kein glaziologisches Modell). Die DTM-Lücke ist seit Aug 2026 geschlossen (echte Höhen für AT/DE/IT, siehe Kap. 3); die Fliessgrenze wurde daraufhin neu kalibriert (140 → 98 kPa) und ist seit v3 ein **Feld** statt einer Zahl. Die zu dicken Vorlandzungen sind damit erledigt (Turin und Mailand eisfrei, Eisvolumen −23 %), Chur liegt 16 000 cal BP noch unter 570 statt 1 662 m Eis. **Was offen bleibt:** Basel trägt noch 43 m Eis, wo es 0 sein müssten, und mehrere belegte Maxima werden *nicht* erreicht – Dombes, Villafranca, Memmingen, Salzachlappen, Judenburg, Brianza. Eine einzige τ/Schneegrenze-Einstellung trifft nicht alle Lappen des Bogens gleichzeitig; ob das an der Klimakurve, am Nährgebiet je Lappen oder an der Projektion liegt (die lokale Plattkarte ist auf 49&nbsp;°N geeicht und staucht den Süden um rund 7&nbsp;%), ist die nächste Frage. Kosten für die grosse Karte: der Lauf braucht 20 s, mit Kalben 30–34 s; das Datenfile 3.7 MB. {.dim}

## Das Erbe der Eiszeit: die Endlage erzeugt die Startkarte {idea}

Die Landschaft, auf der Modul I spielt, ist **Hinterlassenschaft**: die Seen liegen in ausgeschürften Zungenbecken, die Hügelzüge quer zum Tal sind Endmoränen, die ebenen Kiesflächen sind Schotterfluren der Schmelzwasser, und die einzelnen grossen Steine im Flachland sind Findlinge, die das Eis von weit her getragen hat. Wenn das Modell diese Front ohnehin durchspielt, soll es die Startkarte **erzeugen**, statt dass Prolog und Spielkarte unabhängig voneinander entstehen.

`eiszeit-labor-v3` schreibt dafür im Lauf mit, was liegen bleibt:

- **Endmoränen** aus der **Verweildauer der Front** – wo die Zunge lange stand, schob sie einen Wall auf. Die Wallkränze entstehen von selbst, weil die Front bei Stillständen auf derselben Linie verharrt; man muss sie nicht zeichnen. Nur Zungen zählen (Front im Zehrgebiet, genug Eis darüber) – sonst ist jeder Firnrand um jeden Gipfel eine Moräne.
- **Schürfung** (Eisdicke × Oberflächengefälle × Zeit) zeichnet Trogtäler und Zungenbecken. Sie wird *nicht* ins Gelände zurückgeschrieben: das DTM ist die Landschaft **nach** der Eiszeit, die Schürfung wäre sonst doppelt gezählt.
- **Schotterflur** vor der Front, **Eisstauseen** dort, wo das Eis die Entwässerung sperrt, und **Seen erst nach der Freigabe** – Zürich-, Walen- und Bodensee entstehen im Lauf, in der Reihenfolge, in der das Eis die Becken hergibt.
- **Findlinge** mit Herkunft: Partikel aus fünf echten Leitgesteinen (Julier-Granit, Bündnerschiefer, Verrucano, Tödi-Granit, Silvretta) folgen dem Oberflächengefälle und bleiben liegen, wo das Eis am Ende zerfällt. Ein Findling ist damit ein **Fundstellen-Kandidat mit Geschichte** – „dieser Stein kommt aus dem Oberhalbstein" ist eine Fundstelle, die sich selbst erzählt.
- **Freigabejahr je Feld** – die Frage „wann wurde dieses Feld eisfrei?" ist ein Nachschlagen statt einer Rechnung.

Die Endlage bei 10 000 cal BP lässt sich als JSON exportieren (Gelände je Feld plus Fundstellen-Kandidaten mit lon/lat), im Format der Pipeline-Dateien.

::: why Warum Herkunft mehr wert ist als Verteilung
Ein Findling, den ein Zufallsgenerator setzt, ist Dekoration. Ein Findling, der aus dem Oberhalbstein kommt, weil ihn ein Eisstrom 80 km weit getragen hat, ist ein *Beleg* – und genau darum geht das Spiel: aus Spuren auf Vorgänge schliessen. Dasselbe gilt für den Moränenwall: er ist nicht „ein Hügel", er ist die Stelle, an der die Front Jahrhunderte stand.
:::

Offen: die Zuordnung auf das gestaltete 22×44-Weltraster – `app/src/stromlinien/world.ts` ist von Hand gestaltet und nicht georeferenziert, ein Port müsste beide Welten erst aufeinander legen. Das ist der eigentliche verbleibende Schritt zur Kopplung. {.dim}

**Die DTM-Lücke ist geschlossen** (Aug 2026: echte Sonny-DTMs für AT, DE, IT dazu – LI lag bereits im Schweizer Raster). Von 28 576 Feldern sind nur noch 10 ohne Deckung, statt 6 220 (21.8 %). Die Kontrollprobe von vorher lässt sich jetzt umdrehen: `?nurecht` (schliesst die verbliebenen 10 Felder aus) ändert die Hochglazial-Fläche nur noch um 0.03 % – vorher waren es 42 %. {.dim}

Das legte offen, dass die **kalibrierte Maximalausdehnung an der geschätzten Füllung hing, nicht am echten Relief**: mit unveränderten Parametern erreichte das Eis auf echtem Gelände Schaffhausen und Killwangen nicht mehr (Fläche 19 592 → 10 950 km², Eisrand 420 → 523 m). Die geschätzte Füllung – nächster Nachbar plus Glättung – war glatter als die echten Alpentäler im Nährgebiet (Rätikon, Silvretta, Verwall) und liess darum mehr Nachschub in die Zunge, als real ankommt. Neu kalibriert (τ 140 → 98 kPa, Sweep über 24 Läufe) trifft der Eisrand wieder exakt 420 m, beide Marken werden mit Abstand erreicht, und 98 kPa liegt näher an publizierten Werten für Talgletscher als die alten 140. Ausführlich in Kap. 8 und im [Technik-Handbuch](stromlinien-technik.html). {.dim}

Bei 10 000 cal BP steht das Tal weiterhin offen, Chur weiterhin eisfrei. Die Region ist mit v3 auf den **ganzen Alpenbogen** geweitet (4.7–14.9 °O / 44.9–48.6 °N) – Silvretta, Verwall und Montafon liegen jetzt vollständig drin, und die Endlage umfasst alle Lappen von der Rhône bis zur Mur statt nur Linth und Alpenrhein. Das Resteis bei 10 000 cal BP beträgt auf dieser Karte 9 118 km²; die Zahl ist mit den 1 543 km² der Alpenrhein-Region nicht vergleichbar (anderes Gebiet, andere Kalibrierung) und ist ohnehin keine externe Marke. Offen bleibt die Zuordnung auf `world.ts`, und für den Rhein fehlt NL. {.dim}

## Nebel des Ungespielten: die Weltkarte als Entdeckungsgeschichte {idea}

Auf der Weltkarte ist Gelände **unsichtbar, bis es gespielt wurde**. Gespielte Gebiete bleiben dauerhaft aufgedeckt (pro Welt-Seed gemerkt) – über viele Partien wächst aus dem Nebel die persönliche Entdeckungsgeschichte eines Spielers.

Folgen für die Gebietswahl: Sie wird zur **Entscheidung unter Unsicherheit** – als Anhaltspunkte bleiben nur die Zeichen und die Ja/Nein-Auskunft „Wasser zu hören". Wiederkehren lohnt sich, weil bekanntes Gelände planbares Spiel erlaubt, und das Aufdecken selbst wird zur Belohnung.

::: why Warum nicht sichtbares Gelände
In der ersten Fassung des Startbildschirms lag die ganze Welt offen – die Wahl war dann bloßes Ablesen der besten Kachelmischung, eine Optimieraufgabe ohne Erzählung. Der Nebel macht aus derselben Handlung ein Aufbrechen ins Unbekannte, passend zu einer Epoche, in der niemand eine Karte hatte.
:::

Prototypisch umgesetzt in `start-screen-v2.html` (Kap. 8); als Spielmechanik noch nicht entschieden. {.dim}

## Zeichen ◈: Kundschaft ohne Ortsangabe {idea}

Verstreut auf der Weltkarte liegen **Zeichen** – deterministisch aus dem Welt-Seed, gehäuft nahe markantem Gelände. Ungespielt sehen **alle gleich aus** (anonyme Stele) und verraten weder ihren Ort noch ihre Art.

Ihren Wert entfalten sie erst über die Gebietswahl: Jedes Zeichen *innerhalb* des gewählten Gebiets liefert eine wahre, aber vage Aussage über das **Gesamtgebiet** – in groben Stufen (keines / wenig / etwas / reichlich), etwa zu Wasser, steinigem Grund oder offenem Land; selten auch das Gerücht von etwas Verborgenem. Mehr Zeichen einschließen heißt mehr Kundschaft: **Information wird zur Währung der Gebietswahl**. Erst nach dem Spielen zeigt ein Zeichen seine wahre Glyphe am wahren Ort.

::: why Warum Aussagen übers Gebiet statt Markierungen am Ort
Ein Zeichen, das „hier ist Feuerstein" sagt, ist ein Wegweiser – es nimmt dem Nebel genau die Spannung, für die er da ist, und macht die Karte zur Schatzsuche. Eine Aussage über das Ganze informiert die *Entscheidung* (welches Gebiet?), ohne die *Entdeckung* (was steht wo?) vorwegzunehmen. Zugleich schafft sie einen Zielkonflikt beim Formen: Zeichen einzuschließen kostet Felder, die man sonst nach Gelände gewählt hätte.
:::

Offen: ob Zeichen im Spiel zu Fundstellen oder Anker-Ereignissen werden; ob der Epochen-Ausblick (Kap. 8) erst durch Zeichen freigeschaltet wird, statt das Gelände direkt zu lesen; Zeichen-Dichte. {.dim}

