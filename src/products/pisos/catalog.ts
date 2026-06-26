/**
 * Catálogo de pisos rejilla encastrable SoluPark.
 * Datos extraídos de https://www.solupark.uy/pisos (junio 2026).
 *
 * Producto: baldosa rejilla encastrable de polipropileno, 40×40×1.8 cm,
 * 4 Ton/m². Modular, encastrable, apta para tránsito vehicular.
 *
 * Los swatches de color son URLs de las thumbnails reales del e-commerce
 * (32px). Si swatchUrl está vacío (color recién incorporado todavía sin
 * imagen en el e-commerce), el picker muestra solo el color sólido.
 */

export type ColorKey =
  | 'negro'
  | 'gris'
  | 'blanco'
  | 'rojo'
  | 'rosado'
  | 'azul'
  | 'naranja'
  | 'amarillo'
  | 'verde-manzana'
  | 'verde-natural'
  | 'esmeralda'
  | 'violeta'

export type ColorSpec = {
  key: ColorKey
  label: string
  /** URL del thumb real en solupark.uy. Vacío = sin swatch aún. */
  swatchUrl: string
  /** Hex aprox para fallback / fills en SVG. */
  fallbackHex: string
}

export const COLORS: ColorSpec[] = [
  { key: 'negro',         label: 'Negro',         swatchUrl: 'https://www.solupark.uy/images/thumbs/0003748_32.jpeg', fallbackHex: '#1a1a1a' },
  { key: 'gris',          label: 'Gris',          swatchUrl: 'https://www.solupark.uy/images/thumbs/0003670_32.jpeg', fallbackHex: '#7a7a7a' },
  { key: 'blanco',        label: 'Blanco',        swatchUrl: 'https://www.solupark.uy/images/thumbs/0003742_32.jpeg', fallbackHex: '#ececec' },
  { key: 'rojo',          label: 'Rojo',          swatchUrl: 'https://www.solupark.uy/images/thumbs/0003672_32.jpeg', fallbackHex: '#b51e2e' },
  { key: 'rosado',        label: 'Rosado',        swatchUrl: '',                                                       fallbackHex: '#ec4899' },
  { key: 'azul',          label: 'Azul',          swatchUrl: 'https://www.solupark.uy/images/thumbs/0003673_32.jpeg', fallbackHex: '#1f4ea3' },
  { key: 'naranja',       label: 'Naranja',       swatchUrl: 'https://www.solupark.uy/images/thumbs/0003745_32.jpeg', fallbackHex: '#e8651a' },
  { key: 'amarillo',      label: 'Amarillo',      swatchUrl: 'https://www.solupark.uy/images/thumbs/0003671_32.jpeg', fallbackHex: '#e8c023' },
  { key: 'verde-manzana', label: 'Verde Manzana', swatchUrl: 'https://www.solupark.uy/images/thumbs/0003746_32.jpeg', fallbackHex: '#7cb342' },
  { key: 'verde-natural', label: 'Verde Natural', swatchUrl: 'https://www.solupark.uy/images/thumbs/0003747_32.jpeg', fallbackHex: '#2e6a32' },
  { key: 'esmeralda',     label: 'Esmeralda',     swatchUrl: 'https://www.solupark.uy/images/thumbs/0003744_32.jpeg', fallbackHex: '#00897b' },
  { key: 'violeta',       label: 'Violeta',       swatchUrl: 'https://www.solupark.uy/images/thumbs/0003743_32.jpeg', fallbackHex: '#6b3293' },
]

export const colorByKey = (k: ColorKey): ColorSpec =>
  COLORS.find((c) => c.key === k) ?? COLORS[0]

/** Lado de la baldosa en cm. */
export const TILE_CM = 40

/** Precios USD sin iva — extraídos de solupark.uy/pisos. */
export const PRICE_BALDOSA_USD = 4
export const PRICE_BORDE_USD = 1.2
export const PRICE_ESQUINA_USD = 1

/** SKU base. El SKU final por color es `${SKU_X}-${colorKey}`. */
export const SKU_BALDOSA = 'PISO-BALDOSA'
export const SKU_BORDE   = 'PISO-BORDE'
export const SKU_ESQUINA = 'PISO-ESQUINA'

export const skuBaldosaColor = (k: ColorKey): string => `${SKU_BALDOSA}-${k}`
export const skuBordeColor   = (k: ColorKey): string => `${SKU_BORDE}-${k}`
export const skuEsquinaColor = (k: ColorKey): string => `${SKU_ESQUINA}-${k}`
