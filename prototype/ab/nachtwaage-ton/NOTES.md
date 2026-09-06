# A/B: Nachtwaage-Kurve + Nacht-Ton

## Die Frage

Wenn der Stamm reich an Vorrat ist — wie skaliert die **Nacht** mit dem Bestand,
und welchen **Ton** trägt der Druck?

Zwei getrennte Achsen (nicht vermischen):

1. **Waage** — Daten-Tabelle Bestand → Nacht-Effekt (Mechanik)
2. **Ton** — Sprache der 6+-Karten (Chronist / Alex-Geschmack)

## Die Varianten

### Waage

| | A — weiche Kurve (gewählt) | B — Schwelle |
|---|---|---|
| 0–2 | ruhig, 1 Karte | ≤3 ruhig |
| 3–5 | gemischt, 1 Karte | — |
| 6+ | Druck: 2 Karten oder 1 schwere | ≥4 Druck |
| Feel | reich = zittrig-lohnend, knapp = ruhig | riskiert tot unter der Schwelle |

### Ton (färbt nur 6+-Sprache)

| A — „Gäste am Feuer“ | B — „Beute weckt Neugier“ (gewählt) |
|---|---|
| Anziehung, Gelegenheit+Risiko | Druck, Raub/Hunger der anderen |

## Entscheidung

**2026-09-06 — locked**

- Waage **A** (weiche Kurve 0–2 / 3–5 / 6+)
- Ton **B** (Beute weckt Neugier)
- Belegstatus klebt an den Bändern, nicht am Ton
- Sammlerin: Zielort tippen, Risiko = Besitz (Risikoleiter)
- Wissens-Boden am mageren Tag: „Die Netze blieben leer. Die Uferlinie kennen wir jetzt.“ (historisch inspiriert)
- Scheitern = Stamm zieht weiter

Umgesetzt in Draft: [`prototype/drafts/sammlerin-nachtwaage-v1.html`](../../drafts/sammlerin-nachtwaage-v1.html) (merged via PR #7).

## Karten-Pool (Ton B, Chronist)

- **0–2:** Tausch am Lagerfeuer · Leichte Gäste — historisch inspiriert
- **3–5:** Spuren im Schilf (insp.) · Ein Angebot, das nach Vorrat riecht (frei)
- **6+:** Spuren am Bootsland · Hungernde Nachbarn (insp.) · Der Vorrat riecht weit (frei)

## Nächstes Experiment (nicht diese A/B)

2-Karten-Nacht-Beat (Feel/UI): zweite Karte darf nicht wie Rauschen wirken.
Debug-Tray = Parkplatz. Kein `app/`-Port.
