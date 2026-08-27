/* ============================================================================
   sot-hex.js — STROMLINIEN Prototyp-Baukasten · Hexgeometrie

   Spitz-oben-Sechsecke, odd-r-Offset (ungerade Zeilen nach rechts versetzt).
   Diese Tabelle MUSS mit app/src/stromlinien/grid.ts identisch bleiben —
   ein Prototyp, der anders nachbart, beweist nichts über das Spiel.

     script src        →  ../kit/sot.js
     script src        →  ../kit/sot-hex.js

   Hängt als SOT.hex an. Verlangt sot.js.
   ========================================================================= */
'use strict';
SOT.hex = (function () {
  var $ = SOT.$, el = SOT.el;

  /* --------------------------------------------------------------- Nachbarn ---
     odd-r: Zeilen mit ungeradem r sind eine halbe Feldbreite nach rechts
     versetzt, darum unterscheiden sich die Spaltenversätze je Zeilenparität.
     Reihenfolge überall gleich: E · SE · SW · W · NW · NE.
     -------------------------------------------------------------------------- */
  var DIRS = ['E', 'SE', 'SW', 'W', 'NW', 'NE'];
  var OFF = {
    even: [[+1, 0], [0, +1], [-1, +1], [-1, 0], [-1, -1], [0, -1]],
    odd:  [[+1, 0], [+1, +1], [0, +1], [-1, 0], [0, -1], [+1, -1]]
  };
  var OPPOSITE = { E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' };

  // neighbors(c,r) → [{c,r,dir}], ungefiltert (auch außerhalb der Karte).
  function neighbors(c, r) {
    var t = OFF[(r & 1) ? 'odd' : 'even'];
    return t.map(function (d, i) { return { c: c + d[0], r: r + d[1], dir: DIRS[i] }; });
  }
  // Nur Nachbarn innerhalb cols×rows.
  function neighborsIn(c, r, cols, rows) {
    return neighbors(c, r).filter(function (n) { return n.c >= 0 && n.r >= 0 && n.c < cols && n.r < rows; });
  }
  function neighbor(c, r, dir) {
    var i = DIRS.indexOf(dir);
    if (i < 0) return null;
    var d = OFF[(r & 1) ? 'odd' : 'even'][i];
    return { c: c + d[0], r: r + d[1] };
  }
  function opposite(dir) { return OPPOSITE[dir]; }

  /* --------------------------------------------------------- Kubisch & Distanz ---
     Ringe, Entfernungen und Interpolation gehen nur in Kubuskoordinaten
     zuverlässig — Offsetkoordinaten rechnen sich an der Zeilenparität tot.
     -------------------------------------------------------------------------- */
  function toCube(c, r) {
    var x = c - ((r - (r & 1)) / 2);
    var z = r;
    return { x: x, y: -x - z, z: z };
  }
  function fromCube(cu) {
    return { c: cu.x + ((cu.z - (cu.z & 1)) / 2), r: cu.z };
  }
  function dist(a, b) {
    var p = toCube(a.c, a.r), q = toCube(b.c, b.r);
    return Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y), Math.abs(p.z - q.z));
  }
  // Alle Felder mit genau Entfernung n (Ring) bzw. bis n (Scheibe).
  function ring(c, r, n) {
    if (n === 0) return [{ c: c, r: r }];
    var out = [], cur = { c: c, r: r }, i, k;
    for (i = 0; i < n; i++) cur = neighbor(cur.c, cur.r, 'SW');
    for (i = 0; i < 6; i++) {
      var dir = ['E', 'NE', 'NW', 'W', 'SW', 'SE'][i];
      for (k = 0; k < n; k++) { out.push({ c: cur.c, r: cur.r }); cur = neighbor(cur.c, cur.r, dir); }
    }
    return out;
  }
  function disc(c, r, n) {
    var out = [];
    for (var i = 0; i <= n; i++) out = out.concat(ring(c, r, i));
    return out;
  }

  /* ----------------------------------------------------------- Pixelrechnung ---
     Für SVG- und Canvas-Karten. w = Feldbreite (Ecke bis Ecke waagrecht),
     h = w * 2/√3. Mitte eines Feldes:
       x = (c + (r&1)*0.5) * (w+gap)
       y = r * (h*0.75 + gap)
     -------------------------------------------------------------------------- */
  var RATIO = 2 / Math.sqrt(3);          /* 1.1547 — h/w beim Spitz-oben-Hex */
  function height(w) { return w * RATIO; }
  function center(c, r, w, gap) {
    gap = gap || 0;
    var h = height(w);
    return { x: (c + (r & 1) * 0.5) * (w + gap) + w / 2, y: r * (h * 0.75 + gap) + h / 2 };
  }
  function gridSize(cols, rows, w, gap) {
    gap = gap || 0;
    var h = height(w);
    return { w: (cols + 0.5) * (w + gap), h: rows * (h * 0.75 + gap) + h * 0.25 };
  }
  // Polygonpunkte um (cx,cy) — direkt in <polygon points="…"> einsetzbar.
  function points(cx, cy, w) {
    var h = height(w), x = cx - w / 2, y = cy - h / 2;
    return [
      [x + w * 0.5, y], [x + w, y + h * 0.25], [x + w, y + h * 0.75],
      [x + w * 0.5, y + h], [x, y + h * 0.75], [x, y + h * 0.25]
    ].map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ');
  }
  // Kantenmitte in Prozent der Feldbox — Grundlage der .link-Positionen.
  var EDGE_MID = {
    W: [0, 50], E: [100, 50], NW: [25, 12.5], NE: [75, 12.5], SW: [25, 87.5], SE: [75, 87.5]
  };
  // Pixel → Feld (Klick auf eine SVG/Canvas-Karte). Rundet über Kubus.
  function at(px, py, w, gap) {
    gap = gap || 0;
    var h = height(w), rowH = h * 0.75 + gap;
    var r = Math.round((py - h / 2) / rowH);
    var c = Math.round((px - w / 2) / (w + gap) - (r & 1) * 0.5);
    // Nachbarschaft prüfen, weil die Zeilenschätzung an den Spitzen daneben liegt.
    var best = null, bd = Infinity;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var cc = c + dc, rr = r + dr, m = center(cc, rr, w, gap);
      var d = (m.x - px) * (m.x - px) + (m.y - py) * (m.y - py);
      if (d < bd) { bd = d; best = { c: cc, r: rr }; }
    }
    return best;
  }

  /* ----------------------------------------------------------------- Größe ---
     autosize(map, cols) setzt --hexw so, dass cols Spalten (plus der halbe
     Versatz der ungeraden Zeilen) in die Breite passen.

     Der Fehler, den das hier abstellt: clientWidth ist 0, solange ein
     Elternteil noch .hid trägt oder display:none ist. Die handgeschriebenen
     Fassungen prüften `if(!w) return` und ließen die Felder still auf der
     CSS-Vorgabe stehen. Ein ResizeObserver feuert stattdessen genau dann
     wieder, wenn der Behälter sichtbar wird.

     Setzt zusätzlich data-lod="s|m|l" (Schwellen aus feld-labor-v1:
     <52 / 52–75 / ≥76 px), damit sot-hex.css die Slots dünnen kann.
     -------------------------------------------------------------------------- */
  function autosize(map, cols, opts) {
    map = $(map);
    opts = opts || {};
    var min = opts.min || 18, max = opts.max || opts.maxHexw || 999;

    function apply() {
      var w = map.clientWidth;
      if (!w) return false;
      var cs = getComputedStyle(map);
      var gap = parseFloat(cs.getPropertyValue('--hexgap')) || 0;
      var hexw = Math.floor((w - (cols - 0.5) * gap) / (cols + 0.5));
      hexw = Math.max(min, Math.min(max, hexw));
      map.style.setProperty('--hexw', hexw + 'px');
      map.dataset.lod = hexw < 52 ? 's' : hexw < 76 ? 'm' : 'l';
      if (opts.onSize) opts.onSize(hexw, map.dataset.lod);
      return true;
    }

    apply();
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(apply);
      ro.observe(map);
      return { apply: apply, stop: function () { ro.disconnect(); } };
    }
    window.addEventListener('resize', apply);
    return { apply: apply, stop: function () { window.removeEventListener('resize', apply); } };
  }

  /* -------------------------------------------------------------- Rasterbau ---
     grid(map, cols, rows, build) baut die .hexrow/.cell-Struktur und ruft
     build(cell, c, r) für jedes Feld — der Prototyp füllt nur noch.
     -------------------------------------------------------------------------- */
  function grid(map, cols, rows, build) {
    map = SOT.clear($(map));
    for (var r = 0; r < rows; r++) {
      var row = el('div.hexrow' + (r & 1 ? '.odd' : ''));
      for (var c = 0; c < cols; c++) {
        var cell = el('div.cell', { data: { c: c, r: r } });
        if (build) build(cell, c, r);
        row.appendChild(cell);
      }
      map.appendChild(row);
    }
    return map;
  }
  // Feld aus einem Klick heraus finden — .cell trägt data-c/data-r.
  function cellOf(ev) {
    var n = ev.target.closest ? ev.target.closest('.cell') : null;
    return n ? { el: n, c: +n.dataset.c, r: +n.dataset.r } : null;
  }
  function cellAt(map, c, r) { return $(map).querySelector('.cell[data-c="' + c + '"][data-r="' + r + '"]'); }

  /* Marke in einen Slot hängen. Icons sind SVG, darum SOT.iconEl und kein
     Schriftzeichen:  mark(cell, 'krone', SOT.iconEl('sammlerin', 'pers'))  */
  function mark(cell, slot, node) {
    var s = cell.querySelector('.slot.' + slot);
    if (!s) { s = el('div.slot.' + slot); cell.appendChild(s); }
    s.appendChild(node);
    return s;
  }
  /* Designer-Hilfe: Slot-Raster einblenden (?slots). */
  function slotgrid(cell) {
    var g = el('div.slotgrid');
    ['kern', 'krone', 'wange', 'ferse', 'fuss', 'zahl'].forEach(function (n) {
      g.appendChild(el('i.g-' + n, { text: n }));
    });
    cell.appendChild(g);
    return g;
  }

  return {
    DIRS: DIRS, OPPOSITE: OPPOSITE, RATIO: RATIO, EDGE_MID: EDGE_MID,
    neighbors: neighbors, neighborsIn: neighborsIn, neighbor: neighbor, opposite: opposite,
    toCube: toCube, fromCube: fromCube, dist: dist, ring: ring, disc: disc,
    height: height, center: center, gridSize: gridSize, points: points, at: at,
    autosize: autosize, grid: grid, cellOf: cellOf, cellAt: cellAt,
    mark: mark, slotgrid: slotgrid
  };
})();
