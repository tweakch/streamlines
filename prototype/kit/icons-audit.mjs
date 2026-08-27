/* ============================================================================
   icons-audit.mjs — findet Schriftzeichen, die als Icon benutzt werden.

     node prototype/kit/icons-audit.mjs                  # alle Drafts + kit
     node prototype/kit/icons-audit.mjs drafts/foo.html  # eine Datei
     node prototype/kit/icons-audit.mjs --alle           # auch archive/

   **Die Regel:** Icons sind SVG (`SOT.icon(name)` aus `sot-icons.js`). Ein
   Glyph erbt Laufweite und Grundlinie der Schrift, fällt je Gerät auf eine
   andere Datei zurück, nimmt `stroke` nicht an und lässt sich nicht mit dem
   Bestand umzeichnen. Emoji sind der schlimmste Fall: farbig aus einer
   Systemschrift, taub gegen `currentColor`.

   Warum ein Prüfer und nicht bloss eine Zeile in der README: die Regel
   erodiert sonst still. Ein Zeichen ist im Editor schneller getippt als ein
   Aufruf — dieser Prüfer macht die Abkürzung sichtbar, statt sie zu verbieten.

   Der Prüfer ist absichtlich TOLERANT bei Text und STRENG bei Icons: deutsche
   Umlaute, Gedankenstriche, Anführungen, Masszeichen (× · ° ² ³ √ ≈ ≤ ≥ ±),
   Pfeile in Prosa (→) und Rechenzeichen (−) sind Typografie und bleiben.
   Beanstandet wird, was für ein DING steht.
   ========================================================================= */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/* Erlaubt: Typografie und Mathematik. Alles andere ausserhalb ASCII gilt als
   Icon-Kandidat und muss begründet werden. */
const TYPO = new Set([...'äöüÄÖÜßéèêàâçñîôûœæ„“”‚‘’«»‹›–—…·×÷°²³½¼¾√∞≈≤≥±≠µΩπΔΣ†‡§©®™€£¥‰%→←↑↓−'] );

/* Bekannte Icon-Zeichen mit ihrem Ersatz im Register — damit die Meldung
   nicht nur „ist falsch" sagt, sondern „nimm das". */
const ERSATZ = {
  '✦':'sammlerin', '➤':'jaeger', '☖':'mensch',
  '▲':'silex  (oder berg, je nach Bedeutung)', '●':'ocker', '◇':'quarz', '⌂':'hoehle',
  '▨':'furt', '≋':'stromschnelle', '⇊':'wasserfall', '⋔':'klamm',
  '╤':'bruecke', '┈':'steg', '▬':'damm', '○':'weiher', '◌':'fundkies',
  '◈':'spur', '◆':'beleg', '⬡':'hexfeld', '⚓':'anker',
  '❄':'frost', '✶':'stille', '♨':'fremde', '☀':'sonne', '☾':'mond',
  '≡':'vorrat', '𝆲':'schuh', '∿':'lauf', '⌫':'loeschen', '⛰':'berg', '🔍':'lupe',
};
const istEmoji = ch => {
  const c = ch.codePointAt(0);
  return (c >= 0x1F300 && c <= 0x1FAFF) || (c >= 0x2600 && c <= 0x27BF && ERSATZ[ch]);
};

/* ------------------------------------------------------- Was nicht zählt ---
   Ein Zeichen kann ZITIERT werden, statt benutzt: „`content:'◆'` konnte das
   nie" oder „<code>▨</code> fehlt auf iOS" erklären die Regel und brauchen
   das Zeichen dafür. Zitiert heisst: in Backticks oder in <code>. Beides
   wird vor der Prüfung entfernt — so bleibt der Prüfer streng bei Benutzung
   und stumm bei Erklärung, ohne dass jemand Ausnahmen pflegen muss.

   Wo das nicht reicht, steht `icons-audit:erlaubt` in der Zeile — eine
   ausdrückliche, sichtbare Ausnahme statt einer erratenen. */
const entzitieren = l => l
  .replace(/<code>[\s\S]*?<\/code>/g, '<code/>')
  .replace(/`[^`]*`/g, '``');
const istAusnahme = l => l.includes('icons-audit:erlaubt');
/* Zwei Dateien dürfen Zeichen frei benennen, weil das ihre Aufgabe ist: das
   Register (dokumentiert, was ersetzt wurde) und dieser Prüfer (braucht die
   Zeichen als Suchmuster). Sie auszunehmen ist ehrlicher, als in ihnen
   zeilenweise Ausnahmen zu streuen. */
const istWerkzeug = rel => /kit[\/\\](sot-icons\.js|icons-audit\.mjs)$/.test(rel);

function dateien(args) {
  const alle = args.includes('--alle');
  const explizit = args.filter(a => !a.startsWith('--'));
  if (explizit.length) return explizit;
  const out = [];
  for (const dir of ['drafts', 'kit', 'handbuch', ...(alle ? ['archive', 'ab'] : [])]) {
    const d = join(ROOT, dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d, { withFileTypes: true })) {
      if (f.isDirectory()) {
        for (const g of readdirSync(join(d, f.name)))
          if (/\.(html|js|mjs|css)$/.test(g)) out.push(dir + '/' + f.name + '/' + g);
      } else if (/\.(html|js|mjs|css)$/.test(f.name)) out.push(dir + '/' + f.name);
    }
  }
  return out;
}

const args = process.argv.slice(2);
let treffer = 0, dateienMitTreffer = 0;
const summe = new Map();

for (const rel of dateien(args)) {
  const pfad = join(ROOT, rel);
  if (!existsSync(pfad)) { console.log('fehlt: ' + rel); continue; }
  if (istWerkzeug(rel)) continue;
  const zeilen = readFileSync(pfad, 'utf8').split('\n');
  const fund = [];
  zeilen.forEach((zeile, i) => {
    if (istAusnahme(zeile)) return;
    for (const m of entzitieren(zeile).matchAll(/[^\x00-\x7F]/gu)) {
      const ch = m[0];
      if (TYPO.has(ch)) continue;
      if (!ERSATZ[ch] && !istEmoji(ch)) continue;   /* Unbekanntes nicht anmeckern */
      fund.push({ z: i + 1, ch, spalte: m.index + 1, txt: zeile.trim().slice(0, 110) });
      summe.set(ch, (summe.get(ch) || 0) + 1);
      treffer++;
    }
  });
  if (!fund.length) continue;
  dateienMitTreffer++;
  console.log('\n' + rel + '  (' + fund.length + ')');
  const gesehen = new Set();
  for (const f of fund) {
    const key = f.ch + ':' + f.txt;
    if (gesehen.has(key)) continue;
    gesehen.add(key);
    const hin = ERSATZ[f.ch] ? "  → SOT.icon('" + ERSATZ[f.ch] + "')" : '  → Emoji: ersetzen';
    console.log('  Z' + String(f.z).padEnd(5) + f.ch + hin);
    console.log('        ' + f.txt);
  }
}

console.log('\n' + '='.repeat(70));
if (!treffer) {
  console.log('Kein Schriftzeichen als Icon. Die Regel hält.');
} else {
  console.log(treffer + ' Stellen in ' + dateienMitTreffer + ' Datei(en).');
  const rang = [...summe.entries()].sort((a, b) => b[1] - a[1]);
  console.log('Häufigste: ' + rang.slice(0, 12).map(([c, n]) => c + '×' + n).join('  '));
  console.log('\nErsatz steht in kit/sot-icons.js. Neue Zeichnung? Hausstil im');
  console.log('Kopf der Datei, Eintrag in SOT.iconGruppen, Probe in kit-demo.html.');
}
process.exit(0);
