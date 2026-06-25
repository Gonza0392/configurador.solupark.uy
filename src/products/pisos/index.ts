import type { ProductModule } from '../../shell/types'

type PisosState = { __placeholder: true }

/** Placeholder hasta el hito 3. Aparece en el selector como "Próximamente". */
export const pisosPlaceholder: ProductModule<PisosState> = {
  id: 'pisos',
  name: 'Pisos rejilla encastrable',
  tagline: 'Baldosa SoluPark 40×40 cm',
  comingSoon: true,
  steps: [],
  initialState: { __placeholder: true },
  icon: '▦',
  calc: () => ({
    bom: [], metrics: [], totalPriceUsd: 0, totalNwKg: 0, totalGwKg: 0, totalCbm: 0,
    spec: [], whatsappBody: '', isValid: false, invalidReason: 'En construcción',
  }),
  setPrice: (s) => s,
  Configurator: () => null,
}
