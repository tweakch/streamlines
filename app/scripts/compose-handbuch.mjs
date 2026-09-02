/*
 * compose-handbuch.mjs — baut prototype/drafts/stromlinien-handbuch.html
 * aus den Markdown-Kapiteln in prototype/handbuch/.
 *
 *   npm run compose:handbuch            schreibt das HTML neu
 *   npm run compose:handbuch -- --check prüft nur, ob das HTML aktuell ist
 *                                       (Exit 1 bei Drift — für CI/Hooks)
 *
 * Das erzeugte HTML bleibt eingecheckt, damit das Handbuch doppelklickbar
 * bleibt (Werkstatt-Regel). Bearbeitet wird NUR das Markdown.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compose, lf } from './handbuch-lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../../prototype/drafts/stromlinien-handbuch.html')

const MARKER =
  '<!-- ERZEUGT aus prototype/handbuch/*.md — NICHT von Hand bearbeiten.\n' +
  '     Inhalt ändern: Markdown-Kapitel editieren, dann in app/:  npm run compose:handbuch\n' +
  '     Jede Karte trägt eine id — ?karte=<id> öffnet sie direkt. -->'

const { html: body, kept, files } = compose()
const html = body.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + MARKER)

if (process.argv.includes('--check')) {
  /* lf(): das eingecheckte HTML kommt nach einem Checkout mit CRLF zurück
     (autocrlf), das Komponierte ist immer LF — ohne Normalisierung meldete
     der Vergleich Drift, wo keine ist. */
  const current = existsSync(OUT) ? lf(readFileSync(OUT, 'utf8')) : ''
  if (current === html) {
    console.log(`handbuch aktuell (${kept} Karten aus ${files.length} Kapiteln).`)
  } else {
    console.error('DRIFT: prototype/drafts/stromlinien-handbuch.html entspricht nicht dem Markdown.')
    console.error('Beheben: npm run compose:handbuch (in app/). Das HTML nie von Hand ändern.')
    process.exit(1)
  }
} else {
  writeFileSync(OUT, html, 'utf8')
  console.log(`handbuch: ${kept} Karten aus ${files.length} Kapiteln → prototype/drafts/stromlinien-handbuch.html`)
}
