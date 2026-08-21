#!/usr/bin/env node
/*
 * bake-eiszeit.mjs — Datenfile für den Prototyp `eiszeit-labor-v3`.
 *
 * Backt ein Hexraster über dem GANZEN ALPENBOGEN — von den Endmoränen des
 * Rhônegletschers bei Lyon bis ins Klagenfurter Becken, von der Po-Ebene bis
 * an die Donau — mit echten Höhen aus sechs Sonny-DTMs (FR, CH, IT, AT, DE)
 * und schreibt es als `prototype/drafts/eiszeit-labor-v3.data.js`.
 *
 * Bis Aug 2026 deckte das Raster nur Linth- und Alpenrheingletscher ab (7.95–10
 * °O, 46.4–47.85 °N). Diese Region ist weiterhin mit Flags erreichbar:
 *   node pipeline/fetch/bake-eiszeit.mjs --lonW=7.95 --lonE=10 --latS=46.4 --latN=47.85
 * — sie ist aber NICHT dasselbe Gitter wie damals: `c0`/`r0` rasten auf das
 * globale Hexgitter ein, die Zellen sind also dieselben, die Ausschnittsgrenzen
 * aber nicht.
 *
 * Warum dieses Skript beide Pipeline-Stufen überspannt (und deshalb hier in
 * fetch/ liegt): es liest das rohe GeoTIFF (dafür braucht es die einzige
 * npm-Dependency der Pipeline, `geotiff`) UND die normalisierten Geo-Quellen,
 * schreibt aber direkt das Prototyp-Datenfile. Es legt bewusst KEINE neue
 * Höhenquelle in pipeline/sources/ ab: bake.mjs würde jede zusätzliche
 * `kind:"hoehen"`-Datei in die Region der DTM-Ebene des Rhein-Tilesets
 * einrechnen und damit stillschweigend dessen Ausschnitt verändern.
 *
 * Aufruf:  node pipeline/fetch/bake-eiszeit.mjs
 *          node pipeline/fetch/bake-eiszeit.mjs --hexKm=1.5 --lonW=8.2 --lonE=10.5 --latS=46.3 --latN=47.9
 */
import { stapelOeffnen } from './hoehen-quellen.mjs'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const SQRT3 = Math.sqrt(3)

/* ---------- Konfiguration ---------- */
/* Region: der ganze Alpenbogen. Die Grenzen sind keine runden Zahlen, sondern
   die BELEGTEN MAXIMALSTÄNDE plus Rand — das Nährgebiet muss mit drin sein,
   sonst fehlt dem Modell der Eisnachschub, und die Zungenenden müssen mit drin
   sein, sonst gibt es nichts zu kalibrieren:
     West  4.7 °O — Endmoränen des Rhônegletschers in der Dombes bei Lyon (5.05)
     Ost  14.9 °O — Klagenfurter Becken (Draugletscher, 14.31) und der
                    Murgletscher bei Judenburg (14.66)
     Süd  44.9 °N — die Amphitheater der Po-Ebene: Ivrea (45.47), Como/Brianza
                    (45.68), Garda mit Südspitze bei Villafranca (45.35)
     Nord 48.6 °N — die Donau als Nordgrenze des Vorlandes; Illerlappen (47.98)
                    und Salzachlappen (48.02) liegen mit Abstand darunter
   Ein Loch bleibt: Slowenien und die Nordadria (östlich 13.5 °O, südlich 46.6
   °N) deckt keine Quelle. Diese Felder werden NICHT gefüllt (siehe `fuellMax`),
   sie tragen Bit3 und liegen ausserhalb der Modellfläche. Copernicus GLO-30
   würde die Lücke schliessen und steht dafür im Register bereit. */
const DEFAULTS = { lonW: 4.7, lonE: 14.9, latS: 44.9, latN: 48.6, hexKm: 1, fuellMax: 12 }
const argv = Object.fromEntries(
  process.argv.slice(2)
    .map((a) => a.match(/^--([a-zA-Z]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], Number(m[2])]),
)
const REGION = {
  lonW: argv.lonW ?? DEFAULTS.lonW, lonE: argv.lonE ?? DEFAULTS.lonE,
  latS: argv.latS ?? DEFAULTS.latS, latN: argv.latN ?? DEFAULTS.latN,
}
const HEXKM = argv.hexKm ?? DEFAULTS.hexKm
/* Wie weit darf ein Loch aus den Nachbarn gefüllt werden? Am Landesrand sind
   ein paar Kilometer Schätzung vertretbar (das Relief dahinter ist bekannt);
   ein 15 000 km² grosses Loch wie Slowenien ist es nicht — dort würde die
   Wellenfront die Julischen Alpen als glattes Hochplateau nach Süden schmieren
   und dem Modell ein Nährgebiet erfinden, das es nicht gibt. */
const FUELL_MAX = argv.fuellMax ?? DEFAULTS.fuellMax
for (const [k, v] of Object.entries({ ...REGION, HEXKM, FUELL_MAX })) {
  if (!Number.isFinite(v)) { console.error(`Ungültiger Wert für ${k}`); process.exit(1) }
}

/* Projektion identisch zu bake.mjs — damit Zellen/Kilometer mit dem
   Rhein-Tileset vergleichbar bleiben (dieselbe lokale Plattkarte). */
const CFG = { lon0: 3.8, lat1: 52.2, kmx: 72.7, kmy: 110.6 }
const SRC_DIR = join(ROOT, '..', 'sources')
const OUT = join(ROOT, '..', '..', 'prototype', 'drafts', 'eiszeit-labor-v3.data.js')

/* ---------- Geometrie (identisch zu bake.mjs) ---------- */
const kmOf = (lon, lat) => [(lon - CFG.lon0) * CFG.kmx, (CFG.lat1 - lat) * CFG.kmy]
const lonLatOf = (x, y) => [CFG.lon0 + x / CFG.kmx, CFG.lat1 - y / CFG.kmy]
const axialOf = (c, r) => c - ((r - (r & 1)) / 2)
const offsetOf = (q, r) => [q + ((r - (r & 1)) / 2), r]
const centerKm = (c, r, s) => [s * SQRT3 * (axialOf(c, r) + r / 2), s * 1.5 * r]
function cubeRound(x, y, z) {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z)
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy > dz) ry = -rx - rz
  else rz = -rx - ry
  return [rx, ry, rz]
}
function cellAtKm(x, y, s) {
  const q = ((SQRT3 / 3) * x - y / 3) / s
  const r = ((2 / 3) * y) / s
  const [cx, , cz] = cubeRound(q, -q - r, r)
  return offsetOf(cx, cz)
}
function hexLine(a, b) {
  const A = [axialOf(...a), 0, a[1]]; A[1] = -A[0] - A[2]
  const B = [axialOf(...b), 0, b[1]]; B[1] = -B[0] - B[2]
  const N = Math.max(1, Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]))
  const out = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, , z] = cubeRound(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
    out.push(offsetOf(x, z))
  }
  return out
}
function pip(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/* ---------- Höhenquellen als Stapel öffnen ----------
   Statt EINER Datei ein Register mit Vorrang (sources/hoehen.manifest.json):
   die erste Quelle, die für einen Punkt einen Wert liefert, gewinnt — LiDAR
   vor Radar. Gelesen wird blockweise und auf `--maxAufl` ausgedünnt, damit
   eine 10-m-Quelle für Österreich nicht ein Gigabyte in den Speicher holt, nur
   um auf 200 m abgetastet zu werden.

   Bei 50 m (Vorgabe) liest die CH-Quelle mit Schritt 1, also ihr natives
   Raster, und die Interpolation ist dieselbe wie vorher: die Höhen der
   Schweizer Felder bleiben Wert für Wert dieselben wie vor dem Umbau, die
   Kalibrierung des Eismodells verschiebt sich nicht.                        */
console.log(`Region ${REGION.lonW}–${REGION.lonE}°O, ${REGION.latS}–${REGION.latN}°N · ${HEXKM} km/Hex`)
const STAPEL = await stapelOeffnen(REGION, { maxAuflM: argv.maxAufl ?? 50, fuer: 'eiszeit' })

/* ---------- Hexraster aufspannen ---------- */
const s = HEXKM / SQRT3
const [xNW, yNW] = kmOf(REGION.lonW, REGION.latN)
const [xSE, ySE] = kmOf(REGION.lonE, REGION.latS)
/* Auf das globale Hexgitter von bake.mjs einrasten; r0 gerade halten, damit
   die odd-r-Parität lokal wie global ist (identische Nachbartabellen). */
let r0 = Math.floor(yNW / (s * 1.5)); if (r0 & 1) r0--
const c0 = Math.floor(xNW / (s * SQRT3)) - 1
const cols = Math.ceil((xSE - xNW) / (s * SQRT3)) + 2
const rows = Math.ceil((ySE - yNW) / (s * 1.5)) + 2
const N = cols * rows
const idx = (c, r) => r * cols + c
const [oxKm, oyKm] = centerKm(c0, r0, s)
console.log(`Hexraster: ${cols}×${rows} = ${N} Zellen (Ursprungszelle ${c0},${r0})`)

/* ---------- Höhen sammeln: Mittel/Min/Max je Hex (200-m-Stichproben) ---------- */
const elev = new Int16Array(N), emin = new Int16Array(N), emax = new Int16Array(N)
const flags = new Uint8Array(N) // Bit0 geschätzt · Bit1 See · Bit2 Fluss · Bit3 leer · Bit4 Becken
const F = { GESCHAETZT: 1, SEE: 2, FLUSS: 4, LEER: 8, BECKEN: 16 }
const STEP = 0.2 // km Stichprobenabstand innerhalb der Zelle
/* Welche Quelle die Zelle getragen hat (0 = keine, sonst Nummer aus
   STAPEL.legende()). Damit ist die Herkunft einer Höhe im Prototyp
   nachschlagbar und nicht mehr nur „echt oder geschätzt“. */
const quelle = new Uint8Array(N)
const zaehler = new Int32Array(STAPEL.quellen.length + 1)
let nOk = 0, nNo = 0
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const [cx, cy] = centerKm(c0 + c, r0 + r, s)
    let sum = 0, n = 0, mn = Infinity, mx = -Infinity
    zaehler.fill(0)
    for (let dy = -HEXKM / 2; dy <= HEXKM / 2 + 1e-9; dy += STEP)
      for (let dx = -HEXKM / 2; dx <= HEXKM / 2 + 1e-9; dx += STEP) {
        const x = cx + dx, y = cy + dy
        const [pc, pr] = cellAtKm(x, y, s)
        if (pc !== c0 + c || pr !== r0 + r) continue // Punkt gehört zum Nachbarn
        const [lon, lat] = lonLatOf(x, y)
        const t = STAPEL.hoehe(lon, lat)
        if (t == null) continue
        sum += t.h; n++
        zaehler[t.q]++
        if (t.h < mn) mn = t.h
        if (t.h > mx) mx = t.h
      }
    const i = idx(c, r)
    if (n) {
      elev[i] = Math.round(sum / n); emin[i] = Math.round(mn); emax[i] = Math.round(mx); nOk++
      /* Eine Zelle am Landesrand bekommt Stichproben aus zwei Quellen — die
         mit den meisten Treffern gilt als ihre Herkunft. */
      let best = 0
      for (let k = 1; k < zaehler.length; k++) if (zaehler[k] > zaehler[best]) best = k
      quelle[i] = best
    } else { flags[i] |= F.GESCHAETZT; nNo++ }
  }
}
console.log(`Höhen: ${nOk} Zellen aus Quellen, ${nNo} ohne Deckung (${((100 * nNo) / N).toFixed(1)} %)`)
STAPEL.bericht()
if (!nOk) { console.error('Keine Höhenwerte — Region ausserhalb aller Quellen?'); process.exit(1) }

/* ---------- Löcher füllen: nächster bekannter Nachbar, dann glätten ---------- */
/* Das DTM endet an der Landesgrenze (Vorarlberg, Liechtenstein, Süddeutschland,
   Südtirol). Ungefüllt liefe die Eisfront dort gegen eine künstliche Wand aus
   Höhe 0. Gefüllt wird mit dem WERT DES NÄCHSTEN bekannten Nachbarn (nicht mit
   dem Nachbarmittel): ein Mittelwert würde die grenznahen Ketten — Rätikon,
   Silvretta — auf Talhöhe herunterglätten, und das Eis würde sie überfluten.
   Nächster Nachbar erhält die Grössenordnung des Reliefs, die Front bleibt
   dort also gesperrt, wo real ein Gebirge steht. Bit0 markiert alle
   geschätzten Zellen — der Prototyp schraffiert sie und kann sie ausschliessen. */
/* Nachbarschaft odd-r, Eintraege als [dr, dc] wie in bake.mjs und grid.ts */
const DIRS_EVEN = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
const DIRS_ODD = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
const dirsOf = (r) => ((r0 + r) % 2 ? DIRS_ODD : DIRS_EVEN)
let leerN = 0
{
  const bekannt = new Uint8Array(N)
  let front = []
  for (let i = 0; i < N; i++) if (!(flags[i] & F.GESCHAETZT)) { bekannt[i] = 1; front.push(i) }
  let runde = 0
  while (front.length && runde++ < FUELL_MAX) {
    const naechste = []
    for (const i of front) {
      const c = i % cols, r = (i - c) / cols
      for (const [dr, dc] of dirsOf(r)) {
        const nc = c + dc, nr = r + dr
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue
        const j = idx(nc, nr)
        if (bekannt[j]) continue
        bekannt[j] = 1
        elev[j] = elev[i]; emin[j] = emin[i]; emax[j] = emax[i]
        naechste.push(j)
      }
    }
    front = naechste
  }
  /* Was die Wellenfront in FUELL_MAX Runden nicht erreicht hat, ist kein
     Landesrand mehr, sondern ein echtes Loch. Solche Felder werden NICHT
     geschätzt: sie tragen Bit3 statt Bit0, behalten Höhe 0 und liegen für den
     Prototyp ausserhalb der Modellfläche (kein Eis, kein Fliessweg, nicht in
     den Kennzahlen). Eine erfundene Höhe wäre hier schlimmer als ein Loch —
     ein glatt gerampter Hochplateau-Keil erfindet dem Eis ein Nährgebiet. */
  let offen = 0
  for (let i = 0; i < N; i++) {
    if (bekannt[i]) continue
    flags[i] = (flags[i] & ~F.GESCHAETZT) | F.LEER
    elev[i] = 0; emin[i] = 0; emax[i] = 0
    offen++
  }
  leerN = offen
  if (offen) console.warn(`${offen} Zellen ohne Quelle in Reichweite (${(100*offen/N).toFixed(1)} %)`
    + ` — Bit3 „leer“, ausserhalb der Modellfläche.`)
  /* Die Wellenfront hinterlässt Voronoi-Keile (in der Karte als Streifen
     sichtbar). Deshalb darüber ein Laplace-Ausgleich: die geschätzten Zellen
     werden wiederholt aufs Nachbarmittel gezogen, die echten Höhen bleiben als
     Randbedingung stehen — glatte Rampen statt Keile. Im Relief eine Erfindung,
     aber eine ruhige; Bit0 markiert sie. */
  for (let pass = 0; pass < 30; pass++) {
    const neu = new Int16Array(elev)
    for (let i = 0; i < N; i++) {
      if (!(flags[i] & F.GESCHAETZT)) continue
      const c = i % cols, r = (i - c) / cols
      let sum = elev[i], n = 1
      for (const [dr, dc] of dirsOf(r)) {
        const nc = c + dc, nr = r + dr
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue
        const j = idx(nc, nr)
        if (flags[j] & F.LEER) continue // Höhe 0 — würde die Rampe nach unten ziehen
        sum += elev[j]; n++
      }
      neu[i] = Math.round(sum / n)
    }
    elev.set(neu)
  }
}

/* ---------- Gewässer aus den normalisierten Quellen ---------- */
/* Heutige Seen und Flüsse — im Eiszeit-Modell nur Orientierungshilfe (sie sind
   grösstenteils erst ein Produkt der Vergletscherung). */
const feats = []
const provenance = []
for (const f of readdirSync(SRC_DIR)) {
  if (!f.endsWith('.geo.json')) continue
  const gj = JSON.parse(readFileSync(join(SRC_DIR, f), 'utf8'))
  const kinds = [...new Set(gj.features.map((x) => x.properties.kind))].sort()
  provenance.push({ file: f, kinds, ...(gj.provenance ?? {}) })
  feats.push(...gj.features)
}
const ringsOf = (geom) => (geom.type === 'MultiPolygon' ? geom.coordinates.map((p) => p[0]) : [geom.coordinates[0]])
const inGrid = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows

/* ---------- Zungenbecken ausschürfen ----------
   Ein DTM gibt für eine Wasserfläche die Höhe des WASSERSPIEGELS. Der Gardasee
   steht damit als ebene Fläche auf 65 m ü. M. im Raster — sein Boden liegt
   281 m UNTER dem Meeresspiegel. Genau diese Übertiefung ist das, wohinein die
   Zungen gekalbt haben: sie ist die Handschrift der Vergletscherung, und ohne
   sie ist die tiefste Wasserfläche im Modell rund 130 m tief und das Kalben
   bleibt wirkungslos (gemessen: Kalbungsraten 2.4 und 1.0 m/a je m ergaben
   dieselbe Eisfläche auf 10 km² — ein Gesetz ohne Angriffsfläche).

   Also wird der Boden eingesenkt: je Feld der Abstand zum Ufer (BFS innerhalb
   der Seefläche), auf die grösste Entfernung normiert, und daraus eine
   Wanne — flach am Ufer, tief in der Mitte. Der Exponent 0.6 macht sie
   flacher als eine Parabel, weil übertiefte Trogseen steile Wände und einen
   breiten flachen Boden haben. Die MAXIMALTIEFE ist handkuratiert (Literatur,
   Feld `tiefe` in osm-seen.geo.json), die Form ist erfunden — Bit4 markiert
   jedes so veränderte Feld, damit die Herkunft der Höhe nachvollziehbar bleibt. */
const DIRS_E2 = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]
const DIRS_O2 = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
let nBecken = 0, beckenListe = []
function beckenSchuerfen(f, zellen) {
  const tiefe = f.properties.tiefe
  const drin = new Set(zellen)
  /* Ufer = Seefeld mit mindestens einem Nachbarn ausserhalb des Sees. */
  const dist = new Map()
  let front = []
  for (const i of drin) {
    const c = i % cols, r = (i - c) / cols
    const dirs = ((r0 + r) % 2) ? DIRS_O2 : DIRS_E2
    let ufer = false
    for (const [dr, dc] of dirs) {
      const nc = c + dc, nr = r + dr
      if (!inGrid(nc, nr) || !drin.has(idx(nc, nr))) { ufer = true; break }
    }
    if (ufer) { dist.set(i, 1); front.push(i) }
  }
  if (!front.length) { front = [zellen[0]]; dist.set(zellen[0], 1) }
  let maxD = 1
  while (front.length) {
    const next = []
    for (const i of front) {
      const c = i % cols, r = (i - c) / cols
      const dirs = ((r0 + r) % 2) ? DIRS_O2 : DIRS_E2
      for (const [dr, dc] of dirs) {
        const nc = c + dc, nr = r + dr
        if (!inGrid(nc, nr)) continue
        const j = idx(nc, nr)
        if (!drin.has(j) || dist.has(j)) continue
        const d = dist.get(i) + 1
        dist.set(j, d); if (d > maxD) maxD = d
        next.push(j)
      }
    }
    front = next
  }
  let tiefste = 0
  for (const i of drin) {
    const dn = maxD > 1 ? (dist.get(i) - 1) / (maxD - 1) : 1
    const senk = Math.round(tiefe * Math.pow(dn, 0.6))
    if (!senk) continue
    elev[i] -= senk; emin[i] -= senk; emax[i] -= senk
    flags[i] |= F.BECKEN
    nBecken++
    if (senk > tiefste) tiefste = senk
  }
  beckenListe.push({ name: f.properties.name, tiefeM: tiefe, zellen: zellen.length,
    tiefsteSenkungM: tiefste, sohleM: Math.min(...zellen.map((i) => elev[i])) })
}
let nSee = 0, nFluss = 0
for (const f of feats) {
  const kind = f.properties.kind
  if (kind === 'see' || kind === 'meer') {
    const meine = []
    for (const ring of ringsOf(f.geometry)) {
      const km = ring.map(([lon, lat]) => kmOf(lon, lat))
      const xs = km.map((p) => p[0]), ys = km.map((p) => p[1])
      const cA = Math.max(0, Math.floor((Math.min(...xs) - oxKm) / (s * SQRT3)) - 1)
      const cB = Math.min(cols - 1, Math.ceil((Math.max(...xs) - oxKm) / (s * SQRT3)) + 1)
      const rA = Math.max(0, Math.floor((Math.min(...ys) - oyKm) / (s * 1.5)) - 1)
      const rB = Math.min(rows - 1, Math.ceil((Math.max(...ys) - oyKm) / (s * 1.5)) + 1)
      for (let r = rA; r <= rB; r++)
        for (let c = cA; c <= cB; c++) {
          const [x, y] = centerKm(c0 + c, r0 + r, s)
          if (!pip(x, y, km)) continue
          const i = idx(c, r)
          if (!(flags[i] & F.SEE)) { flags[i] |= F.SEE; nSee++ }
          meine.push(i)
        }
    }
    if (f.properties.tiefe && meine.length) beckenSchuerfen(f, meine)
  } else if (kind === 'hauptlauf' || kind === 'nebenlauf') {
    const pts = f.geometry.coordinates.map(([lon, lat]) => {
      const [x, y] = kmOf(lon, lat)
      const [gc, gr] = cellAtKm(x, y, s)
      return [gc - c0, gr - r0]
    })
    for (let i = 1; i < pts.length; i++)
      for (const [c, r] of hexLine(pts[i - 1], pts[i]))
        if (inGrid(c, r) && !(flags[idx(c, r)] & F.FLUSS)) { flags[idx(c, r)] |= F.FLUSS; nFluss++ }
  }
}
console.log(`Gewässer: ${nSee} See-Zellen, ${nFluss} Fluss-Zellen`)
if (nBecken) {
  console.log(`Zungenbecken ausgeschürft: ${nBecken} Zellen in ${beckenListe.length} Seen`)
  for (const b of beckenListe.sort((a, x) => x.tiefeM - a.tiefeM))
    console.log(`  ${b.name.padEnd(26)} bis −${b.tiefsteSenkungM} m → Sohle ${b.sohleM} m ü. M.`
      + ` (${b.zellen} Zellen, Literaturtiefe ${b.tiefeM} m)`)
}

/* ---------- Landmarken (handkuratiert, für Orientierung + Kalibrierung) ----------
   art:  ort · gipfel · see · pass (Eisscheide/Diffluenz) · moraene (belegte
         Maximalausdehnung — daran wird das Modell justiert)
   rang: 1 = immer sichtbar · 2 = erst hineingezoomt (sonst überdecken sich die
         Beschriftungen auf 740 km Kartenbreite gegenseitig)
   Die △-Marken sind KALIBRIERPUNKTE, keine Messwerte: sie stehen für einen
   Endmoränenbogen von zig Kilometern Länge, hier auf einen Punkt gelegt.
   Historisch inspiriert und vereinfacht. Die als eisfrei bezeichneten Städte
   sind die Gegenprobe — dort DARF im Hochglazial kein Eis liegen.           */
const LANDMARKEN = [
  /* ---- Rhonegletscher: der Westfluegel (FR/CH) ---- */
  { lon: 5.05, lat: 45.95, name: 'Dombes', art: 'moraene', rang: 1, note: 'Endmoränen des Rhônegletschers nordöstlich von Lyon — die westlichste Reichweite des Alpeneises überhaupt.' },
  { lon: 4.84, lat: 45.76, name: 'Lyon', art: 'ort', rang: 1, note: 'Blieb eisfrei: die Zunge endete nordöstlich der Stadt. Gegenprobe für das Modell.' },
  { lon: 7.65, lat: 47.23, name: 'Wangen a. d. Aare', art: 'moraene', rang: 1, note: 'Nordrand des Rhône-/Aaregletschers im schweizerischen Mittelland.' },
  { lon: 6.55, lat: 46.45, name: 'Genfersee', art: 'see', rang: 1, note: 'Übertieftes Zungenbecken des Rhônegletschers.' },
  { lon: 6.14, lat: 46.20, name: 'Genf', art: 'ort', rang: 2, note: 'Lag unter dem Rhônegletscher, mehrere hundert Meter Eis.' },
  { lon: 5.87, lat: 45.73, name: 'Lac du Bourget', art: 'see', rang: 2, note: 'Zungenbecken am Westrand der Savoyer Alpen.' },
  { lon: 5.72, lat: 45.19, name: 'Grenoble', art: 'ort', rang: 2, note: 'Isèregletscher — der Südwestflügel des Eisstromnetzes.' },
  { lon: 6.865, lat: 45.832, name: 'Mont Blanc', art: 'gipfel', rang: 1, note: '4806 m — höchster Punkt der Alpen, Nunatak über dem Firn.' },
  { lon: 7.658, lat: 45.976, name: 'Matterhorn', art: 'gipfel', rang: 2, note: '4478 m — Fels über dem Eis.' },
  { lon: 7.962, lat: 46.537, name: 'Jungfrau', art: 'gipfel', rang: 2, note: '4158 m — Nährgebiet des Aaregletschers.' },
  { lon: 8.39, lat: 46.60, name: 'Rhonegletscher', art: 'pass', rang: 2, note: 'Quellgebiet: hier setzte der Eisstrom Richtung Genfersee an. Ein Rest davon liegt heute noch da.' },
  { lon: 7.45, lat: 46.95, name: 'Bern', art: 'ort', rang: 1, note: 'Lag unter dem Aaregletscher.' },
  { lon: 8.31, lat: 47.05, name: 'Luzern', art: 'ort', rang: 2, note: 'Zungenbecken des Reussgletschers (Vierwaldstättersee).' },
  { lon: 7.59, lat: 47.56, name: 'Basel', art: 'ort', rang: 1, note: 'Eisfrei — hier knickt der Rhein nach Norden ab, weit vor dem Eisrand. Gegenprobe.' },

  /* ---- Linth- und Rheingletscher: das Kerngebiet (CH/AT/LI/DE) ---- */
  { lon: 8.54, lat: 47.37, name: 'Zürich', art: 'ort', rang: 1, note: 'Lag im Hochglazial unter dem Zürcher Lobus des Linthgletschers.' },
  { lon: 8.31, lat: 47.44, name: 'Killwangen', art: 'moraene', rang: 1, note: 'Belegte Maximalausdehnung des Zürcher Lobus (Endmoräne bei Killwangen/Baden).' },
  { lon: 8.63, lat: 47.70, name: 'Schaffhausen', art: 'moraene', rang: 1, note: 'Nordwestlichste Reichweite des Rheingletschers im Hochglazial.' },
  { lon: 8.82, lat: 47.22, name: 'Rapperswil', art: 'ort', rang: 2, note: 'Seedamm über den Zürichsee — die Furche des Linthgletschers.' },
  { lon: 9.07, lat: 47.02, name: 'Glarus', art: 'ort', rang: 2, note: 'Im Nährgebiet des Linthgletschers.' },
  { lon: 8.99, lat: 46.91, name: 'Linthal', art: 'ort', rang: 2, note: 'Oberstes Linthtal — hier setzte der Eisstrom an.' },
  { lon: 8.91, lat: 46.81, name: 'Tödi', art: 'gipfel', rang: 2, note: '3614 m — höchster Glarner Gipfel, Firnfeld über dem Eis.' },
  { lon: 9.34, lat: 47.25, name: 'Säntis', art: 'gipfel', rang: 2, note: '2502 m — Nunatak über dem Rheingletscher.' },
  { lon: 9.40, lat: 47.10, name: 'Sargans', art: 'pass', rang: 1, note: 'Diffluenz: hier teilte sich der Rheingletscher — ein Arm ins Seeztal zum Linthgletscher, einer weiter zum Bodensee.' },
  { lon: 9.50, lat: 47.00, name: 'Bad Ragaz', art: 'ort', rang: 2, note: 'Alpenrheintal am Fuss des Calanda.' },
  { lon: 9.53, lat: 46.85, name: 'Chur', art: 'ort', rang: 1, note: 'Älteste Stadt der Schweiz — im Hochglazial unter mehreren hundert Metern Eis. Hier beginnt das Spiel, sobald das Tal frei ist.' },
  { lon: 9.41, lat: 46.82, name: 'Reichenau', art: 'ort', rang: 2, note: 'Zusammenfluss von Vorder- und Hinterrhein.' },
  { lon: 9.52, lat: 47.14, name: 'Vaduz', art: 'ort', rang: 2, note: 'Ostseite des Rheintals.' },
  { lon: 9.18, lat: 47.66, name: 'Konstanz', art: 'ort', rang: 1, note: 'Ausfluss des Bodensees — das Becken hat der Rheingletscher ausgeschürft.' },
  { lon: 9.32, lat: 47.42, name: 'St. Gallen', art: 'ort', rang: 2, note: 'Auf der Höhe zwischen Bodensee und Rheintal.' },
  { lon: 9.15, lat: 47.13, name: 'Walensee', art: 'see', rang: 2, note: 'Übertieftes Zungenbecken im Seeztal.' },
  { lon: 8.70, lat: 47.25, name: 'Zürichsee', art: 'see', rang: 2, note: 'Zungenbecken des Linthgletschers.' },
  { lon: 9.62, lat: 46.49, name: 'Rheinwald', art: 'ort', rang: 2, note: 'Quellgebiet des Hinterrheins, Nährgebiet des Rheingletschers.' },

  /* ---- Po-Ebene: die Amphitheater (IT) ---- */
  { lon: 7.88, lat: 45.47, name: 'Ivrea', art: 'moraene', rang: 1, note: 'Anfiteatro morenico di Ivrea — der Endmoränenkranz des Aostagletschers, das besterhaltene Amphitheater der Alpen.' },
  { lon: 8.72, lat: 45.72, name: 'Verbano', art: 'moraene', rang: 2, note: 'Maximalstand des Lago-Maggiore-Lappens bei Sesto Calende.' },
  { lon: 9.25, lat: 45.68, name: 'Brianza', art: 'moraene', rang: 1, note: 'Amphitheater des Comer Lappens — die Zunge endete in der Brianza, nicht in Mailand.' },
  { lon: 10.75, lat: 45.42, name: 'Villafranca', art: 'moraene', rang: 1, note: 'Südspitze des Garda-Amphitheaters (Rivoli–Villafranca) — der tiefste Eisrand der Alpen, gut 100 m ü. M.' },
  { lon: 9.19, lat: 45.46, name: 'Mailand', art: 'ort', rang: 1, note: 'Eisfrei — die Lappen endeten an den Amphitheatern gut 20 km nördlich. Gegenprobe.' },
  { lon: 7.69, lat: 45.07, name: 'Turin', art: 'ort', rang: 2, note: 'Eisfrei, südlich des Ivrea-Kranzes. Gegenprobe.' },
  { lon: 10.99, lat: 45.44, name: 'Verona', art: 'ort', rang: 2, note: 'Eisfrei, unmittelbar vor dem Garda-Amphitheater. Gegenprobe.' },
  { lon: 10.65, lat: 45.65, name: 'Gardasee', art: 'see', rang: 1, note: 'Übertieftes Zungenbecken — bis 350 m tief, die Sohle liegt unter dem Meeresspiegel.' },
  { lon: 7.867, lat: 45.937, name: 'Monte Rosa', art: 'gipfel', rang: 1, note: '4634 m — Nährgebiet gleich für mehrere Eisströme.' },
  { lon: 9.908, lat: 46.383, name: 'Bernina', art: 'gipfel', rang: 2, note: '4049 m — Wasserscheide Inn / Adda.' },
  { lon: 10.545, lat: 46.509, name: 'Ortler', art: 'gipfel', rang: 2, note: '3905 m — Nährgebiet des Etschgletschers.' },

  /* ---- Bayerisches Vorland (DE) ---- */
  { lon: 10.18, lat: 47.98, name: 'Memmingen', art: 'moraene', rang: 1, note: 'Maximalstand des Iller-Lech-Lappens. Die älteren Eiszeiten reichten weiter — bis an die Donau.' },
  { lon: 11.30, lat: 47.90, name: 'Würmsee', art: 'see', rang: 1, note: 'Starnberger See, Zungenbecken des Isar-Loisach-Gletschers — und Typuslokalität: die ganze Eiszeit ist nach diesem Fluss benannt.' },
  { lon: 11.58, lat: 48.14, name: 'München', art: 'ort', rang: 1, note: 'Eisfrei — die Stadt steht auf der Münchner Schotterebene, dem Sander der Isar-Loisach-Zunge. Gegenprobe für das Eis, Beleg für die Schotterflur.' },
  { lon: 12.47, lat: 47.87, name: 'Chiemsee', art: 'see', rang: 1, note: 'Zungenbecken des Salzachgletschers.' },
  { lon: 12.55, lat: 48.02, name: 'Salzachlappen', art: 'moraene', rang: 1, note: 'Nordrand des Salzachgletschers am Chiemsee-Nordufer.' },
  { lon: 9.99, lat: 48.40, name: 'Ulm', art: 'ort', rang: 2, note: 'Eisfrei an der Donau — hier lag die Grenze der ÄLTEREN Vergletscherung, nicht der letzten. Gegenprobe.' },

  /* ---- Ostalpen: Inn, Salzach, Mur, Drau (AT) ---- */
  { lon: 11.40, lat: 47.27, name: 'Innsbruck', art: 'ort', rang: 1, note: 'Der Inngletscher füllte das Tal bis über 2000 m ü. M. — mehr als 1400 m Eis über der Stadt.' },
  { lon: 13.05, lat: 47.80, name: 'Salzburg', art: 'ort', rang: 1, note: 'Unter dem Salzachgletscher, kurz vor dessen Zungenende.' },
  { lon: 12.79, lat: 47.32, name: 'Zell am See', art: 'ort', rang: 2, note: 'Im Nährgebiet des Salzachgletschers.' },
  { lon: 12.694, lat: 47.075, name: 'Grossglockner', art: 'gipfel', rang: 1, note: '3798 m — höchster Punkt Österreichs, Zentrum des östlichen Nährgebiets.' },
  { lon: 14.31, lat: 46.62, name: 'Klagenfurter Becken', art: 'see', rang: 1, note: 'Zungenbecken des Draugletschers — der östlichste grosse Lappen des Alpeneises.' },
  { lon: 13.85, lat: 46.61, name: 'Villach', art: 'ort', rang: 2, note: 'Diffluenz von Drau- und Gailgletscher.' },
  { lon: 14.66, lat: 47.17, name: 'Judenburg', art: 'moraene', rang: 1, note: 'Maximalstand des Murgletschers — das östliche Ende der Vergletscherung.' },
  { lon: 10.05, lat: 46.95, name: 'Montafon', art: 'ort', rang: 2, note: 'Ill-Einzugsgebiet, Silvretta/Verwall — das östliche Nährgebiet des Rheingletschers. Bis Aug 2026 lag es ausserhalb des Rasters.' },
  { lon: 10.21, lat: 47.13, name: 'Arlberg', art: 'pass', rang: 2, note: 'Eisscheide: nach Westen zum Rhein, nach Osten zum Inn.' },
  { lon: 10.51, lat: 46.84, name: 'Reschenpass', art: 'pass', rang: 2, note: 'Eisscheide Inn / Etsch — nach Norden zur Donau, nach Süden zur Adria.' },
  { lon: 9.90, lat: 46.50, name: 'Engadin', art: 'ort', rang: 2, note: 'Eigenes Nährgebiet — Inn-Einzugsgebiet, floss nach Osten ab.' },
]

/* ---------- Schreiben ---------- */
const b64 = (arr) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString('base64')
const daten = {
  version: 3, // 2: Bit3 „leer“ · 3: Bit4 „becken“ (Seeboden ausgeschürft)
  generated: new Date().toISOString(),
  quelle: 'pipeline/fetch/bake-eiszeit.mjs',
  cfg: CFG,
  region: REGION,
  grid: {
    hexKm: HEXKM, cols, rows, c0, r0,
    originKm: [oxKm, oyKm],
    spanKm: [(cols - 1) * s * SQRT3 + s * SQRT3, (rows - 1) * s * 1.5 + 2 * s],
  },
  flagBits: { geschaetzt: 1, see: 2, fluss: 4, leer: 8, becken: 16 },
  encoding: 'base64 Int16 little-endian (elev/emin/emax) bzw. Uint8 (flags/quelle), row-major',
  elev: b64(elev), emin: b64(emin), emax: b64(emax), flags: b64(flags), quelle: b64(quelle),
  /* Herkunft je Feld: 0 = keine Quelle (Bit0 in flags, Höhe geschätzt),
     sonst die Nummer aus dieser Liste. */
  hoehenquellen: STAPEL.legende(),
  landmarken: LANDMARKEN,
  provenance: [
    ...STAPEL.provenance(),
    {
      file: 'sources/hoehen.manifest.json',
      quelle: 'Verfahren',
      beschreibung: `Je Hexzelle (${HEXKM} km) auf einem ${STEP * 1000}-m-Gitter innerhalb der Zelle abgetastet: Mittel, Min und Max. Die Quellen werden in der Reihenfolge des Registers befragt, die erste mit einem Wert gewinnt; je Zelle wird die Quelle mit den meisten Stichproben vermerkt. Felder, die keine Quelle deckt, werden bis ${FUELL_MAX} Zellen weit aus den Nachbarn geschätzt (nächster bekannter Nachbar, danach 30 Laplace-Schritte) und tragen Bit0. Was weiter weg liegt, bleibt LEER (Bit3, Höhe 0) und gehört nicht zur Modellfläche — eine erfundene Höhe wäre dort schlimmer als ein Loch.`,
      lizenz: '—',
      stand: new Date().toISOString().slice(0, 10),
    },
    ...provenance,
  ],
  statistik: {
    zellen: N, ausDtm: nOk, geschaetzt: nNo, seeZellen: nSee, flussZellen: nFluss,
    leer: leerN, gefuellt: nNo - leerN, fuellMax: FUELL_MAX,
    beckenZellen: nBecken, becken: beckenListe,
    jeQuelle: STAPEL.legende().map((q) => ({ id: q.id,
      zellen: quelle.reduce((a, v) => a + (v === q.nr ? 1 : 0), 0) })),
  },
}
const js = '/* Generiert von pipeline/fetch/bake-eiszeit.mjs — NICHT von Hand editieren. */\n' +
  'window.EISZEIT_DATEN = ' + JSON.stringify(daten) + '\n'
writeFileSync(OUT, js)
console.log(`geschrieben: ${OUT} (${(js.length / 1024).toFixed(0)} KB)`)
