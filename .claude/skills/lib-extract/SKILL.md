---
name: lib-extract
description: Find recurring pure-logic patterns duplicated across the prototypes, pin each with a test, extract it into prototype/lib/<slug>/, and write up what was done. Use when the user asks to look for refactoring candidates in the prototypes, to deduplicate prototype code, to extract shared helpers, or to grow the lib/kit from what the drafts already repeat.
---

# lib-extract — wiederkehrende Muster aus den Prototypen herausziehen

Die Prototypen sind bewusst Wegwerf-Code: globale Variablen, Copy-Paste,
String-Templates. Das bleibt so. Aber wenn dasselbe Stück **reine Logik** zum
dritten Mal in einer anderen Datei steht, ist es kein Wegwerf-Code mehr,
sondern ungeschriebenes Gemeingut.

Diese Skill sucht solche Stellen, **fixiert das Verhalten mit einem Test**,
zieht es nach `prototype/lib/<slug>/` und schreibt auf, was passiert ist.

`prototype/lib/` ist die **Vorstufe zum Baukasten**, nicht der Baukasten:

```
drafts/*.html          dreimal dasselbe getippt
   ↓  diese Skill
prototype/lib/<slug>/  festgenagelt, getestet, beschrieben  ← Zwischenlager
   ↓  wenn es sich bewährt: von Hand
prototype/kit/         Baukasten, global (SOT.*), im Musterbogen gezeigt
```

Der Sprung nach `kit/` ist **nicht** Teil dieser Skill. Er passiert später,
bewusst, und folgt den Regeln in `prototype/kit/README.md` — vor allem
Regel 1 (eine Primitive kommt erst in den Baukasten, wenn sie in zwei oder
mehr Prototypen gleich aussah). `lib/` ist der Ort, an dem ein Kandidat
darauf wartet, ohne dass die Erkenntnis verloren geht.

## Was ein Kandidat ist — und was nicht

**Ja** — reine Logik, Eingabe rein, Ergebnis raus:

- Hexraster-Rechnung (odd-r ↔ Kubus, Nachbarn, Pixelmasse, Ring/Scheibe)
- gesäter Zufall, Rauschen
- Zahlen-/Jahresformat (`9 500 v. Chr.`, Tausendertrennung)
- Geometrie (Haversine, Punkt-in-Polygon, Hüllen, `lerp`/`clamp`)
- Graphen (Flood Fill, Priority Flood, topologische Sortierung, Dijkstra)
- Statistik (Histogramm, Perzentil, Quantisierung, Zählsortierung)
- Kodierung (base64 ↔ typisiertes Feld, FNV-1a, Prüfsummen)
- Farbmischung/-interpolation, Palettentabellen (die *Rechnung*, nicht das Malen)

**Nein** — dann Finger weg:

- alles, was `document`, `window`, Canvas, `fetch` oder `localStorage` anfasst.
  Das ist Baukasten-Gebiet (`kit/sot.js`), nicht `lib/`, und im Test nur mit
  einer DOM-Attrappe zu prüfen — die wollen wir hier nicht.
- alles, was es nur **einmal** gibt. Eine Idee mit einem Fundort bleibt in
  ihrer Datei. (Zwei Fundorte = Kandidat, drei = überfällig.)
- alles, was der Baukasten schon kann. **Vorher nachsehen**: `SOT.rng`,
  `SOT.hex.*`, `SOT.params`, `SOT.num`, `SOT.jahr`, `SOT.vz`, `SOT.store`
  u. a. — die Tabelle steht in `prototype/kit/README.md`. Ein duplizierter
  Block, den der Baukasten längst abdeckt, ist **kein** Extraktions-Kandidat,
  sondern eine Zeile Aufräumarbeit: lokale Kopie löschen, Kit benutzen.
  Solche Funde gehören trotzdem in den Bericht, nur als eigene Liste.
- Spielregeln. Ressourcen, Decks, Ereignisse bleiben im Prototyp.

## Ablauf

### 1. Suchen

Ziel ist die Wiederholung, nicht die Vollständigkeit. Die Dateien sind gross
(bis 200 kB) — **nicht ganz lesen.** Mit `Grep` (`output_mode: "content"`)
über `prototype/drafts/`, `prototype/archive/`, `prototype/ab/` nach
charakteristischen Ausdrücken suchen, dann nur die Trefferumgebung lesen.

Bewährte Suchmuster:

```
0\.8660254|Math\.sqrt\(3\)      Hexgeometrie
\(\(\w+ % 2\) \+ 2\) % 2        odd-r Parität
mulberry|xorshift|Math\.imul    gesäter Zufall
6371|haversine|toRad            Kugeldistanz
function (lerp|clamp|quantis)   Kleinkram, der überall steht
2166136261|16777619             FNV-1a
btoa\(|atob\(                   base64-Kodierung
v\. ?Chr|toLocaleString\('de    Jahres-/Zahlenformat
```

Bei mehr als ~5 gleichzeitig zu prüfenden Mustern lohnt ein Subagent für den
Korpus-Scan — er liest die grossen Dateien, ohne den Hauptkontext zu fluten.

Je Fund festhalten: **welche Dateien, welche Zeilen, identisch oder
abweichend.** Abweichung ist der wichtigste Befund — siehe Schritt 3.

### 2. Vorschlagen — noch nichts anfassen

Eine kurze, gereihte Liste ausgeben (beste zuerst), je Kandidat:

- **Slug** (kebab-case), **eine Zeile** was es tut
- **Fundorte** mit Datei:Zeile, und **wie viele**
- **identisch / abweichend** (bei Abweichung: worin)
- geschätzte Grösse der herausgezogenen Funktion

Dazu die zweite Liste: **„deckt der Baukasten schon ab"**.

Dann fragen, welche Nummern gezogen werden sollen. Nicht alles auf einmal —
zwei bis drei pro Durchgang sind genug, jeder wird einzeln fertig gemacht.

### 3. Verhalten festnageln, **bevor** extrahiert wird

Das ist der Kern und die Reihenfolge ist nicht verhandelbar: erst der Test,
der das **heutige** Verhalten beschreibt, dann die Extraktion.

Bei **abweichenden** Kopien wird das interessant. Dann gilt:

- Die Abweichung ist ein **Befund**, kein Ärgernis. Sie kommt in die `.md`.
- Eine Fassung gewinnt. Die Wahl wird **begründet** (meist: die neuere, die
  gemessene, oder die, die den Randfall behandelt).
- Die verworfene Fassung bekommt einen eigenen Test, der festhält, *worin*
  sie sich unterschied — als `test('… — verworfene Fassung …')` mit einem
  Kommentar, der sagt warum. So geht die Geschichte nicht verloren, genau wie
  bei den `rej`-Karten im Handbuch.
- Wenn eine Abweichung ein **Fehler** in einer Kopie ist: nicht stillschweigend
  mitreparieren. Test schreiben, der den Fehler zeigt, in der `.md` benennen,
  und den Prototyp, der ihn hatte, erst umstellen, wenn der Nutzer es will.

### 4. Die drei Dateien anlegen

```
prototype/lib/<slug>/
  <slug>.js        die herausgezogene Logik
  <slug>.test.js   der Test, der sie festnagelt
  <slug>.md        was gefunden, entschieden und offen ist
```

**Rahmen für `<slug>.js`** — läuft in Node (CommonJS) *und* im Browser als
klassisches Script, ohne Build, ohne Abhängigkeit:

```js
/* <slug> — eine Zeile, was es tut.
   Herkunft: <datei>:<zeile>, <datei>:<zeile> (siehe <slug>.md) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.SOTLIB = root.SOTLIB || {}).<slugCamel> = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function beispiel(x) { return x; }

  return { beispiel: beispiel };
});
```

Der Doppelrahmen ist Absicht: in Node testbar (`require`), im Prototyp per
`<script src="../lib/<slug>/<slug>.js">` als `SOTLIB.<slugCamel>` da — und
damit **in derselben Bauart wie der Baukasten** (Globale, keine Module), damit
die spätere Beförderung nach `kit/` fast nur ein Verschieben ist.

**Rahmen für `<slug>.test.js`** — nur `node:test`, keine Abhängigkeiten:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { beispiel } = require('./<slug>.js');

test('<slug>: <was zugesichert wird>', () => {
  assert.equal(beispiel(1), 1);
});
```

Laufen lassen (absolute Pfade, wie überall in diesem Repo):

```
node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
```

Der Glob muss in Anführungszeichen stehen — Node expandiert ihn selbst. Ein
Verzeichnis als Argument funktioniert nicht.

**`<slug>.md`** — kurz, auf Deutsch, in der Stimme der übrigen Werkstattdoku:

```markdown
# <slug>

<Ein Satz: was die Logik tut.>

## Gefunden in

| Datei | Zeile | Fassung |
| --- | --- | --- |
| `drafts/foo-v1.html` | 812 | identisch |
| `drafts/bar-v3.html` | 1441 | abweichend — rundet ab statt kaufmännisch |

## Entschieden

<Welche Fassung gewonnen hat und warum. Bei Abweichung: was die verworfene
anders machte, und ob das ein Fehler war oder eine bewusste Variante.>

## Nicht übernommen

<Was bewusst draussen blieb — DOM-Anteile, Sonderfälle eines einzelnen
Prototyps, alles was den Kern verwässert hätte.>

## Offen

<Was noch fehlt, bevor das in den Baukasten kann: zweiter Fundort umgestellt?
Randfall ungeprüft? Namensfrage?>
```

### 5. Nicht umbauen — und wissen, wer es tut

**Diese Skill lässt die Prototypen unverändert. Die Doppelungen verschwinden
dadurch nicht.** Das ist Absicht, keine Lücke — aber es muss jedem klar sein,
der die Ergebnisliste liest.

Der ganze Weg hat **drei Stufen**, und diese Skill ist nur die erste:

| Stufe | Was passiert | Wer macht es | Doppelung weg? |
| --- | --- | --- | --- |
| 1 · Herausziehen | Muster finden, Verhalten mit Test festnageln, nach `lib/` legen, Befunde aufschreiben | **diese Skill** | nein |
| 2 · Befördern | Entscheiden, ob es eine Primitive ist; nach `kit/` heben, Musterbogen + `kit/README.md` ergänzen; Test wandert mit | von Hand, bewusst | nein |
| 3 · Umbauen | Die Fundorte auf den Baukasten umstellen, lokale Kopien löschen | `prototype/kit/UMBAU.md` | **ja** |

Stufe 3 ist die teure und riskante: sie ändert 14 Dateien, von denen jede ein
Prüffall ist. Sie hat ihre eigene Wegleitung (`kit/UMBAU.md`) — Bezugsbild
einfrieren, `kit/audit.mjs` für die Arbeitsliste, `kit/vergleich.mjs` für den
Bildvergleich, **jeder Bildunterschied wird erklärt, nicht weggeräumt**, Ledger
nachziehen. Diese Skill darf das nicht nebenbei mitmachen.

Wenn der Nutzer sagt „arbeite den Backlog ab", heisst das darum **nicht**
automatisch Stufe 3. Nachfragen, welche Stufe gemeint ist — und wenn Stufe 3
gemeint ist, `kit/UMBAU.md` lesen und nach dessen Ablauf arbeiten, nicht nach
diesem hier.

### Prototypen hängen sich nicht an `lib/`

**Ein Draft verlinkt niemals `../lib/<slug>/<slug>.js`.** Zwei Gründe, beide
handfest:

- `kit/inline.mjs` kennt nur eine feste Liste von Baukasten-Dateien und löst
  sie gegen `prototype/kit/` auf. Ein `lib/`-Verweis wird **nicht** eingebettet
  — die archivierte Datei trüge ein totes `<script src>` und wäre nicht mehr in
  sich geschlossen. Das bricht die Zusage von `archive/` still.
- Zwei Ladewege nebeneinander (`SOT.*` aus dem Baukasten, `SOTLIB.*` aus dem
  Zwischenlager) laden zur Verwechslung ein, und beim Befördern nach `kit/`
  müsste jeder Fundort ein zweites Mal angefasst werden.

Die Doppelung verschwindet deshalb erst bei Stufe 3, und zwar gegen den
**Baukasten**, nie gegen `lib/`. Der Browser-Teil des Rahmens
(`SOTLIB.<name>`) ist nur für eine schnelle Sonde in der Konsole gedacht, nicht
für eine Datei, die abgelegt wird.

`archive/` wird ohnehin **nie** angefasst — unveränderliche Geschichte.

### 6. Abschliessen

- Tests laufen lassen, Ergebnis **ehrlich** berichten (auch rote).
- `prototype/lib/README.md` fortschreiben: eine Tabellenzeile je Slug
  (Was · Fundorte · **Stufe**). Wenn die Datei noch nicht existiert, anlegen.
  Die Stufe ist das Rückgrat des Backlogs und wird wörtlich geführt:

  | Stufe | heisst |
  | --- | --- |
  | `herausgezogen` | in `lib/`, getestet — **Fundorte unverändert** |
  | `befördert` | liegt im Baukasten, Musterbogen ergänzt |
  | `umgebaut (n/m)` | so viele der m Fundorte benutzen den Baukasten |
  | `erledigt` | alle Fundorte umgestellt, lokale Kopien gelöscht |

  Erst `erledigt` heisst, dass die Doppelung wirklich weg ist. Solange eine
  Zeile auf `herausgezogen` steht, ist der Code weiterhin m-mal vorhanden —
  das darf die Zusammenfassung nicht verschweigen.
- Kurze Zusammenfassung: je Slug eine Zeile mit der Stufe, und **ausdrücklich
  dazusagen, dass die Fundorte noch stehen** und welche Stufe als Nächstes
  fällig wäre.
- **Nicht** die Ledger-Tabelle in `prototype/README.md` anfassen — die führt
  Prototypen, nicht Bibliotheksteile.

## Grundhaltung

- **Nichts Fancy.** Kein Build, keine Abhängigkeit, kein Framework. Node-
  Bordmittel und eine Datei je Sache.
- **Der Test beschreibt, was ist** — nicht, was sein sollte. Wer beim
  Extrahieren „nebenbei verbessert", verliert die Möglichkeit zu zeigen, dass
  sich nichts geändert hat.
- **Abweichungen sind die Ausbeute.** Dass dieselbe Rechnung in drei Dateien
  drei Ergebnisse liefert, ist wertvoller als die eingesparten Zeilen.
- **Deutsch in der Doku, Englisch im Code** — wie überall im Projekt.
