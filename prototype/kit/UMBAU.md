# Umbau der Drafts auf den Baukasten

Ein Ablauf, der aus 21 Einzelentscheidungen eine Liste macht — und aus jedem
Umbau eine Mängelliste für den Baukasten.

**Die Grundhaltung:** Der Umbau ist nicht das Ziel. Der Baukasten ist das Ziel,
und jeder Draft ist ein Prüffall, der entweder durchläuft oder einen Mangel
meldet. Wer die Reihenfolge umdreht und „nur schnell umbauen" will, biegt die
Dateien passend — und der Baukasten lernt nichts.

## Der Bestand, gemessen

`node prototype/kit/audit.mjs` über alle 21 Drafts:

| | |
| --- | --- |
| CSS-Zeilen insgesamt | **2 288** |
| Regeln **byte-gleich** mit dem Baukasten → ersatzlos löschen | **184** |
| Regeln **ähnlich** (gleicher Selektor, anderer Wert) → ansehen | **426** |
| **Kollisionen** (gleicher Name, andere Bedeutung) → umbenennen | **34** |
| Selektoren, die der Baukasten **nicht kennt** | **1 097** |
| **Harte Farben** (`#hex`, `rgba(…)`) → Tokens | **585** |
| eigene Tokens | 42 |

Die 585 harten Farben sind die eigentliche Zahl. Jede einzelne ist eine Stelle,
an der Tag/Nacht/Werkbank bricht.

## Was dabei herauskommt

Nicht „weniger Code" — das wäre die schwächste Begründung. Sondern:

1. **12 von 21 Drafts haben heute eine Nachtschaltung, 9 nicht.** Nach dem Umbau
   haben alle 21 sie, plus `?werkbank`, ohne eine Zeile dafür. Ein Prüfstand, den
   man nachts ansehen kann, deckt andere Fehler auf als einer bei Tag.
2. **13 Drafts basteln eigenes `URLSearchParams`-Gefummel, keiner dokumentiert
   seine Parameter.** Nach `SOT.params()` hat jeder `?hilfe` — eine Tafel aller
   Parameter mit Typ, Vorgabe und Bedeutung. Die Werkstatt-Regel „jeder innere
   Zustand per Query erreichbar" hängt dann nicht mehr an Fleiß.
3. **Ein Fehler wird einmal behoben, nicht n-mal.** Die Nachtfarbe der Marke
   „wahrscheinlich" war in zwei Dateien falsch; `sizeHexes()` ließ in vier
   Dateien die Hexe still auf der CSS-Vorgabe stehen. Nach dem Umbau gibt es je
   eine Stelle dafür.
4. **Der nächste Prototyp fängt bei 60 % an.** Das ist der Zweck des Baukastens
   und der einzige Grund, warum sich der Umbau rechnet.
5. **Der Baukasten wird belegt statt behauptet.** 21 Dateien sind 21 Prüffälle.
   Was nach dem Umbau noch im Baukasten steht, hat sich gegen den ganzen Bestand
   bewährt.

## Reihenfolge: ein Pilot, fünf Sonden, dann Kehraus

Nicht nach Größe sortieren und nicht nach Deckungsgrad. **Nach Familie** — denn
innerhalb einer Familie überträgt sich die Erkenntnis, zwischen Familien nicht.
Ein zweites Handbuch lehrt nach dem ersten nichts mehr; das erste Labor lehrt
alles über die fünf anderen.

### Pilot — `stromlinien-handbuch.html`

100 % der Selektoren und 100 % der Tokens sind schon abgedeckt, 0 fehlen. **Der
Pilot prüft nicht den Baukasten, sondern den Ablauf.** Wenn hier ein
Bildunterschied bleibt, ist das Werkzeug falsch, nicht der Baukasten. Erst wenn
diese Datei mit 0 % durchläuft, taugt der Rest.

### Fünf Sonden — je die schwierigste ihrer Familie

| Familie | Sonde | fehlt | warum diese |
| --- | --- | --- | --- |
| Dokument (4) | *durch den Piloten erledigt* | 0 | |
| Spiel/Bühne (4) | `stromlinien-epoche1.html` | 76 | kanonischer Kernloop; `.chip`-Kollision, HUD, Hexraster |
| Labor (6) | `ereignis-labor-v1.html` | 119 | geringste Deckung (46 %) bei **perfekter** Token-Deckung — also fehlt reine *Struktur* |
| Editor (2) | `map-editor-v3.html` | 100 | Linsen, Paletten, Listen, Belegstatus |
| Viewer/Werkbank (4) | `rhein-tiles-v4.html` | 94 | 0 gleiche Regeln — hier steht die Token-Umbenennung |
| Shell/Meta (1) | `profil-hub-v2.html` | 73 | ganze Familie fehlt im Baukasten (Schalter, Profilzeile, Code-Feld) |

Nach jeder Sonde: **Baukasten nachziehen, Musterbogen ergänzen, Piloten
nachmessen.** Der Pilot ist ab jetzt der Regressionstest — ändert eine Sonde den
Baukasten so, dass das Handbuch sich verschiebt, war die Änderung zu grob.

### Kehraus — die restlichen 15

Jetzt mechanisch. Innerhalb einer Familie in der Reihenfolge, die `audit.mjs`
ausgibt (viele gleiche Regeln zuerst): die sind am schnellsten und bauen
Vertrauen ins Werkzeug.

## Der Ablauf je Datei

```
# 1  Bezugspunkt einfrieren — VOR jeder Änderung
node prototype/kit/vergleich.mjs friere drafts/foo-v1.html

# 2  Arbeitsliste holen
node prototype/kit/audit.mjs drafts/foo-v1.html

# 3  Baukasten verlinken, [gleich] löschen, [KOLLISION] umbenennen,
#    harte Farben zu Tokens, eigenes CSS ganz nach unten

# 3b Schriftzeichen-als-Icon ersetzen (Regel: Icons sind SVG)
node prototype/kit/icons-audit.mjs drafts/foo-v1.html

# 3c Spielkarten auf die Baukasten-Zonen heben: .effkarte/.hkarte/.karte →
#    .effektkarte; .art-Zeile → .kband (Art aus dem Wortschatz, Dauer aus
#    dem Regeltext ziehen) — Mapping im README, Abschnitt „Die Spielkarte"

# 4  Nachmessen
node prototype/kit/vergleich.mjs pruefe drafts/foo-v1.html

# 5  Jeder Bildunterschied wird ERKLÄRT, nicht weggeräumt.
#    Entweder: Absicht (dann Schwelle nennen und begründen)
#    oder:     Mangel im Baukasten (dann Baukasten ändern, nicht die Datei)

# 6  Ledger in prototype/README.md nachziehen
```

Schritt 1 ist nicht optional. `friere` legt eine **Kopie auf die Platte** und
nimmt jede Ansicht **zweimal** auf, um den Determinismus zu belegen. Das ist die
Lehre aus `drafts/stromlinien-technik.html`: *„Die Gegenprobe prüfte sich
selbst"* — dort rief der Prüfcode für den alten Weg dieselbe Funktion auf, die
gerade geändert worden war, und meldete pflichtschuldig „identisch". Ein
„vorher", das aus der Datei kommt, die man gerade umbaut, misst nichts.

Gemessen: `stromlinien-epoche1` und `ereignis-labor-v1` sind unter
`--virtual-time-budget` **auf 0 Bildpunkte deterministisch**, auch mit
`?autostart`. Trotzdem prüft `friere` es je Datei nach — bei einer Datei mit
freilaufendem `Math.random()` im ersten Bild wäre es sonst Rauschen, und die
0,02-%-Schwelle wäre Zierde.

## Die Fallen — alle am Bestand belegt

### 1. Gleicher Name, andere Bedeutung (34 Fälle)

Der gefährliche Fall: nach dem Verlinken erbt die Datei stillschweigend eine
fremde Bedeutung. `audit.mjs` markiert sie als `[KOLLISION]`.

| Name | Baukasten meint | Der Bestand meint auch |
| --- | --- | --- |
| `.chip` | anklickbare Marke | **Ressourcenkachel** (`.chip b` groß + `.chip span` Etikett) in 3 Spielprototypen — das ist `.stat`/`.res`. Und in `feld-labor`/`gewaesser-labor` ist `.chip.on` **gefüllt** (`background:var(--ink)`), im Baukasten nur umrandet. |
| `.stage` | Bühne im Telefonformat, `min-height:100dvh`, flex column | Ereignis-Tafel (`ereignis-labor`), ganzer Bildschirm (`feld-labor`, `profil-hub`). **Eine der drei layoutet die Seite.** |
| `.slot` | Markenplatz im Hexfeld, `position:absolute` | Abschnittsblock mit linker Kante (`ereignis-labor`). Absolute Positionierung auf einen Block zerlegt ihn. |
| `.seg` | segmentierte Wahl (Behälter) | **ein** Zeitleistenfeld (`ereignis-labor`) — das ist `.tl-seg`. |
| `.pers` | runde Personenmarke | SVG-Textmarke (`ereignis-labor`). |
| `.card` | Dokumentkarte, zugeklappt (`.cbody{display:none}`) | Kennzahlkachel (`mechanik-labor`), Onboarding-Fläche (`profil-hub`). **Wer `sot-doc.css` lädt und `.card` anders meint, versteckt seinen Inhalt.** |
| `.tab` | Reiter sind `.tabs > button` mit `.on` | Kachel mit `.sel` (`mechanik-labor`, `map-editor`) — `.on` greift dort nicht. |
| `.dim` | Klasse für gedimmten Text | **Token** `--dim` (= `--ink2`) in 5 Werkbank-Dateien. |

### 2. `line-height` auf `body` — bereits behoben

Von 21 Drafts setzen es **genau die vier Wissensdokumente** (auf 1.6); die 17
Spiel- und Laborprototypen laufen auf `normal` und bemessen die Zeile dort, wo
Text steht. Der Baukasten schrieb anfangs `1.55` auf `body` — das hätte **jeden
der 17** umgebrochen. Steht jetzt nicht mehr drin (`sot-doc.css` setzt 1.6 für
die Dokumente, `p` bekommt 1.5). *Erster Fund dieser Analyse, und der teuerste,
den man beim dritten Umbau bemerkt hätte statt beim nullten.*

### 3. Der Baukasten verlangt Klassen, wo der Bestand Elemente stylt

`audit.mjs` meldet `header` als in **14 Dateien** fehlend, `table`/`th`/`td` in
3 — weil der Baukasten `header.appbar` und `table.t` schreibt. Jede Migration
müsste also Markup anfassen. **Das ist eine Baukasten-Entscheidung gegen 14
Stimmen.** Vor dem Kehraus umdrehen: `header` und `table` unklassiert gestalten,
`.appbar`/`.t` als Modifikator. Spart Markup-Änderungen in 14 Dateien.

### 4. Zustandsnamen sind nicht einheitlich

`.on` (34 Definitionen / 15 Dateien) · `.sel` (17 / 10) · `.now` (5 / 11) ·
dazu einmalig `.live`, `.active`, `.cur`, `.hit`. Der Umbau ist der Moment, das
zu entscheiden. Vorschlag mit drei festen Bedeutungen statt einer Wahl:

- `.on` — ein **Bedienelement** ist eingeschaltet (Knopf, Marke, Reiter)
- `.sel` — ein **Eintrag** ist ausgewählt (Liste, Raster, Feld)
- `.now` — die **aktuelle Stelle in der Zeit** (Runde, Abschnitt, Epoche)

`SOT.tabs()` und die Listenhelfer müssen dann beides annehmen können, sonst
verlagert die Regel nur die Arbeit.

### 5. Der Reset ist geteilt

Die Drafts tragen `*{box-sizing}`, `html,body{margin:0}` selbst. Beim Löschen
prüfen, ob die Datei zusätzlich `overflow:hidden` oder `min-height:100vh` auf
`body` hatte (2 Dateien haben `min-height:100vh`) — das ist Layout, nicht Reset,
und muss bleiben.

### 6. `@import` muss zuerst stehen

Behält eine Datei ihren eigenen Fonts-`@import` im `<style>`, ist das doppelt
aber harmlos. Steht er **nach** einer anderen Regel, ignoriert der Browser ihn
stillschweigend und die Schrift fällt auf `system-ui` zurück — das ist ein
Bildunterschied über die ganze Seite und leicht als „Baukasten kaputt"
fehlzulesen. Beim Löschen den `@import` mitlöschen; `sot.css` bringt ihn mit.

### 7. Die großen Karten nicht auf `sot-hex.css` zwingen

`eiszeit-labor-v3` (114 000 Felder), `rhein-tiles-v4`, `zoomstufen-labor`,
`kartenwachstum` zeichnen auf Canvas/SVG — mit Grund, und die Messungen dazu
stehen im Technik-Handbuch. Diese Dateien nehmen **nur `sot.css`** (Tokens,
Bedienelemente, Flächen) und aus `sot-hex.js` höchstens die Geometrie
(`points()`, `center()`, `at()`). `sot-hex.css` bleibt draußen.

### 8. Schriftzeichen als Icon (127 Stellen in 15 Dateien)

Gemessen mit `icons-audit.mjs` nach dem Umbau der ersten vier Dateien.
Häufigste: `➤`×24 · `✦`×21 · `◆`×20 · `◈`×19 · `☾`×7 · `▲`×6 · `⬡`×5.

Der Ersatz steht als Zeichnung in `sot-icons.js` bereit, der Prüfer nennt ihn
je Fundstelle — der Umbau ist also mechanisch. **Zwei Stellen sind es nicht:**

1. **Toast und `title`** können kein SVG tragen (`textContent` bzw.
   Attribut). Dort stehen **Worte**, und das ist richtig: ein Toast ist ein
   Satz, kein Piktogramm. Nicht „kreativ" lösen.
2. **Grosse SVG-/Canvas-Karten** (`rhein-*`, `zoomstufen-labor`,
   `eiszeit-labor`) brauchen `SOT.iconSVG(name,x,y,grösse)` statt `iconEl` —
   in Canvas gar keinen der beiden, dort ist ein Zeichen im `fillText` durch
   `Path2D` zu ersetzen. Das ist echte Arbeit, keine Ersetzung.

`stromlinien-handbuch.html` führt die Liste mit 39 Stellen, ist aber
**generiert**: die Zeichen stehen in `handbuch/*.md`. Dort sind sie *Prosa in
einem Designdokument* („die Sammlerin ✦"), nicht Bedienoberfläche — vor dem
Ersetzen entscheiden, ob das Dokument die Marken zeigen SOLL. Wenn ja, gehört
in `compose-handbuch.mjs` derselbe `{name}`-Handgriff wie im Almanach.

### 9. Token-Aliasse sind eine Falle

Die Versuchung bei den 5 Werkbank-Dateien: `--fg:var(--ink)` in den Baukasten
schreiben und fertig. Dann gibt es zwei Namen für eine Sache, und der nächste
Prototyp würfelt. **Im Draft umbenennen** — das ist ein `sed` pro Datei und
danach ist es weg.

### 10. Ein geschlossenes Blatt warf seinen Schatten auf die Seite — behoben

`.sheet` trug `box-shadow:0 -8px 30px` **immer**, auch geschlossen. Ein
geschlossenes Blatt steht knapp ausserhalb des Bildes; der 30-px-Weichzeichner
trug den Schatten von dort wieder herein und legte einen dunklen Streifen über
die Seitenkante — rechts über die volle Höhe, unten über die volle Breite.

Gefunden, als das erste `SOT.regler()` ein `.sheet.right` in eine sonst
unveränderte Seite setzte: **1.8 % Abweichung ohne ein einziges sichtbares
Bedienelement**, und mit `griff:false` wurde sie *grösser* statt kleiner — der
Griff hatte einen Teil des Streifens verdeckt. Der Schatten hängt jetzt an
`.sheet.on` (und fällt bei `.right` nach links statt nach oben).

Zwei Lehren, beide über diesen Fall hinaus:

- **Ein Element ausserhalb des Bildes ist nicht wirkungslos.** Schatten,
  Filter und Weichzeichner reichen zurück; Layoutmasse verraten davon nichts
  (`scrollWidth`/`scrollHeight` waren vorher wie nachher gleich).
- **Wer das „vorher" nur ansieht, findet es nicht.** Die beiden Aufnahmen
  sahen von Auge gleich aus. Erst die Dichtekarte zeigte eine Spalte über die
  volle Höhe, und erst der Ausschlussversuch (`griff:false`) widerlegte die
  naheliegende Erklärung.

**Nebenbefund zum Messen selbst:** Chrome hat unter Windows eine
Mindestfensterbreite. `--window-size=420,900` liefert ein Sichtfeld von
**512** px, aufgenommen werden aber 420 — die rechten ~92 px fehlen im Bild.
Alles, was dort sitzt (der Reglergriff), erscheint in den Telefon-Ansichten
darum als „keine Abweichung". Kein Layoutfehler, ein Aufnahmeschnitt.

## Was der Baukasten lernen wird

Die Selektoren, die in **≥3 Dateien** fehlen, sind nach Regel 1 aufnahmereif.
`audit.mjs` listet sie unten in der Übersicht. Die substanziellen:

- **`.mapwrap` / `.mapbox` (7 Dateien)** — der Rahmen um eine Karte. Fehlt
  komplett.
- **`.cell .glyph`, `.cell.furt .furtlabel` (je 4)** — gehört in `sot-hex.css`,
  ist eine reine Lücke.
- **`canvas` (4), `#hud`, `.zoombar` (3)** — die Canvas-Karten-Familie:
  Rahmen, Bedienleiste am Bild, Zoomtreppe.
- **`.swatch` (3)** — Farb-/Plättchenwahl. Editor-Familie.
- **`.bar` (3)** — Balken ohne die `.prog`-Hülle.
- **`.main` / `.side` / `aside` (3)** — das Laborgerüst. `sot.css` hat `.layout`,
  aber nicht die Kinder.
- **`--st-mess`** — ein **sechster** Kartenstatus („Werkzeug/Messung"), den
  `stromlinien-technik.html` benutzt und `sot-doc.js` nicht kennt. Konkreter
  Fehler: das Technik-Handbuch kann heute nicht getreu umziehen.
- **`--gap-full/-part/-none`** — `art-direction-handbuch` führt sie als *Tokens*,
  der Baukasten als *Klassen* (`.gap.full/.none`). Eins von beidem.
- **`--berg` / `--bergdeep`** — in 2 Dateien (`gewaesser-labor`, `feld-labor`),
  also grenzwertig nach Regel 1. Bergland fehlt in der Geländepalette.
- **`.toggle`** (Schiebeschalter), `.editform`, `.fxgrid`, `.tl-dot`/`.tl-pop` —
  je einmal, bleiben zunächst lokal. Wenn eine zweite Datei sie zeigt, hoch.

Der `--w0…--w4`/`--wk`-Satz aus `gewaesser-labor` bleibt **lokal**: das ist eine
gewässerspezifische Systematik, kein allgemeines Register.

## Wann aufhören

- Eine Datei, die nach dem Umbau **mehr** eigenes CSS braucht als vorher, war
  keine Kandidatin. Zurückrollen, im Ledger notieren, weiter.
- Eine Primitive, die nur *fast* passt, gehört **nicht** in den Baukasten.
  Zwei Nachbarn mit je einem Sonderfall sind schlechter als zwei getrennte.
- `asset-drop-v1` (37 CSS-Zeilen, 0 gleiche Regeln) und `auftakt-v1` (0 gleiche)
  sind zu neu bzw. zu eigen. Zuletzt oder gar nicht.

## Ledger

Jeder Umbau bekommt in `prototype/README.md` einen Vermerk: gemessene
Abweichung, was am Baukasten geändert wurde, was bewusst lokal blieb. Ohne das
ist nach dem fünften Umbau nicht mehr rekonstruierbar, warum der Baukasten
aussieht, wie er aussieht — und das ist genau die Frage, die das Handbuch für
alles andere beantwortet.
