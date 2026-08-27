/* ============================================================================
   audit.mjs — was der Baukasten von einer Datei schon abdeckt

   Der Umbau eines Drafts auf den Baukasten ist zu 80 % Löscharbeit. Dieses
   Werkzeug sagt, WAS gelöscht werden kann, WAS umbenannt werden muss und WAS
   dem Baukasten noch fehlt — damit der Umbau eine Liste abarbeitet statt zu
   raten, und damit jeder Umbau eine Mängelliste für den Baukasten hinterlässt.

   Aufruf:
     node prototype/kit/audit.mjs                       # alle Drafts, Übersicht
     node prototype/kit/audit.mjs drafts/foo-v1.html    # eine Datei, im Detail
     node prototype/kit/audit.mjs --json                # für Skripte

   Vier Befunde je Datei:

   [gleich]     Regel steht im Baukasten mit identischer Deklaration →
                ersatzlos löschen.
   [ähnlich]    gleicher Selektor, andere Deklaration → ansehen. Entweder die
                Datei weicht absichtlich ab (dann behalten und kürzen auf die
                abweichenden Eigenschaften), oder der Baukasten hat den
                falschen Wert (dann den Baukasten ändern).
   [KOLLISION]  gleicher Selektor, aber die Datei meint etwas ANDERES als der
                Baukasten. Das ist der gefährliche Fall: nach dem Verlinken
                erbt die Datei stillschweigend eine fremde Bedeutung.
                Umbenennen — in der Datei oder im Baukasten.
   [fehlt]      Selektor, den der Baukasten nicht kennt. Kommt er in mehreren
                Dateien vor, ist er ein Kandidat für den Baukasten (Regel 1);
                kommt er einmal vor, bleibt er in der Datei.

   Dazu: harte Farben (brechen Tag/Nacht/Werkbank) und eigene Tokens.
   ========================================================================= */
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(KIT, '..');
const DRAFTS = resolve(PROTO, 'drafts');

/* Selektoren, bei denen Baukasten und Bestand nachweislich Verschiedenes
   meinen. Aus dem Bestand erhoben, nicht geraten — jede Zeile ist belegt.
   Wächst mit jedem Umbau; das ist der Zweck. */
const KOLLISION = {
  '.chip':   'Baukasten: anklickbare Marke. Spielprototypen: Ressourcenkachel (.chip b gross + .chip span Etikett) — das ist .stat/.res. Labor: Marke, aber .chip.on ist dort GEFÜLLT (background:var(--ink)), im Baukasten nur umrandet.',
  '.stage':  'Baukasten: Bühne im Telefonformat (flex column, min-height 100dvh). ereignis-labor: Ereignis-Tafel mit linker Kante. feld-labor/profil-hub: ganzer Bildschirm. Drei Bedeutungen, eine davon layoutet die Seite.',
  '.seg':    'Baukasten: segmentierte Wahl (Behälter). ereignis-labor: EIN Zeitleistenfeld — das ist .tl-seg.',
  '.slot':   'Baukasten: Markenplatz im Hexfeld (position:absolute!). ereignis-labor: Abschnittsblock mit linker Kante. Absolute Positionierung, die auf einen Block leckt, zerlegt ihn.',
  '.pers':   'Baukasten: runde Personenmarke im Hexfeld. ereignis-labor: SVG-Textmarke. Gleicher Name, andere Technik.',
  '.card':   'Baukasten (sot-doc): Dokumentkarte, zugeklappt (.cbody display:none). mechanik-labor: Kennzahlkachel. profil-hub: Onboarding-Fläche. Wer sot-doc.css lädt und .card anders meint, versteckt seinen Inhalt.',
  '.tab':    'Baukasten: Reiter sind .tabs > button mit .on. mechanik-labor/map-editor: .tab/.lens als Kachel mit .sel. Anderer Zustandsname — .on greift nicht.',
  '.legend': 'Baukasten: .leg (Farblegende unter der Karte). Bestand: .legend als Fussnotentext. Verschiedene Dinge, verwandte Namen.',
  '.status': 'Baukasten (sot-doc): Statuszeile einer Datenquelle. map-editor: Statuszeile des Editors. Prüfen, ob dieselbe Bedeutung.',
  '.dim':    'Baukasten: Klasse für gedimmten Text. asset-editor/eiszeit/rhein-*: --dim als TOKEN für dieselbe Farbe (= --ink2). Beim Umbau Token umbenennen, Klasse bleibt.',
};

/* Tokens, die der Bestand führt und der Baukasten nicht. Der Umbau muss sie
   entweder in den Baukasten heben oder lokal behalten. */
const TOKEN_HINWEIS = {
  '--fg': '= --ink', '--dim': '= --ink2', '--accent': '= --ember',
  '--akz': '= --ember', '--gold': '= --ember', '--ok': '= --good',
  '--bg2': '= --panel', '--st-mess': 'sechster Kartenstatus „Werkzeug/Messung" — fehlt in sot-doc.js STATES',
};

function styleBlocks(html) {
  const out = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m; while ((m = re.exec(html))) out.push(m[1]);
  return out.join('\n');
}

/* Regeln als Map selektor → deklarationstext. Bewusst simpel: @media- und
   @keyframes-Inhalte werden mitgelesen, aber der Selektor bekommt einen
   Vermerk, damit nichts stillschweigend verglichen wird. */
function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    if (!sel || sel.startsWith('@') || sel.startsWith('%') || /^\d/.test(sel)) continue;
    const decl = m[2].trim().replace(/\s+/g, '').replace(/;$/, '');
    for (const one of sel.split(',').map(s => s.trim())) {
      if (!map.has(one)) map.set(one, []);
      map.get(one).push(decl);
    }
  }
  return map;
}
function norm(decl) {
  return decl.split(';').filter(Boolean).sort().join(';');
}

const kitCss = (await Promise.all(
  (await readdir(KIT)).filter(f => /^sot[\w.-]*\.css$/.test(f))
    .map(f => readFile(resolve(KIT, f), 'utf8'))
)).join('\n');
const kitRules = rules(kitCss);
const kitVars = new Set(kitCss.match(/--[-\w]+(?=\s*:)/g) || []);

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const only = args.find(a => !a.startsWith('--'));

const files = only
  ? [resolve(process.cwd(), only)]
  : (await readdir(DRAFTS)).filter(f => f.endsWith('.html')).sort().map(f => resolve(DRAFTS, f));

const report = [];
for (const path of files) {
  const html = await readFile(path, 'utf8');
  const css = styleBlocks(html);
  if (!css.trim()) continue;
  const r = rules(css);
  const cssLines = css.split('\n').filter(l => l.trim()).length;

  const gleich = [], aehnlich = [], kollision = [], fehlt = [];
  for (const [sel, decls] of r) {
    const mine = norm(decls.join(';'));
    if (KOLLISION[sel] || KOLLISION[sel.split(/[ .:>]/)[0]]) {
      kollision.push({ sel, warum: KOLLISION[sel] || KOLLISION[sel.split(/[ .:>]/)[0]] });
      continue;
    }
    if (!kitRules.has(sel)) { fehlt.push(sel); continue; }
    const theirs = norm(kitRules.get(sel).join(';'));
    (mine === theirs ? gleich : aehnlich).push(sel);
  }

  // Harte Farben: brechen die drei Register.
  const hart = [...new Set(css.replace(/\/\*[\s\S]*?\*\//g, '')
    .match(/(?<![-\w])#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || [])]
    .filter(c => !/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0/.test(c));
  const eigeneVars = [...new Set(css.match(/--[-\w]+(?=\s*:)/g) || [])].filter(v => !kitVars.has(v));

  report.push({
    file: basename(path), cssLines,
    gleich, aehnlich, kollision, fehlt, hart, eigeneVars,
    tilgbar: cssLines ? Math.round((gleich.length / r.size) * 100) : 0
  });
}

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

if (only) {
  const x = report[0];
  console.log(`\n${x.file} — ${x.cssLines} Zeilen CSS\n${'='.repeat(60)}`);
  const blk = (t, arr, f = (v) => v) => {
    if (!arr.length) return;
    console.log(`\n${t} (${arr.length})`);
    for (const v of arr) console.log('  ' + f(v));
  };
  blk('[gleich] — ersatzlos löschen', x.gleich);
  blk('[ähnlich] — Wert vergleichen, dann kürzen oder Baukasten ändern', x.aehnlich);
  blk('[KOLLISION] — umbenennen, sonst erbt die Datei fremde Bedeutung',
      x.kollision, (v) => `${v.sel}\n      ${v.warum}`);
  blk('[fehlt] — bleibt in der Datei, oder rauf in den Baukasten', x.fehlt);
  blk('[harte Farben] — brechen Tag/Nacht/Werkbank', x.hart);
  blk('[eigene Tokens]', x.eigeneVars, (v) => `${v}   ${TOKEN_HINWEIS[v] || ''}`);
  console.log();
} else {
  console.log('Datei'.padEnd(30), 'CSS'.padStart(5), 'gleich'.padStart(7), 'ähnl'.padStart(6),
              'KOLL'.padStart(5), 'fehlt'.padStart(6), 'Farben'.padStart(7), 'Tokens'.padStart(7));
  console.log('-'.repeat(84));
  for (const x of report.sort((a, b) => b.gleich.length - a.gleich.length)) {
    console.log(x.file.padEnd(30), String(x.cssLines).padStart(5),
      String(x.gleich.length).padStart(7), String(x.aehnlich.length).padStart(6),
      String(x.kollision.length).padStart(5), String(x.fehlt.length).padStart(6),
      String(x.hart.length).padStart(7), String(x.eigeneVars.length).padStart(7));
  }
  // Was in MEHREREN Dateien fehlt, ist der eigentliche Fund: Regel 1 erfüllt.
  const zaehl = new Map();
  for (const x of report) for (const s of x.fehlt) zaehl.set(s, (zaehl.get(s) || 0) + 1);
  const kandidaten = [...zaehl].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  console.log(`\nKandidaten für den Baukasten — Selektoren, die in ≥3 Dateien fehlen (${kandidaten.length}):`);
  for (const [s, n] of kandidaten.slice(0, 40)) console.log(`  ${String(n).padStart(2)}×  ${s}`);
  console.log('\nDetails je Datei:  node prototype/kit/audit.mjs drafts/<datei>.html');
}
