#!/usr/bin/env node
/*
 * serve.mjs — kleiner lokaler Server, damit ein Prototyp die Pipeline
 * anstossen kann (Stufe 0 der Werkzeugkette: Viewer → Pipeline).
 *
 * Zwei Aufgaben:
 *   1. Statisches Ausliefern des Repos (der Viewer läuft sonst per file://
 *      und darf dann kein fetch() auf localhost machen).
 *   2. Eine schmale API, die genau ZWEI bekannte Pipeline-Skripte startet —
 *      fetch/normalize-dtm.mjs und bake.mjs — mit streng geprüften
 *      Zahlenargumenten. Kein Shell-Aufruf, keine frei wählbaren Kommandos.
 *
 * Nur an 127.0.0.1 gebunden: reines Entwicklungswerkzeug, nichts davon ist
 * für ein offenes Netz gedacht.
 *
 * Aufruf:  node pipeline/serve.mjs [--port=8181]
 *          → http://127.0.0.1:8181/prototype/drafts/rhein-tiles-v4.html
 */
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PIPELINE = dirname(fileURLToPath(import.meta.url))
const REPO = join(PIPELINE, '..')
const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => a.match(/^--([a-zA-Z]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]),
)
const PORT = Number(argv.port) || 8181

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
}

/* ---------- Pipeline-Stufen: die einzigen Skripte, die dieser Server startet ---------- */
const STUFEN = [
  { id: 'dtm', label: 'Höhendaten zuschneiden', script: join(PIPELINE, 'fetch', 'normalize-dtm.mjs'), regionArgs: true },
  { id: 'bake', label: 'Tileset backen', script: join(PIPELINE, 'bake.mjs'), regionArgs: false },
]

let laeuft = false // ein Lauf zur Zeit — beide Stufen schreiben dieselben Dateien

/* Region der aktuellen Höhenquelle (für die Anzeige „aktuell" im Viewer). */
function aktuelleRegion() {
  const f = join(PIPELINE, 'sources', 'sonny-dtm-ch50.grid.json')
  if (!existsSync(f)) return null
  try {
    const m = JSON.parse(readFileSync(f, 'utf8')).meta
    return {
      name: m.region, spacing: Math.round(m.dLat * 110600),
      lonW: m.lon0, lonE: m.lon0 + m.dLon * (m.cols - 1),
      latN: m.lat0, latS: m.lat0 - m.dLat * (m.rows - 1),
      cols: m.cols, rows: m.rows,
    }
  } catch { return null }
}

/* Strenge Prüfung: nur endliche Zahlen in plausiblen Grenzen kommen als
   Argument an ein Kindprozess — und auch nur als --key=zahl. */
function pruefeRegion(body) {
  const zahl = (k, min, max) => {
    const v = Number(body?.[k])
    if (!Number.isFinite(v) || v < min || v > max) throw new Error(`${k}: Zahl zwischen ${min} und ${max} erwartet`)
    return v
  }
  const r = {
    lonW: zahl('lonW', -180, 180), lonE: zahl('lonE', -180, 180),
    latS: zahl('latS', -90, 90), latN: zahl('latN', -90, 90),
    spacing: body?.spacing == null ? 200 : zahl('spacing', 20, 5000),
  }
  if (!(r.lonW < r.lonE) || !(r.latS < r.latN)) throw new Error('Ungültige Box: lonW < lonE und latS < latN erforderlich')
  return r
}

/* Eine Stufe starten und ihre Ausgabe zeilenweise als Ereignis melden. */
function laufeStufe(stufe, region, sende) {
  return new Promise((fertig) => {
    const args = [stufe.script]
    if (stufe.regionArgs) {
      args.push(`--lonW=${region.lonW}`, `--lonE=${region.lonE}`, `--latS=${region.latS}`,
        `--latN=${region.latN}`, `--spacing=${region.spacing}`, '--name=viewer')
    }
    const kind = spawn(process.execPath, args, { cwd: REPO, shell: false })
    const zeilenweise = (strom, kanal) => {
      let rest = ''
      strom.setEncoding('utf8')
      strom.on('data', (d) => {
        const teile = (rest + d).split(/\r?\n/)
        rest = teile.pop()
        for (const z of teile) if (z.trim()) sende({ type: 'log', stufe: stufe.id, kanal, zeile: z })
      })
      strom.on('end', () => { if (rest.trim()) sende({ type: 'log', stufe: stufe.id, kanal, zeile: rest }) })
    }
    zeilenweise(kind.stdout, 'out')
    zeilenweise(kind.stderr, 'err')
    kind.on('error', (err) => fertig({ code: -1, fehler: String(err.message || err) }))
    kind.on('close', (code) => fertig({ code }))
  })
}

async function laufePipeline(region, sende) {
  for (const [i, stufe] of STUFEN.entries()) {
    sende({ type: 'stufe', id: stufe.id, label: stufe.label, index: i, gesamt: STUFEN.length })
    const { code, fehler } = await laufeStufe(stufe, region, sende)
    if (code !== 0) {
      sende({ type: 'fehler', stufe: stufe.id, message: fehler || `${stufe.label}: Abbruch mit Code ${code}` })
      return false
    }
    sende({ type: 'stufeFertig', id: stufe.id, index: i, gesamt: STUFEN.length })
  }
  return true
}

/* ---------- HTTP ---------- */
function statisch(pfad, res) {
  /* Traversal-Schutz: aufgelöster Pfad muss im Repo bleiben. */
  const rel = normalize(decodeURIComponent(pfad)).replace(/^([/\\])+/, '')
  const datei = join(REPO, rel)
  if (datei !== REPO && !datei.startsWith(REPO + sep)) { res.writeHead(403).end('verboten'); return }
  if (!existsSync(datei) || !statSync(datei).isFile()) { res.writeHead(404).end('nicht gefunden'); return }
  res.writeHead(200, {
    'content-type': MIME[extname(datei).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store', // frisch gebackene Daten sollen sofort sichtbar sein
  })
  createReadStream(datei).pipe(res)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')

  if (url.pathname === '/api/region') {
    res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' })
    res.end(JSON.stringify({ region: aktuelleRegion() }))
    return
  }

  if (url.pathname === '/api/pipeline/run' && req.method === 'POST') {
    let roh = ''
    req.setEncoding('utf8')
    for await (const stueck of req) {
      roh += stueck
      if (roh.length > 10_000) { res.writeHead(413).end('Anfrage zu gross'); return }
    }
    let region
    try { region = pruefeRegion(JSON.parse(roh || '{}')) }
    catch (err) {
      res.writeHead(400, { 'content-type': MIME['.json'] })
      res.end(JSON.stringify({ fehler: String(err.message || err) }))
      return
    }
    if (laeuft) {
      res.writeHead(409, { 'content-type': MIME['.json'] })
      res.end(JSON.stringify({ fehler: 'Es läuft bereits ein Pipeline-Lauf.' }))
      return
    }
    laeuft = true
    /* NDJSON-Strom: eine Zeile je Ereignis, der Viewer liest mit einem Reader mit. */
    res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' })
    const sende = (ev) => res.write(JSON.stringify(ev) + '\n')
    sende({ type: 'start', region, stufen: STUFEN.map((s) => ({ id: s.id, label: s.label })) })
    try {
      const ok = await laufePipeline(region, sende)
      sende({ type: 'fertig', ok, region: ok ? aktuelleRegion() : null })
    } catch (err) {
      sende({ type: 'fehler', message: String(err?.message || err) })
      sende({ type: 'fertig', ok: false })
    } finally {
      laeuft = false
      res.end()
    }
    return
  }

  if (req.method !== 'GET') { res.writeHead(405).end('Methode nicht erlaubt'); return }
  statisch(url.pathname === '/' ? '/prototype/drafts/rhein-tiles-v4.html' : url.pathname, res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Pipeline-Server läuft auf http://127.0.0.1:${PORT}`)
  console.log(`Viewer:  http://127.0.0.1:${PORT}/prototype/drafts/rhein-tiles-v4.html`)
  const r = aktuelleRegion()
  if (r) console.log(`aktuelle Höhenregion: ${r.lonW.toFixed(2)}–${r.lonE.toFixed(2)}°O, ${r.latS.toFixed(2)}–${r.latN.toFixed(2)}°N (${r.cols}×${r.rows})`)
})
