/*
 * store.mjs — der Kartenspeicher. SQLite über `node:sqlite` (in Node 24
 * eingebaut), also ohne neue Abhängigkeit; die Bake-Stufe bleibt dependency-frei.
 *
 * Zwei Speicherformen, weil es zwei verschiedene Aufgaben sind:
 *
 *   kachel   — DICHTE Daten als BLOB, ein 32×32-Block je (Overlay, Ebene, Kachel).
 *              Das ist der Auslieferungsweg: eine Kachel ist ein GET, wird als
 *              Typed Array dekodiert und direkt gezeichnet — kein Parsen, kein
 *              Index, O(1). Der Inhalts-Hash macht sie unveränderlich und damit
 *              beliebig lange cachebar (CDN, IndexedDB, Speicher).
 *   zellwert — DÜNNE Daten als Zeilen, nur für die Spielebene (Ebene ≤ 1).
 *              Das ist der Abfrageweg: „wo ist Kieselgestein UND Feuchtboden"
 *              beantwortet ein Index, nicht ein Scan über Millionen Zellen.
 *
 * Dieselbe Zahl steht in beiden Formen — die eine ist zum Zeichnen, die andere
 * zum Fragen. Das ist kein Duplikat aus Versehen, sondern der Kern des Entwurfs:
 * ein Rasterfeld ist sein eigener Index (Zelle → Offset ist Arithmetik), aber
 * eine Attributfrage braucht einen echten.
 */
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

export const hashVon = (bytes) =>
  createHash('sha256').update(bytes).digest('hex').slice(0, 16)

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE ebene (
  id       INTEGER PRIMARY KEY,
  hex_km   REAL NOT NULL,
  cols     INTEGER NOT NULL,
  rows     INTEGER NOT NULL,
  kachel   INTEGER NOT NULL,
  region   TEXT
);

CREATE TABLE overlay (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  gruppe      TEXT NOT NULL,
  einheit     TEXT,
  kodierung   TEXT NOT NULL,
  ebenen      TEXT NOT NULL,
  quellen     TEXT NOT NULL,
  notiz       TEXT,
  skala       TEXT,
  quelle_fehlt INTEGER NOT NULL DEFAULT 0,
  belegt      REAL NOT NULL DEFAULT 0,
  inspiriert  REAL NOT NULL DEFAULT 0,
  erfunden    REAL NOT NULL DEFAULT 0
);

-- Legende kategorialer Overlays. Reihenfolge = Anzeigereihenfolge.
CREATE TABLE klasse (
  overlay  TEXT NOT NULL,
  wert     INTEGER NOT NULL,
  schluessel TEXT NOT NULL,
  name     TEXT NOT NULL,
  farbe    TEXT,
  extra    TEXT,
  PRIMARY KEY (overlay, wert)
) WITHOUT ROWID;

-- Auslieferung: 32×32 Werte als BLOB, unveränderlich über den Hash.
CREATE TABLE kachel (
  overlay TEXT NOT NULL,
  ebene   INTEGER NOT NULL,
  tx      INTEGER NOT NULL,
  ty      INTEGER NOT NULL,
  hash    TEXT NOT NULL,
  gesetzt INTEGER NOT NULL,
  daten   BLOB NOT NULL,
  PRIMARY KEY (overlay, ebene, tx, ty)
) WITHOUT ROWID;

-- Abfrage: nur Spielebenen, nur gesetzte Werte.
CREATE TABLE zellwert (
  ebene   INTEGER NOT NULL,
  overlay TEXT NOT NULL,
  c       INTEGER NOT NULL,
  r       INTEGER NOT NULL,
  wert    INTEGER NOT NULL,
  PRIMARY KEY (ebene, overlay, c, r)
) WITHOUT ROWID;

-- Der Attributindex: „wo liegt Wert X dieses Overlays?"
CREATE INDEX ix_zellwert_wert ON zellwert (ebene, overlay, wert);
-- Der Ortsindex: „was weiss ich über diese Zelle?" über alle Overlays.
CREATE INDEX ix_zellwert_ort  ON zellwert (ebene, c, r);

CREATE TABLE ledger (
  stufe        TEXT NOT NULL,
  quelle       TEXT NOT NULL,
  ebene        INTEGER,
  eingabe      INTEGER NOT NULL,
  ausgabe      INTEGER NOT NULL,
  ausgestossen INTEGER NOT NULL,
  belegt       REAL NOT NULL,
  inspiriert   REAL NOT NULL,
  erfunden     REAL NOT NULL,
  posten       TEXT NOT NULL
);

CREATE TABLE meta (schluessel TEXT PRIMARY KEY, wert TEXT NOT NULL);
`

export function neuerStore(pfad) {
  mkdirSync(dirname(pfad), { recursive: true })
  /* Neu bauen statt migrieren: der Store ist ein Erzeugnis, keine Datenbank
     mit eigenem Leben. WAL-Nebendateien müssen mit weg. */
  for (const s of ['', '-wal', '-shm'])
    if (existsSync(pfad + s)) rmSync(pfad + s)

  const db = new DatabaseSync(pfad)
  db.exec(SCHEMA)

  const stmt = {
    ebene: db.prepare(
      'INSERT INTO ebene (id,hex_km,cols,rows,kachel,region) VALUES (?,?,?,?,?,?)',
    ),
    overlay: db.prepare(
      `INSERT INTO overlay (id,name,gruppe,einheit,kodierung,ebenen,quellen,notiz,skala,quelle_fehlt,belegt,inspiriert,erfunden)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ),
    klasse: db.prepare(
      'INSERT INTO klasse (overlay,wert,schluessel,name,farbe,extra) VALUES (?,?,?,?,?,?)',
    ),
    kachel: db.prepare(
      'INSERT INTO kachel (overlay,ebene,tx,ty,hash,gesetzt,daten) VALUES (?,?,?,?,?,?,?)',
    ),
    zellwert: db.prepare(
      'INSERT INTO zellwert (ebene,overlay,c,r,wert) VALUES (?,?,?,?,?)',
    ),
    ledger: db.prepare(
      `INSERT INTO ledger (stufe,quelle,ebene,eingabe,ausgabe,ausgestossen,belegt,inspiriert,erfunden,posten)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ),
    meta: db.prepare('INSERT OR REPLACE INTO meta (schluessel,wert) VALUES (?,?)'),
  }

  const S = { db, pfad }

  S.setzeMeta = (k, v) => stmt.meta.run(k, String(v))

  S.setzeEbene = (L, cols, rows, tile, region) =>
    stmt.ebene.run(L.id, L.hexKm, cols, rows, tile, region ? JSON.stringify(region) : null)

  S.setzeOverlay = (o, naehe) => {
    stmt.overlay.run(
      o.id,
      o.name,
      o.gruppe,
      o.einheit ?? null,
      o.kodierung,
      JSON.stringify(o.ebenen),
      JSON.stringify(o.quellen),
      o.notiz ?? null,
      o.skala ? JSON.stringify(o.skala) : null,
      o.quelleFehlt ? 1 : 0,
      naehe?.anteil.belegt ?? 0,
      naehe?.anteil.inspiriert ?? 0,
      naehe?.anteil.erfunden ?? 0,
    )
    for (const [schluessel, k] of Object.entries(o.klassen ?? {})) {
      const { wert, name, farbe, ...extra } = k
      stmt.klasse.run(
        o.id,
        wert,
        schluessel,
        name,
        farbe ?? null,
        Object.keys(extra).length ? JSON.stringify(extra) : null,
      )
    }
  }

  /** Schreibt eine Kachel. Gibt Hash und Anzahl gesetzter Werte zurück. */
  S.schreibeKachel = (overlay, ebene, tx, ty, bytes) => {
    let gesetzt = 0
    for (let i = 0; i < bytes.length; i++) if (bytes[i]) gesetzt++
    if (!gesetzt) return null // leere Kacheln entfallen, wie im Tileset
    const hash = hashVon(bytes)
    stmt.kachel.run(overlay, ebene, tx, ty, hash, gesetzt, bytes)
    return { hash, gesetzt }
  }

  S.schreibeZellwert = (ebene, overlay, c, r, wert) =>
    stmt.zellwert.run(ebene, overlay, c, r, wert)

  S.schreibeLedger = (bericht) => {
    for (const e of bericht.eintraege)
      stmt.ledger.run(
        e.stufe,
        e.quelle,
        e.ebene,
        e.eingabe,
        e.ausgabe,
        e.ausgestossen,
        e.anteil.belegt,
        e.anteil.inspiriert,
        e.anteil.erfunden,
        JSON.stringify(e.posten),
      )
  }

  S.transaktion = (fn) => {
    db.exec('BEGIN')
    try {
      fn()
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }

  S.abschluss = () => {
    db.exec('ANALYZE')
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    db.exec('VACUUM')
    db.close()
  }

  return S
}

/** Nur-Lese-Zugriff für den Server. */
export function oeffneStore(pfad) {
  const db = new DatabaseSync(pfad, { readOnly: true })
  return db
}
