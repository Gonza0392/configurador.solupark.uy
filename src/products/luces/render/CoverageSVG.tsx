import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BOXES, type BoxKey } from '../catalog'
import { garageM2, type LucesState } from '../state'

type Props = {
  state: LucesState
  size?: 'compact' | 'large'
}

/** Vista superior (planta) del galpón con las cajas de luces overlay,
 *  centradas y agrupadas. Estática, informativa — no interactiva. */
export function CoverageSVG({ state, size = 'compact' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw] = useState(600)

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const update = () => setCw(Math.max(el.clientWidth, 280))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gM2 = garageM2(state)
  if (state.largoM <= 0 || state.anchoM <= 0) {
    return (
      <div className="hex-stage empty" ref={containerRef}>
        <div className="rect-empty">
          <strong>Ingresá las dimensiones del galpón</strong>
          <span>para visualizar la cobertura de las cajas</span>
        </div>
      </div>
    )
  }

  const maxHeight = size === 'large' ? 460 : 320
  const pad = 24
  const usableW = Math.max(200, cw - pad * 2)
  const usableH = Math.max(160, maxHeight - pad * 2)

  // Escala m → px
  const sc = Math.min(usableW / state.largoM, usableH / state.anchoM)
  const w = state.largoM * sc
  const h = state.anchoM * sc
  const totalW = w + pad * 2
  const totalH = h + pad * 2

  // Cajas: distribuir cada modelo en una grilla centrada por sobre el galpón
  const boxes: Array<{ key: BoxKey; n: number; fill: string; stroke: string }> = [
    { key: 'hex',  n: Math.max(0, state.atl0101Boxes), fill: 'rgba(255, 213, 74, 0.32)',  stroke: '#caa53a' },
    { key: 'rect', n: Math.max(0, state.atl0120Boxes), fill: 'rgba(120, 220, 255, 0.28)', stroke: '#3a9ad9' },
  ]

  /** Posiciona N cajas (rect de wM × hM) centradas dentro del garage. */
  function layoutBoxes(n: number, wM: number, hM: number): Array<[number, number, number, number]> {
    if (n <= 0) return []
    // Calculamos cuántas columnas vs filas caben (best fit por área aprox)
    // Simple: pack en grilla. cols = ceil(sqrt(n * (largoM/anchoM))) — heurística.
    const ratio = state.largoM / state.anchoM
    let bestCols = 1
    let bestScore = Number.POSITIVE_INFINITY
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols)
      const score = Math.abs((cols * wM) / (rows * hM) - ratio)
      if (score < bestScore) { bestScore = score; bestCols = cols }
    }
    const cols = bestCols
    const rows = Math.ceil(n / cols)
    const totalW_box = cols * wM
    const totalH_box = rows * hM
    const startX = (state.largoM - totalW_box) / 2
    const startY = (state.anchoM - totalH_box) / 2
    const out: Array<[number, number, number, number]> = []
    let count = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (count >= n) break
        const x = startX + c * wM
        const y = startY + r * hM
        out.push([x, y, wM, hM])
        count++
      }
    }
    return out
  }

  const elements: ReactNode[] = []
  // Floor del galpón
  elements.push(
    <rect key="floor" x={pad} y={pad} width={w} height={h}
      fill="#2a2e35" stroke="#aeb6c0" strokeWidth={1.2} />,
  )
  // Grid lines suaves
  for (let m = 1; m < state.largoM; m++) {
    elements.push(<line key={`vl-${m}`} x1={pad + m * sc} y1={pad} x2={pad + m * sc} y2={pad + h} stroke="rgba(255,255,255,.05)" />)
  }
  for (let m = 1; m < state.anchoM; m++) {
    elements.push(<line key={`hl-${m}`} x1={pad} y1={pad + m * sc} x2={pad + w} y2={pad + m * sc} stroke="rgba(255,255,255,.05)" />)
  }

  // Cajas overlay
  for (const b of boxes) {
    const box = BOXES[b.key]
    const layout = layoutBoxes(b.n, box.sizeM.wM, box.sizeM.hM)
    for (let i = 0; i < layout.length; i++) {
      const [xM, yM, wM, hM] = layout[i]
      const x = pad + xM * sc
      const y = pad + yM * sc
      const ww = wM * sc
      const hh = hM * sc
      elements.push(
        <rect key={`${b.key}-${i}`} x={x} y={y} width={ww} height={hh}
          fill={b.fill} stroke={b.stroke} strokeWidth={1.4}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,213,74,.3))' }} />,
      )
      elements.push(
        <text key={`${b.key}-${i}-lbl`}
          x={x + ww / 2} y={y + hh / 2 + 3}
          fontFamily="monospace" fontSize="9" fill="#fff" textAnchor="middle"
          style={{ pointerEvents: 'none' }}>
          {box.sku}
        </text>,
      )
    }
  }

  // Cota: largo y ancho del galpón
  elements.push(
    <text key="lblw" x={pad + w / 2} y={pad + h + 16}
      fontFamily="monospace" fontSize="10" fill="#aeb6c0" textAnchor="middle">
      {state.largoM.toFixed(2)} m
    </text>,
    <text key="lblh" x={pad - 8} y={pad + h / 2}
      fontFamily="monospace" fontSize="10" fill="#aeb6c0" textAnchor="end"
      style={{ writingMode: 'vertical-rl' as const }}>
      {state.anchoM.toFixed(2)} m
    </text>,
  )

  const totalCoverage = boxes.reduce((s, b) =>
    s + b.n * BOXES[b.key].sizeM.wM * BOXES[b.key].sizeM.hM, 0)
  const pct = gM2 > 0 ? Math.round((totalCoverage / gM2) * 100) : 0

  return (
    <div className="hex-stage" ref={containerRef}>
      <svg width={totalW} height={totalH + 20} role="img" aria-label="Cobertura de luces en el galpón">
        <rect x={0} y={0} width={totalW} height={totalH + 20} fill="transparent" />
        {elements}
      </svg>
      <div className="hex-meta">
        <span>Galpón: <b>{gM2.toFixed(2)}</b> m²</span>
        <span className="sep">·</span>
        <span>Cobertura: <b>{totalCoverage.toFixed(1)}</b> m² ({pct}%)</span>
      </div>
    </div>
  )
}
