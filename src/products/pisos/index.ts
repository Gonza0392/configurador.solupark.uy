import type { ProductModule } from '../../shell/types'
import { PisosConfigurator } from './PisosConfigurator'
import { calcPisos } from './calc'
import { initialPisosState, type PisosState } from './state'

export const pisosModule: ProductModule<PisosState> = {
  id: 'pisos',
  name: 'Pisos rejilla encastrable',
  tagline: 'Armá tu piso de baldosa rejilla',
  subtitle:
    'Baldosa de polipropileno 40×40 cm, 4 Ton/m². Elegí medidas, bordes y color, y armá la cotización por WhatsApp.',
  steps: ['Ficha técnica', 'Personalizar', 'Resumen'],
  hideBomBeforeStep: 1,
  initialState: initialPisosState,
  icon: '▦',
  calc: (s) => calcPisos(s),
  setPrice: (s, sku, price) => ({ ...s, prices: { ...s.prices, [sku]: price } }),
  Configurator: PisosConfigurator,
}
