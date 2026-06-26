import type { FamilyId, OverlayKey } from './catalog'

export type Shape = 'recta' | 'L'
export type Side = 'A' | 'B'

/** Estado de una configuración recta — específico por familia (6000 / 8000). */
export type RectaState = {
  availMm: number
  items: string[]
}

/** Estado de la L — solo aplica a GLG7000. */
export type LState = {
  availMmA: number
  availMmB: number
  itemsA: string[]
  itemsB: string[]
  corner: boolean
  cornerUpper: boolean
}

/** Estado del módulo Muebles.
 *
 *  Cada forma tiene su propio sub-estado, así que cambiar de "recta" a "L" y
 *  volver no pierde nada. Compartidos: overlays (capas activas), prices,
 *  target (UI: lado activo en L), shape y family.
 *
 *  - shape='recta': los datos vivos están en `recta[family]` (GLG6000 o GLG8000).
 *  - shape='L':     los datos vivos están en `L` (siempre GLG7000).
 *
 *  El campo `family` indica qué recta está activa; cuando shape='L', `family`
 *  vale 'GLG7000' por convención pero no se usa para indexar `recta`. */
export type MueblesState = {
  shape: Shape
  family: FamilyId
  recta: { GLG6000: RectaState; GLG8000: RectaState }
  L: LState
  target: Side
  overlays: Record<OverlayKey, boolean>
  prices: Record<string, number>
}

export const initialMueblesState: MueblesState = {
  shape: 'recta',
  family: 'GLG6000',
  recta: {
    GLG6000: { availMm: 3500, items: [] },
    GLG8000: { availMm: 3500, items: [] },
  },
  L: {
    availMmA: 2800,
    availMmB: 2200,
    itemsA: [],
    itemsB: [],
    corner: true,
    cornerUpper: false,
  },
  target: 'A',
  overlays: { top: true, peg: true, led: false, upper: false },
  prices: {},
}

/** Devuelve la familia recta activa (nunca GLG7000). */
export const rectaFamily = (s: MueblesState): 'GLG6000' | 'GLG8000' =>
  s.family === 'GLG7000' ? 'GLG6000' : (s.family as 'GLG6000' | 'GLG8000')
