# Ingest — vom Erzeugnis in die Datenbank

Stufe 4 der Karten-Pipeline. Liest `pipeline/out/karte.sqlite` und überträgt es
in das Postgres-Schema `natur` der Datenbank `welten`.

```
sources/*.json → bake-overlays.mjs → out/karte.sqlite → ingest.mjs → welten.natur
```

Diese Stufe **rechnet nicht**, sie überträgt. Darum hat sie auch kein
Herkunftsprotokoll: es gibt nichts auszustossen, was das Bake nicht schon
verbucht hätte. Sie ist die einzige Stufe der Pipeline, die Nebenwirkungen
ausserhalb des Repos hat.

## Starten

Normalfall: im Aspire-Dashboard die Ressource **`pipeline`** starten. Sie steht
absichtlich auf *Not started* (`withExplicitStart()` in `apphost/apphost.mts`) —
sie ist ein Stapelverarbeiter, kein Dienst, und soll die Datenbank nicht bei
jedem `aspire run` neu schreiben.

Von Hand, einmalig die Abhängigkeit:

```
npm install --prefix pipeline/ingest
```

und dann mit der Verbindungszeichenfolge aus dem Dashboard:

```
ConnectionStrings__welten="Host=…;Port=…;Username=…;Password=…;Database=welten" \
  node pipeline/ingest/ingest.mjs
```

| Schalter | Wirkung |
| --- | --- |
| *(ohne)* | überträgt, was in `out/karte.sqlite` steht; fehlt die Datei, wird zuerst gebacken |
| `--bake` | erzwingt `bake-overlays.mjs` vor dem Übertragen |
| `--karte=<pfad>` | andere SQLite lesen |
| `--nur-schema` | nur Schema anlegen/aktualisieren, nichts übertragen |
| `--hilfe` | Kopfkommentar von `ingest.mjs` ausgeben |

Es gibt **keinen Vorgabewert für die Verbindung**. Ohne
`ConnectionStrings__welten` bricht die Stufe ab, statt stumm in eine fremde
Datenbank zu schreiben.

## Die zwei Hälften des Schemas

Das ist der Entwurfskern, ausführlich in `schema.sql` kommentiert:

| | Teil 1 — die gebackene Karte | Teil 2 — die Naturengine |
| --- | --- | --- |
| Was | `datenquelle` `ebene` `overlay` `klasse` `kachel` `zellwert` `ledger` `karte_meta` | `quelle` `art` `art_parameter` `befund` `befund_kandidat` `bedingung` `tor` `parametersatz` `lauf` `lauf_tor` `zustand` |
| Herkunft | vollständig aus `out/karte.sqlite` | von Hand erfasst, extrahiert, oder von der Simulation erzeugt |
| Beim Ingest | wird geleert und neu geschrieben | **bleibt unangetastet** (Ausnahme: `tor`) |

Deshalb zeigt **kein Fremdschlüssel aus Teil 2 auf Teil 1**. `bedingung.ebene`
und `zustand.ebene` sind einfache Zahlen: sonst hinge gesammeltes Wissen an
einer Tabelle, die die Pipeline routinemässig leert. Ein Befund wird niemals
von der Simulation überschrieben — das ist der Punkt der ganzen Trennung.

Die Übertragung läuft in **einer** Transaktion. Entweder die Karte ist ganz
drin, oder die alte bleibt stehen: eine halb übertragene Karte wäre schlimmer
als eine veraltete, weil sie gültig aussieht.

## Die fünf Evidenz-Tore

`natur.tor` ist die einzige Wissenstabelle, die der Ingest schreibt — sie ist
Projektkanon, keine erhobenen Daten, und steht als Datentabelle oben in
`ingest.mjs`:

| | Zeit | Erwartung |
| --- | --- | --- |
| `g1` | 40 000 BP | kaltzeitliche Landschaft, offene Vegetation, kein geschlossener Wald |
| `g2` | 30 000 BP | Abkühlung Richtung LGM, Eis nimmt zu |
| `g3` | 20 000 BP | letzteiszeitliches Maximum — das stärkste Tor |
| `g4` | 10 000 BP | frühes Holozän, Pioniervegetation, Birke und Kiefer |
| `g5` | heute | Kalibrierung; Naturzustand ≠ menschlich veränderter Zustand |

Ein Tor ist ein **Zielbereich, keine exakte Karte**. Ein Lauf bekommt je Tor
einen Score in `natur.lauf_tor`; aus den fünf Scores fällt der Fehler, an dem
der Parameter-Optimierer arbeitet.

## Was noch fehlt

Die Wissens-Hälfte ist heute leer — der Ingest zeigt sie am Ende jedes Laufs
ausdrücklich mit ihren Nullen an, weil die leeren Tabellen der nächste
Arbeitsvorrat sind:

- **Arten und Parameter** (`art`, `art_parameter`) — ~15–25 Parameter je Art,
  je als Verteilung (`mittel`, `streuung`, `konfidenz`), nicht als Zahl:
  gleiche Naturgesetze, verschiedene Welten. `herkunft = 'literatur'` darf
  nicht optimierbar sein, das erzwingt eine Check-Bedingung.
- **Quellen und Befunde** (`quelle`, `befund`) — Literatur von Hand, dann
  Extraktion nach `befund_kandidat` mit Validierung davor.
- **Bedingungen** (`bedingung`) — aus Befunden abgeleitet, mit
  `reichweite_km` als Flüssigkeitsprinzip: ein Nachweis macht auch die
  Nachbarschaft plausibler, nicht nur seine eigene Zelle.
- **Simulation** (`parametersatz`, `lauf`, `lauf_tor`, `zustand`) — noch kein
  Rechenwerk. Das Schema hält bereits fest, was ein Lauf reproduzierbar macht:
  Parametersatz + Modellversion + Saat.

## Zwillingscode

`verbindung.mjs` übersetzt die .NET-Verbindungszeichenfolge des Harness in eine
`pg`-Konfiguration. Dieselbe Übersetzung steht in `server/api/server.js` —
bewusst zweimal: zwei getrennt gestartete Prozesse in zwei getrennten
npm-Bäumen, und zwanzig Zeilen Parser sind billiger als eine geteilte
Abhängigkeit zwischen `server/` und `pipeline/`. Wer die eine ändert, ändert
die andere mit.
