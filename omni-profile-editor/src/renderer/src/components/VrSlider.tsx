import { useEffect, useRef } from 'react'

interface VrSliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

// Custom slider for the VR overlay. Native <input type="range"> won't respond
// to synthetic mouse events from sendInputEvent because the browser's internal
// pointer-capture drag logic doesn't fire. This component tracks mousemove /
// mouseup on the window object (which DOES receive synthetic events) instead.
export default function VrSlider({ value, min, max, step, onChange }: VrSliderProps): JSX.Element {
  const trackRef  = useRef<HTMLDivElement>(null)
  const dragging  = useRef(false)

  // Keep latest props in refs so the window-level handlers don't go stale
  const minRef      = useRef(min)
  const maxRef      = useRef(max)
  const stepRef     = useRef(step)
  const onChangeRef = useRef(onChange)
  useEffect(() => { minRef.current = min },      [min])
  useEffect(() => { maxRef.current = max },      [max])
  useEffect(() => { stepRef.current = step },    [step])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  function valueFromX(clientX: number): number {
    if (!trackRef.current) return minRef.current
    const rect  = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw   = minRef.current + ratio * (maxRef.current - minRef.current)
    const snapped = Math.round(raw / stepRef.current) * stepRef.current
    const clamped = Math.max(minRef.current, Math.min(maxRef.current, snapped))
    return parseFloat(clamped.toFixed(10))
  }

  useEffect(() => {
    function onMove(e: MouseEvent): void {
      if (!dragging.current) return
      onChangeRef.current(valueFromX(e.clientX))
    }
    function onUp(): void { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, []) // runs once; uses refs for current values

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    e.preventDefault()
    dragging.current = true
    onChangeRef.current(valueFromX(e.clientX))
  }

  const pct = Math.max(0, Math.min(100, (value - min) / (max - min) * 100))

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      style={{ height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' } as React.CSSProperties}
    >
      <div style={{ position: 'relative', width: '100%', height: 10, borderRadius: 5, background: 'var(--border)' }}>
        {/* Filled portion */}
        <div style={{ position: 'absolute', inset: 0, right: `${100 - pct}%`, background: 'var(--accent)', borderRadius: 5 }} />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 26, height: 26,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: '3px solid var(--bg)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
