import type { ClaimId, EvidenceStatus } from '../game/types'
import { statusLabel } from '../game/evidence'

const SQRT3 = Math.sqrt(3)

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

/** Axiale Nachbarrichtungen (pointy-top) für den 7er-Kranz der Übersichtskarte. */
const RING: Array<[number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

interface Props {
  statuses: Record<ClaimId, EvidenceStatus>
  examined: ReadonlySet<string>
  totalSources: number
}

/**
 * Übersichtskarte: die erforschbare Kachel im Zentrum, sechs unerforschte
 * Nachbarn als terra incognita. Der Ertrag der Forschung wird hier sichtbar:
 * Jede untersuchte Quelle zeichnet ihre Spur in die Karte ein — mit einem
 * Unsicherheitsring, dessen Grösse der räumlichen Genauigkeit entspricht.
 */
export function ResearchMap({ statuses, examined, totalSources }: Props) {
  const R = 92
  const cx = 300
  const cy = 260

  // Verortung der beiden Claims auf der Kachel
  const furt = { x: cx + 20, y: cy - 44 }
  const ponton = { x: cx + 2, y: cy + 58 }

  const neighborCenters = RING.map(([q, rr]) => ({
    x: cx + R * SQRT3 * (q + rr / 2) * 1.04,
    y: cy + R * 1.5 * rr * 1.04,
  }))

  return (
    <svg
      viewBox="0 0 600 560"
      className="research-map"
      role="img"
      aria-label="Übersichtskarte: Limmatraum Dietikon mit unerforschten Nachbarkacheln"
    >
      <defs>
        <pattern
          id="incognita"
          width="9"
          height="9"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="9" height="9" fill="var(--paper-deep)" />
          <line x1="0" y1="0" x2="0" y2="9" stroke="var(--line)" strokeWidth="1" />
        </pattern>
      </defs>

      {neighborCenters.map((c, i) => (
        <g key={i}>
          <polygon
            points={hexPoints(c.x, c.y, R)}
            fill="url(#incognita)"
            stroke="var(--ink-soft)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <text x={c.x} y={c.y + 4} className="map-incognita-label" textAnchor="middle">
            unerforscht
          </text>
        </g>
      ))}

      <polygon
        points={hexPoints(cx, cy, R)}
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="2"
      />

      {/* Limmat: von Nord nach Süd durch die Kachel, mit leichter Schlaufe */}
      <path
        d={`M ${cx + 8} ${cy - R + 6}
            C ${cx + 34} ${cy - 40}, ${cx - 30} ${cy - 10}, ${cx - 6} ${cy + 24}
            S ${cx + 10} ${cy + 70}, ${cx - 2} ${cy + R - 6}`}
        fill="none"
        stroke="var(--river)"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.85"
      />

      {examined.size === 0 && (
        <text x={cx - 62} y={cy + 8} className="map-empty-hint">
          noch kein Kartenbild —
          <tspan x={cx - 62} dy="15">
            untersuche Quellen
          </tspan>
        </text>
      )}

      {/* Usteri-Karte: «Furth»-Signatur, räumlich ungefähr */}
      {examined.has('usteri-karte') && (
        <g className="reveal">
          <circle
            cx={furt.x}
            cy={furt.y}
            r={26}
            className="precision-ring ungefaehr"
          />
          <text x={furt.x - 68} y={furt.y - 26} className="map-annotation">
            «Furth»
          </text>
        </g>
      )}

      {/* Memoiren: gewatet «weiter oben», räumlich vage */}
      {examined.has('veteran-memoiren') && (
        <g className="reveal">
          <circle
            cx={furt.x + 6}
            cy={furt.y + 10}
            r={46}
            className="precision-ring vage"
          />
          <text x={furt.x - 84} y={furt.y + 46} className="map-annotation faint">
            «durchs Wasser gewatet»
          </text>
        </g>
      )}

      {/* Rapport: Brückenschlag an der Südwiese, räumlich genau */}
      {examined.has('rapport-lorge') && (
        <g className="reveal">
          <circle
            cx={ponton.x}
            cy={ponton.y}
            r={13}
            className="precision-ring genau"
          />
          <g className="ponton-glyph">
            <line x1={ponton.x - 9} y1={ponton.y - 4} x2={ponton.x + 9} y2={ponton.y - 4} />
            <line x1={ponton.x - 9} y1={ponton.y} x2={ponton.x + 9} y2={ponton.y} />
            <line x1={ponton.x - 9} y1={ponton.y + 4} x2={ponton.x + 9} y2={ponton.y + 4} />
          </g>
          <text x={ponton.x + 20} y={ponton.y + 28} className="map-annotation">
            «Brückenschlag»
          </text>
        </g>
      )}

      {/* Gutachten: Tiefenrinne Nord, ruhiges Wasser Süd — räumlich genau */}
      {examined.has('morphologie-gutachten') && (
        <g className="reveal">
          <g className="depth-hatch">
            <line x1={furt.x - 14} y1={furt.y - 8} x2={furt.x - 4} y2={furt.y - 14} />
            <line x1={furt.x - 10} y1={furt.y} x2={furt.x} y2={furt.y - 6} />
            <line x1={furt.x - 6} y1={furt.y + 8} x2={furt.x + 4} y2={furt.y + 2} />
          </g>
          <text x={furt.x - 78} y={furt.y + 4} className="map-annotation danger">
            Rinne 2 m+
          </text>
          <g className="calm-ripples">
            <path
              d={`M ${ponton.x - 26} ${ponton.y + 14} q 5 -4 10 0 t 10 0`}
            />
            <path
              d={`M ${ponton.x - 20} ${ponton.y + 21} q 5 -4 10 0 t 10 0`}
            />
          </g>
        </g>
      )}

      <ClaimMarker
        x={furt.x}
        y={furt.y}
        label="Furt Nord?"
        status={statuses['furt-nord']}
      />
      <ClaimMarker
        x={ponton.x}
        y={ponton.y}
        label="Ponton Süd?"
        status={statuses['ponton-sued']}
      />

      <text x={cx} y={526} className="map-progress" textAnchor="middle">
        Kartenbild: {examined.size} / {totalSources} Quellen eingezeichnet
      </text>
      <text x={cx} y={548} className="map-tile-label" textAnchor="middle">
        Limmatraum Dietikon · 1799
      </text>
    </svg>
  )
}

function ClaimMarker({
  x,
  y,
  label,
  status,
}: {
  x: number
  y: number
  label: string
  status: EvidenceStatus
}) {
  return (
    <g className={`claim-marker status-${status}`}>
      <circle cx={x} cy={y} r="7" />
      <text x={x + 13} y={y - 2} className="marker-label">
        {label}
      </text>
      <text x={x + 13} y={y + 12} className="marker-status">
        {statusLabel[status]}
      </text>
    </g>
  )
}
