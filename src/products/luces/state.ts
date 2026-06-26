import { BOXES } from './catalog'

/** Estado del módulo Luces v2.
 *  - largoM/anchoM: dimensiones del garage donde se instalan las luces.
 *    Puede tomarse del módulo Pisos si está configurado (lectura via
 *    localStorage), o ingresar manualmente acá.
 *  - atl0101Boxes / atl0120Boxes: cajas del modelo hex / rect.
 *  - prices: override editable por SKU. */
export type LucesState = {
  largoM: number
  anchoM: number
  atl0101Boxes: number
  atl0120Boxes: number
  prices: Record<string, number>
}

export const initialLucesState: LucesState = {
  largoM: 4,
  anchoM: 3,
  atl0101Boxes: 0,
  atl0120Boxes: 1,
  prices: {
    [BOXES.hex.sku]:  BOXES.hex.priceUsd,
    [BOXES.rect.sku]: BOXES.rect.priceUsd,
  },
}

export const garageM2 = (s: LucesState): number =>
  Math.max(0, s.largoM * s.anchoM)
