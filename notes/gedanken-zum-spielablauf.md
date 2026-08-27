# meine gedanken zum Spielablauf. 

## First experience

Der Spieler öffnet das Spiel. Weisser Bildschirm mit einem einzelnen Schnee-Tile... New Game oder Continue

Er klickt auf "New Game": Ein leuchtender Punkt erscheint auf dem Tile. Er klickt auf den Punkt und zieht damit eine Personenkarte. Weil es seine erste ist wird sie auch sofort gelegt: Der Jäger. Ein weiterer Punkt erscheint. Er klickt auf den Punkt und zieht damit eine Ausrüstungskarte. Weil es seine erste ist wird sie auch sofort gelegt: Die Wünschelrute. Ein leuchtender Marker erscheint: Der Effekt der Wünschelrute auf dem Jäger. Er klickt auf den Marker. Ein Dialog: Zum Wasser >. Er klickt auf zum Wasser: Der Jäger bewegt sich ein Feld in die Richtung der Wünschelrute.

### Anmerkungen zur First experience

**Das Stärkste daran ist nicht die Wünschelrute, sondern der Punkt.** Der ganze Ablauf
oben braucht keine Menüs, keine Hand, keine Werkzeugleiste: es leuchtet etwas, du tippst
es an, du bekommst genau eine Entscheidung. Das ist eine Interaktionssprache, nicht nur
ein Tutorial — und wenn sie trägt, ist sie *der Spielzug*. Ausgeführt unter
[Der Kernloop](#der-kernloop).

**„Weil es seine erste ist, wird sie sofort gelegt" ist eine Regel, kein Tutorial-Trick.**
Der allgemeine Fall dahinter: *ein Punkt erscheint nur, wo es etwas zu entscheiden gibt.*
Die erste Personenkarte hat kein Wohin — also fragt das Spiel nicht, sondern legt. Damit
erklärt sich das Tutorial von selbst und verschwindet, sobald es echte Wahlen gibt.
Kein „Tutorial überspringen"-Knopf nötig.

**Die Wünschelrute muss deklariert werden.** Wünschelruten sind früh­neuzeitlich belegt
(Bergbau, 15./16. Jh.), nicht mesolithisch — nach der Belegstatus-Disziplin des Handbuchs
also `frei erfunden`. Zwei Auswege, der zweite ist der interessantere:

1. Umbenennen in etwas Belegbares (ein gedeuteter Fund, ein Traum, ein Vogelflug) — die
   Mechanik bleibt gleich, nur die Fiktion trägt.
2. **Sie darf falsch sein, weil sie geglaubt wird.** Epoche I liest die Welt animistisch
   (Deutungsrahmen `ANI`, Handbuch Kap. 3). Die Rute *funktioniert*, weil niemand sie
   prüft. Und dann der Zug, der das zur Mechanik macht: **in einer späteren Epoche hört
   sie auf zu wirken** — nicht weil sie kaputtgeht, sondern weil der Rahmen wechselt
   (`RAT`). Ausrüstung, die ihre Wirkung durch einen Mentalitätswandel verliert, ist genau
   die Art Regel, die dieses Spiel von einem Aufbauspiel unterscheidet.

**„New Game / Continue" auf dem ersten Bildschirm.** *Continue* darf nur erscheinen, wenn
es etwas fortzusetzen gibt — sonst ist der erste Bildschirm eine Wahl zwischen einer Tür
und einer Wand. Die App macht das heute schon so (Resume-Karte nur bei laufender Partie).

## Epochen

Zusammengeführt aus deiner Tabelle und deiner Liste. **Zeiträume auf das Alpenrheintal
korrigiert** — die Liste unten trug die allgemein-europäischen Zahlen, die hier um
Jahrhunderte danebenliegen (siehe Anmerkung).

| Stufe | Name | Zeitraum | Karte (Radius → Felder) | Jahre/Runde bei 10 Runden |
| --- | --- | --- | --- | --- |
| 0 | Intro: Ende der Eiszeit | 40 000 – 10 000 BP | 1 Feld → wächst auf 7 | keine Runden (Prolog) |
| 1 | Mesolithikum | 9 600 – 5 500 v. Chr. | r1 → 7 | 410 |
| 2 | Neolithikum | 5 500 – 2 200 v. Chr. | r2 → 19 | 330 |
| 3 | Bronzezeit | 2 200 – 800 v. Chr. | r3 → 37 | 140 |
| 4 | Eisenzeit | 800 – 15 v. Chr. | r4 → 61 | 79 |
| 5 | Römerzeit | 15 v. Chr. – 400 n. Chr. | r5 → 91 | 42 |
| 6 | Mittelalter | 400 – 1500 | r6 → 127 | 110 |
| 7 | Neuzeit | 1500 – 1900 | r7 → 169 | 40 |
| 8 | Moderne & Gegenwart | 1900 – heute | r8 → 217 | 13 |

**Das Mesolithikum fehlte** — und es ist die Epoche, die der Prototyp bereits spielt.
Zwischen 10 000 und ~5 500 v. Chr. leben im Tal Jäger und Sammler; das Neolithikum beginnt
hier erst mit den ersten Bauern (Pfahlbauten ab ~4 300 v. Chr.). „Neolithikum
10 000–4 000" hätte den Jäger, die Sammlerin und die halbe Epoche I verschluckt.
Ebenso lokal korrigiert: Bronzezeit ab ~2 200 (nicht 4 000), Eisenzeit bis **15 v. Chr.**
(nicht 500) — sie endet im Alpenrheintal nicht mit einer Jahreszahl aus dem Süden,
sondern mit dem Alpenfeldzug. Das ist derselbe Anker, der im Ereignis-Labor als
„Rom kommt ins Tal" steht.

**Neun Stufen statt fünf Module.** Das Handbuch (Kap. 1) trägt eine Kampagne aus
**5 Epochen-Modulen + 4 Zeremonien**. Deine Liste hat 8 + Intro. Beides ist vertretbar,
aber es ist eine Entscheidung, nicht ein Detail: fünf Module sind grössere Erzählbögen
(„ferne Macht", „Institution", „Ideologie", „Mensch als Naturkraft"), neun Stufen folgen
der Archäologie. Vorschlag: **die neun Stufen sind die Zeitachse, die fünf Module sind die
Themen** — ein Modul umfasst dann eine oder zwei Stufen, und die Zeremonie sitzt an den
Modulgrenzen, nicht an jeder Stufengrenze. Sonst spielt man acht Zeremonien und keine
davon fühlt sich nach etwas an.

**Eine Runde ist keine feste Zeitspanne.** Die letzte Spalte zeigt es: 410 Jahre im
Mesolithikum, 13 in der Gegenwart. Das ist kein Fehler, sondern der Grund, warum
Ereignisse **absolute Jahre** tragen und die Runde erst beim Anzeigen gerechnet wird
(im Ereignis-Labor schon so gebaut). Auffällig ist nur das Mittelalter (110 J/Runde nach
42 in der Römerzeit) — wenn die Kurve monoton sein soll, bekommt es 20 Runden statt 10.

## Kartengrösse über die Zeit

Der Spieler wird mit jedem neuen Spielzug auf der Karte weitergeführt. Die Karte ist zu Beginn klein, aber sie wächst mit der Zeit. Die Spieler können die Karte nur durch Züge ihrer Menschen erweitern. Diese haben anfangs Range 2 (Jäger) oder 1 (Sammler). Durch Materialien können sie die Range ihrer Menschen erhöhen. Durch Zähmen können sie auch Tiere reiten lernen. Die Karte kann auch durch Ereignisse vergrössert werden.

### Zwei Lesarten von `7 + 6*7`

**Ring je Epoche** (empfohlen): die Karte ist immer ein Sechseck mit Radius r, und r
wächst um 1 je Stufe. Felder = `3r² + 3r + 1` → 1, 7, 19, 37, 61, 91, 127, 169, 217.
Am Ende der Kampagne ein 217-Felder-Tal — auf dem Telefon spielbar, und es passt in die
gestaltete Weltkarte (22×44 = 968 Felder, davon Talboden ~300). Das geformte Gebiet der
App (12–55 Felder) liegt genau in diesem Korridor.

**Verzehnfachung je Epoche** (7¹, 7², 7³ …): 7 → 49 → 343 → 2 401 → 16 807. Bei neun
Stufen 5,7 Millionen Felder. Als *Kartengrösse* unbrauchbar — aber als **Zoomstufe**
genau richtig, und das ist wahrscheinlich, was der Gedanke eigentlich meint: nicht
„mehr Karte", sondern „feinere Karte". Siehe [Der Epochenübergang](#der-epochenübergang).

### Wachstum ist eine Folge, kein Fahrplan

Wichtig an deinem Satz „nur durch Züge ihrer Menschen": die Zahl in der Tabelle ist dann
keine Vorgabe, sondern eine **Obergrenze**. Wer nicht wandert, spielt die Epoche auf sechs
Feldern — und das darf wehtun (weniger Ertrag, weniger Fundstellen, weniger Zeichen),
ohne verboten zu sein. Damit ist die Karte selbst der Fortschrittsbalken, und der Nebel
des Ungespielten (Handbuch Kap. 2) hört auf, eine Auswahlhilfe zu sein, und wird das, was
er vorgibt zu sein: Unwissen, das man begeht.

Reichweite als einzige Wachstumsschraube:

| Träger | Reichweite | wie sie wächst |
| --- | --- | --- |
| Sammlerin ✦ | 1 | Pfade, Träger, Boot |
| Jäger ➤ | 2 | Schuhwerk, Späher, Hund |
| geritten | 3–4 | Zähmen (Epoche 3+: Pferd, Rind als Zugtier) |
| Ereignis | — | schiebt die Grenze ohne Zutun (Flut legt Kies frei, Rom baut die Strasse) |

Die vierte Zeile ist die wichtigste: **wenn ein Ereignis die Karte vergrössert, dann
erweitert es das Spielfeld gegen den Willen des Spielers.** Die römische Strasse öffnet
das Ried, das vorher niemand betrat — und mit ihr kommen Durchmarsch-Ereignisse. Karte
gewinnen ist nicht immer gut. Das ist der ehrlichste Weg, Wachstum nicht zu einer
Belohnungskurve zu machen.

## Der Kernloop

### Ein Punkt, eine Entscheidung, ein Antippen

Das ist die Regel, aus der alles andere folgt. Alles, was der Spieler tun *kann*, liegt
als leuchtender Punkt auf dem Brett. Es gibt keine Hand, keine Leiste, kein Menü im
Spielfeld — das Brett ist die Bedienung.

| Punkt | erscheint | gibt genau |
| --- | --- | --- |
| **Kartenpunkt** ○ | am Morgen, einer je Stapel | eine Karte (Mensch · Ausrüstung · Land) |
| **Rüstpunkt** ☀ | in der Dämmerung, einmal | die Vorbereitung des Tages |
| **Legepunkt** | wenn eine Karte auf der Hand liegt | die Wahl des Feldes |
| **Schrittpunkt** | auf jeder eigenen Person | ein Ziel in Reichweite |
| **Wirkungspunkt** ◆ | wo Ausrüstung oder Verbund etwas erlaubt | den Effekt („Zum Wasser >") |
| **Ereignispunkt** ! | am Vorzeichen-Morgen | das Handlungsfenster (2 Antworten mit Preis) |
| **Feuerpunkt** ▲ | am Abend, nach dem Erntebuch | die Verwandlung des Tagesertrags |
| **Nachtpunkt** ☾ | wenn kein anderer Punkt mehr offen ist | die Aufdeckung |

Rüstpunkt und Feuerpunkt kamen mit dem Abend dazu — begründet unter
[Die Belohnungsschleife](#die-belohnungsschleife).

**Der Nachtpunkt ist der Trick.** Heute endet der Tag, weil eine versteckte Bedingung
erfüllt ist („mindestens ein Plättchen gelegt", `engine.ts: BEGIN_NIGHT`). Mit dem
Nachtpunkt ist die Bedingung *sichtbar*: solange irgendwo noch etwas leuchtet, ist Tag.
Leuchtet nur noch der Mond, ist der Tag zu Ende. Kein „Nacht beginnen"-Knopf, den man
zu früh drückt, keine Regel, die man nicht kennt.

### Was ein Zug ist

**Ein Zug = ein Punkt.** Nicht eine Runde, nicht eine Person. Das ist die Einheit, in der
gedacht, gespeichert und rückgängig gemacht wird:

- **atomar** — ein Antippen führt zu genau einem neuen Zustand
- **speicherbar** — jeder Punkt ist ein Autosave-Punkt (die App speichert schon nach jeder
  Aktion). Auf dem Telefon heisst das: man kann *immer* mitten im Tag weggehen
- **rückholbar bis zur Nacht** — innerhalb des Tages darf zurückgenommen werden, über die
  Nacht hinweg nie (Aufdeckung ist final). Das war im Handbuch als offene Frage notiert;
  die Punkt-Einheit gibt ihr eine saubere Antwort: **Undo reicht genau so weit wie der Tag**
- **beschriftet** — ein Punkt sagt seinen Preis, *bevor* man ihn antippt. Kein Blindtippen

### Die Zug-Ökonomie braucht keinen Zähler

Was den Tag begrenzt, ist die Anzahl der Punkte — und die ergibt sich aus dem Zustand,
nicht aus einer Zahl im Kopf des Spielers:

- **je Stapel ein Kartenpunkt am Tag** (Epoche I: drei Stapel → drei Karten, wenn man alle
  will)
- **je Person ein Schrittpunkt am Tag**
- **je Ausrüstung ein Wirkungspunkt am Tag** — der Punkt verschwindet nach Gebrauch und
  kommt morgen wieder. Damit begrenzt sich Ausrüstung selbst, ohne Aktionspunkte-Buchhaltung
- **Legepunkte, solange Karten auf der Hand liegen** — Handlimit ist die eigentliche Bremse

Ein Tag in Epoche I sind damit ~5–7 Antippen — mit Rüst- und Feuerpunkt 8–10. Das ist
die richtige Grösse für einen Bus-Halt und lässt sich auf 15 Sekunden spielen, ohne
oberflächlich zu sein.

### Drei Stapel, und je Epoche einer mehr

Deine First experience zieht **Personenkarten** und **Ausrüstungskarten** — das ist neu
gegenüber dem Prototyp, der nur Plättchen (Land) kennt. Drei Stapel in Epoche I:

| Stapel | zieht | Beispiele |
| --- | --- | --- |
| **Mensch** | wer dazukommt | Jäger, Sammlerin, später Hirte, Händler, Mönch, Ingenieur |
| **Ausrüstung** | was einer trägt | Wünschelrute, Werkzeug, Schuhwerk, Boot, Hund |
| **Land** | was gebaut wird | Fischgrund, Uferlager, Auenwald, Hochterrasse, Höhle, Feuerstein, Pfahlbau |

Und dann derselbe Rhythmus, den das Handbuch für die Ereignisebenen schon beschreibt
(Kap. 3, „Ereignisstapel wächst als Schichtenmodell"): **je Epoche kommt ein Stapel dazu,
statt Regeln zu ersetzen.** Kandidaten: Tier (Epoche 2, Zähmen) · Bau/Institution
(Epoche 5) · Wissen/Schrift (Epoche 6) · Maschine (Epoche 8). Damit wächst die Komplexität
sichtbar in Stapeln, nicht in Regelseiten — und der Spieler lernt je Epoche genau eine
neue Sache.

## Der Spielablauf

Die vier Abschnitte sind die des gebauten Kernloops (`engine.ts`, im Handbuch Kap. 2 jetzt
dokumentiert). Was sich mit den Punkten ändert, steht in der letzten Spalte.

| Abschnitt | heute | mit Punkten |
| --- | --- | --- |
| **Morgen** | Karten nachziehen, Einkommen automatisch, Toast | Einkommen fliegt sichtbar aufs Konto; **Kartenpunkte und Ereignispunkte erscheinen**. Der Tagesbericht ist keine Meldung, sondern die Punkte selbst |
| **Dämmerung** | *gibt es in `engine.ts` nicht* | **Rüstpunkt**: eine Vorbereitung, die den Tag prägt (Wegzehrung · Späher · Rasttag · nichts). Gebaut in `erkundung-v2` |
| **Tag** | 1 Plättchen legen (Pflicht), Werkzeug, 2 Bewegungen | **Punkte abarbeiten in beliebiger Reihenfolge.** Nichts ist Pflicht ausser: irgendwann bleibt nur der Mond |
| **Abend** | *gibt es in `engine.ts` nicht* | Erntebuch läuft von selbst, dann **Feuerpunkt**: genau eine Verwandlung. Die Stelle, an der Tagesertrag bleibend wird — siehe [Die Belohnungsschleife](#die-belohnungsschleife) |
| **Nacht** | Verdunkelung, eine Karte, Effekt, −1 Nahrung | **Nachtpunkt antippen** = die Aufdeckung bewusst auslösen. Ereignis-Einschlag ersetzt die Streu-Nacht, Ausbreitung begleitet sie. Die Karte **liest den Zustand des Lagers**, statt nur eine Schwelle zu prüfen |
| **Rundenende** | Hunger, Sesshaftigkeit, Runde++ | unverändert — hier gibt es nichts zu entscheiden, also keinen Punkt |

**Zwei der sechs Zeilen sind noch nicht in der App.** `engine.ts` kennt nur `day` und
`night`; Dämmerung und Abend stehen als `erkundung-v2` im Prototyp und warten auf den
Port.

**Warum das Rundenende keinen Punkt bekommt:** dort wird nur gerechnet. Ein Punkt ohne
Entscheidung ist ein Klick, den man dem Spieler wegnehmen muss — dieselbe Regel, aus der
folgt, dass die erste Karte sich selbst legt. Der **Abend** ist davon nicht betroffen:
sein Erntebuch rechnet zwar auch nur, aber danach steht eine echte Wahl, und die
bekommt ihren Punkt.

**Die Reihenfolge im Tag ist frei, und das ist eine Aussage.** Wer erst zieht, dann legt,
dann geht, spielt anders als wer erst kundschaftet und dann entscheidet, was er legt. Es
gibt keine Phasenordnung im Tag — die Ordnung ist die Nacht.

## Die Belohnungsschleife

Der importierte Satz, auf den es ankommt: **„Fähigkeit verdienen → grösseres Risiko
eingehen → Risiko in bleibenden Fortschritt verwandeln → stärker aufwachen."** Vier
Glieder, und die Kette läuft genau über Morgen · Tag · **Abend** · Nacht.

**Das Wichtigste zuerst, und es ist kein Vorschlag, sondern ein Befund:
`erkundung-v2` spielt diese Schleife bereits.** Der Prototyp trägt vier Tageszeiten
statt zwei, und jede stellt eine eigene Frage — Dämmerung *was nimmst du mit*, Tag
*wohin*, Abend *was machst du daraus*, Nacht *hält es*. Der Untertitel der Datei sagt
es kürzer als jede Analyse: **„Gutes Laufen kauft besseres Laufen."** Was unten steht,
ist deshalb keine Konstruktion aus dem Nichts, sondern die Prüfung eines gebauten
Dings gegen ein fremdes Modell — und die Liste der drei Stellen, an denen das fremde
Modell etwas weiss, das der Prototyp noch nicht tut.

### Was schon steht

| Glied | wie es in `erkundung-v2` gebaut ist |
| --- | --- |
| **Vorbereitung** (Dämmerung) | genau *eine* Wahl: Wegzehrung (−1 Nahrung → +1 Ausdauer heute) · Späher (−1 Nahrung → +1 Sichtweite heute) · Rasttag (+2 Nahrung, dafür geht niemand) · ohne Umstände aufbrechen |
| **Risiko/Ertrag** (Tag) | Ausdauer-Schritte über echtes Gelände, Hang kostet 2 und nur der Jäger steigt. Oben: **Sicht 4 statt 2**, die Vorkommen ▲ ● ◇ (Silex, Ocker, Bergkristall) und der Blick aufs **Wild** — Jagd vom Hang gibt +2 Nahrung *und* die Fährte, im Tal +1 |
| **Verwandlung** (Abend) | erst das **Erntebuch** Zeile für Zeile (wer stand wo, was bringt er ein), dann genau *eine* Verarbeitung: Werkzeug (−2 Material → +2 Schutz, dauerhaft) · **Schuhwerk** (−2 Material → +1 Ausdauer, für immer) · Trockenfleisch (−2 Nahrung → +1 Vorrat) · Schnitzwerk (−1/−1 → +1 Kultur) |
| **Prüfung** (Nacht) | gewichtete Karte, die den Zustand abfragt: der Wolf bleibt draussen bei Schutz ≥ 4, der Frost kostet Material statt Nahrung bei Material ≥ 3. Immer −1 Nahrung |
| **Aufwachen** | Sesshaftigkeit `+min(Nahrung, Schutz, Material)`, gedeckelt bei 3 — **die schwächste Ressource zählt**. Das Wild ist weitergezogen. Zwei Winter mit leeren Vorräten: *„Der Stamm zieht weiter."* |

Damit ist auch die Tabelle unter [Der Spielablauf](#der-spielablauf) **zwei Phasen im
Rückstand**: sie beschreibt `engine.ts`, und dort gibt es weder Dämmerung noch Abend —
die App kennt nur `day` und `night`, das Morgen-Nachziehen hängt am Ende der Nacht.
Der Abend ist dabei keine fünfte Phase zum Aufhübschen; er ist die Stelle, an der aus
einem Tagesertrag ein Spiel wird.

### Warum der Abend die wichtigste Phase ist

Ohne Verwandlungsschritt ist ein guter Tag nur eine grössere Zahl auf einem Konto,
das die Nacht ohnehin wieder abzieht. Der Abend ist der einzige Ort, an dem etwas
*bleibt*: Schuhwerk ist für immer, Werkzeug ist dauerhaft, der Vorrat fängt genau
eine Hungernacht. **Schuhwerk ist die Schleife, die sich selbst antreibt** — mehr
Reichweite heute heisst mehr Ertrag morgen heisst wieder mehr Reichweite. Das ist
dieselbe Zeile, die in der Reichweiten-Tabelle weiter oben schon als „wie sie wächst"
steht; hier ist sie zum ersten Mal eine Handlung statt einer Notiz.

**Genau eine Verarbeitung je Abend** ist dabei nicht Sparsamkeit, sondern die
Punktregel: ein Punkt, eine Entscheidung. Vier Angebote, eines wird genommen, drei
tun weh — das ist die härteste und beste Wahl des Tages, weil sie ohne Zufall
auskommt.

Und hier sitzt der eine Ratschlag aus dem Import, der eine echte Lücke trifft:
**der Abend soll grosszügig wirken, wenn der Tag gut lief, und schmerzhaft, wenn
nicht.** Mechanisch ist das schon wahr — nach einem mageren Tag stehen die
Verarbeitungen grau da, mit ihrem `warum` daneben („braucht Silex — hol es am Hang").
Aber es ist noch nicht *inszeniert*. Heute liest sich ein magerer Abend wie ein Fehler
des Spielers; er sollte sich lesen wie eine Rechnung, die aufgeht oder nicht. Das ist
Darstellung, nicht Regel — und deshalb billig zu haben.

### Der Befund, der alles Weitere begründet

Bevor die Lücken kommen, die Zahl, die sie zu Pflichtaufgaben macht. Die
Handbuch-Karte **„Balancing-Loop & offene Zahlen"** (`open`) hält das Ergebnis des
Monte-Carlo-Prüfstands `mechanik-labor-v1` fest: ein ordentlich spielender Bot
**überlebt 99,9 % der Läufe und erreicht in 99,4 % die oberste Endstufe** (Median
26 von 30). Die einzige reale Gefahr ist die grosse Kälte in Runde 5.

In der Sprache dieses Abschnitts heisst das: **die Prüfung fehlt.** Es gibt eine
Verwandlung (schwach), es gibt Ertrag (reichlich), aber es gibt nichts, was das
Angesammelte je wieder in Frage stellt. Der Nachtkarten-Stapel sagt es unverblümt —
drei der sechs Karten sind **unbedingt gut** (Stille, Gute Jagd, Fund im Kies), eine
ist neutral-gut (Fremde am Feuer), und nur zwei können überhaupt wehtun, beide mit
einer Schwelle, die man ab Runde 3 nicht mehr unterschreitet. Die Nacht ist heute im
Mittel ein Geschenk mit einer Rechnung von −1 Nahrung.

Alles, was jetzt folgt, dient demselben Zweck: **der Schleife ihr viertes Glied
zurückgeben.** Ohne Prüfung ist „earn → risk → convert → wake up stronger" nur
„earn → convert → wake up stronger", und das ist eine Tabellenkalkulation.

### Die drei Lücken

**1. Die Nacht liest den Zustand, aber sie wächst nicht mit.** Heute prüft jede
Nachtkarte *nach unten*: reicht dein Schutz, reicht dein Material. Der Import dreht
das um — *„let night dangers scale with how much the player has: more food attracts
more predators, a bigger camp is a bigger target but also better defended."*

Das ist keine fremde Idee, es ist der fehlende Faktor einer Formel, die im Handbuch
schon steht: **„Furcht = Bedrohung × Deutungsrahmen"** (`concept`, nicht gebaut).
Der Deutungsrahmen ist die Epochenachse. Die **Bedrohung** hat bisher keinen Treiber —
und der Import liefert ihn: *Bedrohung wächst mit dem, was es zu holen gibt.* Damit
wird aus jeder Ansammlung eine Entscheidung statt einer Sperrklinke:

- Trockenfleisch im Lager hebt die Schwelle der Wolfsnacht mit — **wer viel
  eingelagert hat, hat Besuch.** Vorrat hört auf, gratis zu sein.
- Kultur zieht Menschen an: die Karte „Fremde am Feuer" (heute Gewicht 14, gibt einen
  Extra-Zug) wird wahrscheinlicher, je mehr Zeichen man geschnitzt hat. Der
  **Wanderer** aus `nacht-effekte-v1` ist genau dieses Ereignis in ausgebauter Form —
  aufnehmen (+Kultur/+Material, Seuchenrisiko) oder abweisen (−Nahrung bei schwachem
  Schutz).
- Und die Umkehrung muss auch gelten, sonst ist es nur eine Strafe: ein grosses Lager
  *besteht* mehr Nächte, es zieht nur mehr an. Netto darf Wachstum sich lohnen, aber
  die Varianz steigt mit.

In einem Satz: **die Nacht ist keine Prüfung, sie ist eine Waage.** Sie wiegt, was du
hast, gegen das, was du dagegen gebaut hast — und beides wächst.

**2. Die Risikoleiter hat keine oberste Sprosse.** Der Hang ist heute die riskante
Wahl, aber sein Preis ist Ausdauer, nicht Gefahr: man kommt immer heim, der Abend
findet immer im Lager statt. Damit ist „Risiko" bislang ein Synonym für „weiter
laufen". Die fehlende Sprosse ist **draussen bleiben**: eine Person, die am Abend zu
weit weg ist, kehrt nicht zurück — sie erntet doppelt (Fährte am Morgen, Vorkommen
gesichert), aber die Nachtkarte trifft *sie* statt das Lager, und das Lager verliert
ihren Schutzbeitrag. Eine Regel, und die Leiter ist vollständig: sicher am Feuer ·
weit gelaufen und heimgekehrt · draussen geblieben. Sie kostet keine neue Ressource,
nur die Frage „gehst du noch ein Feld weiter, oder drehst du um?" — und die stellt
sich dann jeden einzelnen Tag um dieselbe Uhrzeit.

**3. Es gibt keinen Boden.** Der Import ist hier ausdrücklich: *„give small permanent
progress even on lean days so the player never feels completely stuck."* Heute kann
ein Tag buchstäblich nichts geben — das Erntebuch schreibt „steht, wo nichts zu holen
ist", Neuland zahlt erst ab 6 Feldern, und wenn eine Ressource auf null steht, ist
auch die Sesshaftigkeit null (schwächstes Glied). Zwei solche Runden hintereinander
sind das Spielende. Das ist streng — aber der Bot zeigt, dass die Strenge fast nie
zuschlägt. Was bleibt, ist also nicht Todesangst, sondern **Leerlauf**: ein Tag, der
nichts einbrachte, hinterlässt auch nichts, und trotzdem verliert man nicht. Das ist
die schlechteste der drei möglichen Empfindungen. Ein solcher Tag braucht einen
Boden, der nichts kostet.

Der Boden ist **Wissen**, und er liegt schon da: begangenes Land bleibt bekannt, auch
wenn der Tag nichts einbrachte. Der Nebel geht nie wieder zu. Nur wird das nirgends
*gezählt*. Vorschlag, klein und ohne neue Ressource: das Erntebuch führt Neuland
**immer** als erste Zeile, auch bei null Kultur — „6 Felder erkundet · noch 3 bis zum
nächsten Zeichen". Ein Balken, der nie zurückgeht, an einem Abend, an dem sonst alles
zurückgeht. Damit ist die Karte selbst der Fortschrittsbalken — was weiter oben unter
[Wachstum ist eine Folge, kein Fahrplan](#wachstum-ist-eine-folge-kein-fahrplan)
behauptet wird, aber bisher nur für gute Tage gilt.

### Trophäen heissen hier Funde

Die Prestigeschleife des Imports — Trophäen sammeln, im Lager ausstellen, damit
Händler und Gefahren angelockt werden — hat in diesem Spiel eine Form, die kein
anderes Spiel haben kann. Ein Jägerspiel hängt den Schädel an die Stange. **Stromlinien legt
ihn in den Boden.**

Was der Spieler zurücklässt, ist, was später gefunden wird: Schnitzwerk, Zeichen,
Feuerstellen, die Silex-Abbaustelle. Die Trophäe wird nicht den Zeitgenossen gezeigt,
sondern der **Archäologie** — und die schaut beim Realitätsabgleich der Zeremonie
zurück (Balance %, Authentizität %, Fundstellen x/y). Das schliesst eine Schleife, die
bisher zwei getrennte Dinge waren: Kultur ist eine Ressource *und* das, was am
Epochenende über die Partie geurteilt wird. Der Spieler sammelt keine Punkte, er
hinterlässt Belege.

Und es koppelt sauber an Lücke 1: mehr Zeichen → mehr Fremde am Feuer → mehr Kultur
und mehr Risiko. Damit tragen alle Nebenschleifen dieselbe Regel, und die ist der
eigentliche Ertrag dieses ganzen Abschnitts:

> **Die Nacht liest deinen Zustand.** Was du hast, entscheidet, wer kommt.

### Wo der Import nicht passt: „stärker aufwachen"

Ein Glied der importierten Kette muss gebrochen werden, und zwar bewusst.
*„After a dozen days you are the one the forest has learned to respect — or fear."*
Das ist die Kurve eines Überlebensspiels, und sie ist **innerhalb einer Epoche genau
richtig**: zehn Runden lang soll es aufwärts gehen, sonst fühlt sich eine Sitzung nach
nichts an.

**Über die Epochen hinweg darf sie nicht gelten.** Dieses Notizbuch hat das an drei
Stellen schon entschieden, ohne es zusammenzuziehen:

- Sesshaftwerden **kostet Welt** (−73 % bekannte Fläche im gemessenen Modell) — Epoche
  II ist ärmer an Karte als Epoche I, und der Verlust bleibt als Nebel sichtbar.
- Die Wünschelrute **hört auf zu wirken**, wenn der Deutungsrahmen von `ANI` auf `RAT`
  wechselt. Ausrüstung verliert ihre Wirkung durch Mentalitätswandel, nicht durch
  Verschleiss.
- Die Römerstrasse **senkt** die bekannte Fläche: sie verkürzt Wege, also sieht man
  weniger Land.

Also: **die Belohnungsschleife ist die Innenschleife, die Epochenkette ist die
Aussenschleife, und sie zeigen nicht in dieselbe Richtung.** Am Modulübergang wird die
Sperrklinke gelöst — nicht als Strafe, sondern weil die nächste Epoche andere Fragen
stellt. Der Kampagnenbogen heisst nicht „immer stärker", sondern **„immer tiefer
verstrickt"**: mehr Ertrag und weniger Welt, mehr Schutz und mehr, was Schutz braucht.

Der Satz aus dem Import stimmt trotzdem — er stimmt nur zu gut. Am Ende der Kampagne
ist der Mensch tatsächlich der, den das Tal fürchtet. Das ist dann kein Triumph mehr,
das ist Modul 5, „Mensch als Naturkraft". Dieselbe Kurve, zehntausend Jahre später,
und sie liest sich als Horror. **Genau deshalb darf die Schleife gebaut werden wie im
Import beschrieben** — sie muss nur lange genug laufen, bis sie kippt.

### Nachtrag: die Verwandlung ist ein Kreis (erkundung-v6)

Der Abend-Verwandlungsschritt und die Morgen-Effektkarten sind in
`erkundung-v6` zu **einem Kartensystem** zusammengefallen: **der Abend
stellt her, was der Morgen spielt.** Trockenfleisch wird eine Vorrat-Karte
in der Hand (gespielt: Wegzehrung; ungespielt: fängt eine Hungernacht),
Schuhwerk und Werkzeug sind die Geburt des Ausrüstungsstapels, und die
Hand ist die Traglast (Vorräte konkurrieren mit Plättchen um vier Plätze).
Für die Belohnungsschleife heisst das: die Verwandlung produziert sichtbare
Objekte statt Kontostände — der Lohn des Abends liegt am nächsten Morgen
buchstäblich in der Hand. Details: `gedanken-zum-userinterface.md`,
Nachtrag 6.

### Was das für die Punkte heisst

Zwei Zeilen kommen zur Punkt-Tabelle dazu, und beide erfüllen die Regel „ein Punkt nur,
wo es etwas zu entscheiden gibt":

| Punkt | erscheint | gibt genau |
| --- | --- | --- |
| **Rüstpunkt** ☀ | in der Dämmerung, einmal | die Vorbereitung (4 Angebote, eines wird genommen) |
| **Feuerpunkt** ▲ | am Abend, nachdem das Erntebuch gelaufen ist | die Verwandlung (4 Angebote, eines wird genommen) |

Das **Erntebuch bekommt keinen Punkt** — dort wird nur gerechnet, dieselbe Begründung
wie beim Rundenende. Es läuft von selbst und liest sich Zeile für Zeile vor.

Ein voller Tag ist damit: 1 Rüstpunkt · 5–7 Tagespunkte · 1 Feuerpunkt · 1 Nachtpunkt
≈ **8–10 Antippen** mit vier klar getrennten Gefühlen dazwischen. Immer noch ein
Bus-Halt, aber einer mit einem Bogen: Hoffnung → Anstrengung → Lohn → Probe.

## Der Epochenübergang

Drei Dinge geschehen gleichzeitig, und nur eines davon ist heute gebaut.

**1. Die Zeremonie** (gebaut). Fünf Karten mit eigenem Spannungsbogen, ein Opfer, eine
verdeckte Wahl, dann der Realitätsabgleich (Balance %, Authentizität %, Fundstellen x/y).
Bleibt wie es ist — sie ist der Moment, in dem die Partie sich selbst erzählt.

**2. Die Karte erbt ihren Endzustand** (aus dem Ereignis-Labor). Was das Drehbuch der
Epoche umgeschrieben hat, ist der Anfangszustand der nächsten: Schwemmland dort, wo die
Flut lief, Brandlichtungen, eine neue Uferlinie, Pfahlbauten am See. Die Epochenkarten
müssen also nicht von Hand gezeichnet werden — sie sind das Ergebnis des Gespielten.
Das ersetzt „jede Epoche trägt ihren vollständigen Kartenzustand" (Handbuch Kap. 2) durch
etwas Besseres: **jede Epoche trägt die Narben der vorigen.**

**3. Die Zoomstufe wechselt** — ⚠️ **verworfen, siehe Nachtrag unten.** (neu, aus deinem `7 + 6*7`). Nicht die Karte wird grösser,
das Feld wird kleiner. Ein Feld, das im Mesolithikum 410 Jahre und ein halbes Tal trug,
trägt im Mittelalter 110 Jahre und ein Dorf. Beim Übergang **zerfällt jedes Feld in
sieben** — sein Gelände wird zum Grundton der sieben Kinder, und was darauf stand, sitzt
auf einem davon.

Warum das mehr ist als eine Kamerafahrt:

- **Es löst das Zeitproblem.** 40 000 Jahre und 100 Jahre auf demselben Raster wären
  entweder ein leeres Tal oder eine überfüllte Stadt. Feinere Zeit braucht feineren Raum.
- **Die Daten liegen schon vor.** Die Geodaten-Pipeline liefert den Rhein bereits in
  **drei Hex-Zoomstufen** — die Stufen sind nicht erfunden, sie sind vorhanden.
- **Es macht den Übergang körperlich.** Man sieht sein Tal auseinandergehen und erkennt
  darin die eigene Siedlung als *einen Punkt* wieder. Das ist derselbe Perspektivwechsel,
  den das Spiel inhaltlich behauptet: was gross war, wird klein, und die Geschichte
  läuft weiter.
- **Und es hat einen Preis.** Sieben Kinder je Feld heissen: das Meiste ist plötzlich
  leer. Der Fortschritt, den man in Feldern gemessen hat, verdünnt sich beim Übergang.
  Wer 20 Felder bespielt hatte, hat danach 20 von 140 — dieselbe Siedlung, aber wieder
  Rand. Das ist ein ehrliches Gefühl für einen Epochenwechsel und braucht keine
  künstliche Strafe.

**Zu entscheiden:** Zoom je Stufe (×7, neun Stufen) ist zu viel — nach vier Stufen sind es
2 401 Felder. Realistisch sind **zwei bis drei Zoomstufen über die ganze Kampagne**, also
ein Wechsel an ausgewählten Modulgrenzen statt an jeder. Genau dort, wo die fünf Module
des Handbuchs ihre Schnitte haben. Das koppelt die beiden offenen Fragen aneinander und
löst sie zusammen: **Modulgrenze = Zeremonie = Zoomwechsel.** Alle anderen Stufengrenzen
sind einfach die nächste Runde mit einer neuen Jahreszahl.


### Nachtrag: Punkt 3 ist verworfen — die Welt wächst mit den Wegen

Dein Einwand: *„es geht ums Überleben … ein Mensch hat kaum mal ein Tal verlassen, wenn
es ihm alles gegeben hat, was er brauchte … was hinter ihm lag, war Nebel."* Der trifft,
und ich lasse den Zoomwechsel als Übergangs-Mechanik fallen. Der Unterschied in einem Satz:
**der Zoom modelliert Kartografie, dein Modell modelliert Wissen** — und das Spiel handelt
von Wissen.

Gebaut als `kartenwachstum-v1.html`, auf denselben echten Daten, Dichte konstant
(2 km/Feld in *jeder* Epoche). Bekannt ist, was begangen wurde. Zwei Budgets, weil zwei
Dinge wachsen: **heim** (das Gebiet, das im Jahreslauf abgelaufen wird → Fläche) und
**fern** (wie weit Wege zu anderen Orten reichen → Linien mit Sichtstreifen). Man reist
zu Orten, nicht durch Flächen.

Gemessene Kurve, gleiche Ausgangslage bei Landquart:

| Epoche | Felder | km² | |
| --- | --- | --- | --- |
| Mesolithikum | 420 | 1 455 | Streifgebiet, ganz bekannt |
| Neolithikum | **112** | **388** | **−73 %** — sesshaft und ärmer an Welt |
| Bronzezeit | 1 569 | 5 435 | Band am Wasser, blinde Flanken |
| Eisenzeit | 3 454 | 11 965 | über die Pässe |
| Römerzeit | 3 359 | 11 636 | −95: die Strasse verkürzt Wege |
| Mittelalter | 3 360 | 11 639 | gesättigt |

**Vier Dinge, die ich vorher nicht wusste:**

1. **Die Kurve fällt beim Sesshaftwerden.** Bauern kennen weniger Welt als Jäger — und das
   Modell trifft dabei die ethnographischen 100–2 000 km² für Wildbeuter-Streifgebiete und
   die 5–50 km² neolithischer Dorfterritorien, ohne darauf getrimmt zu sein. Der Übergang
   I→II ist damit **ein Verlust an Welt**, und die verlorene Welt bleibt als Nebel sichtbar.
   Das ist ein besseres Epochengefühl als jedes Wachstum.
2. **Korridore entstehen nur, wenn Wasser billiger ist als Land.** Erste Fassung: Fluss 3,
   Flachland 2 — es kam immer ein Fleck heraus, nie ein Band. Die Bootstechnik ist kein
   Detail, sie ist der **Formgeber der Karte**.
3. **Sicht folgt dem Tal, nicht dem Zirkel.** Dein „7 Hexes weit" als Kreis überstrahlte
   alles und machte den Einbruch unsichtbar. Als Breitensuche durch offenes Gelände —
   Bergland wird gesehen, aber nicht durchschaut — hat der Nebel die Form der Grate.
4. **Die Römerstrasse senkt die bekannte Fläche.** Sie verkürzt Wege, also sieht man weniger
   Land. Infrastruktur verbindet Orte und ent-kennt den Raum dazwischen.

**Was das Modell noch nicht kann:** ab der Eisenzeit sättigt es, weil alle 23 Landmarken des
Datensatzes erreichbar sind. Wachstum über Wege braucht eine **Siedlungsschicht** — Orte als
Ziele. Flora und Fauna fehlen ganz (Ufer und Flachland dienen als Ertragsproxy); flussaufwärts
kostet gleich viel wie flussabwärts, was für Boote falsch ist; und Wissen verfällt sofort statt
über eine Generation.

**Deine Grenze bestätigt sich:** bis ins 16. Jh. ist bekanntes Land begangenes Land. Danach
bringt Druck Wissen über Orte, die niemand betreten hat — ab der Neuzeit müsste die Karte
**durch Nachrichten wachsen, nicht durch Füsse**. Anderer Mechanismus, nicht grösseres Budget.

**Vom Zoom bleibt:** Ebene 1 (2 km/Hex) ist die Spielauflösung; Bespieltes muss in
Weltkoordinaten hängen, nicht in Zellindizes; und als *einmaliger* Schritt für die
industriellen Epochen bleibt der Zoom offen — dort schrumpft der Gegenstand des Interesses
wirklich auf Dorf- und Stadtgrösse.

## Offene Entscheidungen

1. **Neun Stufen oder fünf Module** — Vorschlag: beides, Stufen als Zeitachse, Module als
   Themen und Zeremonienorte.
2. **Undo-Fenster = Tag** — hält das gegen den Werwolf-Gedanken? Die Nacht bleibt final,
   also ja. Aber es macht den Tag zur Planungsfläche und die Nacht zum Einsatz.
3. **Wünschelrute**: umbenennen oder als geglaubte Wirkung führen, die eine Epoche später
   erlischt.
4. **Hand-Limit** ist jetzt die eigentliche Bremse im Tag — welche Zahl? Heute 3–4.
5. **Reihenfolge frei im Tag**: braucht es *irgendeine* Sperre (z. B. Bewegung nach dem
   Legen), damit Kundschaften nicht immer dominiert?
6. **Wenn ein Ereignis die Karte vergrössert** — darf der Spieler das ablehnen? („Wir
   gehen nicht ins Ried.")
7. **Skaliert die Nacht mit dem Besitz?** Die Regel „Vorrat zieht Besucher an" ist die
   billigste Antwort auf 99,4 % Erfolgsquote. Aber: nur die Varianz erhöhen oder auch
   den Erwartungswert senken? Zweiteres macht Wachstum netto schlecht — dann sammelt
   niemand mehr, und das wäre die falsche Lehre.
8. **Draussen übernachten** — die fehlende oberste Sprosse der Risikoleiter. Trifft die
   Nachtkarte dann die Person *statt* des Lagers, oder beide? Und was heisst „verloren",
   wenn heute niemand sterben kann?
9. **Eine Verwandlung je Abend oder eine je Person?** Eine hält die Wahl scharf. Zwei
   Personen, die den ganzen Tag getrennt gelaufen sind, bringen aber getrennte Erträge
   heim — und es einer davon zu verwehren, ist schwer zu erzählen.
10. **Zählt Kultur in `min()`?** Heute nicht (Sesshaftigkeit = `min(Nahrung, Schutz,
   Material)`). Wenn Kultur die Trophäenschleife tragen soll, ist ihre Trennung vom
   Fortschritt genau richtig — dann ist sie die *zweite* Achse, an der die Zeremonie
   misst, und das gehört ausgesprochen.
11. **Wo wird der Abend gebaut?** `erkundung-v2` hat ihn, `engine.ts` nicht. Portieren
   oder erst die drei Lücken im Prototyp schliessen? Vorschlag: erst die Lücken —
   ein Abend ohne skalierende Nacht portiert die halbe Idee.