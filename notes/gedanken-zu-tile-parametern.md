# Gedanken zu Tile-Parametern

**Deliverable an das Map-Team.** Die Leitfrage ist nicht „welche Daten haben wir",
sondern: **was muss ein Feld können, damit die Kernmechanik läuft?** Die Kette aus
`gedanken-zur-kernmechanik.md` — erforschen · entdecken · erleben · erklären · erinnern ·
vergessen — stellt Anforderungen an jedes einzelne Feld. Dieses Dokument leitet daraus
den Parametersatz ab, sagt, welche Pipeline-Stufe ihn befüllt, und endet mit einer
Baureihenfolge, deren erster Schritt **im Produkt sichtbar** ist.

> **Stand nach dem Feedback des Lead Designers.** Zwei seiner Anmerkungen haben die
> Architektur dieses Papiers verändert, nicht nur seine Details:
> *„Ein Epochenübergang vergräbt was war. Man kann seine alten Lager wiederfinden."* →
> das Feld ist nicht nur Lesestoff, es ist **Archiv** (siehe *Die eine erlaubte
> Gegenrichtung*). Und *„ein Dorfältester bemerkt, das Wasser ist grau"* → Vorzeichen
> müssen an einer **echten Weltursache** hängen, die die Karte kennt (siehe *Was die
> Nacht anrichtet, muss am Morgen im Gelände stehen*).
>
> **Nachtrag:** der Untergrund ist keine offene Quellenfrage mehr — swisstopo-
> Geologiekatalog + GeoCover schliessen die Lücke (eigener Abschnitt). Damit wird
> `erhaltung` von `frei erfunden` zu `belegt`, und das ist der Parameter, an dem der
> ganze Vergrabungs-Weg hängt.

---

## Der Befund: zwei Welten, die einander nicht kennen

**Was das Spiel heute von einem Feld weiss** (`app/src/stromlinien/types.ts`,
`RegionCell`): `t` (flach/hang/ufer/water/lake) · `furt` · `lakeUfer` · `uferHang` ·
`hint` · `landmark`. **Sechs Eigenschaften.** Die Welt selbst ist ein
**handgezeichnetes ASCII-Raster** in `world.ts`: 22 × 44 = 968 Felder, Zeichenlegende
`L ~ f M .`. Die Zeichen ◈ werden mit einem Hash bei 5 % gestreut, die Fundstellen sind
sieben handgesetzte Koordinaten.

**Was die Pipeline heute schon kann:** echte Höhen aus fünf Sonny-DTMs über dem ganzen
Rheineinzug (1786×1301 bei 200 m), Steigung und Relief über dem lokalen Talboden,
Terrainklassifikation daraus, Seegrund aus swissBATHY3D (22 Seen, 21 davon auf 4 m genau
gegen die Literatur), ausgeschürfte Zungenbecken, den Hauptlauf als echte OSM-Geometrie
mit Flusskilometer je Zelle, 22 Seen, Nebenläufe, Landmarken — und im Eiszeit-Strang
353 400 Felder mit Mittel-/Min-/Maxhöhe, fünf Flag-Bits und **Quellenangabe je Feld**.

Zwischen diesen beiden Welten liegt **kein Kabel.** Das Spiel läuft auf einer
ASCII-Zeichnung, während nebenan ein Höhenmodell steht, das den Bodensee auf den Meter
trifft. Das ist die eigentliche Nachricht dieses Dokuments — nicht „wir bräuchten mehr
Daten", sondern: **wir benutzen nicht, was schon gebacken ist.**

Und der Grössenhaushalt sagt, dass Grosszügigkeit hier nichts kostet: das Eiszeit-Raster
liegt bei 353 400 Feldern und 3,7 MB, also **rund 11 Byte je Feld** — mit drei Höhen,
Flags und Quelle. Das Spielgebiet Landquart–Konstanz hat auf Ebene 1 (2 km) **einige
hundert Felder** (das Streifgebiet des Mesolithikums misst 420). Selbst **32 Byte je
Feld** wären dort ein Rundungsfehler. Wir sparen an der falschen Stelle: nicht am Platz,
sondern an der Frage, was drinstehen soll.

---

## Die drei Schichten eines Feldes

Der wichtigste Beschluss dieses Dokuments ist eine **Zuständigkeitsgrenze**, keine
Datenstruktur. Ein Feld trägt drei Schichten, und sie gehören verschiedenen Besitzern:

| Schicht | Was drinsteht | Wer besitzt sie | Wann berechnet | Für alle gleich |
| --- | --- | --- | --- | --- |
| **1 · Grund** | Gelände, Höhe, Steigung, Exposition, Wasser, Flusskilometer, Seetiefe | **Pipeline** | Bake, einmal | ja |
| **2 · Anlage** | was im Feld *liegt*: Boden, Geologie, Vorkommen, Fundstellen, Gefahren, Erhaltungsbedingungen | **Pipeline** | Bake, einmal | ja |
| **3 · Spur** | begangen, gedeutet, Zeichen, Plättchen, verblasstes Wissen | **Spielstand** | zur Laufzeit | nein, je Partie |

Die Regel dazu, in einem Satz: **Die Pipeline besitzt Schicht 1 und 2, der Spielstand
besitzt Schicht 3 — und nichts wandert je in die andere Richtung.**

Das ist nicht Ordnungsliebe, das ist die Voraussetzung für drei Dinge, die wir schon
beschlossen haben:

- **Gestaltete Welt** — dieselben Daten für alle, statisch, CDN-cachebar. Schicht 1+2
  sind unveränderliche Dateien.
- **Der Nebel geht nie wieder zu** (P3) — Schicht 3 ist die einzige, die wächst, und sie
  ist **dünn besetzt**: nur begangene Felder stehen drin. Ein Spielstand nach zwanzig
  Runden kennt vielleicht 60 Felder. Das passt in ein Autosave, ohne dass jemand nachdenkt.
- **Das Vergessen verfällt schichtweise, nicht flächig** — genau diese drei Schichten
  sind die Ebenen 1/2/3 aus dem Kernmechanik-Papier. Gelände (1) vergisst nie,
  Ertragswissen über die Anlage (2) verblasst, Deutung (3) erlischt mit der Epoche. Die
  Datenarchitektur und die Spielregel sind **dieselbe Unterscheidung** — und das ist ein
  gutes Zeichen dafür, dass beide richtig sind.

### Die eine erlaubte Gegenrichtung: der Epochenübergang vergräbt

> *„Der Boden hat Schichten… Ja! Ein Epochenübergang vergräbt was war. Man kann seine
> alten Lager wiederfinden. Etwas Wertvolles im Boden lassen und es 3 Epochen später
> wieder ausgraben."*

Das kippt die Regel oben — und zwar an genau einer Stelle, kontrolliert. **Beim
Epochenübergang wird Schicht 3 zu Schicht 2.** Was der Klan hinterlassen hat — Lager,
Zeichen, Plättchen, ein absichtlich vergrabenes Ding — sinkt in die Anlage des Feldes ab
und ist ab der nächsten Epoche **nicht mehr Erinnerung, sondern Boden**. Wer davon weiss,
weiss es aus der Chronik; wer es findet, findet es beim Graben.

Das ist die schönste Konsequenz des ganzen Papiers, weil es drei Dinge auf einmal löst:

- **Erinnern bekommt einen vierten Träger.** Neben Körper · Ort · Erzählung steht jetzt
  **Boden** — der einzige, der *unabhängig vom Klan* weiterexistiert. Er ist auch der
  einzige, den man nicht pflegen muss und trotzdem verlieren kann: er hält nur, was der
  Untergrund hält.
- **Der äussere Bogen wird spielbar statt erzählt.** Bisher war „die Archäologie schaut
  zurück" ein Effekt der Schlusszeremonie. Jetzt ist es ein **Zug**: man vergräbt in
  Epoche I und gräbt in Epoche IV. Der Spieler wird zum Archäologen seiner selbst, mitten
  im Spiel, und das braucht keine neue Mechanik — nur diesen Datenweg.
- **Es macht `erhaltung` zum Hauptparameter.** Wer sein Depot im Feuchtboden am Moorrand
  anlegt, findet drei Epochen später Holz, Textil, Korb. Wer es in Schotter legt, findet
  Steine oder nichts. **Der Boden entscheidet, was von einem übrigbleibt** — und der
  Spieler kann das wissen und danach handeln.

Datenseitig ist es billig und muss trotzdem sauber sein:

- Ein Feld trägt `fundschichten[]` — je Eintrag: Epoche, was, Tiefe, Erhaltungszustand,
  **Belegstatus** (`frei erfunden`, weil vom Spieler erzeugt — und das ist ehrlich so).
- Erzeugt wird der Eintrag **einmal, beim Epochenübergang**, von einer Bake-nahen Stufe
  im Spiel, nicht von der Pipeline. Die Pipeline liefert die *vorgespielten* Schichten
  (echte Fundstellen, siehe unten), das Spiel legt die eigenen darüber. Beide liegen im
  selben Feld und sehen beim Graben gleich aus — nur ihr Belegstatus unterscheidet sie.
- Deshalb gilt die Regel jetzt präziser: **Zur Laufzeit einer Epoche fliesst nichts von
  Schicht 3 nach Schicht 2. Am Epochenübergang fliesst es genau einmal, und dann nie
  wieder zurück.** Der Spielstand wächst dabei nicht unbegrenzt: was vergraben ist,
  verlässt Schicht 3 (es ist keine Erinnerung mehr).

---

## Sind die Mammutknochen ab Runde eins auf (x,y) begraben?

**Ja.** Und das ist keine Implementierungsbequemlichkeit, es ist eine Design-Entscheidung
mit vier Gründen:

1. **Der Realitätsabgleich braucht eine Wahrheit.** Die Zeremonie am Epochenende hält dem
   Klan hin, was *tatsächlich* im Boden lag (Authentizität %, Fundstellen x/y). Das
   funktioniert nur, wenn es einen Boden gibt, der vorher schon wusste, was er enthält.
   Würfelt das Spiel den Fund im Moment der Entdeckung, ist der Abgleich eine
   Selbstauskunft — er vergleicht die Erklärung des Spielers mit einer Zahl, die das
   Spiel gerade erst erfunden hat. **Ohne vergrabene Wahrheit gibt es keine Archäologie,
   nur Rückmeldung.**
2. **Ein gewürfelter Fund kann keinen Belegstatus tragen** (P6). „Feuersteinklinge,
   `belegt`, Fundstelle Sennwald" ist eine Aussage über die Welt. „Feuerstein, weil 0.31
   < 0.4" ist keine. Der ganze äussere Bogen des Spiels — die Archäologie schaut zurück —
   hängt daran, dass die Funde **Orte** haben, keine Wahrscheinlichkeiten.
3. **Erforschen in die Tiefe braucht ein Ziel.** Der Vorschlag „der Boden hat Schichten"
   (erstes Begehen Gelände, zweites Vorkommen, drittes Fundstelle) ist nur dann eine
   Entscheidung, wenn im Feld tatsächlich etwas liegt, das man **noch nicht** weiss. Bei
   Laufzeit-Zufall ist das zweite Begehen ein zweiter Wurf, kein tieferes Wissen.
4. **Nebel je Profil** setzt eine stabile Welt voraus, sonst deckt der Spieler beim
   zweiten Durchgang eine andere Welt auf.

**Aber: nicht handgesetzt.** 968 Felder kann man von Hand zeichnen, ein paar tausend
nicht — und die sieben Fundstellen von heute sind schon an der Grenze. Der Weg ist
derselbe wie bei den Zungenbecken: **deterministisch abgeleitet, handkuratiert
korrigiert, und beides deklariert.** Konkret:

- **Abgeleitet** aus Grund + Geologie + Boden mit festen Konstanten (das Muster steht
  schon in `world.ts`: Hash mit festen Konstanten, „dieselbe Welt für alle, keine
  Seeds"). Nur: **im Bake, nicht zur Laufzeit** — damit es inspizierbar, prüfbar und
  vom Map-Team korrigierbar ist.
- **Handkuratiert** dort, wo es die Welt wirklich gibt: echte archäologische Fundstellen
  an echten Koordinaten. Die überschreiben die Ableitung und tragen `belegt`.
- **Deklariert** je Feld: kam dieser Fund aus der Ableitung (`frei erfunden`), aus einer
  Literaturangabe (`historisch inspiriert`) oder aus einer Fundstellendatenbank
  (`belegt`)? Das ist P6 auf Feldebene, und die Pipeline macht so etwas bereits — jede
  Quelle hat einen `provenance`-Block, jedes Eiszeitfeld eine Quellennummer, geschätzte
  Felder ein eigenes Bit.

**Und die Dinosaurier im Jura:** ja — aber nur, wo der *Untergrund* sie trägt. Genau
deshalb steht **Geologie** unten im Parametersatz und fehlt heute als Quelle. Ein
Mammutknochen in Schotterterrassen ist plausibel, einer im Kristallin ist Unsinn, und
Silex kommt aus Kalk, nicht aus Molasse. Sobald das Feld seinen Untergrund kennt,
schreiben sich die Vorkommen fast von selbst — und sie sind dann **erklärbar**, nicht
gestreut. (Der Jura liegt allerdings ausserhalb unseres Spielgebiets; für Landquart–
Konstanz heisst dieselbe Frage: Bündner Schiefer, Helvetikum, Molasse, Seetone.)

---

## Was die Nacht anrichtet, muss am Morgen im Gelände stehen

> *„Ein Wanderer ist im Camp angekommen und erzählt von grossen Herden (diese gibt es
> wirklich, das Spiel hat es selbst erforscht), oder ein Dorfältester bemerkt, das Wasser
> ist grau (bevorstehende Gletschersee-Entleerung, die als Skript in der nächsten Nacht
> wirklich läuft). Man lernt als Spieler die Zeichen zu deuten und zu verstehen."*

Das ist eine Anforderung an die Karte, und zwar eine harte: **ein Vorzeichen darf nie ein
Text sein, der zufällig ausgewählt wurde.** Es muss ein *Symptom* sein — die sichtbare
Nebenwirkung eines Weltzustands, den die Karte tatsächlich führt. Nur dann kann der
Spieler lernen, Zeichen zu lesen, statt Textbausteine auswendig zu lernen. Und nur dann
darf der Morgen ehrlich fragen: *bleibe ich, gehe ich raus, oder verlasse ich diesen Ort?*

Daraus folgen drei Dinge, die heute in keiner Feldstruktur stehen:

**1. Der Fluss braucht eine Richtung und ein Oben.** „Das Wasser ist grau" ist nur dann
ein Vorzeichen, wenn das Feld weiss, **was stromaufwärts liegt** — und dort ein
Gletschersee steht, dessen Pegel steigt. Das heisst konkret: `fliessrichtung` je
Wasserfeld, `stromauf`/`stromab` als Nachbarschaft entlang des Laufs, und
`einzugsgebiet`. Die Pipeline hat dafür alles Nötige (DTM, Hauptlauf mit km, Seen mit
Wanne) und rechnet den Abfluss im Eiszeit-Strang schon — dort war die falsche
UTM-Zone genau deshalb so teuer, weil **die Landesgrenze zur Wasserscheide** wurde. Das
Abflussmodell existiert also; es ist nur nie ins Spielfeld gelangt.

Der Gewinn ist gross: dieselbe Topologie trägt Hochwasser (`gefahr` mit Ursache statt
Würfel), Trübung, Fischzug, Furt-Ausfall und den Gletscherseeausbruch — **ein
Datenstrang, fünf Ereignisse, alle vorhersehbar für den, der hinsieht.**

**2. Nicht alles wohnt in einem Feld.** Herden ziehen. Ein Vorkommen, das sich bewegt,
gehört nicht in die Anlage eines Feldes, sondern in eine eigene, dünne Ebene — aber sie
läuft über die Felder und braucht von ihnen Eigenschaften: `weide` (trägt das Feld eine
Herde?), `wanderkorridor` (kommt sie hier durch?), `fenster` (in welcher Jahreszeit?).
Die Herde selbst ist ein Objekt mit Position und Route, kein Feldwert.

Und das ist genau, was den Wanderer glaubwürdig macht: er erzählt von einer Herde, **die
zu dem Zeitpunkt wirklich an dieser Stelle steht**. Der Spieler kann hingehen und
nachsehen. Wenn die Herde erst beim Hingehen ausgewürfelt wird, war der Wanderer ein
Questgeber; wenn sie schon da war, war er ein Zeuge. Der Unterschied ist das ganze Spiel.

**3. Der Ort erschöpft sich, und das muss man ihm ansehen.** Die Morgenfrage *„verlasse
ich diesen Ort, weil er mir nichts mehr gibt oder weil es zu gefährlich ist?"* braucht
zwei sichtbare Grössen am Feld: die **verbliebene Ergiebigkeit** (Schicht 3 — was der
Klan hier schon geholt hat) und die **anliegende Gefahr** (Schicht 2 + Weltzustand).
Beides sind Zahlen, die die Karte zeigen kann, ohne sie zu beziffern: ein abgeerntetes
Ufer sieht abgeerntet aus, graues Wasser sieht grau aus.

**Anforderung an die Ereignis-Pipeline, in einem Satz:** *Jedes Vorzeichen nennt das Feld
und den Weltzustand, aus dem es stammt — sonst wird es nicht ausgespielt.* Das ist
dieselbe Disziplin, die die Datenquellen schon haben (Provenienz je Quelle), angewandt
auf die Dramaturgie.

---

## Was ein Feld können muss

Gruppiert nach Schicht. Spalte *Verb* sagt, welches Glied der Kette den Parameter
braucht — steht dort nichts, gehört der Parameter nicht ins Spiel.

### Schicht 1 · Grund — aus der Pipeline, unveränderlich

| Parameter | Verb | Quelle | Status |
| --- | --- | --- | --- |
| `gelaende` (flach/hang/ufer/wasser/see) | alle | DTM-Klassifikation | **da** |
| `hoeheM` | erforschen | Sonny-DTM | **da** (25-m-Stufen im Tileset) |
| `steigung` | erforschen | zentrale Differenzen | **da** (nur intern im Bake) |
| `relief` (über dem lokalen Talboden) | erforschen | Blockminimum | **da** (nur intern) |
| `exposition` (Himmelsrichtung des Gefälles) | erforschen, entdecken | DTM | **offen** — steht als v2-Kandidat |
| `wasser` (Fluss/See/Furt) + `kmFluss` | erforschen, erleben | OSM + Haversine | **da** |
| `fliessrichtung` + `stromauf`/`stromab` | **erleben, erklären** | DTM-Abflussmodell | **zu bauen** — Träger aller Wasser-Vorzeichen |
| `einzugsgebiet` (welcher Oberlauf speist mich) | erleben | dasselbe | **zu bauen** |
| `seetiefeM` / `becken` | erleben | swissBATHY3D | **da** (Eiszeit-Strang) |
| `quelle` + `geschaetzt` | — (Werkzeug) | Bake | **da** (Eiszeit-Strang) |

Zwei Anmerkungen. Erstens: `steigung`, `relief` und `exposition` werden heute im Bake
gerechnet und dann **weggeworfen** — nur die Klassifikation überlebt. Das ist der
billigste Gewinn im ganzen Dokument: sie mitschreiben kostet drei Byte und macht
Gangbarkeit, Sonnenhang und Sicht überhaupt erst möglich. Zweitens: `quelle` und
`geschaetzt` sind keine Spieldaten, sondern **Werkzeug** — sie gehören trotzdem ins
Feld, weil ohne sie niemand einem Wert ansieht, ob er gemessen oder geraten ist.

### Schicht 2 · Anlage — was im Feld liegt

| Parameter | Verb | Quelle | Status |
| --- | --- | --- | --- |
| `geologie` (Fels: Kalk/Molasse/Schiefer/Kristallin) | entdecken | **GeoCover `Bedrock` + Chrono-Baum** | **Quelle da** (CH; siehe unten) |
| `boden` (Lockergestein: Moräne/Schotter/Torf/Seeton/Gehängeschutt) | entdecken, erklären | **GeoCover `Unconsolidated_Deposits`** | **Quelle da** (CH; siehe unten) |
| `vorkommen[]` (Feuerstein, Hasel, Fisch, Wild, Ton, Holz, Salz) | erforschen, entdecken | abgeleitet aus Grund + Boden, je Epoche gewichtet | **zu bauen** |
| `ergiebigkeit` (verlässlich … einmalig) | entdecken, erinnern | dieselbe Stufe | **zu bauen** |
| `fenster` (in welcher Jahreszeit das Vorkommen trägt) | erforschen | dieselbe Stufe | **zu bauen** |
| `fundstelle` (Typ, Tiefe, **Belegstatus**) | entdecken, erklären | OSM `historic=*` + Kantonsarchäologie + Hand | **teilweise** (v2-Kandidat) |
| `fundschichten[]` (je Epoche: was, Tiefe, Zustand, Belegstatus) | **erinnern, entdecken** | **das Spiel selbst**, am Epochenübergang | **zu bauen** — siehe *Die eine erlaubte Gegenrichtung* |
| `weide` / `wanderkorridor` | erforschen, erleben | Vegetation + Gangbarkeit | **zu bauen** — trägt die ziehenden Herden |
| `erhaltung` (was überdauert hier: organisch / nur Stein / nichts) | **erinnern, vergessen** | **GeoCover-Lockergestein** (Torf/Verlandung vs. Schotter) | **Quelle da** — damit `belegt` statt geschätzt |
| `gefahr` (Hochwasser, Lawine, Steinschlag, Mure) | erleben | Relief + Exposition + Gerinne + **GeoCover-Instabilitäten** | **zu bauen** |
| `gangbarkeit` (Kosten zu Fuss / zu Wasser) | erforschen | Steigung + Wasser | **zu bauen** |
| `sicht` (wie weit man von hier aus sieht) | erforschen, entdecken | DTM-Sichtbarkeit | **zu bauen** |

Der wichtigste Parameter dieser Tabelle ist **`erhaltung`** — seit dem Vergrabungs-Feedback
ist er kein Zusatz mehr, sondern der Schiedsrichter über `fundschichten`. Er ist billig
(zwei Bit) und der einzige, der das *äussere* Ende des Spiels ehrlich macht: Ein Klan, der seine Zeichen am Moorrand hinterlässt, wird in Modul 5 gefunden. Ein
Klan, der sie auf Schotter legt, ist spurlos verschwunden — **er hat gelebt, aber die
Archäologie weiss nichts von ihm.** Das ist Vergessen als Eigenschaft des Bodens statt
als Regel des Spiels, und es ist genau die Sorte Wahrheit, die dieses Spiel erzählen
will. Der Spieler kann es wissen (Feuchtboden ist sichtbar) und danach handeln, ohne dass
es ihm jemand erklärt.

### Schicht 3 · Spur — im Spielstand, dünn besetzt

| Parameter | Verb | Bemerkung |
| --- | --- | --- |
| `begangen` (Zähler) | erforschen, entdecken | treibt „der Boden hat Schichten" und die Fundwahrscheinlichkeit |
| `geholt` (was der Klan hier schon genommen hat) | erforschen | die Erschöpfung des Ortes — halbe Antwort auf die Morgenfrage „verlasse ich ihn?" |
| `zuletzt` (Runde) | vergessen | Grundlage des Verblassens von Ebene 2 |
| `deutung` (Rahmen: Fluss/Ahnen/Tier/Zufall) | erklären, erinnern | **die Behauptung des Klans über dieses Feld** — nicht seine Wahrheit |
| `zeichen` / `plaettchen` | erinnern | besetzt Raum — deshalb im Feld, nicht in einer Liste |
| `chronikRef` | erinnern | Verweis, kein Text — die Geschichte, die hier am Feuer erzählt wurde |

Kein Parameter dieser Schicht darf je in die Pipeline wandern, und keiner darf im Feld
gespeichert werden, das nie berührt wurde. Wer beides einhält, hat einen Spielstand, der
mit dem Gespielten wächst und nicht mit der Weltgrösse.

---

## Der Untergrund ist gelöst: swisstopo-Geologiekatalog + GeoCover

Die beiden Dateien, die der Lead gefunden hat, sind **nicht die Karte — sie sind das
Wörterbuch dazu**, und das ist genau das Teil, das uns gefehlt hat.

- **`GeologyModelLookUp_V2_1.ili`** — das INTERLIS-Modell des Schweizerischen
  Geologiedienstes: **126 Katalogklassen** in `Geology_Catalogues` plus vier hierarchische
  Bäume in `Geology_CatalogueTrees` (`…_LitStrat`, `…_Litho`, **`…_Chrono`**, `…_Tecto`).
  Jede Klasse trägt einen `GeolCode` (10 Zeichen, eindeutig) und mehrsprachigen Text.
- **`GeologyModelLookUp_V2_1.xml`** — kein Registereintrag, sondern die **Katalogdaten
  selbst** als INTERLIS-Transferdatei (`<TRANSFER xmlns="…/INTERLIS2.3">`, Stand
  2020-12-08): die echten Codes mit ihren Bezeichnungen, z. B.
  `Runc101001 → „erratischer Block"`.

Was fehlt, ist die Geometrie — und die heisst **GeoCover / swissGEOCOVER2D**: der
harmonisierte Vektordatensatz der Oberflächengeologie im Massstab 1:25 000, ganze
Schweiz, als GeoPackage / File-Geodatabase / INTERLIS, frei verfügbar. **Die Attribute
dort sind genau die `GeolCode`s aus diesem Katalog.** Zusammen ergeben die beiden also:
Polygone mit Codes + Codes mit deutschen Namen = ein Feldparameter, den man dem Spieler
hinschreiben kann.

### Was das konkret für unsere Felder bringt

1. **`boden` wird gemessen statt geraten.** Die Klassen `Unconsolidated_Deposits_*`
   (`Kind`, `Composit`, `Admixtur`, `Structur`, `Charact`, `Morpholo`, `Glac_Typ`,
   `Thin_Cov`) sind das Lockergestein: Moräne, Schotter, Gehängeschutt, Rutschmasse,
   Verlandungssediment, Torf. Genau die Unterscheidung, die wir für `boden` gebraucht
   hätten — und wir hätten sie erfinden müssen.
2. **`erhaltung` wird `belegt`.** Das war der Parameter, den ich am stärksten verteidigt
   habe und der als Ableitung `frei erfunden` gewesen wäre. Torf und Verlandungssediment
   erhalten Organisches, Schotter erhält nichts — und beides steht jetzt **als gemessenes
   Polygon** in der Quelle. Damit ist der Satz „wer sein Depot im Moor anlegt, findet drei
   Epochen später Holz und Korb" keine Behauptung des Spiels mehr, sondern eine Aussage
   über die echte Schweiz.
3. **`vorkommen` wird erklärbar.** `Bedrock_PLG_*` trennt Sediment / Magmatit / Metamorphit
   samt Hauptkomponente. Damit gilt: **Silex nur über Kieselkalk und Radiolarit**, Ton nur
   über Seeton, Beilklingen-Rohstoff nur über die passenden Kristallingesteine, Mühlsteine
   über Molassesandstein. Vorkommen sind dann nicht gestreut, sondern begründet — und der
   Spieler kann die Begründung lernen. Das ist das Fundament für „man lernt, die Zeichen zu
   deuten".
4. **Zwei unserer Plättchen kommen aus echten Daten.** `TileKind` kennt bereits `hoehle`
   und `flint`. Karstklassen und Kalk liefern das eine, Kieselkalk/Radiolarit das andere —
   an echten Koordinaten, mit Belegstatus.
5. **Die Mammut-Frage bekommt eine seriöse Antwort.** Der `Chrono`-Baum gibt das *Alter*
   des Gesteins. Was im Quartärschotter liegen kann (Mammut, Rentier), was im mesozoischen
   Kalk (Ammoniten, marine Fossilien) und was gar nicht — das steht dann nicht in unserer
   Fantasie, sondern im Datensatz. Dazu kommen eigene Klassen `Fossils_PT_*`
   (`Kind`, `Division`, `System`, `Dat_Meth`).
6. **Rohstoff- und Bergbauklassen sind Fundstellen-Kandidaten.**
   `Indication_of_Resources_PT_*`, `Mineralised_Zone_L_Kind` und die Abbau-/Geomaterial-
   Klassen sind dokumentierte Vorkommen und historische Abbaustellen — die ergiebigste
   Spur zu `fundstelle` neben OSM `historic=*`.
7. **Deutsche Namen gratis.** Der Katalog ist mehrsprachig; die deutschen Bezeichnungen
   sind bereits die Wörter, die wir im Spiel benutzen würden („erratischer Block"). Bei
   einem Spiel mit deutschem Spieltext ist das kein Detail.

Es gibt im Modell auch **Archäologie-Klassen** (Punkt/Linie/Polygon, mit `Kind`, `Epoch`,
`Period`, `Age`, `Type`). Das ist auffällig nah an dem, was wir für `fundstelle` bräuchten
— **aber Vorsicht: das Modell definiert die Klassen, es beweist nicht, dass der
GeoCover-Datenbestand sie füllt.** GeoCover ist ein Geologie-, kein Archäologiedatensatz.
Vor dem Einplanen: nachsehen, ob in unserer Region tatsächlich Objekte dieser Klassen
liegen. Nicht annehmen.

### Ehrlich zu den Grenzen

- **Nur Schweiz.** swissGEOCOVER2D deckt ausschliesslich die Schweiz ab — und unser
  Spielgebiet liegt am Rhein, wo der Fluss die Grenze ist: **das rechte Ufer
  (Liechtenstein, Vorarlberg) fehlt.** Das ist dieselbe Falle wie beim DTM, wo die
  Landesgrenze zur Wasserscheide wurde. Die Antwort ist dieselbe: ein Register mit
  Vorrangfolge je Land (`hoehen.manifest.json` ist die Vorlage), und für LI/AT eine eigene
  Quelle suchen — sonst hat die halbe Karte keinen Untergrund und wir merken es erst, wenn
  im Ostteil kein einziges Vorkommen liegt.
- **MN95 (LV95, EPSG:2056).** Muss nach WGS84 transformiert werden. Der Bake rechnet
  bereits UTM↔WGS84 mit Snyder-Reihen; für LV95 tun es die swisstopo-Näherungsformeln
  (Meterbereich — bei 2-km-Feldern völlig ausreichend).
- **Format.** GeoPackage ist SQLite, INTERLIS ist XML. Beides braucht eine Abhängigkeit —
  erlaubt, denn das ist Fetch-Stufe. Rohdaten bleiben in `pipeline/data/` und
  **nicht im Repo**, wie die GeoTIFFs.
- **Auflösung 1:25 000 gegen Felder von 2 km.** Wir aggregieren stark. Also dieselbe
  Regel wie beim Terrain: Mehrheitsentscheid übers Feld, aber **seltene, spielrelevante
  Klassen dürfen die Mehrheit schlagen** — ein Silexvorkommen von 200 m verschwindet
  sonst in einem 2-km-Feld, obwohl es der interessanteste Fleck darin ist. Diese
  Ausnahmeliste ist Design-Arbeit, keine Datenarbeit.
- **126 Klassen sind zu viele.** Die eigentliche Aufgabe ist nicht das Einlesen, sondern
  eine **handkuratierte Abbildungstabelle `GeolCode → Spielklasse`** — geschätzt ein
  Dutzend Spielklassen. Versioniert, kommentiert, datengetrieben. Wer die Tabelle pflegt,
  gestaltet das Spiel; wer den Parser schreibt, tippt nur ab.
- **Lizenz:** swisstopo-Nutzungsbedingungen für freie Geodaten — Namensnennung. In den
  `provenance`-Block, wie Sonny (CC BY) und OSM (ODbL).

### Und zur Frage „dynamischer"

Ehrlich gesagt: dieser Datensatz macht die Felder nicht *dynamisch*, er macht sie
**unterscheidbar**. Die Bewegung kommt weiterhin aus Schicht 3 (begangen, gedeutet,
geholt) und aus dem Abflussmodell. Aber ohne Unterscheidbarkeit ist Dynamik wertlos: wenn
alle Felder gleich sind, ist jede Bewegung darauf beliebig. **Der Untergrund ist die
Voraussetzung dafür, dass sich Hingehen unterschiedlich anfühlt** — und damit dafür, dass
Erforschen eine Entscheidung ist statt eine Laufrichtung.

---

## Wie die Pipeline das befüllt

Sechs neue Stufen, jede eine Datei, jede für sich prüfbar — dasselbe Muster wie
`normalize-dtm.mjs` und `normalize-bathy.mjs`. Jede Stufe hat unten einen **Prüfstein**:
eine Zahl, gegen die man sie messen kann, statt sie anzuschauen und für gut zu befinden.
Das ist die Arbeitsweise, die sich im Seegrund bewährt hat (`spiegelM − tiefeM`, 21 von
22 Seen auf 4 m).

1. **`bake-gangbarkeit.mjs`** — Bewegungskosten je Feld aus Steigung und Wasser. Das ist
   *nicht* Kosmetik: aus `kartenwachstum-v1` wissen wir, dass **Korridore nur entstehen,
   wenn Wasser billiger ist als Land** — die Bootstechnik ist der Formgeber der Karte.
   Diese Stufe ist damit die mechanisch wichtigste von allen.
   *Prüfstein:* die gemessene Kurve reproduzieren — Mesolithikum 420 Felder, Neolithikum
   112 (−73 %), Römerzeit −95 gegenüber der Eisenzeit.
2. **`bake-sicht.mjs`** — von jedem Feld aus: wie weit sieht man, und wohin. Aus
   demselben DTM. Auch das ist ein Befund, keine Vermutung: **Sicht folgt dem Tal, nicht
   dem Zirkel** — als Breitensuche durch offenes Gelände hat der Nebel die Form der
   Grate, als Kreis überstrahlt er alles.
   *Prüfstein:* von der Schaaner Furt aus muss das Ried sichtbar sein und das Prättigau nicht.
3. **`normalize-geocover.mjs`** (Fetch-Stufe) **+ `bake-untergrund.mjs`** — Geologie und
   Boden aus GeoCover, übersetzt über die Tabelle `GeolCode → Spielklasse` (siehe
   Abschnitt oben). Die Fetch-Stufe liest GeoPackage/INTERLIS, transformiert LV95→WGS84
   und schreibt `sources/geocover-*.geo.json`; der Bake rastert wie jedes andere Polygon.
   Für Liechtenstein/Vorarlberg bleibt vorerst eine deklariert erfundene Ableitung stehen
   — mit `frei erfunden` markiert, damit die Lücke sichtbar ist statt stillschweigend.
   *Prüfstein:* der Talboden zwischen Buchs und Sennwald muss Schwemmland/Verlandung
   sein, die Hänge nicht — und die deutschen Katalognamen müssen im Inspektor lesbar
   ankommen („erratischer Block", nicht `Runc101001`).
4. **`bake-vorkommen.mjs`** — die Anlage: Vorkommen, Ergiebigkeit, Jahreszeitfenster,
   Gefahren, Erhaltungsbedingungen. Deterministisch, mit festen Konstanten, je Epoche
   eine Gewichtstabelle (**datengetrieben — Tabellen erweitern, keine Sonderfälle im
   Code**, wie überall im Projekt).
   *Prüfstein:* Feuerstein nur über Kalk; Fisch nur an Wasser; Hasel nicht über 1400 m;
   und über die ganze Region eine Vorkommensdichte, bei der ein mittlerer Spieltag zwei
   bis drei erreichbare Ziele hat — nicht zwanzig und nicht null.
5. **`fetch-fundstellen.mjs`** — echte archäologische Fundstellen aus OSM `historic=*`
   plus handkuratiertem Register, **je Fundstelle ein Belegstatus**. Steht schon als
   v2-Kandidat im Pipeline-README („Spielinhalte als eigene handkuratierte Quelle mit
   Koordinaten — dieselbe Pipeline, eigener Layer"). Genau so.
   *Prüfstein:* jede Fundstelle mit Status `belegt` hat eine zitierbare Herkunft im
   `provenance`-Block. Keine Ausnahme.
6. **`bake-abfluss.mjs`** — Fliessrichtung, Stromauf/Stromab, Einzugsgebiet je Feld, dazu
   die Gletscherseen und Rückstaubecken als Objekte mit Pegel. Der Träger jedes
   Wasser-Vorzeichens (graues Wasser, Hochwasser, Furt-Ausfall) und damit die Stufe, die
   den Morgen zu einer Entscheidung macht. Das Abflussmodell existiert im
   Eiszeit-Strang — hier geht es darum, es **ins Spielfeld** zu bringen.
   *Prüfstein:* der Rhein bei Basel führt ~1030 m³/s, nicht 23 (der Fehler, den die
   falsche UTM-Zone einst erzeugte, ist der beste Regressionstest, den wir haben).

Dazu eine Änderung an einer bestehenden Stufe: **`bake.mjs` soll `steigung`, `relief`
und `exposition` mitschreiben**, statt sie nach der Klassifikation wegzuwerfen. Drei
Byte je Feld, und die Stufen 1, 2 und 4 hängen daran.

### Epochen: dasselbe Feld, mehrere Zeitstände

Beschlossen ist bereits: **jede Epoche erbt die Narben der vorigen** (Schwemmland, wo die
Flut lief; Brandlichtungen; neue Uferlinie). Für die Felddaten heisst das nicht „ein
Datensatz je Epoche", sondern **Grundstand plus Delta je Epoche**. Das Meiste ändert sich
nie (Höhe, Geologie, Relief); was sich ändert, ist Vegetation, Uferlinie, Vorkommen und
Gangbarkeit. Deltas sind klein, und der Bake kann sie aus demselben Lauf erzeugen.

---

## Belegstatus je Feldparameter

P6 sagt: jede Karte, jedes Plättchen, jedes Ereignis deklariert `belegt` ·
`historisch inspiriert` · `frei erfunden`. **Das gilt auch für jeden Wert in einem
Feld** — und die Pipeline tut es teilweise schon (Provenienz je Quelle, Quellennummer je
Eiszeitfeld, Bit 0 für geschätzt, „die Maximaltiefe ist Literatur, die Wannenform ist
erfunden").

Daraus wird eine Regel: **kein Feldparameter ohne Herkunft.** Nicht je Wert ein eigenes
Byte — es genügt eine Herkunftsmaske je Feld plus die Provenienz je Bake-Stufe. Der
Gewinn ist doppelt:

- **Für das Team:** man sieht einem Kartenausschnitt an, wieviel daran gemessen ist. Der
  Viewer kann das als Linse zeigen, und die Pipeline hat den Baum dafür schon.
- **Für das Spiel:** der Inspektor kann es dem Spieler sagen. „Feuersteinvorkommen —
  angenommen" neben „Fundstelle Sennwald — belegt" ist kein Kleingedrucktes, das ist
  **das Thema des Spiels in der Benutzeroberfläche.** Ein Spiel, das von der
  Unterscheidung zwischen Wissen und Deutung handelt, sollte sie an der eigenen Datenlage
  vorführen.

### Wahrheit und Behauptung sind zwei verschiedene Werte

> *„Die Engine, die man baut, kann auch aus Teilen bestehen, die nicht der Wahrheit
> entsprechen… Man kann glauben und Glück haben. Oder lügen und mächtig werden. Oder
> behaupten und Recht behalten. So war die Geschichte und so sind die Menschen."*

Datenseitig ist das eine einzige, folgenreiche Zeile: **das Feld führt, was da ist
(Schicht 2, Pipeline). Der Spielstand führt, was der Klan darüber sagt (Schicht 3,
`deutung`). Die beiden werden nie abgeglichen — ausser einmal, in der Zeremonie.**

Das ist der Grund, warum die Trennung der Schichten oben mehr ist als Sauberkeit. Sie
*ist* die Mechanik: Eine Behauptung kann wirken, ohne zu stimmen (die Wünschelrute), ein
Klan kann auf einem Irrtum reich werden, und der Irrtum fällt erst auf, wenn jemand
nachgräbt — im Spiel der Realitätsabgleich, in Modul 5 die Archäologie. Wären Wahrheit
und Behauptung derselbe Wert, wäre keines davon möglich.

Praktische Konsequenz für das Map-Team: **die Pipeline liefert nie eine „Bewertung"**,
nur Befunde. Kein `heilig`, kein `gefährlich`, kein `gut zum Siedeln` — das sind
Behauptungen, und die gehören dem Spieler. Was die Pipeline liefert, ist `feuchtboden`,
`steigung 34 %`, `Fundstelle, belegt`. Die Deutung kommt vom Lagerfeuer.

---

## Was ein Feld dem Kernloop beiträgt

| Verb | Was das Feld liefern muss |
| --- | --- |
| **Erforschen** | `gangbarkeit` (lohnt der Weg?), `sicht` (was sehe ich von hier?), `hoehe`/`steigung` (Reichweite), `fenster` (jetzt oder später?), `geholt` (gibt der Ort noch etwas her?) |
| **Entdecken** | `vorkommen` (die Ernte), `fundstelle` (die Überraschung), `fundschichten` (**die eigene Vergangenheit**), `begangen` (wer hinschaut, sieht mehr), `geologie` (warum ausgerechnet hier) |
| **Erleben** | `gefahr` mit Ursache, `stromauf` (das graue Wasser hat einen Absender), `wasser`/`furt` (abgeschnitten?), `exposition` (die kalte Nordseite), `weide` (wo die Herde steht) |
| **Erklären** | `boden`, `geologie`, `fundstelle` als *Anlass*: ein Ort, der auffällt, verlangt eine Geschichte. Das Feld liefert den Stoff, das Lagerfeuer die Deutung — und `deutung` speichert sie **als Behauptung, nicht als Wahrheit** |
| **Erinnern** | `zeichen`/`plaettchen` (Erinnern besetzt Raum), `chronikRef` (die Geschichte hängt am Ort), `erhaltung` (was überdauert hier überhaupt?) |
| **Vergessen** | `zuletzt` (Ebene 2 verblasst), `deutung` (Ebene 3 erlischt), `erhaltung` (was der Boden nicht hält, ist auch archäologisch weg) |

**Zum Erklären, nach dem Feedback:** gemeint ist die **Kultur des Erzählens** — Geschichten
am Lagerfeuer, später in Zeitungen und Nachrichten, immer als Abendritual. Entschieden ist
auch die Form: *Erklären wird, wenn überhaupt, als Abendkarte gebaut, spielbar anstelle von
Vorbereitung, Härtung oder Rast, und erhöht die Kultur.* Für die Karte heisst das nur
zweierlei, aber das gehört ins Datenmodell: **eine Geschichte handelt immer von einem Ort**
(deshalb `chronikRef` am Feld und nicht nur in einer Liste), und **das Feuer ist auch ein
Ort** — die Abendkarte wird dort gespielt, wo das Lager steht, und was erzählt wird, hängt
davon ab, was der Tag im Gelände fand. Wer ein leeres Tal beging, hat wenig zu erzählen.

Wenn ein vorgeschlagener Parameter in dieser Tabelle keine Zeile findet, wird er nicht
gebacken. Das ist der Filter, den `kernpfeiler.md` für Regeln aufstellt, angewandt auf
Daten.

---

## Baureihenfolge — und der erste Schritt ist im Produkt sichtbar

1. **Das Kabel legen: die Weltkarte kommt aus der Pipeline.** `bake.mjs` bekommt einen
   Ausgabemodus, der die Spielregion Landquart–Konstanz auf Ebene 1 als `RegionCell[]`
   exportiert — **dieselbe Schnittstelle, die `world.ts` heute liefert**, plus
   `hoeheM`, `steigung`, `exposition`. Das ASCII-Raster fällt weg. Nichts am Spiel ändert
   sich ausser: das Tal hat jetzt echtes Relief, echte Ufer, echte Furten.
   *Warum zuerst:* es ist der kleinste Schritt, er ist sofort sichtbar, und er beweist die
   Zuständigkeitsgrenze an einem Beispiel, statt sie zu behaupten. Solange dieses Kabel
   fehlt, ist jede weitere Stufe Vorrat auf Halde.
2. **Gangbarkeit + Sicht** (Stufen 1 und 2). Damit wird der Nebel talförmig und das Boot
   zum Formgeber. Sichtbar als zwei Linsen im Viewer, bevor das Spiel sie nutzt.
3. **Fliessrichtung + Einzugsgebiet** (Stufe 6, neu). Vorgezogen, weil daran die
   Vorzeichen hängen — und Vorzeichen sind das, was den Morgen zu einer Entscheidung
   macht. Erste sichtbare Frucht: graues Wasser, das einen Absender hat.
4. **Untergrund + Vorkommen** (Stufen 3 und 4). Ab hier hat das Feld eine Anlage — und
   der stumme Fund aus dem Kernmechanik-Papier hat etwas, aus dem er kommen kann.
5. **Fundstellen mit Belegstatus** (Stufe 5). Der äussere Bogen bekommt seinen Boden.
6. **Erhaltung + `fundschichten` + Epochen-Deltas.** Der Vergrabungs-Weg. Er kommt
   zuletzt, weil er ein Erinnern voraussetzt, das etwas zu vergraben hat — aber er ist
   das Ziel, auf das die anderen fünf Schritte hinauslaufen: **das eigene Lager drei
   Epochen später wiederfinden.**

Nach Schritt 1 gilt: **kein Handraster mehr.** Wer die Welt ändern will, ändert eine
Quelle oder eine Bake-Regel — und `serve.mjs` kann das schon aus dem Viewer heraus
anstossen (Gebiet ziehen → Pipeline → neu laden). Das Werkzeug für das Map-Team existiert
also bereits; ihm fehlen nur die Stufen, die es aufrufen kann.

---

## Fehlende Quellen

Die einzigen echten Blocker sind Datenquellen, nicht Code:

- **Geologie und Böden** — ✅ **gefunden** (GeoCover + `GeologyModelLookUp_V2_1`, eigener
  Abschnitt oben). Offen bleibt nur das **rechte Rheinufer**: Liechtenstein und Vorarlberg
  sind nicht abgedeckt. Das ist der einzige verbliebene Blocker dieser Zeile und er
  betrifft die halbe Spielkarte — die Geologischen Dienste von LI und AT (GBA Wien) sind
  die nächste Suche.
- **Vegetation der Epochen** — Pollenprofile (Bodenseeraum ist gut untersucht). Das ist
  die Quelle, die aus „Wald" endlich „Eichenmischwald, ab 6000 v. Chr." macht.
- **Archäologische Fundstellen** — OSM `historic=*` ist der Einstieg, aber dünn. Die
  ergiebige Quelle sind die Kantonsarchäologien (SG, GR) und das Fundstellenregister;
  **Lizenz vor Nutzung klären** — dieselbe Sorgfalt wie bei ODbL und CC BY.
- **Gerinne/Hochwasser** — Gefahrenkarten der Kantone; für `gefahr` und die
  Anker-Ereignisse.

Bei jeder gilt die Regel, die sich bei den Seetiefen bewährt hat: **erst den Prüfstein
festlegen, dann laden.** Der Bodensee war auf den Meter richtig, weil vorher feststand,
woran man das merken würde.

---

## Fünf Fragen, die ich dem Map-Team stellen würde

1. **Welche Auflösung ist die Spielauflösung?** Ebene 1 (2 km) ist gesetzt („Bespieltes
   muss in Weltkoordinaten hängen, nicht in Zellindizes"). Reicht sie für die Anlage —
   oder braucht `vorkommen` die feinere Ebene 2 (0,4 km), und das Spielfeld ist eine
   Aggregation daraus?
2. **Wo endet die Ableitung und beginnt die Kuratierung?** Meine Vermutung: Grund und
   Anlage werden abgeleitet, **Fundstellen und Landmarken werden kuratiert** — sie sind
   die einzigen Feldinhalte, die einen Namen tragen.
3. **Wollen wir die Herkunftsmaske im Spiel zeigen?** Ich bin dafür, und zwar nicht als
   Debug-Ansicht, sondern im Inspektor. Aber es ist eine Design-Entscheidung, keine
   Datenfrage.
4. **Wie tief vergräbt eine Epoche?** Wenn jeder Übergang eine Schicht auflegt, ist nach
   Modul 5 alles unter fünf Schichten — und Graben braucht dann eine Tiefenmechanik.
   Meine Vermutung: Tiefe ist keine Zahl, sondern **Anzahl Epochen dazwischen**, und wie
   weit man graben kann, hängt an der Epoche des Grabenden. Ein Mesolithiker findet
   nichts von gestern; ein Römer findet alles bis zur Steinzeit.
5. **Findet man nur seine eigenen Schichten?** Für Einzelspiel reicht „ja". Sobald
   Mehrspieler kommt, ist *fremde* Fundschichten zu finden die schönste Form von
   Interaktion, die dieses Spiel haben könnte — und sie kostet keine gemeinsame Runde.
