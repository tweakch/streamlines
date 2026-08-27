/* fluss-breite — vom Abfluss zur Breite: echte Metern, gezeichnetes Band,
   Gewässerklasse und die Zahl der Felder, die ein Lauf belegt.

   Herkunft (bandBreite byte-gleich bis auf var/let in vier Dateien):
     drafts/dynamic-rhein-tiles-with-seasons-v1.html:1227 (+ 1344, 1372, 1447)
     drafts/gewaesser-labor-v3.html:127 (+ 103)
     drafts/gewaesser-labor-v2.html:137 (+ 102)
     drafts/erkundung-v6.html:1461 (+ 764)
   Zwei Abweichungen und die neue, rasterabhängige Belegung: fluss-breite.md */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.SOTLIB = root.SOTLIB || {}).flussBreite = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BFAK = 6;        /* hydraulische Geometrie b = 6·√Q, im Bestand überall 6 */
  var HXW = 100;       /* Feldbreite der Prototyp-Renderer in lokalen Einheiten */

  /* ---------------------------------------------------------- unverändert ---
     Alles ab hier ist wörtlich der Bestand. Der Test nagelt es fest, damit
     ein späterer Umbau zeigen kann, dass sich nichts geändert hat. */

  /* Breite des Gerinnes in Metern. Kalibriert (gewaesser-labor): Alpenrhein
     MQ 90 m³/s → 57 m, Rhein bei Basel 1050 → 194 m. */
  function breiteM(q, bfak) { return (bfak || BFAK) * Math.sqrt(q); }

  /* Gezeichnete Bandbreite als Bruchteil einer Feldbreite. Bewusst NICHT
     massstabstreu: eine Karte übertreibt schmale Gewässer, damit man sie
     sieht. Die Kurve ist stückweise, oberhalb 10 m logarithmisch, und bei
     0.34 Feldbreiten gedeckelt. */
  function bandBreite(b, hexW) {
    var f;
    if (b < 0.5) f = .028;
    else if (b < 5) f = .028 + (b - 0.5) / 4.5 * .042;
    else if (b < 10) f = .070 + (b - 5) / 5 * .035;
    else if (b < 100) f = .105 + Math.log10(b / 10) * .100;
    else f = Math.min(.34, .205 + Math.log10(b / 100) * .10);
    return f * (hexW === undefined ? HXW : hexW);
  }

  /* Gewässerklasse auf der grossen Karte — Grenzen sind ABFLUSS, nicht
     Breite (seasons-Fassung). Die Labor-Fassung schneidet nach Breite und
     ist damit eine andere Einteilung, siehe klasseNachBreite. */
  var KLASSEN = ['rinnsal', 'bach', 'kfluss', 'gfluss'];
  var KLASSEN_NAMEN = ['Rinnsal', 'Bach', 'kleiner Fluss', 'grosser Fluss'];
  function rang(q) { return q < 2 ? 0 : q < 10 ? 1 : q < 60 ? 2 : 3; }
  function klasse(q) { return KLASSEN[rang(q)]; }
  function klasseName(q) { return KLASSEN_NAMEN[rang(q)]; }

  /* Die verworfene Labor-Einteilung: nach Breite statt Abfluss, und nur drei
     Stufen. Bleibt hier, weil vier Fundorte sie noch fahren. */
  function klasseNachBreite(b) { return b < 5 ? 'bach' : b < 10 ? 'kfluss' : 'gfluss'; }

  /* Wie viele Felder ein Lauf belegt — heutiger Stand: eine Stufenfunktion
     über den Rang, Radius 0/1/2, also Durchmesser 1, 3 oder 5 Felder.
     Hängt NICHT von der Feldgrösse ab; genau das ist der offene Punkt. */
  function radius(q) { var g = rang(q); return g >= 3 ? 2 : g >= 2 ? 1 : 0; }
  function durchmesser(q) { return 2 * radius(q) + 1; }

  /* ------------------------------------------------------------------ neu ---
     Nicht im Bestand. Ein Vorschlag, kein Fundort — siehe .md. */

  /* Breite des Flussraums (Talaue, nicht des Wassers) in Kilometern.
     Stetig über log10(Q), und so geeicht, dass sie bei 2 km/Feld — dem
     Raster der Klima-Ebene — dieselbe Belegung ergibt wie radius() heute:
     der Sprung auf 3 Felder liegt bei 4 km (Q = 10), der auf 5 bei 8 km
     (Q = 60). Die Konstanten sind daraus GERECHNET, nicht gerundet, sonst
     verfehlt Q = 60 die Schwelle um 3·10⁻⁴. */
  var KOR_B = 4 / Math.log10(6);
  var KOR_A = 4 - KOR_B;
  function korridorKm(q) {
    if (!(q > 0)) return 0;
    return Math.max(0, KOR_A + KOR_B * Math.log10(q));
  }

  /* Belegungsradius aus Abfluss UND Feldgrösse. Bei hexKm = 2 deckungsgleich
     mit radius(); auf feineren Rastern wächst die Belegung, wie sie muss —
     ein Korridor von 14 km ist bei 0.4 km/Feld nun einmal 35 Felder breit.
     maxR deckelt, wenn ein Renderer nicht beliebig viele Felder stempeln
     will (der Bestand deckelt faktisch bei 2). */
  function radiusBeiRaster(q, hexKm, maxR) {
    if (!(hexKm > 0)) return 0;
    var r = Math.max(0, Math.round(korridorKm(q) / hexKm / 2 - 0.5));
    return maxR === undefined ? r : Math.min(maxR, r);
  }

  /* ------------------------------------------------- Gefälle und sein Gang ---
     Auch neu. Die Breite hängt bisher allein am Abfluss — zwei Läufe mit
     gleichem Q sind gleich breit, ob sie durch eine Klamm stürzen oder durchs
     Mittelland mäandern. Das Gelände sagt aber mehr, und zwar über das
     Gefälle J UND über dessen GANG entlang des Laufs:

       wird flacher (dJ < 0)  Geschiebe fällt aus, das Bett verwildert  → breiter
       ist flach   (J klein)  der Lauf mäandert                         → gewunden
       wird steiler (dJ > 0)  der Lauf klemmt sich ein                  → schmaler

     Die Schwellen sind NICHT erfunden: sie stehen so in gewaesser-labor-v1
     (Zeile 312-315) und sind dort an der Karte geeicht.

     J ist dimensionslos (0.012 = 12 m/km), wie im Bestand. */
  var J_VERZWEIGT = 0.012;   /* darunter verzweigt sich ein breiter Lauf */
  var J_SCHNELL = 0.055;     /* Stromschnelle */
  var J_FALL = 0.120;        /* Wasserfall */
  var BRAID_FAKTOR = 3.0;    /* um wieviel breiter die Furkation ist */

  function klemme(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  /* Steiler heisst schmaler und tiefer — bei gleichem Abfluss. Unterhalb der
     Verzweigungsschwelle ist der Lauf frei und der Faktor 1; darüber
     schnürt er sich logarithmisch ein, gedeckelt bei 0.45. Am Wasserfall
     (10× die Schwelle) bleiben rund 56 % der Talbreite. */
  function hangFaktor(j) {
    if (!(j > J_VERZWEIGT)) return 1;
    return klemme(Math.pow(J_VERZWEIGT / j, 0.25), 0.45, 1);
  }

  /* Der Gang des Gefälles. Bezugsgrösse ist das örtliche Gefälle selbst,
     sonst hinge das Ergebnis an der Feldgrösse: rel > 0 heisst „wird
     flacher". Gedeckelt bei 1.6 (Schwemmfächer) und 0.7 (Klammeingang). */
  function gangFaktor(jVor, j, jNach) {
    if (jVor === undefined || jNach === undefined) return 1;
    var bezug = Math.max(j, J_VERZWEIGT);
    var rel = (jVor - jNach) / (2 * bezug);
    return klemme(1 + 0.5 * rel, 0.7, 1.6);
  }

  /* Windungsgrad: Lauflänge geteilt durch Luftlinie. Steil läuft gerade,
     flach mäandert. Erst unterhalb der Verzweigungsschwelle, dann je
     Zehnerpotenz +0.8, gedeckelt bei 2.6 (mehr schafft kein realer Fluss
     auf Dauer, ohne sich abzuschnüren). */
  function sinuositaet(j) {
    if (!(j > 0)) return 2.6;
    if (j >= J_VERZWEIGT) return 1;
    return klemme(1 + 0.8 * Math.log10(J_VERZWEIGT / j), 1, 2.6);
  }

  /* Verzweigt sich der Lauf? Wörtlich die Bedingung aus
     gewaesser-labor-v1.html:570 — flach genug und in der mittleren
     Grössenklasse. Ein Rinnsal verwildert nicht, ein Strom auch nicht. */
  function verzweigt(q, j) {
    var b = breiteM(q);
    return j < J_VERZWEIGT && b >= 8 && b < 60;
  }

  /* Die Breite mit Gelände. Ohne Profil (oder bei J = J_VERZWEIGT und
     gleichbleibendem Gefälle) exakt breiteM(q) — der Bestand bleibt der
     Bezugspunkt, das Gelände moduliert ihn nur.
     `verzweigung: true` legt den 3-fachen Furkationsfaktor drauf; das ist
     die Breite des GÜRTELS, nicht die einer Rinne. */
  function breiteMitGefaelle(q, profil, opt) {
    var b = breiteM(q, opt && opt.bfak);
    if (!profil) return b;
    var j = profil.j;
    if (!(j >= 0)) return b;
    b *= hangFaktor(j) * gangFaktor(profil.jVor, j, profil.jNach);
    if (opt && opt.verzweigung && verzweigt(q, j)) b *= BRAID_FAKTOR;
    return b;
  }

  /* ------------------------------- Rückfluss aus fluss-gefaelle-labor-v2 ---
     Der Korridor je Klasse: die blaue Fläche des Labors ist nicht «das
     Wasser», sondern der Raum, in dem Wasser fliessen KANN — der eigentliche
     Lauf wird später darübergelegt. Entwicklerentscheid im Labor:
       Rinnsal 1 · Bach 2 · kleiner Fluss 3 · grosser Fluss 4 · Strom 5.
     Die Grenzen 2/10/60 sind die der Karte (rang oben); die 85 ist NEU und
     gehört dem Strom — am Ende des Laufs steht das Meer, kurz davor wird der
     grosse Fluss zum Strom. Sie ist gewählt, nicht gemessen: so, dass das
     Vorgabeprofil des Labors (Q ≈ 91 an der Mündung) ihn auf den letzten
     10 km erreicht. Herkunft: fluss-gefaelle-labor-v2.html:247. */
  var Q_STROM = 85;
  var KLASSEN_STROM = [
    { bis: 2,        key: 'rinnsal', name: 'Rinnsal',       felder: 1 },
    { bis: 10,       key: 'bach',    name: 'Bach',          felder: 2 },
    { bis: 60,       key: 'kfluss',  name: 'kleiner Fluss', felder: 3 },
    { bis: Q_STROM,  key: 'gfluss',  name: 'grosser Fluss', felder: 4 },
    { bis: Infinity, key: 'strom',   name: 'Strom',         felder: 5 }
  ];
  function klasseStrom(q) {
    for (var i = 0; i < KLASSEN_STROM.length; i++) if (q < KLASSEN_STROM[i].bis) return KLASSEN_STROM[i];
    return KLASSEN_STROM[KLASSEN_STROM.length - 1];
  }
  function korridorFelder(q) { return klasseStrom(q).felder; }

  /* Die Laufmitte rastet am Raster: ungerade Breiten mittig auf ein Feld,
     gerade auf die Feldgrenze. Der Befund dahinter (Labor v2, Schlusstext):
     wer eine gerade Breite mittig um ein Feld legt, liest immer eine ungerade
     Felderzahl — erst das Überspannen der Feldgrenze macht eine 2 KONSTANT
     statt zum Zufall des Mäanders. Herkunft: fluss-gefaelle-labor-v2.html:552. */
  function rasteMitte(mitte, felder) {
    return (felder % 2) ? Math.round(mitte) : Math.round(mitte - 0.5) + 0.5;
  }

  /* Wann zählt ein Feld als Wasser? d = Abstand der Feldmitte zur Laufmitte
     in Feldern, halb = halbe Laufbreite in Feldern. Die Überlappung des
     Feldes [d−0.5, d+0.5] mit dem Lauf [−halb, +halb]:
       stetig       die Teildeckung selbst (weiche Kante)
       mehrheit     ab 50 % ein ganzes Feld (Voreinstellung des Labors —
                    zeichnet Plättchen und trifft trotzdem gerade Breiten)
       symmetrisch  ganz, wenn die Feldmitte im Lauf liegt (alte Fassung:
                    um eine Feldmitte gelegt nur 1, 3, 5 — nie 2 oder 4)
     Herkunft: fluss-gefaelle-labor-v2.html:610. */
  function feldDeckung(d, halb, art) {
    var ueberlapp = klemme(halb - d + 0.5, 0, 1);
    if (art === 'stetig') return ueberlapp;
    if (art === 'symmetrisch') return d <= halb ? 1 : 0;
    return ueberlapp >= 0.5 ? 1 : 0;   /* mehrheit */
  }

  /* Wie breit sich eine Zeile LIEST: Felder mit Deckung ≥ 0.5, so zählt das
     Labor sein Histogramm (nBreit). */
  function gezaehlteFelder(mitte, halb, cols, art) {
    var n = 0;
    for (var c = 0; c < cols; c++) {
      if (feldDeckung(Math.abs(c - mitte), halb, art) >= 0.5) n++;
    }
    return n;
  }

  /* Wie ein Feld einzuordnen ist — für den Inspektor und die Merkmale. */
  function gefaelleLage(jVor, j, jNach) {
    var g = gangFaktor(jVor, j, jNach);
    return {
      steil: j >= J_FALL ? 'fall' : j >= J_SCHNELL ? 'schnell' : j < J_VERZWEIGT ? 'flach' : 'normal',
      gang: g > 1.05 ? 'wird flacher' : g < 0.95 ? 'wird steiler' : 'gleichbleibend',
      sinuositaet: sinuositaet(j)
    };
  }

  return {
    BFAK: BFAK, HXW: HXW, KLASSEN: KLASSEN,
    J_VERZWEIGT: J_VERZWEIGT, J_SCHNELL: J_SCHNELL, J_FALL: J_FALL,
    BRAID_FAKTOR: BRAID_FAKTOR,
    hangFaktor: hangFaktor, gangFaktor: gangFaktor,
    sinuositaet: sinuositaet, verzweigt: verzweigt,
    breiteMitGefaelle: breiteMitGefaelle, gefaelleLage: gefaelleLage,
    breiteM: breiteM, bandBreite: bandBreite,
    rang: rang, klasse: klasse, klasseName: klasseName,
    klasseNachBreite: klasseNachBreite,
    radius: radius, durchmesser: durchmesser,
    korridorKm: korridorKm, radiusBeiRaster: radiusBeiRaster,
    Q_STROM: Q_STROM, KLASSEN_STROM: KLASSEN_STROM,
    klasseStrom: klasseStrom, korridorFelder: korridorFelder,
    rasteMitte: rasteMitte, feldDeckung: feldDeckung, gezaehlteFelder: gezaehlteFelder
  };
});
