// Läuft auf jeder HLS-Artikelseite. Liest die aktuelle Artikel-ID aus der URL,
// sammelt Titel/Thema/Zeitraum/Raum sowie alle ausgehenden Links auf andere
// HLS-Artikel und schickt sie ans Background-Skript zum Schreiben in den
// Downloads-Ordner.
(function () {
  const idAusPfad = location.pathname.match(/\/articles\/(\d+)/)
  if (!idAusPfad) return
  const id = String(Number(idAusPfad[1])) // führende Nullen weg, konsistent mit hls-glossar.knoten.json

  function linkeArtikelId(href) {
    const m = href.match(/hls-dhs-dss\.ch\/[a-z]{2}\/articles\/(\d+)/)
    return m ? String(Number(m[1])) : null
  }

  function sammleLinks() {
    const gesehen = new Map()
    for (const a of document.querySelectorAll('a[href]')) {
      const linkId = linkeArtikelId(a.href)
      if (!linkId || linkId === id || gesehen.has(linkId)) continue
      gesehen.set(linkId, { id: linkId, href: a.href, text: a.textContent.trim().slice(0, 200) })
    }
    return [...gesehen.values()]
  }

  // Titel: h1.hls-article-title trägt .hls-lemma (+ .hls-complement bei Personen/
  // Familien) — dieselbe Aufteilung wie Lemma/Zusatz in hls-glossar.knoten.json.
  function lemmaUndZusatz() {
    const h1 = document.querySelector('h1.hls-article-title')
    const lemma = h1?.querySelector('.hls-lemma')?.textContent.trim() || h1?.textContent.trim() || document.title.trim()
    const zusatz = h1?.querySelector('.hls-complement')?.textContent.trim() || null
    return { lemma, zusatz }
  }

  function autor() {
    const el = document.querySelector('.hls-article-text-author')
    if (!el) return null
    return el.textContent.replace(/^[^:]*:/, '').trim() || null
  }

  // Alle "Service-Boxen" der Seite generisch einlesen (Systematik, Kurzinformationen,
  // Weblinks/Normdateien) — Titel der Box → Zeilen (Zelltexte + evtl. Link-href).
  function serviceBoxen() {
    const boxen = {}
    for (const el of document.querySelectorAll('.hls-service-box-element')) {
      const titel = el.querySelector('.hls-service-box-title')?.textContent.trim()
      if (!titel) continue
      const zeilen = [...el.querySelectorAll('table tr')].map((tr) => {
        const link = tr.querySelector('a[href]')
        const zellText = (td) => {
          const klon = td.cloneNode(true)
          klon.querySelectorAll('[itemprop]').forEach((n) => n.remove()) // versteckte schema.org-Duplikate raus
          return klon.textContent.replace(/\s+/g, ' ').trim()
        }
        return {
          text: [...tr.querySelectorAll('td')].map(zellText).filter(Boolean),
          href: link ? link.getAttribute('href') : null,
        }
      })
      boxen[titel] = zeilen
    }
    return boxen
  }

  // Thema: "Systematik"-Box — Klassifikationspfad + interner Facetten-Code.
  function sammleThema(boxen) {
    return (boxen['Systematik'] || []).map((z) => {
      const m = z.href ? z.href.match(/lexicofacet_string=([^&]+)/) : null
      return { pfad: z.text[0] || null, code: m ? decodeURIComponent(m[1]) : null }
    })
  }

  // Zeitraum: schema.org-Microdaten zuerst (exakt, ISO — nur bei Personen vorhanden,
  // leer wenn das Datum unsicher/circa ist), sonst die "Lebensdaten"-Zeile aus
  // Kurzinformationen als Rohtext ("∗ um 1500 ✝ 28.5.1551").
  function sammleZeitraum(boxen) {
    const schemaDatum = (prop) => document.querySelector(`[itemprop="${prop}"]`)?.textContent.trim() || null
    const geburt = schemaDatum('birthDate')
    const tod = schemaDatum('deathDate')
    const lebensdaten = (boxen['Kurzinformationen'] || []).find((z) => /Lebensdaten/i.test(z.text[0] || ''))
    const rohtext = lebensdaten ? lebensdaten.text[1] || null : null
    if (!geburt && !tod && !rohtext) return null
    return { geburt, tod, rohtext }
  }

  // Inhaltsverzeichnis: .hls-toc > ol.hls-toc-list, verschachtelt (Unterabschnitte
  // als <ol> im <li>). Nur bei mehrgliedrigen Artikeln vorhanden — kurze Artikel
  // (z.B. reine Kurzbiografien) haben keins, dann []. Die letzten Einträge
  // ("Quellen und Literatur", "Weitere Artikelinformationen") sind keine echten
  // Inhaltsabschnitte, sondern Seitenstruktur — als eigenschaft:true markiert.
  function sammleInhaltsverzeichnis() {
    function leseListe(ol) {
      return [...ol.querySelectorAll(':scope > li.hls-toc-entry')].map((li) => {
        const a = li.querySelector(':scope > span.wikilink > a.hls-toc-entry-title')
          || li.querySelector(':scope > a.hls-toc-entry-title')
        const unterliste = li.querySelector(':scope > ol')
        return {
          titel: a ? a.textContent.trim() : null,
          anker: a ? a.getAttribute('href') : null,
          eigenschaft: li.classList.contains('hls-toc-entry-article-properties'),
          kinder: unterliste ? leseListe(unterliste) : [],
        }
      })
    }
    const liste = document.querySelector('.hls-toc > .hls-toc-list')
    return liste ? leseListe(liste) : []
  }

  // Raum: bewusst nicht mehr erfasst. Die Kantonskürzel-Heuristik (Klammer-
  // Abkürzung im Fliesstext) griff auf Sachthemen-Artikeln (Epoche 1: Steinzeit/
  // Bronzezeit-Kulturen, Technologien) fast nur Rauschen ab (z.B. "Bildhauerei"
  // → "UR", weil irgendwo im Text ein Beispielfundort erwähnt wird — keine
  // echte Zuordnung des Themas zu einer Region). Ohne strukturiertes Feld auf
  // der Seite selbst lässt sich Raum nicht verlässlich automatisch ableiten.

  const boxen = serviceBoxen()
  const { lemma, zusatz } = lemmaUndZusatz()
  const thema = sammleThema(boxen)
  const zeitraum = sammleZeitraum(boxen)
  const links = sammleLinks()
  const inhaltsverzeichnis = sammleInhaltsverzeichnis()

  if (links.length === 0 && thema.length === 0 && !zeitraum && inhaltsverzeichnis.length === 0) return // nichts gefunden

  chrome.runtime.sendMessage({
    type: 'hls-artikel',
    payload: {
      id,
      url: location.href,
      lemma,
      zusatz,
      titel: zusatz ? `${lemma}, ${zusatz}` : lemma,
      autor: autor(),
      thema,
      zeitraum,
      inhaltsverzeichnis,
      erfasstAm: new Date().toISOString(),
      links,
    },
  })
})()
