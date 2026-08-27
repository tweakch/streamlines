# dijkstra-budget

Kürzeste Wege mit **Kostendeckel** und **Überlebenswahrscheinlichkeit** — der
Kern der Wanderer-Reichweite im Gewässer-Labor. Er läuft zweimal je Wanderer:
einmal ohne Wagnis (nur gefahrlose Übergänge), einmal mit.

## Gefunden in

| Datei | Zeile | Fassung |
| --- | --- | --- |
| `drafts/gewaesser-labor-v1.html` | 769–784 | identisch |
| `ab/gewaesser-kacheln/a-vektor.html` | 757–772 | identisch |
| `ab/gewaesser-kacheln/b-kacheln.html` | 776–791 | identisch |

**Byte-gleich**, mechanisch belegt: alle drei Blöcke ergeben md5
`800bcb2b7c947920b88913f466a2aafb`. Auch der Aufrufer `reichweite()` steht
dreimal gleich daneben.

Kein Wunder — die beiden `ab/`-Varianten sind Abzüge von
`gewaesser-labor-v1` für einen reinen Bildvergleich (Textur-Kacheln gegen
Flächenfarbe). Das macht sie als Fundort trotzdem echt: die A/B-Frage ist
laut Ledger noch offen, der Sieger zieht später nach `drafts/`, und bis
dahin altern drei Kopien parallel. `gewaesser-labor-v2.html` hat **keine** —
dort geprüft, nicht angenommen.

## Entschieden

Nichts zu entscheiden — es gibt nur eine Fassung. Sie ist **unverändert**
übernommen, samt der beiden Eigenheiten unten. Die Signatur bleibt
`dijkstra(G, start, budget, erlaubeRisiko)`, damit ein späterer Umbau ein
Löschen und ein Verlinken ist, kein Umschreiben.

Festgenagelt sind (11 Tests): Start mit Kosten 0 / Überleben 1 · Deckel
**einschliesslich** (`nd === budget` ist noch erreichbar) · Abschneiden
mitten im Weg, nicht nur am Ziel · `erlaubeRisiko = false` betritt Kanten
mit `risk < 1` gar nicht · Überleben als Produkt entlang des Weges ·
Gleichstand bei den Kosten geht an den sichereren Weg · unerreichbare Knoten
**fehlen** in beiden Karten, statt `Infinity` zu tragen.

## Zwei Eigenheiten, die beim Herausziehen auffielen

### 1. Die Sperre gegen den sicheren Tod ist das Gewicht, nicht das Risiko

`querKosten()` liefert für Wasserfall und Klamm `{k: Infinity, p: 0}`
(`gewaesser-labor-v1.html:713–720`). Man erwartet, dass solche Kanten beim
Graphbau wegfallen — **tun sie nicht**: `add()` (Zeile 739) prüft nichts, und
nur die Sektor-Nachbarschaften weiter unten filtern `w === Infinity`. Die
Kanten stehen also im Graphen.

Aufgehalten werden sie allein vom Deckel: `d + Infinity > budget`. Das ist
richtig, aber es hängt daran, dass `p === 0` **immer** mit `k === Infinity`
gepaart auftritt. Diese Kopplung ist nirgends festgehalten.

### 2. `|| 1` lässt Überleben 0 wieder auf 1 springen

```js
const ns = (surv.get(u) || 1) * e.risk;
```

`||` behandelt eine echte `0` wie ein Fehlen. Wer einen Knoten mit Überleben
0 erreicht, reist von dort als Lebender weiter. Die Zeile darüber macht es
richtig (`dist.get(u) ?? Infinity` — `??` fällt nur bei `undefined`), die
Unstimmigkeit ist also innerhalb derselben Funktion.

**Heute unerreichbar**, genau wegen Befund 1: mit `w = Infinity` kommt nie
jemand bei Überleben 0 an. Der Test hält den Fehler fest und billigt ihn
nicht. Wer je eine Kante `{w: endlich, risk: 0}` baut — etwa eine Furt, die
sicher tötet, aber begehbar ist —, bekommt ihn sofort.

Nicht mitrepariert: die Skill verlangt, dass der Test beschreibt, *was ist*.
Ein `?? 1` wäre eine Zeile, aber dann liesse sich nicht mehr zeigen, dass der
Umbau nichts verändert hat.

## Nicht übernommen

- `reichweite()`, `graphBauen()`, `pk()` — sie lesen `S`, `R` und die
  Zellenliste aus Modul-Globalen und bauen den Graphen. Nur der Löser ist
  rein; der Graph bleibt Sache des Prototyps.
- Die `feldKosten`/`querKosten`-Tabellen: das sind Spielregeln, die gehören
  laut Skill nicht ins Zwischenlager.

## Offen

- **Kein Fundort ist umgestellt.** Der Code steht weiterhin dreimal da.
- `pq.sort((a, b) => a[0] - b[0])` läuft **bei jeder Entnahme** über die ganze
  Warteschlange — O(n² log n), wo ein Halden-Pop O(log n) wäre. Bei den
  Graphgrössen des Prototyps (ein paar hundert Sektoren) unauffällig, und
  darum bewusst nicht angefasst. Reizvoll ist es trotzdem: `binaerhalde`
  (Kandidat 7, dreimal in der Eiszeit-Familie) ist genau der fehlende
  Baustein. Beide zusammen zu befördern wäre der natürliche nächste Schritt —
  dann aber mit einem Test, der die Reihenfolge gleicher Kosten festhält, denn
  eine Halde ist nicht stabil und der Gleichstand-Tiebreak hängt daran.
- Vor einer Beförderung nach `kit/` zu klären: Der Baukasten hält bisher
  bewusst **keine** Algorithmen („Keine Spielregeln", `kit/README.md`). Ein
  Wegefinder ist keine Spielregel, aber auch keine UI-Primitive — womöglich
  bleibt `lib/` für diese Sorte der richtige Ort, und die Fundorte laden ihn
  nie, sondern erben ihn erst beim Port in die App.
