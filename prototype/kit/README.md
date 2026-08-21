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
| `sot.css` | Tokens (Tag/Nacht/Werkbank), Reset, Typografie, Knöpfe, Eingaben, Reiter, Flächen, Merkmale, Kennzahlen, Zeitleiste, Listen, Tabellen, Hinweise, Toast/Überlagerung/Blatt, Debugstrip | immer |
| `sot.js` | `$` `el` `clear` · `params`/`debug`/`hilfe` · `night` · `toast` `overlay` `sheet` · `tabs` `groups` · `rng` · `jahr` `num` `vz` · `store` · `tempo` `warte` | immer |
| `sot-hex.css` | Hexraster als CSS (Zeilen, Felder, Gelände, Schichten, sechs Slots, Detailstufen) | mit Hexkarte |
| `sot-hex.js` | `SOT.hex`: Nachbarn (odd-r), Kubus, Ring/Scheibe, Pixelrechnung, `autosize`, `grid`, `mark` | mit Hexkarte |
| `sot-doc.css` | Wissensdokument: Hero, Inhaltsverzeichnis, Kapitel, Karten mit Status, Filter, Publish-Ansicht | Handbücher |
| `sot-doc.js` | `SOT.doc.init()` verdrahtet Karten, Verzeichnis, Filter, Publish/Entwicklung | Handbücher |
| `inline.mjs` | schreibt die Baukasten-Verweise als Inhalt zurück in die Datei — **vor dem Archivieren** | einmal je Datei |

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
5. **Debug-Parameter über `SOT.params()`**, nicht mit eigenem
   `URLSearchParams`-Gefummel. Nur so entstehen `?hilfe` und der Debugstrip.
6. **Vor dem Archivieren `inline.mjs` laufen lassen** (siehe unten).
7. Neue Primitive → Zeile in der Tabelle oben **und** Abschnitt im Musterbogen.

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

Sie bleiben, wie sie sind — sie laufen. Der Baukasten ist für **neue** Dateien
und für die nächste Version eines Themas (`foo-v2`), die dann ohnehin neu
entsteht. Eine Migration bestehender Drafts wäre Risiko ohne Gewinn.

Zum Nachlesen, woher die Primitiven kommen: `stromlinien-epoche1` (Spielkopf,
Zeitleiste, Ressourcen, Hexraster, Toast, Überlagerung), `feld-labor-v1`
(Schichten, sechs Slots, Detailstufen), `ereignis-labor-v1` (Reiter, Regie-Panel,
Protokoll), `gewaesser-labor-v1` (Baum, Wertezeilen), `spielfeld-entlastung-v1`
(Blatt, runde Knöpfe), `map-editor-v3` (Listen, Belegstatus),
`stromlinien-handbuch` (Dokumentkarten, Publish-Ansicht),
`eiszeit-labor-v3` / `rhein-tiles-v4` (Werkbank-Register).
