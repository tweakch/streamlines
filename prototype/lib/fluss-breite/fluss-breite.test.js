// Nagelt das heutige Verhalten fest — nicht das gewünschte.
// Läuft mit (Zeilenkommentar, weil der Glob ein */ enthält):
// node --test "C:/dev/tweakch/shadows-of-truth/prototype/lib/**/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('./fluss-breite.js');

const nah = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

/* --- b = 6·√Q, die hydraulische Geometrie -------------------------------- */

test('fluss-breite: Breite in Metern trifft die Eichpunkte des Labors', () => {
  // gewaesser-labor-v1 nennt beide ausdrücklich als Kalibrierung.
  assert.equal(Math.round(F.breiteM(90)), 57);    // Alpenrhein MQ
  assert.equal(Math.round(F.breiteM(1050)), 194); // Rhein bei Basel
});

test('fluss-breite: Breite wächst mit der Wurzel — vierfacher Abfluss, doppelte Breite', () => {
  nah(F.breiteM(40), 2 * F.breiteM(10));
  assert.equal(F.breiteM(0), 0);
});

/* --- bandBreite: die gezeichnete Übertreibung ---------------------------- */

test('fluss-breite: bandBreite ist stückweise stetig an allen vier Nähten', () => {
  for (const b of [0.5, 5, 10, 100]) {
    const links = F.bandBreite(b - 1e-9, 1), rechts = F.bandBreite(b, 1);
    assert.ok(Math.abs(links - rechts) < 1e-6, `Sprung bei b=${b}: ${links} → ${rechts}`);
  }
});

test('fluss-breite: bandBreite ist monoton und bei 0.34 Feldbreiten gedeckelt', () => {
  let vorher = -1;
  for (let b = 0; b <= 5000; b += 0.5) {
    const f = F.bandBreite(b, 1);
    assert.ok(f >= vorher - 1e-12, `nicht monoton bei b=${b}`);
    assert.ok(f <= 0.34 + 1e-12, `Deckel verletzt bei b=${b}: ${f}`);
    vorher = f;
  }
  assert.equal(F.bandBreite(1e6, 1), 0.34);
});

test('fluss-breite: bandBreite skaliert mit der Feldbreite, Standard ist 100', () => {
  assert.equal(F.bandBreite(20), F.bandBreite(20, 100));
  nah(F.bandBreite(20, 50), F.bandBreite(20, 100) / 2);
});

/* --- Klassen: die Abweichung zwischen Karte und Labor -------------------- */

test('fluss-breite: Klassengrenzen der Karte liegen beim ABFLUSS', () => {
  assert.equal(F.klasse(1.99), 'rinnsal');
  assert.equal(F.klasse(2), 'bach');
  assert.equal(F.klasse(9.99), 'bach');
  assert.equal(F.klasse(10), 'kfluss');
  assert.equal(F.klasse(59.99), 'kfluss');
  assert.equal(F.klasse(60), 'gfluss');
  assert.equal(F.klasseName(560), 'grosser Fluss'); // Aare
});

test('fluss-breite: die Labor-Einteilung schneidet anders — verworfene Fassung', () => {
  // gewaesser-labor-v2/v3 klassieren nach BREITE (b<5 / b<10), erkundung-v6
  // ebenso. Auf der grossen Karte wäre damit schon ein Bach von 2.8 m³/s ein
  // „grosser Fluss" — der Seasons-Draft begründet den Wechsel im Quelltext:
  // dort fliessen Aare (560) und Rhein (1000).
  assert.equal(F.klasseNachBreite(F.breiteM(2.8)), 'gfluss');
  assert.equal(F.klasse(2.8), 'bach');
  // Der Umschlagpunkt der Laborfassung, in Abfluss ausgedrückt:
  nah(F.breiteM(25 / 36), 5); // b = 5 m ⟺ q ≈ 0.694
});

/* --- Belegung: der heutige Stand ----------------------------------------- */

test('fluss-breite: ein Lauf belegt 1, 3 oder 5 Felder', () => {
  const gesehen = new Set();
  for (let i = 0; i < 3000; i++) gesehen.add(F.durchmesser(0.05 * Math.pow(1.004, i)));
  assert.deepEqual([...gesehen].sort((a, b) => a - b), [1, 3, 5]);
});

test('fluss-breite: die Belegung springt bei Q = 10 und Q = 60', () => {
  assert.equal(F.durchmesser(9.99), 1);
  assert.equal(F.durchmesser(10), 3);
  assert.equal(F.durchmesser(59.99), 3);
  assert.equal(F.durchmesser(60), 5);
});

test('fluss-breite: Rinnsal und Bach belegen dasselbe eine Feld', () => {
  // Rang 0 und 1 fallen beide auf Radius 0 — von den vier Klassen wirken
  // sich also nur zwei auf die Belegung aus.
  assert.equal(F.rang(1), 0);
  assert.equal(F.rang(5), 1);
  assert.equal(F.radius(1), F.radius(5));
});

test('fluss-breite: die Belegung kennt die Feldgrösse nicht — der offene Punkt', () => {
  // radius() nimmt nur Q. Auf 2 km wie auf 0.4 km dieselben 5 Felder,
  // obwohl das einmal 10 km und einmal 2 km Landschaft sind.
  assert.equal(F.radius(1000), 2);
  assert.equal(F.radius.length, 1);
});

test('fluss-breite: gezeichnetes Band und belegte Felder widersprechen sich', () => {
  // Der eigentliche Befund. Zwischen Q = 59 und Q = 60 wächst das
  // gezeichnete Band um 0.21 %, die Zahl der belegten Felder um 67 % —
  // ein Faktor von rund 300 zwischen zwei Grössen, die dasselbe meinen.
  const b59 = F.bandBreite(F.breiteM(59), 1), b60 = F.bandBreite(F.breiteM(60), 1);
  const wachstum = (b60 - b59) / b59;
  assert.ok(wachstum < 0.0025, `Band wächst nur wenig, ist aber ${(wachstum * 100).toFixed(3)} %`);
  assert.ok(wachstum > 0.002, 'und zwar messbar — 0.213 %, nicht null');
  assert.equal(F.durchmesser(59), 3);
  assert.equal(F.durchmesser(60), 5);
  // Und die Grössenordnung stimmt ohnehin nicht: das Band ist nie breiter
  // als 0.34 Felder, gestempelt werden bis zu 5.
  assert.ok(F.bandBreite(F.breiteM(1000), 1) < 0.34);
  assert.equal(F.durchmesser(1000), 5);
});

/* --- neu: Korridor und rasterabhängige Belegung -------------------------- */

test('fluss-breite: der Korridor ist auf die heutigen Sprünge geeicht', () => {
  nah(F.korridorKm(10), 4, 1e-9);
  nah(F.korridorKm(60), 8, 1e-9);
  assert.equal(F.korridorKm(0), 0);
  assert.equal(F.korridorKm(-5), 0);
});

test('fluss-breite: bei 2 km je Feld ist die neue Belegung deckungsgleich mit der alten', () => {
  // Über den ganzen Bereich durchgeprüft, nicht nur an den Sprüngen.
  for (let i = 0; i < 4000; i++) {
    const q = 0.05 * Math.pow(1.003, i);
    assert.equal(F.radiusBeiRaster(q, 2, 2), F.radius(q), `Abweichung bei Q=${q.toFixed(3)}`);
  }
});

test('fluss-breite: auf feinerem Raster wächst die Belegung — das ist der Zweck', () => {
  assert.equal(F.radiusBeiRaster(1000, 2), 3);   // ungedeckelt schon bei 2 km mehr als alt
  assert.ok(F.radiusBeiRaster(1000, 0.4) > F.radiusBeiRaster(1000, 2));
  // Der Korridor bleibt dabei physisch derselbe, nur in anderen Feldern gezählt.
  const km = F.korridorKm(1000);
  for (const hexKm of [2, 1, 0.4]) {
    const felder = 2 * F.radiusBeiRaster(1000, hexKm) + 1;
    assert.ok(Math.abs(felder * hexKm - km) <= hexKm, `bei ${hexKm} km: ${felder} Felder ≠ ${km.toFixed(1)} km`);
  }
});

test('fluss-breite: der Korridor wächst monoton mit dem Abfluss', () => {
  let vorher = -1;
  for (let i = 0; i < 2000; i++) {
    const k = F.korridorKm(0.05 * Math.pow(1.005, i));
    assert.ok(k >= vorher, 'nicht monoton');
    vorher = k;
  }
});

/* --- neu: Gefälle und sein Gang ------------------------------------------ */

test('fluss-breite: ohne Profil bleibt die Breite exakt der Bestand', () => {
  // Die Sicherheitseigenschaft. Alles Gelände-Neue darf den geeichten
  // Bezugspunkt b = 6·√Q nicht verschieben, solange niemand ihn füttert.
  for (const q of [0.5, 5, 90, 560, 1050]) {
    assert.equal(F.breiteMitGefaelle(q), F.breiteM(q));
    assert.equal(F.breiteMitGefaelle(q, null), F.breiteM(q));
  }
  // Alpenrhein und Basel bleiben auf ihren Eichwerten.
  assert.equal(Math.round(F.breiteMitGefaelle(90)), 57);
  assert.equal(Math.round(F.breiteMitGefaelle(1050)), 194);
});

test('fluss-breite: an der Verzweigungsschwelle mit gleichem Gefälle ändert sich nichts', () => {
  const j = F.J_VERZWEIGT;
  nah(F.breiteMitGefaelle(100, { jVor: j, j: j, jNach: j }), F.breiteM(100));
});

test('fluss-breite: steiler ist schmaler — bei gleichem Abfluss', () => {
  const q = 100;
  const flach = F.breiteMitGefaelle(q, { j: 0.004 });
  const normal = F.breiteMitGefaelle(q, { j: F.J_VERZWEIGT });
  const schnell = F.breiteMitGefaelle(q, { j: F.J_SCHNELL });
  const fall = F.breiteMitGefaelle(q, { j: F.J_FALL });
  assert.ok(flach >= normal, 'unter der Schwelle greift der Hang nicht mehr');
  assert.ok(schnell < normal, 'Stromschnelle schmaler als Talgerinne');
  assert.ok(fall < schnell, 'Wasserfall am schmalsten');
  assert.ok(fall / normal > 0.5 && fall / normal < 0.6, `Wasserfall bei ${(fall / normal * 100).toFixed(0)} %`);
});

test('fluss-breite: der Hangfaktor ist gedeckelt und monoton fallend', () => {
  assert.equal(F.hangFaktor(0.001), 1);
  assert.equal(F.hangFaktor(F.J_VERZWEIGT), 1);
  let vorher = 2;
  for (let j = 0.001; j < 3; j += 0.002) {
    const f = F.hangFaktor(j);
    assert.ok(f <= vorher + 1e-12, `nicht monoton bei J=${j}`);
    assert.ok(f >= 0.45 - 1e-12 && f <= 1 + 1e-12, `Deckel verletzt bei J=${j}: ${f}`);
    vorher = f;
  }
});

test('fluss-breite: wird das Gelände flacher, wird der Lauf breiter', () => {
  // Der Kern des Auftrags. Gleiches Q, gleiches örtliches J — nur der GANG
  // unterscheidet sich.
  const q = 100, j = 0.02;
  const wirdFlacher = F.breiteMitGefaelle(q, { jVor: 0.05, j: j, jNach: 0.005 });
  const gleich = F.breiteMitGefaelle(q, { jVor: j, j: j, jNach: j });
  const wirdSteiler = F.breiteMitGefaelle(q, { jVor: 0.005, j: j, jNach: 0.05 });
  assert.ok(wirdFlacher > gleich, 'Ausgang aus dem Gebirge: breiter');
  assert.ok(wirdSteiler < gleich, 'Eingang in die Klamm: schmaler');
  assert.ok(wirdFlacher / wirdSteiler > 1.5, 'und der Unterschied ist deutlich');
});

test('fluss-breite: der Gang ist symmetrisch um 1 und gedeckelt', () => {
  assert.equal(F.gangFaktor(undefined, 0.02, undefined), 1);
  assert.equal(F.gangFaktor(0.02, 0.02, 0.02), 1);
  assert.equal(F.gangFaktor(1, 0.02, 0), 1.6, 'Schwemmfächer gedeckelt');
  assert.equal(F.gangFaktor(0, 0.02, 1), 0.7, 'Klamm gedeckelt');
});

test('fluss-breite: flach mäandert, steil läuft gerade', () => {
  assert.equal(F.sinuositaet(F.J_SCHNELL), 1);
  assert.equal(F.sinuositaet(F.J_VERZWEIGT), 1);
  assert.ok(F.sinuositaet(0.0012) > 1.7, 'eine Zehnerpotenz flacher: deutlich gewunden');
  assert.equal(F.sinuositaet(1e-9), 2.6, 'gedeckelt');
  let vorher = 0;
  for (let i = 0; i < 500; i++) {
    const s = F.sinuositaet(0.02 * Math.pow(0.99, i));
    assert.ok(s >= vorher, 'Windung wächst monoton, je flacher es wird');
    vorher = s;
  }
});

test('fluss-breite: verzweigt genau nach der Bedingung des Labors', () => {
  // gewaesser-labor-v1.html:570 — J < jBraid && b >= 8 && b < 60.
  // In Abfluss übersetzt ist das ein Fenster: 16/9 ≤ Q < 100.
  assert.equal(F.verzweigt(2, 0.004), true);            // b = 8.49
  assert.equal(F.verzweigt(99, 0.004), true);           // b = 59.7 — knapp drin
  assert.equal(F.verzweigt(100, 0.004), false);         // b = 60.0 — die Grenze schliesst aus
  assert.equal(F.verzweigt(1, 0.004), false);           // b = 6 — zu klein
  assert.equal(F.verzweigt(100, 0.05), false);          // zu steil
  assert.equal(F.verzweigt(1000, 0.004), false);        // b = 190 — ein Strom verwildert nicht
  // Die Fenstergrenzen exakt:
  nah(F.breiteM(16 / 9), 8);
  nah(F.breiteM(100), 60);
});

test('fluss-breite: Verzweigung verdreifacht die Gürtelbreite, aber nur auf Wunsch', () => {
  const q = 20, p = { j: 0.004 };
  const ohne = F.breiteMitGefaelle(q, p);
  const mit = F.breiteMitGefaelle(q, p, { verzweigung: true });
  nah(mit, ohne * F.BRAID_FAKTOR);
  // Ein Strom verzweigt nicht — der Schalter tut dort nichts.
  assert.equal(F.breiteMitGefaelle(1000, p, { verzweigung: true }), F.breiteMitGefaelle(1000, p));
});

test('fluss-breite: gefaelleLage benennt die drei Fälle', () => {
  assert.equal(F.gefaelleLage(0.05, 0.02, 0.005).gang, 'wird flacher');
  assert.equal(F.gefaelleLage(0.005, 0.02, 0.05).gang, 'wird steiler');
  assert.equal(F.gefaelleLage(0.02, 0.02, 0.02).gang, 'gleichbleibend');
  assert.equal(F.gefaelleLage(0, 0.13, 0).steil, 'fall');
  assert.equal(F.gefaelleLage(0, 0.06, 0).steil, 'schnell');
  assert.equal(F.gefaelleLage(0, 0.004, 0).steil, 'flach');
});

/* --- Rückfluss aus fluss-gefaelle-labor-v2: der Korridor je Klasse -------- */

test('fluss-breite: die Strom-Leiter — fünf Klassen, Grenzen 2/10/60/85', () => {
  assert.equal(F.klasseStrom(1.99).key, 'rinnsal');
  assert.equal(F.klasseStrom(2).key, 'bach');
  assert.equal(F.klasseStrom(59.99).key, 'kfluss');
  assert.equal(F.klasseStrom(60).key, 'gfluss');
  assert.equal(F.klasseStrom(84.99).key, 'gfluss');
  assert.equal(F.klasseStrom(85).key, 'strom');
  assert.equal(F.klasseStrom(1000).name, 'Strom');
  // Unterhalb der neuen 85er-Grenze deckt sich die Leiter mit der Karte —
  // sie VERFEINERT den grossen Fluss, sie widerspricht ihm nicht.
  for (const q of [0.5, 1.99, 2, 9, 10, 42, 59.99, 60, 84]) {
    assert.equal(F.klasseStrom(q).key, F.klasse(q));
  }
});

test('fluss-breite: der Korridor je Klasse ist 1·2·3·4·5 Felder und wächst monoton', () => {
  assert.deepEqual([0.5, 5, 30, 70, 200].map(F.korridorFelder), [1, 2, 3, 4, 5]);
  let vorher = 0;
  for (let i = 0; i < 2000; i++) {
    const f = F.korridorFelder(0.05 * Math.pow(1.005, i));
    assert.ok(f >= vorher, 'nicht monoton');
    vorher = f;
  }
  assert.equal(vorher, 5, 'der Deckel ist der Strom');
});

test('fluss-breite: eine Quelle mit q0 = 2 kann nie ein Rinnsal sein — der Befund des Labors', () => {
  // Das Labor stand mit q0 = 2 GENAU auf der Rinnsal/Bach-Grenze: schon die
  // Quelle war ein Bach, und «km 0–1 mit Zufluss 1» wurde als Bach klassiert.
  // Erst q0 unter 2 (Labor-Voreinstellung jetzt 0.5) macht das Rinnsal
  // erreichbar: 0.5 + 1 an Zufluss = 1.5 bleibt unter der Grenze.
  assert.equal(F.klasseStrom(2).key, 'bach');
  assert.equal(F.klasseStrom(0.5).key, 'rinnsal');
  assert.equal(F.klasseStrom(0.5 + 1).key, 'rinnsal');
});

test('fluss-breite: rasteMitte — ungerade Breiten aufs Feld, gerade auf die Feldgrenze', () => {
  assert.equal(F.rasteMitte(6.2, 3), 6);      // ungerade: Feldmitte
  assert.equal(F.rasteMitte(6.7, 3), 7);
  assert.equal(F.rasteMitte(6.2, 2), 6.5);    // gerade: Feldgrenze
  assert.equal(F.rasteMitte(5.9, 2), 5.5);
  assert.equal(F.rasteMitte(6.5, 4), 6.5);    // schon gerastet: bleibt
  assert.equal(F.rasteMitte(6, 5), 6);
});

test('fluss-breite: feldDeckung — die drei Arten an einem Randfeld', () => {
  // Lauf 2 Felder breit (halb = 1), Feld eine Feldbreite neben der Mitte:
  // die Überlappung ist genau die Hälfte.
  nah(F.feldDeckung(1, 1, 'stetig'), 0.5);
  assert.equal(F.feldDeckung(1, 1, 'mehrheit'), 1);      // ab 50 % ganz
  assert.equal(F.feldDeckung(1, 1, 'symmetrisch'), 1);   // Mitte liegt im Lauf
  assert.equal(F.feldDeckung(1.6, 1, 'mehrheit'), 0);
  nah(F.feldDeckung(1.2, 1, 'stetig'), 0.3);
  assert.equal(F.feldDeckung(0, 1, 'stetig'), 1);
});

test('fluss-breite: mittig gelesen wird eine 2 zur 3 — erst die Feldgrenze macht sie wahr', () => {
  // DER Befund des Labors. Breite 2 (halb = 1) mittig auf ein Feld gelegt:
  // beide Nachbarfelder decken je 50 % und zählen unter `mehrheit` mit — die
  // Zeile liest sich als 3. Auf die Feldgrenze gerastet liest sie sich als 2.
  assert.equal(F.gezaehlteFelder(6, 1, 13, 'mehrheit'), 3);
  assert.equal(F.gezaehlteFelder(6.5, 1, 13, 'mehrheit'), 2);
  // `symmetrisch` kann die 2 nicht einmal auf der Feldgrenze: dort ist die
  // gerundete Breite mittig um die Laufmitte gelegt — nur 1, 3, 5.
  assert.equal(F.gezaehlteFelder(6, 1, 13, 'symmetrisch'), 3);
});

test('fluss-breite: gerastet liest sich jede Korridorbreite exakt — 1 bis 5, konstant', () => {
  // Die Zusicherung hinter breite=korridor: nach rasteMitte zählt `mehrheit`
  // GENAU so viele Felder, wie die Klasse vorgibt — egal wo der Mäander die
  // Mitte gerade hinschiebt.
  for (let felder = 1; felder <= 5; felder++) {
    for (const roh of [4.1, 5.5, 6.49, 7.02, 8.9]) {
      const mitte = F.rasteMitte(roh, felder);
      assert.equal(F.gezaehlteFelder(mitte, felder / 2, 17, 'mehrheit'), felder,
        `Breite ${felder}, Mitte ${roh} → ${mitte}`);
    }
  }
});

test('fluss-breite: die Verzweigungsgrenze ist eine Klippe — dreifach, bei Q = 100', () => {
  // Das Fenster des Labors ist hart (b < 60). Mit dem Faktor 3 darauf springt
  // die Gürtelbreite bei 0.1 % mehr Abfluss auf ein Drittel. Festgehalten,
  // nicht geglättet: die Klippe steckt schon im Bestand, das Multiplizieren
  // macht sie nur sichtbar.
  const p = { j: 0.004 }, o = { verzweigung: true };
  const davor = F.breiteMitGefaelle(99.9, p, o);
  const danach = F.breiteMitGefaelle(100, p, o);
  assert.ok(davor / danach > 2.9 && davor / danach < 3.1, `Sprung um Faktor ${(davor / danach).toFixed(2)}`);
  // Ohne den Schalter gibt es die Klippe nicht.
  nah(F.breiteMitGefaelle(99.9, p), F.breiteMitGefaelle(99.9, p, {}));
});
