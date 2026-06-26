import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TILE_CM, colorByKey, type ColorKey } from '../catalog'
import {
  anyBorde, anyCorner, colsFor, countBordeEdges, countCornerColors, rowsFor,
  type CornerPos, type PisosState, type Side,
} from '../state'

const TILE_M = TILE_CM / 100
const DRAG_THRESHOLD_PX = 6

type PaintTileFn = (row: number, col: number, useOther: boolean) => void
type PaintBorderFn = (side: Side, idx: number, remove: boolean) => void
type PaintCornerFn = (pos: CornerPos, remove: boolean) => void

type Props = {
  state: PisosState
  size?: 'compact' | 'large' | 'xl'
  onPaintTile?: PaintTileFn
  onPaintBorder?: PaintBorderFn
  onPaintCorner?: PaintCornerFn
}

type Target =
  | { type: 'tile'; r: number; c: number }
  | { type: 'border'; side: Side; idx: number }
  | { type: 'corner'; pos: CornerPos }

/** Vista superior del piso. Modelo Carparts:
 *  - Click izq en baldosa: pinta con brocha activa.
 *  - Click izq sobre borde-de-baldosa: agrega borde con bordeBrush.
 *  - Click izq sobre esquina-perímetro: agrega esquina con esquinaBrush.
 *  - Click der: en tile pinta con la otra brocha; en borde/esquina lo remueve.
 *  - Drag: extiende la acción a baldosas/bordes/esquinas adicionales. */
export function TileGridSVG({ state, size = 'compact', onPaintTile, onPaintBorder, onPaintCorner }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{
    pointerId: number | null
    button: number
    startX: number
    startY: number
    isDragging: boolean
    lastKey: string | null
    mode: 'tile' | 'border' | 'corner' | null
  }>({ pointerId: null, button: 0, startX: 0, startY: 0, isDragging: false, lastKey: null, mode: null })
  const [cw, setCw] = useState(600)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setCw(Math.max(el.clientWidth, 280))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!onPaintTile && !onPaintBorder && !onPaintCorner) return
    const stop = () => {
      dragRef.current.pointerId = null
      dragRef.current.isDragging = false
      dragRef.current.lastKey = null
      dragRef.current.mode = null
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [onPaintTile, onPaintBorder, onPaintCorner])

  const cols = colsFor(state.largoM)
  const rows = rowsFor(state.anchoM)

  if (cols === 0 || rows === 0) {
    return (
      <div className="tile-stage empty" ref={containerRef}>
        <div className="tile-empty">
          <strong>Ingresá largo y ancho</strong>
          <span>para previsualizar el piso</span>
        </div>
      </div>
    )
  }

  const hasAnyBorder = anyBorde(state.borderEdges) || anyCorner(state.cornerColors)

  const maxHeight = size === 'xl' ? 760 : size === 'large' ? 600 : 440
  const pad = 14
  const maxTilePx = size === 'xl' ? 80 : size === 'large' ? 64 : 50
  const minTilePx = 14
  const usableW = cw - pad * 2
  const usableH = maxHeight - pad * 2
  // Aumentamos el ratio del borde (era 0.22 → 0.30) y reservamos siempre espacio
  // para los bordes/esquinas (aunque estén vacíos) para que la interfaz no
  // "salte" al agregar el primero.
  const borderRatio = 0.30
  const totalGridFactor = (n: number) => n + 2 * borderRatio
  const tile = Math.max(
    minTilePx,
    Math.min(usableW / totalGridFactor(cols), usableH / totalGridFactor(rows), maxTilePx),
  )
  const borderTh = tile * borderRatio
  const gridW = cols * tile
  const gridH = rows * tile
  const totalW = gridW + borderTh * 2 + pad * 2
  const totalH = gridH + borderTh * 2 + pad * 2
  const ox = pad + borderTh
  const oy = pad + borderTh

  const interactive = !!(onPaintTile || onPaintBorder || onPaintCorner)

  /** Mapea coords cliente al target SVG: tile, border o corner. Null si está afuera. */
  const coordsToTarget = (clientX: number, clientY: number): Target | null => {
    const svg = svgRef.current; if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    // Corners
    const inLeft = x >= ox - borderTh && x < ox
    const inRight = x >= ox + gridW && x < ox + gridW + borderTh
    const inTop = y >= oy - borderTh && y < oy
    const inBottom = y >= oy + gridH && y < oy + gridH + borderTh
    if (inLeft  && inTop)    return { type: 'corner', pos: 'tl' }
    if (inRight && inTop)    return { type: 'corner', pos: 'tr' }
    if (inLeft  && inBottom) return { type: 'corner', pos: 'bl' }
    if (inRight && inBottom) return { type: 'corner', pos: 'br' }
    // Borders
    if (inTop && x >= ox && x < ox + gridW) {
      return { type: 'border', side: 'top', idx: Math.floor((x - ox) / tile) }
    }
    if (inBottom && x >= ox && x < ox + gridW) {
      return { type: 'border', side: 'bottom', idx: Math.floor((x - ox) / tile) }
    }
    if (inLeft && y >= oy && y < oy + gridH) {
      return { type: 'border', side: 'left', idx: Math.floor((y - oy) / tile) }
    }
    if (inRight && y >= oy && y < oy + gridH) {
      return { type: 'border', side: 'right', idx: Math.floor((y - oy) / tile) }
    }
    // Tile (inside grid)
    if (x >= ox && x < ox + gridW && y >= oy && y < oy + gridH) {
      const c = Math.floor((x - ox) / tile)
      const r = Math.floor((y - oy) / tile)
      return { type: 'tile', r, c }
    }
    return null
  }

  const targetKey = (t: Target): string => {
    if (t.type === 'tile')   return `t-${t.r}-${t.c}`
    if (t.type === 'border') return `b-${t.side}-${t.idx}`
    return `c-${t.pos}`
  }

  const fireTarget = (t: Target, useOther: boolean) => {
    if (t.type === 'tile' && onPaintTile) onPaintTile(t.r, t.c, useOther)
    else if (t.type === 'border' && onPaintBorder) onPaintBorder(t.side, t.idx, useOther)
    else if (t.type === 'corner' && onPaintCorner) onPaintCorner(t.pos, useOther)
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return
    if (e.button !== 0 && e.button !== 2) return
    e.preventDefault()
    const t = coordsToTarget(e.clientX, e.clientY)
    if (!t) return
    dragRef.current = {
      pointerId: e.pointerId,
      button: e.button,
      startX: e.clientX, startY: e.clientY,
      isDragging: false,
      lastKey: targetKey(t),
      mode: t.type,
    }
    fireTarget(t, e.button === 2)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return
    const ref = dragRef.current
    if (ref.pointerId !== e.pointerId || ref.mode == null) return
    const t = coordsToTarget(e.clientX, e.clientY)
    if (!t) return
    // Solo continuamos pintando el MISMO tipo que el de pointerdown
    if (t.type !== ref.mode) return
    const k = targetKey(t)
    if (!ref.isDragging) {
      const dx = e.clientX - ref.startX
      const dy = e.clientY - ref.startY
      const moved = Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX
      const diff = k !== ref.lastKey
      if (!moved && !diff) return
      ref.isDragging = true
    }
    if (k !== ref.lastKey) {
      ref.lastKey = k
      fireTarget(t, ref.button === 2)
    }
  }

  // ===== Render =====

  // Baldosas
  const tiles: ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileColor = state.tiles[r]?.[c] ?? state.colorPrimary
      const fill = colorByKey(tileColor).fallbackHex
      tiles.push(
        <rect
          key={`t-${r}-${c}`}
          x={ox + c * tile} y={oy + r * tile}
          width={tile} height={tile}
          fill={fill}
          stroke="rgba(0,0,0,0.22)"
          strokeWidth={0.6}
          pointerEvents={interactive ? 'none' : undefined}
        >
          {interactive && <title>{`Fila ${r + 1} · Col ${c + 1} · ${colorByKey(tileColor).label}`}</title>}
        </rect>,
      )
    }
  }

  // Bordes + ghost arrows
  const borders: ReactNode[] = []
  const arrowFill = 'rgba(255,255,255,0.18)'
  const renderBorderRect = (key: string, x: number, y: number, w: number, h: number, color: ColorKey | null) => {
    if (color) {
      borders.push(<rect key={key} x={x} y={y} width={w} height={h}
        fill={colorByKey(color).fallbackHex} stroke="rgba(0,0,0,0.25)" strokeWidth={0.5}
        pointerEvents="none" />)
    } else if (interactive) {
      // ghost arrow centrado
      borders.push(<g key={key} pointerEvents="none">
        <rect x={x + w * 0.18} y={y + h * 0.18} width={w * 0.64} height={h * 0.64}
          rx={2} ry={2} fill={arrowFill} />
      </g>)
    }
  }

  // top + bottom
  for (let c = 0; c < cols; c++) {
    const xT = ox + c * tile
    renderBorderRect(`bt-${c}`, xT, oy - borderTh, tile, borderTh, state.borderEdges.top[c])
    renderBorderRect(`bb-${c}`, xT, oy + gridH,    tile, borderTh, state.borderEdges.bottom[c])
  }
  // left + right
  for (let r = 0; r < rows; r++) {
    const yT = oy + r * tile
    renderBorderRect(`bl-${r}`, ox - borderTh, yT, borderTh, tile, state.borderEdges.left[r])
    renderBorderRect(`br-${r}`, ox + gridW,    yT, borderTh, tile, state.borderEdges.right[r])
  }
  // corners
  const cornerRect = (key: string, x: number, y: number, color: ColorKey | null) => {
    if (color) {
      borders.push(<rect key={key} x={x} y={y} width={borderTh} height={borderTh}
        fill={colorByKey(color).fallbackHex} stroke="rgba(0,0,0,0.25)" strokeWidth={0.5}
        pointerEvents="none" />)
    } else if (interactive) {
      borders.push(<g key={key} pointerEvents="none">
        <rect x={x + borderTh * 0.25} y={y + borderTh * 0.25}
          width={borderTh * 0.5} height={borderTh * 0.5}
          rx={2} ry={2} fill={arrowFill} />
      </g>)
    }
  }
  cornerRect('ctl', ox - borderTh, oy - borderTh,           state.cornerColors.tl)
  cornerRect('ctr', ox + gridW,    oy - borderTh,           state.cornerColors.tr)
  cornerRect('cbl', ox - borderTh, oy + gridH,              state.cornerColors.bl)
  cornerRect('cbr', ox + gridW,    oy + gridH,              state.cornerColors.br)

  const bordeQty = countBordeEdges(state.borderEdges)
  const esqQty = countCornerColors(state.cornerColors)

  return (
    <div className="tile-stage" ref={containerRef}>
      <svg
        ref={svgRef}
        width={totalW} height={totalH}
        role="img" aria-label="Vista superior del piso"
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onContextMenu={interactive ? (e) => e.preventDefault() : undefined}
        style={interactive ? { touchAction: 'none', cursor: 'crosshair', userSelect: 'none' } : undefined}
      >
        <rect x={0} y={0} width={totalW} height={totalH} fill="transparent" />
        {tiles}
        {borders}
      </svg>
      <div className="tile-meta">
        <span><b>{cols}</b> × <b>{rows}</b> baldosas</span>
        <span className="sep">·</span>
        <span>cubre <b>{(cols * rows * TILE_M * TILE_M).toFixed(2)}</b> m²</span>
        {hasAnyBorder && (
          <>
            <span className="sep">·</span>
            <span><b>{bordeQty}</b> bordes + <b>{esqQty}</b> esquinas</span>
          </>
        )}
        {interactive && (
          <>
            <span className="sep">·</span>
            <span className="hint-paint">Izq = pintar · Der = quitar · arrastrá para trazo</span>
          </>
        )}
      </div>
    </div>
  )
}
