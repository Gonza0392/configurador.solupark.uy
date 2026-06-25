import type { BomLine, CalcResult, Metric, SpecRow } from '../../shell/types'
import { CONT_20, CONT_40, pctContainer } from '../../lib/container'
import { moneyUsd, mm } from '../../lib/format'
import { MODULOS, familyById } from './catalog'
import { rectaFamily, type MueblesState } from './state'

const vol = (sku: string): number => {
  const m = MODULOS[sku]
  return m ? (m.eW * m.eD * m.eH) / 1e9 : 0
}

/** Dispatcher — el módulo expone esta función al shell. */
export function calcMuebles(state: MueblesState): CalcResult {
  return state.shape === 'L' ? calcL(state) : calcRecta(state)
}

// ===================== RECTA =====================

export function calcRecta(state: MueblesState): CalcResult {
  const famId = rectaFamily(state)
  const fam = familyById(famId)
  const { items, availMm } = state.recta[famId]

  const totalW = items.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const baseW = items
    .map((sku) => MODULOS[sku])
    .filter((m): m is NonNullable<typeof m> => !!m && m.sub !== 'tower')
    .reduce((s, m) => s + m.W, 0)

  const counts: Record<string, number> = {}
  for (const sku of items) counts[sku] = (counts[sku] || 0) + 1

  for (const slot of fam.overlays) {
    if (!state.overlays[slot.key] || baseW <= 0) continue
    const ov = MODULOS[slot.sku]; if (!ov) continue
    counts[slot.sku] = (counts[slot.sku] || 0) + Math.ceil(baseW / ov.W)
  }

  let nw = 0, gw = 0, cbm = 0, price = 0
  for (const sku of Object.keys(counts)) {
    const m = MODULOS[sku]; if (!m) continue
    const q = counts[sku]
    nw += m.nw * q
    gw += m.gw * q
    cbm += vol(sku) * q
    price += (state.prices[sku] || 0) * q
  }

  const fits = totalW <= availMm
  const isEmpty = items.length === 0
  const isValid = !isEmpty
  const stateTone: Metric['tone'] = isEmpty ? 'empty' : fits ? 'ok' : 'warn'

  const order = [...fam.columns, ...fam.overlays.map((o) => o.sku)]
  const rank = (sku: string) => (order.indexOf(sku) === -1 ? 999 : order.indexOf(sku))
  const bom: BomLine[] = Object.keys(counts).sort((a, b) => rank(a) - rank(b)).map((sku) => {
    const m = MODULOS[sku]!
    return {
      sku, name: m.name,
      tag: m.klass === 'overlay' ? 'capa' : undefined,
      qty: counts[sku], nwKg: m.nw,
      priceUsd: state.prices[sku] || 0,
    }
  })

  const metrics: Metric[] = [
    { key: 'Ancho total', value: totalW.toLocaleString('es-UY'), sub: 'mm', tone: stateTone },
    { key: 'Estado', value: isEmpty ? 'Vacío' : fits ? 'Entra ✓' : `Excede +${totalW - availMm}`, tone: stateTone },
    { key: 'Peso neto', value: Math.round(nw).toString(), sub: 'kg' },
    { key: 'Volumen', value: cbm.toFixed(2), sub: 'CBM' },
    { key: "Contenedor 20'", value: Math.round(pctContainer(cbm, CONT_20) * 100).toString(), sub: '%' },
    { key: 'Precio total', value: moneyUsd(price), tone: price > 0 ? 'neutral' : 'empty' },
  ]

  const spec: SpecRow[] = [
    { k: 'Forma',                v: 'Pared recta' },
    { k: 'Familia',              v: famId },
    { k: 'Ancho total',          v: mm(totalW) },
    { k: 'Pared disponible',     v: mm(availMm) },
    { k: 'Estado',               v: isEmpty ? 'Sin módulos' : fits ? 'Entra' : `Excede ${totalW - availMm} mm` },
    { k: 'N° de módulos',        v: bom.reduce((s, b) => s + b.qty, 0).toString() },
    { k: 'Peso neto / bruto',    v: `${nw.toFixed(0)} / ${gw.toFixed(0)} kg` },
    { k: 'Volumen',              v: `${cbm.toFixed(2)} CBM` },
    { k: "Contenedor 20' / 40'", v: `${Math.round(pctContainer(cbm, CONT_20) * 100)}% / ${Math.round(pctContainer(cbm, CONT_40) * 100)}%` },
  ]

  const bomLines = bom.map((b) => `• ${b.sku} ${b.name} ×${b.qty}`).join('\n')
  const whatsappBody =
`Hola SoluPark! Quiero cotizar esta estación de trabajo (Golden Line ${famId}):

Ancho: ${totalW} mm (pared ${availMm} mm)
Peso: ${nw.toFixed(0)} kg neto / ${gw.toFixed(0)} kg bruto
Volumen: ${cbm.toFixed(2)} CBM

Piezas:
${bomLines}`

  return {
    bom, metrics, spec,
    totalPriceUsd: price, totalNwKg: nw, totalGwKg: gw, totalCbm: cbm,
    whatsappBody, isValid,
    invalidReason: 'Agregá al menos un módulo.',
  }
}

// ===================== L =====================

export function calcL(state: MueblesState): CalcResult {
  const fam = familyById('GLG7000')
  const L = state.L
  const cornerBaseSku  = fam.corner!.base       // GLG7016
  const cornerCoverSku = fam.corner!.cover      // GLG7015
  const cornerUpperSku = fam.corner!.upper      // GLG7014
  const cornerTopSku   = fam.corner!.cornerTop  // GLG7020
  const cornerW = L.corner ? MODULOS[cornerBaseSku].W : 0

  const sumW = (items: string[]) => items.reduce((s, sku) => s + (MODULOS[sku]?.W ?? 0), 0)
  const widthA = cornerW + sumW(L.itemsA)
  const widthB = cornerW + sumW(L.itemsB)

  const counts: Record<string, number> = {}
  const add = (sku: string, q = 1) => { counts[sku] = (counts[sku] || 0) + q }
  for (const sku of L.itemsA) add(sku)
  for (const sku of L.itemsB) add(sku)

  if (L.corner) {
    add(cornerBaseSku)
    add(cornerCoverSku)
    if (state.overlays.top) add(cornerTopSku)
    if (L.cornerUpper) add(cornerUpperSku)
  }

  const sideBaseW = (items: string[]) =>
    items
      .map((sku) => MODULOS[sku])
      .filter((m): m is NonNullable<typeof m> => !!m && m.sub !== 'tower')
      .reduce((s, m) => s + m.W, 0)

  for (const items of [L.itemsA, L.itemsB]) {
    const span = sideBaseW(items) + cornerW
    if (span <= 0) continue
    for (const slot of fam.overlays) {
      if (!state.overlays[slot.key]) continue
      const ov = MODULOS[slot.sku]; if (!ov) continue
      add(slot.sku, Math.ceil(span / ov.W))
    }
  }

  let nw = 0, gw = 0, cbm = 0, price = 0
  for (const sku of Object.keys(counts)) {
    const m = MODULOS[sku]; if (!m) continue
    const q = counts[sku]
    nw += m.nw * q
    gw += m.gw * q
    cbm += vol(sku) * q
    price += (state.prices[sku] || 0) * q
  }

  const fitA = widthA <= L.availMmA
  const fitB = widthB <= L.availMmB
  const hasAnything = L.itemsA.length > 0 || L.itemsB.length > 0 || L.corner
  const isValid = hasAnything

  const cornerOrder = [cornerBaseSku, cornerCoverSku, cornerUpperSku, cornerTopSku]
  const order = [...cornerOrder, ...fam.columns, ...fam.overlays.map((o) => o.sku)]
  const rank = (sku: string) => (order.indexOf(sku) === -1 ? 999 : order.indexOf(sku))
  const bom: BomLine[] = Object.keys(counts).sort((a, b) => rank(a) - rank(b)).map((sku) => {
    const m = MODULOS[sku]!
    const tag = m.klass === 'overlay' ? 'capa' : m.klass === 'esquina' ? 'esquina' : undefined
    return { sku, name: m.name, tag, qty: counts[sku], nwKg: m.nw, priceUsd: state.prices[sku] || 0 }
  })

  const aEmpty = L.itemsA.length === 0 && !L.corner
  const bEmpty = L.itemsB.length === 0 && !L.corner
  const toneA: Metric['tone'] = aEmpty ? 'empty' : fitA ? 'ok' : 'warn'
  const toneB: Metric['tone'] = bEmpty ? 'empty' : fitB ? 'ok' : 'warn'

  const metrics: Metric[] = [
    { key: 'Lado A', value: widthA.toLocaleString('es-UY'), sub: 'mm', tone: toneA },
    { key: 'Lado B', value: widthB.toLocaleString('es-UY'), sub: 'mm', tone: toneB },
    { key: 'Peso neto', value: Math.round(nw).toString(), sub: 'kg' },
    { key: 'Volumen', value: cbm.toFixed(2), sub: 'CBM' },
    { key: "Contenedor 20'", value: Math.round(pctContainer(cbm, CONT_20) * 100).toString(), sub: '%' },
    { key: 'Precio total', value: moneyUsd(price), tone: price > 0 ? 'neutral' : 'empty' },
  ]

  const spec: SpecRow[] = [
    { k: 'Forma',                   v: 'En L' },
    { k: 'Familia',                 v: 'GLG7000' },
    { k: 'Lado A',                  v: `${mm(widthA)}${fitA ? '' : ' (excede)'}` },
    { k: 'Lado B',                  v: `${mm(widthB)}${fitB ? '' : ' (excede)'}` },
    { k: 'Pared A / B disponibles', v: `${mm(L.availMmA)} / ${mm(L.availMmB)}` },
    { k: 'Esquinero',               v: L.corner ? (L.cornerUpper ? 'Sí (con mueble alto)' : 'Sí') : 'No' },
    { k: 'N° de módulos',           v: bom.reduce((s, b) => s + b.qty, 0).toString() },
    { k: 'Peso neto / bruto',       v: `${nw.toFixed(0)} / ${gw.toFixed(0)} kg` },
    { k: 'Volumen',                 v: `${cbm.toFixed(2)} CBM` },
    { k: "Contenedor 20' / 40'",    v: `${Math.round(pctContainer(cbm, CONT_20) * 100)}% / ${Math.round(pctContainer(cbm, CONT_40) * 100)}%` },
  ]

  const bomLines = bom.map((b) => `• ${b.sku} ${b.name} ×${b.qty}`).join('\n')
  const whatsappBody =
`Hola SoluPark! Quiero cotizar esta estación en L (Golden Line GLG7000):

Lado A: ${widthA} mm (pared ${L.availMmA} mm)
Lado B: ${widthB} mm (pared ${L.availMmB} mm)
Esquinero: ${L.corner ? (L.cornerUpper ? 'sí + mueble alto' : 'sí') : 'no'}
Peso: ${nw.toFixed(0)} kg neto / ${gw.toFixed(0)} kg bruto
Volumen: ${cbm.toFixed(2)} CBM

Piezas:
${bomLines}`

  return {
    bom, metrics, spec,
    totalPriceUsd: price, totalNwKg: nw, totalGwKg: gw, totalCbm: cbm,
    whatsappBody, isValid,
    invalidReason: 'Agregá módulos a algún lado o activá el esquinero.',
  }
}
