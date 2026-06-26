import type { ProductModule } from '../../shell/types'
import { LucesConfigurator } from './LucesConfigurator'
import { calcLuces } from './calc'
import { initialLucesState, type LucesState } from './state'

export const lucesModule: ProductModule<LucesState> = {
  id: 'luces',
  name: 'Luces LED',
  tagline: 'Iluminá tu taller con paneles LED',
  subtitle:
    'Hexagonales modulares (conectables entre sí) o rectangulares standalone. Marca SoluPark.',
  steps: ['Ficha técnica', 'Personalizar', 'Resumen'],
  hideBomBeforeStep: 1,
  initialState: initialLucesState,
  icon: '⬡',
  calc: (s) => calcLuces(s),
  setPrice: (s, sku, price) => ({ ...s, prices: { ...s.prices, [sku]: price } }),
  Configurator: LucesConfigurator,
}
