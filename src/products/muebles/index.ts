import type { ProductModule } from '../../shell/types'
import { MueblesConfigurator } from './MueblesConfigurator'
import { calcMuebles } from './calc'
import { initialMueblesState, type MueblesState } from './state'

export const mueblesModule: ProductModule<MueblesState> = {
  id: 'muebles',
  name: 'Muebles modulares · Golden Line',
  tagline: 'Armá tu estación de trabajo',
  subtitle:
    'Pared recta o en L. Combiná bases y torres, sumá mesada, panel y luz. El sistema calcula medidas, peso, volumen y cuánto entra en un contenedor, y arma la cotización por WhatsApp.',
  steps: ['Diseñá tu estación'],
  initialState: initialMueblesState,
  icon: '⫼',
  calc: (s) => calcMuebles(s),
  setPrice: (s, sku, price) => ({ ...s, prices: { ...s.prices, [sku]: price } }),
  Configurator: MueblesConfigurator,
}
