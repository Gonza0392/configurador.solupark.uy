import {
  COLORS, PRICE_BALDOSA_USD, PRICE_BORDE_USD, PRICE_ESQUINA_USD,
  TILE_CM, skuBaldosaColor, skuBordeColor, skuEsquinaColor,
  type ColorKey,
} from './catalog'
import type { ActiveDesign } from './designs'

const TILE_M = TILE_CM / 100

/** Bordes per-tile-edge: cada lado es un array donde cada entrada es el color
 *  del borde en esa baldosa del perímetro, o null si no hay borde ahí.
 *  - top, bottom: length = cols
 *  - left, right: length = rows */
export type BorderEdges = {
  top: (ColorKey | null)[]
  right: (ColorKey | null)[]
  bottom: (ColorKey | null)[]
  left: (ColorKey | null)[]
}

/** Las 4 esquinas. null = sin pieza. */
export type CornerColors = {
  tl: ColorKey | null
  tr: ColorKey | null
  br: ColorKey | null
  bl: ColorKey | null
}

export type BrushSlot = 'primary' | 'secondary'

/** Estado del módulo Pisos v3.2 (modelo Carparts).
 *  - `tiles`: matriz [row][col] con color de cada baldosa.
 *  - Brochas de tile: `colorPrimary` (PRINCIPAL) + `colorSecondary` (ACENTO).
 *  - Brocha de borde: `bordeBrush`. Click izq sobre un perímetro = agrega
 *    borde con este color. Click der = remueve.
 *  - Brocha de esquina: `esquinaBrush`. Igual lógica.
 *  - `activeDesign`: si hay diseño aplicado, se re-aplica al cambiar medidas. */
export type PisosState = {
  largoM: number
  anchoM: number
  colorPrimary: ColorKey
  colorSecondary: ColorKey
  activeBrush: BrushSlot
  tiles: ColorKey[][]
  activeDesign: ActiveDesign | null
  prevTiles: ColorKey[][] | null
  borderEdges: BorderEdges
  cornerColors: CornerColors
  bordeBrush: ColorKey
  esquinaBrush: ColorKey
  prices: Record<string, number>
}

// ===== Helpers de matriz =====

export const colsFor = (largoM: number): number => Math.max(0, Math.ceil(largoM / TILE_M))
export const rowsFor = (anchoM: number): number => Math.max(0, Math.ceil(anchoM / TILE_M))

export function makeTiles(cols: number, rows: number, color: ColorKey): ColorKey[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => color),
  )
}

export function resizeTiles(prev: ColorKey[][], cols: number, rows: number, fill: ColorKey): ColorKey[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => prev[r]?.[c] ?? fill),
  )
}

// ===== Helpers de bordes (per-tile-edge) =====

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type CornerPos = 'tl' | 'tr' | 'br' | 'bl'

export const SIDES: Side[] = ['top', 'right', 'bottom', 'left']
export const CORNERS: CornerPos[] = ['tl', 'tr', 'br', 'bl']

export const SIDE_LABELS: Record<Side, string> = {
  top: 'arriba', right: 'derecha', bottom: 'abajo', left: 'izquierda',
}
export const CORNER_LABELS: Record<CornerPos, string> = {
  tl: 'superior izq.', tr: 'superior der.', br: 'inferior der.', bl: 'inferior izq.',
}

/** Crea BorderEdges vacío (todos null) para una grilla dada. */
export function makeBorderEdges(cols: number, rows: number, fill: ColorKey | null = null): BorderEdges {
  return {
    top: Array.from({ length: cols }, () => fill),
    right: Array.from({ length: rows }, () => fill),
    bottom: Array.from({ length: cols }, () => fill),
    left: Array.from({ length: rows }, () => fill),
  }
}

/** Resize preservando entradas existentes; nuevas casillas quedan null. */
export function resizeBorderEdges(prev: BorderEdges, cols: number, rows: number): BorderEdges {
  const pad = (arr: (ColorKey | null)[], n: number): (ColorKey | null)[] =>
    Array.from({ length: n }, (_, i) => arr[i] ?? null)
  return {
    top: pad(prev.top, cols),
    bottom: pad(prev.bottom, cols),
    left: pad(prev.left, rows),
    right: pad(prev.right, rows),
  }
}

/** Llena el perímetro completo con un color. */
export function fillPerimeter(cols: number, rows: number, color: ColorKey): BorderEdges {
  return makeBorderEdges(cols, rows, color)
}

/** Llena solo un lado específico con un color (los demás quedan null). */
export function fillOnlySide(cols: number, rows: number, side: Side, color: ColorKey): BorderEdges {
  const empty = makeBorderEdges(cols, rows, null)
  if (side === 'top' || side === 'bottom') {
    empty[side] = Array.from({ length: cols }, () => color)
  } else {
    empty[side] = Array.from({ length: rows }, () => color)
  }
  return empty
}

/** Llena todas las esquinas con un color. */
export function fillAllCorners(color: ColorKey): CornerColors {
  return { tl: color, tr: color, br: color, bl: color }
}

export const emptyCorners = (): CornerColors => ({ tl: null, tr: null, br: null, bl: null })

// ===== Cuenta de bordes y esquinas =====

export function countBordeEdges(b: BorderEdges): number {
  return b.top.filter(Boolean).length
    + b.right.filter(Boolean).length
    + b.bottom.filter(Boolean).length
    + b.left.filter(Boolean).length
}

export function countCornerColors(c: CornerColors): number {
  return Object.values(c).filter(Boolean).length
}

export function bordesByColor(b: BorderEdges): Map<ColorKey, number> {
  const out = new Map<ColorKey, number>()
  for (const side of SIDES) {
    for (const color of b[side]) {
      if (!color) continue
      out.set(color, (out.get(color) ?? 0) + 1)
    }
  }
  return out
}

export function esquinasByColor(c: CornerColors): Map<ColorKey, number> {
  const out = new Map<ColorKey, number>()
  for (const pos of CORNERS) {
    const color = c[pos]
    if (!color) continue
    out.set(color, (out.get(color) ?? 0) + 1)
  }
  return out
}

export const anyBorde = (b: BorderEdges): boolean =>
  countBordeEdges(b) > 0
export const anyCorner = (c: CornerColors): boolean =>
  countCornerColors(c) > 0

// ===== Estado inicial =====

const DEFAULT_COLS = colsFor(4)
const DEFAULT_ROWS = rowsFor(3)

const DEFAULT_PRICES: Record<string, number> = {
  ...COLORS.reduce(
    (acc, c) => ({
      ...acc,
      [skuBaldosaColor(c.key)]: PRICE_BALDOSA_USD,
      [skuBordeColor(c.key)]:   PRICE_BORDE_USD,
      [skuEsquinaColor(c.key)]: PRICE_ESQUINA_USD,
    }),
    {} as Record<string, number>,
  ),
}

export const initialPisosState: PisosState = {
  largoM: 4,
  anchoM: 3,
  colorPrimary: 'gris',
  colorSecondary: 'negro',
  activeBrush: 'primary',
  tiles: makeTiles(DEFAULT_COLS, DEFAULT_ROWS, 'gris'),
  activeDesign: null,
  prevTiles: null,
  borderEdges: fillPerimeter(DEFAULT_COLS, DEFAULT_ROWS, 'negro'),
  cornerColors: fillAllCorners('negro'),
  bordeBrush: 'negro',
  esquinaBrush: 'negro',
  prices: DEFAULT_PRICES,
}
