---
nummer: 03
id: k3
titel: Die Nacht: Furcht & Zeitgeist
untertitel: Die längste Designreise des Projekts – in drei Etappen.
banner: 3 NACHT
---

## Etappe 1: Nacht als Themenwechsel {rej}

Erste Fassung: Die Nacht bekommt pro Epoche nur ein anderes *Thema* (Verwaltung, Kirche, Schmuggel), aber der Spieler tut nichts anderes als am Tag.

::: why Warum verworfen
"Könnte spannender sein" – es fehlte der Werwolf-Kern: etwas, das die Nacht vom Tag strukturell unterscheidet.
:::

## Etappe 2: Nacht als asymmetrische Information {rej badge="Verworfen / geparkt"}

Zweite Fassung mit sauberer Eskalation über die Module: **II** – ein "Beamter" sieht heimlich den Statthalter-Stapel (einer weiß mehr). **III** – der Klosterspieler sieht alle geplanten Aktionen, darf eine verraten (einer weiß alles). **IV** – heimliche Bündniskarten, Denunziationsrisiko (jeder weiß etwas über jemanden).

::: why Warum verworfen
Die Richtung sollte eine andere sein: nicht Information zwischen Spielern, sondern *Furcht vor Zeitgenössischem*. Zudem funktioniert asymmetrische Info erst ab 3–4 Spielern. Elemente (Denunziation!) leben in Etappe 3 weiter – als Mehrspieler-Würze wieder aufgreifbar.
:::

## Etappe 3: Die Nacht als Mentalitätsgeschichte — aktueller Stand {concept}

Die Nacht zeigt, **was die Menschen damals wirklich fürchteten** – der Zeitgeist gibt vor:

| Modul | Furcht vor … | Mechanik |
| --- | --- | --- |
| I | dem Tier (Furcht ist real) | Vorbereitung tags, Aufdeckung nachts |
| II | den Göttern | **Omen** deuten: Opfer bringen oder ignorieren – das Spiel verrät nie, ob es Zusammenhang gab |
| III | der Sünde | Wer tags hart handelte, zieht nachts aus **schwererem Stapel**; Ablass/Stiftung neutralisiert |
| IV | dem Nachbarn | Nach Unglück sucht die Nacht **einen Schuldigen** – mitgehen oder schützen, beides kostet |
| V | sich selbst | Nachtkarten sind **Prognosen** – handeln oder verdrängen |

::: why Der Bogen
Tier → Götter → Sünde → Nachbar → sich selbst. In Modul I ist die Furcht *berechtigt*, in Modul IV *tödlich falsch*. Das Spiel lehrt, ohne zu belehren.
:::

## Anker- vs. Streu-Ereignisse {done}

**Anker** = belegt, datiert, geschehen in jeder Partie zur selben Zeit (im Prototyp: Wiederbewaldung, große Kälte ~6 200 v. Chr., erste Bauern, steigender See). **Streu** = Ereignistypen, die real vorkamen, aber nicht datierbar sind – hier ist die *Wahrscheinlichkeit* historisch korrekt, nicht das Einzelereignis.

::: why Der Zeitreisenden-Effekt
Erste Kampagne: überrascht. Zweite: Vorräte anlegen. Erfahrene Spieler antizipieren belegte Geschichte – Wissen wird spielbar. Kernstück der Spielidentität.
:::

**Der Anker ist mehr als eine Runde (21. Aug 2026).** Im Epoche-I-Prototyp ist ein Anker eine Rundenzahl und ein Textkasten mit Soforteffekt. Das Ereignis-Labor (Kap. 8) zeigt, dass derselbe Anker vier Angaben braucht, um als Ereignis *im Tal* zu geschehen: einen **Ort** (auch einen abseits der Karte), eine **Ausbreitung** über mehrere Runden, **Phasen** (Vorzeichen → Einschlag → Nachwirkung) und eine **Spur**, die auf der Karte bleibt. Die Rundenzahl selbst wird aus dem absoluten Jahr gerechnet.

Damit verschiebt sich auch die Trennlinie zu den Streu-Ereignissen: sie liegt nicht zwischen „datiert" und „undatiert", sondern verläuft **pro Angabe**. Der Waldbrand im Labor ist in der Zeit gesetzt (Datum erfunden) und im Raum emergent (Ort aus dem Kartenzustand) – ein Ereignis kann in einer Dimension Anker und in der anderen Streu sein. {.dim}

## Ereignis-Dramaturgie: das Ereignis erzählt die Runde {done badge="Umgesetzt (ohne Geometrie)"}

::: why In der App seit 21. Aug 2026 — die Hälfte ohne Geometrie
Portiert ist die **Dramaturgie**: die vier Anker tragen `vor`, `vorT`, `nachT` und `antworten`; der **Morgenbericht** im Spiel zeigt Vorzeichen, Nachwirkung und was die Nacht hinterliess; das **Handlungsfenster** steht von der Vorzeichen-Runde bis zum Tag des Einschlags offen, kostet im Moment der Wahl und wirkt erst in der Nacht — `fx` liest sie aus `state.antwort`. Belegt am Ergebnis: dieselbe Runde, andere Wahl. Die grosse Kälte kostet **4 Nahrung ohne Vorbereitung, 2 mit Vorräten**; der Pfahlbau-Anker gibt 1, 2 oder 3 Plättchen. Drei Beobachtungen aus dem Port: **1)** Der Morgenbericht ist vollständig aus der Runde *abgeleitet* — kein eigener Zustand, also nichts, was ein Spielstand mitschleppen müsste. Nur die getroffene Wahl ist Zustand. **2)** Genau eine neue Zahl im Spielstand kostete eine Schema-Migration (v1→v2); sie wandelt statt zu verwerfen, damit laufende Partien den Sprung überleben. **3)** Nicht jeder Anker braucht ein Fenster: die Wiederbewaldung ist ein Geschenk und bleibt eines. **Nicht portiert** (bewusst): Ausbreitung, Geländespuren und Verluste an Plättchen und Menschen — im Labor waren in der ersten Fassung 9 von 16 Plättchen in einer Nacht weg. Das gehört vorher durch das Mechanik-Labor.
:::

**Der Befund** (21. Aug 2026): Heute ist ein Anker *ein Kartenmoment in der Nacht* — eine Überschrift, ein Absatz, ein Soforteffekt, weg. Damit ist das Ereignis Kulisse. Soll es die Geschichte **erzählen**, muss es an mehreren Stellen des Rundenablaufs auftauchen — und zwar an genau diesen:

| Ereignisphase | Abschnitt der Runde | Was der Spieler sieht | Was er tun kann |
| --- | --- | --- | --- |
| **Vorzeichen**<br><span class="dim">n Runden vorher</span> | **Morgen**, im Tagesbericht | eine Zeile, die nichts erklärt („Im Süden steht Staub über dem Tal, tagelang, ohne Wind"), dazu ein Zeichen am Ort auf der Karte | **Alles.** Dies ist das einzige Fenster, in dem ein datiertes Ereignis noch Handlungsfreiheit lässt |
| **Angebot** | **Tag**, neben den normalen Aktionen | zwei bis drei benannte Antworten mit Preis („Brandgasse schlagen · −2 Material") | eine wählen — oder nichts tun, was auch eine Wahl ist |
| **Einschlag** | **Nacht**, ersetzt die Streu-Nacht | die Aufdeckung wie heute, aber **mit Ort**: die Front auf der Karte, die getroffenen Felder, die verlorenen Plättchen namentlich | nichts. Aufdeckung ist final |
| **Ausbreitung** | **Nacht**, begleitet die Streu-Nacht | die Front rückt weiter vor, Nacht für Nacht, bis sie ausläuft | ausweichen, retten, Menschen wegziehen — *am Tag dazwischen* |
| **Nachwirkung** | **Morgen** der Folgerunden | verändertes Gelände, Narben ◇, andere Erträge im Inspektor | wieder aufbauen — oder das neue Land nutzen |
| **Spur** | dauerhaft | die Karte ist eine andere als vorher | damit leben |

::: why Drei Regeln, die daraus folgen
1) **Der Einschlag ersetzt die Streu-Nacht, die Ausbreitung begleitet sie.** Sonst schluckt ein Ereignis über vier Nächte das gewöhnliche Spiel — und die Nacht als Mentalitätsgeschichte (Kap. 3) fällt genau dann aus, wenn am meisten zu deuten wäre.<br><br>2) **Ohne Vorzeichen kein Spiel, nur Buchhaltung.** Der Zeitreisenden-Effekt lebt nicht davon, *dass* ein Ereignis datiert ist, sondern davon, dass der Spieler **vorher etwas tun kann**. Ein Anker ohne Handlungsfenster ist eine Rechnung, die man bezahlt; ein Anker mit Fenster ist eine Entscheidung, die man beim zweiten Durchgang anders trifft.<br><br>3) **Das Vorzeichen eines Ereignisses darf ein anderes Ereignis sein.** Der Bergsturz legt das Flussbett trocken; zwei Runden später bricht der Stausee. Wer das trockene Bett in Runde 3 begeht, verliert in Runde 5 Menschen darin — und wer die Geschichte kennt, geht nicht hinein. Das ist der Zeitreisenden-Effekt in seiner stärksten Form: nicht Vorräte anlegen, sondern eine Falle nicht betreten.
:::

Im `ereignis-labor-v1` ist der Ablauf als Prüfstand gebaut: die Runde läuft in den vier Abschnitten des Kernloops, die Ansicht **Spielsicht** zeigt für jeden Abschnitt, was der Spieler dort liest und entscheidet, und die Antworten wirken messbar. Belegt: römische Dämme gegen dasselbe Hochwasser senken die dauerhaft veränderten Felder von 294 auf 232 und die verlorenen Plättchen von 9 auf 5.

Offen: **wo die Vorzeichen-Zeile wohnt** — der Tagesbericht am Morgen ist im Spiel bisher nur ein Toast; die Ereignisse brauchen eine eigene Fläche (Kandidat: die Chronik aus Kap. 8 als Morgenkarte statt als Rückblick). Ob ein Vorzeichen **seinen Ort verrät** oder nur seine Richtung (die Zeichen ◈ der Weltkarte wären das Vokabular dafür). Ob Antworten **generisch** sind (Vorräte, Dämme, Umzug — dann skalieren sie über alle Ereignisse) oder **je Ereignis geschrieben** (dann erzählen sie besser, kosten aber Autorenarbeit je Eintrag). Und ob das Handlungsfenster eine **eigene Aktion** kostet oder nur Ressourcen — es konkurriert sonst mit nichts. {.dim}

