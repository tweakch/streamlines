#!/usr/bin/env node
/*
 * asset-server.mjs — kleiner lokaler Server für den Terrain-Asset-Editor
 * (Stufe 0 der Asset-Pipeline: Editor → einzelne Dateien → Bake → Bundle).
 *
 * Drei Aufgaben:
 *   1. Statisches Ausliefern des Repos (der Editor läuft sonst per file://
 *      und darf dann kein fetch() auf localhost machen).
 *   2. Terrain-Assets als einzelne, im Explorer sichtbare Dateien lesen
 *      und schreiben (pipeline/assets/terrain/<key>.svg) — dieselbe Datei,
 *      ob sie im Editor oder in einem externen Vektortool bearbeitet wird.
 *   3. Genau EIN bekanntes Pipeline-Skript starten (bake-terrain-assets.mjs),
 *      kein Shell-Aufruf, kein frei wählbares Kommando — Ausgabe als NDJSON.
 *
 * Nur an 127.0.0.1 gebunden: reines Entwicklungswerkzeug.
 *
 * Aufruf:  node pipeline/asset-server.mjs [--port=8182]
 *          → http://127.0.0.1:8182/prototype/drafts/asset-editor-v1.html
 */
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PIPELINE = dirname(fileURLToPath(import.meta.url))
const REPO = join(PIPELINE, '..')
const ASSET_DIR = join(PIPELINE, 'assets', 'terrain')
const BAKE_SCRIPT = join(PIPELINE, 'bake-terrain-assets.mjs')

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => a.match(/^--([a-zA-Z]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]),
)
const PORT = Number(argv.port) || 8182

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
}

let laeuft = false // ein Publish zur Zeit

/* Nur Ordner/Schlüssel, für die tatsächlich etwas existiert — verhindert
   Path-Traversal über collection/key, ohne eine feste Liste zu pflegen. */
function vorhandeneKollektionen() {
  return readdirSync(ASSET_DIR).filter((f) => statSync(join(ASSET_DIR, f)).isDirectory()).sort()
}
function kollektionsPfad(collection) {
  if (!/^[a-z][a-z0-9_-]*$/.test(collection || '')) return null
  const p = join(ASSET_DIR, collection)
  return p.startsWith(ASSET_DIR + sep) && existsSync(p) && statSync(p).isDirectory() ? p : null
}
function vorhandeneKeys(collection) {
  const dir = kollektionsPfad(collection)
  if (!dir) return []
  return readdirSync(dir).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/\.svg$/, ''))
}
function pfadFuer(collection, key) {
  const dir = kollektionsPfad(collection)
  if (!dir || !/^[a-z][a-z0-9_-]*$/.test(key || '')) return null
  const p = join(dir, `${key}.svg`)
  return p.startsWith(dir + sep) ? p : null
}

function laufeBake(sende) {
  return new Promise((fertig) => {
    const kind = spawn(process.execPath, [BAKE_SCRIPT], { cwd: REPO, shell: false })
    const zeilenweise = (strom, kanal) => {
      let rest = ''
      strom.setEncoding('utf8')
      strom.on('data', (d) => {
        const teile = (rest + d).split(/\r?\n/)
        rest = teile.pop()
        for (const z of teile) if (z.trim()) sende({ type: 'log', kanal, zeile: z })
      })
      strom.on('end', () => { if (rest.trim()) sende({ type: 'log', kanal, zeile: rest }) })
    }
    zeilenweise(kind.stdout, 'out')
    zeilenweise(kind.stderr, 'err')
    kind.on('error', (err) => fertig({ code: -1, fehler: String(err.message || err) }))
    kind.on('close', (code) => fertig({ code }))
  })
}

/* ---------- HTTP ---------- */
function statisch(pfad, res) {
  const rel = normalize(decodeURIComponent(pfad)).replace(/^([/\\])+/, '')
  const datei = join(REPO, rel)
  if (datei !== REPO && !datei.startsWith(REPO + sep)) { res.writeHead(403).end('verboten'); return }
  if (!existsSync(datei) || !statSync(datei).isFile()) { res.writeHead(404).end('nicht gefunden'); return }
  res.writeHead(200, {
    'content-type': MIME[extname(datei).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store', // frisch gespeicherte/gebackene Daten sollen sofort sichtbar sein
  })
  createReadStream(datei).pipe(res)
}

async function liesBody(req, max) {
  let roh = ''
  req.setEncoding('utf8')
  for await (const stueck of req) {
    roh += stueck
    if (roh.length > max) throw new Error('Anfrage zu gross')
  }
  return roh
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')

  if (url.pathname === '/api/collections' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' })
    res.end(JSON.stringify({ collections: vorhandeneKollektionen() }))
    return
  }

  if (url.pathname === '/api/terrain-assets' && req.method === 'GET') {
    const collection = url.searchParams.get('collection') || ''
    const dir = kollektionsPfad(collection)
    if (!dir) { res.writeHead(404, { 'content-type': MIME['.json'] }); res.end(JSON.stringify({ fehler: `unbekannte Kollektion: ${collection}` })); return }
    const tiles = vorhandeneKeys(collection).sort().map((key) => ({ key, svg: readFileSync(join(dir, `${key}.svg`), 'utf8') }))
    res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' })
    res.end(JSON.stringify({ collection, tiles }))
    return
  }

  if (url.pathname === '/api/terrain-assets/save' && req.method === 'POST') {
    let body
    try { body = JSON.parse(await liesBody(req, 500_000)) }
    catch (err) { res.writeHead(400, { 'content-type': MIME['.json'] }); res.end(JSON.stringify({ fehler: String(err.message || err) })); return }
    const pfad = pfadFuer(body?.collection, body?.key)
    if (!pfad || !existsSync(pfad)) { res.writeHead(404, { 'content-type': MIME['.json'] }); res.end(JSON.stringify({ fehler: `unbekannt: ${body?.collection}/${body?.key}` })); return }
    if (typeof body.svg !== 'string' || !body.svg.includes('<svg')) { res.writeHead(400, { 'content-type': MIME['.json'] }); res.end(JSON.stringify({ fehler: 'svg fehlt oder ungültig' })); return }
    writeFileSync(pfad, body.svg)
    res.writeHead(200, { 'content-type': MIME['.json'] })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    if (laeuft) { res.writeHead(409, { 'content-type': MIME['.json'] }); res.end(JSON.stringify({ fehler: 'Es läuft bereits eine Veröffentlichung.' })); return }
    laeuft = true
    res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' })
    const sende = (ev) => res.write(JSON.stringify(ev) + '\n')
    sende({ type: 'start' })
    try {
      const { code, fehler } = await laufeBake(sende)
      sende({ type: 'fertig', ok: code === 0, message: code === 0 ? null : (fehler || `Abbruch mit Code ${code}`) })
    } catch (err) {
      sende({ type: 'fertig', ok: false, message: String(err?.message || err) })
    } finally {
      laeuft = false
      res.end()
    }
    return
  }

  if (req.method !== 'GET') { res.writeHead(405).end('Methode nicht erlaubt'); return }
  statisch(url.pathname === '/' ? '/prototype/drafts/asset-editor-v1.html' : url.pathname, res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Asset-Server läuft auf http://127.0.0.1:${PORT}`)
  console.log(`Editor:  http://127.0.0.1:${PORT}/prototype/drafts/asset-editor-v1.html`)
  const kollektionen = vorhandeneKollektionen()
  console.log(`Terrain-Assets: ${ASSET_DIR} — Kollektionen: ${kollektionen.map((c) => `${c} (${vorhandeneKeys(c).length})`).join(', ')}`)
})
