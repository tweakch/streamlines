/*
 * Baut die PUBLISH-Fassung des Handbuchs nach dist/handbuch/index.html.
 *
 * Warum zur Build-Zeit und nicht per ?mode=publish:
 * Der Schalter im Handbuch blendet Karten nur per CSS aus – Verworfenes und
 * offene Fragen stehen weiterhin im ausgelieferten HTML und sind über
 * "Seitenquelltext anzeigen" lesbar. Für ein öffentliches Deployment müssen
 * die Karten deshalb VOR dem Ausliefern aus dem Dokument verschwinden.
 *
 * Übernommen werden nur Karten mit data-s="done" (Umgesetzt) und
 * data-s="concept" (Konzept). Alles andere – idea, rej, open – fällt raus.
 *
 * Lokal testen:  npm run build:handbuch  (danach npm run preview)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(HERE, '../../prototype/drafts/stromlinien-handbuch.html')
const OUT = resolve(HERE, '../dist/handbuch/index.html')

/** Nur diese Status erscheinen in der veröffentlichten Fassung. */
const PUBLISH_STATUSES = new Set(['done', 'concept'])

/**
 * Findet das schließende </div> zum <div>, das bei `start` beginnt —
 * über Tiefenzählung, weil Karten innen weitere <div> enthalten (.why, .chead).
 */
function findClosingDiv(html, start) {
  const re = /<\/?div\b[^>]*>/g
  re.lastIndex = start
  let depth = 0
  let m
  while ((m = re.exec(html)) !== null) {
    depth += m[0][1] === '/' ? -1 : 1
    if (depth === 0) return re.lastIndex
  }
  throw new Error(`Unbalanciertes <div> ab Index ${start} — Handbuch-Struktur prüfen.`)
}

function stripNonPublishCards(html) {
  const OPEN = '<div class="card'
  let out = ''
  let pos = 0
  let kept = 0
  const dropped = {}

  for (;;) {
    const start = html.indexOf(OPEN, pos)
    if (start === -1) {
      out += html.slice(pos)
      break
    }
    const tag = html.slice(start, html.indexOf('>', start) + 1)
    const status = tag.match(/data-s="([a-z]+)"/)?.[1] ?? null
    const end = findClosingDiv(html, start)

    out += html.slice(pos, start)
    if (status && PUBLISH_STATUSES.has(status)) {
      out += html.slice(start, end)
      kept++
    } else {
      dropped[status ?? 'ohne-status'] = (dropped[status ?? 'ohne-status'] ?? 0) + 1
    }
    pos = end
  }
  return { html: out, kept, dropped }
}

const source = readFileSync(SRC, 'utf8')
const { html: stripped, kept, dropped } = stripNonPublishCards(source)

if (kept === 0) {
  throw new Error('Keine einzige Publish-Karte gefunden — Abbruch statt leerer Seite.')
}

let out = stripped

/* Publish-Ansicht erzwingen: Umschalter ausblenden … */
out = out.replace(
  '</head>',
  '<style>.viewbtn{display:none!important;}</style>\n</head>',
)
/* … und nach dem Seiten-Skript fest auf publish stellen. Das Skript selbst
   bleibt unangetastet (es referenziert IDs wie #count, die erhalten bleiben). */
out = out.replace(
  /<\/script>\s*<\/body>/,
  '</script>\n<script>setMode("publish",false);</script>\n</body>',
)
out = out.replace(
  '<!DOCTYPE html>',
  `<!DOCTYPE html>\n<!-- Erzeugt von app/scripts/build-handbuch.mjs — nicht bearbeiten.\n     Quelle: prototype/drafts/stromlinien-handbuch.html\n     Enthält nur Karten mit Status "Umgesetzt" und "Konzept". -->`,
)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, out, 'utf8')

const droppedTotal = Object.values(dropped).reduce((a, b) => a + b, 0)
const droppedTxt =
  Object.entries(dropped)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ') || 'keine'
console.log(
  `handbuch: ${kept} Karten veröffentlicht, ${droppedTotal} zurückgehalten (${droppedTxt})\n` +
    `          → dist/handbuch/index.html · lokal testen: npm run preview, dann /handbuch/ (mit Schrägstrich)`,
)
