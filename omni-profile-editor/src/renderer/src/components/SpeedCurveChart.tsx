import type { Profile } from '../types/api'

interface SpeedCurveChartProps {
  profile: Omit<Profile, 'game'>
}

export default function SpeedCurveChart({ profile }: SpeedCurveChartProps): JSX.Element {
  const { multiplier, minspeed, minrange, maxrange, maxspeed } = profile

  const W = 220, H = 130
  const pad = { l: 32, r: 12, t: 10, b: 28 }
  const w = W - pad.l - pad.r
  const h = H - pad.t - pad.b

  const effectiveMax = maxspeed > 0 ? Math.min(multiplier, maxspeed) : multiplier
  const maxOutY = Math.max(0.5, effectiveMax * 1.15)
  const maxInX = 1.5

  function toSvg(x: number, y: number): [number, number] {
    return [
      pad.l + (x / maxInX) * w,
      pad.t + h - Math.min(y / maxOutY, 1) * h,
    ]
  }

  // Build piecewise points
  const pts: [number, number][] = []
  // Dead zone: x=0 → 0
  pts.push([0, 0])
  if (minrange > 0) {
    pts.push([minrange - 0.001, 0])
    pts.push([minrange, minspeed])
  }

  // Ramp: minrange → maxrange, minspeed → multiplier
  const rampLen = Math.max(maxrange - minrange, 0.01)
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = minrange + t * rampLen
    let y = minspeed + t * (multiplier - minspeed)
    if (maxspeed > 0) y = Math.min(y, maxspeed)
    pts.push([x, y])
    if (maxspeed > 0 && y >= maxspeed && i < steps) break
  }

  // Extend flat to right edge
  const lastPt = pts[pts.length - 1]
  if (lastPt[0] < maxInX) {
    pts.push([maxInX, lastPt[1]])
  }

  const svgPts = pts.map(([x, y]) => toSvg(x, y))
  const d = svgPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [x0, y0] = toSvg(0, 0)
  const [xEnd] = toSvg(maxInX, 0)

  // Guide lines
  const [minRangeX] = toSvg(minrange, 0)
  const [maxRangeX] = toSvg(Math.min(maxrange, maxInX), 0)
  const [, capY] = toSvg(0, maxspeed)
  const [, multY] = toSvg(0, multiplier)

  const guideStyle = { stroke: 'var(--border)', strokeWidth: '1', strokeDasharray: '3,3' }

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Speed Curve</p>
      <svg width={W} height={H} style={{ overflow: 'visible', display: 'block' }}>
        {/* Axes */}
        <line x1={x0} y1={y0} x2={xEnd} y2={y0} stroke="var(--border)" strokeWidth="1.5" />
        <line x1={x0} y1={pad.t} x2={x0} y2={y0} stroke="var(--border)" strokeWidth="1.5" />

        {/* minrange guide */}
        {minrange > 0 && minrange < maxInX && (
          <line x1={minRangeX} y1={y0} x2={minRangeX} y2={pad.t} {...guideStyle} />
        )}
        {/* maxrange guide */}
        {maxrange > 0 && maxrange < maxInX && (
          <line x1={maxRangeX} y1={y0} x2={maxRangeX} y2={pad.t} {...guideStyle} />
        )}
        {/* maxspeed cap line */}
        {maxspeed > 0 && (
          <line x1={x0} y1={capY} x2={xEnd} y2={capY} {...guideStyle} />
        )}
        {/* multiplier reference */}
        {Math.abs(multiplier - (maxspeed > 0 ? maxspeed : multiplier)) > 0.01 && (
          <line x1={x0} y1={multY} x2={xEnd} y2={multY} stroke="var(--border)" strokeWidth="1" strokeDasharray="1,5" />
        )}

        {/* Fill under curve */}
        <path
          d={`${d} L${xEnd},${y0} L${x0},${y0} Z`}
          fill="var(--accent)"
          fillOpacity="0.08"
        />

        {/* Curve */}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Axis labels */}
        <text x={x0 - 4} y={y0 + 1} fontSize="9" fill="var(--muted)" textAnchor="end" dominantBaseline="middle">0</text>
        <text x={x0 - 4} y={pad.t} fontSize="9" fill="var(--muted)" textAnchor="end" dominantBaseline="middle">{maxOutY.toFixed(1)}</text>
        <text x={x0} y={H - 2} fontSize="9" fill="var(--muted)" textAnchor="middle">0</text>
        <text x={xEnd} y={H - 2} fontSize="9" fill="var(--muted)" textAnchor="middle">1.5</text>

        {/* Axis name labels */}
        <text x={W / 2} y={H} fontSize="9" fill="var(--icon)" textAnchor="middle">Physical Input</text>
        <text x={10} y={H / 2} fontSize="9" fill="var(--icon)" textAnchor="middle" transform={`rotate(-90,10,${H / 2})`}>Output</text>
      </svg>
    </div>
  )
}
