# Karten-Pipeline

Quellen → normalisiertes Quellenverzeichnis → Bake → optimiertes Tileset.
Ziel: die ganze Rheinkarte auf mehreren Zoomstufen, effizient renderbar für viele
Spieler parallel — als **statische, unveränderliche Dateien** (gestaltete Welt:
dieselben Daten für alle, CDN-cachebar; gerendert wird pro Client).

```
Quellen (Hand · Sonny-DTM · später OSM/NaturalEarth/Wikidata)
   │  fetch/ + normalisieren (pro Quelle ein Skript; npm-Deps erlaubt,
   │  Rohdaten unter data/, gitignored)
   ▼
sources/*.geo.json + *.grid.json   ← WGS84, mit Provenienz + Lizenz pro Datei
   │  node pipeline/bake.mjs        (dependency-frei)
   ▼
Tileset                ← Hexebenen (10 km, 2 km, 0.4 km …), 32×32-Kacheln,
                         Terrain-/Abschnitts-/Höhen-Layer als base64-Uint8Array,
                         leere Kacheln entfallen; dazu Flusspfad (km), Landmarken
   ▼
Konsumenten            ← heute: prototype/drafts/rhein-tiles-v4.html (Canvas-Viewer +
                         Baum aus Pipeline/Quellen/Ebenen, aus provenance/regionKm)
                         später: app/ (statt handgepflegtem world.ts-ASCII)
   ▲
   └─ serve.mjs: der Viewer kann die Pipeline auch selbst anstossen (Gebiet
      auf der Karte ziehen → neu rechnen), siehe „Pipeline aus dem Viewer"
```

## Ausführen

```
# einmalig: Rohdaten + Deps für die Fetch-Stufe
#   pipeline/data/dtm-switzerland-50m-v2-sonny.tif  ← bit.ly/dtm-switzerland-50m-v2
npm install --prefix pipeline/fetch

node pipeline/fetch/normalize-dtm.mjs      # DTM → sources/sonny-dtm-ch50.grid.json
node pipeline/fetch/fetch-osm-rhein.mjs    # Overpass → sources/osm-rhein-hauptlauf.geo.json
node pipeline/fetch/fetch-osm-rivers.mjs   # Overpass → sources/osm-fluesse.geo.json
node pipeline/fetch/fetch-osm-lakes.mjs    # Overpass → sources/osm-seen.geo.json
node pipeline/bake.mjs                     # sources/ → prototype/drafts/rhein-tiles-v4.data.js
node pipeline/verify-cell.mjs 1 209 304    # Stichprobe: Zelle + Basis-Verteilung prüfen

node pipeline/fetch/hoehen-quellen.mjs --pruefen   # welche DTMs liegen da, was decken sie?
node --max-old-space-size=16384 pipeline/fetch/bake-eiszeit.mjs
                                          # DTMs + sources/ → prototype/drafts/eiszeit-labor-v3.data.js
                                          # (der ganze Alpenbogen bei 50 m Leseauflösung
                                          #  braucht ~1 GB für die Quellraster)

# Höhen-Region wechseln (Standard: Alpenrhein). bake.mjs übernimmt sie
# automatisch — sie steht NUR hier, nicht ein zweites Mal im Bake:
node pipeline/fetch/normalize-dtm.mjs --lonW=9.42 --lonE=9.72 --latS=46.82 --latN=47.12
```

Die Höhenquelle hat bewusst einen **regionsneutralen Dateinamen** und wird bei
jedem Lauf ersetzt: `bake.mjs` würde sonst zwei Regionen zu einer Hülle
zusammenfassen. Die Region selbst steht in `meta.region` in der Datei.

Overpass-Rohantworten werden unter `pipeline/data/` gecacht (gitignored) —
die Fetch-Skripte sind idempotent; bei 504/429 einfach später nochmal laufen
lassen, fehlgeschlagene Quellen werden übersprungen statt abzubrechen.

## Höhenquellen (`sources/hoehen.manifest.json` + `fetch/hoehen-quellen.mjs`)

Das Sonny-DTM der Schweiz endet **exakt an der Landesgrenze**. Für das
Eiszeit-Raster waren damit 6 220 von 28 576 Feldern (21.8 %) geschätzt — und
darunter lag das östliche Nährgebiet des Alpenrheingletschers (Rätikon,
Silvretta, Verwall). Deshalb liest die Pipeline Höhen nicht mehr aus *einer*
Datei, sondern aus einem **Register mit Vorrang** — Stand 20. Aug 2026: mit
AT/DE/IT dazu (LI lag bereits im Schweizer Raster) sind es nur noch 10 Felder:

```
node pipeline/fetch/hoehen-quellen.mjs --pruefen
node pipeline/fetch/hoehen-quellen.mjs --pruefen --lonE=10.35 --fuer=eiszeit
```

- **`sources/hoehen.manifest.json`** — geordnete Liste der DTMs in
  `pipeline/data/`. **Die Reihenfolge ist der Vorrang**: die erste Quelle, die
  für einen Punkt einen Wert liefert, gewinnt (LiDAR vor Radar, Sonny vor
  Copernicus). Je Eintrag: Datei, Land, Lizenz, Herkunft, `stand`, und `fuer`
  (`eiszeit` und/oder `rhein`) — der Bake liest nur, was er braucht.
- **`fetch/hoehen-quellen.mjs`** — öffnet die Quellen, liest je Quelle das
  Regionsfenster **blockweise** und dünnt beim Lesen auf `--maxAufl` (Vorgabe
  50 m) aus. Grund: eine 10-m-Quelle für Österreich wären über 1 GB im
  Speicher, für eine Abtastung auf 200 m — 400-fach überzählig. Erkennt das CRS
  aus den GeoKeys der Datei (geographisch oder UTM) und bricht bei einem
  unbekannten CRS mit Meldung ab statt still falsch zu rechnen.
- `--pruefen` ist die **Sprechstunde**: welche Einträge haben eine Datei, welche
  Auflösung/CRS/Ebene wird gelesen, was liegt sonst noch in `data/` — und eine
  Deckungsprobe auf einem 2-km-Gitter (mit CH allein: „77.6 % gedeckt, 22.4 % ohne
  Quelle"; mit AT/DE/IT dazu: „100.0 % gedeckt").

Bei `--maxAufl=50` liest die CH-Quelle mit Schritt 1, also ihr natives Raster:
der Umbau auf das Register hat die gebackenen Höhen **Wert für Wert nicht
verändert** (`elev`/`emin`/`emax`/`flags` byteweise identisch) — die
Kalibrierung des Eismodells hängt also nicht am Leser.

**Für die Eiszeit-Region liegen alle Dateien vor** (CH, AT, DE, IT — LI ist Teil
der CH-Datei). Was noch fehlt, sind **FR** und **NL** für das Rhein-Tileset. Alle
bei Sonny (sonny.4lima.de, CC BY 4.0); Copernicus GLO-30 steht als Rückhalt im
Register, absichtlich hinten (Radar-DEM, misst Bäume und Dächer mit).

**Folge des Lückenschlusses:** die Eismodell-Kalibrierung (`eiszeit-labor-v2.html`)
hing an der geschätzten Füllung, nicht am echten Relief — mit unveränderten
Parametern erreichte das Eis auf echtem Gelände die belegten Marken (Schaffhausen,
Killwangen) nicht mehr. Neu kalibriert (Fliessgrenze τ 140 → 98 kPa); Details im
`stromlinien-technik.html`- und `stromlinien-handbuch.html`-Kapitel zum Erbe der
Eiszeit.

**Und dann der ganze Bogen** (`eiszeit-labor-v3`): die Region ist von
7.95–10 °O auf **4.7–14.9 °O / 44.9–48.6 °N** geweitet — Rhône-, Aare-, Reuss-,
Linth-, Rhein-, Inn-, Salzach-, Mur- und Draugletscher plus die Amphitheater der
Po-Ebene, 744×475 = 353 400 Felder à 1 km aus **fünf** DTMs. Dafür steht `FR`
im Register jetzt auch auf `fuer: eiszeit`. Silvretta, Verwall und Montafon
liegen damit vollständig drin; `--lonE=10.35` ist erledigt, weil die Region
sowieso bis 14.9 reicht. Die alte Region bleibt mit Flags erreichbar
(`--lonW=7.95 --lonE=10 --latS=46.4 --latN=47.85`), ergibt aber nicht das
identische Gitter (`c0`/`r0` rasten aufs globale Hexgitter ein).

## Nebenstrang: Eiszeit-Raster (`fetch/bake-eiszeit.mjs`)

Eigener, kurzer Weg fürs `eiszeit-labor-v3`-Prototyp: **ein** Skript, das die
rohen GeoTIFFs *und* die normalisierten Geo-Quellen liest und direkt das
Datenfile des Prototyps schreibt.

```
node --max-old-space-size=16384 pipeline/fetch/bake-eiszeit.mjs
node pipeline/fetch/bake-eiszeit.mjs --hexKm=1.5 --lonW=7.95 --lonE=10 --latS=46.4 --latN=47.85
node pipeline/fetch/bake-eiszeit.mjs --fuellMax=4    # Löcher nur 4 Felder weit schätzen
```

Warum es die Stufentrennung überspringt und in `fetch/` liegt:

- Es braucht `geotiff` — und nur die Fetch-Stufe darf npm-Dependencies haben.
- Es darf **keine** neue `kind:"hoehen"`-Datei in `sources/` ablegen: `bake.mjs`
  bildet die Region der DTM-Ebene des Rhein-Tilesets als Hülle über *alle*
  Höhenquellen und würde deren Ausschnitt sonst stillschweigend mitverändern.

Ausgabe (≈ 3.7 MB, Datenformat **v3**, generiert — nicht von Hand editieren):
Hexraster 1 km über den **ganzen Alpenbogen** (744×475 = 353 400 Felder,
4.7–14.9 °O, 44.9–48.6 °N), pro Feld **Mittel-, Min- und Maxhöhe** aus fünf
Sonny-DTMs (Stichproben auf einem 200-m-Gitter innerhalb der Zelle), Flags für
See/Fluss/geschätzt/leer/becken, dazu 60 handkuratierte Landmarken samt
**11 △-Kalibriermarken** in fünf Ländern und 7 Gegenproben, die eisfrei
bleiben müssen (Lyon, Basel, Mailand, Turin, Verona, München, Ulm).

Die Flag-Bits (`flagBits` im Datenfile) sind gewachsen:

| Bit | Name | Bedeutung |
| --- | --- | --- |
| 0 | `geschaetzt` | keine Quelle deckt das Feld, Höhe aus Nachbarn geschätzt |
| 1 | `see` | liegt in einem heutigen See |
| 2 | `fluss` | ein Lauf aus den OSM-Quellen kreuzt das Feld |
| 3 | `leer` | keine Quelle **in Reichweite** — Höhe 0, ausserhalb der Modellfläche |
| 4 | `becken` | die Höhe ist der ausgeschürfte **Seeboden**, nicht der Wasserspiegel |

Die Höhen kommen aus dem **Register** (siehe oben), nicht aus einer festen
Datei: `--maxAufl=50` steuert, wie fein gelesen wird, `fuer: "eiszeit"` im
Manifest, welche Quellen überhaupt geöffnet werden. Je Feld wird zusätzlich die
**Quelle** mitgeschrieben (`quelle`-Array + `hoehenquellen`-Legende im
Datenfile, 0 = keine); eine Zelle am Landesrand bekommt die Quelle mit den
meisten Stichproben.

Wo keine Quelle deckt, wird gefüllt — aber nur **`--fuellMax` Felder weit**
(Vorgabe 12): nächster bekannter Nachbar (erhält die Grössenordnung des
Reliefs, ein Nachbar*mittel* würde die grenznahen Ketten auf Talhöhe glätten),
danach 30 Laplace-Schritte gegen die Voronoi-Keile der Wellenfront. Diese
Zellen tragen Bit 0 — der Prototyp schraffiert sie und kann sie aus dem Modell
ausschliessen.

Was **weiter** weg liegt, wird bewusst **nicht** geschätzt, sondern trägt Bit 3
(`leer`, Höhe 0) und gehört nicht zur Modellfläche: kein Eis, kein Fliessweg,
in keiner Kennzahl, und für die Entwässerung ein Abfluss auf Höhe 0. Auf dem
Alpenbogen betrifft das **20 375 Felder (5.8 %)** — Slowenien und die Nordadria
im Südostzipfel, das einzige Loch, das keine Sonny-Datei deckt. Grund für die
Grenze: ein 15 000 km² grosses Loch mit nächster-Nachbar-Füllung schmiert die
Julischen Alpen als glattes Hochplateau nach Süden und erfindet dem Eismodell
ein Nährgebiet, das es nicht gibt. Copernicus GLO-30 würde die Lücke schliessen
und steht dafür im Register bereit.

### Zungenbecken ausschürfen (Bit 4)

Ein DTM liefert für eine Wasserfläche die Höhe des **Wasserspiegels**, nicht die
des Seebodens. Der Gardasee steht damit als ebene Fläche auf 65 m ü. M. im
Raster — sein Boden liegt 281 m *unter* dem Meeresspiegel. Genau diese
Übertiefung ist die Handschrift der Vergletscherung, und ohne sie ist die
tiefste Wasserfläche im Modell rund 130 m tief.

Der Bake senkt deshalb den Boden ein: je Feld der Abstand zum Ufer (BFS
innerhalb der Seefläche), normiert, daraus eine Wanne (Exponent 0.6 — flacher
als eine Parabel, weil Trogseen steile Wände und einen breiten flachen Boden
haben). Die **Maximaltiefe** ist handkuratiert (Literaturwert, Feld `tiefe` in
`osm-seen.geo.json`), die Form ist erfunden; Bit 4 markiert jedes veränderte
Feld. Die Sohlen treffen die Literatur: Bodensee 145 m ü. M., Gardasee −281 m,
Comersee −213 m, Lago Maggiore −179 m. 1 626 Felder in 22 Seen.

## Quellenverzeichnis (`sources/`)

Eine Datei pro Quelle, GeoJSON FeatureCollection mit einem `provenance`-Block
(Quelle, Beschreibung, Lizenz, Stand). Feature-Arten über `properties.kind`:

| kind | Geometrie | Eigenschaften |
| --- | --- | --- |
| `hauptlauf` | LineString | `order`, `sec` (alpen/bodensee/hoch/ober/mittel/nieder/delta), `name`, `txt` |
| `nebenlauf` | LineString | `name`, `art` (Quellfluss/Deltaarm/Zufluss) |
| `see`, `meer` | Polygon | `name` |
| `bergland` | Polygon | `name` |
| `landmarke` | Point | `name`, `note`, `detail` (nur feine Ebene), `dy` (Label unter dem Punkt) |

Daneben **`*.grid.json`** für Rasterquellen (`kind: "hoehen"`): reguläres
Lon/Lat-Stichprobenraster, Meta (NW-Ecke, Schrittweite, cols/rows, nodata) +
Daten als base64 Int16 (Meter). Erzeugt von `fetch/normalize-dtm.mjs` aus dem
Sonny-DTM (Region Alpenrhein, 200 m Raster, ~286 KB).

Aktuelle Quellen (OSM-Anteile: ODbL, © OpenStreetMap contributors):

- **`osm-rhein-hauptlauf.geo.json`** (`fetch/fetch-osm-rhein.mjs`) — der
  Hauptlauf als OSM-Relation 123924 („Rhein", enthält den Vorderrhein ab
  Tomasee; Waal-Route bis zum Haringvliet) + Lek-Arm (Lek → Nieuwe Maas →
  Scheur → Nieuwe Waterweg bis Hoek van Holland). Die Relations-Wege werden
  **entlang einer groben Referenzlinie geordnet** (Bogenposition; Abweichler
  > 15 km und Parallelkanäle ohne neuen Bogen fliegen raus — Anstückeln nach
  Nähe scheitert an den Parallelarmen im Alpenrheintal), dann an den
  Abschnittsgrenzen in die sieben sec-Segmente geschnitten. Echte Länge:
  **~1265 km** (offiziell ~1233).
- **`osm-fluesse.geo.json`** (`fetch/fetch-osm-rivers.mjs`) — Aare, Reuss,
  Limmat, Seez, Linth, Sihl als echte Läufe (Relation, Fallback auf Wege
  für kleine Flüsse wie die Seez); greedy verkettet, Douglas-Peucker 150 m.
- **`osm-seen.geo.json`** (`fetch/fetch-osm-lakes.mjs`) — **22 Seen** als
  natural=water-Ringe (outer-Wege verkettet, grösster Ring, Douglas-Peucker
  100 m): die fünf des Alpenrheinstrangs (Bodensee inkl. Untersee, Walensee,
  Zürichsee, Obersee, Sihlsee) und, seit der Ausweitung auf den Alpenbogen,
  die übrigen Zungenbecken — Genfersee, Bourget, Neuenburger-, Thuner-,
  Brienzer-, Vierwaldstättersee, Lago Maggiore, Lugano, Como, Iseo, Garda,
  Ammer-, Starnberger, Chiem-, Atter-, Traun-, Wörthersee. Je See eine
  **handkuratierte Maximaltiefe** (`tiefe`, Literaturwert) — das DTM kennt nur
  den Wasserspiegel, siehe „Zungenbecken ausschürfen". Abgefragt wird über den
  exakten `name`-Tag; wer einen See ergänzt, prüft den Namen in OSM zuerst
  (der Genfersee heisst dort **„Le Léman"**, nicht „Lac Léman" — unter dem
  falschen Namen fand die Abfrage nichts und der grösste See der Region fehlte
  stillschweigend, weil ein Fehlschlag nur übersprungen wird).
- **`sonny-dtm-ch50.grid.json`** (`fetch/normalize-dtm.mjs`) —
  echte Höhen, CC BY 4.0 Sonny.
- **`handkuratiert.rhein.geo.json`** — was (noch) nicht aus echten Quellen
  kommt: Nordsee-Küste, Bergland-Polygone ausserhalb des DTM, kleine
  Zufluss-Stummel (Hinterrhein, IJssel, Neckar, Main, Mosel, Ruhr),
  Landmarken.
Nächste Quellen ersetzen/ergänzen sie Datei für Datei — der Bake merged einfach
alle `*.geo.json`; die Provenienz bleibt pro Datei nachvollziehbar (Lizenz!
OSM = ODbL, Natural Earth = public domain).

## Bake (`bake.mjs`)

Node ≥ 18, keine Dependencies. `node pipeline/bake.mjs` schreibt
`prototype/drafts/rhein-tiles-v4.data.js` (`window.RHEIN_TILESET`, version 2 — die
Tileset-Version zählt das Bake-Datenformat, nicht die Viewer-Datei).

Jede `provenance`-Zeile trägt zusätzlich `bbox` (lon/lat) und `bboxKm` (schon in die
Karten-Projektion umgerechnet, direkt zeichenbar) — für den Viewer-Baum ab v3, der
Quellen und Ebenen anklickbar macht und ihre Ausdehnung auf der Karte hervorhebt.

Die **Region der DTM-Ebene wird aus den vorhandenen Höhenquellen abgeleitet**
(Hülle über alle `*.grid.json`), nicht im Bake konfiguriert — sonst müsste
dieselbe Bounding Box hier und in `fetch/normalize-dtm.mjs` doppelt gepflegt
werden. Ohne Höhenquelle bleibt die Ebene ungegated.

- Projektion: lokale Plattkarte über der Bounding Box (lon 3.8–10.0, lat 46.3–52.2),
  km-Raum; Hexes pointy-top, odd-r — **identische Nachbarschaft wie
  `app/src/stromlinien/grid.ts`**.
- **Phase A — Basisraster:** das Flächen-Terrain wird EINMAL auf der feinsten
  Ebene gerastert (Polygone per point-in-polygon, dann DTM-Klassifikation wo
  Höhendaten liegen).
- **Phase B — Ausgabe-Ebenen:** die feinste Ebene übernimmt die Basis direkt;
  gröbere Ebenen werden **aggregiert** (jede Basiszelle stimmt per Zellzentrum in
  ihrer Grobzelle ab — Mehrheit fürs Terrain, Mittel für die Höhe). So erben
  Ebene 1/0 das echte DTM-Relief, und die Ebenen widersprechen sich nicht.
  **Lineare Features** (Hauptlauf, Nebenläufe) werden weiterhin pro Ebene als
  Hex-Linien gerastert (cube lerp) — dünne Linien überleben keinen
  Mehrheitsentscheid. Danach je Ebene: Täler freischneiden (Wasserzelle +
  Nachbarn verlieren Berg/Hang → das Mittelrhein-Durchbruchstal entsteht von
  selbst), Ufer ableiten.
- Stichproben-Prüfung: `verify-cell.mjs <ebene> <c> <r>` zeigt Terrain/Höhe
  einer Zelle und für Ebene < 2 die Terrainverteilung ihrer Basiszellen.
- km entlang des Hauptlaufs aus der realen Polylinien-Länge (Haversine),
  pro Rasterzelle interpoliert. Mit dem OSM-Hauptlauf: ~1265 km (offiziell ~1233).
- Kachelformat: pro 32×32-Kachel zwei Layer (Terrain-Byte, Abschnitts-Byte) als
  base64; Kacheln ohne Inhalt (nur Flachland) werden weggelassen. v1 landet alles
  in einer .data.js-Datei, damit der Prototyp per Doppelklick/file:// läuft — die
  Kachelstruktur ist aber schon so geschnitten, dass jede Kachel später eine
  eigene HTTP-Ressource sein kann (Lazy-Load pro Viewport).

## Recherchierte Quellen (Stand 2026-08-19, via PeakFinder-Ressourcenliste)

PeakFinder (peakfinder.com/de/about/resources) nutzt: Sonny-LiDAR-DTMs (Europa),
NASADEM (weltweit), Viewfinder Panoramas; GIS: OpenStreetMap (ODbL), GeoNames
(CC BY 4.0). Für uns relevant:

| Quelle | Was | Lizenz / Attribution |
| --- | --- | --- |
| **Sonny LiDAR-DTMs** (sonny.4lima.de) | DTMs ganz Europa: 1", 3", 20 m, 50 m; Alpenländer (CH, AT) bis 0.5"/10 m. Speziell: **„DTM Switzerland 50m v2"** — ein GeoTIFF, 40 MB (bit.ly/dtm-switzerland-50m-v2). Auch DE/FR/NL/AT/LI vorhanden → derselbe Weg für den ganzen Rhein. | CC BY 4.0 — Namensnennung „Sonny" + Link auf sonny.4lima.de (Provenienz-Block + Spiel-Credits) |
| **Copernicus GLO-30 / NASADEM** | 30-m-Fallback weltweit/EU-weit, falls ein Land bei Sonny fehlt | frei, Attribution |
| **swisstopo swissALTI3D** | 0.5 m, amtlich, Open Data — für unsere Hexgrössen Overkill, aber Referenz | OGD |
| **OSM via Overpass** | Reale Flussgeometrie (waterway, Relation Rhein → ersetzt handkuratierte Polylinie, km 1050→~1230), `natural=peak` mit Name+Höhe (Landmarken), `historic=*` (Fundstellen-Kandidaten spätere Epochen), Ortsnamen | **ODbL**: Attribution „© OpenStreetMap contributors" + Share-Alike für abgeleitete *Datenbanken* — beachten |
| **GeoNames** | Ortsnamen/Toponyme | CC BY 4.0 |

### Terrain aus dem DTM (umgesetzt für Ebene 2, Region Alpenrhein)

Das 50-m-DTM (UTM 32N, Float32, NoData −32767) trägt bequem Hexes bis ~200–400 m.
`fetch/normalize-dtm.mjs` transformiert WGS84→UTM (Snyder-Reihen), tastet bilinear
ein 200-m-Raster über der Region ab (lon 9.25–9.90, lat 46.75–47.55; 247×443,
Höhen 395–3197 m, ~27 % NoData ausserhalb des CH-Grenzpuffers) und schreibt die
normalisierte Quelle. Der Bake leitet daraus pro Hexzelle der Ebene 2 (0.4 km) ab:

- **Steigung** (zentrale Differenzen über ±hexKm/2) und **Relief** über dem
  lokalen Talboden (Blockminimum ~1.6 km, Min über 3×3 Blöcke).
- Klassifikation (Schwellen in `CLS`, per Screenshot getunt): `berg` bei
  Steigung ≥ 40 % oder Relief ≥ 650 m · **`hang`** bei Steigung ≥ 12 % ·
  sonst `flach`. Wo NoData: Polygon-Fallback bleibt stehen.
- Zusätzlich ein **Höhen-Layer** (25-m-Stufen als Byte) pro Kachel → Viewer
  zeigt Höhenschummerung und „≈ m ü. M." im Inspektor.
- Noch offen: **Exposition** (Richtung des Gefälles) — Südhang → Sonnenhang →
  Rebberg-Kandidat („Weinberge an sonnigen Hängen", Epochen-Ausblick in world.ts).

Ebenen mit `region` liefern nur Kacheln innerhalb der Region; der Viewer schaltet
auf sie nur, wenn die Blickmitte in der Region liegt (`regionKm` im Tileset).
GeoTIFF-Rohdaten (40 MB+) kommen **nicht ins Repo** (`pipeline/data/`, gitignored).

## Pipeline aus dem Viewer (`serve.mjs`)

Erster Versuch, die Pipeline **bedienbar** zu machen statt nur ausführbar —
Kandidat für ein Werkzeug für die Map-Designer:innen.

```
node pipeline/serve.mjs [--port=8181]
→ http://127.0.0.1:8181/prototype/drafts/rhein-tiles-v4.html
```

Im Viewer: **▭ Gebiet ziehen** → Box auf der Karte aufziehen → **Pipeline
starten**. Der Server ruft die beiden Stufen auf (`fetch/normalize-dtm.mjs`
mit der gezogenen Box, dann `bake.mjs`) und streamt deren Ausgabe als NDJSON
zurück; der Viewer zeigt sie im modalen Dialog mit Stufenliste, Fortschritt
und Log. Nach Erfolg lädt „Tileset neu laden" das frisch gebackene Ergebnis.

Bewusst eng gehalten, weil der Server lokale Skripte startet:

- Bindet nur an `127.0.0.1`, reines Entwicklungswerkzeug.
- Startet **genau zwei bekannte Skripte**, kein frei wählbares Kommando,
  kein Shell-Aufruf (`spawn` mit Argument-Array).
- Alle Zahlen werden gegen Grenzen geprüft, bevor sie als `--key=zahl`
  weitergereicht werden; statische Auslieferung mit Traversal-Schutz.
- Ein Lauf zur Zeit (beide Stufen schreiben dieselben Dateien).

Grenzen, die in der Praxis auffallen: das DTM deckt **nur die Schweiz** ab —
eine Box daneben bricht mit klarer Meldung ab und lässt die bisherige
Höhenquelle unangetastet. Sehr grosse Gebiete werden abgelehnt (> 4 Mio.
Rasterpunkte); der Viewer zeigt die geschätzte Punktzahl schon beim Ziehen.
Ein Lauf **ersetzt** die bisherige Höhen-Region, er ergänzt sie nicht.

## Nebenstrang: Terrain-Asset-Pipeline (`bake-terrain-assets.mjs` + `asset-server.mjs`)

Eigener, von der Geodaten-Pipeline unabhängiger Strang: **visuelle** Terrain-Tiles
statt der Flächenfarbe, mit der Terrain heute gezeichnet wird (`COL` in
`app/src/stromlinien/StartScreen.tsx`, `TERRAIN` in den Prototypen). Ziel:
Tile-Kunst als **einzelne, im Explorer sichtbare Dateien** bearbeitbar halten,
aber fürs Rendering **gebündelt** ausliefern — Grundlage für den
`asset-editor-v1`-Prototyp (siehe `prototype/README.md`).

```
pipeline/assets/terrain/<kollektion>/*.svg   ← eine Datei pro Terrain-Art (flach/
                                      ufer/hang/water/lake, aus app/src/
                                      stromlinien/types.ts) UND pro Kollektion —
                                      mehrere Stilrichtungen nebeneinander zum
                                      Durchprobieren, von Hand oder im Editor-
                                      Prototyp bearbeitbar
   │  node pipeline/bake-terrain-assets.mjs   (bündelt ALLE Kollektionen)
   ▼
prototype/drafts/terrain-assets.bundle.js   ← window.TERRAIN_ASSETS, generiert
   ▲
   └─ asset-server.mjs: Editor-Prototyp liest/schreibt die Einzeldateien und
      stösst den Bake an (analog zu serve.mjs, s.o.)
```

- **Terrain-Arten:** acht Dateinamen pro Kollektion — `flach`, `ufer`, `hang`,
  `water`, `lake` (identisch zu `Terrain` in `app/src/stromlinien/types.ts`)
  sowie neu `berg`, `wald`, `eis` (noch **ohne** Entsprechung im App-Typ — ein
  Vorgriff, damit die Asset-Seite nicht auf die Spielmechanik warten muss).
- **Kollektionen:** jeder Unterordner in `assets/terrain/` ist eine eigene,
  unabhängig editierbare Fassung derselben acht Terrain-Arten — vier
  Stilrichtungen (`pastell` weich/leichte Texturakzente, `kontrast` kräftige
  Flächen/grafische Muster, `aquarell` gemalte überlappende Flecken, `linien`
  minimales Karten-/Blueprint-Liniendesign) und drei **Epochen-Kollektionen**,
  die dieselben acht Arten über die Zeit erzählen: `palaeolithisch` (Eiszeit —
  `eis` dominiert grossflächig, `wald` nur spärliche Tundra-Reste, karge
  Farben), `neolithisch` (Ackerbau — Furchen statt Grasbüschel auf `flach`,
  Terrassen am `hang`, `eis` im Rückzug, wärmere Palette), `holozaen` (heute —
  dichter, kräftig grüner `wald`, `eis` nur noch als kleiner alpiner Rest auf
  `berg`). Dieselbe Erzählung wie in den `eiszeit-labor`-Prototypen (Gletscher
  weicht, Wald erobert das Tal zurück, siehe `stromlinien-epoche1.html`-Anker
  „Die Wälder erobern das Tal"), hier als Tile-Kunst statt als Simulation.
  Der Bake bündelt **alle** Kollektionen in ein Bundle; der
  `asset-editor-v1`-Prototyp kann zwischen bereits gebackenen Kollektionen auf
  der Karte **sofort** umschalten (kein erneuter Bake nötig), unabhängig
  davon, welche Kollektion gerade im Editor offen ist. Eine neue Kollektion
  anzulegen heisst: neuen Ordner mit denselben acht Dateinamen anlegen, der
  nächste Bake nimmt sie auf — Ordnernamen bleiben ASCII (`[a-z][a-z0-9_-]*`),
  der Server validiert den Namen strikt gegen Path-Traversal.
- **Format:** SVG, pointy-top-Hexkontur zentriert im Rahmen (viewBox
  `0 0 100 115.47`, `z=100` Kante-zu-Kante) — identische Geometrie wie
  `grid.ts`/`bake.mjs`. Text-basiert (git-diffbar), skaliert verlustfrei über
  alle Zoomstufen, in jedem Text-/Vektoreditor änderbar.
- **Bake** (`bake-terrain-assets.mjs`, keine Dependencies): liest alle
  Kollektionsordner unter `assets/terrain/`, schreibt jede `.svg` unverändert
  (als Text) plus Hash/Version pro Kollektion ins Bundle. Der Konsument
  rastert jede Art jeder Kollektion **einmal** (Canvas) und blittet die Bitmap
  künftig per `drawImage` statt Pfad + `clip()` bei jedem Hexfeld neu
  aufzubauen — das ist der Renderzeit-Gewinn, den `asset-editor-v1` mit einem
  eingebauten Benchmark (echte Uhr, wie in `stromlinien-technik.html`) misst.
- **`asset-server.mjs`** (nur `127.0.0.1`): liefert den Editor-Prototyp aus,
  listet Kollektionen (`GET /api/collections`), liest/schreibt die einzelnen
  `.svg`-Dateien einer Kollektion (`GET`/`POST /api/terrain-assets`) und
  startet **genau ein bekanntes Skript** (`bake-terrain-assets.mjs`,
  `POST /api/publish`, NDJSON-Log) — kein Shell-Aufruf, kein frei wählbares
  Kommando, ein Lauf zur Zeit. Ohne Server bleibt der Prototyp per `file://`
  nutzbar: Karte zeigt das zuletzt gebackene Bundle, Editor ist deaktiviert.
- **Bewusst getrennt von der Geodaten-Pipeline** (`bake.mjs`): andere Quelle
  (handgezeichnete Kunst statt DTM/OSM), anderer Takt (Design-Iteration statt
  Region-Neuberechnung), eigener Server statt `serve.mjs` mitzubenutzen.
- Offen: `berg`/`wald`/`eis` sind reine Asset-Vorgriffe — `Terrain` in
  `app/src/stromlinien/types.ts` kennt sie noch nicht, das Spiel müsste erst
  entscheiden, ob/wie sie als eigene Kartenfelder (statt z. B. `wald` weiterhin
  als aufsetzbares Plättchen) einziehen; noch keine Höhenstufen/Varianten
  innerhalb einer Terrain-Art; noch kein Entscheid, welche Kollektion (falls
  überhaupt eine) den aktuellen Flächenfarbe-Ansatz ablöst (siehe auch die noch
  offene A/B `prototype/ab/gewaesser-kacheln/`, Kacheln vs. Flächenfarbe);
  Bundle noch inline statt Kachel-Dateien (gleiche Abwägung wie beim
  Rhein-Tileset, s. o.).

## Glossar-Knotenbasis (HLS Open Data)

Eigener, unabhängiger Strang neben der Kartenpipeline: eine Knotenliste für ein
Glossar (Begriffe/Personen/Orte/Familien als Inspiration für Waffen, Flora,
Fauna, Technologien), aus dem Open Data des Historischen Lexikons der Schweiz
(hls-dhs-dss.ch/de/opendata).

```
# einmalig: die vier Artikellisten + Autor:innen-Liste (CC-0) manuell laden
#   pipeline/data/hls-dhs-dss/{liste_bio,liste_fam,liste_geo,liste_tem}_d_utf8.csv
#   pipeline/data/hls-dhs-dss/authors_d.xml
node pipeline/fetch/normalize-hls.mjs   # → sources/hls-glossar.knoten.json
```

36'559 Knoten (Person/Familie/Ort/Thema) mit ID, Lemma, Zusatz, URL,
Autor:in (wo vorhanden) und — für Personen — einem aus dem Precision-Feld
geparsten Zeitraum (`von`/`bis`, `circaVon`/`circaBis`, `konfidenz`:
`hoch`/`hoch-circa`/`grob`/`unparsierbar`; 99.98 % parsen sauber, inkl.
Jahrhundert- und v.Chr.-Angaben).

**Bewusst (noch) nicht enthalten** — steht so auch im `provenance`-Block der
Ausgabedatei:

- **Verlinkung zwischen Artikeln (Kanten).** Steckt nur im Artikel-Volltext
  (wiki-interne Links), nicht in den CC-0-Listen. `hls-dhs-dss.ch/robots.txt`
  schliesst ClaudeBot explizit aus (`Disallow: /`) und setzt
  `Content-Signal: ai-train=no, use=reference` — automatisiertes
  Volltext-Scraping für diese Pipeline daher nicht vorgesehen. Ohne
  Ausnahmegenehmigung von HLS bleibt der Graph auf Knoten beschränkt.
- **Feine Raum-/Themen-Taxonomie.** Die Website-Suche nutzt eine interne
  „lexicofacet"-Klassifikation, die nicht Teil der Open-Data-Dateien ist —
  hier nur die grobe Kategorie (welche der vier Listen).
- **Geokoordinaten für Orte.** Nur Namen, kein Lat/Lon — Verortung bräuchte
  Abgleich mit den Ortsnamen der `osm-*`-Quellen oben.
- **Autor:in pro Artikel.** `authors_d.xml` ist trotz Beschreibung kein
  Artikel→Autor:in-Mapping, sondern ein Autor:innen-Verzeichnis (3251
  Personen, je ein Beispielartikel) — das `autor`-Feld ist daher nur bei
  einem kleinen Teil der Knoten befüllt.

Lizenz: CC-0 für diese Metadaten-Exporte. Der Artikel-Volltext selbst ist
CC BY-SA 4.0 (Namensnennung, Share-Alike, auch kommerziell) — für eigene
Glossartexte gilt: Fakten recherchieren, aber selbst formulieren statt eng
paraphrasieren, sonst erbt der Text die Share-Alike-Pflicht.

### Ergänzung: Kanten + Thema/Zeitraum/Inhaltsverzeichnis aus manuellem Browsing

`pipeline/tools/hls-link-collector/` (Browser-Extension) sammelt beim
normalen Lesen im Lexikon pro besuchtem Artikel die ausgehenden Links auf
andere Artikel sowie Titel/Thema/Zeitraum/Inhaltsverzeichnis direkt von der
Seite (siehe deren README) — als JSON in einen Downloads-Unterordner. Genau
die Stücke, die oben unter „bewusst nicht enthalten" fehlten, stehen
tatsächlich auf den Artikelseiten selbst, nur nicht in den CC-0-Exporten.

```
node pipeline/fetch/merge-hls-links.mjs [Ordner]   # Standard: <Downloads>/hls-links
                                                     # → sources/hls-glossar.erfasst.json
```

Eigene, separate Quelle (analog zu `handkuratiert.rhein.geo.json`): wächst
mit jedem besuchten Artikel, kein Vollcrawl, kein Anspruch auf
Vollständigkeit. `hls-glossar.knoten.json` (CC-0-Basis) bleibt unangetastet
und weiterhin per `normalize-hls.mjs` reproduzierbar — die beiden Dateien
werden erst bei einem künftigen Bake-Schritt zusammengeführt (Knoten der
CC-0-Basis + Kanten/Facetten aus `hls-glossar.erfasst.json`, wo vorhanden).

Stand nach dem ersten grösseren Lauf (Epoche 1 einmal durchgelesen):
**104 Artikel, 2186 Kanten**, alle 104 mit Systematik-Pfad(en), 42 mit
mehrgliedrigem Inhaltsverzeichnis, 884 verlinkte Artikel noch unbesucht
(Frontier). Zeitraum bleibt hier bei 0 — Epoche-1-Artikel sind Sachthemen
(Kulturen, Technologien), keine Personen mit Lebensdaten; die Facette greift
erst bei biografischen Artikeln. **Raum wird gar nicht erfasst**: ohne
strukturiertes Feld auf der Seite lieferte die Kantonskürzel-Heuristik auf
Sachthemen fast nur Rauschen („Bildhauerei" → UR wegen eines beiläufig
erwähnten Fundorts) — für Raum braucht es eine andere Quelle.

## v2-Kandidaten

- OSM/Overpass ausbauen: `natural=peak` (Landmarken), `historic=*`
  (Fundstellen-Kandidaten), weitere Zuflüsse (Ill, Thur, Mosel/Main/Neckar
  als echte Läufe statt Stummel), IJssel-Arm.
- **Exposition** im Bake (Sonnenhang-Klassifikation).
- Weitere Sonny-DTMs (DE/FR/NL/AT) → Ebene 2 für weitere Gebiete am Rhein.
- Kacheln als einzelne Dateien + Manifest (HTTP-Lazy-Load statt Inline-JS).
- Spielinhalte (Fundstellen, Anker-Ereignisse) als eigene handkuratierte Quelle
  mit Koordinaten — dieselbe Pipeline, eigener Layer.
- HLS-Glossar-Knotenbasis: Orte gegen die `osm-*`-Ortsnamen matchen (Geokoordinaten
  für die Raum-Facette), Kanton/Region als Facette ergänzen (fehlt in den CC-0-Listen),
  und klären ob/wie eine Verlinkung zwischen Artikeln zustande kommt (HLS um
  Datenzugang anfragen statt Volltext-Scraping — siehe Einschränkungen oben).
