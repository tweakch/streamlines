import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './start.css'
import type { Profile } from '../shell/storage'
import { fogKey } from '../shell/storage'
import type { ResumeMeta } from '../shell/TitleScreen'
import type { HintCat, RegionCell } from './types'
import {
  DEFAULT_VIEW,
  HEXAGON_R,
  HINTTXT,
  MAX_TILES,
  MIN_TILES,
  WORLD_H,
  WORLD_W,
  buildRegion,
  dirsOf,
  epochForecast,
  hexagonCells,
  isWaterTerrain,
  keyOf,
  loadPlayed,
  parseKey,
  regionStats,
  savePlayed,
  selNeighbors,
  staysConnected,
  worldCellAt,
} from './world'

/*
 * Weltkarte = Hub der Shell: die gestaltete Weltkarte (Alpenrhein,
 * Landquart bis Konstanz) unter dem Nebel des Ungespielten. Ohne laufende
 * Partie formt man hier sein Gebiet und startet; mit laufender Partie
 * zeigt die Karte die Resume-Karte (Fortsetzen / Aufgeben).
 * Port von start-screen-v2 + shell-v2.
 */

const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const SQ3 = Math.sqrt(3)
const ZMIN = 10
const ZMAX = 64
const par = (r: number) => ((r % 2) + 2) % 2
const wx = (c: number, r: number) => c + 0.5 * par(r)
const wy = (r: number) => r * 0.8660254

const COL: Record<string, string> = {
  flach: '#CDD6C8',
  ufer: '#D6DDC9',
  hang: '#E2E7DC',
  water: '#7FB2AC',
  lake: '#8FBDB6',
  edge: '#B8C2B4',
  edgewater: '#5E9793',
  bg: '#DCE3D8',
  fog: '#C6CCC1',
  fogline: '#BDC4B9',
  mark: '#54645D',
  ember: '#C96F2E',
  stripe: 'rgba(90,107,100,.13)',
}

function hexPath(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number) {
  const hh = z / SQ3
  ctx.beginPath()
  ctx.moveTo(sx, sy - hh)
  ctx.lineTo(sx + z / 2, sy - hh / 2)
  ctx.lineTo(sx + z / 2, sy + hh / 2)
  ctx.lineTo(sx, sy + hh)
  ctx.lineTo(sx - z / 2, sy + hh / 2)
  ctx.lineTo(sx - z / 2, sy - hh / 2)
  ctx.closePath()
}

/** Hex-Ecken (für den Gebietsrand). */
function corners(sx: number, sy: number, z: number): Array<[number, number]> {
  const hh = z / SQ3
  return [
    [sx, sy - hh],
    [sx + z / 2, sy - hh / 2],
    [sx + z / 2, sy + hh / 2],
    [sx, sy + hh],
    [sx - z / 2, sy + hh / 2],
    [sx - z / 2, sy - hh / 2],
  ]
}

/** Richtung [dr,dc] → Kantenindex (Ecke i → i+1): NE=0,E=1,SE=2,SW=3,W=4,NW=5 */
function edgeIndex(r: number, dr: number, dc: number): number {
  const odd = par(r)
  if (dr === 0) return dc === 1 ? 1 : 4
  if (dr === -1) return (odd ? dc === 1 : dc === 0) ? 0 : 5
  return (odd ? dc === 1 : dc === 0) ? 2 : 3
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (i: number) =>
    Math.max(0, Math.min(255, Math.round(((n >> i) & 255) * (1 + f))))
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

/** Zeichen ◈: ungespielt anonyme Stele, aufgedeckt die wahre Glyphe. */
function drawHint(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  z: number,
  cat: HintCat | null,
) {
  const s = z * 0.2
  ctx.save()
  if (!cat) {
    /* anonyme Stele: Raute auf Strich */
    ctx.strokeStyle = COL.mark
    ctx.lineWidth = Math.max(1, z * 0.05)
    ctx.beginPath()
    ctx.moveTo(sx, sy + s)
    ctx.lineTo(sx, sy - s * 0.1)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(sx, sy - s)
    ctx.lineTo(sx + s * 0.55, sy - s * 0.45)
    ctx.lineTo(sx, sy + s * 0.1)
    ctx.lineTo(sx - s * 0.55, sy - s * 0.45)
    ctx.closePath()
    ctx.stroke()
  } else if (cat === 'wasser') {
    ctx.strokeStyle = '#3E6D68'
    ctx.lineWidth = Math.max(1, z * 0.05)
    for (const o of [-0.35, 0.35]) {
      ctx.beginPath()
      ctx.moveTo(sx - s, sy + o * s)
      ctx.quadraticCurveTo(sx - s / 2, sy + (o - 0.5) * s, sx, sy + o * s)
      ctx.quadraticCurveTo(sx + s / 2, sy + (o + 0.5) * s, sx + s, sy + o * s)
      ctx.stroke()
    }
  } else if (cat === 'stein') {
    ctx.strokeStyle = COL.mark
    ctx.lineWidth = Math.max(1, z * 0.05)
    ctx.beginPath()
    ctx.moveTo(sx - s, sy + s * 0.7)
    ctx.lineTo(sx, sy - s * 0.8)
    ctx.lineTo(sx + s, sy + s * 0.7)
    ctx.closePath()
    ctx.stroke()
  } else if (cat === 'land') {
    ctx.strokeStyle = '#5E7A4E'
    ctx.lineWidth = Math.max(1, z * 0.05)
    ctx.beginPath()
    ctx.moveTo(sx, sy + s)
    ctx.lineTo(sx, sy - s)
    ctx.moveTo(sx, sy - s * 0.2)
    ctx.lineTo(sx - s * 0.6, sy - s * 0.7)
    ctx.moveTo(sx, sy - s * 0.2)
    ctx.lineTo(sx + s * 0.6, sy - s * 0.7)
    ctx.stroke()
  } else {
    /* fund */
    ctx.fillStyle = COL.ember
    ctx.beginPath()
    ctx.moveTo(sx, sy - s)
    ctx.lineTo(sx + s * 0.7, sy)
    ctx.lineTo(sx, sy + s)
    ctx.lineTo(sx - s * 0.7, sy)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export function StartScreen({
  profile,
  profiles,
  resume,
  onStart,
  onResume,
  onAbandon,
  onSwitchProfile,
  onNewKlan,
  onNav,
}: {
  profile: Profile
  profiles: Profile[]
  resume: ResumeMeta | null
  onStart: (region: RegionCell[]) => void
  onResume: () => void
  onAbandon: () => void
  onSwitchProfile: (id: string) => void
  onNewKlan: () => void
  onNav: (s: 'regeln' | 'titel' | 'epochen') => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef({ x: wx(DEFAULT_VIEW.c, DEFAULT_VIEW.r), y: wy(DEFAULT_VIEW.r), z: 30 })
  const playedRef = useRef<Set<string>>(new Set())
  const selRef = useRef<Set<string>>(new Set())
  const drawRef = useRef<() => void>(() => {})
  /* Mit laufender Partie ist die Karte nur Aussicht — kein Formen. */
  const resumeRef = useRef(!!resume)
  useEffect(() => {
    resumeRef.current = !!resume
  }, [resume])

  const [sel, setSel] = useState<ReadonlySet<string>>(new Set())
  const [showEpochs, setShowEpochs] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showAbandon, setShowAbandon] = useState(false)
  const [fogArmed, setFogArmed] = useState(false)
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null)

  const fog = fogKey(profile.id)
  const stats = useMemo(() => regionStats(sel), [sel])
  const waterOk = stats.water + stats.furt > 0
  const hintCats = useMemo(
    () => [...new Set(stats.hints.map((h) => h.cat))],
    [stats],
  )

  const showToast = useCallback((msg: string) => {
    setToast((t) => ({ msg, id: (t?.id ?? 0) + 1 }))
  }, [])

  const applySel = useCallback((next: Set<string>) => {
    selRef.current = next
    setSel(next)
    drawRef.current()
  }, [])

  const clampView = useCallback(() => {
    const v = viewRef.current
    v.x = Math.max(0, Math.min(WORLD_W, v.x))
    v.y = Math.max(0, Math.min((WORLD_H - 1) * 0.8660254, v.y))
  }, [])

  const resetSection = useCallback(() => {
    if (resumeRef.current) return
    const v = viewRef.current
    const rc = Math.round(v.y / 0.8660254)
    const cc = Math.round(v.x - 0.5 * par(rc))
    const cells = hexagonCells(cc, rc, HEXAGON_R).filter(([c, r]) => worldCellAt(c, r))
    applySel(new Set(cells.map(([c, r]) => keyOf(c, r))))
  }, [applySel])

  const toggleCell = useCallback(
    (c: number, r: number) => {
      if (resumeRef.current) return
      if (!worldCellAt(c, r)) return
      const cur = selRef.current
      const k = keyOf(c, r)
      if (cur.has(k)) {
        if (cur.size <= MIN_TILES)
          return showToast(`Kleiner geht nicht – mindestens ${MIN_TILES} Felder.`)
        if (!staysConnected(cur, k))
          return showToast('Das Gebiet muss zusammenhängen.')
        const next = new Set(cur)
        next.delete(k)
        applySel(next)
      } else {
        if (cur.size >= MAX_TILES)
          return showToast(`Grösser geht nicht – höchstens ${MAX_TILES} Felder.`)
        if (!selNeighbors(k).some((n) => cur.has(n)))
          return showToast('Nur Felder am Rand des Gebiets.')
        const next = new Set(cur)
        next.add(k)
        applySel(next)
      }
    },
    [applySel, showToast],
  )

  const applyZoom = useCallback(
    (f: number, px: number, py: number) => {
      const v = viewRef.current
      const z0 = v.z
      const z1 = Math.min(ZMAX, Math.max(ZMIN, z0 * f))
      if (z1 === z0) return
      v.x += (px - window.innerWidth / 2) * (1 / z0 - 1 / z1)
      v.y += (py - window.innerHeight / 2) * (1 / z0 - 1 / z1)
      v.z = z1
      clampView()
      drawRef.current()
    },
    [clampView],
  )

  const zoomBy = useCallback(
    (f: number) => applyZoom(f, window.innerWidth / 2, window.innerHeight / 2),
    [applyZoom],
  )

  /* Nebel zurücksetzen ist destruktiv → zweistufig statt Dialog. */
  const resetFog = useCallback(() => {
    if (!fogArmed) {
      setFogArmed(true)
      showToast('Löscht den gesamten aufgedeckten Nebel — erneut tippen zum Bestätigen.')
      window.setTimeout(() => setFogArmed(false), 3500)
      return
    }
    setFogArmed(false)
    playedRef.current = new Set()
    savePlayed(fog, playedRef.current)
    showToast('Der Nebel liegt wieder über allem.')
    drawRef.current()
  }, [fog, fogArmed, showToast])

  const startHere = useCallback(() => {
    const st = regionStats(selRef.current)
    if (st.water + st.furt === 0) return
    const region = buildRegion(selRef.current)
    for (const k of selRef.current) playedRef.current.add(k)
    savePlayed(fog, playedRef.current)
    onStart(region)
  }, [fog, onStart])

  /* Canvas, Zeichnen & Eingaben — alles lebt auf Refs, React rendert nur das HUD. */
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const v = viewRef.current
      const z = v.z
      const hh = z / SQ3
      ctx.fillStyle = COL.bg
      ctx.fillRect(0, 0, W, H)
      const r0 = Math.max(0, Math.floor((v.y - H / (2 * z)) / 0.8660254) - 1)
      const r1 = Math.min(WORLD_H - 1, Math.ceil((v.y + H / (2 * z)) / 0.8660254) + 1)
      const c0 = Math.max(0, Math.floor(v.x - W / (2 * z)) - 1)
      const c1 = Math.min(WORLD_W - 1, Math.ceil(v.x + W / (2 * z)) + 1)
      ctx.lineWidth = Math.max(0.6, z * 0.035)
      const detail = z >= 20
      const marks = z >= 13
      const labels: Array<{ sx: number; sy: number; name: string }> = []
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const w = worldCellAt(c, r)
          if (!w) continue
          const revealed = playedRef.current.has(keyOf(c, r))
          const sx = (wx(c, r) - v.x) * z + W / 2
          const sy = (wy(r) - v.y) * z + H / 2
          hexPath(ctx, sx, sy, z)
          if (revealed) {
            ctx.fillStyle = COL[w.t]
            ctx.fill()
            ctx.strokeStyle = isWaterTerrain(w.t) ? COL.edgewater : COL.edge
            ctx.stroke()
            if (detail && w.furt) {
              ctx.strokeStyle = COL.lake
              ctx.lineWidth = Math.max(1.5, z * 0.09)
              for (const f of [-0.28, 0, 0.28]) {
                ctx.beginPath()
                ctx.moveTo(sx - z * 0.32, sy + hh * f)
                ctx.lineTo(sx + z * 0.32, sy + hh * f)
                ctx.stroke()
              }
              ctx.lineWidth = Math.max(0.6, z * 0.035)
            }
            if (detail && w.t === 'hang') {
              ctx.strokeStyle = COL.stripe
              ctx.lineWidth = Math.max(1, z * 0.05)
              for (const f of [-0.3, 0, 0.3]) {
                ctx.beginPath()
                ctx.moveTo(sx - z * 0.22 + f * z, sy - hh * 0.25)
                ctx.lineTo(sx + z * 0.02 + f * z, sy + hh * 0.25)
                ctx.stroke()
              }
              ctx.lineWidth = Math.max(0.6, z * 0.035)
            }
          } else {
            /* Nebel des Ungespielten: leicht körnig, ohne Gelände */
            const g = ((((c * 92837111) ^ (r * 689287499)) >>> 0) / 4294967296) * 0.05 - 0.025
            ctx.fillStyle = shade(COL.fog, g)
            ctx.fill()
            ctx.strokeStyle = COL.fogline
            ctx.stroke()
          }
          if (marks && w.hint) drawHint(ctx, sx, sy, z, revealed ? w.hint : null)
          if (w.landmark && z >= 18) labels.push({ sx, sy: sy + hh * 0.92, name: w.landmark })
        }
      }
      /* Gebiets-Überzug + Rand */
      ctx.fillStyle = 'rgba(201,111,46,.07)'
      for (const k of selRef.current) {
        const [c, r] = parseKey(k)
        const sx = (wx(c, r) - v.x) * z + W / 2
        const sy = (wy(r) - v.y) * z + H / 2
        if (sx < -z || sx > W + z || sy < -z || sy > H + z) continue
        hexPath(ctx, sx, sy, z)
        ctx.fill()
      }
      ctx.strokeStyle = COL.ember
      ctx.lineWidth = Math.max(2, z * 0.07)
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (const k of selRef.current) {
        const [c, r] = parseKey(k)
        const sx = (wx(c, r) - v.x) * z + W / 2
        const sy = (wy(r) - v.y) * z + H / 2
        if (sx < -2 * z || sx > W + 2 * z || sy < -2 * z || sy > H + 2 * z) continue
        const cs = corners(sx, sy, z)
        for (const [dr, dc] of dirsOf(r)) {
          if (selRef.current.has(keyOf(c + dc, r + dr))) continue
          const i = edgeIndex(r, dr, dc)
          const a = cs[i]
          const b = cs[(i + 1) % 6]
          ctx.moveTo(a[0], a[1])
          ctx.lineTo(b[0], b[1])
        }
      }
      ctx.stroke()
      ctx.lineCap = 'butt'
      /* Landmarken: Wissen über das Land, sichtbar auch unter dem Nebel */
      if (labels.length) {
        ctx.font = `700 ${Math.max(8, z * 0.22)}px 'Space Mono', monospace`
        ctx.textAlign = 'center'
        ctx.lineWidth = Math.max(2, z * 0.09)
        for (const l of labels) {
          const name = l.name.toUpperCase()
          ctx.strokeStyle = 'rgba(236,239,230,.75)'
          ctx.strokeText(name, l.sx, l.sy)
          ctx.fillStyle = COL.mark
          ctx.fillText(name, l.sx, l.sy)
        }
        ctx.textAlign = 'start'
      }
    }

    let queued = false
    const requestDraw = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        draw()
      })
    }
    drawRef.current = requestDraw

    const resize = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2)
      cvs.width = window.innerWidth * DPR
      cvs.height = window.innerHeight * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      requestDraw()
    }

    const cellAtScreen = (px: number, py: number): [number, number] | null => {
      const v = viewRef.current
      const cwx = (px - window.innerWidth / 2) / v.z + v.x
      const cwy = (py - window.innerHeight / 2) / v.z + v.y
      let best: [number, number] | null = null
      let bd = 1e9
      const rc = Math.round(cwy / 0.8660254)
      for (let r = rc - 1; r <= rc + 1; r++) {
        const cc = Math.round(cwx - 0.5 * par(r))
        for (let c = cc - 1; c <= cc + 1; c++) {
          const dx = wx(c, r) - cwx
          const dy = wy(r) - cwy
          const d = dx * dx + dy * dy
          if (d < bd) {
            bd = d
            best = [c, r]
          }
        }
      }
      return best
    }

    const pointers = new Map<number, { x: number; y: number; dist: number }>()
    let pinchDist = 0

    const onPointerDown = (e: PointerEvent) => {
      cvs.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, dist: 0 })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      }
      cvs.classList.add('panning')
    }
    const onPointerMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      p.dist += Math.abs(dx) + Math.abs(dy)
      const v = viewRef.current
      if (pointers.size === 1) {
        v.x -= dx / v.z
        v.y -= dy / v.z
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinchDist > 0) applyZoom(d / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2)
        pinchDist = d
        v.x -= dx / (2 * v.z)
        v.y -= dy / (2 * v.z)
      }
      clampView()
      requestDraw()
    }
    const endPointer = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      const tap = p && pointers.size === 1 && p.dist < 7
      pointers.delete(e.pointerId)
      pinchDist = 0
      if (!pointers.size) cvs.classList.remove('panning')
      if (tap && e.type === 'pointerup') {
        const cell = cellAtScreen(e.clientX, e.clientY)
        if (cell) toggleCell(cell[0], cell[1])
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY)
    }
    const onKey = (e: KeyboardEvent) => {
      const v = viewRef.current
      const step = 40 / v.z
      if (e.key === 'ArrowLeft') v.x -= step
      else if (e.key === 'ArrowRight') v.x += step
      else if (e.key === 'ArrowUp') v.y -= step
      else if (e.key === 'ArrowDown') v.y += step
      else if (e.key === '+' || e.key === '=') return zoomBy(1.35)
      else if (e.key === '-') return zoomBy(1 / 1.35)
      else return
      clampView()
      requestDraw()
    }

    cvs.addEventListener('pointerdown', onPointerDown)
    cvs.addEventListener('pointermove', onPointerMove)
    cvs.addEventListener('pointerup', endPointer)
    cvs.addEventListener('pointercancel', endPointer)
    cvs.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKey)

    playedRef.current = loadPlayed(fog)
    resize()
    resetSection()

    return () => {
      cvs.removeEventListener('pointerdown', onPointerDown)
      cvs.removeEventListener('pointermove', onPointerMove)
      cvs.removeEventListener('pointerup', endPointer)
      cvs.removeEventListener('pointercancel', endPointer)
      cvs.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      drawRef.current = () => {}
    }
  }, [applyZoom, clampView, fog, resetSection, toggleCell, zoomBy])

  /* Partie aufgegeben → das Formen beginnt wieder mit einem frischen Sechseck. */
  useEffect(() => {
    if (!resume && selRef.current.size === 0) resetSection()
  }, [resume, resetSection])

  return (
    <div className="ss">
      <canvas ref={canvasRef} className="ss-canvas" />
      <div className="hud-top">
        <div className="brand">
          STROMLINIEN
          <small>WÄHLE &amp; FORME DEIN TAL</small>
        </div>
        <div className="profilechip" onClick={() => setShowSwitcher(true)}>
          <div className="av">{initials(profile.name)}</div>
          <div className="nm">{profile.name}</div>
        </div>
      </div>
      <div className="zoomcol">
        <button className="round" onClick={() => zoomBy(1.35)} aria-label="Hineinzoomen">
          +
        </button>
        <button className="round" onClick={() => zoomBy(1 / 1.35)} aria-label="Herauszoomen">
          −
        </button>
      </div>
      <div className="hud-bottom">
        {resume ? (
          <>
            <div className="resume" onClick={onResume}>
              <div className="tg">Laufende Partie · tippen zum Fortsetzen</div>
              <h3>{resume.label}</h3>
              <div className="meta">Epoche I · Runde {resume.round} / 10</div>
              <div className="bar">
                <i style={{ width: `${Math.round((resume.round / 10) * 100)}%` }} />
              </div>
              {resume.lastEvent && (
                <div className="last">
                  <span className="k">zuletzt</span>
                  <span>{resume.lastEvent}</span>
                </div>
              )}
            </div>
            <div className="btnrow">
              <button className="primary" onClick={onResume}>
                Fortsetzen
              </button>
            </div>
            <div className="subrow">
              <button onClick={() => onNav('epochen')}>Epochen</button>
              <button onClick={() => onNav('regeln')}>Regeln</button>
              <button onClick={() => onNav('titel')}>Titelbild</button>
              <button className="dangerlite" onClick={() => setShowAbandon(true)}>
                Aufgeben
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="worldrow">
              <span>ziehen = bewegen · tippen = Feld dazu/weg · Rad = Zoom</span>
              <button className={fogArmed ? 'armed' : ''} onClick={resetFog}>
                {fogArmed ? 'Sicher? Erneut tippen' : 'Nebel zurücksetzen'}
              </button>
            </div>
            <div className="report">
              <div className="r-head">
                <span>Gewähltes Gebiet · {stats.n} Felder</span>
                <span className={`r-water ${waterOk ? 'ok' : 'no'}`}>
                  {waterOk ? '✓ Wasser zu hören' : '✕ kein Wasser zu hören'}
                </span>
              </div>
              {hintCats.length ? (
                <ul>
                  {hintCats.map((cat) => {
                    const n = stats.hints.filter((h) => h.cat === cat).length
                    return (
                      <li key={cat}>
                        ◈{n > 1 ? `×${n} ` : ' '}
                        {HINTTXT[cat](stats)}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="r-none">Keine Zeichen im Gebiet – ihr geht ohne Kundschaft.</div>
              )}
            </div>
            <div className="btnrow">
              <button className="sec" onClick={resetSection}>
                ⬡ Neu formen
              </button>
              <button className="sec" onClick={() => setShowEpochs(true)}>
                Epochen-Ausblick
              </button>
              <button className="primary" disabled={!waterOk} onClick={startHere}>
                Hier starten
              </button>
            </div>
            <div className="subrow">
              <button onClick={() => onNav('epochen')}>Kampagne</button>
              <button onClick={() => onNav('regeln')}>Regeln</button>
              <button onClick={() => onNav('titel')}>Titelbild</button>
            </div>
          </>
        )}
      </div>
      {showEpochs && (
        <div
          className="overlay on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEpochs(false)
          }}
        >
          <div className="epcard">
            <div className="sub">Ausblick für das gewählte Gebiet</div>
            <h2>Fünf Epochen, ein Tal</h2>
            {epochForecast(stats).map((ep, i) => (
              <div className="eprow" key={ep.name}>
                <div className="ep-head">
                  <span className="ep-num">{ROMAN[i]}</span>
                  <b>{ep.name}</b>
                  <span className="ep-years">{ep.years}</span>
                </div>
                <div className="ep-dots">
                  {'●'.repeat(ep.score)}
                  {'○'.repeat(5 - ep.score)}
                </div>
                <p>{ep.txt}</p>
              </div>
            ))}
            <p className="legend">
              Der Ausblick liest die Landschaft, nicht die Zukunft: grobe Erwartungen ohne
              Orte. Historisch inspiriert und vereinfacht.
            </p>
            <button onClick={() => setShowEpochs(false)}>Schliessen</button>
          </div>
        </div>
      )}
      {showSwitcher && (
        <div
          className="overlay on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSwitcher(false)
          }}
        >
          <div className="epcard">
            <div className="sub">Auf diesem Gerät</div>
            <h2>Eure Klans</h2>
            <div className="proflist">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={`profrow${p.id === profile.id ? ' active' : ''}`}
                  onClick={() => {
                    setShowSwitcher(false)
                    if (p.id !== profile.id) onSwitchProfile(p.id)
                  }}
                >
                  <div className="av">{initials(p.name)}</div>
                  <b>{p.name}</b>
                  {p.id === profile.id && <span className="dot">●</span>}
                </div>
              ))}
            </div>
            <button
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                setShowSwitcher(false)
                onNewKlan()
              }}
            >
              + Neuer Klan
            </button>
            <button style={{ width: '100%', marginTop: 8 }} onClick={() => setShowSwitcher(false)}>
              Schliessen
            </button>
          </div>
        </div>
      )}
      {showAbandon && (
        <div
          className="overlay on"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAbandon(false)
          }}
        >
          <div className="epcard">
            <h2>Partie wirklich aufgeben?</h2>
            <p className="legend" style={{ fontSize: 12 }}>
              Der Fortschritt geht verloren. Das gewählte Gebiet bleibt auf der
              Weltkarte aufgedeckt.
            </p>
            <div className="confirmrow">
              <button onClick={() => setShowAbandon(false)}>Abbrechen</button>
              <button
                className="dangersolid"
                onClick={() => {
                  setShowAbandon(false)
                  onAbandon()
                }}
              >
                Ja, aufgeben
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" key={toast.id}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
