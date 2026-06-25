import type { BomLine, CalcResult, Metric, SpecRow } from '../../shell/types'
import { CONT_20, CONT_40, pctContainer } from '../../lib/container'
import { moneyUsd, mm } from '../../lib/format'
import { MODULOS, familyById } from './catalog'
import type { MueblesState } from './state'

const vol = (sku: string): number => {
  const m = MODULOS[sku]
  return m ? (m.eW * m.eD * m.eH) / 1e9 : 0
}

export function calcRecta(state: MueblesState): CalcResult {
  const fam = familyById(state.family)

  // ---- totales y conteos ----
  const totalW = state.items
    .map((sku) => MODULOS[sku]?.W ?? 0)
    .reduce((s, w) => s + w, 0)

  const baseW = state.items
    .map((sku) => MODULOS[sku])
    .filter((m): m is NonNullable<typeof m> => !!m && m.sub !== 'tower')
    .reduce((s, m) => s + m.W, 0)

  const counts: Record<string, number> = {}
  for (const sku of state.items) counts[sku] = (counts[sku] || 0) + 1

  // overlays auto: una unidad cada Ceil(baseW / ancho-overlay)
  for (const slot of fam.overlays) {
    if (!state.overlays[slot.key] || baseW <= 0) continue
    const ov = MODULOS[slot.sku]
    if (!ov) continue
    counts[slot.sku] = (counts[slot.sku] || 0) + Math.ceil(baseW / ov.W)
  }

  // ---- agregados (peso, CBM, precio) ----
  let nw = 0, gw = 0, cbm = 0, price = 0
  for (const sku of Object.keys(counts)) {
    const m = MODULOS[sku]; if (!m) continue
    const q = counts[sku]
    nw += m.nw * q
    gw += m.gw * q
    cbm += vol(sku) * q
    price += (state.prices[sku] || 0) * q
  }

  const fits = totalW <= state.availMm
  const isEmpty = state.items.length === 0
  const isValid = !isEmpty

  // ---- BOM ordenado (columnas según la paleta, luego overlays) ----
  const order = [...fam.columns, ...fam.overlays.map((o) => o.sku)]
  const rank = (sku: string) => {
    const i = order.indexOf(sku)
    return i === -1 ? 999 : i
  }
  const orderedSkus = Object.keys(counts).sort((a, b) => rank(a) - rank(b))

  const bom: BomLine[] = orderedSkus.map((sku) => {
    const m = MODULOS[sku]!
    return {
      sku,
      name: m.name,
      tag: m.klass === 'overlay' ? 'capa' : undefined,
      qty: counts[sku],
      nwKg: m.nw,
      priceUsd: state.prices[sku] || 0,
    }
  })

  // ---- métricas para el Readout ----
  const stateTone = isEmpty ? 'empty' : fits ? 'ok' : 'warn'
  const metrics: Metric[] = [
    { key: 'Ancho total', value: totalW.toLocaleString('es-UY'), sub: 'mm', tone: stateTone },
    { key: 'Estado',
      value: isEmpty ? 'Vacío' : fits ? 'Entra ✓' : `Excede +${totalW - state.availMm}`,
      tone: stateTone },
    { key: 'Peso neto', value: Math.round(nw).toString(), sub: 'kg' },
    { key: 'Volumen', value: cbm.toFixed(2), sub: 'CBM' },
    { key: "Contenedor 20'", value: Math.round(pctContainer(cbm, CONT_20) * 100).toString(), sub: '%' },
    { key: 'Precio total', value: moneyUsd(price), tone: price > 0 ? 'neutral' : 'empty' },
  ]

  // ---- ficha (Vista Final) ----
  const spec: SpecRow[] = [
    { k: 'Ancho total',          v: mm(totalW) },
    { k: 'Pared disponible',     v: mm(state.availMm) },
    { k: 'Estado',               v: isEmpty ? 'Sin módulos' : fits ? 'Entra' : `Excede ${totalW - state.availMm} mm` },
    { k: 'N° de módulos',        v: bom.reduce((s, b) => s + b.qty, 0).toString() },
    { k: 'Peso neto / bruto',    v: `${nw.toFixed(0)} / ${gw.toFixed(0)} kg` },
    { k: 'Volumen',              v: `${cbm.toFixed(2)} CBM` },
    { k: "Contenedor 20' / 40'", v: `${Math.round(pctContainer(cbm, CONT_20) * 100)}% / ${Math.round(pctContainer(cbm, CONT_40) * 100)}%` },
  ]

  // ---- cuerpo de WhatsApp (sin precios) ----
  const bomLines = bom.map((b) => `• ${b.sku} ${b.name} ×${b.qty}`).join('\n')
  const whatsappBody =
`Hola SoluPark! Quiero cotizar esta estación de trabajo (Golden Line ${state.family}):

Ancho: ${totalW} mm (pared ${state.availMm} mm)
Peso: ${nw.toFixed(0)} kg neto / ${gw.toFixed(0)} kg bruto
Volumen: ${cbm.toFixed(2)} CBM

Piezas:
${bomLines}`

  return {
    bom, metrics, spec,
    totalPriceUsd: price,
    totalNwKg: nw,
    totalGwKg: gw,
    totalCbm: cbm,
    whatsappBody,
    isValid,
    invalidReason: 'Agregá al menos un módulo.',
  }
}
