import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MODULOS, type OverlayKey } from '../catalog'

type Props = {
  items: string[]
  /** Pared disponible en mm — dibuja la guía dorada. */
  availMm: number
  overlays: Record<OverlayKey, boolean>
  /** Si está presente, dibuja el esquinero base a la izquierda como primer bloque
   *  (caso L). El SKU debe ser el GLG7016 o equivalente. */
  cornerSku?: string
  /** Etiqueta para la cota total (ej. "Lado A: NNNN mm"). Si se omite, solo va el número. */
  sideLabel?: string
  /** Escala máxima (px/mm). Default 0.24 para recta; ~0.13 para L que suele ser más angosta. */
  maxScale?: number
  /** ID único del pattern del panel perforado — evita colisiones cuando hay dos SVGs en la página. */
  patternId?: string
}

/** Alzado a escala. Recta = solo items. L = corner + items con esquinero como primer bloque. */
export function ElevationSVG({
  items, availMm, overlays,
  cornerSku, sideLabel,
  maxScale = 0.24,
  patternId = 'pg',
}: Props) {
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

  const corner = cornerSku ? MODULOS[cornerSku] : undefined
  const cornerW = corner?.W ?? 0
  const cornerH = corner?.H ?? 0

  const itemsW = items.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const totalW = cornerW + itemsW
  const drawnW = Math.max(totalW, availMm, 1)
  const pad = { l: 16, r: 16, t: 10, b: 50 }
  const usable = cw - pad.l - pad.r
  const sc = Math.min(usable / drawnW, maxScale)
  const ground = pad.t + 2000 * sc
  const stk = '#7a6a45'

  // Alturas de referencia (mm × sc)
  const baseTop = ground - 910 * sc
  const wtTop   = ground - 940 * sc
  const pegTop  = ground - 1900 * sc
  const pegBot  = ground - 1120 * sc
  const ledY    = ground - 1955 * sc
  const upTop   = ground - 1450 * sc
  const upBot   = ground - 1120 * sc

  /** Dibuja las capas sobre un bloque (mesada/panel/led/superior). */
  const overlayParts = (xx: number, w: number, keyPrefix: string): ReactNode[] => {
    const out: ReactNode[] = []
    if (overlays.peg)   out.push(<rect key={`${keyPrefix}-peg`} x={xx} y={pegTop} width={w} height={pegBot - pegTop} fill={`url(#${patternId})`} stroke={stk} strokeWidth={0.5} />)
    if (overlays.upper) out.push(<rect key={`${keyPrefix}-up`} x={xx + 1} y={upTop} width={Math.max(0, w - 2)} height={upBot - upTop} fill="#cdb480" stroke={stk} strokeWidth={0.6} />)
    if (overlays.led)   out.push(<rect key={`${keyPrefix}-led`} x={xx} y={ledY} width={w} height={Math.max(2, 6 * sc)} fill="#ffe08a" stroke="#caa53a" strokeWidth={0.4} />)
    if (overlays.top)   out.push(<rect key={`${keyPrefix}-top`} x={xx} y={wtTop} width={w} height={Math.max(2, 30 * sc)} fill="#6e5a32" />)
    return out
  }

  const groups: ReactNode[] = []
  let x = pad.l

  // Esquinero (modo L)
  if (corner) {
    const w = corner.W * sc
    const cTop = ground - cornerH * sc
    const parts: ReactNode[] = [
      ...overlayParts(x, w, 'corner'),
      <rect key="cb" x={x} y={cTop} width={w} height={ground - cTop} fill="#e0a93e" stroke={stk} />,
      <text key="cl" x={x + w / 2} y={cTop + (ground - cTop) / 2 + 3}
        fontFamily="monospace" fontSize="8" fill="#5a4410" textAnchor="middle">esq.</text>,
      <text key="cw" x={x + w / 2} y={ground + 14}
        fontFamily="monospace" fontSize="9.5" fill="#aeb6c0" textAnchor="middle">{corner.W}</text>,
    ]
    groups.push(<g key="corner">{parts}</g>)
    x += w
  }

  // Items del lado
  items.forEach((sku, i) => {
    const m = MODULOS[sku]
    if (!m) return
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
      parts.push(...overlayParts(xLocal, w, `i${i}`))
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
    groups.push(<g key={`g${i}`}>{parts}</g>)
  })

  // Banda roja si excede
  const overBand = totalW > availMm ? (() => {
    const ox = pad.l + availMm * sc
    const ow = Math.min((totalW - availMm) * sc, cw - ox - 2)
    if (ow <= 0) return null
    return <rect x={ox} y={pad.t} width={ow} height={ground - pad.t} fill="#ec5a23" opacity={0.12} />
  })() : null

  // Guía de pared
  const ax = pad.l + availMm * sc
  const wallGuide = ax <= cw - 2 ? (
    <g>
      <line x1={ax} y1={pad.t} x2={ax} y2={ground + 6} stroke="#d99327" strokeDasharray="4 3" opacity={0.7} />
      <text x={ax - 4} y={pad.t + 10} fontFamily="monospace" fontSize="9" fill="#e3b86a" textAnchor="end">pared {availMm}</text>
    </g>
  ) : null

  // Cota total
  const dim = totalW > 0 ? (() => {
    const dy = ground + 32
    const tp = totalW * sc
    const label = sideLabel ? `${sideLabel}: ${totalW} mm` : `${totalW} mm`
    const labelW = Math.max(64, label.length * 6.5)
    return (
      <g>
        <line x1={pad.l} y1={dy} x2={pad.l + tp} y2={dy} stroke="#d99327" />
        <line x1={pad.l} y1={dy - 4} x2={pad.l} y2={dy + 4} stroke="#d99327" />
        <line x1={pad.l + tp} y1={dy - 4} x2={pad.l + tp} y2={dy + 4} stroke="#d99327" />
        <rect x={pad.l + tp / 2 - labelW / 2} y={dy - 9} width={labelW} height={16} fill="#1d2026" />
        <text x={pad.l + tp / 2} y={dy + 3} fontFamily="monospace" fontSize="11" fill="#fff" textAnchor="middle">{label}</text>
      </g>
    )
  })() : null

  const isEmpty = items.length === 0 && !corner

  return (
    <div className="stage" ref={containerRef}>
      <svg width="100%" height={ground + pad.b} role="img" aria-label="Vista a escala">
        <defs>
          <pattern id={patternId} width={8} height={8} patternUnits="userSpaceOnUse">
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
      {isEmpty && (
        <div className="stage-empty">
          <span className="b">{sideLabel ? `${sideLabel} vacío` : 'Pared vacía'}</span>
          <span className="s">Tocá una columna en la paleta para empezar</span>
        </div>
      )}
    </div>
  )
}
