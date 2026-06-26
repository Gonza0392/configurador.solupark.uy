import type { AnyProductModule } from '../shell/types'
import { mueblesModule } from './muebles'
import { pisosModule } from './pisos'
import { lucesModule } from './luces'

/** Registry — agregar un producto nuevo es sumar una entrada acá. */
export const products: AnyProductModule[] = [
  mueblesModule,
  pisosModule,
  lucesModule,
]
