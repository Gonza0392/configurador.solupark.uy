import type { BomLine, CalcResult, Metric, SpecRow } from '../../shell/types'
import { moneyUsd } from '../../lib/format'
import {
  COLORS, PRICE_BALDOSA_USD, PRICE_BORDE_USD, PRICE_ESQUINA_USD,
  TILE_CM, colorByKey,
  skuBaldosaColor, skuBordeColor, skuEsquinaColor,
  type ColorKey,
} from './catalog'
import {
  anyBorde, anyCorner,
  bordesByColor, colsFor, countBordeEdges, countCornerColors,
  esquinasByColor, rowsFor,
  SIDES, SIDE_LABELS, CORNERS, CORNER_LABELS,
} from './state'
import type { PisosState } from './state'

const TILE_M = TILE_CM / 100

function tilesByColor(state: PisosState): Map<ColorKey, number> {
  const out = new Map<ColorKey, number>()
  for (const row of state.tiles) {
    for (const color of row) out.set(color, (out.get(color) ?? 0) + 1)
  }
  return out
}

export function calcPisos(state: PisosState): CalcResult {
  const cols = colsFor(state.largoM)
  const rows = rowsFor(state.anchoM)
  const totalTiles = cols * rows
  const areaCubiertaM2 = totalTiles * TILE_M * TILE_M
  const areaPedidaM2 = Math.max(0, state.largoM * state.anchoM)
  const isExact = Math.abs(areaCubiertaM2 - areaPedidaM2) < 0.001
  const extraM2 = areaCubiertaM2 - areaPedidaM2

  const baldosaCounts = tilesByColor(state)
  const bordeCounts = totalTiles > 0 ? bordesByColor(state.borderEdges) : new Map()
  const esquinaCounts = totalTiles > 0 ? esquinasByColor(state.cornerColors) : new Map()
  const bordes = totalTiles > 0 ? countBordeEdges(state.borderEdges) : 0
  const esquinas = totalTiles > 0 ? countCornerColors(state.cornerColors) : 0

  const priceBaldosa = (k: ColorKey) => state.prices[skuBaldosaColor(k)] ?? PRICE_BALDOSA_USD
  const priceBorde   = (k: ColorKey) => state.prices[skuBordeColor(k)]   ?? PRICE_BORDE_USD
  const priceEsquina = (k: ColorKey) => state.prices[skuEsquinaColor(k)] ?? PRICE_ESQUINA_USD

  // BOM: línea por color en orden del catálogo
  const bom: BomLine[] = []
  let totalUsd = 0

  for (const c of COLORS) {
    const qty = baldosaCounts.get(c.key)
    if (!qty) continue
    const p = priceBaldosa(c.key)
    bom.push({
      sku: skuBaldosaColor(c.key),
      name: `Baldosa rejilla 40×40 — ${c.label}`,
      tag: 'piso', qty, nwKg: 0, priceUsd: p,
    })
    totalUsd += qty * p
  }
  for (const c of COLORS) {
    const qty = bordeCounts.get(c.key)
    if (!qty) continue
    const p = priceBorde(c.key)
    bom.push({
      sku: skuBordeColor(c.key),
      name: `Borde 40 cm — ${c.label}`,
      tag: 'borde', qty, nwKg: 0, priceUsd: p,
    })
    totalUsd += qty * p
  }
  for (const c of COLORS) {
    const qty = esquinaCounts.get(c.key)
    if (!qty) continue
    const p = priceEsquina(c.key)
    bom.push({
      sku: skuEsquinaColor(c.key),
      name: `Esquina — ${c.label}`,
      tag: 'esquina', qty, nwKg: 0, priceUsd: p,
    })
    totalUsd += qty * p
  }

  const isValid = totalTiles > 0
  const distinctTileColors = baldosaCounts.size

  const metrics: Metric[] = [
    { key: 'Baldosas',     value: totalTiles.toString(),                  tone: totalTiles > 0 ? 'neutral' : 'empty' },
    { key: 'Área cubierta', value: areaCubiertaM2.toFixed(2), sub: 'm²',  tone: totalTiles > 0 ? 'ok' : 'empty' },
    { key: 'Cuadrícula',    value: `${cols} × ${rows}`,                   tone: totalTiles > 0 ? 'neutral' : 'empty' },
    { key: 'Colores',       value: distinctTileColors.toString(),         tone: distinctTileColors > 1 ? 'ok' : 'neutral' },
    { key: 'Bordes + esq.',
      value: anyBorde(state.borderEdges) || anyCorner(state.cornerColors)
        ? `${bordes} + ${esquinas}` : 'No',
      tone: bordes + esquinas > 0 ? 'neutral' : 'empty' },
    { key: 'Precio total',  value: moneyUsd(totalUsd),                    tone: totalUsd > 0 ? 'neutral' : 'empty' },
  ]

  // Spec
  const colorLines: SpecRow[] = []
  for (const c of COLORS) {
    const qty = baldosaCounts.get(c.key)
    if (!qty) continue
    colorLines.push({ k: `· ${c.label}`, v: `${qty} baldosas` })
  }

  // Desglose de bordes por lado (cuántos no-null por side)
  const bordesPerSide = SIDES.map((s) => ({
    side: s,
    count: state.borderEdges[s].filter(Boolean).length,
  })).filter((x) => x.count > 0)
  const cornersUsed = CORNERS.filter((p) => state.cornerColors[p] != null)

  const cortesNote = isExact
    ? `${areaCubiertaM2.toFixed(2)} m² (exacto)`
    : `${areaCubiertaM2.toFixed(2)} m² · cubre tu pedido de ${areaPedidaM2.toFixed(2)} m² + ${extraM2.toFixed(2)} m² extra para cortes y ajustes en obra`

  const bordeColorBreakdown: SpecRow[] = bordes > 0
    ? Array.from(bordeCounts.entries())
        .sort((a, b) => COLORS.findIndex((c) => c.key === a[0]) - COLORS.findIndex((c) => c.key === b[0]))
        .map(([color, qty]) => ({ k: `  · ${colorByKey(color).label}`, v: `${qty} bordes` }))
    : []
  const esquinaColorBreakdown: SpecRow[] = esquinas > 0
    ? Array.from(esquinaCounts.entries())
        .sort((a, b) => COLORS.findIndex((c) => c.key === a[0]) - COLORS.findIndex((c) => c.key === b[0]))
        .map(([color, qty]) => ({ k: `  · ${colorByKey(color).label}`, v: `${qty} esquinas` }))
    : []

  const spec: SpecRow[] = [
    { k: 'Producto',             v: 'Baldosa rejilla encastrable 40×40×1.8 cm · 4 Ton/m²' },
    { k: 'Largo × Ancho pedido', v: `${state.largoM.toFixed(2)} × ${state.anchoM.toFixed(2)} m` },
    { k: 'Cuadrícula',           v: `${cols} columnas × ${rows} filas = ${totalTiles} baldosas` },
    { k: 'Cobertura',            v: cortesNote },
    { k: 'Diseño',               v: distinctTileColors === 1
      ? `Uniforme — ${colorByKey(state.colorPrimary).label}`
      : `${distinctTileColors} colores combinados` },
    ...colorLines,
    bordes > 0
      ? { k: 'Bordes', v: `${bordes} unidades en ${bordesPerSide.map(b => `${SIDE_LABELS[b.side]} (${b.count})`).join(' + ')}` }
      : { k: 'Bordes', v: 'No incluye' },
    ...bordeColorBreakdown,
    esquinas > 0
      ? { k: 'Esquinas', v: `${esquinas} unidades en ${cornersUsed.map(p => CORNER_LABELS[p]).join(' + ')}` }
      : { k: 'Esquinas', v: 'No incluye' },
    ...esquinaColorBreakdown,
  ]

  // WhatsApp body
  const colorTxt = Array.from(baldosaCounts.entries())
    .sort((a, b) => COLORS.findIndex((c) => c.key === a[0]) - COLORS.findIndex((c) => c.key === b[0]))
    .map(([k, q]) => `• ${colorByKey(k).label}: ${q} baldosas`)
    .join('\n')

  const bordeWa = bordes > 0
    ? `Bordes (${bordes} unidades):\n` +
      Array.from(bordeCounts.entries())
        .sort((a, b) => COLORS.findIndex((c) => c.key === a[0]) - COLORS.findIndex((c) => c.key === b[0]))
        .map(([k, q]) => `  • ${colorByKey(k).label}: ${q}`).join('\n')
    : 'Sin bordes'
  const esquinaWa = esquinas > 0
    ? `Esquinas (${esquinas} unidades):\n` +
      Array.from(esquinaCounts.entries())
        .sort((a, b) => COLORS.findIndex((c) => c.key === a[0]) - COLORS.findIndex((c) => c.key === b[0]))
        .map(([k, q]) => `  • ${colorByKey(k).label}: ${q}`).join('\n')
    : 'Sin esquinas'

  const cortesWa = isExact ? ''
    : `\nTu pedido: ${areaPedidaM2.toFixed(2)} m² · cubrimos ${areaCubiertaM2.toFixed(2)} m² → sobran ${extraM2.toFixed(2)} m² para cortes y ajustes en obra.`

  const whatsappBody =
`Hola SoluPark! Quiero cotizar piso de baldosa rejilla encastrable:

Medidas pedidas: ${state.largoM.toFixed(2)} × ${state.anchoM.toFixed(2)} m
Cuadrícula: ${cols} × ${rows} = ${totalTiles} baldosas (cubre ${areaCubiertaM2.toFixed(2)} m²)${cortesWa}

Diseño (baldosas por color):
${colorTxt}

${bordeWa}

${esquinaWa}`

  return {
    bom, metrics, spec,
    totalPriceUsd: totalUsd,
    totalNwKg: 0, totalGwKg: 0, totalCbm: 0,
    whatsappBody, isValid,
    invalidReason: 'Ingresá largo y ancho mayores a 0.',
  }
}
