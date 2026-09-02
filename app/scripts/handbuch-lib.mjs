/*
 * handbuch-lib.mjs — komponiert das Handbuch aus Markdown-Kapiteln.
 *
 * Quelle:  prototype/handbuch/  (template.html + NN-*.md, ein Kapitel je Datei)
 * Ziel:    das vollständige Handbuch-HTML (Karten im Format von sot-doc.css)
 *
 * Der Markdown-Dialekt je Karte:
 *
 *   ## Kartentitel {done}
 *   ## Kartentitel {rej badge="Verworfen / geparkt"}     ← Plakette abweichend
 *   ## Kartentitel {done openc}                          ← startet aufgeklappt
 *   ## Kartentitel {done #eigene-id}                     ← id statt Titel-Slug
 *
 *   Absätze sind GFM (fett/kursiv/`code`/Tabellen/Listen/[Links](…)/~~durch~~).
 *   Leiser Nachsatz:            Text des Absatzes {.dim}          (markdown-it-attrs)
 *   Warum-Kasten:               ::: why Titel des Kastens
 *                               Inhalt (nur Fließtext) …
 *                               :::
 *   Was-fehlt-Kasten:           ::: gap Titel  … ::: (gleiches Format)
 *   Alles, was GFM nicht kann (Tabellen mit Zellklassen, Kästen mit
 *   Blockinhalt), bleibt als rohe HTML-Zeile stehen — html:true reicht sie durch.
 *
 * Kapitel-Frontmatter (----Zeilen, kein YAML-Parser nötig):
 *   nummer, id (k1…), titel, untertitel, banner (Kommentar im erzeugten HTML)
 *
 * Jede Karte bekommt eine stabile id (Titel-Slug) — ?karte=<id> im Handbuch
 * öffnet sie und springt hin. Das konnte die handgeschriebene Fassung nicht.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const SRC_DIR = resolve(HERE, '../../prototype/handbuch')

export const LABEL = { done: 'Umgesetzt', concept: 'Konzept', idea: 'Idee', rej: 'Verworfen', open: 'Offen' }

export function mdEngine() {
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false })
  md.use(attrs)
  /* Die handgeschriebenen Tabellen tragen kein thead/tbody — die erzeugten
     auch nicht, damit Alt und Neu Zeichen für Zeichen vergleichbar bleiben. */
  for (const r of ['thead_open', 'thead_close', 'tbody_open', 'tbody_close']) {
    md.renderer.rules[r] = () => ''
  }
  /* Das Dokument (und .why b/.gap b in sot.css) spricht <b>/<i>, nicht
     <strong>/<em> — die erzeugte Fassung spricht dieselbe Sprache. */
  md.renderer.rules.strong_open = () => '<b>'
  md.renderer.rules.strong_close = () => '</b>'
  md.renderer.rules.em_open = () => '<i>'
  md.renderer.rules.em_close = () => '</i>'
  return md
}

const md = mdEngine()

/* ------------------------------------------------------------------ Karten --- */

export function slug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/&amp;/g, 'und').replace(/&/g, 'und')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

/** Kopfzeile einer Karte zerlegen: "## Titel {status …optionen}" */
function parseCardHead(line) {
  const m = line.match(/^## (.+?)\s*\{([^}]*)\}\s*$/)
  if (!m) throw new Error('Kartenkopf ohne {status}: ' + line)
  const title = m[1]
  const card = { title, status: null, badge: null, openc: false, id: null }
  let rest = m[2].trim()
  const bm = rest.match(/badge="([^"]*)"/)
  if (bm) { card.badge = bm[1]; rest = rest.replace(bm[0], ' ') }
  for (const tok of rest.split(/\s+/).filter(Boolean)) {
    if (tok === 'openc') card.openc = true
    else if (tok.startsWith('#')) card.id = tok.slice(1)
    else if (tok in LABEL) card.status = tok
    else throw new Error(`Unbekannte Karten-Option "${tok}" in: ${line}`)
  }
  if (!card.status) throw new Error('Karte ohne Status: ' + line)
  if (!card.badge) card.badge = LABEL[card.status]
  return card
}

/*
 * markdown-it-attrs hält ein gerades " im Fliesstext für den Beginn eines
 * Attributwerts und ignoriert dann das {.dim} am Zeilenende — und die deutschen
 * Anführungszeichen des Handbuchs schliessen mit einem geraden ".
 * Ein \" ist davon ausgenommen. Statt das jedem Autor aufzubürden, maskiert
 * der Komponist gerade Anführungszeichen selbst — nur auf Zeilen, die mit
 * einem {…}-Attributblock enden, und nur ausserhalb von `Code-Spannen`.
 */
function shieldQuotesForAttrs(line) {
  const m = line.match(/^(.*\S)(\s+\{[^{}]+\})$/)
  if (!m || !m[1].includes('"')) return line
  const parts = m[1].split('`')
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/(?<!\\)"/g, '\\"')
  }
  return parts.join('`') + m[2]
}

/*
 * Zeichen im Fliesstext:  :furt|Furten:  →  Zeichen + Wort
 *                         :furt:         →  nur das Zeichen
 * Der Komponist kennt die Zeichnungen nicht (die liegen in sot-icons.js und
 * sind SVG, kein Schriftzeichen) — er schreibt nur den Namen ins Dokument,
 * SOT.doc hängt beim Laden das SVG davor. Bewusst kein Unicode-Ersatz: ein
 * Glyph erbt Schriftmetrik und Grundlinie und fehlt auf manchen Geräten ganz.
 */
const IC = /:([a-z][a-z0-9-]*)(?:\|([^:|]+))?:/g
function icons(html) {
  /* Nur im Textteil ersetzen, nie innerhalb eines Tags — sonst würde ein
     style="color:red" im rohen HTML zu einem Zeichen umgedeutet. */
  return html
    .split(/(<[^>]*>)/)
    .map((teil, i) =>
      i % 2
        ? teil
        : teil.replace(IC, (all, name, wort) =>
            `<span class="ic" data-ic="${name}">${wort ? wort.trim() : ''}</span>`))
    .join('')
}

/**
 * Kartenrumpf rendern. ::: why/gap/figur-Zäune werden hier behandelt (nicht
 * per markdown-it-container), weil ihr Inhalt INLINE gerendert werden muss:
 * <div class="why"><b>Titel</b>Text</div> — ein <p> darin bekäme Absatzränder
 * aus .cbody p und verschöbe das Bild.
 *
 * ::: figur <name> [Titel der Bildunterschrift]
 * Bildunterschrift …
 * :::
 * wird zu einem leeren Behälter mit dem Namen der Abbildung; gezeichnet wird
 * sie erst im Browser aus dem Baukasten (sot-figuren.js), damit die Abbildung
 * dasselbe Ding IST, das im Spiel läuft, und nicht ein Bild davon veraltet.
 */
export function renderBody(src) {
  const lines = src.split('\n')
  const out = []
  let buf = []
  const flush = () => {
    const chunk = buf.join('\n').trim()
    if (chunk) out.push(icons(md.render(chunk)))
    buf = []
  }
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^::: (why|gap|figur)\s+(.+)$/)
    if (!m) { buf.push(shieldQuotesForAttrs(lines[i])); continue }
    flush()
    const inner = []
    for (i++; i < lines.length && lines[i].trim() !== ':::'; i++) inner.push(lines[i])
    const text = icons(md.renderInline(inner.join('\n')))
    if (m[1] === 'figur') {
      const fm = m[2].match(/^(\S+)(?:\s+(.*))?$/)
      const titel = fm[2] ? `<b>${md.renderInline(fm[2])}</b>` : ''
      out.push(`<div class="figur" data-figur="${fm[1]}"><span class="fcap">${titel}${text}</span></div>\n`)
    } else {
      out.push(`<div class="${m[1]}"><b>${icons(md.renderInline(m[2]))}</b>${text}</div>\n`)
    }
  }
  flush()
  return out.join('')
}

/**
 * Die Schauseite einer Karte abtrennen.
 *
 * Leser-Rückmeldung Aug 2026: zu viel Text, keine Bilder. Eine Karte, die mit
 * einem Zitat-Absatz beginnt, behandelt ihn darum als LEAD — die Sache in
 * zwei Sätzen. Lead und die unmittelbar folgenden Abbildungen sind die
 * Schauseite; alles danach ist die Herleitung und klappt in der
 * Publish-Ansicht hinter einen Knopf.
 *
 * Karten ohne Lead rendern unverändert wie bisher — die Umstellung geht
 * darum Karte für Karte und nicht als Bruch.
 *
 * @returns {{lead: string, schau: string, rest: string} | null}
 */
export function splitSchauseite(src) {
  const lines = src.split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (i >= lines.length || !/^>\s?/.test(lines[i])) return null

  const lead = []
  for (; i < lines.length && /^>\s?/.test(lines[i]); i++) lead.push(lines[i].replace(/^>\s?/, ''))

  const schau = []
  for (;;) {
    let j = i
    while (j < lines.length && !lines[j].trim()) j++
    if (j >= lines.length || !/^::: figur\s/.test(lines[j])) break
    for (i = j; i < lines.length; i++) {
      schau.push(lines[i])
      if (i > j && lines[i].trim() === ':::') { i++; break }
    }
  }
  return { lead: lead.join('\n').trim(), schau: schau.join('\n'), rest: lines.slice(i).join('\n').trim() }
}

export function renderCard(card, ids) {
  let id = card.id || slug(card.title)
  while (ids.has(id)) id += '-2'
  ids.add(id)
  const cls = 'card' + (card.openc ? ' openc' : '')
  const s = splitSchauseite(card.body)
  const body = s
    ? `<p class="lead">${icons(md.renderInline(s.lead))}</p>\n` +
      renderBody(s.schau) +
      (s.rest ? `<div class="mehr">\n${renderBody(s.rest)}</div>\n` : '')
    : renderBody(card.body)
  return (
    `<div class="${cls}" data-s="${card.status}" id="${id}">` +
    `<div class="chead"><h3>${md.renderInline(card.title)}</h3>` +
    `<span class="badge b-${card.status}">${card.badge}</span>` +
    `<span class="chev">▶</span></div><div class="cbody">\n` +
    body +
    `</div></div>\n`
  )
}

/* ----------------------------------------------------------------- Kapitel --- */

/**
 * Zeilenenden normalisieren. `core.autocrlf` ist auf dieser Maschine `true`
 * und es gibt keine `.gitattributes` — sobald ein Kapitel einmal committet
 * und wieder ausgecheckt wurde, liegt es mit CRLF im Arbeitsbaum, während
 * unangetastete Kapitel LF behalten. Der Parser darf daran nicht scheitern:
 * ein `\r` am Zeilenende hätte sonst das Frontmatter unlesbar gemacht und den
 * Status `{concept}` einer Karte mitverschluckt.
 */
export const lf = (s) => s.replace(/\r\n/g, '\n')

export function parseChapterFile(src, name) {
  src = lf(src)
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) throw new Error(name + ': Frontmatter (---) fehlt')
  const meta = {}
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) meta[m[1]] = m[2]
  }
  for (const k of ['nummer', 'id', 'titel']) {
    if (!meta[k]) throw new Error(`${name}: Frontmatter-Feld "${k}" fehlt`)
  }
  const body = src.slice(fm[0].length)
  const cards = []
  let cur = null
  for (const line of body.split('\n')) {
    if (line.startsWith('## ')) {
      if (cur) { cur.body = cur.lines.join('\n').trim(); cards.push(cur) }
      cur = { ...parseCardHead(line), lines: [] }
    } else if (cur) {
      cur.lines.push(line)
    } else if (line.trim()) {
      throw new Error(`${name}: Text vor der ersten Karte: ${line}`)
    }
  }
  if (cur) { cur.body = cur.lines.join('\n').trim(); cards.push(cur) }
  return { meta, cards }
}

export function renderChapter(ch, ids, statuses) {
  const cards = statuses ? ch.cards.filter((c) => statuses.has(c.status)) : ch.cards
  let out = ''
  if (ch.meta.banner) out += `<!-- ============ ${ch.meta.banner} ============ -->\n`
  out += `<h2 class="chap" id="${ch.meta.id}"><span class="n">${ch.meta.nummer}</span>${md.renderInline(ch.meta.titel)}</h2>\n`
  if (ch.meta.untertitel) out += `<p class="chapsub">${md.renderInline(ch.meta.untertitel)}</p>\n`
  for (const c of cards) out += '\n' + renderCard(c, ids)
  return { html: out, kept: cards.length, dropped: ch.cards.length - cards.length }
}

/* ------------------------------------------------------------------- Ganzes --- */

const PLACEHOLDER = '<!-- HANDBUCH:KAPITEL -->'

/**
 * @param {{statuses?: Set<string>, srcDir?: string}} opts
 *   statuses: nur Karten dieser Status aufnehmen (Publish); weglassen = alle.
 */
export function compose(opts = {}) {
  const dir = opts.srcDir || SRC_DIR
  const template = lf(readFileSync(join(dir, 'template.html'), 'utf8'))
  if (!template.includes(PLACEHOLDER)) {
    throw new Error('template.html ohne Platzhalter ' + PLACEHOLDER)
  }
  const files = readdirSync(dir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()
  if (!files.length) throw new Error('Keine Kapitel (NN-*.md) in ' + dir)
  const ids = new Set()
  const parts = []
  let kept = 0
  let dropped = 0
  for (const f of files) {
    const ch = parseChapterFile(readFileSync(join(dir, f), 'utf8'), f)
    const r = renderChapter(ch, ids, opts.statuses)
    parts.push(r.html)
    kept += r.kept
    dropped += r.dropped
  }
  const html = template.replace(PLACEHOLDER, parts.join('\n'))
  return { html, kept, dropped, files }
}
