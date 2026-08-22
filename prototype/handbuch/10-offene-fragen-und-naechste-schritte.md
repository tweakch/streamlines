---
nummer: 10
id: k10
titel: Offene Fragen & nächste Schritte
untertitel: Die Landkarte des Ungelösten.
banner: 10 OFFEN
---

## Recherche: jede Jahreszahl prüfen {open}

Alle Datierungen in Konzept und Prototyp (8,2-ka-Ereignis, Piora, Klostergründungen, Bündner Wirren, Rheinregulierung, regionale Fundstellen, Diffusionstempi) sind Gedächtnisstand / Design-Hypothesen – **vor der Datenerfassung gehört jede Zahl belegt**. Der Belegstatus wandert dann als Feld in die Datenschicht.

## Ein Effekt-Vokabular für alle Werkzeuge {open}

Die beiden Werkzeuge beschreiben Spielwirkung **unterschiedlich** – das ist der eigentliche Portblocker:

- **Mechanik-Labor**: ausführbare Struktur, bereits erprobt – Bedingung `{stat:'schutz', gte:5}`, dann `pass`/`fail` als Ressourcendelta (`{n:-2}` / `{n:-4}`), plus benannte Sonderfälle (`woodBoost`, `pfahlUnlock`, `seeRise`).
- **Designer-Werkstatt**: **Freitext** – ein Mensch liest "−2 Nahrung ohne Schutz ≥4", keine Engine führt es aus.
- **Spiel/App**: JavaScript-Funktionen pro Anker (`data.ts`).

Offen ist die Konvergenz: Das Labor hat das Vokabular praktisch schon gefunden – `Bedingung × pass/fail × Ressource` – und sollte es der Werkstatt vorgeben, mit Freitext als Rückfall für alles Atmosphärische. Fragen: Wie viel müssen die benannten Sonderfälle tragen, bevor sie wieder Code sind (steigender See, Freischaltungen, Deck-Eingriffe)? Wie werden Verbund- und Geländebedingungen ausgedrückt? Und braucht es **ein** Austauschformat statt zweier (`{P, MAP, START_TILES}` im Labor gegen `{rules, tiles, species, events, funds, epochs, ceremonies}` in der Werkstatt)?

Hier zahlt sich die Template-Idee aus (Kap. 4: ~48 Karten-Familien aus Gefahr × Deutungsrahmen) – ein gemeinsames Vokabular ist der Zwischenschritt zur generierten Nachtkarte, die dann redigiert statt geschrieben wird. {.dim}

## Entschieden: Gestaltete Weltkarte statt endloser prozeduraler Welt {done}

**Entscheidung:** Die Welt ist **gestaltet** – die reale Welt mit realen historischen Fakten. Die Erste Weltkarte (Alpenrhein, Landquart bis Konstanz) ist von Hand entworfen (`app/src/stromlinien/world.ts`, 22×44 Hexes, als ASCII-Zeilen editierbar); **Fundstellen, Zeichen und Landmarken sind an feste Weltkoordinaten gebunden**, Anker-Ereignisse folgen, sobald sie ortsgebunden werden.

Die beiden Richtungen, zwischen denen entschieden wurde:

- **Gestaltet** (gewählt): jede Epoche trägt einen von Hand entworfenen Kartenzustand; Werkstatt und Labor schreiben genau diese Karten.
- **Prozedural** (verworfen als Weltprinzip): die endlose Seed-Welt des Startbildschirm-Prototyps. Ihre *Interaktion* überlebt vollständig – Nebel des Ungespielten, formbares Gebiet und Zeichen ◈ wurden auf die gestaltete Karte übertragen.

::: why Warum gestaltet
Historische Treue und erzeugte Landschaft vertragen sich nur begrenzt: Eine erzeugte Landschaft kann keine belegte Fundstelle tragen. Der Kern der Spielidentität – Zeitreisenden-Effekt, Fundstellen, Authentizität – braucht Orte, die wirklich existieren. Nebeneffekt: Weil die Welt endlich und für alle dieselbe ist, wird die aufgedeckte Weltkarte vergleichbar und die Werkstatt (Kap. 8) zur Quelle der Wahrheit.
:::

Die aktuelle Weltkarte in `world.ts` ist ein erster Entwurf des Kartografen-Gewerks – Geometrie und Fundstellen-Positionen sind „historisch inspiriert und vereinfacht" und warten auf die Recherche-Karte (Kap. 10, „jede Jahreszahl prüfen"). {.dim}

## Design-Backlog {open}

- Module II–V als spielbare Kartensets (II als Nächstes: "sichtbare vs. verwaltete Macht" + Omen-Nächte)
- Zeremonien III→IV und IV→V ausformulieren
- Furcht-Kartenset Modul IV (mechanisch das heikelste: Denunziation respektvoll und lehrreich gestalten)
- Personen-System erweitern (Rollen pro Epoche? Bewegungsreichweite bei wachsendem Tal?)
- Flussbegradigung als Spielzug (Modul V) inkl. Langzeitfolgen
- Mehrspieler-Prototyp
- Simulations-Tool existiert als Draft (Mechanik-Labor, Kap. 8); nächster Schritt: Balancing-Zahlen damit festlegen
- Namen & Erinnerung / Mythos-Karten als leichte Erzählmechaniken prüfen
- Editor-Port: Schema-Validierung (zod) + Kartenlader für Werkstatt-JSON (das Spielraster ist seit dem Startbildschirm-Port regionsbasiert; die Weltkarte in `world.ts` sollte langfristig aus der Werkstatt kommen)
- Deck-Gewichte pro Epoche statt global – ein Pfahlbau-Gewicht ist in Epoche III bedeutungslos
- Stabile Slugs statt laufender Nummern für Arten/Ereignisse/Fundstellen; Fundstellen-Referenzen als Auswahl statt Freitext
- Undo im Editor – Malen ist billig, das Löschen einer über fünf Epochen platzierten Art nicht
- Aus den Notizen zum Spielablauf (`notes/gedanken-zum-spielablauf.md`): Undo-Fenster = ganzer Tag entscheiden und bauen (Aufdeckung bleibt final, Kap. 2 „Der Punkt")
- Reihenfolge im Tag: braucht es eine Sperre (z. B. Bewegung erst nach dem Legen), damit Kundschaften nicht immer dominiert? (Kap. 2)
- Wünschelrute: Umbenennen oder als geglaubte, epochenabhängige Wirkung führen – Richtung vorgeschlagen (Kap. 4), Entscheidung offen
- Neun Stufen vs. fünf Module offiziell entscheiden (Kap. 1)

