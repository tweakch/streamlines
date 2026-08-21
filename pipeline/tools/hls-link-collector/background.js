const STANDARD_ORDNER = 'hls-links'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'hls-artikel') return
  schreibeArtikel(msg.payload)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => {
      console.error('HLS Link-Sammler: Download fehlgeschlagen', err)
      sendResponse({ ok: false, error: String(err) })
    })
  return true // asynchrone Antwort
})

async function schreibeArtikel(payload) {
  const { ordner } = await chrome.storage.sync.get({ ordner: STANDARD_ORDNER })
  const json = JSON.stringify(payload, null, 2)
  const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json)
  const filename = `${ordner.trim() || STANDARD_ORDNER}/${payload.id}.json`

  await chrome.downloads.download({ url, filename, conflictAction: 'overwrite', saveAs: false })

  const { anzahl = 0, letzte = [] } = await chrome.storage.session.get(['anzahl', 'letzte'])
  const eintrag = {
    id: payload.id,
    titel: payload.titel,
    links: payload.links.length,
    thema: payload.thema.length,
    zeitraum: !!payload.zeitraum,
    raum: !!payload.raum,
  }
  const neueLetzte = [eintrag, ...letzte.filter((e) => e.id !== payload.id)].slice(0, 15)
  await chrome.storage.session.set({ anzahl: anzahl + 1, letzte: neueLetzte })
}
