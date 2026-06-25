import type { FamilyId, OverlayKey } from './catalog'

/** Estado del módulo Muebles. Por ahora solo pared RECTA (familia GLG6000).
 *  Cuando se agregue la "L" (hito 2 parte B), sumar: shape, itemsB, availMmB, corner. */
export type MueblesState = {
  family: FamilyId
  /** Pared disponible en mm (para RECTA). */
  availMm: number
  /** Columnas/bases/torres en orden (izquierda → derecha). */
  items: string[]
  /** Capas activas (mesada/panel/LED/superiores). Se distribuyen solas sobre las bases. */
  overlays: Record<OverlayKey, boolean>
  /** Precio de venta US$ por SKU (editable desde el BOM). */
  prices: Record<string, number>
}

export const initialMueblesState: MueblesState = {
  family: 'GLG6000',
  availMm: 3500,
  items: [],
  overlays: { top: true, peg: true, led: false, upper: false },
  prices: {},
}
