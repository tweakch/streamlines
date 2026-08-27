// Nagelt das heutige Verhalten fest — nicht das gewünschte.
// Läuft mit (Zeilenkommentar, weil der Glob ein */ enthält):
// node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./hex-nachbarn-oddr.js');

/* --- die Tabellen selbst ------------------------------------------------- */

test('hex-nachbarn-oddr: Tabellen sind die der Prototypen und der App', () => {
  // wortgleich mit app/src/stromlinien/grid.ts:8-22 und
  // drafts/stromlinien-epoche1.html:390-391
  assert.deepEqual(H.DIRS_EVEN, [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]);
  assert.deepEqual(H.DIRS_ODD, [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]);
});

test('hex-nachbarn-oddr: jede Zeile hat sechs verschiedene Nachbarn', () => {
  for (const r of [-3, -2, -1, 0, 1, 2]) {
    const ns = H.neighbors(5, r).map((n) => n.c + ',' + n.r);
    assert.equal(ns.length, 6);
    assert.equal(new Set(ns).size, 6, `Zeile ${r} hat doppelte Nachbarn`);
    assert.ok(!ns.includes('5,' + r), 'ein Feld ist nicht sein eigener Nachbar');
  }
});

test('hex-nachbarn-oddr: Nachbarschaft ist wechselseitig', () => {
  for (const r of [-2, -1, 0, 1, 2, 3]) {
    for (const n of H.neighbors(4, r)) {
      const zurueck = H.neighbors(n.c, n.r).some((m) => m.c === 4 && m.r === r);
      assert.ok(zurueck, `${4},${r} → ${n.c},${n.r} (${n.dir}) ist nicht wechselseitig`);
    }
  }
});

/* --- die Parität, der eigentliche Streitpunkt ---------------------------- */

test('hex-nachbarn-oddr: par() liefert 0|1, auch für negative Zeilen', () => {
  assert.deepEqual([-4, -3, -2, -1, 0, 1, 2, 3].map(H.par), [0, 1, 0, 1, 0, 1, 0, 1]);
});

test('hex-nachbarn-oddr: die drei Schreibweisen im Bestand sind als Bedingung gleichwertig', () => {
  // Belegt, dass `r % 2 ? ODD : EVEN` (stromlinien-epoche1, map-editor-v3,
  // mechanik-labor, nacht-effekte, rhein-gesamt) und `r & 1 ? …`
  // (eiszeit-labor-v3) dieselbe Tabelle wählen wie die tragfähige Form.
  // Es gibt hier also KEINEN Fehler zu reparieren.
  for (let r = -10; r <= 10; r++) {
    const viaRest = r % 2 ? H.DIRS_ODD : H.DIRS_EVEN;
    const viaBit = (r & 1) ? H.DIRS_ODD : H.DIRS_EVEN;
    assert.equal(viaRest, H.dirsOf(r), `r=${r}: r % 2 wählt eine andere Tabelle`);
    assert.equal(viaBit, H.dirsOf(r), `r=${r}: r & 1 wählt eine andere Tabelle`);
  }
});

test('hex-nachbarn-oddr: gerechnet ist r % 2 sehr wohl falsch — der Versatz kippt', () => {
  // Der Fall, für den die defensive Form da ist: asset-editor-v1.html:126
  // rechnet `c + 0.5 * par(r)`. Mit rohem r % 2 wandert Zeile -1 nach links.
  assert.equal(H.rowShift(-1), 0.5);
  assert.equal(0.5 * (-1 % 2), -0.5); // die naive Fassung, zum Vergleich
  assert.notEqual(H.rowShift(-1), 0.5 * (-1 % 2));
});

/* --- Verhältnis zum Baukasten -------------------------------------------- */

test('hex-nachbarn-oddr: gleiche Nachbarmenge wie SOT.hex, andere Reihenfolge', () => {
  // SOT.hex (prototype/kit/sot-hex.js) speichert [dc, dr] in der Reihenfolge
  // E · SE · SW · W · NW · NE. Diese Fassung speichert [dr, dc] in der
  // Reihenfolge W · E · NW · NE · SW · SE. Die MENGE stimmt überein, der
  // INDEX nicht — darum ist der Baukasten kein Drop-in-Ersatz.
  const KIT_EVEN = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
  const KIT_ODD = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];
  const alsMenge = (tab, tausche) =>
    tab.map((d) => (tausche ? [d[1], d[0]] : d).join(',')).sort().join(' ');

  assert.equal(alsMenge(H.DIRS_EVEN, false), alsMenge(KIT_EVEN, true));
  assert.equal(alsMenge(H.DIRS_ODD, false), alsMenge(KIT_ODD, true));

  // …und der Index weicht wirklich ab, sonst wäre die Warnung überflüssig.
  assert.notDeepEqual(H.DIRS_EVEN[0], [KIT_EVEN[0][1], KIT_EVEN[0][0]]);
});

/* --- gegen die App ------------------------------------------------------- */

test('hex-nachbarn-oddr: Beispielnachbarn wie im Spiel', () => {
  assert.deepEqual(
    H.neighbors(3, 2).map((n) => [n.c, n.r]),
    [[2, 2], [4, 2], [2, 1], [3, 1], [2, 3], [3, 3]]
  );
  assert.deepEqual(
    H.neighbors(3, 3).map((n) => [n.c, n.r]),
    [[2, 3], [4, 3], [3, 2], [4, 2], [3, 4], [4, 4]]
  );
});

test('hex-nachbarn-oddr: neighborsIn beschneidet am Kartenrand', () => {
  assert.deepEqual(H.neighborsIn(0, 0, 5, 5).map((n) => [n.c, n.r]), [[1, 0], [0, 1]]);
  assert.equal(H.neighborsIn(2, 2, 5, 5).length, 6);
});
