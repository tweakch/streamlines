#!/usr/bin/env node
/*
 * ingest.mjs — Stufe 4 der Karten-Pipeline: aus dem Erzeugnis wird eine
 * abfragbare Datenbank.
 *
 *   sources/*.json  →  bake-overlays.mjs  →  out/karte.sqlite  →  HIER  →  Postgres
 *
 * Warum überhaupt Postgres, wenn out/karte.sqlite schon eine Datenbank ist?
 * Weil die SQLite ein ERZEUGNIS ist — sie wird bei jedem Bake gelöscht und neu
 * gebaut (siehe lib/store.mjs). Die Naturengine braucht daneben einen Ort, der
 * NICHT weggeworfen wird: Quellen, Befunde, Bedingungen, Artparameter,
 * Simulationsläufe. Beides steht in derselben Datenbank, aber in zwei
 * getrennten Hälften — die Grenze ist in schema.sql beschrieben.
 *
 * Diese Stufe ist damit die einzige, die schreibt, ohne zu rechnen: sie
 * überträgt, sie interpretiert nicht. Deshalb hat sie auch kein
 * Herkunftsprotokoll — es gibt nichts auszustossen, was das Bake nicht schon
 * verbucht hätte.
 *
 * Aufruf:
 *   Normalfall — die Ressource „pipeline" im Aspire-Dashboard starten.
 *   Von Hand:   ConnectionStrings__welten=… node pipeline/ingest/ingest.mjs
 *
 *   --bake         vorher bake-overlays.mjs laufen lassen (ohne dies wird nur
 *                  gebacken, wenn out/karte.sqlite ganz fehlt)
 *   --karte=<pfad> andere SQLite lesen (Standard: ../out/karte.sqlite)
 *   --nur-schema   nur Schema anlegen/aktualisieren, nichts übertragen
 *   --hilfe        diese Liste
 */
import { DatabaseSync } from 'node:sqlite'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pgConfig, verbindungAlsText } from './verbindung.mjs'

const HIER = dirname(fileURLToPath(import.meta.url))
const PIPELINE = join(HIER, '..')

const argv = process.argv.slice(2)
const schalter = (k) => argv.includes(`--${k}`)
const wert = (k, d = null) => {
  const a = argv.find((x) => x.startsWith(`--${k}=`))
  return a ? a.slice(k.length + 3) : d
}

if (schalter('hilfe')) {
  console.log(readFileSync(new URL(import.meta.url)).toString().split('*/')[0])
  process.exit(0)
}

const KARTE = wert('karte', join(PIPELINE, 'out', 'karte.sqlite'))
const BAKE = join(PIPELINE, 'bake-overlays.mjs')

/* ---------- Die fünf Evidenz-Tore ----------
 * Projektkanon, nicht erhobene Daten: die historischen Fixpunkte, gegen die
 * die Naturengine gemessen wird. Sie sind Zielbereiche, keine exakten Karten —
 * ein Lauf bekommt je Tor einen Score, und aus den fünf Scores fällt der
 * Fehler, an dem der Optimierer arbeitet.
 *
 * Sie stehen hier und nicht in schema.sql, weil sie Daten sind und kein
 * Schema: ein Tor dazuzunehmen heisst, diese Tabelle zu ergänzen. */
const TORE = [
  {
    id: 'g1',
    zeit_bp: 40000,
    name: 'Kaltzeitliche Landschaft',
    erwartung:
      'Starke Vergletscherung, offene Vegetation, Tundra und Steppe, ' +
      'eiszeitliche Fauna. Kein geschlossener Wald.',
  },
  {
    id: 'g2',
    zeit_bp: 30000,
    name: 'Abkühlung Richtung LGM',
    erwartung:
      'Eis nimmt zu, Wald nimmt ab, offene Vegetation dominiert. ' +
      'Übergang, nicht Endzustand.',
  },
  {
    id: 'g3',
    zeit_bp: 20000,
    name: 'Letzteiszeitliches Maximum',
    erwartung:
      'Maximale bis nahezu maximale Vergletscherung, sehr kaltes Klima, ' +
      'offene Vegetation in den eisfreien Gebieten, typische eiszeitliche ' +
      'Fauna. Das stärkste der fünf Tore.',
  },
  {
    id: 'g4',
    zeit_bp: 10000,
    name: 'Frühes Holozän',
    erwartung:
      'Gletscher ziehen sich zurück, Seen und Flüsse verlagern sich, ' +
      'Pioniervegetation, Birke und Kiefer breiten sich aus — Übergang zur ' +
      'bewaldeten Landschaft.',
  },
  {
    id: 'g5',
    zeit_bp: 0,
    name: 'Heute',
    erwartung:
      'Kalibrierung an der modernen Welt. Dabei ist der Naturzustand vom ' +
      'menschlich veränderten Zustand zu trennen: die heutige Landschaft ist ' +
      'massiv durch Menschen geprägt und darf nicht als Naturzustand gelten.',
  },
]

/* Die Erzeugnis-Hälfte. Reihenfolge egal — ein TRUNCATE über alle Tabellen in
   EINER Anweisung räumt die Fremdschlüssel unter sich selbst auf. */
const ERZEUGNIS = [
  'natur.kachel', 'natur.zellwert', 'natur.klasse', 'natur.overlay',
  'natur.ebene', 'natur.ledger', 'natur.datenquelle', 'natur.karte_meta',
]

/* Die Wissens-Hälfte — wird hier nur GEZÄHLT, nie geschrieben. */
const WISSEN = [
  'natur.quelle', 'natur.art', 'natur.art_parameter', 'natur.befund',
  'natur.befund_kandidat', 'natur.bedingung', 'natur.tor',
  'natur.parametersatz', 'natur.lauf', 'natur.zustand',
]

/* ---------- Bake bei Bedarf ---------- */
function laufeBake() {
  return new Promise((fertig, scheitern) => {
    console.log(`\n▸ ${BAKE}\n`)
    const kind = spawn(process.execPath, ['--no-warnings', BAKE], {
      cwd: PIPELINE,
      stdio: 'inherit',
      shell: false,
    })
    kind.on('error', scheitern)
    kind.on('close', (code) =>
      code === 0
        ? fertig()
        : scheitern(new Error(`bake-overlays.mjs brach mit Code ${code} ab`)),
    )
  })
}

/* ---------- Schreibhilfe ----------
 * Mehrzeilige INSERTs in Stapeln. Postgres verträgt 65535 Parameter je
 * Anweisung; 1500 sind reichlich darunter und halten die Nutzlast bei
 * BLOB-Spalten (eine Kachel = 1024 Byte) im vernünftigen Rahmen. */
async function schreibe(client, tabelle, spalten, zeilen) {
  if (!zeilen.length) return 0
  const stapel = Math.max(1, Math.floor(1500 / spalten.length))
  for (let i = 0; i < zeilen.length; i += stapel) {
    const teil = zeilen.slice(i, i + stapel)
    const werte = []
    const platzhalter = teil.map(
      (zeile) =>
        `(${zeile.map((v) => `$${werte.push(v)}`).join(',')})`,
    )
    await client.query(
      `insert into ${tabelle} (${spalten.join(',')}) values ${platzhalter.join(',')}`,
      werte,
    )
  }
  return zeilen.length
}

/** node:sqlite gibt BLOBs als Uint8Array, `pg` will für bytea einen Buffer. */
const bytes = (u8) =>
  u8 == null ? null : Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)

/* ---------- Lauf ---------- */
async function main() {
  const { default: pg } = await import('pg').catch(() => {
    throw new Error(
      'Das Paket „pg" fehlt. Einmalig installieren:\n' +
        '  npm install --prefix pipeline/ingest',
    )
  })

  if (schalter('bake') || !existsSync(KARTE)) {
    if (!existsSync(KARTE))
      console.log(`${KARTE} fehlt — die Overlay-Stufe läuft zuerst.`)
    await laufeBake()
  }

  const conf = pgConfig(process.env.ConnectionStrings__welten)
  const client = new pg.Client(conf)
  await client.connect()
  console.log(`Datenbank: ${verbindungAlsText(conf)}`)

  try {
    /* --- Schema --- */
    await client.query(readFileSync(join(HIER, 'schema.sql'), 'utf8'))
    console.log('Schema „natur" angelegt/aktualisiert.')

    /* --- Tore: Kanon, darum auch bei bestehenden Zeilen nachziehen --- */
    await client.query(
      `insert into natur.tor (id, zeit_bp, name, erwartung)
       select * from unnest($1::text[], $2::int[], $3::text[], $4::text[])
       on conflict (id) do update
         set zeit_bp = excluded.zeit_bp,
             name = excluded.name,
             erwartung = excluded.erwartung`,
      [
        TORE.map((t) => t.id),
        TORE.map((t) => t.zeit_bp),
        TORE.map((t) => t.name),
        TORE.map((t) => t.erwartung),
      ],
    )
    console.log(`${TORE.length} Evidenz-Tore aktuell.`)

    if (schalter('nur-schema')) {
      await zeigeStand(client)
      return
    }

    /* --- Karte lesen --- */
    const karte = new DatabaseSync(KARTE, { readOnly: true })
    const alle = (sql) => karte.prepare(sql).all()
    const meta = Object.fromEntries(
      alle('select schluessel, wert from meta').map((m) => [m.schluessel, m.wert]),
    )

    const overlays = alle('select * from overlay')
    if (!overlays.length)
      throw new Error(
        `${KARTE} enthält keine Overlays — die Overlay-Stufe ist nicht ` +
          `durchgelaufen. Mit --bake neu backen.`,
      )

    const quellen = JSON.parse(meta.quellen ?? '[]')
    const ebenen = alle('select * from ebene')
    const klassen = alle('select * from klasse')
    const kacheln = alle('select * from kachel')
    const zellwerte = alle('select * from zellwert')
    const ledger = alle('select * from ledger')
    karte.close()

    /* --- Übertragen, in EINER Transaktion ---
     * Entweder die Karte ist ganz drin oder die alte bleibt stehen. Eine halb
     * übertragene Karte wäre schlimmer als eine veraltete: sie sieht gültig
     * aus. */
    const t0 = Date.now()
    await client.query('begin')
    await client.query(`truncate ${ERZEUGNIS.join(', ')} restart identity`)

    const gezaehlt = {}
    const zaehle = async (tabelle, spalten, zeilen) => {
      gezaehlt[tabelle.replace('natur.', '')] = await schreibe(
        client, tabelle, spalten, zeilen,
      )
    }

    await zaehle(
      'natur.datenquelle',
      ['datei', 'art', 'merkmale', 'quelle', 'beschreibung', 'lizenz', 'crs', 'stand'],
      quellen.map((q) => [
        q.datei, q.kind, q.anzahl ?? null, q.quelle ?? null,
        q.beschreibung ?? null, q.lizenz ?? null, q.crs ?? null, q.stand ?? null,
      ]),
    )

    await zaehle(
      'natur.ebene',
      ['id', 'hex_km', 'cols', 'zeilen', 'kachel', 'region'],
      ebenen.map((e) => [e.id, e.hex_km, e.cols, e.rows, e.kachel, e.region]),
    )

    await zaehle(
      'natur.overlay',
      ['id', 'name', 'gruppe', 'einheit', 'kodierung', 'ebenen', 'quellen',
        'notiz', 'skala', 'quelle_fehlt', 'belegt', 'inspiriert', 'erfunden'],
      overlays.map((o) => [
        o.id, o.name, o.gruppe, o.einheit, o.kodierung, o.ebenen, o.quellen,
        o.notiz, o.skala, !!o.quelle_fehlt, o.belegt, o.inspiriert, o.erfunden,
      ]),
    )

    await zaehle(
      'natur.klasse',
      ['overlay', 'wert', 'schluessel', 'name', 'farbe', 'extra'],
      klassen.map((k) => [k.overlay, k.wert, k.schluessel, k.name, k.farbe, k.extra]),
    )

    await zaehle(
      'natur.kachel',
      ['overlay', 'ebene', 'tx', 'ty', 'hash', 'gesetzt', 'daten'],
      kacheln.map((k) => [
        k.overlay, k.ebene, k.tx, k.ty, k.hash, k.gesetzt, bytes(k.daten),
      ]),
    )

    await zaehle(
      'natur.zellwert',
      ['ebene', 'overlay', 'c', 'r', 'wert'],
      zellwerte.map((z) => [z.ebene, z.overlay, z.c, z.r, z.wert]),
    )

    await zaehle(
      'natur.ledger',
      ['stufe', 'quelle', 'ebene', 'eingabe', 'ausgabe', 'ausgestossen',
        'belegt', 'inspiriert', 'erfunden', 'posten'],
      ledger.map((l) => [
        l.stufe, l.quelle, l.ebene, l.eingabe, l.ausgabe, l.ausgestossen,
        l.belegt, l.inspiriert, l.erfunden, l.posten,
      ]),
    )

    await zaehle(
      'natur.karte_meta',
      ['schluessel', 'wert'],
      [
        ...Object.entries(meta),
        ['ingestiert', new Date().toISOString()],
        ['ingest_quelle', KARTE],
      ].map(([k, v]) => [k, String(v)]),
    )

    await client.query('commit')
    const ms = Date.now() - t0

    /* --- Bericht --- */
    console.log('\n  Übertragen nach Schema „natur"')
    console.log('  ' + '─'.repeat(46))
    for (const [tabelle, n] of Object.entries(gezaehlt))
      console.log(`  ${tabelle.padEnd(16)}${String(n).padStart(10)}`)
    console.log('  ' + '─'.repeat(46))
    console.log(`  in ${ms} ms\n`)

    if (meta.realitaetsnaehe) {
      const n = JSON.parse(meta.realitaetsnaehe)
      const pct = (x) => (x * 100).toFixed(1) + ' %'
      console.log(
        `  Realitätsnähe der Karte: belegt ${pct(n.anteil.belegt)} · ` +
          `inspiriert ${pct(n.anteil.inspiriert)} · ` +
          `erfunden ${pct(n.anteil.erfunden)}`,
      )
      console.log(`  gebacken: ${meta.erzeugt}\n`)
    }

    await zeigeStand(client)
  } catch (err) {
    await client.query('rollback').catch(() => {})
    throw err
  } finally {
    await client.end()
  }
}

/* Was in der Wissens-Hälfte steht. Absichtlich auch dann gezeigt, wenn alles
   auf 0 steht: die leeren Tabellen SIND der nächste Arbeitsvorrat. */
async function zeigeStand(client) {
  const { rows } = await client.query(
    WISSEN.map((t) => `select '${t.replace('natur.', '')}' t, count(*) n from ${t}`)
      .join(' union all '),
  )
  console.log('  Naturengine — Stand des Wissens')
  console.log('  ' + '─'.repeat(46))
  for (const r of rows)
    console.log(`  ${r.t.padEnd(16)}${String(r.n).padStart(10)}`)
  console.log('  ' + '─'.repeat(46) + '\n')
}

main().catch((err) => {
  console.error(`\nIngest abgebrochen: ${err.message}\n`)
  process.exit(1)
})
