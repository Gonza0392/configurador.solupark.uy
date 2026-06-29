import type { FamilyId, OverlayKey } from './catalog'

export type Shape = 'recta' | 'L'
export type Side = 'A' | 'B'

/** Precios de venta SoluPark (USD sin IVA), tomados del Excel oficial
 *  `GLG6000A wholesale 1250.xlsx` (columna "PVP"). El precio queda editable
 *  per-SKU desde el BOM del shell. El IVA 22% se calcula y muestra aparte. */
export const DEFAULT_SALE_PRICES: Record<string, number> = {
  // GLG6000 (recta)
  GLG6001: 112,  // Módulo superior con LED
  GLG6002: 428,  // Torre alta angosta
  GLG6003: 255,  // Base con puertas
  GLG6004: 379,  // Base 4 cajones
  GLG6005: 397,  // Base 5 cajones
  GLG6006: 84,   // Panel perforado con enchufe
  GLG6007: 75,   // Panel perforado
  GLG6008: 25,   // Conectores entre módulos (pack 5)
  GLG6009: 84,   // Working top stainless 2-mod
  GLG6010: 115,  // Working top stainless 3-mod
  GLG6011: 307,  // Base con cubo de basura
  GLG6012: 373,  // Cajonera móvil
  GLG6013: 593,  // Torre alta
  // Set completo GLG6000A = USD 3.227 (sin IVA). Con IVA 22% = USD 3.937.

  // GLG7000 (en L) — mismos productos físicos que GLG6xxx (distinta familia),
  // mismos precios PVP. Si Goldenline emite un PVP distinto para la línea L,
  // se sobreescribe acá. Esquineros (7014/7015/7016/7020) y módulo superior
  // alto (7017) no tienen equivalente directo — quedan en 0 hasta cargar PVP.
  GLG7001: 112,  // Módulo superior LED (== GLG6001)
  GLG7002: 428,  // Torre alta angosta (== GLG6002)
  GLG7003: 255,  // Base con puertas (== GLG6003)
  GLG7005: 397,  // Base 6 cajones (≈ GLG6005)
  GLG7006: 75,   // Mesada (≈ GLG6007)
  GLG7007: 75,   // Mesada var (≈ GLG6007)
  GLG7008: 25,   // Barra LED / conectores (≈ GLG6008)
  GLG7009: 75,   // Panel perforado (≈ GLG6007)
  GLG7010: 84,   // Panel perforado ancho (≈ GLG6006)
  GLG7011: 307,  // Base cajones (≈ GLG6011)
  GLG7012: 373,  // Cajonera (≈ GLG6012)
  GLG7013: 593,  // Torre alta (== GLG6013)
  GLG7019: 307,  // Base ancha (≈ GLG6011 ancho)
}

/** IVA Uruguay (tasa básica): 22%. Aplicado sobre el precio sin IVA. */
export const VAT_RATE = 0.22

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
  overlays: { top: true, peg: true, upper: false },
  prices: { ...DEFAULT_SALE_PRICES },
}

/** Devuelve la familia recta activa (nunca GLG7000). */
export const rectaFamily = (s: MueblesState): 'GLG6000' | 'GLG8000' =>
  s.family === 'GLG7000' ? 'GLG6000' : (s.family as 'GLG6000' | 'GLG8000')
