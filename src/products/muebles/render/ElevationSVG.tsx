import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MODULOS } from '../catalog'
import type { MueblesState } from '../state'

/** Alzado a escala de la pared recta. Portado de files/index.html (v1). */
export function ElevationSVG({ state }: { state: MueblesState }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(840)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setCw(Math.max(el.clientWidth, 320))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const items = state.items
  const totalW = items.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const drawnW = Math.max(totalW, state.availMm, 1)
  const pad = { l: 16, r: 16, t: 10, b: 50 }
  const usable = cw - pad.l - pad.r
  const sc = Math.min(usable / drawnW, 0.24)
  const ground = pad.t + 2000 * sc
  const stk = '#7a6a45'

  // alturas de referencia (mm × escala)
  const baseTop = ground - 910 * sc
  const wtTop   = ground - 940 * sc
  const pegTop  = ground - 1900 * sc
  const pegBot  = ground - 1120 * sc
  const ledY    = ground - 1955 * sc
  const upTop   = ground - 1450 * sc
  const upBot   = ground - 1120 * sc

  let x = pad.l
  const groups = items.map((sku, i): ReactNode => {
    const m = MODULOS[sku]
    if (!m) return null
    const xLocal = x
    const w = m.W * sc
    x += w

    const parts: ReactNode[] = []
    const isT = m.sub === 'tower'

    if (isT) {
      parts.push(
        <rect key="t" x={xLocal} y={ground - 2000 * sc} width={w} height={2000 * sc} fill="#c9b178" stroke={stk} />,
        <line key="tl" x1={xLocal + w / 2} y1={ground - 2000 * sc} x2={xLocal + w / 2} y2={ground} stroke={stk} strokeWidth={0.7} />,
      )
    } else {
      if (state.overlays.peg) {
        parts.push(<rect key="peg" x={xLocal} y={pegTop} width={w} height={pegBot - pegTop} fill="url(#pg)" stroke={stk} strokeWidth={0.5} />)
      }
      if (state.overlays.upper) {
        parts.push(<rect key="up" x={xLocal + 1} y={upTop} width={Math.max(0, w - 2)} height={upBot - upTop} fill="#cdb480" stroke={stk} strokeWidth={0.6} />)
      }
      if (state.overlays.led) {
        parts.push(<rect key="led" x={xLocal} y={ledY} width={w} height={Math.max(2, 6 * sc)} fill="#ffe08a" stroke="#caa53a" strokeWidth={0.4} />)
      }
      if (state.overlays.top) {
        parts.push(<rect key="top" x={xLocal} y={wtTop} width={w} height={Math.max(2, 30 * sc)} fill="#6e5a32" />)
      }
      parts.push(
        <rect key="b" x={xLocal} y={baseTop} width={w} height={ground - baseTop} fill="#c9b178" stroke={stk} />,
      )
      if (m.sub === 'drawer') {
        const n = 4, ch = (ground - baseTop) / n
        for (let k = 0; k < n; k++) {
          const dy = baseTop + k * ch
          parts.push(
            <rect key={`d${k}`} x={xLocal + 2} y={dy + 1.5} width={Math.max(0, w - 4)} height={Math.max(0, ch - 3)} fill="#d4be86" stroke="#a98c46" strokeWidth={0.5} />,
          )
        }
      } else {
        parts.push(<line key="dl" x1={xLocal + w / 2} y1={baseTop} x2={xLocal + w / 2} y2={ground} stroke="#a98c46" />)
      }
    }

    parts.push(
      <text key="lab" x={xLocal + w / 2} y={ground + 14}
        fontFamily="monospace" fontSize="9.5" fill="#aeb6c0" textAnchor="middle">{m.W}</text>,
    )
    return <g key={`g${i}`}>{parts}</g>
  })

  // banda roja "excede"
  const overBand = totalW > state.availMm ? (() => {
    const ox = pad.l + state.availMm * sc
    const ow = Math.min((totalW - state.availMm) * sc, cw - ox - 2)
    if (ow <= 0) return null
    return <rect x={ox} y={pad.t} width={ow} height={ground - pad.t} fill="#ec5a23" opacity={0.12} />
  })() : null

  // guía de pared
  const ax = pad.l + state.availMm * sc
  const wallGuide = ax <= cw - 2 ? (
    <g>
      <line x1={ax} y1={pad.t} x2={ax} y2={ground + 6} stroke="#d99327" strokeDasharray="4 3" opacity={0.7} />
      <text x={ax - 4} y={pad.t + 10} fontFamily="monospace" fontSize="9" fill="#e3b86a" textAnchor="end">pared {state.availMm}</text>
    </g>
  ) : null

  // cota total
  const dim = totalW > 0 ? (() => {
    const dy = ground + 32
    const tp = totalW * sc
    return (
      <g>
        <line x1={pad.l} y1={dy} x2={pad.l + tp} y2={dy} stroke="#d99327" />
        <line x1={pad.l} y1={dy - 4} x2={pad.l} y2={dy + 4} stroke="#d99327" />
        <line x1={pad.l + tp} y1={dy - 4} x2={pad.l + tp} y2={dy + 4} stroke="#d99327" />
        <rect x={pad.l + tp / 2 - 32} y={dy - 9} width={64} height={16} fill="#1d2026" />
        <text x={pad.l + tp / 2} y={dy + 3} fontFamily="monospace" fontSize="11" fill="#fff" textAnchor="middle">{totalW} mm</text>
      </g>
    )
  })() : null

  return (
    <div className="stage" ref={containerRef}>
      <svg width="100%" height={ground + pad.b} role="img" aria-label="Vista a escala de la estación">
        <defs>
          <pattern id="pg" width={8} height={8} patternUnits="userSpaceOnUse">
            <rect width={8} height={8} fill="#d9cfa8" />
            <circle cx={4} cy={4} r={1} fill="#b9a874" />
          </pattern>
        </defs>
        {overBand}
        <line x1={pad.l} y1={ground} x2={cw - pad.r} y2={ground} stroke="#454c56" strokeWidth={1.5} />
        {groups}
        {wallGuide}
        {dim}
      </svg>
      {items.length === 0 && (
        <div className="stage-empty">
          <span className="b">Pared vacía</span>
          <span className="s">Tocá una columna en la paleta para empezar</span>
        </div>
      )}
    </div>
  )
}
