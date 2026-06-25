import type { ProductModule } from '../../shell/types'
import { MueblesConfigurator } from './MueblesConfigurator'
import { calcRecta } from './calc'
import { initialMueblesState, type MueblesState } from './state'

export const mueblesModule: ProductModule<MueblesState> = {
  id: 'muebles',
  name: 'Muebles modulares · Golden Line',
  tagline: 'Armá tu estación de trabajo',
  subtitle:
    'Combiná bases y torres sobre tu pared. Sumá mesada, panel y luz. El sistema calcula medidas, peso, volumen y cuánto entra en un contenedor, y arma la cotización por WhatsApp.',
  steps: ['Diseñá tu estación'],
  initialState: initialMueblesState,
  icon: '⫼',
  calc: (s) => calcRecta(s),
  setPrice: (s, sku, price) => ({ ...s, prices: { ...s.prices, [sku]: price } }),
  Configurator: MueblesConfigurator,
}
