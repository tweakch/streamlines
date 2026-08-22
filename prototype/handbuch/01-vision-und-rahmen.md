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

