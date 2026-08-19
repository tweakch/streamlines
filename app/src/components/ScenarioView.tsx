import { useState } from 'react'
import type { ClaimId, EvidenceStatus, ScenarioResult } from '../game/types'
import { crossingReliability } from '../game/progress'
import {
  MOVE_POINTS,
  START,
  TURN_LIMIT,
  ZIEL,
  entryCost,
  grid,
  hexAt,
  neighbors,
  sameHex,
  type Hex,
  type HexCoord,
} from '../game/scenario'

const SQRT3 = Math.sqrt(3)
const SIZE = 34

function hexCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: SIZE * SQRT3 * (col + 0.5 * (row % 2)) + SIZE + 4,
    y: SIZE * 1.5 * row + SIZE + 4,
  }
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

/** Zustand des hypothetischen Übergangs: erst das Betreten schafft Gewissheit. */
type CrossingState = 'ungeprueft' | 'traegt' | 'gesperrt'

interface Props {
  hypothesis: ClaimId
  hypothesisStatus: EvidenceStatus
  onFinish: (result: ScenarioResult) => void
}

/**
 * Kontrafaktisches Taktikszenario: eine Einheit muss die Limmat überqueren
 * und die Anhöhe am Ostufer erreichen. Passierbar ist nur der Übergang, den
 * die Hypothese des Spielers begründet — und ob er trägt, hängt davon ab,
 * wie gut sie begründet ist.
 */
export function ScenarioView({ hypothesis, hypothesisStatus, onFinish }: Props) {
  const [unit, setUnit] = useState<HexCoord>(START)
  const [turn, setTurn] = useState(1)
  const [mp, setMp] = useState(MOVE_POINTS)
  const [crossingState, setCrossingState] = useState<CrossingState>('ungeprueft')
  const [notice, setNotice] = useState<string | null>(null)

  const reliability = crossingReliability(hypothesisStatus)

  function costFor(hex: Hex): number | null {
    if (hex.terrain === 'uebergang' && crossingState === 'gesperrt') return null
    return entryCost(hex, hypothesis)
  }

  const reachable = neighbors(unit).filter((n) => {
    const hex = hexAt(n.col, n.row)
    if (!hex) return false
    const cost = costFor(hex)
    return cost !== null && cost <= mp
  })

  function moveTo(coord: HexCoord) {
    const hex = hexAt(coord.col, coord.row)
    if (!hex) return
    const cost = costFor(hex)
    if (cost === null || cost > mp) return

    // Risikowurf: ein nicht sicher belegter Übergang wird erst beim
    // Betreten geprüft — die Quellenlage bestimmt die Wahrscheinlichkeit.
    if (
      hex.terrain === 'uebergang' &&
      crossingState === 'ungeprueft' &&
      reliability < 1
    ) {
      if (Math.random() < reliability) {
        setCrossingState('traegt')
        setNotice('Der Übergang trägt — deine Annahme hat gehalten.')
      } else {
        setCrossingState('gesperrt')
        setMp(0)
        setNotice(
          'Der Übergang erweist sich als unpassierbar. Die Kolonne staut sich am Ufer — ohne Querung ist der Auftrag nicht mehr erfüllbar. Brich ab oder lass die Züge verstreichen.',
        )
        return
      }
    }

    setUnit(coord)
    setMp((prev) => prev - cost)
    if (sameHex(coord, ZIEL)) {
      onFinish({
        outcome: 'erreicht',
        turnsUsed: turn,
        turnLimit: TURN_LIMIT,
        crossingUsed: hypothesis,
        crossingFailed: false,
      })
    }
  }

  function finishFailed(turnsUsed: number) {
    onFinish({
      outcome: 'gescheitert',
      turnsUsed,
      turnLimit: TURN_LIMIT,
      crossingUsed: hypothesis,
      crossingFailed: crossingState === 'gesperrt',
    })
  }

  function endTurn() {
    if (turn >= TURN_LIMIT) {
      finishFailed(TURN_LIMIT)
      return
    }
    setTurn(turn + 1)
    setMp(MOVE_POINTS)
    setNotice(null)
  }

  const width = SIZE * SQRT3 * 10.5 + 8
  const height = SIZE * 1.5 * 7 + SIZE + 8

  return (
    <div className="scenario">
      <div className="scenario-hud">
        <div>
          <p className="eyebrow">Kontrafaktisches Szenario</p>
          <h2>Limmatübergang, 25. September 1799</h2>
          <p className="hint">
            Bring die Einheit auf die Anhöhe am Ostufer. Die Limmat ist nur an
            deinem begründeten Übergang passierbar
            {reliability < 1 && (
              <>
                {' '}
                — Verlässlichkeit nach Quellenlage:{' '}
                <strong>{Math.round(reliability * 100)} %</strong>
              </>
            )}
            .
          </p>
        </div>
        <dl className="hud-stats">
          <div>
            <dt>Zug</dt>
            <dd>
              {turn} / {TURN_LIMIT}
            </dd>
          </div>
          <div>
            <dt>Bewegung</dt>
            <dd>
              {mp} / {MOVE_POINTS}
            </dd>
          </div>
        </dl>
      </div>

      {notice && (
        <p
          className={`scenario-notice${crossingState === 'gesperrt' ? ' bad' : ''}`}
          role="status"
        >
          {notice}
        </p>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="scenario-map"
        role="img"
        aria-label="Taktische Hexkarte des Limmatübergangs"
      >
        {grid.map((hex) => (
          <HexCell
            key={`${hex.col},${hex.row}`}
            hex={hex}
            hypothesis={hypothesis}
            crossingState={crossingState}
            isUnit={sameHex(hex, unit)}
            isZiel={sameHex(hex, ZIEL)}
            isReachable={reachable.some((r) => sameHex(r, hex))}
            onClick={() => moveTo(hex)}
          />
        ))}
        <UnitToken coord={unit} />
      </svg>

      <div className="scenario-actions">
        <button type="button" className="primary" onClick={endTurn}>
          {turn >= TURN_LIMIT ? 'Letzten Zug beenden' : 'Zug beenden'}
        </button>
        <button type="button" onClick={() => finishFailed(turn)}>
          Abbrechen
        </button>
        <p className="legend">
          <span className="swatch feld" /> Feld (1) ·{' '}
          <span className="swatch wald" /> Wald (2) ·{' '}
          <span className="swatch fluss" /> Limmat (gesperrt) ·{' '}
          <span className="swatch uebergang" /> Übergang (2)
        </p>
      </div>
    </div>
  )
}

function HexCell({
  hex,
  hypothesis,
  crossingState,
  isUnit,
  isZiel,
  isReachable,
  onClick,
}: {
  hex: Hex
  hypothesis: ClaimId
  crossingState: CrossingState
  isUnit: boolean
  isZiel: boolean
  isReachable: boolean
  onClick: () => void
}) {
  const { x, y } = hexCenter(hex.col, hex.row)
  const open =
    hex.terrain === 'uebergang' &&
    hex.crossing === hypothesis &&
    crossingState !== 'gesperrt'
  const terrainClass =
    hex.terrain === 'uebergang' && !open ? 'fluss' : hex.terrain

  return (
    <g
      className={`hex t-${terrainClass}${isReachable ? ' reachable' : ''}`}
      onClick={isReachable ? onClick : undefined}
      role={isReachable ? 'button' : undefined}
      tabIndex={isReachable ? 0 : undefined}
      onKeyDown={
        isReachable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      aria-label={
        isReachable
          ? `Ziehe nach Spalte ${hex.col + 1}, Reihe ${hex.row + 1}`
          : undefined
      }
    >
      <polygon points={hexPoints(x, y, SIZE - 1.5)} />
      {open && (
        <text x={x} y={y + 5} className="hex-glyph" textAnchor="middle">
          {hex.crossing === 'ponton-sued' ? '⌇' : '≋'}
        </text>
      )}
      {hex.terrain === 'wald' && (
        <text x={x} y={y + 5} className="hex-glyph wald-glyph" textAnchor="middle">
          ♠
        </text>
      )}
      {isZiel && !isUnit && (
        <text x={x} y={y + 5} className="hex-glyph ziel-glyph" textAnchor="middle">
          ⚑
        </text>
      )}
    </g>
  )
}

function UnitToken({ coord }: { coord: HexCoord }) {
  const { x, y } = hexCenter(coord.col, coord.row)
  return (
    <g className="unit" pointerEvents="none">
      <circle cx={x} cy={y} r={13} />
      <text x={x} y={y + 4.5} textAnchor="middle">
        1
      </text>
    </g>
  )
}
