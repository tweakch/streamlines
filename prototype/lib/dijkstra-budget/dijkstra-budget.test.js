// Nagelt das heutige Verhalten fest — nicht das gewünschte.
// Läuft mit (Zeilenkommentar, weil der Glob ein */ enthält):
// node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const { dijkstra } = require('./dijkstra-budget.js');

// Kleiner Baukasten für Testgraphen: graph({a: [['b', 2, 1]]})
function graph(spec) {
  const G = new Map();
  for (const [von, kanten] of Object.entries(spec)) {
    G.set(von, kanten.map(([to, w, risk]) => ({ to, w, risk })));
  }
  return G;
}

/* --- Grundverhalten ------------------------------------------------------ */

test('dijkstra-budget: der Start steht mit Kosten 0 und Überleben 1 drin', () => {
  const { dist, surv } = dijkstra(graph({}), 'a', 10, false);
  assert.equal(dist.get('a'), 0);
  assert.equal(surv.get('a'), 1);
});

test('dijkstra-budget: nimmt den billigeren Weg, auch wenn er später auftaucht', () => {
  // a→c direkt kostet 9, a→b→c kostet 3. Der Umweg muss gewinnen.
  const G = graph({ a: [['c', 9, 1], ['b', 1, 1]], b: [['c', 2, 1]] });
  const { dist } = dijkstra(G, 'a', 100, false);
  assert.equal(dist.get('c'), 3);
});

test('dijkstra-budget: unerreichbare Knoten fehlen — kein Infinity-Eintrag', () => {
  const G = graph({ a: [['b', 1, 1]], b: [], z: [['a', 1, 1]] });
  const { dist, surv } = dijkstra(G, 'a', 100, false);
  assert.equal(dist.has('z'), false);
  assert.equal(surv.has('z'), false);
  assert.equal(dist.get('z'), undefined); // nicht Infinity — Aufrufer prüfen auf has()
});

/* --- der Kostendeckel ---------------------------------------------------- */

test('dijkstra-budget: das Budget ist EINSCHLIESSLICH', () => {
  const G = graph({ a: [['b', 6, 1]] });
  assert.equal(dijkstra(G, 'a', 6, false).dist.get('b'), 6, 'nd === budget ist erreichbar');
  assert.equal(dijkstra(G, 'a', 5, false).dist.has('b'), false, 'nd > budget nicht');
});

test('dijkstra-budget: der Deckel schneidet den Weg ab, nicht nur den Endknoten', () => {
  const G = graph({ a: [['b', 4, 1]], b: [['c', 4, 1]] });
  const { dist } = dijkstra(G, 'a', 5, false);
  assert.equal(dist.get('b'), 4);
  assert.equal(dist.has('c'), false);
});

/* --- Wagnis -------------------------------------------------------------- */

test('dijkstra-budget: ohne Wagnis werden Kanten mit risk < 1 gar nicht betreten', () => {
  const G = graph({ a: [['b', 1, 0.5]] });
  assert.equal(dijkstra(G, 'a', 100, false).dist.has('b'), false);
  assert.equal(dijkstra(G, 'a', 100, true).dist.get('b'), 1);
});

test('dijkstra-budget: Überleben ist das Produkt entlang des Weges', () => {
  const G = graph({ a: [['b', 1, 0.5]], b: [['c', 1, 0.4]] });
  const { surv } = dijkstra(G, 'a', 100, true);
  assert.equal(surv.get('b'), 0.5);
  assert.ok(Math.abs(surv.get('c') - 0.2) < 1e-12);
});

test('dijkstra-budget: bei gleichen Kosten gewinnt der sicherere Weg', () => {
  // Zwei Wege nach z, beide Kosten 2 — einer sicher, einer mit 0.5.
  const G = graph({
    a: [['riskant', 1, 0.5], ['sicher', 1, 1]],
    riskant: [['z', 1, 1]],
    sicher: [['z', 1, 1]]
  });
  const { dist, surv } = dijkstra(G, 'a', 100, true);
  assert.equal(dist.get('z'), 2);
  assert.equal(surv.get('z'), 1, 'der sichere Weg muss den Gleichstand gewinnen');
});

/* --- die zwei Eigenheiten, die beim Herausziehen auffielen --------------- */

test('dijkstra-budget: Infinity-Kanten relaxieren nie — auch nicht mit Wagnis', () => {
  // Wasserfall/Klamm liefern {k: Infinity, p: 0}. graphBauen() filtert die
  // NICHT heraus (add() prüft nichts), sie stehen also im Graphen. Der Deckel
  // hält sie auf: d + Infinity > budget.
  const G = graph({ a: [['fall', Infinity, 0]] });
  assert.equal(dijkstra(G, 'a', 100, true).dist.has('fall'), false);
  assert.equal(dijkstra(G, 'a', Infinity, true).dist.has('fall'), false);
});

test('dijkstra-budget: `|| 1` lässt Überleben 0 wieder auf 1 springen — latent', () => {
  // `const ns = (surv.get(u) || 1) * e.risk` behandelt eine 0 wie ein Fehlen.
  // Wer mit Überleben 0 ankommt, reist danach wieder als Lebender weiter.
  // In den Fundorten unerreichbar, WEIL p === 0 dort immer mit k === Infinity
  // gepaart ist (querKosten, gewaesser-labor-v1.html:713-720) — die Sperre ist
  // also das Gewicht, nicht das Risiko. Diese Kopplung steht nirgends
  // geschrieben; wer je eine Kante {w: endlich, risk: 0} baut, bekommt das hier.
  const G = graph({ a: [['tot', 1, 0]], tot: [['danach', 1, 1]] });
  const { surv } = dijkstra(G, 'a', 100, true);
  assert.equal(surv.get('tot'), 0);
  assert.equal(surv.get('danach'), 1, 'dokumentiert den Fehler, billigt ihn nicht');
});

/* --- gegen die echte Aufrufform ----------------------------------------- */

test('dijkstra-budget: zwei Läufe wie in reichweite() — mutig erreicht mehr', () => {
  const G = graph({
    a: [['ufer', 1, 1], ['furt', 2, 0.6]],
    ufer: [], furt: [['drueben', 1, 1]]
  });
  const sicher = dijkstra(G, 'a', 6, false);
  const mutig = dijkstra(G, 'a', 6, true);
  assert.deepEqual([...sicher.dist.keys()].sort(), ['a', 'ufer']);
  assert.deepEqual([...mutig.dist.keys()].sort(), ['a', 'drueben', 'furt', 'ufer']);
  assert.equal(mutig.surv.get('drueben'), 0.6);
});
