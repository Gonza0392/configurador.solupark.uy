import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MODULOS } from '../catalog'
import type { MueblesState } from '../state'

/** Vista superior (planta) de la estación en L. Portado de v2-L.html `drawPlan`. */
export function PlanSVG({ state }: { state: MueblesState }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(820)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setCw(Math.max(el.clientWidth, 360))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const L = state.L
  const cornerW = L.corner ? 810 : 0
  const lenA = cornerW + L.itemsA.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const lenB = cornerW + L.itemsB.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const extentX = Math.max(lenA, L.availMmA, 1200)
  const extentY = Math.max(lenB, L.availMmB, 1200)

  const pad = 34
  const sc = Math.min(
    (cw - pad * 2) / (extentX + 260),
    (440 - pad * 2) / (extentY + 260),
    0.085,
  )
  const ox = pad + 20  // origen X del codo (interno)
  const oy = pad + 18  // origen Y del codo
  const H = Math.max(300, extentY * sc + pad * 2 + 30)

  const stk = '#7a6a45'
  const base = '#c9b178'
  const cornc = '#e0a93e'
  const wallTh = 6
  const els: ReactNode[] = []

  // Paredes (líneas gruesas: arriba para A, izquierda para B)
  els.push(<rect key="wA" x={ox - wallTh} y={oy - wallTh} width={lenA * sc + wallTh} height={wallTh} fill="#3a4049" />)
  els.push(<rect key="wB" x={ox - wallTh} y={oy - wallTh} width={wallTh} height={lenB * sc + wallTh} fill="#3a4049" />)

  // Esquinero (footprint)
  if (L.corner) {
    els.push(
      <rect key="corner" x={ox} y={oy} width={810 * sc} height={810 * sc} fill={cornc} stroke={stk} />,
      <text key="corner-l" x={ox + 810 * sc / 2} y={oy + 810 * sc / 2 + 3}
        fontFamily="monospace" fontSize="8" fill="#5a4410" textAnchor="middle">7016</text>,
    )
  }

  // Lado A — módulos extienden a la derecha desde el codo, profundidad hacia abajo
  let xa = ox + cornerW * sc
  L.itemsA.forEach((sku, i) => {
    const m = MODULOS[sku]; if (!m) return
    const w = m.W * sc
    const dep = m.D * sc
    const lines: ReactNode[] = []
    if (m.sub === 'drawer') {
      for (let k = 1; k < 3; k++) {
        const y = oy + dep * k / 3
        lines.push(<line key={`d${k}`} x1={xa} y1={y} x2={xa + w} y2={y} stroke="#a98c46" strokeWidth={0.4} />)
      }
    }
    els.push(
      <g key={`a${i}`}>
        <rect x={xa} y={oy} width={w} height={dep} fill={base} stroke={stk} />
        {lines}
        <text x={xa + w / 2} y={oy - 3} fontFamily="monospace" fontSize="7.5" fill="#aeb6c0" textAnchor="middle">{m.W}</text>
      </g>,
    )
    xa += w
  })

  // Lado B — módulos extienden hacia abajo desde el codo, profundidad hacia la derecha
  let yb = oy + cornerW * sc
  L.itemsB.forEach((sku, i) => {
    const m = MODULOS[sku]; if (!m) return
    const h = m.W * sc
    const dep = m.D * sc
    const lines: ReactNode[] = []
    if (m.sub === 'drawer') {
      for (let k = 1; k < 3; k++) {
        const xx = ox + dep * k / 3
        lines.push(<line key={`d${k}`} x1={xx} y1={yb} x2={xx} y2={yb + h} stroke="#a98c46" strokeWidth={0.4} />)
      }
    }
    els.push(
      <g key={`b${i}`}>
        <rect x={ox} y={yb} width={dep} height={h} fill={base} stroke={stk} />
        {lines}
        <text x={ox - 4} y={yb + h / 2 + 3} fontFamily="monospace" fontSize="7.5" fill="#aeb6c0" textAnchor="end">{m.W}</text>
      </g>,
    )
    yb += h
  })

  // Voladizo de mesada (605 mm)
  if (state.overlays.top) {
    const oh = 605 * sc
    if (lenA > cornerW) {
      els.push(<rect key="ohA" x={ox + cornerW * sc} y={oy} width={(lenA - cornerW) * sc} height={oh} fill="#6e5a32" opacity={0.22} />)
    }
    if (lenB > cornerW) {
      els.push(<rect key="ohB" x={ox} y={oy + cornerW * sc} width={oh} height={(lenB - cornerW) * sc} fill="#6e5a32" opacity={0.22} />)
    }
  }

  // Guías de paredes disponibles
  const gA = ox + L.availMmA * sc
  const gB = oy + L.availMmB * sc
  els.push(
    <line key="gAl" x1={gA} y1={oy - 10} x2={gA} y2={oy + 40} stroke="#d99327" strokeDasharray="4 3" opacity={0.8} />,
    <text key="gAt" x={gA} y={oy - 13} fontFamily="monospace" fontSize="8" fill="#e3b86a" textAnchor="middle">pared A {L.availMmA}</text>,
    <line key="gBl" x1={ox - 10} y1={gB} x2={ox + 40} y2={gB} stroke="#d99327" strokeDasharray="4 3" opacity={0.8} />,
    <text key="gBt" x={ox - 12} y={gB + 3} fontFamily="monospace" fontSize="8" fill="#e3b86a" textAnchor="end">pared B {L.availMmB}</text>,
  )

  // Etiquetas de lados
  const aLabelY = oy + (state.overlays.top ? 605 * sc : 0) + Math.max(460 * sc, 18) + 16
  const bLabelX = ox + (state.overlays.top ? 605 * sc : 0) + Math.max(460 * sc, 18) + 8
  els.push(
    <text key="lA" x={ox + lenA * sc / 2} y={aLabelY}
      fontFamily="monospace" fontSize="9" fill="#d99327" textAnchor="middle">LADO A · {lenA} mm →</text>,
    <text key="lB" x={bLabelX} y={oy + lenB * sc / 2}
      fontFamily="monospace" fontSize="9" fill="#d99327" textAnchor="middle"
      transform={`rotate(90 ${bLabelX} ${oy + lenB * sc / 2})`}>LADO B · {lenB} mm ↓</text>,
  )

  const hasAnything = L.itemsA.length > 0 || L.itemsB.length > 0 || L.corner

  return (
    <div className="stage" ref={containerRef}>
      <svg width="100%" height={H} role="img" aria-label="Planta de la estación en L">
        {hasAnything ? els : (
          <text x="50%" y="50%" fontFamily="monospace" fontSize="12" fill="#868f9b" textAnchor="middle">
            Activá el esquinero o agregá módulos a algún lado
          </text>
        )}
      </svg>
    </div>
  )
}
