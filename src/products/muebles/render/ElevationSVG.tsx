import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MODULOS, effW, type OverlayKey } from '../catalog'

const DRAG_THRESHOLD_PX = 6
const IMAGE_BASE = `${import.meta.env.BASE_URL}catalog/glg6000/`
const IMAGE_BASE_L = `${import.meta.env.BASE_URL}catalog/glg7000/`

/** Resuelve el path del PNG según el prefijo del SKU.
 *  Los SKUs GLG7xxx (modo L) viven en /catalog/glg7000/ y suelen ser copias
 *  de sus contrapartes GLG6xxx (mismo producto, distinta familia). */
function pngPath(sku: string): string {
  return sku.startsWith('GLG7') ? `${IMAGE_BASE_L}${sku}.png` : `${IMAGE_BASE}${sku}.png`
}

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
  /** Si está presente, los módulos son arrastrables horizontalmente para reordenar. */
  onReorder?: (fromIndex: number, toIndex: number) => void
}

/** Alzado a escala. Recta = solo items. L = corner + items con esquinero como primer bloque.
 *  v3:
 *   - Carga PNG transparentes oficiales desde /catalog/glg6000/{sku}.png con fallback SVG.
 *   - Drag-to-reorder horizontal en el canvas (reemplaza los botones ‹ ›).
 *   - Overlays pixel-alineados a las bases (sin gaps verticales). */
export function ElevationSVG({
  items, availMm, overlays,
  cornerSku, sideLabel,
  maxScale = 0.24,
  patternId = 'pg',
  onReorder,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [cw, setCw] = useState(840)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const dragRef = useRef<{
    pointerId: number | null
    fromIndex: number
    currentIndex: number
    startX: number
    isDragging: boolean
  }>({ pointerId: null, fromIndex: -1, currentIndex: -1, startX: 0, isDragging: false })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setCw(Math.max(el.clientWidth, 320))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Stop handlers en window — empty deps para que NO se re-cree en cada render.
  // (onReorder cambia de identidad en cada render del padre porque reorder(elevTab)
  // devuelve una nueva closure; el ciclo cleanup→remount reseteaba el dragRef.)
  useEffect(() => {
    const stop = () => {
      dragRef.current.pointerId = null
      dragRef.current.isDragging = false
      setDraggingIdx(null)
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  const corner = cornerSku ? MODULOS[cornerSku] : undefined
  const cornerW = corner?.W ?? 0
  const cornerH = corner?.H ?? 0

  const itemsW = items.reduce((s, sku) => {
    const m = MODULOS[sku]
    return s + (m ? effW(m) : 0)
  }, 0)
  const totalW = cornerW + itemsW
  const drawnW = Math.max(totalW, availMm, 1)
  const pad = { l: 16, r: 16, t: 10, b: 50 }
  const usable = cw - pad.l - pad.r
  const sc = Math.min(usable / drawnW, maxScale)
  const ground = pad.t + 2000 * sc
  const stk = '#7a6a45'

  // Alturas — el upper se alinea con el TOP DE LAS TORRES (2000mm) como en el
  // catálogo oficial. Entre el panel y el working top queda un gap de ~105mm
  // donde solo se ven las barras espaciadoras (montaje real GLG6008).
  // Real install (mm): base [0..910] · wt [910..940] · barras visibles [940..1045]
  //                    · panel [1045..1650] · upper [1650..2000]
  const TOWER_H  = 2000                    // altura total de torres + stack completo
  const baseTop  = ground - 910 * sc
  const wtH      = 30                      // working top thickness
  const wtTop    = baseTop - wtH * sc      // top sits ON the base
  const upH      = 350                     // upper cabinet height (GLG6001)
  const upTop    = ground - TOWER_H * sc   // alineado con tope de torres
  const upBot    = upTop + upH * sc
  const pegH     = 605                     // panel perforado height
  const pegTop   = upBot                   // panel apoya CONTRA el upper (sin gap arriba)
  const pegBot   = pegTop + pegH * sc      // queda gap entre pegBot y wtTop = 105mm

  /** Dibuja las capas sobre un bloque (panel perforado / módulo superior con LED / working top).
   *  Cada capa lleva: skeleton sutil debajo (para si la PNG no carga) + image PNG estirada por encima. */
  const overlayParts = (xx: number, w: number, keyPrefix: string): ReactNode[] => {
    const out: ReactNode[] = []
    if (overlays.peg) {
      // Panel perforado GLG6007: 1:1 con upper (680mm de ancho cada conjunto
      // panel+2 barras). El panel cubre TODA la altura desde el upper hasta el
      // working top (sin gap). Las 2 barras van a los lados del panel.
      const pegTileW = 680 * sc           // mismo ancho que upper
      const totalH = wtTop - pegTop       // panel cubre todo: 710mm
      const nPeg = Math.max(1, Math.ceil(w / pegTileW))
      const barW = Math.max(3, 45 * sc)
      // Fondo dotted (fallback si la PNG no carga)
      out.push(
        <rect key={`${keyPrefix}-peg-bg`} x={xx} y={pegTop} width={w} height={totalH}
          fill={`url(#${patternId})`} opacity={0.25} />,
      )
      // N tiles de panel (seamless): cada tile cubre el "interior" entre las 2 barras.
      // Tile útil = 680 - 2*barW (descontando las barras laterales).
      const panelInsetW = Math.max(0, pegTileW - 2 * barW)
      for (let t = 0; t < nPeg; t++) {
        const tileX = xx + t * pegTileW
        out.push(
          <image key={`${keyPrefix}-peg${t}`} href={`${IMAGE_BASE}GLG6007.png`}
            x={tileX + barW} y={pegTop} width={panelInsetW} height={totalH}
            preserveAspectRatio="none" pointerEvents="none" />,
        )
      }
      // 2 barras por tile (izq + der), altura completa
      for (let t = 0; t < nPeg; t++) {
        const tileX = xx + t * pegTileW
        out.push(
          <rect key={`${keyPrefix}-barL${t}`} x={tileX} y={pegTop} width={barW} height={totalH}
            fill="#1a1c20" stroke="#0a0b0d" strokeWidth={0.6} />,
          <rect key={`${keyPrefix}-barR${t}`} x={tileX + pegTileW - barW} y={pegTop} width={barW} height={totalH}
            fill="#1a1c20" stroke="#0a0b0d" strokeWidth={0.6} />,
        )
      }
    }
    if (overlays.upper) {
      // GLG6001 con LED integrado: N images de 680mm alineadas desde el inicio del run.
      // N = ceil(w / 680mm) — coincide con la cantidad del BOM. El último puede sobresalir
      // unos mm si el run termina con un módulo de 658mm (móvil) — aceptable visualmente.
      const upTileW = 680 * sc
      const nUp = Math.max(1, Math.ceil(w / upTileW))
      out.push(
        <rect key={`${keyPrefix}-up-bg`} x={xx} y={upTop} width={w} height={upH * sc}
          fill="#2a2e36" stroke={stk} strokeWidth={0.5} opacity={0.55} />,
      )
      for (let t = 0; t < nUp; t++) {
        out.push(
          <image key={`${keyPrefix}-up${t}`} href={`${IMAGE_BASE}GLG6001.png`}
            x={xx + t * upTileW} y={upTop} width={upTileW} height={upH * sc}
            preserveAspectRatio="none" pointerEvents="none" />,
        )
      }
      out.push(
        <rect key={`${keyPrefix}-up-led`} x={xx + 1} y={upBot - Math.max(2, 4 * sc)} width={Math.max(0, w - 2)} height={Math.max(2, 4 * sc)}
          fill="#ffe08a" stroke="#caa53a" strokeWidth={0.4} opacity={0.9} />,
      )
    }
    if (overlays.top) out.push(
      <rect key={`${keyPrefix}-top`} x={xx} y={wtTop} width={w} height={Math.max(2, wtH * sc)}
        fill="#9aa2ad" stroke="#7a8088" strokeWidth={0.5} />,
    )
    return out
  }

  // ---------- Drag handlers ----------

  const dragInteractive = !!onReorder

  /** Pixel X actual del cursor → índice de slot dentro de items[]. */
  const cursorToSlot = (clientX: number): number => {
    if (items.length === 0) return -1
    const svg = svgRef.current; if (!svg) return -1
    const rect = svg.getBoundingClientRect()
    const localX = clientX - rect.left - pad.l - cornerW * sc
    let acc = 0
    for (let j = 0; j < items.length; j++) {
      const mm = MODULOS[items[j]]
      const w = (mm ? effW(mm) : 0) * sc
      if (localX < acc + w / 2) return j
      acc += w
    }
    return items.length - 1
  }

  const handleDragStart = (idx: number) => (e: React.PointerEvent<SVGRectElement>) => {
    if (!dragInteractive) return
    if (e.button !== 0) return
    e.preventDefault()
    dragRef.current.pointerId = e.pointerId
    dragRef.current.fromIndex = idx
    dragRef.current.currentIndex = idx
    dragRef.current.startX = e.clientX
    dragRef.current.isDragging = false
    setDraggingIdx(idx)
    // Pointer capture: bloquea todos los pointer events siguientes a este rect
    // (no se pierden en re-renders ni en otros elementos del SVG).
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  const handleDragMove = (e: React.PointerEvent<SVGRectElement>) => {
    const ref = dragRef.current
    if (ref.pointerId !== e.pointerId) return
    if (!ref.isDragging) {
      const dx = Math.abs(e.clientX - ref.startX)
      if (dx < DRAG_THRESHOLD_PX) return
      ref.isDragging = true
    }
    const newIdx = cursorToSlot(e.clientX)
    if (newIdx < 0 || newIdx === ref.currentIndex) return
    onReorder?.(ref.currentIndex, newIdx)
    ref.currentIndex = newIdx
    setDraggingIdx(newIdx)
  }

  const handleDragEnd = (e: React.PointerEvent<SVGRectElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    dragRef.current.pointerId = null
    dragRef.current.isDragging = false
    setDraggingIdx(null)
  }

  // ---------- Render ----------

  const groups: ReactNode[] = []
  let x = pad.l

  // Pre-cálculo de RUNS de bases contiguas (corner + bases + móvil, sin torres).
  // Los overlays (peg / upper / working top) se dibujan UNA vez por run, no
  // por módulo individual, así el número de tiles visibles del pattern coincide
  // con la cantidad de paneles del BOM (ceil(runW / panelW)).
  const overlayRuns: Array<{ startX: number; totalW: number }> = []
  let runStartX: number | null = null
  let runW = 0
  let xScan = pad.l
  if (corner) {
    runStartX = xScan
    runW = corner.W * sc
    xScan += corner.W * sc
  }
  for (const sku of items) {
    const m = MODULOS[sku]
    if (!m) continue
    const w = effW(m) * sc
    const isTowerScan = m.sub === 'tower'
    if (isTowerScan) {
      if (runStartX !== null) {
        overlayRuns.push({ startX: runStartX, totalW: runW })
        runStartX = null; runW = 0
      }
    } else {
      if (runStartX === null) runStartX = xScan
      runW += w
    }
    xScan += w
  }
  if (runStartX !== null) overlayRuns.push({ startX: runStartX, totalW: runW })

  // Esquinero GLG7000D (modo L): proyección frontal full-height (2000mm) con
  //   base + panel perforado + upper LED, igual stack que las torres.
  //   Intenta cargar imagen oficial /catalog/glg7000/GLG7000D.png; si no carga,
  //   muestra fallback SVG en negro con detalles representativos.
  if (corner) {
    const w = corner.W * sc
    const cBase = 870 * sc            // GLG7016 base height
    const cTopHat = 355 * sc          // GLG7014 upper height
    const cTopY = ground - 2000 * sc  // full-height (alineado con torres)
    const baseTopCorner = ground - cBase
    const parts: ReactNode[] = [
      // Skeleton oscuro (visible si la PNG no carga)
      <rect key="cbg" x={x} y={cTopY} width={w} height={ground - cTopY}
        fill="#2a2e36" stroke={stk} strokeWidth={0.5} opacity={0.6} />,
      // Cuerpo de la base inferior (puerta)
      <rect key="cbody" x={x + 1} y={baseTopCorner} width={w - 2} height={cBase}
        fill="#1a1c20" stroke="#0d1015" strokeWidth={0.5} />,
      <line key="cdoor" x1={x + w / 2} y1={baseTopCorner + 3} x2={x + w / 2} y2={ground - 3}
        stroke="#0d1015" strokeWidth={0.4} />,
      // Manijas verticales en la puerta
      <rect key="ch1" x={x + w / 2 - 2.5} y={baseTopCorner + cBase * 0.4} width={0.8} height={cBase * 0.3} fill="#9aa2ad" />,
      <rect key="ch2" x={x + w / 2 + 1.7} y={baseTopCorner + cBase * 0.4} width={0.8} height={cBase * 0.3} fill="#9aa2ad" />,
      // Working top + panel perforado (zona del medio)
      <rect key="cwt" x={x} y={baseTopCorner - 30 * sc} width={w} height={30 * sc}
        fill="#9aa2ad" stroke="#7a8088" strokeWidth={0.4} />,
      <rect key="cpeg" x={x + 2} y={cTopY + cTopHat} width={w - 4} height={baseTopCorner - 30 * sc - (cTopY + cTopHat)}
        fill="#1a1c20" stroke="#0d1015" strokeWidth={0.4} />,
      // Patrón de perforaciones simulado
      ...Array.from({ length: 12 }).flatMap((_, r) =>
        Array.from({ length: 5 }).map((__, c) => (
          <rect key={`cp${r}-${c}`}
            x={x + 4 + c * ((w - 8) / 5)} y={cTopY + cTopHat + 4 + r * ((baseTopCorner - 30 * sc - (cTopY + cTopHat) - 8) / 12)}
            width={1.2} height={1.2} fill="#9aa2ad" opacity={0.45} />
        ))
      ),
      // Módulo superior (GLG7014/7015) — caja chata con LED
      <rect key="cup" x={x + 1} y={cTopY} width={w - 2} height={cTopHat}
        fill="#1a1c20" stroke="#0d1015" strokeWidth={0.5} />,
      <line key="cupdoor" x1={x + w / 2} y1={cTopY + 2} x2={x + w / 2} y2={cTopY + cTopHat - 2}
        stroke="#0d1015" strokeWidth={0.4} />,
      <rect key="cled" x={x + 1} y={cTopY + cTopHat - Math.max(2, 4 * sc)} width={w - 2} height={Math.max(2, 4 * sc)}
        fill="#ffe08a" stroke="#caa53a" strokeWidth={0.4} opacity={0.9} />,
      // Etiqueta "ESQ" sutil
      <text key="cl" x={x + w / 2} y={ground - cBase / 2 + 3}
        fontFamily="monospace" fontSize="7.5" fill="#5a6068" textAnchor="middle"
        opacity={0.6}>ESQ</text>,
      // Etiqueta de ancho debajo
      <text key="cw" x={x + w / 2} y={ground + 14}
        fontFamily="monospace" fontSize="9.5" fill="#3a3f48" textAnchor="middle">{corner.W}</text>,
    ]
    groups.push(<g key="corner">{parts}</g>)
    x += w
  }

  // Items del lado — sin overlays individuales (ahora se dibujan por run).
  items.forEach((sku, i) => {
    const m = MODULOS[sku]
    if (!m) return
    const xLocal = x
    const slotW = effW(m) * sc       // ancho del SLOT (móvil: 680mm)
    const visualW = m.W * sc         // ancho FÍSICO del mueble (móvil: 658mm)
    const visualX = xLocal + (slotW - visualW) / 2  // centrado en el slot
    x += slotW

    const parts: ReactNode[] = []
    const isT = m.sub === 'tower'
    const isMobile = m.sub === 'mobile'
    const isDragging = draggingIdx === i
    const opacity = isDragging ? 0.5 : 1

    // Altura del bloque: torres full-height, el resto (bases + móvil) al nivel de baseTop.
    let topY: number, blockH: number
    if (isT) { topY = ground - 2000 * sc; blockH = 2000 * sc }
    else { topY = baseTop; blockH = ground - baseTop }

    // Skeleton sutil oscuro: solo visible si la PNG no carga (no más bandas doradas).
    parts.push(
      <rect key="bg" x={visualX} y={topY} width={visualW} height={blockH}
        fill="#2a2e36" stroke={stk} strokeWidth={0.5} opacity={opacity * 0.55} />,
    )

    // Imagen oficial — ancho FÍSICO del mueble, centrada en el slot efectivo.
    // El móvil deja 11mm de aire a cada lado (slot 680 − ancho 658 / 2).
    parts.push(
      <image key="img" href={pngPath(sku)}
        x={visualX} y={topY} width={visualW} height={blockH}
        preserveAspectRatio="none"
        opacity={opacity}
        pointerEvents="none" />,
    )

    // Etiqueta de ancho debajo (centrada en el SLOT efectivo).
    // Para el móvil mostramos su ancho físico (658) con sufijo "móv".
    parts.push(
      <text key="lab" x={xLocal + slotW / 2} y={ground + 14}
        fontFamily="monospace" fontSize="9.5" fill={isMobile ? '#a86a1c' : '#3a3f48'} textAnchor="middle">
        {m.W}{isMobile ? ' móv' : ''}
      </text>,
    )

    // Hit area transparente para el drag (cubre todo el slot efectivo).
    if (dragInteractive) {
      parts.push(
        <rect key="hit" x={xLocal} y={Math.min(topY, upTop) - 4} width={slotW} height={ground - Math.min(topY, upTop) + 8}
          fill="transparent"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={handleDragStart(i)}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}>
          <title>Arrastrá para reordenar · {sku}</title>
        </rect>,
      )
    }

    groups.push(<g key={`g${i}`}>{parts}</g>)
  })

  // Overlays por RUN (panel perforado, working top, upper LED): se dibujan
  // una vez por run contiguo. El pattern del panel se tila a su frecuencia
  // física (1052mm) — la cantidad de tiles visibles coincide con el BOM.
  overlayRuns.forEach((r, i) => {
    if (r.totalW <= 0) return
    // Clip al ancho exacto del run: previene que el último tile (panel o upper)
    // sobresalga del run y pise la torre vecina.
    const clipId = `${patternId}-clip-r${i}`
    groups.push(
      <g key={`ov${i}`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={r.startX} y={upTop - 2} width={r.totalW} height={ground - upTop + 4} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`} pointerEvents="none">
          {overlayParts(r.startX, r.totalW, `r${i}`)}
        </g>
      </g>
    )
  })

  // Banda roja si excede
  const overBand = totalW > availMm ? (() => {
    const ox = pad.l + availMm * sc
    const ow = Math.min((totalW - availMm) * sc, cw - ox - 2)
    if (ow <= 0) return null
    return <rect x={ox} y={pad.t} width={ow} height={ground - pad.t} fill="#ec5a23" opacity={0.12} pointerEvents="none" />
  })() : null

  // Guía de pared
  const ax = pad.l + availMm * sc
  const wallGuide = ax <= cw - 2 ? (
    <g pointerEvents="none">
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
      <g pointerEvents="none">
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
    <div className="stage" id="stage" ref={containerRef}>
      <svg
        ref={svgRef}
        width="100%" height={ground + pad.b}
        role="img" aria-label="Vista a escala"
        style={dragInteractive && draggingIdx !== null ? { cursor: 'grabbing', userSelect: 'none' } : undefined}
      >
        <defs>
          {/* Fallback punteado del panel perforado (sale si la PNG no carga) */}
          <pattern id={patternId} width={8} height={8} patternUnits="userSpaceOnUse">
            <rect width={8} height={8} fill="#d9cfa8" />
            <circle cx={4} cy={4} r={1} fill="#b9a874" />
          </pattern>
          {/* Panel perforado real GLG6007 — tila cada 1052×605 mm (medidas reales del módulo). */}
          <pattern id={`${patternId}-peg`} patternUnits="userSpaceOnUse"
            width={1052 * sc} height={605 * sc}>
            <image href={`${IMAGE_BASE}GLG6007.png`}
              x={0} y={0} width={1052 * sc} height={605 * sc}
              preserveAspectRatio="none" />
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
      {dragInteractive && items.length > 0 && (
        <div className="stage-hint">Arrastrá los módulos horizontalmente para reordenar</div>
      )}
    </div>
  )
}
