---
nummer: 05
id: k5
titel: Wertung & Balancing
untertitel: Zwei unabhängige Scores – klug spielen und historisch bauen.
banner: 5 WERTUNG
---

## Balance-Score {done}

`Balance = min(alle Ressourcen) / Durchschnitt(alle Ressourcen)` → 0–100 %.

Beispiel: 9/3/7/5 (Summe 24) → 3/6 = **50 %**. Aber 6/6/6/6 (gleiche Summe!) → **100 %**. Einseitige Strategien werden nicht verboten, sie zahlen am Ende – und leiden unterwegs real unter Nachtereignissen.

## Authentizitäts-Score {done}

Jedes Plättchen hat einen historischen Idealbereich (aus Fundlage). Dort platziert = volle Punkte, anderswo = weniger oder null – **bauen bleibt immer erlaubt**, es kostet nur Punkte. Beispiel: Pfahlbau im Flachwasser des Sees = 3, im Bergtal = 0.

::: why Warum das nicht frustriert
Kein verbotener Zug, sondern ein zweiter Ehrgeiz: "Kann ich beim nächsten Mal näher an der Realität bauen?" – dabei lernt man nebenbei, wo die echten Fundstellen liegen. Verstärkt durch Sofort-Feedback pro Zug und die Realitätsabgleich-Karte der Zeremonie.
:::

## Versteckte Fundstellen {done}

Reale (vereinfachte) Fundplätze liegen verdeckt auf der Karte. Wer das passende Plättchen dort baut, deckt den Fund auf – mit Kurztext und Kultur-Bonus. Belohnt historisch plausibles Bauen *im Moment des Spielens*, nicht erst in der Endabrechnung. Im Prototyp: Pfahlbau-Fundstelle am Seeufer, Jägerrastplatz in Hanglage, Silex-Abbaustelle.

## Spielerzahl-Skalierung: die Durchschnitts-Variante {concept}

Erkenntnis aus der Diskussion: "Schwellenwert = 5×N" und "Durchschnitt ≥ 5" sind **dieselbe Ungleichung**, nur anders aufgeschrieben. Gewählt: `Σ min(…) / N ≥ Zielwert` – am leichtesten zu erklären ("wir brauchen im Schnitt 5 pro Person") und zu programmieren.

Ein echter Multiplikator lohnt nur als bewusster Ausgleich (z. B. ×1,2 bei 2 Spielern, falls Partien sich "leerer" anfühlen). Die frühere Tabelle 12/16/20 war nicht rein proportional – korrigiert. {.dim}

## Balancing-Loop & offene Zahlen {open}

- Ziel: Unterschied gutes/schlechtes Spiel ≈ 2–3 Runden, nicht 10 (im Mechanik-Labor simulieren)
- Erster Monte-Carlo-Befund (Mechanik-Labor, Kap. 8): Ein gut spielender Bot überlebt mit den aktuellen Werten 99,9 % der Läufe und erreicht in 99,4 % „Die Pfahlbauer" (Median 26/30) — die oberste Endstufe ist für optimiertes Spiel zu leicht; einzige reale Gefahr ist die große Kälte. Schwellen (10/16) oder Erträge gehören nachgeschärft.
- Nachtkarten-Verhältnis (aktuell ~ Gefahr/Chance/Stille) nach Playtests justieren
- Gesamtgewichtung Balance vs. Authentizität am Kampagnenende – 60/40? Hängt von der Positionierung Strategiespiel vs. Lernspiel ab
- Variance-Tests mit unterschiedlichen Spielstilen

