# Gedanken zum Kartendesign

Layout-Grundsätze für **Effektkarten** — Karten, die vor einer Runde gespielt
werden und entweder bestimmte Personen verändern oder die allgemeinen
Bedingungen der Runde. Ursprünglich für die „Morgen"-Karten geschrieben, aber
die Essenz gilt für **alle spielbaren Karten und Plättchen**.

Umsetzung im Baukasten: `.effektkarte` + `SOT.karte()` (`prototype/kit/`,
Abschnitt *Die Spielkarte* im Kit-README). Die fünf Zonen und die beiden
Achsen dort sind die direkte Übersetzung dieser Notiz.

## 1 · Eine klare Aufgabe je Karte

Jede Effektkarte muss drei Fragen in unter zwei Sekunden beantworten:

- Wie heisst der Effekt?
- Wen oder was betrifft er?
- Was ist die konkrete mechanische Änderung?

Versucht eine Karte mehr als eine Aufgabe, wird sie geteilt oder vereinfacht.
Effektkarten werden unter Zeitdruck am Rundenbeginn gespielt — die kognitive
Last muss niedrig bleiben.

## 2 · Strikte visuelle Hierarchie (oben nach unten)

Feste Reihenfolge auf jeder Karte:

1. **Kartenname** (grösster Text, oben)
2. **Ziel/Geltung** (direkt unter dem Namen oder darin integriert)
3. **Primäre mechanische Wirkung** (die grosse Zahl / das Stichwort)
4. **Stützender Regeltext** (kurz, zweitrangig)
5. **Stimmungstext** (kleinste Schrift, unten)

Die Reihenfolge wird **nie** umgestellt. Schrift, Farbe und Abstand dürfen
sich ändern — die Informationsfolge bleibt über den ganzen Satz identisch.

## 3 · Ziel/Geltung muss sofort scannbar sein

Die wichtigste Unterscheidung des Satzes:

- **Personen-Karten**: die betroffene(n) Person(en) mit Zeichen + Name in
  einer festen Zone (unter dem Titel), immer an derselben Stelle.
- **Allgemeine/Umwelt-Karten**: eigene visuelle Behandlung, damit sie nie wie
  Personen-Karten aussehen — anderer Rahmen (gestrichelt), entsättigte
  Zielzeile, eigenes Banner.

Spieler sollen die beiden Sorten **ohne Lesen** sortieren können.

## 4 · Die primäre Wirkung bekommt das stärkste Gewicht (nach dem Namen)

Die wichtigste Zahl oder das Stichwort („+2 Reichweite", „+1 Stärke") ist das
**zweitprominenteste** Element der Karte: gross, kontrastreich, bevorzugt
Zeichen + Zahl statt Fliesstext. Der Regeltext darf erklären, aber die
mechanische Pointe steht für sich.

## 5 · Disziplin im Regeltext

- Kurz: 1–3 kurze Zeilen, nicht mehr.
- Gleiche Satzmuster über den ganzen Satz:
  „Ziel erhält +X ‹Wert›, heute." · „Alle Tiere: −Y Witterung, diese Runde."
- Stichworte statt ganzer Sätze, wo die Bedeutung etabliert ist.
- Die Wirkung nie in einem Absatz Stimmungstext vergraben.

## 6 · Feste Zonen (das Template)

| Zone | Inhalt | Hinweis |
| --- | --- | --- |
| Kopf | Kartenname | immer gleiche Höhe |
| Zielzone | Personen-Marke(n) oder „Runde/Umwelt" | immer dieselbe Stelle |
| Wirkungszone | grosse Zahl / Stichwort | stärkstes Gewicht nach dem Namen |
| Regelkasten | kurzer mechanischer Text | einheitliche Behandlung |
| Fussstreifen | Stimmung + Nebenzeichen | kleinste Schrift |

Sind die Zonen einmal fest, füllen Gestalter nur noch Zonen, statt je Karte
ein Layout zu erfinden.

## 7 · Kodierungssystem

- Personen-Karten → eigener Rahmen-/Ecken-/Zeichenstil
- Allgemeine Karten → klar anderer Rahmen/Grund
- Optional: Farbakzent nach Bonusart. Nach 4–5 Karten muss das System
  gelernt sein.

## 8 · Lesbarkeit unter echten Spielbedingungen

- Karte wird in der Hand oder zwischen anderen Karten gelesen.
- Mindestschriftgrösse auf Armlänge bequem; Kontrast nicht verhandelbar.
- Kritische Zahlen nie an die Kanten (Finger, überlappende Karten).

## 9 · Namen und Tonfall

- Kartennamen sprechen mit einer Stimme: entweder alle evokativ
  („Gegenwind", „Ruhige Hand", „Blutspur") oder alle funktional
  („Reichweiten-Bonus"). Nicht mischen.
- Stimmungstext darf Atmosphäre tragen, konkurriert aber nie mit der
  Mechanik um Aufmerksamkeit.

## Checkliste vor der Freigabe einer Karte

- [ ] Name ist das grösste Textelement
- [ ] Ziel (Person oder Runde/Umwelt) ist sofort klar
- [ ] Primäre Wirkung ist das zweitprominenteste Element
- [ ] Regeltext kurz, einheitliche Satzmuster
- [ ] Personen- und allgemeine Karten auf einen Blick unterscheidbar
- [ ] Keine kritische Information nahe der Kartenkante
- [ ] Zonen entsprechen dem Template

## Nachtrag (22. Aug 2026): das Kopfband

Feedback nach dem ersten Baukasten-Stand hat die Hierarchie präzisiert:

- **Tageszeit, Art und Dauer wandern als Kopfband über den Namen**, in der
  Akzentfarbe der Oberkante — Kante und Band verschmelzen zur
  Rahmen-Identität, und Zone 2 gehört ganz dem Ziel (den Personen-Marken).
  Die Dauer verlässt den Regeltext („…, heute." entfällt).
- **Die Art ist ein Wortschatz**: spielen · herstellen · rundenbedingung,
  je ein Zeichen aus dem Zeichensatz. Nur so können die Etiketten
  einklappen, wenn die Karte schmal wird — die Zeichen bleiben, die
  Information fällt nie, nur ihr Wort.
- **Standardbreite 160** (Mittel); über den Grössenfaktor ergeben sich
  128 · 160 · 200.

Umsetzung und exakte Masse: Kit-README, Abschnitt *Die Spielkarte*.
