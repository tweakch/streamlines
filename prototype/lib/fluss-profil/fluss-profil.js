/* fluss-profil — ein Lauf als Abschnittsliste: Höhe (mit Wasserfällen und
   glatten Seespiegeln), Abfluss und das Delta vor einem See.
   Herkunft: fluss-gefaelle-labor-v2.html:333 (hoeheBei), 346 (abflussBei),
   356 (naechsterSeeVon), ~390 (deltaAnteil), 407 (fallZeilen) — ein einziger
   Fundort, siehe fluss-profil.md, warum es trotzdem hier liegt. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.SOTLIB = root.SOTLIB || {}).flussProfil = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function klemme(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  /* Ein Block: { kmVon, kmBis, abfall, zufluss, see, fall }
       abfall   Höhenverlust im Block (m), linear verteilt
       zufluss  was der Block dem Lauf zuführt (m³/s), linear anwachsend
       see      Seetiefe (m); > 0 heisst: der Block IST ein See
       fall     Wasserfall am OBEREN Blockrand (m), Sprung bei kmVon
     see und fall sind wahlfrei (fehlen = 0). Die Blöcke liegen lückenlos
     und aufsteigend; Bezugshöhe 0 ist die Mündung (Ende des letzten Blocks). */

  function blockBei(bloecke, km) {
    for (var i = 0; i < bloecke.length; i++) {
      if (km < bloecke[i].kmBis) return bloecke[i];
    }
    return bloecke[bloecke.length - 1];
  }

  /* Höhe am km-Punkt, kumuliert von der Mündung her (dort 0).
     Ein Fall ist ein Sprung genau bei kmVon: Punkte IM Block liegen unter
     ihm, Punkte oberhalb über ihm. Ein See ist glatt — sein Spiegel liegt
     auf Auslaufhöhe, der ganze Blockabfall (und ein etwaiger Fall) sitzt
     am Einlauf. `steil` skaliert alle Abfälle und Fälle (Vorgabe 1). */
  function hoeheBei(bloecke, km, steil) {
    if (steil === undefined) steil = 1;
    var h = 0;
    for (var i = bloecke.length - 1; i >= 0; i--) {
      var b = bloecke[i], d = b.abfall * steil, f = (b.fall || 0) * steil;
      if (km >= b.kmBis) return h;
      if (km >= b.kmVon) {
        if (b.see > 0) return h;
        return h + d * (b.kmBis - km) / (b.kmBis - b.kmVon);
      }
      h += d + f;
    }
    return h;
  }

  /* Abfluss am km-Punkt: q0 an der Quelle, je Block linear anwachsend um
     dessen Zufluss. Boden bei 0.1 m³/s — ganz trocken fällt kein Lauf. */
  function abflussBei(bloecke, km, q0) {
    var q = q0;
    for (var i = 0; i < bloecke.length; i++) {
      var b = bloecke[i];
      if (km <= b.kmVon) break;
      q += b.zufluss * Math.min(1, (km - b.kmVon) / (b.kmBis - b.kmVon));
    }
    return Math.max(0.1, q);
  }

  /* Nächster Seeanfang STRENG flussab von km — Infinity, wenn keiner kommt.
     Ein Punkt im See selbst hat keinen «nächsten» eigenen Anfang mehr. */
  function naechsterSeeVon(bloecke, km) {
    for (var i = 0; i < bloecke.length; i++) {
      if (bloecke[i].see > 0 && bloecke[i].kmVon > km) return bloecke[i].kmVon;
    }
    return Infinity;
  }

  /* Delta: kurz vor einem See fächert der Lauf auf und lagert ab. 0 weit
     weg, 1 an der Seekante, linear über deltaKm — und 0 IM See (der
     Kiesfächer dort ist Sache des Renderers). */
  function deltaAnteil(bloecke, km, deltaKm) {
    if (!(deltaKm > 0)) return 0;
    if (blockBei(bloecke, km).see > 0) return 0;
    var sv = naechsterSeeVon(bloecke, km);
    if (!isFinite(sv)) return 0;
    return klemme(1 - (sv - km) / deltaKm, 0, 1);
  }

  /* Wasserfälle den Zeilen eines Ausschnitts zuordnen: n Zeilen à dk km ab
     `von`; jeder Fall landet in der Zeile, die seine Blockgrenze enthält.
     Grenzen GENAU auf von/bis fallen heraus (dort ist der Sprung nicht mehr
     im Bild). Zwei Fälle in derselben Zeile summieren sich.
     Ergebnis: [{ i, fall }], nach i aufsteigend. */
  function fallZeilen(bloecke, von, bis, dk) {
    var n = Math.max(1, Math.round((bis - von) / dk));
    var je = {};
    bloecke.forEach(function (b) {
      if (b.fall > 0 && b.kmVon > von && b.kmVon < bis) {
        var i = klemme(Math.floor((b.kmVon - von) / dk), 0, n - 1);
        je[i] = (je[i] || 0) + b.fall;
      }
    });
    return Object.keys(je).sort(function (a, b) { return a - b; })
      .map(function (i) { return { i: +i, fall: je[i] }; });
  }

  return {
    blockBei: blockBei, hoeheBei: hoeheBei, abflussBei: abflussBei,
    naechsterSeeVon: naechsterSeeVon, deltaAnteil: deltaAnteil,
    fallZeilen: fallZeilen
  };
});
