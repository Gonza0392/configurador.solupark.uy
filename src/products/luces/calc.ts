import type { BomLine, CalcResult, Metric, SpecRow } from '../../shell/types'
import { moneyUsd } from '../../lib/format'
import { BOXES, BOX_KEYS, coverageM2, type BoxKey } from './catalog'
import { garageM2, type LucesState } from './state'

export function calcLuces(state: LucesState): CalcResult {
  const boxesByKey: Record<BoxKey, number> = {
    hex:  Math.max(0, Math.floor(state.atl0101Boxes)),
    rect: Math.max(0, Math.floor(state.atl0120Boxes)),
  }

  const totalBoxes = boxesByKey.hex + boxesByKey.rect
  const isValid = totalBoxes > 0

  const priceFor = (key: BoxKey): number =>
    state.prices[BOXES[key].sku] ?? BOXES[key].priceUsd

  let totalUsd = 0
  const bom: BomLine[] = []
  for (const key of BOX_KEYS) {
    const qty = boxesByKey[key]
    if (qty <= 0) continue
    const box = BOXES[key]
    const p = priceFor(key)
    const partsTxt = box.parts.map((pt) => `${pt.name} × ${pt.qty * qty}`).join(' · ')
    bom.push({
      sku: box.sku,
      name: `${box.label} (${box.sku}) · contenido: ${partsTxt}`,
      tag: 'led',
      qty, nwKg: 0, priceUsd: p,
    })
    totalUsd += qty * p
  }

  const gM2 = garageM2(state)
  const totalCoverageM2 = boxesByKey.hex * coverageM2(BOXES.hex) + boxesByKey.rect * coverageM2(BOXES.rect)
  const coveragePct = gM2 > 0 ? totalCoverageM2 / gM2 : 0

  const metrics: Metric[] = [
    { key: 'Galpón',     value: gM2 > 0 ? gM2.toFixed(2) : '—', sub: 'm²',         tone: gM2 > 0 ? 'neutral' : 'empty' },
    { key: 'Cajas hex',  value: boxesByKey.hex.toString(),                          tone: boxesByKey.hex > 0 ? 'ok' : 'empty' },
    { key: 'Cajas rect', value: boxesByKey.rect.toString(),                         tone: boxesByKey.rect > 0 ? 'ok' : 'empty' },
    { key: 'Cobertura',  value: totalCoverageM2.toFixed(1), sub: 'm²',              tone: totalCoverageM2 >= gM2 && gM2 > 0 ? 'ok' : (totalCoverageM2 > 0 ? 'warn' : 'empty') },
    { key: '% galpón',   value: gM2 > 0 ? `${Math.round(coveragePct * 100)}%` : '—', tone: coveragePct >= 1 ? 'ok' : 'warn' },
    { key: 'Precio total', value: moneyUsd(totalUsd),                               tone: totalUsd > 0 ? 'neutral' : 'empty' },
  ]

  const spec: SpecRow[] = [
    { k: 'Galpón',  v: `${state.largoM.toFixed(2)} × ${state.anchoM.toFixed(2)} m (${gM2.toFixed(2)} m²)` },
    { k: 'Cajas hexagonales',   v: boxesByKey.hex  > 0 ? `${boxesByKey.hex} × ${BOXES.hex.sku} (cubre ${(boxesByKey.hex * coverageM2(BOXES.hex)).toFixed(1)} m²)` : '—' },
    { k: 'Cajas rectangulares', v: boxesByKey.rect > 0 ? `${boxesByKey.rect} × ${BOXES.rect.sku} (cubre ${(boxesByKey.rect * coverageM2(BOXES.rect)).toFixed(1)} m²)` : '—' },
    { k: 'Cobertura total',  v: `${totalCoverageM2.toFixed(1)} m²${gM2 > 0 ? ` (${Math.round(coveragePct * 100)}% del galpón)` : ''}` },
  ]
  // Composición detallada de las cajas
  for (const key of BOX_KEYS) {
    const qty = boxesByKey[key]
    if (qty <= 0) continue
    const box = BOXES[key]
    spec.push({ k: `Composición · ${box.sku}`, v: `${qty} caja${qty === 1 ? '' : 's'} · ${box.power} · ${box.colorTemp}` })
    for (const part of box.parts) {
      spec.push({ k: `  · ${part.name}`, v: `${part.qty * qty} unidades` })
    }
  }

  const partesTxt = BOX_KEYS
    .filter((k) => boxesByKey[k] > 0)
    .map((k) => {
      const box = BOXES[k]
      const qty = boxesByKey[k]
      const partsList = box.parts.map((p) => `   ${p.name}: ${p.qty * qty}`).join('\n')
      return `${qty} × ${box.label} (${box.sku})\n${partsList}`
    })
    .join('\n\n')

  const whatsappBody =
`Hola SoluPark! Quiero cotizar iluminación LED:

Galpón: ${state.largoM.toFixed(2)} × ${state.anchoM.toFixed(2)} m (${gM2.toFixed(2)} m²)
Cobertura solicitada: ${totalCoverageM2.toFixed(1)} m²${gM2 > 0 ? ` (${Math.round(coveragePct * 100)}% del galpón)` : ''}

Cajas:
${partesTxt}`

  return {
    bom, metrics, spec,
    totalPriceUsd: totalUsd,
    totalNwKg: 0, totalGwKg: 0, totalCbm: 0,
    whatsappBody, isValid,
    invalidReason: 'Agregá al menos una caja de luces.',
  }
}
