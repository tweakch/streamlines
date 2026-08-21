document.addEventListener('DOMContentLoaded', async () => {
  const ordnerInput = document.getElementById('ordner')
  const status = document.getElementById('status')

  const { ordner } = await chrome.storage.sync.get({ ordner: 'hls-links' })
  ordnerInput.value = ordner

  document.getElementById('speichern').addEventListener('click', async () => {
    const wert = ordnerInput.value.trim() || 'hls-links'
    await chrome.storage.sync.set({ ordner: wert })
    ordnerInput.value = wert
    status.textContent = 'Gespeichert.'
    setTimeout(() => { status.textContent = '' }, 2000)
  })

  const { anzahl = 0, letzte = [] } = await chrome.storage.session.get({ anzahl: 0, letzte: [] })
  document.getElementById('anzahl').textContent = anzahl

  const liste = document.getElementById('letzte')
  for (const eintrag of letzte) {
    const li = document.createElement('li')
    const marken = [
      `${eintrag.links} Links`,
      `${eintrag.thema} Thema`,
      eintrag.zeitraum ? 'Zeitraum' : null,
      eintrag.raum ? 'Raum' : null,
    ].filter(Boolean).join(' · ')
    li.textContent = `${eintrag.titel} (#${eintrag.id}) — ${marken}`
    liste.appendChild(li)
  }
})
