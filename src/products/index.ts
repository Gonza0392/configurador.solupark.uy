import type { AnyProductModule } from '../shell/types'
import { mueblesModule } from './muebles'
import { pisosPlaceholder } from './pisos'
import { lucesPlaceholder } from './luces'

/** Registry — agregar un producto nuevo es sumar una entrada acá. */
export const products: AnyProductModule[] = [
  mueblesModule,
  pisosPlaceholder,
  lucesPlaceholder,
]
