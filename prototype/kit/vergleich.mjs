/* ============================================================================
   vergleich.mjs — Umbau ohne Bildunterschied belegen

   Ein Umbau auf den Baukasten darf das Bild nicht verändern. Augenmass reicht
   dafür nicht; die Methode steht schon in drafts/stromlinien-technik.html
   (Kap. „Bildvergleich statt Augenmass"): zwei Aufnahmen in ein Canvas,
   pixelweise vergleichen, Abweichung als 10×10-Dichtekarte in Prozent.

   Und die Falle, die dort ebenfalls steht: *„Die Gegenprobe prüfte sich
   selbst."* Darum ist das „vorher" hier immer eine **eingefrorene Kopie auf
   der Platte** und nie ein erneuter Lauf der Datei, die gerade geändert wird.

   Ablauf je Datei:

     node prototype/kit/vergleich.mjs friere drafts/foo-v1.html
         → legt .vergleich/foo-v1.vorher.html (Kopie) und je Ansicht ein PNG an

     … jetzt umbauen …

     node prototype/kit/vergleich.mjs pruefe drafts/foo-v1.html
         → nimmt neu auf, vergleicht gegen die eingefrorenen PNGs,
           druckt Gesamtabweichung + Dichtekarte je Ansicht

   Ansichten (Query + Fenstergröße) kommen aus --ansichten oder der Vorgabe
   „Telefon hell / Telefon dunkel / breit hell". Eigene:
     --ansichten "telefon=420x900:,nacht=420x900:night,breit=1100x1400:debug"

   Schwelle: --max 0.05  (Prozent abweichender Bildpunkte, Vorgabe 0.02)
   Determinismus-Prüfung: `friere` nimmt jede Ansicht ZWEIMAL auf und meldet,
   wenn dieselbe Datei mit sich selbst nicht deckungsgleich ist — dann ist die
   Messung wertlos und ein Vergleich sagt nichts.
   ========================================================================= */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const run = promisify(execFile);
const KIT = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(KIT, '..');
const OUT = join(PROTO, '.vergleich');
const CHROME = process.env.CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const args = process.argv.slice(2);
const mode = args[0];
const target = args.find((a, i) => i > 0 && !a.startsWith('--'));
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const MAX = parseFloat(flag('max', '0.02'));

if (!['friere', 'pruefe'].includes(mode) || !target) {
  console.error('Aufruf: node prototype/kit/vergleich.mjs friere|pruefe <datei.html> [--max 0.02] [--ansichten …]');
  process.exit(2);
}

const ANSICHTEN = (flag('ansichten',
  'telefon=420x900:,nacht=420x900:night,breit=1100x1400:'))
  .split(',').map(s => {
    const [name, rest] = s.split('=');
    const [size, q] = rest.split(':');
    const [w, h] = size.split('x').map(Number);
    return { name, w, h, q: q || '' };
  });

const file = resolve(process.cwd(), target);
const stem = basename(file, '.html');
await mkdir(OUT, { recursive: true });

/* --virtual-time-budget treibt eine VIRTUELLE Uhr für Timer/rAF — der
   @import der Google Fonts ist aber ein ECHTER Netzwerk-Request auf der
   echten Uhr. Das ist ein Wettlauf: mal ist die Schrift beim Bild schon
   getauscht (display:swap), mal noch nicht, je nach DNS/Netzwerklaune des
   Laufs. Befund aus dem Handbuch-Umbau (21. Aug 2026): zwei Aufnahmen
   DERSELBEN unveränderten Datei, Sekunden auseinander, differierten um
   14 % — mehr als jede echte Layoutabweichung, die dieses Werkzeug fangen
   soll. Fix: den Font-Host kappen, damit BEIDE Aufnahmen garantiert und
   sofort denselben Fallback-Zustand zeigen. Kostet die Prüfung der
   Web-Font-eigenen Feinheiten (Kerning, genaues Hinting) — die sind ohnehin
   nicht das, was ein Baukasten-Umbau kaputt macht; Layout, Farben, Abstände
   sind es, und die bleiben mit Fallback-Schrift genauso sichtbar. */
const NO_FONTS = ['--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1,MAP fonts.gstatic.com 127.0.0.1'];

async function schuss(htmlPath, q, w, h, pngPath) {
  const url = pathToFileURL(htmlPath).href + (q ? '?' + q : '');
  await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    ...NO_FONTS, `--window-size=${w},${h}`, '--virtual-time-budget=6000',
    `--screenshot=${pngPath}`, url]);
  if (!existsSync(pngPath)) throw new Error('Keine Aufnahme: ' + pngPath);
}

/* Der Vergleich läuft im Browser selbst — beide PNGs als data:-URI in eine
   Seite, dort ins Canvas, dort auszählen. Kein Fremdpaket, und es ist derselbe
   Weg, den das Technik-Handbuch beschreibt. data: statt file://, weil eine
   file://-Bilddatei das Canvas verunreinigt und getImageData dann wirft. */
async function diff(aPng, bPng) {
  const a = (await readFile(aPng)).toString('base64');
  const b = (await readFile(bPng)).toString('base64');
  const page = join(OUT, `_diff-${stem}.html`);
  await writeFile(page, `<body><pre id="o">läuft</pre><script>
const A=new Image(),B=new Image();let n=0;
A.onload=B.onload=()=>{ if(++n<2) return; los(); };
A.src='data:image/png;base64,${a}'; B.src='data:image/png;base64,${b}';
function los(){
  const w=Math.min(A.width,B.width), h=Math.min(A.height,B.height);
  const ca=document.createElement('canvas'), cb=document.createElement('canvas');
  ca.width=cb.width=w; ca.height=cb.height=h;
  const xa=ca.getContext('2d',{willReadFrequently:true}), xb=cb.getContext('2d',{willReadFrequently:true});
  xa.drawImage(A,0,0); xb.drawImage(B,0,0);
  const pa=xa.getImageData(0,0,w,h).data, pb=xb.getImageData(0,0,w,h).data;
  const G=10, grid=new Array(G*G).fill(0), cnt=new Array(G*G).fill(0);
  let ab=0;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    const gx=Math.min(G-1,Math.floor(x/w*G)), gy=Math.min(G-1,Math.floor(y/h*G));
    cnt[gy*G+gx]++;
    // Toleranz 5/255: Subpixel-Antialiasing rauscht auf textreichen Seiten
    // über 10 % der Fläche mit Delta 1–5, obwohl die Geometrie exakt gleich
    // ist (gemessen am Handbuch: 214 769 Punkte ≤5, nur 183 darüber).
    // Eine echte Farb- oder Layoutänderung liegt IMMER weit über 5.
    const d=Math.max(Math.abs(pa[i]-pb[i]),Math.abs(pa[i+1]-pb[i+1]),Math.abs(pa[i+2]-pb[i+2]));
    if(d>5){ ab++; grid[gy*G+gx]++; }
  }
  document.getElementById('o').textContent = JSON.stringify({
    w,h, masse:[A.width,A.height,B.width,B.height],
    pct: ab/(w*h)*100, ab,
    karte: grid.map((v,i)=> cnt[i]? v/cnt[i]*100 : 0)
  });
}
<\/script>`, 'utf8');
  const { stdout } = await run(CHROME, ['--headless=new', '--disable-gpu',
    '--virtual-time-budget=8000', '--dump-dom', pathToFileURL(page).href]);
  const m = stdout.match(/<pre id="o">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('Vergleich lieferte nichts');
  return JSON.parse(m[1]);
}

function karte(k) {
  const z = ' ·:+*#'; // 0 · <0.1 · <1 · <5 · <20 · darüber
  const st = (v) => v === 0 ? z[0] : v < .1 ? z[1] : v < 1 ? z[2] : v < 5 ? z[3] : v < 20 ? z[4] : z[5];
  let s = '';
  for (let y = 0; y < 10; y++) s += '      ' + k.slice(y * 10, y * 10 + 10).map(st).join(' ') + '\n';
  return s;
}

/* Die Kopie liegt in .vergleich/, das Original irgendwo darunter oder daneben —
   relative Verweise (Baukasten, *.data.js) würden ins Leere zeigen und die
   Seite unstyled rendern. Ein unstyled „vorher" gegen ein fertiges „nachher"
   meldet 100 % Abweichung und sagt nichts. Darum werden die Verweise beim
   Einfrieren auf absolute file://-URLs des ORIGINALordners festgenagelt. */
function verankere(html, originalDir) {
  return html.replace(/\b(href|src)="(?!https?:|data:|file:|#|\/\/)([^"]+)"/g,
    (m, attr, url) => `${attr}="${pathToFileURL(resolve(originalDir, url)).href}"`);
}

if (mode === 'friere') {
  const kopie = join(OUT, `${stem}.vorher.html`);
  await writeFile(kopie, verankere(await readFile(file, 'utf8'), dirname(file)), 'utf8');
  console.log(`eingefroren: ${kopie}`);
  console.log('(Die Kopie ist der Bezugspunkt. Nie neu einfrieren, solange umgebaut wird.)\n');
  for (const a of ANSICHTEN) {
    const p1 = join(OUT, `${stem}.${a.name}.vorher.png`);
    const p2 = join(OUT, `${stem}.${a.name}._determinismus.png`);
    await schuss(kopie, a.q, a.w, a.h, p1);
    await schuss(kopie, a.q, a.w, a.h, p2);
    const d = await diff(p1, p2);
    const ok = d.pct === 0;
    console.log(`${a.name.padEnd(10)} ${a.w}×${a.h} ?${a.q || '—'}  ` +
      (ok ? 'deterministisch (0 Bildpunkte)'
          : `NICHT deterministisch: ${d.pct.toFixed(4)} % — Animation/Zufall/Uhr abstellen (?seed=, prefers-reduced-motion), sonst misst der Vergleich Rauschen`));
  }
} else {
  const kopie = join(OUT, `${stem}.vorher.html`);
  if (!existsSync(kopie)) { console.error(`Kein Bezugspunkt. Erst: node prototype/kit/vergleich.mjs friere ${target}`); process.exit(2); }
  let schlecht = 0;
  for (const a of ANSICHTEN) {
    const vor = join(OUT, `${stem}.${a.name}.vorher.png`);
    const nach = join(OUT, `${stem}.${a.name}.nachher.png`);
    await schuss(file, a.q, a.w, a.h, nach);
    const d = await diff(vor, nach);
    const [aw, ah, bw, bh] = d.masse;
    const gleichGross = aw === bw && ah === bh;
    const ok = d.pct <= MAX && gleichGross;
    if (!ok) schlecht++;
    console.log(`\n${a.name}  ${a.w}×${a.h}  ?${a.q || '—'}`);
    if (!gleichGross) console.log(`  ACHTUNG Seitenhöhe geändert: ${aw}×${ah} → ${bw}×${bh} (verglichen wird nur die Schnittmenge)`);
    console.log(`  Abweichung ${d.pct.toFixed(4)} %  (${d.ab} Bildpunkte)  Schwelle ${MAX} %  → ${ok ? 'in Ordnung' : 'ANSEHEN'}`);
    if (d.pct > 0) console.log(karte(d.karte));
  }
  console.log(schlecht ? `\n${schlecht} Ansicht(en) über der Schwelle.` : '\nAlle Ansichten in Ordnung.');
  process.exit(schlecht ? 1 : 0);
}
