#!/usr/bin/env node
/*
 * server.js — die schmale Spielstand-API.
 *
 * Bildet genau die Aufrufe nach, die app/src/shell/storage.ts heute gegen
 * localStorage macht: Profile anlegen und auflisten, Spielstand lesen und
 * schreiben. Nichts weiter — der Rest des Spiels bleibt im Client.
 *
 * Konfiguration kommt ausschliesslich aus der Umgebung, die das Aspire-Harness
 * setzt. Es gibt hier keine Vorgabewerte fuer Verbindungen: laeuft der Dienst
 * ohne Harness, soll er laut scheitern und nicht stumm ins Leere zeigen.
 *
 *   PORT                        Port (Aspire)
 *   ConnectionStrings__welten   Postgres (Npgsql-Format)
 *   ConnectionStrings__cache    Valkey   (host:port[,password=…])
 */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import pg from 'pg'
import { createClient } from 'redis'

import { CONTRACT_VERSION, SAVE_VERSION } from '../contract/contract.js'

const PORT = Number(process.env.PORT) || 3001

/* ---------- Verbindungszeichenfolgen uebersetzen ----------
 * Aspire spricht .NET: Postgres kommt als "Host=…;Port=…;Username=…", Valkey
 * als "host:port[,password=…]". Beide Node-Clients wollen etwas anderes. Das
 * ist die ganze Reibung zwischen den zwei Oekosystemen, und sie lebt hier. */

function pgConfig(cs) {
  if (!cs) throw new Error('ConnectionStrings__welten fehlt — laeuft das Harness?')
  if (/^postgres(ql)?:\/\//.test(cs)) return { connectionString: cs }
  const kv = paare(cs, ';')
  return {
    host: kv.host,
    port: Number(kv.port) || 5432,
    user: kv.username ?? kv.userid ?? kv.user,
    password: kv.password,
    database: kv.database,
  }
}

function valkeyUrl(cs) {
  if (!cs) throw new Error('ConnectionStrings__cache fehlt — laeuft das Harness?')
  if (/^rediss?:\/\//.test(cs)) return cs
  const [hostPort, ...rest] = cs.split(',')
  const kv = paare(rest.join(','), ',')
  const auth = kv.password ? `:${encodeURIComponent(kv.password)}@` : ''
  return `redis://${auth}${hostPort.trim()}`
}

function paare(text, trenner) {
  return Object.fromEntries(
    text
      .split(trenner)
      .filter((teil) => teil.includes('='))
      .map((teil) => {
        const i = teil.indexOf('=')
        return [teil.slice(0, i).trim().toLowerCase(), teil.slice(i + 1).trim()]
      }),
  )
}

/* ---------- Verbindungen ---------- */

const db = new pg.Pool(pgConfig(process.env.ConnectionStrings__welten))
const cache = createClient({ url: valkeyUrl(process.env.ConnectionStrings__cache) })
cache.on('error', (err) => console.error('Valkey:', err.message))
await cache.connect()

/* Schema idempotent anlegen. Reicht fuer diese Stufe; sobald sich das Schema
 * wirklich bewegt, gehoert hier ein Migrationswerkzeug hin (Flyway ist als
 * Aspire-Integration vorhanden) — nicht ein zweites "create table if not". */
await db.query(`
  create table if not exists profiles (
    id         text primary key,
    name       text not null,
    created_at bigint not null
  );
  create table if not exists saves (
    profile_id text primary key references profiles(id) on delete cascade,
    v          integer not null,
    state      jsonb not null,
    last_event text,
    saved_at   bigint not null
  );
`)

const CACHE_TTL = 60
const saveKey = (profileId) => `save:${profileId}`

/* ---------- Routen ---------- */

const app = new Hono()

app.get('/api/health', async (c) => {
  const db_ = await lebt(() => db.query('select 1'))
  const cache_ = await lebt(() => cache.ping())
  return c.json(
    {
      ok: db_ && cache_,
      contract: CONTRACT_VERSION,
      db: db_ ? 'up' : 'down',
      cache: cache_ ? 'up' : 'down',
    },
    db_ && cache_ ? 200 : 503,
  )
})

app.get('/api/profiles', async (c) => {
  const { rows } = await db.query(
    'select id, name, created_at from profiles order by created_at',
  )
  return c.json(rows.map(zuProfil))
})

app.post('/api/profiles', async (c) => {
  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return c.json({ fehler: 'name fehlt' }, 400)

  const profil = { id: crypto.randomUUID(), name, createdAt: Date.now() }
  await db.query('insert into profiles (id, name, created_at) values ($1, $2, $3)', [
    profil.id,
    profil.name,
    profil.createdAt,
  ])
  return c.json(profil, 201)
})

/* Lesen geht durch den Cache — der Spielstand wird bei jedem Weltwechsel
 * geholt, aber selten geschrieben. X-Cache macht den Treffer sichtbar, damit
 * man im Draft sieht, dass der Cache wirklich arbeitet. */
app.get('/api/profiles/:id/save', async (c) => {
  const id = c.req.param('id')

  const gecacht = await cache.get(saveKey(id))
  if (gecacht) {
    c.header('X-Cache', 'hit')
    return c.body(gecacht, 200, { 'content-type': 'application/json' })
  }

  const { rows } = await db.query(
    'select v, state, last_event, saved_at from saves where profile_id = $1',
    [id],
  )
  c.header('X-Cache', 'miss')
  if (rows.length === 0) return c.json(null)

  const stand = zuStand(rows[0])
  await cache.set(saveKey(id), JSON.stringify(stand), { EX: CACHE_TTL })
  return c.json(stand)
})

app.put('/api/profiles/:id/save', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ fehler: 'kein Koerper' }, 400)
  if (body.v !== SAVE_VERSION) {
    return c.json({ fehler: `Spielstand-Version ${body.v}, erwartet ${SAVE_VERSION}` }, 409)
  }

  const stand = {
    v: SAVE_VERSION,
    state: body.state ?? {},
    lastEvent: body.lastEvent ?? null,
    savedAt: Date.now(),
  }

  const bekannt = await db.query('select 1 from profiles where id = $1', [id])
  if (bekannt.rowCount === 0) return c.json({ fehler: 'unbekanntes Profil' }, 404)

  await db.query(
    `insert into saves (profile_id, v, state, last_event, saved_at)
     values ($1, $2, $3, $4, $5)
     on conflict (profile_id) do update
       set v = excluded.v, state = excluded.state,
           last_event = excluded.last_event, saved_at = excluded.saved_at`,
    [id, stand.v, stand.state, stand.lastEvent, stand.savedAt],
  )

  await cache.del(saveKey(id))
  return c.json(stand)
})

/* ---------- Kleinkram ---------- */

async function lebt(pruefung) {
  try {
    await pruefung()
    return true
  } catch {
    return false
  }
}

const zuProfil = (r) => ({ id: r.id, name: r.name, createdAt: Number(r.created_at) })

const zuStand = (r) => ({
  v: r.v,
  state: r.state,
  lastEvent: r.last_event,
  savedAt: Number(r.saved_at),
})

/* An 0.0.0.0, damit das Gateway (Container) hereinreicht. */
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`Spielstand-API auf http://0.0.0.0:${info.port} (Vertrag ${CONTRACT_VERSION})`)
})
