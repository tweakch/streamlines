/* dijkstra-budget — kürzeste Wege mit Kostendeckel und Überlebenswahrschein-
   lichkeit. Zwei Läufe je Wanderer: einmal ohne Wagnis, einmal mit.

   Herkunft (byte-gleich, md5 800bcb2b…):
     drafts/gewaesser-labor-v1.html:769
     ab/gewaesser-kacheln/a-vektor.html:757
     ab/gewaesser-kacheln/b-kacheln.html:776
   Befunde und offene Punkte: siehe dijkstra-budget.md */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.SOTLIB = root.SOTLIB || {}).dijkstraBudget = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* G      Map<knoten, [{to, w, risk}]>   risk = Überlebenswahrscheinlichkeit,
                                           1 = gefahrlos, <1 = Wagnis
     start  Knoten
     budget Kostendeckel, EINSCHLIESSLICH — nd === budget ist noch erreichbar
     erlaubeRisiko  false: Kanten mit risk < 1 werden gar nicht betreten

     → { dist: Map<knoten, kosten>, surv: Map<knoten, wahrscheinlichkeit> }
       Unerreichbare Knoten fehlen in beiden Karten (kein Infinity-Eintrag).

     Unverändert aus den Fundorten übernommen, einschliesslich der
     pq.sort()-je-Entnahme und des `|| 1` in Zeile `ns` — beides ist in der
     .md begründet und darf hier nicht stillschweigend repariert werden. */
  function dijkstra(G, start, budget, erlaubeRisiko) {
    const dist = new Map([[start, 0]]), surv = new Map([[start, 1]]), pq = [[0, start]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]); const [d, u] = pq.shift();
      if (d > (dist.get(u) ?? Infinity)) continue;
      for (const e of (G.get(u) || [])) {
        if (!erlaubeRisiko && e.risk < 1) continue;
        const nd = d + e.w; if (nd > budget) continue;
        const ns = (surv.get(u) || 1) * e.risk;
        if (nd < (dist.get(e.to) ?? Infinity) || (nd === dist.get(e.to) && ns > (surv.get(e.to) || 0))) {
          dist.set(e.to, nd); surv.set(e.to, ns); pq.push([nd, e.to]);
        }
      }
    }
    return { dist, surv };
  }

  return { dijkstra: dijkstra };
});
