#!/usr/bin/env node
/*
 * normalize-hls.mjs — Knotenbasis aus dem Open Data des Historischen Lexikons
 * der Schweiz (HLS, hls-dhs-dss.ch/de/opendata).
 *
 * Liest die vier Artikellisten (Biografien/Familien/Orte/Themen, CC-0) und die
 * Autor:innen-Liste aus pipeline/data/hls-dhs-dss/ und baut daraus eine flache
 * Knotenliste: ID, Kategorie, Lemma, Zusatz, URL, Autor:in — für Biografien
 * zusätzlich ein aus dem Precision-Feld geparster Zeitraum.
 *
 * WICHTIG — was hier bewusst FEHLT:
 *   - Verlinkung zwischen Artikeln (Kanten): steckt nur im Artikel-Volltext
 *     (wiki-interne Links), nicht in den CC-0-Exporten. hls-dhs-dss.ch/robots.txt
 *     schliesst ClaudeBot explizit aus (Disallow: /) und setzt
 *     Content-Signal: ai-train=no, use=reference — automatisiertes Abgreifen
 *     des Volltexts für diesen Zweck also nicht.
 *   - Feine Raum-/Themen-Taxonomie: die Navigation der Website nutzt eine
 *     interne "lexicofacet"-Klassifikation (z.B. f_hls.lexicofacet_string=
 *     0/006800. für „Orte & Räume"), die nicht Teil der Open-Data-Dateien ist.
 *     Hier gibt es nur die grobe Kategorie (welche der vier Listen).
 *   - Geokoordinaten für Orte: die Geografie-Liste enthält nur Namen, keine
 *     Lat/Lon — für eine Verortung im Rhein-Weltkoordinatensystem bräuchte es
 *     einen Abgleich mit den bereits vorhandenen OSM-Quellen (Ortsnamen).
 *
 * Aufruf:  node pipeline/fetch/normalize-hls.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DATA = join(ROOT, '..', 'data', 'hls-dhs-dss')
const OUT = join(ROOT, '..', 'sources', 'hls-glossar.knoten.json')

const LISTEN = [
  { kategorie: 'person', datei: 'liste_bio_d_utf8.csv' },
  { kategorie: 'familie', datei: 'liste_fam_d_utf8.csv' },
  { kategorie: 'ort', datei: 'liste_geo_d_utf8.csv' },
  { kategorie: 'thema', datei: 'liste_tem_d_utf8.csv' },
]

/* ---- minimaler RFC4180-CSV-Parser (Anführungszeichen + verdoppelte "") ---- */
function parseCsvZeile(zeile) {
  const felder = []
  let cur = '', inQuotes = false
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i]
    if (inQuotes) {
      if (c === '"') {
        if (zeile[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = false
      } else cur += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { felder.push(cur); cur = '' }
    else cur += c
  }
  felder.push(cur)
  return felder
}

function leseListe(pfad) {
  const zeilen = readFileSync(pfad, 'utf8').split(/\r?\n/).filter(Boolean)
  return zeilen.slice(1).map(parseCsvZeile).map(([id, lemma, zusatz, praezision, url]) => ({
    id, lemma, zusatz: zusatz || null, praezision: praezision || null, url,
  }))
}

/* ---- Autor:innen (ID → Name), flache XML-Struktur, regexbasiert ---- */
function leseAutoren(pfad) {
  const xml = readFileSync(pfad, 'utf8')
  const autoren = new Map()
  const re = /<AUTOR>\s*<ID>(\d+)<\/ID>\s*<ENTRY>[^<]*<\/ENTRY>\s*<NAME>([^<]*)<\/NAME>\s*<\/AUTOR>/g
  let m
  while ((m = re.exec(xml))) autoren.set(m[1], m[2])
  return autoren
}

/* ---- Zeitraum aus dem Precision-Feld der Biografien ----
 * Muster (Häufigkeit in liste_bio_d_utf8.csv, Stand 2026-08):
 *   "1599 - 1662"              exakt-exakt      (~84 %)
 *   "//1500// - 1551"          circa-exakt      (~7 %)   // = "um"
 *   "1716 - //1795//"          exakt-circa      (~1 %)
 *   "//1308// - //1313//"      circa-circa      (~4 %)
 *   "11. - 13. Jh."            Jahrhundert      (~0.5 %) → grobe Konfidenz
 *   Rest (~3.5 %): Doppeldatierungen ("1308/09"), "?", offene Enden ("1962 -"),
 *   "ante"/"post" inline — bestmöglicher Best-Effort-Extrakt der Jahreszahlen,
 *   als Konfidenz "grob" markiert statt verworfen.
 */
function parseJahrhundert(jh) {
  const n = Number(jh)
  return { von: (n - 1) * 100 + 1, bis: n * 100 }
}

function parseZeitraum(praezision) {
  if (!praezision) return null
  const p = praezision.trim()

  let m = /^(\d{1,2})\.\s*[-/]\s*(\d{1,2})\.\s*Jh\.?$/.exec(p)
  if (m) {
    return {
      von: parseJahrhundert(m[1]).von, bis: parseJahrhundert(m[2]).bis,
      circaVon: true, circaBis: true, konfidenz: 'grob', rohtext: p,
    }
  }
  m = /^(\d{1,2})\.\s*Jh\.?(\s*v\.\s*Chr\.?)?$/.exec(p)
  if (m) {
    let { von, bis } = parseJahrhundert(m[1])
    if (m[2]) { const t = -von; von = -bis; bis = t }
    return { von, bis, circaVon: true, circaBis: true, konfidenz: 'grob', rohtext: p }
  }

  // "v.Chr." auf einer oder beiden Seiten → Jahr negativ, dann wie exakt/circa behandeln
  if (/v\.?\s*Chr\.?/.test(p)) {
    const teile = p.split(/\s*-\s*/)
    if (teile.length === 2) {
      const jahr = (t) => {
        const vChr = /v\.?\s*Chr\.?/.test(t)
        const zahl = Number((t.match(/\d{1,4}/) || [])[0])
        return Number.isFinite(zahl) ? (vChr ? -zahl : zahl) : null
      }
      const von = jahr(teile[0]), bis = jahr(teile[1])
      if (von != null && bis != null) {
        const circa = /\/\//.test(p)
        return { von, bis, circaVon: circa, circaBis: circa, konfidenz: circa ? 'hoch-circa' : 'hoch', rohtext: p }
      }
    }
  }

  m = /^(\/\/)?(\d{3,4})(?:\/\d{2,4})?(\/\/)?\s*-\s*(\/\/)?(\d{3,4})(?:\/\d{2,4})?(\/\/)?$/.exec(p)
  if (m) {
    const circaVon = !!(m[1] && m[3])
    const circaBis = !!(m[4] && m[6])
    return {
      von: Number(m[2]), bis: Number(m[5]),
      circaVon, circaBis,
      konfidenz: (circaVon || circaBis) ? 'hoch-circa' : 'hoch',
      rohtext: p,
    }
  }

  m = /^(\/\/)?(\d{3,4})(?:\/\d{2,4})?(\/\/)?$/.exec(p)
  if (m) {
    const circa = !!(m[1] && m[3])
    return { von: Number(m[2]), bis: Number(m[2]), circaVon: circa, circaBis: circa, konfidenz: circa ? 'hoch-circa' : 'hoch', rohtext: p }
  }

  // Best-Effort: erste und letzte 3-4-stellige Jahreszahl im Text greifen
  // (deckt "?  - 1515", "1962 -", "//1398 - ante 1438//", "1308/09" ab).
  const jahre = p.match(/\d{3,4}/g)
  if (jahre && jahre.length >= 1) {
    return {
      von: Number(jahre[0]), bis: Number(jahre[jahre.length - 1]),
      circaVon: true, circaBis: true, konfidenz: 'grob', rohtext: p,
    }
  }
  return { von: null, bis: null, circaVon: null, circaBis: null, konfidenz: 'unparsierbar', rohtext: p }
}

/* ---- einlesen ---- */
const autoren = leseAutoren(join(DATA, 'authors_d.xml'))
const knoten = []
const statistik = { gesamt: 0, proKategorie: {}, zeitraumKonfidenz: {}, unparsierbareBeispiele: [] }

for (const { kategorie, datei } of LISTEN) {
  const eintraege = leseListe(join(DATA, datei))
  statistik.proKategorie[kategorie] = eintraege.length
  for (const e of eintraege) {
    const knotenEintrag = {
      id: e.id,
      kategorie,
      lemma: e.lemma,
      zusatz: e.zusatz,
      url: e.url,
      autor: autoren.get(e.id) || null,
    }
    if (kategorie === 'person') {
      const zeitraum = parseZeitraum(e.praezision)
      knotenEintrag.zeitraum = zeitraum
      if (zeitraum) {
        statistik.zeitraumKonfidenz[zeitraum.konfidenz] = (statistik.zeitraumKonfidenz[zeitraum.konfidenz] || 0) + 1
        if (zeitraum.konfidenz === 'unparsierbar' && statistik.unparsierbareBeispiele.length < 20) {
          statistik.unparsierbareBeispiele.push(zeitraum.rohtext)
        }
      }
    }
    knoten.push(knotenEintrag)
  }
}
statistik.gesamt = knoten.length

const out = {
  kind: 'hls-glossar-knoten',
  provenance: {
    quelle: 'Historisches Lexikon der Schweiz (HLS) — Open Data',
    url: 'https://hls-dhs-dss.ch/de/opendata',
    lizenz: 'CC-0 (gilt für diese Metadaten-Exporte — NICHT für den Artikel-Volltext, der ist CC BY-SA 4.0)',
    rohdaten: 'pipeline/data/hls-dhs-dss/ (nicht im Repo, upload date der Quelle: 17.08.2026)',
    stand: new Date().toISOString().slice(0, 10),
    einschraenkungen: [
      'Keine Verlinkung zwischen Artikeln (Kanten) — steckt nur im Artikel-Volltext, nicht in den CC-0-Listen.',
      'hls-dhs-dss.ch/robots.txt schliesst ClaudeBot aus (Disallow: /) und markiert Content-Signal ai-train=no, use=reference — Volltext-Scraping für diese Pipeline daher nicht vorgesehen.',
      'Keine feine Raum-/Themen-Taxonomie (die "lexicofacet"-Klassifikation der Website-Suche ist nicht Teil der Open-Data-Dateien) — nur die grobe Kategorie (Person/Familie/Ort/Thema).',
      'Keine Geokoordinaten für Orte — nur Namen; Verortung bräuchte Abgleich mit den OSM-Ortsnamen der Kartenpipeline.',
      'Zeitraum bei Personen aus dem Precision-Feld geparst, teils Best-Effort (siehe zeitraum.konfidenz je Knoten).',
      'authors_d.xml ist trotz Beschreibung ("Autoren aller Artikel") kein Artikel→Autor:in-Mapping, sondern ein Autor:innen-Verzeichnis: 3251 Einträge, jede:r Autor:in genau einmal mit EINEM Beispielartikel. Das autor-Feld ist daher nur bei ~3-20 % der Knoten befüllt (der jeweilige Beispielartikel dieser Autor:innen), nicht bei jedem Artikel.',
    ],
  },
  statistik,
  knoten,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`Knoten gesamt: ${statistik.gesamt}`)
console.log('pro Kategorie:', statistik.proKategorie)
console.log('Zeitraum-Konfidenz (nur Personen):', statistik.zeitraumKonfidenz)
if (statistik.unparsierbareBeispiele.length) {
  console.log('unparsierbare Precision-Beispiele:', statistik.unparsierbareBeispiele)
}
console.log(`geschrieben: ${OUT} (${(JSON.stringify(out).length / 1024 / 1024).toFixed(1)} MB)`)
