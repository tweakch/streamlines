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
Konsumenten            ← heute: prototype/drafts/rhein-tiles-v2.html (Canvas-Viewer)
                         später: app/ (statt handgepflegtem world.ts-ASCII)
```

## Ausführen

```
# einmalig: Rohdaten + Deps für die Fetch-Stufe
#   pipeline/data/dtm-switzerland-50m-v2-sonny.tif  ← bit.ly/dtm-switzerland-50m-v2
npm install --prefix pipeline/fetch

node pipeline/fetch/normalize-dtm.mjs      # DTM → sources/sonny-dtm-ch50.alpenrhein.grid.json
node pipeline/fetch/fetch-osm-rhein.mjs    # Overpass → sources/osm-rhein-hauptlauf.geo.json
node pipeline/fetch/fetch-osm-rivers.mjs   # Overpass → sources/osm-fluesse.geo.json
node pipeline/fetch/fetch-osm-lakes.mjs    # Overpass → sources/osm-seen.geo.json
node pipeline/bake.mjs                     # sources/ → prototype/drafts/rhein-tiles-v2.data.js
node pipeline/verify-cell.mjs 1 209 304    # Stichprobe: Zelle + Basis-Verteilung prüfen
```

Overpass-Rohantworten werden unter `pipeline/data/` gecacht (gitignored) —
die Fetch-Skripte sind idempotent; bei 504/429 einfach später nochmal laufen
lassen, fehlgeschlagene Quellen werden übersprungen statt abzubrechen.

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
- **`osm-seen.geo.json`** (`fetch/fetch-osm-lakes.mjs`) — Bodensee (inkl.
  Untersee), Walensee, Zürichsee, Obersee, Sihlsee als natural=water-Ringe
  (outer-Wege verkettet, grösster Ring, Douglas-Peucker 100 m).
- **`sonny-dtm-ch50.alpenrhein.grid.json`** (`fetch/normalize-dtm.mjs`) —
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
`prototype/drafts/rhein-tiles-v2.data.js` (`window.RHEIN_TILESET`, version 2).

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

## v2-Kandidaten

- OSM/Overpass ausbauen: `natural=peak` (Landmarken), `historic=*`
  (Fundstellen-Kandidaten), weitere Zuflüsse (Ill, Thur, Mosel/Main/Neckar
  als echte Läufe statt Stummel), IJssel-Arm.
- **Exposition** im Bake (Sonnenhang-Klassifikation).
- Weitere Sonny-DTMs (DE/FR/NL/AT) → Ebene 2 für weitere Gebiete am Rhein.
- Kacheln als einzelne Dateien + Manifest (HTTP-Lazy-Load statt Inline-JS).
- Spielinhalte (Fundstellen, Anker-Ereignisse) als eigene handkuratierte Quelle
  mit Koordinaten — dieselbe Pipeline, eigener Layer.
