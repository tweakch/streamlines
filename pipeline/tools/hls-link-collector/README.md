# HLS Link-Sammler

Chrome-Erweiterung (Manifest V3). Läuft mit beim Lesen auf
hls-dhs-dss.ch/*/articles/* und schreibt pro besuchtem Artikel eine JSON-Datei
mit den ausgehenden Links auf andere HLS-Artikel — Nebenprodukt deines
eigenen, manuellen Browsens, kein automatisierter Crawl (siehe Einschränkungen
in `pipeline/README.md` zur robots.txt der Seite: die betrifft automatisierte
Crawler, nicht Klicks im eigenen Browser).

## Installieren

1. `chrome://extensions` öffnen, **Entwicklermodus** oben rechts einschalten.
2. **Entpackte Erweiterung laden** → diesen Ordner
   (`pipeline/tools/hls-link-collector/`) wählen.
3. Auf dem Erweiterungssymbol den Downloads-Unterordner einstellen
   (Standard: `hls-links`). Das ist relativ zum Chrome-Downloads-Ordner —
   Erweiterungen dürfen keine beliebigen Pfade auf der Platte schreiben. Für
   einen komplett anderen Speicherort: Chrome-Einstellungen → Downloads →
   Basisordner ändern, wirkt automatisch auch hier.
4. Im Lexikon lesen wie gewohnt — bei jedem Artikel mit gefundenen Links
   entsteht/aktualisiert sich `<Downloads>/<Ordner>/<Artikel-ID>.json`.

## Ausgabeformat

```json
{
  "id": "11462",
  "url": "https://hls-dhs-dss.ch/de/articles/011462/2001-01-24/",
  "lemma": "Aal",
  "zusatz": "Johannes",
  "titel": "Aal, Johannes",
  "autor": "Rolf Max Kully",
  "thema": [
    { "pfad": "Künste und Literaturen / Film, Musik, Tanz, Theater / Theater", "code": "3/000100.132500.134600.135300." },
    { "pfad": "Religion (Katholizismus) / Amtsträger / Priester", "code": "3/000100.138400.138500.139300." }
  ],
  "zeitraum": { "geburt": null, "tod": "1551-05-28", "rohtext": "∗ um 1500 ✝ 28.5.1551" },
  "inhaltsverzeichnis": [
    { "titel": "Herkunft", "anker": "#HHerkunft", "eigenschaft": false, "kinder": [] },
    { "titel": "Quellen und Literatur", "anker": "#_hls_references", "eigenschaft": true, "kinder": [] }
  ],
  "erfasstAm": "2026-08-20T10:00:00.000Z",
  "links": [
    { "id": "1620", "href": "https://hls-dhs-dss.ch/de/articles/001620/...", "text": "Aarau" }
  ]
}
```

`id` ist immer ohne führende Nullen — konsistent mit `id` in
`pipeline/sources/hls-glossar.knoten.json`, damit sich beides später
zusammenführen lässt (Knoten aus dem CC-0-Export + Kanten/Facetten aus dieser
Sammlung). `lemma`/`zusatz` entsprechen den gleichnamigen CSV-Feldern.

- **`thema`** kommt aus der "Systematik"-Box jeder Artikelseite — der internen
  HLS-Klassifikation samt Facetten-Code (`f_hls.lexicofacet_string`). Steckt
  nicht in den CC-0-Exporten, nur auf der Seite selbst.
- **`zeitraum`** kommt bei Personenartikeln primär aus unsichtbaren
  schema.org-Microdaten (`itemprop="birthDate"/"deathDate"`, ISO-Format, exakt
  wenn bekannt, leer wenn das Datum als "um"/circa markiert ist) plus dem
  Rohtext der "Lebensdaten"-Zeile aus den Kurzinformationen als Fallback für
  unsichere Daten. Bei Orten/Familien/Themen meist `null` — dort gibt es
  keine vergleichbare Datumsangabe auf der Seite.
- **`raum` wird bewusst nicht erfasst.** Die Seiten tragen kein strukturiertes
  Kanton-/Regionsfeld. Eine erste Version las ein Kantonskürzel in Klammern aus
  dem Fliesstext ("...(AG)..."), das erwies sich beim ersten grösseren Lauf
  (104 Artikel Epoche 1) aber als fast reines Rauschen: "Bildhauerei" → UR,
  "Ernährung" → NE, "Bronzezeit" → ZH — jeweils ein beiläufig erwähnter
  Fundort, keine Zuordnung des Themas zu einer Region. Wer Raum braucht,
  braucht eine andere Quelle (z.B. Abgleich mit OSM-Ortsnamen bei Ortsartikeln).
- **`inhaltsverzeichnis`** kommt aus der TOC-Box (`.hls-toc`) der Seite —
  Abschnittstitel + Anker verschachtelt (Unterabschnitte in `kinder`). Nur bei
  mehrgliedrigen Artikeln vorhanden, sonst `[]` (z.B. bei kurzen Kurzbiografien
  wie "Aal, Johannes" oben). Die letzten ein bis zwei Einträge sind keine
  echten Inhaltsabschnitte, sondern Seitenstruktur ("Quellen und Literatur",
  "Weitere Artikelinformationen") — als `eigenschaft: true` markiert.

## Grenzen

- Erfasst nur Artikel, die tatsächlich besucht werden — kein Vollcrawl, kein
  Anspruch auf Vollständigkeit des Graphen.
- Erneuter Besuch überschreibt die Datei (`conflictAction: overwrite`) — immer
  der Stand des letzten Besuchs.
- Der Sitzungs-Zähler im Popup (`chrome.storage.session`) leert sich beim
  Browser-Neustart; die geschriebenen JSON-Dateien bleiben natürlich erhalten.
- Kein eigenes Icon hinterlegt — Chrome zeigt einen Platzhalter, das ist rein
  kosmetisch und beeinträchtigt die Funktion nicht.
