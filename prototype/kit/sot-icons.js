/* ============================================================================
   sot-icons.js — STROMLINIEN Prototyp-Baukasten · Das Zeichensatz-Register

   **Regel: Icons sind SVG. Immer.** Kein Schriftzeichen steht für ein Spielding.

   Warum das eine Regel ist und keine Vorliebe: ein Glyph wie ✦ oder ▲ ist
   Schrift, kein Bild. Er erbt die Laufweite und Grundlinie der Schriftart, er
   fällt je Gerät auf eine andere Datei zurück (▨ und ⋔ fehlen auf iOS ganz),
   er nimmt `stroke` nicht an, er zentriert sich nicht in einem Hex-Slot, und
   er lässt sich nicht mit dem Rest des Bestands in einem Zug umzeichnen. Was
   als „schnell mal ein Zeichen" beginnt, ist zwei Epochen später ein Icon-Set
   aus zwei Materialien — und man sieht es.

     script src        →  ../kit/sot.js
     script src        →  ../kit/sot-icons.js

   Hängt als SOT.icon / SOT.iconEl / SOT.icons an. Verlangt sot.js.

   ---------------------------------------------------------------------------
   HAUSSTIL — jedes neue Zeichen hält sich daran, sonst fällt es auf:

     viewBox="0 0 40 40"        immer dasselbe Feld, damit Grössen mischbar sind
     fill="none"                Fläche nur als bewusster Akzent (siehe unten)
     stroke="currentColor"      die Farbe kommt vom Elternteil, nie aus dem Icon
     stroke-width="2.4"         2.6/3 nur, wo eine Silhouette sonst zerfällt
     stroke-linecap="round"     Linienenden rund, das ist die Handschrift

   Fläche (`fill="currentColor"`) trägt genau eine Bedeutung: **das ist der
   Punkt, um den es geht** — das Auge des Fisches, der Ocker im Napf, die
   Bernsteinperle im Kies. Nie zur Zierde.

   GRÖSSENSTUFEN — ein Zeichen, das im Hex-Slot bei ~16 px steht, darf nicht
   mehr als vier Striche haben. Die Rollenbilder (sammlerin, jaeger) sind
   darauf gezeichnet: dieselbe Datei trägt Almanach (76 px) und Slot (16 px).
   Wer ein reicheres Zeichen braucht, prüft es bei 16 px, bevor er es hier
   ablegt — `kit-demo.html?icons` zeigt jede Stufe nebeneinander.
   ========================================================================= */
'use strict';
(function () {
  var el = SOT.el;

  /* Kopf und Fuss jeder Zeichnung — einmal, damit der Hausstil nicht 50-mal
     abgeschrieben wird und beim Ändern 50-mal auseinanderläuft. */
  function svg(inner, opt) {
    opt = opt || {};
    return '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="'
      + (opt.w || 2.4) + '" stroke-linecap="round"'
      + (opt.join ? ' stroke-linejoin="' + opt.join + '"' : '') + '>' + inner + '</svg>';
  }
  /* svg24 — Zeichnungen, die in einem 24er-Feld entstanden sind, ins Hausfeld
     holen, OHNE sie neu zu zeichnen: die Pfade bleiben in 24er-Koordinaten und
     werden um 40/24 skaliert. Die Strichstärke muss dabei gegengerechnet
     werden (2.4 ÷ 1.6667 = 1.44), sonst skaliert der Strich mit und wird zu
     fett. So sieht die Zeichnung gleich aus und der Hausstil bleibt einer.
     Kein Dauerzustand — wer eine davon anfasst, rechnet sie auf 40 um. */
  var S24 = (40 / 24);
  function svg24(inner, opt) {
    opt = opt || {};
    return '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="'
      + (2.4 / S24).toFixed(2) + '" stroke-linecap="round"'
      + (opt.join ? ' stroke-linejoin="' + opt.join + '"' : '')
      + '><g transform="scale(' + S24.toFixed(4) + ')">' + inner + '</g></svg>';
  }

  /* ==========================================================================
     1. BAUTEN UND PLÄTTCHEN
     Aus dem Bestand übernommen — diese neun standen in fünf Dateien
     byte-gleich (geprüft), sie sind der Grund für dieses Register.
     ========================================================================== */
  var ICONS = {
  fisch:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 20 Q16 10 27 16 Q33 19 34 20 Q33 21 27 24 Q16 30 6 20 Z"/><path d="M34 20 L39 14 M34 20 L39 26"/><circle cx="13" cy="18.5" r="1.4" fill="currentColor"/></svg>',
  lager:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 26 L20 12 L32 26"/><path d="M20 12 V26"/><path d="M5 32 Q12 29 20 32 Q28 35 35 32"/></svg>',
  wald:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M13 32 V22 M13 22 L7 24 M13 22 L19 24 M13 15 L8 18 M13 15 L18 18 M13 8 L13 15"/><path d="M28 32 V20 M28 20 L22 23 M28 20 L34 23 M28 12 L23 16 M28 12 L33 16"/></svg>',
  terrasse:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 32 H35 M9 25 H31 M14 18 H26 M18 11 H22"/></svg>',
  hoehle:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 32 Q6 12 20 12 Q34 12 34 32"/><path d="M14 32 Q14 20 20 20 Q26 20 26 32"/></svg>',
  flint:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M20 6 L30 16 L26 34 L14 34 L10 16 Z"/><path d="M20 6 L18 20 L26 34 M18 20 L10 16"/></svg>',
  pfahl:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 18 L20 8 L32 18 M11 18 H29 V24 H11 Z"/><path d="M13 24 V34 M20 24 V34 M27 24 V34"/><path d="M6 35 Q13 32 20 35 Q27 38 34 35"/></svg>',
  holz:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="6" y="13" width="28" height="8" rx="4"/><rect x="6" y="24" width="28" height="8" rx="4"/><path d="M14 13 V21 M27 13 V21 M20 24 V32"/></svg>',

  /* ==========================================================================
     2. MENSCHEN — die Rollenbilder
     Sie ersetzen ✦ und ➤. Entscheidung: EIN Bild je Mensch, in jeder Grösse
     dasselbe — darum auf vier Striche gezeichnet, damit es im Hex-Slot
     (~16 px) noch trägt. Herkunft: die Pfad-Signets aus `auftakt-v1`, auf
     den Hausstil normalisiert (dort viewBox 32 und stroke 1.7).
     ========================================================================== */
  /* Der Speer, nicht der Bogen: der Bogen ist Ausrüstung (eigene Karte), der
     Speer ist die Rolle. Zwei Striche — Schaft und Blatt. */
  jaeger: svg('<path d="M8 34 L23 17"/><path d="M19 10 L32 6 L28 19 Z"/>', { join:'round' }),
  /* Der Korb, nicht der Zweig: ein Zweig mit Beeren wäre von `beere` und
     `hasel` (beide Flora, beide Kreise am Stiel) nicht zu unterscheiden — die
     Rolle braucht ihr eigenes Ding. Der Korb ist ihr Gerät, und drei Striche
     tragen bis 12 px. */
  sammlerin: svg('<path d="M7 16 H33 L29 33 H11 Z"/><path d="M13 16 Q13 8 20 8 Q27 8 27 16"/><path d="M8 23 H32"/>', { join:'round' }),
  /* Generische Menschmarke (war ☖ im Gewässer-Labor): wo nicht die Rolle
     gemeint ist, sondern „hier steht jemand". */
  mensch: svg('<circle cx="20" cy="11" r="5"/><path d="M20 16 V27"/><path d="M11 34 L20 27 L29 34"/><path d="M12 20 H28"/>'),

  /* ==========================================================================
     3. VORKOMMEN — was das Land birgt (waren ▲ ● ◇)
     Sie sitzen in der `.wange` des Hexfeldes, also klein. Alle drei sind
     bewusst KEINE Werkzeuge: das Werkzeug daraus ist `flint`.
     ========================================================================== */
  /* Silexader: die Knolle im Gestein — der Ort, nicht die Klinge.
     Erste Fassung war ein Dreieck über zwei durchgehenden Bändern und las sich
     bei 16 px wie `terrasse` (gestapelte Striche). Jetzt trägt die Knolle die
     Silhouette und die Bänder sind nur Stummel links und rechts. */
  silex: svg('<path d="M14 11 L26 13 L29 25 L18 31 L10 22 Z"/><path d="M3 16 H10 M29 21 H37"/>', { join:'round' }),
  /* Ockergrube: der Napf, in dem das Pigment angerieben wird. Die Fläche ist
     der Ocker selbst — der Punkt, um den es geht.
     Flacher Bogen las sich wie der Rumpf des `einbaum`; jetzt ein geschlossenes,
     tiefes Gefäss. */
  ocker: svg('<path d="M8 18 Q8 32 20 32 Q32 32 32 18 Z"/><path d="M4 18 H36"/><circle cx="20" cy="10" r="4.5" fill="currentColor" stroke="none"/>', { join:'round' }),
  /* Bergkristall: Prisma mit Facetten. Als einziges Vorkommen kantig — er ist
     das einzige, das man ansieht statt benutzt. */
  quarz: svg('<path d="M20 5 L28 12 V27 L20 35 L12 27 V12 Z"/><path d="M12 12 L20 18 L28 12 M20 18 V35"/>', { join:'round' }),

  /* ==========================================================================
     4. GEWÄSSER-MERKMALE (waren ▨ ≋ ⇊ ⋔ ╤ ┈ ▬ ○)
     Orte, an denen ein Lauf sich anders verhält als seine Klasse. Alle acht
     lesen sich gegen dieselbe waagrechte Wasserachse, damit sie als Reihe
     erkennbar sind — und paarweise unterscheidbar: die Brücke hat einen
     Bogen und keine Pfosten, der Steg Pfosten und keinen Bogen.
     ========================================================================== */
  /* Furt: Trittmarken quer über den Lauf — flach genug zum Hinübergehen. */
  furt: svg('<path d="M5 20 H35"/><path d="M12 12 V28 M20 12 V28 M28 12 V28"/>'),
  /* Stromschnelle: zwei Reihen Sparren — schnell, laut, gefährlich. */
  stromschnelle: svg('<path d="M6 15 L13 22 L20 15 L27 22 L34 15"/><path d="M6 26 L13 33 L20 26 L27 33 L34 26"/>'),
  /* Wasserfall: Stufe oben, Fall darunter, aufspritzendes Becken.
     Wasserfall · Steg · Vorrat waren alle drei „Strich waagrecht plus drei
     senkrecht" und damit klein nicht auseinanderzuhalten. Getrennt über je ein
     eigenes Kennzeichen: der Fall endet in einer GEWELLTEN Wasserlinie, der
     Steg trägt eine DOPPELTE Bohlenlinie, der Vorrat ist ein gebundenes Bündel. */
  wasserfall: svg('<path d="M4 9 H19 V15"/><path d="M12 19 V30 M19 19 V32 M26 20 V29"/><path d="M6 36 Q13 32 20 36 Q27 40 34 36"/>'),
  /* Klamm: die Wände sperren, nicht das Wasser. Der Faden in der Mitte hing
     frei und las sich wie `rute`; jetzt spannt das Wasser zwischen den Flanken. */
  klamm: svg('<path d="M9 4 L17 24 V35"/><path d="M31 4 L23 24 V35"/><path d="M16 31 Q20 34 24 31"/>'),
  /* Brücke: Bogen über dem Wasser, gebaut — hebt jede Sperre auf. */
  bruecke: svg('<path d="M4 19 H36"/><path d="M11 19 Q20 31 29 19"/><path d="M6 35 H34"/>'),
  /* Steg: doppelte Bohlenlinie auf Pfosten im Wasser. Nur bis zum kleinen Fluss. */
  steg: svg('<path d="M4 14 H36 M4 19 H36"/><path d="M11 19 V29 M20 19 V31 M29 19 V29"/><path d="M5 35 Q12 32 20 35 Q28 38 35 35"/>'),
  /* Damm: die Sperre, hinter der sich das Wasser staut. */
  damm: svg('<path d="M16 4 V36 M25 4 V36"/><path d="M4 14 H16 M4 22 H16 M4 30 H16"/>'),
  /* Weiher/Stillwasser (war ○): Fläche mit einer Kräuselung — es fliesst nicht. */
  weiher: svg('<ellipse cx="20" cy="22" rx="15" ry="10"/><path d="M12 22 Q20 27 28 22"/>'),

  /* ==========================================================================
     5. FLORA — das Revier der Sammlerin (aus dem Bestand)
     ========================================================================== */
  hasel:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="20" cy="25" r="8"/><path d="M13 20 Q20 14 27 20"/><path d="M20 14 Q24 6 32 7 Q30 14 22 15"/></svg>',
  beere:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="14" cy="26" r="5.5"/><circle cx="26" cy="26" r="5.5"/><circle cx="20" cy="17" r="5.5"/><path d="M20 11 Q21 6 26 5"/></svg>',
  rohr:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 36 V14"/><rect x="17" y="6" width="6" height="12" rx="3" fill="currentColor" stroke="none"/><path d="M14 36 Q13 24 8 18 M26 36 Q28 26 33 21"/></svg>',
  birke:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M17 36 Q17 20 15 6 M23 36 Q23 22 26 8"/><path d="M15 12 H20 M22 18 H27 M14 24 H19 M22 29 H27"/></svg>',
  ulme:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M10 34 Q4 20 12 8"/><path d="M11 32 L28 10"/><path d="M28 14 L28 10 L24 10"/></svg>',

  /* ==========================================================================
     6. FAUNA — das Revier des Jägers (aus dem Bestand)
     ========================================================================== */
  hirsch:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M14 34 V24 Q14 18 20 18 Q26 18 26 24 V34"/><path d="M16 18 L11 9 M11 9 L6 11 M11 9 L12 4 M24 18 L29 9 M29 9 L34 11 M29 9 L28 4"/></svg>',
  schwein:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 24 Q8 15 18 15 H27 Q34 15 34 22 Q34 27 28 27 H13 Q8 27 8 24 Z"/><path d="M34 20 L38 18 M13 27 V32 M27 27 V32"/><path d="M18 15 L15 10"/></svg>',
  steinbock:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M14 34 V25 Q14 19 20 19 Q26 19 26 25 V34"/><path d="M23 19 Q34 14 33 3 M23 19 Q30 15 30 7"/><path d="M17 19 L15 14"/></svg>',
  biber:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 22 Q8 13 17 13 Q26 13 26 22 Q26 29 17 29 Q8 29 8 22 Z"/><path d="M26 22 Q37 20 37 26 Q37 31 26 27"/><circle cx="13" cy="19" r="1.3" fill="currentColor"/></svg>',
  ente:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 26 Q10 32 20 32 Q30 32 32 25 Q26 27 22 24 Q26 22 26 17 Q26 12 21 12 Q16 12 16 17 Q16 22 12 25 Z"/><path d="M21 12 L26 14"/><path d="M4 30 Q10 34 20 34"/></svg>',
  wolf:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 28 L14 20 L18 22 L26 14 L30 8 L32 14 L28 20 L30 28 M14 20 L12 28 M22 18 L23 28"/></svg>',
  hund:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 30 L10 20 L18 20 L26 14 L28 8 L31 14 L28 20 L29 30 M13 20 L12 30 M22 18 L23 30"/><path d="M28 8 L25 6"/></svg>',

  /* ==========================================================================
     7. AUSRÜSTUNG UND VERWANDLUNG (≡ und 𝆲 waren hier Schriftzeichen —
     𝆲 liegt ausserhalb der Basic Multilingual Plane und fiel auf jedem
     zweiten Gerät auf ein Ersatzkästchen zurück. Genau der Fall, den die
     Regel abstellt.)
     ========================================================================== */
  einbaum:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 22 Q20 28 36 22 Q32 30 20 30 Q8 30 4 22 Z"/><path d="M24 8 L18 24"/><path d="M4 34 Q13 31 20 34 Q27 37 36 34"/></svg>',
  bogen:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 4 Q30 20 12 36"/><path d="M12 4 L12 36"/><path d="M12 20 H34 M34 20 L29 17 M34 20 L29 23"/></svg>',
  rute:'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 36 V18 M20 18 Q12 12 10 4 M20 18 Q28 12 30 4"/></svg>',
  /* Schuhwerk: die Schleife, die sich selbst antreibt. Profil plus Boden. */
  schuh: svg('<path d="M7 27 V16 Q7 13 10 13 H15 L19 19 H30 Q34 19 34 24 V27 Z"/><path d="M6 32 H35"/>', { join:'round' }),
  /* Trockenfleisch: das gebundene Bündel, das eine Hungernacht fängt.
     Als Streifen am Gestell war es von `steg` und `wasserfall` nicht zu
     unterscheiden — die Schnur macht daraus ein Ding, das man weglegt. */
  vorrat: svg('<path d="M7 15 H33 V31 H7 Z"/><path d="M20 15 V31"/><path d="M13 11 Q20 6 27 11"/>', { join:'round' }),

  /* ==========================================================================
     8. MARKEN UND ZUSTÄNDE
     Die abstraktesten Zeichen — und die, die als Glyph am meisten gelitten
     haben (◈ ◆ ⬡ ⚓ ❄ ✶ ♨ ◌ ☀ ☾).
     ========================================================================== */
  /* Spur (war ◈): eine Scherbe, die aus dem Boden schaut. NICHT ein Tierabdruck
     — die Spur zeigt eine Fundstelle, nicht Wild; ein Huf hätte in die falsche
     Richtung gelesen. */
  spur: svg('<path d="M4 28 H36"/><path d="M14 28 L17 14 L26 17 L24 28"/>', { join:'round' }),
  /* Belegtes Ereignis (war ◆): Raute mit gefülltem Kern — es geschieht, ob man
     bereit ist oder nicht. Die Form bleibt die vertraute, jetzt gezeichnet. */
  beleg: svg('<path d="M20 4 L34 20 L20 36 L6 20 Z"/><path d="M20 13 L27 20 L20 27 L13 20 Z" fill="currentColor" stroke="none"/>', { join:'round' }),
  /* Hexfeld (war ⬡): spitz oben, wie das Spielfeld — der Ausgangsknopf. */
  hexfeld: svg('<path d="M20 3 L34 11 V29 L20 37 L6 29 V11 Z"/>', { join:'round' }),
  /* Anker-Ereignis (war ⚓). */
  anker: svg('<path d="M20 11 V33"/><circle cx="20" cy="7" r="3.4"/><path d="M12 17 H28"/><path d="M8 24 Q8 33 20 33 Q32 33 32 24"/>'),
  /* Frost (war ❄). */
  frost: svg('<path d="M20 4 V36 M6 12 L34 28 M34 12 L6 28"/><path d="M20 11 L16 7 M20 11 L24 7 M20 29 L16 33 M20 29 L24 33"/>'),
  /* Stille (war ✶): der klare Nachthimmel, in den die Ältesten lesen.
     Erste Fassung war nur aus dünnen Strichen und verschwand bei 16 px — die
     zwei gefüllten Sterne tragen jetzt die Marke, egal wie klein. */
  stille: svg('<path d="M17 5 V21 M9 13 H25"/><circle cx="30" cy="23" r="2.4" fill="currentColor" stroke="none"/><circle cx="11" cy="30" r="2.8" fill="currentColor" stroke="none"/>'),
  /* Fremde am Feuer (war ♨): die Flamme und zwei, die daran sitzen. Erscheint
     nur in Kartengrösse (76 px) — im Slot wäre sie zu dicht. */
  fremde: svg('<path d="M20 30 Q13 25 16 16 Q18 20 21 18 Q19 12 25 8 Q23 17 28 21 Q29 27 20 30 Z"/><circle cx="8" cy="27" r="3.2"/><circle cx="32" cy="27" r="3.2"/>'),
  /* Ein Fund im Kies (war ◌): die Perle, die von weit her kam, unter Kieseln.
     Die Fläche ist der Fund — der Punkt, um den es geht. */
  fundkies: svg('<circle cx="20" cy="13" r="5" fill="currentColor" stroke="none"/><circle cx="10" cy="27" r="4"/><circle cx="21" cy="29" r="3.4"/><circle cx="31" cy="25" r="3.2"/>'),
  /* ==========================================================================
     9. DIE VIER RESSOURCEN
     Nahrung · Schutz · Material · Kultur — der Kennzahlenkopf jedes
     Prototyps. Herkunft `erkundung-v4`, dort im 24er-Feld gezeichnet; über
     svg24 ins Hausfeld geholt, damit die Zeichnung dieselbe bleibt und der
     Stil trotzdem einer ist.
     ========================================================================== */
  nahrung: svg24('<path d="M5 19 Q11 13 18 5"/><path d="M12.5 11.5 15 14"/><circle cx="8.5" cy="13.5" r="2.1"/><circle cx="16" cy="15" r="2.1"/><circle cx="13" cy="7" r="2.1"/>'),
  schutz: svg24('<path d="M4 20V8l2.5-3L9 8v12M9 20V10l3-3 3 3v10M15 20V8l2.5-3L20 8v12"/><path d="M3 20h18"/>', { join:'round' }),
  /* Gesundheit der Person (erkundung-v6, Personen-Wertekarte). */
  herz: svg24('<path d="M12 19.6C7.2 15.5 4.2 12.3 4.2 9.1a3.9 3.9 0 0 1 7.8-.9A3.9 3.9 0 0 1 19.8 9.1c0 3.2-3 6.4-7.8 10.5Z"/>', { join:'round' }),
  material: svg24('<path d="M4 18 20 7M4 13.5 20 11.5M4 7l16 11"/><path d="M10.5 9.5c-1 2.4-1 3.6 0 6M13.5 8.5c1 2.4 1 3.6 0 6"/>'),
  kultur: svg24('<path d="M12 12.2a1.6 1.6 0 0 0 3.2 0 3.4 3.4 0 0 0-6.8 0 5.4 5.4 0 0 0 10.8 0 7.6 7.6 0 0 0-15.2 0 9.8 9.8 0 0 0 12.4 9.4"/>'),

  /* ==========================================================================
     10. WERKZEUGE — die Editor-Leisten der Prüfstände
     Hier standen bisher **Emoji** (🔍 ⛰) neben Symbolzeichen (∿ ⌫ ▨ ○ ☖).
     Emoji sind der schlimmste Fall der Regel: sie kommen farbig aus einer
     Systemschrift, nehmen `currentColor` nicht an und sehen auf jedem
     Betriebssystem anders aus — im Werkbank-Register leuchteten sie bunt
     aus einer sonst kühlen Leiste heraus.
     ========================================================================== */
  lupe: svg('<circle cx="17" cy="17" r="10"/><path d="M24.5 24.5 L34 34"/>'),
  /* Lauf: zwei Ufer, ein Bett — der Zeichenstift für ein Fliessgewässer.
     Bewusst geschwungen statt gezackt, damit es nicht `stromschnelle` wird. */
  lauf: svg('<path d="M4 23 Q12 11 20 17 Q28 23 36 11"/><path d="M4 32 Q12 20 20 26 Q28 32 36 20"/>'),
  stempel: svg('<path d="M13 5 H27 L25 18 H15 Z"/><path d="M8 22 H32 V28 H8 Z"/><path d="M5 34 H35"/>', { join:'round' }),
  berg: svg('<path d="M3 32 L14 11 L22 25 L27 18 L37 32 Z"/>', { join:'round' }),
  loeschen: svg('<path d="M15 31 L6 22 L22 6 L33 17 Z"/><path d="M6 35 H34"/>', { join:'round' }),

  /* ==========================================================================
     11. DIE VIER TAGESZEITEN
     Sie standen in `erkundung-v4` schon als SVG — aber in einem zweiten
     Hausstil (viewBox 24, stroke 1.9). Genau die Sorte Bruch, die man erst
     bemerkt, wenn zwei Zeichen nebeneinander liegen: hier auf 40/2.4
     nachgezogen. `sonne` und `mond` sind gleichzeitig Mittag und Nacht und
     die Registerumschaltung — ein Ding, ein Zeichen.
     ========================================================================== */
  morgen: svg('<path d="M4 30 H36"/><path d="M12 30 A8 8 0 0 1 28 30"/><path d="M20 18 V5 M14 11 L20 5 L26 11"/>'),
  abend:  svg('<path d="M4 30 H36"/><path d="M12 30 A8 8 0 0 1 28 30"/><path d="M20 5 V18 M14 12 L20 18 L26 12"/>'),
  /* Tag und Nacht (waren ☀ und ☾) — Mittag, Nacht und die Registerumschaltung. */
  sonne: svg('<circle cx="20" cy="20" r="7"/><path d="M20 3 V8 M20 32 V37 M3 20 H8 M32 20 H37 M8 8 L11.5 11.5 M28.5 28.5 L32 32 M32 8 L28.5 11.5 M11.5 28.5 L8 32"/>'),
  mond: svg('<path d="M26 5 A15 15 0 1 0 26 35 A12 12 0 1 1 26 5 Z"/>', { join:'round' }),

  /* Kartenkopf — die Art einer Spielkarte (Kopfband). spielen: der Anstoss.
     herstellen: das Zahnrad, die gefuellte Nabe unterscheidet es bei 9 px
     von der Sonne daneben. runde: der Rundlauf einer Rundenbedingung. */
  spielen: svg('<path d="M14 8 L31 20 L14 32 Z"/>', { join:'round' }),
  herstellen: svg('<circle cx="20" cy="20" r="8.5"/><circle cx="20" cy="20" r="2.4" fill="currentColor" stroke="none"/><path d="M20 6 V11.5 M20 28.5 V34 M6 20 H11.5 M28.5 20 H34"/>'),
  runde: svg('<path d="M33 20 a13 13 0 1 1 -4.2 -9.6"/><path d="M28.8 10.4 L35.5 9.2 M28.8 10.4 L30.5 4"/>')
  };

  /* Zweitnamen. `ufer` stand in drei Dateien und war byte-gleich mit `lager` —
     dieselbe Zeichnung, zwei Namen (das Plättchen heisst inzwischen Uferlager).
     Aliasse statt Kopien, damit es nicht wieder auseinanderläuft. */
  var ALIAS = {
    ufer:'lager', uferlager:'lager', holzplatz:'holz', hoehlenlager:'hoehle',
    sammler:'sammlerin', wanderer:'mensch', schnell:'stromschnelle',
    fall:'wasserfall', still:'weiher', see:'weiher', silexader:'silex',
    bergkristall:'quarz', ockergrube:'ocker', werkzeug:'flint',
    wildschwein:'schwein', rothirsch:'hirsch', forelle:'fisch',
    stockente:'ente', wolfstier:'wolf', biberdamm:'damm'
  };

  /* Für den Musterbogen und die Prüfung: die Ordnung, in der die Zeichen
     gehören. Wer eine neue Zeichnung ablegt, trägt sie hier ein — sonst
     fehlt sie im Musterbogen und der nächste Prototyp erfährt nie davon. */
  var GRUPPEN = [
    ['Bauten & Plättchen', ['fisch','lager','wald','holz','terrasse','hoehle','flint','pfahl']],
    ['Menschen',           ['sammlerin','jaeger','mensch']],
    ['Vorkommen',          ['silex','ocker','quarz']],
    ['Gewässer-Merkmale',  ['furt','stromschnelle','wasserfall','klamm','bruecke','steg','damm','weiher']],
    ['Flora',              ['hasel','beere','rohr','birke','ulme']],
    ['Fauna',              ['hirsch','schwein','steinbock','biber','ente','wolf','hund']],
    ['Ausrüstung & Verwandlung', ['einbaum','bogen','rute','schuh','vorrat']],
    ['Ressourcen',         ['nahrung','schutz','material','kultur']],
    ['Werkzeuge',          ['lupe','lauf','stempel','berg','loeschen']],
    ['Tageszeiten',        ['morgen','sonne','abend','mond']],
    ['Kartenkopf',         ['spielen','herstellen','runde']],
    ['Marken & Zustände',  ['spur','beleg','hexfeld','anker','frost','stille','fremde','fundkies']]
  ];

  /* --------------------------------------------------------------------------
     icon(name) → SVG-Zeichenkette.

     Ein unbekannter Name gibt eine sichtbare Fehlmarke zurück und meldet sich
     auf der Konsole — nicht ''. Ein leerer String verschwindet lautlos im
     Layout, und dann sucht man den Tippfehler bei der Bildbeschreibung.
     -------------------------------------------------------------------------- */
  function icon(name) {
    if (!name) return '';
    var k = ALIAS[name] || name;
    if (ICONS[k]) return ICONS[k];
    if (typeof console !== 'undefined' && console.warn)
      console.warn('[sot-icons] kein Zeichen für "' + name + '" — ' +
        'vorhanden: ' + Object.keys(ICONS).sort().join(', '));
    return svg('<path d="M20 4 L34 20 L20 36 L6 20 Z"/><path d="M20 13 V23 M20 27 V29"/>');
  }
  /* iconEl(name, 'tglyph') → <div class="tglyph"><svg …>. Der Behälter trägt
     die Grösse, das SVG füllt ihn (width/height 100 % kommt aus sot.css). */
  function iconEl(name, cls) {
    return el('div' + (cls ? '.' + String(cls).split(/\s+/).join('.') : ''), { html: icon(name) });
  }
  function hasIcon(name) { return !!ICONS[ALIAS[name] || name]; }

  /* --------------------------------------------------------------------------
     iconSVG(name, x, y, size) — dasselbe Zeichen INNERHALB einer SVG-Karte,
     zentriert auf (x,y) in Weltkoordinaten.

     Für Karten, die als ein grosses SVG gezeichnet werden (`gewaesser-labor`,
     und alles jenseits von ~2000 Feldern, wo das CSS-Hexraster zu langsam
     wird). Ein verschachteltes <svg> ist gültiges SVG und behält seinen
     eigenen viewBox — dadurch bleibt die Zeichnung dieselbe Datei wie im
     HTML-Fall, statt ein zweites Mal als <path> abgeschrieben zu werden.
     `currentColor` wirkt weiter, die Farbe kommt also vom Elternknoten.
     -------------------------------------------------------------------------- */
  function iconSVG(name, x, y, size) {
    var s = icon(name), h = size / 2;
    /* Den Kopf durch einen mit Position und Grösse ersetzen. */
    return s.replace('<svg viewBox="0 0 40 40"',
      '<svg x="' + (x - h) + '" y="' + (y - h) + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 40 40" overflow="visible"');
  }

  SOT.icon = icon;
  SOT.iconEl = iconEl;
  SOT.iconSVG = iconSVG;
  SOT.hasIcon = hasIcon;
  SOT.icons = ICONS;
  SOT.iconAlias = ALIAS;
  SOT.iconGruppen = GRUPPEN;
})();
