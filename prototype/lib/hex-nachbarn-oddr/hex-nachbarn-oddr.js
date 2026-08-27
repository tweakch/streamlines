/* hex-nachbarn-oddr — Nachbarschaft im odd-r-Offsetraster (spitz-oben).
   Ungerade Zeilen sind eine halbe Feldbreite nach rechts versetzt, darum
   unterscheiden sich die Spaltenversätze je Zeilenparität.

   Herkunft: dieselbe Tabelle steht in 14 Dateien plus der App, u. a.
   drafts/stromlinien-epoche1.html:390, drafts/eiszeit-labor-v3.html:577,
   drafts/kartenwachstum-v1.html:175, app/src/stromlinien/grid.ts:8.
   Fassungsvergleich und der Ordnungskonflikt mit dem Baukasten:
   siehe hex-nachbarn-oddr.md */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.SOTLIB = root.SOTLIB || {}).hexNachbarnOddr = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Reihenfolge und Tupelform der Prototypen UND der App: [dr, dc],
     W · E · NW · NE · SW · SE. Der Baukasten (SOT.hex) benutzt eine andere
     Konvention — [dc, dr] in der Reihenfolge E · SE · SW · W · NW · NE.
     Beide beschreiben dieselben sechs Nachbarn; nur der Index unterscheidet
     sich. Wer positionsweise indiziert, darf sie nicht vermischen. */
  var DIRS = ['W', 'E', 'NW', 'NE', 'SW', 'SE'];

  var DIRS_EVEN = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
  var DIRS_ODD = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]];

  /* Zeilenparität als 0|1.
     Die drei Schreibweisen im Bestand (r % 2, r & 1, ((r % 2) + 2) % 2) sind
     als Bedingung eines Ternärs gleichwertig, auch für negative Zeilen —
     -1 % 2 ist -1 und damit wahr. Sie sind es NICHT, sobald der Wert gerechnet
     wird: c + 0.5 * (r % 2) versetzt Zeile -1 nach links statt nach rechts.
     Darum hier die tragfähige Form. */
  function par(r) { return ((r % 2) + 2) % 2; }

  function dirsOf(r) { return par(r) ? DIRS_ODD : DIRS_EVEN; }

  /* Alle sechs Nachbarn, ungefiltert (auch ausserhalb der Karte). */
  function neighbors(c, r) {
    return dirsOf(r).map(function (d, i) {
      return { c: c + d[1], r: r + d[0], dir: DIRS[i] };
    });
  }

  /* Nur Nachbarn innerhalb cols × rows. */
  function neighborsIn(c, r, cols, rows) {
    return neighbors(c, r).filter(function (n) {
      return n.c >= 0 && n.r >= 0 && n.c < cols && n.r < rows;
    });
  }

  /* Halber Zeilenversatz in Feldbreiten — der arithmetische Fall, in dem
     die Parität-Schreibweise wirklich zählt. */
  function rowShift(r) { return 0.5 * par(r); }

  return {
    DIRS: DIRS,
    DIRS_EVEN: DIRS_EVEN,
    DIRS_ODD: DIRS_ODD,
    par: par,
    dirsOf: dirsOf,
    neighbors: neighbors,
    neighborsIn: neighborsIn,
    rowShift: rowShift
  };
});
