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
| alles, was GFM nicht kann | die HTML-Zeile einfach stehen lassen (`html:true`) |

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
