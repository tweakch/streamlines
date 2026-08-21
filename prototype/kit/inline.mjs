/* ============================================================================
   inline.mjs — Baukasten in eine Datei zurückschreiben

   Warum das nötig ist: `archive/` ist unveränderliche Geschichte. Eine
   archivierte Datei, die `../kit/sot.css` lädt, sieht nächstes Jahr anders
   aus als am Tag der Ablage — die Zusage ist damit gebrochen. Vor dem
   Archivieren (und vor dem Portieren, wenn die Datei mitwandert) werden die
   Baukasten-Verweise darum durch ihren Inhalt ersetzt. Danach ist die Datei
   wieder das, was die Werkstatt-Regel verlangt: eine in sich geschlossene
   HTML-Datei ohne Abhängigkeiten außer Google Fonts.

   Aufruf:
     node prototype/kit/inline.mjs prototype/drafts/foo-v1.html
     node prototype/kit/inline.mjs prototype/drafts/foo-v1.html --out prototype/archive/foo-v1.html
     node prototype/kit/inline.mjs prototype/drafts/foo-v1.html --check

   Ohne --out wird an Ort und Stelle geschrieben. --check schreibt nichts und
   nennt nur, was ersetzt würde (Rückgabewert 1, wenn es etwas gäbe).
   ========================================================================= */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const check = args.includes('--check');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
const src = args.find((a) => !a.startsWith('--') && a !== out);

if (!src) {
  console.error('Aufruf: node prototype/kit/inline.mjs <datei.html> [--out <ziel.html>] [--check]');
  process.exit(2);
}

// Nur Baukasten-Dateien anfassen. Die Liste kommt aus dem Ordner selbst,
// damit ein neues sot-*.css nicht vergessen wird. Die grossen *.data.js
// bleiben Verweise: zu gross zum Einbetten, und sie ändern sich nicht mehr.
const KIT_FILES = (await readdir(KIT)).filter((f) => /^sot[\w.-]*\.(css|js)$/.test(f));
const NAMES = KIT_FILES.map((f) => f.replace(/[.]/g, '\\$&')).join('|');
const LINK = new RegExp(`[ \\t]*<link[^>]*href="[^"]*?(${NAMES})"[^>]*>\\s*\\n?`, 'g');
const SCRIPT = new RegExp(`[ \\t]*<script[^>]*src="[^"]*?(${NAMES})"[^>]*>\\s*</script>\\s*\\n?`, 'g');

const html = await readFile(src, 'utf8');
const done = [];

// Alle Treffer werden gegen die ORIGINALdatei gesammelt und erst danach
// eingesetzt. Sonst durchsucht der zweite Durchgang den schon eingebetteten
// Text — und die Kopfkommentare des Baukastens nennen selbst <script src=…>,
// womit ein Kommentar zerschnitten würde.
const hits = [];
for (const [re, wrap] of [[LINK, 'style'], [SCRIPT, 'script']]) {
  for (const m of html.matchAll(re)) hits.push({ at: m.index, len: m[0].length, name: m[1], wrap });
}
hits.sort((a, b) => a.at - b.at);

// Ein </style> oder </script> IM eingebetteten Text beendet das Element, das
// ihn tragen soll — auch mitten in einem Kommentar. Der Parser kennt keine
// Kommentare, er sucht die Zeichenkette. Darum wird sie zerlegt.
function safe(text, wrap) {
  return text.replace(new RegExp('</(' + wrap + ')', 'gi'), '<\\/$1');
}

let outHtml = '', cursor = 0;
for (const h of hits) {
  const body = safe(await readFile(resolve(KIT, h.name), 'utf8'), h.wrap);
  outHtml += html.slice(cursor, h.at) +
    `<!-- ${h.name} · eingebettet aus prototype/kit/ (unveränderliche Kopie) -->\n` +
    `<${h.wrap}>\n${body.trimEnd()}\n</${h.wrap}>\n`;
  cursor = h.at + h.len;
  done.push(h.name);
}
outHtml += html.slice(cursor);

if (!done.length) {
  console.log(`${basename(src)}: keine Baukasten-Verweise — bereits in sich geschlossen.`);
  process.exit(0);
}

if (check) {
  console.log(`${basename(src)}: würde einbetten — ${done.join(', ')}`);
  process.exit(1);
}

await writeFile(out || src, outHtml, 'utf8');
console.log(`${out || src}: eingebettet — ${done.join(', ')}`);
