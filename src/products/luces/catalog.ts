/**
 * Catálogo de luces LED SoluPark.
 * Datos extraídos de https://www.solupark.uy/luces y de los spec sheets
 * incluidos en cada página de producto (junio 2026).
 *
 * Mental model:
 * - SoluPark vende **CAJAS pre-armadas**, no piezas sueltas.
 * - Cada caja trae componentes (tubos LED + splicers + cables) para armar
 *   una configuración estándar.
 * - El cliente compra cajas enteras; el instalador la adapta al garage.
 * - Cada caja cubre aprox. 2.43 × 4.84 m (~12 m²) en config estándar.
 */

export type BoxKey = 'hex' | 'rect'

export type Part = { name: string; qty: number }

export type LightBox = {
  key: BoxKey
  sku: string
  label: string
  /** Precio caja sin iva (USD). */
  priceUsd: number
  /** Specs eléctricas / técnicas. */
  power: string
  voltage: string
  colorTemp: string
  /** Footprint estándar al instalar centrado. */
  sizeM: { wM: number; hM: number }
  /** Descripción del armado estándar. */
  standardLayout: string
  /** Componentes que vienen en la caja. */
  parts: Part[]
}

export const BOXES: Record<BoxKey, LightBox> = {
  hex: {
    key: 'hex',
    sku: 'ATL0101',
    label: 'Caja LED Hexagonal',
    priceUsd: 350,
    power: '540 W',
    voltage: '220 V',
    colorTemp: 'Blanco 6500K',
    sizeM: { wM: 4.84, hM: 2.43 },
    standardLayout: 'Marco + 14 hexágonos pre-armables. Adaptable por el instalador.',
    parts: [
      { name: 'Tubo LED 1.175 m',          qty: 12 },
      { name: 'Tubo LED 0.44 m',           qty: 57 },
      { name: 'Splicer Y (uniones 120°)',  qty: 27 },
      { name: 'Splicer V',                 qty: 17 },
      { name: 'Splicer recto (extender)',  qty: 8  },
      { name: 'Splicer 90° (esquina)',     qty: 3  },
      { name: 'Splicer T',                 qty: 1  },
      { name: 'Cable de alimentación',     qty: 2  },
    ],
  },
  rect: {
    key: 'rect',
    sku: 'ATL0120',
    label: 'Caja LED Rectangular',
    priceUsd: 319.67,
    power: '750 W',
    voltage: '220 V',
    colorTemp: 'Blanco 6500K',
    sizeM: { wM: 4.64, hM: 2.43 },
    standardLayout: '3 rectángulos concéntricos (4.84×2.43 m exterior). Adaptable al área disponible.',
    parts: [
      { name: 'Tubo LED 1.175 m',          qty: 30 },
      { name: 'Tubo LED 0.565 m',          qty: 2  },
      { name: 'Splicer recto (extender)',  qty: 20 },
      { name: 'Splicer 90° (esquina)',     qty: 9  },
      { name: 'Splicer T',                 qty: 3  },
      { name: 'Cable de alimentación',     qty: 3  },
    ],
  },
}

export const BOX_KEYS: BoxKey[] = ['hex', 'rect']

/** Cobertura aproximada de UNA caja en su config estándar (m²). */
export const coverageM2 = (b: LightBox): number => b.sizeM.wM * b.sizeM.hM

/** Cantidad recomendada de cajas para cubrir un área. Mínimo 1 si el cliente
 *  decidió incluir ese modelo. */
export const recommendBoxesFor = (b: LightBox, garageM2: number): number => {
  if (garageM2 <= 0) return 0
  return Math.max(1, Math.ceil(garageM2 / coverageM2(b)))
}
