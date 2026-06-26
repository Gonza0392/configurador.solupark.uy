import type { ComponentType, ReactNode } from 'react'

export type BomLine = {
  sku: string
  name: string
  /** etiqueta corta opcional ("capa", "esquina", etc.) — la pinta el BOM. */
  tag?: string
  qty: number
  /** Peso unitario neto (kg). El BOM muestra qty × nwKg. */
  nwKg: number
  /** Precio de venta unitario actual (US$). Editable desde el BOM del shell. */
  priceUsd: number
}

export type Metric = {
  key: string
  value: string
  /** Subscripto pequeño al lado del valor (ej. "mm", "kg"). */
  sub?: string
  tone?: 'ok' | 'warn' | 'empty' | 'neutral'
}

export type SpecRow = { k: string; v: string }

export type CalcResult = {
  bom: BomLine[]
  metrics: Metric[]
  totalPriceUsd: number
  totalNwKg: number
  totalGwKg: number
  totalCbm: number
  spec: SpecRow[]
  /** Cuerpo del mensaje de WhatsApp. NUNCA debe incluir precios.
   *  El shell le concatena los datos del cliente del QuoteForm. */
  whatsappBody: string
  isValid: boolean
  invalidReason?: string
}

export type ConfiguratorProps<T> = {
  state: T
  setState: (next: T | ((s: T) => T)) => void
  step: number
  setStep: (i: number) => void
  calc: CalcResult
  /** Abre la modal Vista Final del shell (= "Pedir cotización"). El shell
   *  valida calc.isValid antes de abrir y muestra el invalidReason si no. */
  openFinalView: () => void
}

export interface ProductModule<T = unknown> {
  id: string
  name: string
  /** Título grande del producto ("Armá tu estación de trabajo"). */
  tagline: string
  /** Bajada del hero. */
  subtitle?: ReactNode
  /** Si length ≤ 1, el shell oculta el stepper. */
  steps: string[]
  initialState: T
  calc(state: T): CalcResult
  /** Actualiza el precio de venta de un SKU dentro del estado del módulo. */
  setPrice(state: T, sku: string, price: number): T
  Configurator: ComponentType<ConfiguratorProps<T>>
  /** Glifo simple para la tarjeta del selector. */
  icon?: ReactNode
  /** Si true: aparece en el selector pero deshabilitado. */
  comingSoon?: boolean
  /** Si está definido, el shell oculta el BOM cuando step < hideBomBeforeStep.
   *  Útil para pasos puramente informativos (ej. ficha técnica). */
  hideBomBeforeStep?: number
}

/** Versión sin generics para almacenar en arrays/registries. */
export type AnyProductModule = ProductModule<any>
