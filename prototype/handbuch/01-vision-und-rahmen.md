---
nummer: 01
id: k1
titel: Vision & Rahmen
untertitel: Was das Spiel sein will – und wie weit es reichen soll.
banner: 1 VISION
---

## Grundidee: Geschichte eines Orts spielerisch erleben {concept}

Ein Karten- und Plättchenlegespiel für den Browser, in dem Spieler die Geschichte eines realen Orts durchleben – historisch korrekt *und* spannend. Der Konflikt zwischen beidem wird nicht versteckt, sondern zur Designaufgabe: Genauigkeit über Belohnung (Scores, Fundstellen) statt über Verbote.

## Kernpfeiler: das Filterdokument {concept}

Aus dem Feedback eines Spieldesigners übernommen, was zum Projekt passt (Pillars-Dokument, Schichten-Disziplin, Schleifenkarte) – der Rest (Komponenten-Binder, Versionierung von Hand) ist durch Werkstatt-Lifecycle, Archiv und Git bereits besser gelöst. Ergebnis: `notes/kernpfeiler.md`, unter zwei Seiten, **extrahiert aus dem, was sich in Prototypen bewährt hat** – nicht vorab erfunden. Sechs Pfeiler: das Brett ist die Bedienung (ein Punkt, eine Entscheidung) · der Tag ist ein Bogen (Hoffnung → Anstrengung → Lohn → Probe) · Wissen ist der Fortschritt (Nebel geht nie wieder zu) · die Nacht liest deinen Zustand (Waage statt Prüfung) · innen aufwärts, aussen tiefer verstrickt · Belegstatus ist Pflicht.

**Die Filterregel:** jede neue Regel, Karte oder Mechanik muss auf mindestens einen Pfeiler zeigen und ihren Pfeil in die Schleifenkarte eintragen können – sonst gehört sie nach Kap. 09/10. Dazu eine „das Spiel ist nicht…"-Liste (kein Aufbauspiel um des Wachstums willen, kein Survival-Horror, keine Geschichtssimulation, kein Klassensystem, keine Zähler, noch kein Mehrspieler) und **Schichten für Ports nach `app/`**: 1 Skelett (Vier-Phasen-Tag, Punkte) · 2 Fleisch (Sammlerin im Kernloop + Nacht-Waage, im selben Schritt) · 3 Nervensystem (drei Stapel, Ereignisse, Kartenwachstum) · 4 geparkt (Mehrspieler, Epochen II+). Die Werkstatt (`drafts/`) bleibt von den Schichten frei.

::: why Warum die Sammlerin der Prüfstein ist
Sie ist die nächste, die in den Karten-Kernloop kommt – und jeder Pfeiler verlangt etwas Konkretes von ihr: die zweite Personenkarte ist die *erste Karte, die fragt* (P1); ihr verlässlicher Ertrag macht die Nacht-Waage zur Pflicht, sonst ist sie ein Gewinnknopf (P4); ihre Wachstumsschiene Pfade→Träger→Boot formt später die Korridore der Karte (P3); ihr Erbe ist die Sesshaftigkeit, also der Verlust an Welt (P5). Zwei Risikoachsen teilen die Rollen: der Jäger riskiert Entfernung, die Sammlerin Besitz.
:::

Offen: ob die First Experience der Notizen (erste Karte = Jäger, legt sich selbst) mit der Auftakt-Wahl (Jäger *oder* Sammler als erste Entscheidung, Kap. 8) zusammengeführt wird – die Pfeiler verlangen nur, dass beide Einstiege rollenneutral funktionieren. {.dim}

## Glossar: jedes Ding hat genau ein Wort {concept #glossar}

„Karte" hiess bisher drei Dinge (Spielkarte, Landkarte, Handbuch-Karte), „tile" mal das Plättchen, mal das Feld — und daneben geisterten Kachel, plate und hex als Objektnamen herum. Ab jetzt gilt: **ein Ding, ein deutsches Wort, ein englisches Wort.** Deutsch im Spieltext und in Gesprächen, Englisch im Code und in technischen Notizen. Die Silhouette (siehe „Formensprache", Kap. 2) sagt, *was* ein Ding ist; das Glossar sagt, *wie es heisst*.

| Das Ding | Deutsch | English (Code) | nie wieder |
| --- | --- | --- | --- |
| Sechseckiges Teil in der Hand; wird gelegt und **bleibt** auf dem Brett (Uferlager, Höhle …). Silhouette 1 : 1,155 (2/√3), wie ein Feld | **Plättchen** | **tile** (`PlacedTile`, `.tcard`) | ~~Karte~~ · ~~Kachel~~ · ~~plate~~ |
| Festes Sechseck-Feld der Welt; nimmt genau ein Plättchen auf; trägt Gelände, Fluss, Vorkommen | **Feld** | **cell** (`Cell`, `.cell`) | ~~tile~~ · ~~Hex~~ als Name |
| Rechteckiges Teil im Verhältnis 5 : 7; wirkt **sofort** und ist danach verbraucht (Wegzehrung, Späher, Rasttag, Vorrat — und die Nachtkarte) | **Karte** (Effektkarte · Vorrat-Karte · Nachtkarte) | **card** (`.effkarte`, `.hkarte`, `.ncard`) | ~~Plättchen~~ · ~~tile~~ |
| Alle Felder der gespielten Region zusammen; das, worauf gelegt wird | **Brett** | **board** (CSS-Altlast: `.map`) | ~~Karte~~ · ~~map~~ im Spieltext |
| Die Übersicht des ganzen Tals, Landquart–Konstanz, mit dem Nebel des Ungespielten | **Weltkarte** | **world map** (`world.ts`) | blankes ~~Karte~~ |
| Die Sechseckform selbst — reine Geometrie | **Sechseck** (Formwort) | **hex** (`hexNeighbors`) | als Objektname („ein Hex legen") |
| Werte-Anzeige in der Kopfleiste (Nahrung · Schutz · Material · Kultur) — UI, kein Spielmaterial | **Kachel** | **stat panel** | ~~tile~~ |
| Wissenskarte in diesem Handbuch | **Handbuch-Karte** (immer mit Vorsatz) | doc card | blankes ~~Karte~~ |

Die drei Regeln dahinter:

1. **„Karte" ohne Zusatz ist immer die Spielkarte** (5 : 7, wirkt sofort). Die Landkarte heisst Weltkarte oder Brett, die Wissenskarte Handbuch-Karte.
2. **„tile" gehört exklusiv dem Plättchen.** Die feste Position ist die *cell*, nie das tile — genau die Unterscheidung, die `grid.ts` schon macht (`Cell` vs. `PlacedTile`).
3. **„hex" ist eine Form, kein Ding.** Plättchen und Felder *sind* sechseckig; ein „Hex" legt man nicht.

::: why Warum die Form das Wort trägt
Die Formensprache (Kap. 2) hat entschieden: Sechseck = kommt aufs Brett und bleibt, Rechteck = wirkt sofort, Knopf = blosse Wahl. Wenn die Silhouette den Typ sagt, muss das Wort ihr folgen — eine „Sechseck-Karte" wäre eine Lüge in beide Richtungen. Plättchen/Karte auf Deutsch und tile/card auf Englisch ziehen dieselbe Grenze wie die Silhouetten 1 : 1,155 und 5 : 7.
:::

CSS-Klassen im Bestand widersprechen dem Glossar teils (`.tcard` ist ein Plättchen, `.map` ist das Brett) — Altlasten, die bleiben dürfen; neue Namen folgen dem Glossar. Bestandstexte werden beim nächsten Anfassen angepasst, nicht in einer grossen Umschreibung. {.dim}

## Die zwei Stimmen: die Welt spricht innen, die Ausgrabung aussen {idea}

Das Spiel hat zwei Erzähler, und die Immersion hängt daran, dass sie sich **nie vermischen**. Die **Welt** spricht aus dem Inneren der Epoche: im Wir, in der Gegenwart, ohne Jahreszahl, ohne moderne Ortsnamen, ohne zu wissen, dass sie Geschichte ist („Das Wasser ist laut, seit der Schnee geht"). Die **Ausgrabung** spricht von aussen: sie zählt Jahre, nennt Belege, weiss, wie es ausgegangen ist – und sie ist die einzige Stimme, die das darf.

Die Trennung ist nicht nur räumlich (Pane hier, Karte dort), sondern **typografisch und formal**, damit ein Spieler sie in der ersten Minute lernt und danach nie mehr verwechselt: die Welt in der Spielschrift, die Ausgrabung in Mono, hinter einem linken Rand, **nie ohne ihre Marke** (Belegzeichen). Gebaut in `namen-v1`; die Regel „das Werkzeug ist kein Ort der Welt" (Feld-Explorer, Kap. 8) ist derselbe Gedanke, bisher nur auf Interaktion angewandt, nicht auf Sprache.

Damit löst sich auch der Widerspruch zu **P6 (Belegstatus ist Pflicht)**: der Hinweis „historisch inspiriert und vereinfacht" verschwindet nicht, er **zieht um**. Er gehört der Ausgrabung – an den Fund, an das Anker-Ereignis, ins Handbuch –, nie in den täglichen Loop. Der Belegstatus ist damit nicht der Feind der Immersion, sondern ihre zweite Hälfte: eine Stimme, die *später* ist, macht die erste Stimme glaubhaft *jetzt*.

::: why Warum nicht einfach beides mischen
Ein Museumsführer, der mitten in der Szene erklärt, was man da gerade erlebt, nimmt dem Erlebnis die Gegenwart. Sobald „Alpenrhein" oder „10 000 v. Chr." im Spielfeld steht, weiss der Spieler, wo er in einer Zeittafel sitzt – und sitzt damit nicht mehr im Tal. Die Zahl darf existieren; sie darf nur nicht die Welt sein.
:::

Konkrete Altlasten, die dagegen verstossen (Stand Aug 2026): Kopfzeile im Spiel `EPOCHE I · ALPENRHEIN`, `10 000 – 2 000 v. Chr.` (`StromlinienGame.tsx`), Klan-Begrüssung „Willkommen am Alpenrhein" (`KlanScreen.tsx`), Titelschirm „Die Geschichte des Alpenrheintals". `erkundung-v4` hat den ersten Schritt schon getan („vor 12 000 Jahren" statt „v. Chr."); `namen-v1` geht weiter und nimmt der Uhr im Spiel die Zahl ganz ab – sie sagt „das Jahr der Schnüre" und darunter unveränderlich `HIER, JETZT`. {.dim}

## Was der Spieler nicht wissen soll: die Kampagne verrät ihre Tiefe nicht {idea}

Die Überraschung ist ein Designziel, nicht ein Nebeneffekt: der Spieler soll **nicht** am Anfang sehen, wie tief das Spiel reicht. Heute tut die Shell genau das – der Titelschirm nennt die **Rheinkorrektion** (das Ende von Modul V) als Werbetext, und der Epochen-Schirm listet alle fünf Module mit Jahreszahlen (`EpochsScreen.tsx`). Damit ist der Bogen „innen aufwärts, aussen tiefer verstrickt" (**P5**) verraten, bevor er beginnt: wer weiss, dass am Ende ein kanalisierter Fluss steht, kann nicht mehr erschrecken, wenn er dorthin gespielt wird.

Vorschlag: die Epochen sind **Nebel wie die Karte** (P3, der Nebel geht nie wieder zu, aber er geht auch nicht vorzeitig auf). Eine noch nicht erreichte Epoche hat keinen Namen, keine Jahreszahl und kein Thema – nur eine Linie. Erreicht heisst benannt. Dasselbe gilt für den Fortschritt: **kein „X % erkundet"**, keine Übersichtskarte vor dem ersten Zug, kein Rand um die Welt (in `namen-v1` verliert sich die Karte in einer Vignette, statt in einem Rahmen zu enden) – „eine Welt, die grösser ist als das Verstehen" ist eine Aussage über die *Bedienoberfläche*, nicht über die Fiktion.

::: gap Was das kostet
Zurückhaltung kollidiert mit Orientierung. Ein Spieler, der nicht weiss, dass fünf Epochen kommen, weiss auch nicht, wie lang das Spiel ist – und ein Spieler, der nicht weiss, wo er ist, kann sich verloren fühlen statt klein. Zu entscheiden: was die Shell **vor** dem ersten Zug zeigen darf (vermutlich: Klan, Fortsetzen, Regeln – aber keine Zeittafel), und ob es einen Ort gibt, an dem das Ganze *nach* dem Spielen sichtbar wird. Kandidat ist die Chronik: der Rückblick darf alles sagen, der Vorblick nichts.
:::

## Erste Weltkarte: Alpenrhein, Landquart bis Konstanz {concept}

Historisch enorm dichtes Gebiet: Pfahlbauten am Bodensee (UNESCO-Welterbe), römische Provinz Rätien, Kloster St. Gallen und Bistum Konstanz, Konfessionsgrenze der Reformation, im 19. Jh. die Rheinkorrektion – einer der größten Flussumbauten Europas.

::: why Warum ein Fluss
Der Fluss ist Ressource, Gefahr und Bindeglied zugleich – er verbindet Spielerabschnitte mechanisch (Hochwasser wirkt flussabwärts) und erzählerisch.
:::

## Kartenebenen & Geodaten-Pipeline: der ganze Rhein {concept}

Die Welt wächst vom Alpenrhein auf den **ganzen Rhein (Quellgebiet bis Nordsee)** – als Leiter aus zwei Kartenebenen: die **Rheinkarte** (10&nbsp;km/Hex, Kampagne/Navigation, sieben Abschnitte Alpenrhein–Deltarhein) und darunter **Gebietskarten** (~2&nbsp;km/Hex – der Massstab der bestehenden Alpenrhein-Weltkarte). Hexes lassen sich nicht exakt ineinander schachteln; statt geometrischer Unterteilung gilt: **eine Quelle der Wahrheit sind Geokoordinaten (WGS84)**, jede Ebene ist nur eine Projektion derselben Daten in ein anderes Raster. Landmarken existieren einmal (mit Koordinate) und erscheinen auf allen Ebenen konsistent; Nebel/Fortschritt aggregieren nach oben (Zellzentren-Zuordnung, kein perfektes Tiling nötig).

Dazu eine **Pipeline** (`pipeline/`): Quellenverzeichnis mit normalisierten Geodaten-Dateien (pro Quelle Provenienz + Lizenz; umgesetzt: OSM-Hauptlauf als Relation „Rhein" samt Lek-Arm und ~1265 echten km, OSM-Zuflüsse Aare/Reuss/Limmat/Seez/Linth/Sihl, OSM-Seen Bodensee/Walensee/Zürichsee/Obersee/Sihlsee, Sonny-DTM; handkuratiert bleiben Küste, Bergland-Polygone ausserhalb des DTM, Reststummel und Landmarken) → Bake-Schritt rastert die Hexebenen (Bergland-Polygone + Flusslinien, Täler werden freigeschnitten – das Mittelrhein-Durchbruchstal entsteht von selbst) → **optimiertes Kachelformat** (32×32-Kacheln, Byte-Layer, leere Kacheln entfallen). Das Tileset ist statisch und für alle gleich (gestaltete Welt) – dadurch CDN-cachebar und für viele Spieler parallel effizient; gerendert wird pro Client nur der sichtbare Ausschnitt (Viewport-Culling, Lazy-Tile-Decode, Scene-Canvas-Blitting beim Schwenken; Prototypen `rhein-gesamt-v1` und `rhein-tiles-v2`). Die gröberen Ebenen werden **aus der feinsten Basis abgeleitet** (Zellzentren-Zuordnung: Mehrheit fürs Terrain, Mittel für die Höhe; Linien pro Ebene gerastert) — die Ebenen können sich dadurch nicht widersprechen, und das DTM-Relief erscheint auf allen Zoomstufen.

::: why Warum Pipeline statt Hand-ASCII
Die handgepflegte ASCII-Karte (world.ts) skaliert nicht auf den ganzen Rhein und nicht auf mehrere Ebenen. Geodaten als Quelle machen die gestaltete Welt bei wachsender Grösse autorierbar: Genauigkeit wächst mit besseren Quellen, Handkuration bleibt als eigene Quelle mit Provenienz erhalten.
:::

**Höhendaten sind angebunden** (Prototyp): Sonnys LiDAR-DTM der Schweiz (50&nbsp;m, CC&nbsp;BY&nbsp;4.0) wird normalisiert (200-m-Raster, Region Alpenrhein) und der Bake klassifiziert daraus eine **Ebene&nbsp;2 (~400&nbsp;m/Hex)**: Steigung + Relief über dem lokalen Talboden → flach / **Hang** / Berg, dazu Höhenschummerung. Das echte Relief zeichnet Talboden, Hangbänder und Seitentäler (Schanfigg, Domleschg) ohne Handarbeit. Ein **Nebenstrang** nutzt dieselben DTMs für ein 1-km-Hexraster mit Mittel-, Min- und Maxhöhe je Feld (`pipeline/fetch/bake-eiszeit.mjs` → `eiszeit-labor-v3`) – zuerst über Linth- und Alpenrhein-Einzugsgebiet, seit v3 über den ganzen Alpenbogen; ausserhalb der Landesgrenze wurden Höhen geschätzt – **war** so bis Aug 2026: **die Lücke ist geschlossen.** Die Pipeline liest Höhen nicht mehr aus *einer* Datei, sondern aus einem Register mit Vorrang (`pipeline/sources/hoehen.manifest.json`) – mehrere DTMs, die erste Quelle mit einem Wert gewinnt (LiDAR vor Radar), blockweise gelesen und beim Lesen auf die Zielauflösung ausgedünnt, damit eine 10-m-Quelle nicht ein Gigabyte in den Speicher holt. Mit den echten DTMs für AT, DE und IT (alle Sonny, 50 m) dazu – Liechtenstein brauchte keine eigene Datei, es liegt bereits im Schweizer Raster – sind von 28 576 Feldern nur noch **10 ohne Deckung** (vorher 6 220, 21.8 %). Je Feld steht die Herkunft im Datenfile (`quelle` + `hoehenquellen`), und `--pruefen` sagt vor jedem Bake, was gedeckt ist. Was das freilegte, steht unter „Das Erbe der Eiszeit": die Kalibrierung war an die geschätzte Füllung gebunden, nicht ans echte Relief. **Seit v3 ist der Nebenstrang der ganze Alpenbogen** (4.7–14.9&nbsp;°O / 44.9–48.6&nbsp;°N, 744×475 = 353&nbsp;400 Felder aus fünf DTMs – FR steht dafür im Register jetzt auch auf `fuer: eiszeit`; NL fehlt weiter, aber nur für den Rhein). Zwei Dinge hat die Pipeline dabei gelernt, die über die Eiszeit hinausgehen: **ein Loch wird nicht mehr blind gefüllt** – geschätzt wird nur bis 12 Felder weit, alles weiter Entfernte trägt Bit&nbsp;3 *leer* (Höhe 0, ausserhalb der Modellfläche; Slowenien und Nordadria, 20&nbsp;375 Felder), weil eine nächster-Nachbar-Füllung über 15&nbsp;000&nbsp;km² die Julischen Alpen als glattes Hochplateau nach Süden schmiert und dem Modell ein Nährgebiet erfindet. Und: **ein DTM liefert für einen See den Wasserspiegel, nicht den Boden** – der Gardasee steht als ebene Fläche auf 65&nbsp;m im Raster, sein Boden liegt 281&nbsp;m *unter* dem Meeresspiegel. Der Bake schürft die Zungenbecken deshalb aus 22 handkuratierten Literaturtiefen aus (Bit&nbsp;4 *becken*); die Sohlen treffen die Literatur (Bodensee 145&nbsp;m ü.&nbsp;M., Garda −281, Como −213, Maggiore −179). Offen: **Exposition** (Südhang → Sonnenhang → Rebberg-Kandidat), OSM-Flussgeometrie, Kacheln als einzelne HTTP-Ressourcen + Manifest; Übergangs-UX Rheinkarte ↔ Gebiet (Brotkrume, „Gebiet öffnen").

## Kampagne 10 000 v. Chr. bis heute – in fünf Epochen-Modulen {concept}

Eine durchgehende 12 000-Jahre-Partie wäre unspielbar – daher fünf Module, einzeln oder als Gesamtkampagne spielbar:

| Modul | Zeitraum | Kernthema |
| --- | --- | --- |
| I | 10 000–2 000 v. Chr. | Überleben am Wasser, Pfahlbauten |
| II | 2 000 v. Chr.–500 n. Chr. | Rätier, Römer, ferne Macht |
| III | 500–1500 | Klöster, Städte, Konstanz |
| IV | 1500–1800 | Glaube, Grenzen, Schmuggel |
| V | 1800–heute | Industrie, Rheinkorrektion |

Frühere Module bleiben als "archäologische Schichten" unter der aktuellen Bebauung sichtbar. {.dim}

Aus den Notizen zum Spielablauf: Die allgemein-europäischen Zeiträume liegen für das Alpenrheintal um Jahrhunderte daneben. Das **Mesolithikum** (9 600–5 500 v. Chr., Jäger und Sammler, genau die Epoche des heutigen Prototyps) fehlte in einer ersten Fassung ganz und würde sonst in „Modul I" verschluckt; die **Bronzezeit** beginnt hier erst ~2 200 v. Chr. (nicht 4 000), und die **Eisenzeit** endet mit dem Alpenfeldzug bei ~15 v. Chr. (nicht mit einer südeuropäischen Jahreszahl aus dem Süden) – derselbe Anker wie „Rom kommt ins Tal" im Ereignis-Labor (Kap. 8). Vorschlag aus den Notizen: **neun archäologische Stufen als Zeitachse, die fünf Module bleiben die Themen** – ein Modul umfasst dann eine oder zwei Stufen, und die Zeremonie sitzt an der Modulgrenze, nicht an jeder Stufengrenze. Noch zu entscheiden (Kap. 10). Kartengrösse/Zoomstufe je Stufe ist Teil einer separaten, laufenden Abklärung (Zoomstufen-Labor, Kap. 8) und hier bewusst ausgeklammert. {.dim}

## Fünf Gewerke an einer Karte {concept}

Eine Weltkarte ist kein Solo-Werk, sondern ein **gemeinsames Objekt für fünf Gewerke**:

| Gewerk | Rolle | Verantwortet |
| --- | --- | --- |
| Kartografie | Kartendesign | Gelände je Epoche, Flusslauf, Landmarken |
| Biologie | Flora & Fauna | Arten, Lebensräume, Vorkommen über die Epochen |
| Archäologie | Technologie | Plättchen-Katalog (was es wann gab), Fundstellen |
| Geschichte | Ereignisse | Anker- und Streu-Ereignisse, Zeremonien |
| Spieldesign | Mechanik | Kosten, Erträge, Gewichte, Startwerte, Ziele |

Jedes Gewerk hat eine eigene **Sicht** auf dieselben Daten – niemand bekommt ein eigenes Dokument.

::: why Warum eine Karte, nicht fünf Dateien
Die Gewerke müssen sich gegenseitig sehen: Die Biologie braucht das Gelände der Kartografie, die Archäologie die Epochen der Geschichte, das Spieldesign den Katalog der Archäologie. Getrennte Dateien würden genau die Abstimmung verhindern, die eine glaubwürdige Karte ausmacht.
:::

## Globale Erweiterungen (Rhône, Donau, Nil …) {idea}

Weitere Flüsse als eigene Weltkarten – mit denselben Mechaniken, aber ortsspezifischen Ereignissen, Zeremonien und Deutungsrahmen. Voraussetzung ist die Datenschicht (Kap. 4): Engine bleibt gleich, nur Daten ändern sich.

::: why Realistischer Hinweis
Eine Region gut zu belegen kostet Wochen an Recherche. Architektur global anlegen, Datenerfassung als offenes/Community-System bauen – das Rheintal ist die Referenzimplementierung.
:::

## Belegstatus-Kennzeichnung & Chronisten-Karten {idea}

Aus der allerersten Ideenrunde: Inhalte farblich als *belegt / wahrscheinlich / künstlerische Freiheit* markieren. Wo Historiker uneinig sind, wählt der Spieler zwischen "Chronisten"-Karten mit unterschiedlichen Deutungen derselben Quellenlage.

**Die Belegstatus-Hälfte wird verfolgt**: Die Designer-Werkstatt (Kap. 8) führt vier Stufen – *belegt / wahrscheinlich / rekonstruiert / frei erfunden* – plus Quellenfeld an jedem Fakteneintrag (Plättchen, Arten, Ereignisse, Fundstellen) und zeigt die Quellenlage der Karte als Zähler. Bisher nur im Werkzeug, nicht im Spiel sichtbar.

Die **Chronisten-Karten** bleiben unangetastet – weiterhin reine Idee. Passt gut zum Anker/Streu-Modell und zum Deutungsvektor. {.dim}

## Plättchen-Vokabular je Epoche {idea}

Das bisherige Vokabular (Fischgrund, Uferlager, Auenwald, Hochterrasse, Höhle, Feuerstein, Pfahlbau) ist reines Epoche-I-Material. Erste Sammlung für die späteren Module:

| Modul | Plättchen-Kandidaten |
| --- | --- |
| I | Steinbruch, Alp – beide erst durch das Gelände Berg erschlossen |
| II | Römerstrasse, Gutshof (Villa), Rebberg, Kastell |
| III | Kloster, Burg, Markt, Mühle, Brücke/Fähre |
| IV | Zollstation, Bleiche/Leinwand, Saumpfad |
| V | Rheindamm, Eisenbahn, Stickerei-Fabrik, Kraftwerk, Torfstich |

Der Rebberg ist ein gutes Beispiel für Kontinuität: von den Römern gebracht, prägt er die Region bis heute. Das Glyphen-Set wächst mit (Turm, Kreuz, Brücke, Zahnrad …), bleibt aber im kuratierten Petroglyphen-Stil – er ist Signatur, nicht Dekoration. {.dim}

