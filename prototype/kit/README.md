# Prototyp-Baukasten (`prototype/kit/`)

Die UI-Primitiven, die jeder Prototyp braucht — einmal geschrieben, statt in jeder
Datei neu. Zweck ist nicht Wiederverwendung um ihrer selbst willen, sondern
**Tempo beim nächsten Prototyp**: wer eine Idee prüfen will, soll nicht erst
wieder Knöpfe, Reiter, Toast und Hexraster tippen.

Der Musterbogen **[`kit-demo.html`](kit-demo.html)** zeigt jede Primitive in allen
Zuständen. Vor dem Bauen dort nachsehen — es ist schneller, als es nochmal zu
schreiben. Wer eine Primitive ändert, prüft sie dort. Wer eine hinzufügt, zeigt
sie dort, sonst weiß der nächste Prototyp nicht, dass sie existiert.

## Dateien

| Datei | Was drin ist | Wann |
| --- | --- | --- |
| `sot.css` | Tokens (Tag/Nacht/Werkbank), Reset, Typografie, Knöpfe, Eingaben, Reiter, Flächen, Merkmale, Kennzahlen, Zeitleiste, **Spielkarte**, Listen, Tabellen, Hinweise, Toast/Überlagerung/Blatt, **Glut-Orb**, Debugstrip | immer |
| `sot.js` | `$` `el` `clear` · `params`/`debug`/**`regler`**/`hilfe` · `night` · `toast` `overlay` `sheet` **`orb`** · `tabs` `groups` · **`karte`** · `rng` · `jahr` `num` `vz` · `store` · `tempo` `warte` | immer |
| `sot-icons.js` | **Der Zeichensatz** — `SOT.icon(name)` · `SOT.iconEl(name, klasse)` · `SOT.iconSVG(name, x, y, grösse)` (in einer SVG-Karte) · `SOT.hasIcon` · `SOT.iconGruppen`. 56 Zeichnungen in einem Hausstil. **Icons sind SVG, immer** — siehe unten | immer |
| `sot-hex.css` | Hexraster als CSS (Zeilen, Felder, Gelände, Schichten, sechs Slots, Detailstufen) | mit Hexkarte |
| `sot-hex.js` | `SOT.hex`: Nachbarn (odd-r), Kubus, Ring/Scheibe, Pixelrechnung, `autosize`, `grid`, `mark` | mit Hexkarte |
| `sot-doc.css` | Wissensdokument: Hero, Inhaltsverzeichnis, Kapitel, Karten mit Status, Filter, Publish-Ansicht | Handbücher |
| `sot-doc.js` | `SOT.doc.init()` verdrahtet Karten, Verzeichnis, Filter, Publish/Entwicklung · **Schauseite**: `figur`/`figuren` (Abbildungen), `mehr` (Herleitung zuklappen), `inlineIcons` (`:furt:` im Fliesstext) | Handbücher |
| `sot-figuren.js` | Die **Abbildungen** der Handbücher — aus dem Baukasten gerendert, nicht abfotografiert: die Spielkarte im Handbuch *ist* dieselbe `SOT.karte()` wie im Spiel und kann darum nicht veralten. Meldet sich per `SOT.doc.figur(name, fn)` an; verlangt `sot-doc.js` | Handbücher mit Bildern |
| `sot-i18n.js` | Mehrsprachigkeit: `SOT.t()`/`SOT.tn()`, `data-t`-Sweep, `?lang=xx`, `?i18n` (Lücken/Waisen), Sprachumschalter. **Der deutsche Text ist der Schlüssel** — Spiegelstück in `app/src/i18n.ts` mit derselben API | mehrsprachige UI |
| `inline.mjs` | schreibt die Baukasten-Verweise als Inhalt zurück in die Datei — **vor dem Archivieren** | einmal je Datei |
| `audit.mjs` | was der Baukasten von einer Datei schon abdeckt: `[gleich]` löschen · `[ähnlich]` prüfen · `[KOLLISION]` umbenennen · `[fehlt]` Kandidat | beim Umbau |
| `vergleich.mjs` | Bildvergleich vorher/nachher (10×10-Dichtekarte), mit Determinismus-Prüfung | beim Umbau |
| `icons-audit.mjs` | findet Schriftzeichen, die als Icon benutzt werden, und nennt den Ersatz aus dem Register | vor dem Ablegen |
| [`UMBAU.md`](UMBAU.md) | **Wegleitung für den Umbau bestehender Drafts** — Reihenfolge, Ablauf je Datei, die belegten Fallen | vor dem ersten Umbau |

## Ein neuer Prototyp

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thema — worum es geht</title>
<link rel="stylesheet" href="../kit/sot.css">
<link rel="stylesheet" href="../kit/sot-hex.css">
<style>
  /* Nur was dieser Prototyp allein braucht. Kommt zuletzt, gewinnt darum. */
</style>
</head>
<body>
<div class="wrap">
  <header class="appbar ruled">
    <div class="brand">THEMA<small>Werkstatt-Prüfstand</small></div>
    <div class="year"><b id="yr">−9 500</b><span>v. Chr.</span></div>
  </header>
  <div class="map" id="map"></div>
</div>

<script src="../kit/sot.js"></script>
<script src="../kit/sot-hex.js"></script>
<script>
var P = SOT.params({
  epoche: { t:'int', def:1, min:1, max:5, help:'Epoche I–V' },
  demo:   { t:'flag', help:'Beispielkarte laden' },
  seed:   { t:'int', def:1, help:'Zufallssaat — macht einen Lauf wiederholbar' }
});
var rnd = SOT.rng(P.seed);

SOT.hex.grid('map', 12, 18, function (cell, c, r) {
  cell.classList.add(rnd() < .3 ? 'water' : 'flach');
});
SOT.hex.autosize('map', 12);
SOT.debug(P);                 // Leiste nur mit ?debug
</script>
</body>
</html>
```

Damit sind die Werkstatt-Regeln schon erfüllt: Debug-Parameter sind erklärt,
`?hilfe` listet sie, `?night` und `?werkbank` gehen ohne Zutun, und das Hexraster
misst sich selbst — auch dann, wenn der Behälter erst später sichtbar wird.

## Regeln

1. **Der Baukasten folgt den Prototypen, nicht umgekehrt.** Eine Primitive kommt
   erst hierher, wenn sie in **zwei oder mehr** Prototypen gleich aussah. Eine
   Idee, die es nur einmal gibt, bleibt in ihrer Datei.
2. **Eigenes CSS zuletzt und ohne `!important`.** Der Baukasten setzt bewusst
   niedrige Spezifität (Element- und einfache Klassenselektoren), damit ein
   Prototyp ihn überschreiben kann, ohne zu kämpfen.
3. **Klassennamen sind die der Prototypen** (`.chip`, `.pane`, `.hid`, `.cell`,
   `.why`) — kein `sot-`-Präfix. Der Baukasten soll sich nicht fremd anfühlen.
   Wo ein Name doppelt belegt war, hat der Baukasten getrennt: `.card` ist die
   **Dokumentkarte** (`sot-doc.css`), die Kennzahlkachel heißt `.stat`.
4. **Farben nur über Tokens.** Ein `#hex` im Prototyp bricht Tag/Nacht/Werkbank.
   Für Schrift auf Akzentflächen gibt es `--on-ember` / `--on-river` — ohne die
   wird weiße Schrift auf dem hellen Werkbank-Akzent unlesbar.
5. **Icons sind SVG.** Kein Schriftzeichen steht für ein Spielding —
   `SOT.icon(name)` aus `sot-icons.js`, nie `✦` oder `▲` im Markup. Begründung
   und Hausstil im Abschnitt *Der Zeichensatz*; `node kit/icons-audit.mjs`
   prüft es.
6. **Debug-Parameter über `SOT.params()`**, nicht mit eigenem
   `URLSearchParams`-Gefummel. Nur so entstehen `?hilfe` und der Debugstrip.
7. **Vor dem Archivieren `inline.mjs` laufen lassen** (siehe unten).
8. Neue Primitive → Zeile in der Tabelle oben **und** Abschnitt im Musterbogen.

## Der Zeichensatz

**Icons sind SVG. Immer.** Kein Schriftzeichen steht für ein Spielding.

Das ist keine Vorliebe. Ein Glyph wie `✦` oder `▲` ist Schrift, kein Bild, und
verhält sich auch so:

- Er **erbt Laufweite und Grundlinie** der Schriftart und sitzt darum in einem
  Hex-Slot nie mittig — man korrigiert mit `line-height` und `top`, je Fundort
  neu, und es kippt beim nächsten Schriftwechsel wieder.
- Er **fällt je Gerät auf eine andere Datei zurück**. `▨` und `⋔` fehlen auf
  iOS ganz; `𝆲` (das alte Schuhwerk-Zeichen) liegt außerhalb der Basic
  Multilingual Plane und war auf jedem zweiten Gerät ein Ersatzkästchen. Ein
  Icon, das auf halben Geräten nicht existiert, ist kein Icon.
- Er **nimmt `stroke` nicht an**, also auch keine Strichstärke, kein
  `currentColor`-Verhalten jenseits der Textfarbe.
- **Emoji sind der schlimmste Fall**: farbig aus einer Systemschrift, taub
  gegen Tokens. In `gewaesser-labor` leuchteten `🔍` und `⛰` bunt aus einer
  sonst kühlen Werkbank-Leiste.
- Und der eigentliche Grund: ein Zeichensatz aus zwei Materialien lässt sich
  **nicht in einem Zug umzeichnen**. Man sieht es, lange bevor man es benennen
  kann.

```js
SOT.icon('jaeger')                     // die SVG-Zeichenkette
SOT.iconEl('jaeger', 'pers')           // <div class="pers"><svg …>
SOT.iconSVG('mensch', x, y, 8)         // in einer SVG-Karte, auf Weltkoordinaten
SOT.hasIcon('furt')                    // gibt es das?
```

- **Hausstil**: `viewBox="0 0 40 40"`, `fill="none"`,
  `stroke="currentColor"`, `stroke-width="2.4"`, `stroke-linecap="round"`.
  Fläche (`fill="currentColor"`) trägt genau **eine** Bedeutung: *das ist der
  Punkt, um den es geht* — das Auge des Fisches, der Ocker im Napf, die
  Bernsteinperle im Kies. Nie zur Zierde.
- **Grössenstufen**: Ein Zeichen, das im Hex-Slot bei ~16 px steht, darf nicht
  mehr als vier Striche haben. `kit-demo.html` zeigt jedes bei 48 · 24 · 16 px
  und auf Akzentfläche — **dort prüfen, bevor es hier liegt.** Beim Zeichnen
  dieses Satzes sind auf diesem Weg vier echte Verwechslungen aufgefallen:
  `silex` las sich wie `terrasse` (beides gestapelte Striche), und
  `wasserfall`/`steg`/`vorrat` waren alle drei „Strich waagrecht plus drei
  senkrecht". Jedes bekam ein eigenes Kennzeichen (gewellte Wasserlinie,
  doppelte Bohlenlinie, gebundenes Bündel).
- **Ein Ding, ein Zeichen.** Zweitnamen statt Kopien: `ufer` und `lager` waren
  byte-gleich, jetzt ist `ufer` ein Alias. Und `sonne`/`mond` sind gleichzeitig
  Mittag/Nacht **und** die Registerumschaltung.
- **In CSS** (`::before`/`::after`) geht es ohne Schrift: das SVG als
  `mask`, die Farbe als `background-color` — so nimmt es Tokens an. `sot.css`
  hält `--ic-beleg` für die Ankermarke der Zeitleiste.
- **In Fliesstexten** (Karteikarten, Legenden) schreibt man `{name}` und lässt
  es beim Rendern expandieren (`almanach-v1` macht es so). Der Datentext
  bleibt lesbar, das Ergebnis ist trotzdem SVG.
- **Ein unbekannter Name** gibt eine sichtbare Fehlmarke plus Konsolenmeldung,
  nie einen leeren String: ein `''` verschwindet lautlos im Layout, und dann
  sucht man den Tippfehler bei der Bildbeschreibung.
- `SOT.toast()` setzt `textContent` und kann darum kein Icon tragen. Das ist
  richtig so — ein Toast ist ein Satz. Dort stehen **Worte**.

Wer ein Zeichen hinzufügt: Hausstil einhalten, Eintrag in `SOT.iconGruppen`
(sonst fehlt es im Musterbogen und der nächste Prototyp erfährt nie davon),
Probe bei 16 px, dann `node kit/icons-audit.mjs`.

## Das Reglerbrett (`SOT.regler`)

Der Debugstrip kann Parameter nur **antippen**: Flag umschalten, Enum
durchklicken, Zahl um einen Schritt. Wer einen Wert quer durch seinen Bereich
fahren will, klickt vierzigmal — und lädt vierzigmal neu. `SOT.regler(P)` baut
aus **derselben** `SOT.params()`-Erklärung ein Brett von rechts, mit einem
echten Bedienelement je Typ.

```js
var P = SOT.params({
  ela: { t:'int', def:2400, min:800, max:3200, step:50, help:'Schneegrenze in m' }
});
SOT.regler(P);                      // Griff rechts, ?regler öffnet gleich
SOT.regler(P, { onChange: neu });   // live statt neu laden
```

- **Ein Prototyp beschreibt nichts zweimal.** Was schon in `SOT.params()`
  steht, wird zum Bedienelement: `flag` → Haken · `enum` → Auswahl · Zahl
  **mit `min` und `max`** → Schieber · Zahl ohne Bereich → Zahlenfeld ·
  `list`/`str` → Eingabefeld. Das ist zugleich der Anreiz, `min`/`max`
  wirklich anzugeben — ohne sie gibt es keinen Schieber.
- **Ohne `onChange` wird neu geladen.** Die Änderung geht in die URL, die
  Seite lädt. Unelegant, aber es wirkt in **jedem** Prototyp — auch in dem,
  der seine Welt einmalig beim Start baut, und das sind die meisten. Kein
  Prototyp muss umgebaut werden, damit das Brett etwas bewirkt.
- **Mit `onChange(name, wert, P)` bleibt die Seite stehen** und der Prototyp
  entscheidet selbst, was er neu rechnet. Die URL wird trotzdem nachgeführt
  (`P.set`), damit der Stand teilbar und ein Screenshot reproduzierbar bleibt
  — die Werkstatt-Regel „ein Screenshot kann nicht klicken" gilt weiter.
- **Der Stand ist die URL**, darum sitzen *Zurücksetzen* und *Link kopieren*
  im Fuss des Bretts und nicht irgendwo im Prototyp.
- Der **Griff** am rechten Rand ist schmal und still; ohne `?regler` zeigt ein
  Screenshot nur eine Lasche (`griff:false` nimmt auch die weg). `?regler`
  öffnet das Brett beim Laden. Ein einzelner Parameter lässt sich mit
  `versteckt:true` aus dem Brett halten.
- Gebaut aus vorhandenen Primitiven — `.sheet.right`, `.field`, `SOT.sheet()`;
  neu sind nur `.reglergriff`, `.reglerzeile`, `.reglerfuss`. Esc und der
  Klick auf den Schleier schliessen, weil `SOT.sheet()` das schon kann.
- **Die Ablesung ist einzeilig und schneidet ab.** Im Musterbogen trägt
  `pruefkarte` ein ganzes Karten-JSON; ungekürzt sprengte es die Zeile und
  das Blatt bekam einen waagrechten Rollbalken.

**Zur Regel 1:** das ist keine Ausnahme, sondern der Ausbau einer Primitive,
die es schon gibt — `SOT.debug()` macht dasselbe seit jeher, nur schmaler.
Beide bleiben: die Leiste fürs schnelle Umschalten unterwegs, das Brett fürs
Einstellen.

## Der Glut-Orb

Ein Licht tritt aus dem Nebel, kommt über einem Ziel zur Ruhe und lockt — die
Einladung ohne Worte, für die Stelle, an der noch kein Bedienelement erklärt
wäre. Der Auftakt (`drafts/auftakt-v1.html`) setzt sie auf das erste Feld.

```js
var o = SOT.orb('#karte', {
  aus:'S', ruf:'berühren', w:30, dx:-12, dy:8,
  bahn:'kreis', bahnr:38, licht:130,
  aufLicht: function (x, y, r) { /* was das Licht unterwegs berührt */ }
});
await o.bereit;      // Auftritt vorbei, der Orb lockt
await o.klick;       // erstes Anfassen
await o.weg();       // verglühen lassen
```

- Der Orb ist ein `button`: Klick, Tastatur und `aria-label` kommen mit. Nur er
  nimmt Zeiger an, die Schicht um ihn ist durchlässig.
- **Klein und schwach.** Standard ist `--orbw:34px`, und der Schein läuft über
  `--orbdunst` (eine abgeschwächte Mischung aus `--emberglow`): ein Licht *im*
  Nebel leuchtet, es strahlt nicht. Wer mehr Glut braucht, setzt `w` höher —
  Kranz, Hof und Schein rechnen alle aus `--orbw`.
- **Der Tropfenkranz** sammelt sich, wenn jemand nahe kommt: Zeiger darüber,
  Tastaturfokus, oder Finger darauf (`SOT.orb()` setzt `.nah` auf `pointerdown`,
  denn auf einem Telefon gibt es kein Hover — ohne das bliebe der Effekt dort
  für immer unsichtbar). Die Radien sind absichtlich ungleich: ein exakter Kreis
  liest sich als Zahnrad, ein ungleicher als Flüssigkeit. `tropfen:0` schaltet
  ihn ab.
- **Zwei Zeitschienen, absichtlich getrennt.** Die Dramaturgie (`ein`,
  `nachEin`) läuft über `SOT.warte` und gehorcht `SOT.tempo()`. Die **Bahn** ist
  Atmosphäre und läuft in eigenem Takt weiter — ein schnellerer Ablauf soll das
  Licht nicht herumrasen lassen.
- **Das Licht wandert und meldet, wo es steht.** `bahn:'kreis'|'acht'|'ruhe'`
  (plus `bahnr`/`bahnzeit`), `licht:<radius>` für den mitwandernden
  Scheinwerfer, und `aufLicht(x,y,r)` je Bild mit der **gemessenen** Mitte des
  Balls, relativ zum Ziel. Deshalb läuft die Bahn in JS und nicht in CSS: der
  Prototyp muss wissen, wo das Licht steht, um darauf zu reagieren — im Auftakt
  fangen die Hexkanten das Gold und der Nebel weicht. Eine CSS-Animation weiß
  das nicht.
- **Gemessen und danach gebaut** (Chrome, CPU 6× gedrosselt): `aufLicht` kommt
  gedrosselt auf ~30 Hz, die Bahnposition wird nach dem Auftritt **gerechnet**
  statt gemessen, und bei `bahn:'ruhe'` (auch bei `prefers-reduced-motion`)
  hält die rAF-Schleife an, sobald der Auftritt vorbei ist — ein Resize weckt
  sie. Wer im Rückruf etwas beleuchtet: **Deckkraft direkt auf die betroffenen
  Elemente schreiben, nicht eine Custom Property auf deren Elternteil** (die
  invalidiert den ganzen Teilbaum, je Bild), Werte quantisieren und Gleiches
  nicht schreiben. Das war der Unterschied zwischen 30 und 60 fps.
- Der Scheinwerfer hat **bewusst kein `mix-blend-mode`**: `.orbfeld` ist durch
  `z-index` (und sein eigenes `translate`) ein Stapelkontext, und Mischung wird
  daran isoliert — der Modus hätte gegen die Karte darunter nie gewirkt. Eine
  durchsichtige goldene Verlaufsscheibe tut auf dunklem Grund dasselbe.
- Die Farbe kommt aus `--ember`, `--emberglow` und dem neuen `--glutkern`. Der
  Kern hat ein eigenes Token, weil er in **jedem** Register hell sein muss —
  `--bone` und `--on-ember` kippen nachts ins Dunkle. Das **Gold** ist daraus
  gemischt (`--orbgold`, ~62 % Kern in Glut) und wandert darum mit dem Register
  mit, statt fest zu stehen. Wer es außerhalb des `.orbfeld` braucht (Kanten,
  Marken), mischt es dort genauso.
- Steht der Orb nicht über der Mitte seines Behälters, wird der Versatz
  **gemessen** (`getBoundingClientRect`) und als `dx`/`dy` übergeben, nicht
  geraten; `auftakt-v1` zeigt es.

**Zur Regel 1:** diese Primitive kam auf ausdrücklichen Wunsch direkt in den
Baukasten, bevor ein zweiter Prototyp sie zeigt. Das ist die Ausnahme und steht
hier, damit die Regel nicht still erodiert — der zweite Nutzungsort ist noch
offen.

## Das Plättchen (`.tcard`, in `sot-hex.css`)

Das Gegenstück zur Spielkarte, und die **Form trägt die Bedeutung**: ein
Plättchen ist ein **Sechseck** im Verhältnis 1 : 1,155 — dieselbe Silhouette
wie das Feld, auf das es kommt. Sechseck heisst *kommt aufs Brett und bleibt*,
rechteckige Karte (5 : 7) heisst *wirkt sofort*, ein Knopf heisst *bloße Wahl*.
Das ist die Formensprache aus Handbuch Kap. 2; das Glossar in Kap. 1 nennt für
das Plättchen ausdrücklich `.tcard`.

```html
<div class="hand">                        <!-- setzt --cardw, Enge-Fall <420px -->
  <div class="tcard sel">                 <!-- .sel gewählt · .tot erschöpft -->
    <div class="tinner">                  <!-- Inhalt MUSS hier hinein -->
      <div class="tglyph">…svg…</div>      <!-- nicht .glyph! siehe unten -->
      <div class="nm">Lager am Ufer</div>
      <div class="fx">+1 Nahrung/Tag</div>
    </div>
  </div>
</div>
```

- **Bauart wie `.cell`**: `::before` ist die Kante, `::after` die Fläche, beide
  mit demselben `clip-path`. Ein `border` würde vom `clip-path` abgeschnitten —
  darum die zwei Schichten und darum muss der Inhalt in `.tinner` liegen.
- **`.tglyph`, nicht `.glyph`**: `.glyph` ist die Marke **im Feld** und wird in
  halber Feldbreite mit `--tileink` bemessen. Wer sie im Plättchen benutzt,
  erbt Feldmaße. Das war der Fehler beim Port in die App.
- Herkunft: `erkundung-v6`. Die älteren `.tcard` in `stromlinien-epoche1` und
  `spielfeld-entlastung-v1` sind noch **abgerundete Rechtecke** — Stand vor der
  Formensprache-Entscheidung; sie sind beim Umbau nachzuziehen.

## Die Spielkarte

Effekt-, Hand- und Zugkarten — alles, was ausgespielt wird. Destilliert aus
`erkundung-v6` (`.effkarte`/`.hkarte`) und `tageszeit-akzente-v1` (`.karte`,
dort schon als Baukasten-Kandidat vermerkt); die Gestaltungsregeln stehen in
[`notes/gedanken-zum-kartendesign.md`](../../notes/gedanken-zum-kartendesign.md).
Der Kern: eine Karte wird unter Zeitdruck am Rundenbeginn gespielt und muss
darum in zwei Sekunden drei Fragen beantworten — **Wie heisst sie? Wen trifft
sie? Was ändert sie mechanisch?**

```js
SOT.karte({
  name:   'Späher vorausschicken',           // Pflicht — Zone 1
  zeit:   'morgen',                          // fester Ton (.z-*), Kopfband
  art:    'spielen',                         // Wortschatz: spielen · herstellen
                                             //   · rundenbedingung (je ein Zeichen)
  dauer:  'heute',                           // Wirkdauer, kurz — Kopfband
  geltung:'person',                          // 'person' | 'runde' (rundenbedingung
                                             //   setzt 'runde' von selbst)
  wer:    [{icon:'jaeger', name:'Jäger'}],   // wen es trifft — Zone 2
  wert:   {icon:'spur', text:'+2 Sicht'},    // Zone 3 — die Pointe
  regel:  'Der Jäger erhält +2 Sicht.',      // Zone 4, max 3 Zeilen
  kost:   '−1 Nahrung', flav: 'Wer zuerst sieht, isst zuerst.',
  hoch:   true,                              // 5:7-Hochformat (Handkarte)
  groesse:'s'                                // 's' klein · 'l' gross (ohne: Mittel)
})
```

- **Kopfband + fünf Zonen, Reihenfolge fest**: `.kband` das Kopfband in der
  Akzentfarbe der Oberkante (Tageszeit · Art · Dauer, jedes als Zeichen +
  Etikett) → `.knm` Name (grösster Text, Kopf fest zwei Zeilen) → `.kwers`
  Wer (die Personen-Marken `.kwer`) → `.kwert` die mechanische Pointe
  (Zeichen + Zahl — zweitstärkstes Element nach dem Namen) → `.kfx`
  Regeltext, 1–3 kurze Zeilen (`.ksperre`: warum gerade nicht) → `.kkost`
  Preis (unten angepinnt) und `.kflav` Stimmung (kleinste Schrift). Schrift
  und Abstand darf ein Prototyp ändern, **die Reihenfolge nie** — darum baut
  `SOT.karte()` die Zonen selbst und bietet keinen Weg, sie umzustellen.
- **Die Art ist ein Wortschatz**, kein Freitext: `spielen` (der Anstoss) ·
  `herstellen` (das Zahnrad) · `rundenbedingung` (der Rundlauf) — je ein
  Zeichen aus dem Zeichensatz (Gruppe *Kartenkopf*). Nur so kann das Etikett
  einklappen, ohne dass die Information fällt: das **Kopfband klappt mit der
  Breite** (Containerabfrage, Inhaltsbreite) — das Tageszeit-Wort zeigt erst
  ab 190 px Inhalt (Zeichen und Akzentfarbe sagen es schon), unter 120 px
  fallen alle Etiketten und die Dauer, die Zeichen bleiben. Das Band bricht
  nie um; was dann nicht passt, meldet der Kartenprüfstand.
- **Das Mass.** Alle inneren Längen hängen an `--km`, dem „Kartenpixel"
  (1 px in Mittel — jede Zahl im CSS ist ein echtes Pixelmass der mittleren
  Grösse). Der Baukasten rendert jede Karte in **drei Grössen**: `.klein`
  ×0.8 · Mittel ×1 · `.gross` ×1.25 (`groesse:'s'|'l'`); die Karte setzt
  ihre **Standardbreite selbst** (160 × `--km` → 128 · 160 · 200, ein
  Behälter darf überschreiben), `.hoch` hält in jeder Grösse 5:7. Nur der
  Aussenrahmen bleibt in echten px (1.5) — ein skalierter Strich wird
  unscharf. Die Zonen sind **Skelett** (leer heisst nicht weg, wie die
  Seiten-Anatomie): Band 10, Name fest 2 Zeilen (30.24), Wer 14, Wirkung 14,
  Regel min 12.4 (Budget max 3 Zeilen), Preis 16.7, Stimmung 10 — damit
  bleiben gemischte Reihen höhengleich. Die exakte Tafel steht im
  Musterbogen (*Das Mass*).
- **Geprüft statt behauptet.** Der Musterbogen trägt die Qualitätsprüfungen
  der Karten: der **Höhencheck** je Reihe (gleiche natürliche Höhe; bei
  `.hoch`: passt der Inhalt ins 5:7?) und der **Kartenprüfstand** — links
  den Entwurf beschreiben, rechts rendert er in allen drei Grössen und misst
  Überlauf, einzeiliges Kopfband, Name ≤ 2 Zeilen, Regel ≤ 3 Zeilen und die
  Höhengleichheit mit der Referenzkarte. `?pruefkarte=<json>` macht den
  Stand teilbar; der fertige `SOT.karte({…})`-Aufruf steht zum Kopieren
  darunter.
- **Disziplin im Regeltext**: gleiche Satzmuster über den ganzen Satz
  („Ziel erhält +X ‹Wert›." · „Alle Tiere: −Y Witterung."), die Dauer steht
  im Kopfband statt als „…, heute."-Anhängsel, die Pointe in `.kwert` —
  nie im Fliesstext vergraben. Kartennamen sprechen mit einer Stimme (alle
  evokativ oder alle funktional, nicht gemischt).
- Zustände: `:disabled` · `.ruht` (andere Tageszeit) · `.vorgemerkt` ·
  `.gespielt`.

**Migrationspfad** (nichts Bestehendes bricht): der Baukasten belegt nur
neue Namen — `.effektkarte`, `.kband`, `.kwers`, `.kwer`, `.kwert`,
`.kflav`; die geteilten (`.knm`, `.kfx`, `.kkost`, `.ksperre`) sind unter
`.effektkarte` gescoped. Die lokalen Karten in `erkundung-v6` und
`tageszeit-akzente-v1` rendern unverändert (geprüft per Screenshot). Beim
Umbau einer Datei gilt:

| Lokal (alt) | Baukasten (neu) |
| --- | --- |
| `.effkarte` / `.hkarte` / `.karte` | `.effektkarte` (Handkarte: `+ .hoch .klein`) |
| `.art`-Zeile über dem Namen | `.kband` — bleibt über dem Namen; Art aus dem Wortschatz, Dauer aus dem Regeltext herausziehen |
| `--kakzent`, lokale `.k-morgen`/`.k-abend` | `.z-*` + `--zeit-akzent` aus dem Kit |
| Pointe im `.kfx`-Fliesstext | herausziehen in `.kwert` (Zeichen + Zahl) |
| — (gab es nicht) | `.kwers`/`.kwer` Ziel-Marken · `.kflav` Stimmung · `.k-runde` Geltung · `dauer` im Kopfband |

## Mehrsprachigkeit (`sot-i18n.js` + `app/src/i18n.ts`)

**Der deutsche Text ist der Schlüssel** (gettext-Stil): `SOT.t('Nahrung')`,
im Markup `<span data-t>Nahrung</span>`. Kein erfundenes `res.food` — beim
Umbau wird Text gewickelt, nicht benannt; eine fehlende Übersetzung zeigt
den deutschen Text statt eines Lochs; die Wörterbücher sind reine
Deutsch→Sprache-Tabellen (`SOT.i18n.add('en', {...})`), die zwischen
Prototyp und App wortgleich wandern. Der bekannte Preis: geänderter
deutscher Wortlaut verwaist den Eintrag — `?i18n` zeigt die
Lücken/Waisen-Tafel, `SOT.i18n.pruefe()` liefert sie als Daten.

- `?lang=xx` gewinnt (teilbare Links), sonst gemerkte Wahl, sonst `de`.
- Platzhalter bleiben im Wörterbuch wörtlich: `'Runde {n}' → 'Round {n}'`;
  `SOT.tn(n, Einzahl, Mehrzahl)` für den einfachen Plural.
- Sprachwechsel zur Laufzeit sweept neu und feuert `sot:lang` auf `document` —
  dynamische Anzeigen hängen sich an das Event.
- `app/src/i18n.ts` trägt dieselbe API (`t`, `tn`, `addDict`, `setLang`,
  `subscribeLang`) für React — gleiche Schlüssel, gleiche Platzhalter.
- **Der Text-Umbau ist der erste mechanische Sweep über Prototypen UND App
  zugleich:** je Datei alle nutzerlesbaren Texte in `data-t`/`t()` wickeln,
  Wörterbuch anlegen, `?i18n` auf leer prüfen. Die Baukasten-eigenen
  Zeilen (sot-doc-Plaketten, `?hilfe`-Tafel, Debugstrip) sind dabei selbst
  noch zu wickeln — bekannte Lücke, gehört zum Sweep.

## Archivieren: die Datei wieder in sich schließen

`archive/` ist unveränderliche Geschichte. Eine archivierte Datei, die
`../kit/sot.css` lädt, sähe nächstes Jahr anders aus als am Tag der Ablage — die
Zusage wäre gebrochen. Darum werden die Verweise vor dem Verschieben durch ihren
Inhalt ersetzt:

```
node prototype/kit/inline.mjs prototype/drafts/foo-v1.html --out prototype/archive/foo-v1.html
node prototype/kit/inline.mjs prototype/drafts/foo-v1.html --check    # nur nachsehen
```

Danach ist die Datei wieder das, was die Werkstatt-Regel verlangt: eine in sich
geschlossene HTML-Datei ohne Abhängigkeiten außer Google Fonts. Dasselbe gilt,
wenn eine Datei aus `drafts/` weitergegeben wird.

`inline.mjs` zerlegt dabei jedes `</style>` und `</script>` im eingebetteten Text
zu `<\/style>` / `<\/script>`. Das ist nicht Kosmetik: der HTML-Parser kennt keine
Kommentare, er sucht die Zeichenkette — ein Beispiel-Tag in einem Kopfkommentar
beendet sonst genau das Element, das es tragen soll.

## Was der Baukasten bewusst *nicht* macht

- **Kein Zustandsmodell, keine Komponenten, kein Build.** Prototypen dürfen
  globale Variablen und Zeichenketten-Templates haben; das ist die Regel der
  Werkstatt und bleibt so. Der Baukasten liefert Aussehen und Handgriffe, nicht
  Architektur.
- **Keine große Hexkarte.** `sot-hex.css` baut je Feld drei Elemente plus Marken;
  jenseits von etwa 2 000 Feldern ist das zu langsam. Dort SVG oder Canvas nehmen
  (`SOT.hex.points()`, `center()`, `at()` rechnen dafür) und nur die Farbtokens
  aus `sot.css` benutzen. Die Messungen dazu stehen in
  `drafts/stromlinien-technik.html`.
- **Keine Spielregeln.** Ressourcen, Decks, Ereignisse gehören in den Prototyp.

## Bestehende Prototypen

**Sie werden umgebaut** — Wegleitung, Reihenfolge und die belegten Fallen stehen
in [`UMBAU.md`](UMBAU.md). Nicht um Code zu sparen, sondern weil 21 Dateien
21 Prüffälle sind: was den Umbau übersteht, hat sich gegen den ganzen Bestand
bewährt statt nur gegen den Musterbogen. Werkzeuge dafür sind `audit.mjs`
(Arbeitsliste je Datei) und `vergleich.mjs` (Bildvergleich vorher/nachher).

*Frühere Fassung dieses Abschnitts sagte „eine Migration wäre Risiko ohne
Gewinn". Die Messung sagt etwas anderes: 585 harte Farben im Bestand, und
9 von 21 Drafts haben heute keine Nachtschaltung.*

Zum Nachlesen, woher die Primitiven kommen: `stromlinien-epoche1` (Spielkopf,
Zeitleiste, Ressourcen, Hexraster, Toast, Überlagerung), `feld-labor-v1`
(Schichten, sechs Slots, Detailstufen), `ereignis-labor-v1` (Reiter, Regie-Panel,
Protokoll), `gewaesser-labor-v1` (Baum, Wertezeilen), `spielfeld-entlastung-v1`
(Blatt, runde Knöpfe), `map-editor-v3` (Listen, Belegstatus),
`stromlinien-handbuch` (Dokumentkarten, Publish-Ansicht),
`eiszeit-labor-v3` / `rhein-tiles-v4` (Werkbank-Register).
