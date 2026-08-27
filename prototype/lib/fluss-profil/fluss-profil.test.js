// Nagelt das heutige Verhalten des Labors fest — nicht das gewünschte.
// Läuft mit (Zeilenkommentar, weil der Glob ein */ enthält):
// node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./fluss-profil.js');

const nah = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

/* Ein kleines Profil, 4 Blöcke à 10 km. Block 2 (km 20–30) ist ein See,
   Block 3 (km 30–40) beginnt mit einem 60-m-Fall. */
const bl = (i, abfall, zufluss, see, fall) => ({
  kmVon: i * 10, kmBis: (i + 1) * 10, abfall, zufluss, see: see || 0, fall: fall || 0
});
const GLATT = [bl(0, 400, 4), bl(1, 200, 7), bl(2, 100, 9), bl(3, 50, 12)];
const MIT_SEE_UND_FALL = [bl(0, 400, 4), bl(1, 200, 7), bl(2, 100, 9, 40), bl(3, 50, 12, 0, 60)];

/* --- Höhe ----------------------------------------------------------------- */

test('fluss-profil: Mündung ist 0, Quelle die Summe der Abfälle', () => {
  assert.equal(P.hoeheBei(GLATT, 40), 0);
  assert.equal(P.hoeheBei(GLATT, 0), 400 + 200 + 100 + 50);
});

test('fluss-profil: linear im Block, stetig an fallfreien Grenzen', () => {
  nah(P.hoeheBei(GLATT, 35), 25);                       // halber letzter Block
  nah(P.hoeheBei(GLATT, 30), 50);
  nah(P.hoeheBei(GLATT, 30 - 1e-9), 50, 1e-6);          // kein Sprung ohne Fall
  nah(P.hoeheBei(GLATT, 15), 50 + 100 + 100);
});

test('fluss-profil: steil skaliert Abfälle UND Fälle', () => {
  nah(P.hoeheBei(GLATT, 0, 2), 2 * 750);
  nah(P.hoeheBei(MIT_SEE_UND_FALL, 0, 2), 2 * (750 + 60));
});

test('fluss-profil: ein Fall ist ein Sprung genau am oberen Blockrand', () => {
  // Fall 60 m bei km 30. Der Punkt AUF der Grenze liegt unter dem Fall,
  // der Punkt eine Haaresbreite oberhalb über ihm.
  const unter = P.hoeheBei(MIT_SEE_UND_FALL, 30);
  const ueber = P.hoeheBei(MIT_SEE_UND_FALL, 30 - 1e-9);
  nah(ueber - unter, 60, 1e-4);
  assert.equal(unter, 50);
});

test('fluss-profil: ein See ist glatt — Spiegel auf Auslaufhöhe, Abfall am Einlauf', () => {
  const B = MIT_SEE_UND_FALL;
  const spiegel = P.hoeheBei(B, 25);
  for (const km of [20, 22, 25, 29.9]) {
    assert.equal(P.hoeheBei(B, km), spiegel, `See nicht glatt bei km ${km}`);
  }
  // Der Fall des FOLGEBLOCKS (60 m bei km 30) liegt unterhalb des Spiegels —
  // er ist der Auslauf-Wasserfall des Sees, und der Spiegel steht über ihm.
  nah(spiegel - P.hoeheBei(B, 30), 60, 1e-6);
  // Der ganze Blockabfall des Sees (100 m) sitzt am Einlauf (km 20):
  nah(P.hoeheBei(B, 20 - 1e-9) - spiegel, 100, 1e-4);
});

/* --- Abfluss --------------------------------------------------------------- */

test('fluss-profil: Abfluss beginnt bei q0 und wächst je Block linear', () => {
  assert.equal(P.abflussBei(GLATT, 0, 0.5), 0.5);
  nah(P.abflussBei(GLATT, 5, 0.5), 0.5 + 2);            // halber erster Zufluss
  nah(P.abflussBei(GLATT, 10, 0.5), 0.5 + 4);
  nah(P.abflussBei(GLATT, 40, 0.5), 0.5 + 4 + 7 + 9 + 12);
});

test('fluss-profil: der Boden liegt bei 0.1 — ganz trocken fällt kein Lauf', () => {
  assert.equal(P.abflussBei(GLATT, 0, 0.01), 0.1);
});

test('fluss-profil: mit q0 = 0.5 und Zufluss 1 bleibt km 0–1 ein Rinnsal-Abfluss', () => {
  // Der Anlass des Umbaus, in Zahlen: 1-km-Block mit Zufluss 1 endet bei 1.5.
  const einKm = [{ kmVon: 0, kmBis: 1, abfall: 10, zufluss: 1, see: 0, fall: 0 }];
  nah(P.abflussBei(einKm, 1, 0.5), 1.5);
  assert.ok(P.abflussBei(einKm, 1, 0.5) < 2, 'unter der Rinnsal/Bach-Grenze der Karte');
});

/* --- See, Delta, Fälle ----------------------------------------------------- */

test('fluss-profil: naechsterSeeVon findet streng flussab — auch von innen nicht sich selbst', () => {
  const B = MIT_SEE_UND_FALL;
  assert.equal(P.naechsterSeeVon(B, 0), 20);
  assert.equal(P.naechsterSeeVon(B, 19.9), 20);
  assert.equal(P.naechsterSeeVon(B, 20), Infinity);     // kmVon > km ist streng
  assert.equal(P.naechsterSeeVon(B, 25), Infinity);
  assert.equal(P.naechsterSeeVon(GLATT, 0), Infinity);
});

test('fluss-profil: das Delta wächst linear auf die Seekante zu und ist im See 0', () => {
  const B = MIT_SEE_UND_FALL;
  assert.equal(P.deltaAnteil(B, 10, 2), 0);             // weit weg
  nah(P.deltaAnteil(B, 19, 2), 0.5);                    // halber Weg
  nah(P.deltaAnteil(B, 19.9, 2), 0.95);
  assert.equal(P.deltaAnteil(B, 21, 2), 0);             // im See: Sache des Renderers
  assert.equal(P.deltaAnteil(B, 19, 0), 0);             // deltaKm 0 schaltet ab
  assert.equal(P.deltaAnteil(GLATT, 19, 2), 0);         // ohne See kein Delta
});

test('fluss-profil: deltaAnteil kennt den See auch ausserhalb des Ausschnitts', () => {
  // Die reine Funktion nimmt die GANZE Blockliste — ein Ausschnitt, der vor
  // dem See endet, sieht das anlaufende Delta trotzdem.
  nah(P.deltaAnteil(MIT_SEE_UND_FALL, 18.5, 3), 0.5);
});

test('fluss-profil: fallZeilen legt den Fall in die Zeile seiner Blockgrenze', () => {
  const B = MIT_SEE_UND_FALL;                           // Fall 60 bei km 30
  assert.deepEqual(P.fallZeilen(B, 25, 40, 0.5), [{ i: 10, fall: 60 }]);
  assert.deepEqual(P.fallZeilen(B, 29.75, 40, 0.5), [{ i: 0, fall: 60 }]);
});

test('fluss-profil: Grenzen genau auf von/bis fallen heraus, zwei Fälle summieren sich', () => {
  const B = MIT_SEE_UND_FALL;
  assert.deepEqual(P.fallZeilen(B, 30, 40, 0.5), []);   // kmVon > von ist streng
  assert.deepEqual(P.fallZeilen(B, 20, 30, 0.5), []);   // kmVon < bis ebenso
  // Ein Fall bei km 0 fällt am Ausschnitt 0–… ebenfalls heraus (streng > von):
  const amRand = [bl(0, 100, 4, 0, 20), bl(1, 50, 7, 0, 30)]; // Fälle bei km 0 und 10
  assert.deepEqual(P.fallZeilen(amRand, 0, 20, 4), [{ i: 2, fall: 30 }]);
  // Zwei Blockgrenzen in derselben groben Zeile summieren sich:
  const eng = [bl(0, 100, 4), bl(1, 50, 7, 0, 20), bl(2, 30, 5, 0, 30)]; // Fälle bei km 10 und 20
  assert.deepEqual(P.fallZeilen(eng, 5, 45, 20), [{ i: 0, fall: 50 }]);
});

test('fluss-profil: blockBei klemmt an beide Enden', () => {
  assert.equal(P.blockBei(GLATT, -5), GLATT[0]);
  assert.equal(P.blockBei(GLATT, 15), GLATT[1]);
  assert.equal(P.blockBei(GLATT, 999), GLATT[3]);
});
