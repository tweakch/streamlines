/*
 * Baut die PUBLISH-Fassung des Handbuchs nach dist/handbuch/index.html.
 *
 * Warum zur Build-Zeit und nicht per ?mode=publish:
 * Der Schalter im Handbuch blendet Karten nur per CSS aus – Verworfenes und
 * offene Fragen stehen weiterhin im ausgelieferten HTML und sind über
 * "Seitenquelltext anzeigen" lesbar. Für ein öffentliches Deployment müssen
 * die Karten deshalb VOR dem Ausliefern aus dem Dokument verschwinden.
 *
 * Seit dem Markdown-Umbau wird nicht mehr aus dem fertigen HTML
 * herausgeschnitten, sondern direkt aus den Kapitel-Quellen komponiert
 * (app/scripts/handbuch-lib.mjs über prototype/handbuch/*.md) — der
 * div-zählende Regex-Stripper ist damit Geschichte.
 *
 * Übernommen werden nur Karten mit data-s="done" (Umgesetzt) und
 * data-s="concept" (Konzept). Alles andere – idea, rej, open – fällt raus.
 *
 * Lokal testen:  npm run build:handbuch  (danach npm run preview)
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compose } from './handbuch-lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../dist/handbuch/index.html')

/** Nur diese Status erscheinen in der veröffentlichten Fassung. */
const PUBLISH_STATUSES = new Set(['done', 'concept'])

const { html: composed, kept, dropped } = compose({ statuses: PUBLISH_STATUSES })

if (kept === 0) {
  throw new Error('Keine einzige Publish-Karte gefunden — Abbruch statt leerer Seite.')
}

let out = composed

/* Publish-Ansicht erzwingen: Umschalter ausblenden … */
out = out.replace(
  '</head>',
  '<style>.viewbtn{display:none!important;}</style>\n</head>',
)
/* … und nach dem Seiten-Skript fest auf publish stellen. Der Ansichtswechsel
   lebt seit dem Baukasten-Umbau (21. Aug 2026) in SOT.doc. */
out = out.replace(
  /<\/script>\s*<\/body>/,
  '</script>\n<script>SOT.doc.setMode("publish",false);</script>\n</body>',
)
out = out.replace(
  '<!DOCTYPE html>',
  `<!DOCTYPE html>\n<!-- Erzeugt von app/scripts/build-handbuch.mjs — nicht bearbeiten.\n     Quelle: prototype/handbuch/*.md (komponiert über handbuch-lib.mjs)\n     Enthält nur Karten mit Status "Umgesetzt" und "Konzept". -->`,
)

mkdirSync(dirname(OUT), { recursive: true })

/* Das Handbuch verweist auf ../kit/ — in dist/ existiert das nicht.
   inline.mjs (die eine Wahrheit fürs Einbetten, auch beim Archivieren)
   ersetzt die Verweise durch ihren Inhalt. Die Zwischendatei liegt NEBEN
   der Quelle, damit die relativen ../kit/-Pfade beim Einbetten dieselben
   sind wie im Original. */
const INLINE = resolve(HERE, '../../prototype/kit/inline.mjs')
const TMP = resolve(HERE, '../../prototype/drafts/.build-handbuch.tmp.html')
writeFileSync(TMP, out, 'utf8')
try {
  execFileSync(process.execPath, [INLINE, TMP, '--out', OUT], { stdio: 'pipe' })
} finally {
  rmSync(TMP, { force: true })
}
const inlined = readFileSync(OUT, 'utf8')
if (/(href|src)="[^"]*kit\//.test(inlined)) {
  throw new Error('dist/handbuch verweist noch auf kit/ — Einbetten fehlgeschlagen.')
}

console.log(
  `handbuch: ${kept} Karten veröffentlicht, ${dropped} zurückgehalten\n` +
    `          → dist/handbuch/index.html · lokal testen: npm run preview, dann /handbuch/ (mit Schrägstrich)`,
)
