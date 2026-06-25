import type { ProductModule } from '../../shell/types'

type LucesState = { __placeholder: true }

/** Placeholder hasta el hito 4. Aparece en el selector como "Próximamente". */
export const lucesPlaceholder: ProductModule<LucesState> = {
  id: 'luces',
  name: 'Luces LED hexagonales',
  tagline: 'Paneles modulares conectables',
  comingSoon: true,
  steps: [],
  initialState: { __placeholder: true },
  icon: '⬡',
  calc: () => ({
    bom: [], metrics: [], totalPriceUsd: 0, totalNwKg: 0, totalGwKg: 0, totalCbm: 0,
    spec: [], whatsappBody: '', isValid: false, invalidReason: 'En construcción',
  }),
  setPrice: (s) => s,
  Configurator: () => null,
}
