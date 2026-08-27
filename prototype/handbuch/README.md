# Handbuch-Quellen (Markdown)

**Hier wird das Handbuch geschrieben.** Die Datei
`prototype/drafts/stromlinien-handbuch.html` ist seit dem Markdown-Umbau
**erzeugt** — nie von Hand bearbeiten, jede Handänderung dort wird beim
nächsten Komponieren überschrieben.

```
Inhalt ändern:   NN-*.md editieren
Neu bauen:       cd app && npm run compose:handbuch
Drift prüfen:    cd app && npm run check:handbuch   (Exit 1, wenn HTML ≠ Markdown)
Publish-Fassung: cd app && npm run build:handbuch   (nur done/concept, Kit eingebettet)
```

Der Umbau ist belegt: alle 79 Karten wurden normalisiert zeichengleich
zurückgerendert (Gesamtprüfung des Konverters) und `kit/vergleich.mjs` mass
0,0000 % Pixelabweichung in drei Ansichten (Telefon hell/nacht, breit).

## Aufbau

- `template.html` — alles ausserhalb der Kapitel (Kopf, Hero, Filterleiste,
  Fusszeile, Skripte). Enthält den Platzhalter `<!-- HANDBUCH:KAPITEL -->`.
- `NN-<titel>.md` — ein Kapitel je Datei, Reihenfolge = Dateiname.
- Komponist: `app/scripts/handbuch-lib.mjs` (+ CLI `compose-handbuch.mjs`).

## Kapitel-Frontmatter

```
---
nummer: 02
id: k2
titel: Kernmechaniken
untertitel: Das Regelgerüst, das für alle Epochen gilt.
banner: 2 KERNMECHANIKEN
---
```

## Karten

Jede Karte beginnt mit `##` und trägt ihren Status in geschweiften Klammern —
derselbe Status wie `data-s` im alten HTML (`done · concept · idea · rej · open`),
und dieselben Pflichten: Publish leitet sich daraus ab, verworfene Karten
behalten ihre Karte samt Begründung.

```
## Kartentitel {done}
## Kartentitel {rej badge="Verworfen / geparkt"}   ← abweichender Plakettentext
## Kartentitel {done openc}                        ← startet aufgeklappt
## Kartentitel {done #eigene-id}                   ← id statt Titel-Slug
```

Jede Karte bekommt automatisch eine **id aus dem Titel-Slug** —
`?karte=<id>` im Handbuch öffnet sie und springt hin (gut für Links aus
Notizen und für Screenshots, die nicht klicken können). Wer einen Titel
umformuliert, ändert damit die id; `#eigene-id` friert sie ein.

## Der Dialekt im Kartenrumpf

GFM plus drei Hausformen:

| gewünscht | schreiben |
| --- | --- |
| Absatz, fett, kursiv, `Code`, [Link](…), ~~gestrichen~~, Tabellen, Listen | normales GFM |
| leiser Nachsatz (`p.dim`) | `Text des Absatzes {.dim}` (markdown-it-attrs) |
| Warum-Kasten | `::: why Titel` … Fliesstext … `:::` |
| Was-fehlt-Kasten | `::: gap Titel` … Fliesstext … `:::` |
| Lead (die Sache in zwei Sätzen) | `> Text` als **erster** Absatz der Karte |
| Abbildung | `::: figur <name> Titel` … Bildunterschrift … `:::` |
| Zeichen im Fliesstext | `:furt|Furten:` (Zeichen + Wort) · `:furt:` (nur Zeichen) |
| alles, was GFM nicht kann | die HTML-Zeile einfach stehen lassen (`html:true`) |

## Die Schauseite: Lead, Abbildung, dann erst die Herleitung

Leser-Rückmeldung (Aug 2026): *zu viel Text, keine Bilder.* 52 Publish-Karten,
13 285 Wörter, null Abbildungen — und ausgerechnet die Karten über Dinge, die
man **sehen** müsste (die fünf Zonen einer Spielkarte, die Uhr, eine Furt),
waren reine Textwände.

Beginnt eine Karte mit einem **Zitat-Absatz**, gilt er als *Lead*. Lead und
die unmittelbar folgenden `::: figur`-Zäune sind die **Schauseite**; alles
danach ist die Herleitung und klappt in der Publish-Ansicht hinter den Knopf
*„Wie es dazu kam"*. In der Entwicklungs-Ansicht steht wie bisher alles offen.

```markdown
## Die Anatomie der Spielkarte {concept}

> Jede Spielkarte trägt dieselben fünf Zonen in derselben Reihenfolge …

::: figur karte-zonen Eine Effektkarte, aus dem Baukasten
Dieselbe `SOT.karte()`, die im Spiel auf dem Tisch liegt.
:::

Die Formensprache sagt … ← ab hier die Herleitung
```

**Karten ohne Lead rendern unverändert** — die Umstellung geht Karte für Karte
und ist kein Bruch.

## Abbildungen

Eine Abbildung ist **kein Schnappschuss**. Ein Bild veraltet in dem Moment, in
dem jemand `SOT.karte()` anfasst, und niemand merkt es. Stattdessen zeigt das
Handbuch das Ding **selbst**: die Spielkarte in der Abbildung *ist* dieselbe
`SOT.karte()`, die im Spiel auf dem Tisch liegt, die Furt nutzt dieselbe
Hexgeometrie wie das Brett. Ändert sich das Primitiv, ändert sich die
Abbildung mit — auseinanderlaufen können sie nicht.

Das Markdown nennt nur den Namen; gezeichnet wird im Browser aus dem Baukasten.
Die Zeichnungen stehen in **`prototype/kit/sot-figuren.js`** und melden sich mit
`SOT.doc.figur('name', fn)` an. Ein Name ohne Eintrag bleibt nicht still leer,
sondern zeigt sichtbar *„Abbildung … nicht angemeldet"*.

Eine neue Abbildung braucht drei Dinge: den Eintrag in `sot-figuren.js`, den
Namen im Markdown — und einen Blick auf 390 px, wo die Bühne umbricht.

Dasselbe gilt für Zeichen im Fliesstext: `:furt|Furten:` schreibt nur den Namen
ins Dokument, das SVG kommt beim Laden aus `sot-icons.js`. Nie ein
Schriftzeichen — es erbt fremde Metrik und fehlt auf manchen Geräten ganz.

Eigenheiten, die man wissen muss:

- **`<b>`/`<i>` statt `<strong>`/`<em>`**: der Komponist rendert `**`/`*` als
  `<b>`/`<i>`, weil `sot.css` (`.why b`, `.gap b`) diese Tags anspricht.
- **Kästen sind Fliesstext**: `::: why`-Inhalt wird inline gerendert (kein
  `<p>` darin — der bekäme Absatzränder). Braucht ein Kasten Blöcke
  (Tabellen, Absätze), bleibt er als rohe `<div class="why">…</div>`-Zeile
  stehen; im Bestand betrifft das genau eine Karte (Eiszeit-Rückzug, Kap. 2).
- **Gerade Anführungszeichen vor `{.dim}`** maskiert der Komponist selbst
  (markdown-it-attrs hielte das `"` sonst für einen Attributwert und liesse
  das `{.dim}` wörtlich stehen) — Autoren müssen nichts tun.
- **Zeilenumbrüche in Tabellenzellen**: wörtliches `<br>`.
- Tabellen werden ohne `thead`/`tbody` gerendert (wie das handgeschriebene
  Original); Zellklassen (`td.n` rechtsbündig) gehen nur als rohe HTML-Tabelle.

## Grenze

Dieses Verzeichnis trägt nur das *Haupt*-Handbuch. `stromlinien-technik.html`
und `art-direction-handbuch.html` nutzen dasselbe Kartenformat und könnten
später auf denselben Komponisten umziehen — bewusst noch nicht geschehen.
