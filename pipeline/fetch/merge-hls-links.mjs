#!/usr/bin/env node
/*
 * merge-hls-links.mjs — liest die vom HLS Link-Sammler
 * (pipeline/tools/hls-link-collector/) eingesammelten Artikel-JSONs aus dem
 * Downloads-Ordner und baut daraus eine handkuratierte Ergänzungsquelle:
 * Kanten (Verlinkung zwischen Artikeln) + die Facetten Thema/Zeitraum, die
 * direkt von den Artikelseiten stammen — nicht Teil der CC-0-Exporte in
 * hls-glossar.knoten.json. Analog zu handkuratiert.rhein.geo.json in der
 * Kartenpipeline: eigene, separate Quelle, wächst mit jedem besuchten Artikel,
 * nie vollständig (kein Vollcrawl — siehe Einschränkungen in pipeline/README.md).
 *
 * Aufruf:  node pipeline/fetch/merge-hls-links.mjs [Ordner]
 *          Ordner-Reihenfolge: Argument > $env:HLS_LINKS_ORDNER >
 *          <Downloads>/hls-links (Standard-Unterordner der Extension).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ORDNER = process.argv[2] || process.env.HLS_LINKS_ORDNER || join(homedir(), 'Downloads', 'hls-links')
const OUT = join(ROOT, '..', 'sources', 'hls-glossar.erfasst.json')

/* Zeitraum aus dem von content.js gelieferten {geburt, tod, rohtext} (siehe
 * pipeline/tools/hls-link-collector/README.md) in dieselbe Form bringen wie
 * normalize-hls.mjs (von/bis/circaVon/circaBis/konfidenz/rohtext) — damit
 * beide Quellen später gleich behandelt werden können. geburt/tod sind
 * schema.org-ISO-Daten und NUR gefüllt wenn exakt bekannt (leer = "um"/circa,
 * das ist hier das verlässlichere Signal als Text-Heuristik auf dem Rohtext).
 */
function parseZeitraum(zeitraum) {
  if (!zeitraum) return null
  const jahrAusIso = (iso) => (iso ? Number(iso.slice(0, 4)) : null)
  const jahrAusTeil = (re) => {
    const m = zeitraum.rohtext ? zeitraum.rohtext.match(re) : null
    const zahlen = m ? m[1].match(/\d{3,4}/g) : null
    return zahlen ? Number(zahlen[zahlen.length - 1]) : null
  }
  const von = jahrAusIso(zeitraum.geburt) ?? jahrAusTeil(/∗[^\d]*([^✝]*)/)
  const bis = jahrAusIso(zeitraum.tod) ?? jahrAusTeil(/✝\s*(.*)/)
  if (von == null && bis == null) return null
  return {
    von, bis,
    circaVon: !zeitraum.geburt,
    circaBis: !zeitraum.tod,
    konfidenz: zeitraum.geburt && zeitraum.tod ? 'schema-exakt' : 'schema-teilweise',
    rohtext: zeitraum.rohtext,
  }
}

let dateien
try {
  dateien = readdirSync(ORDNER).filter((f) => f.endsWith('.json'))
} catch (err) {
  console.error(`Ordner nicht lesbar: ${ORDNER}`)
  console.error(String(err.message || err))
  process.exit(1)
}

const knoten = []
const kanten = []
const statistik = { artikelGelesen: 0, uebersprungen: 0, kanten: 0, mitThema: 0, mitZeitraum: 0, mitInhaltsverzeichnis: 0 }

for (const datei of dateien) {
  let artikel
  try {
    artikel = JSON.parse(readFileSync(join(ORDNER, datei), 'utf8'))
  } catch {
    console.warn(`übersprungen (kein gültiges JSON): ${datei}`)
    statistik.uebersprungen++
    continue
  }
  if (!artikel?.id) { statistik.uebersprungen++; continue }

  const zeitraum = parseZeitraum(artikel.zeitraum)
  knoten.push({
    id: artikel.id,
    lemma: artikel.lemma,
    zusatz: artikel.zusatz,
    titel: artikel.titel,
    autor: artikel.autor,
    url: artikel.url,
    thema: artikel.thema || [],
    zeitraum,
    inhaltsverzeichnis: artikel.inhaltsverzeichnis || [],
    erfasstAm: artikel.erfasstAm,
  })
  statistik.artikelGelesen++
  if (artikel.thema?.length) statistik.mitThema++
  if (zeitraum) statistik.mitZeitraum++
  if (artikel.inhaltsverzeichnis?.length) statistik.mitInhaltsverzeichnis++

  for (const link of artikel.links || []) {
    kanten.push({ von: artikel.id, nach: link.id, text: link.text })
  }
}
statistik.kanten = kanten.length

const out = {
  kind: 'hls-glossar-erfasst',
  provenance: {
    quelle: 'HLS Link-Sammler (pipeline/tools/hls-link-collector) — manuelles Browsing, kein Vollcrawl',
    quellordner: ORDNER,
    stand: new Date().toISOString().slice(0, 10),
    hinweis: 'Ergänzt hls-glossar.knoten.json (CC-0-Export) um Kanten (Verlinkung zwischen Artikeln), die Facetten Thema/Zeitraum und das Inhaltsverzeichnis, die nur auf den Artikelseiten selbst stehen, nicht in den Open-Data-Dateien. Wächst mit jedem besuchten Artikel — kein Anspruch auf Vollständigkeit des Graphen.',
    keinRaum: 'Die Facette Raum wird bewusst nicht erfasst: ohne strukturiertes Feld auf der Seite lieferte die Kantonskürzel-Heuristik auf Sachthemen-Artikeln fast nur Rauschen (z.B. "Bildhauerei" → "UR" wegen eines beiläufig erwähnten Fundorts).',
  },
  statistik,
  knoten,
  kanten,
}
writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(`gelesen: ${statistik.artikelGelesen} Artikel (${statistik.uebersprungen} übersprungen) aus ${ORDNER}`)
console.log(`Kanten: ${statistik.kanten} · mit Thema: ${statistik.mitThema} · mit Zeitraum: ${statistik.mitZeitraum} · mit Inhaltsverzeichnis: ${statistik.mitInhaltsverzeichnis}`)
console.log(`geschrieben: ${OUT}`)
