import type { BomLine, CalcResult, Metric, SpecRow } from '../../shell/types'
import { CONT_20, CONT_40, pctContainer } from '../../lib/container'
import { moneyUsd, mm } from '../../lib/format'
import { MODULOS, familyById, effW } from './catalog'
import { DEFAULT_SALE_PRICES, VAT_RATE, rectaFamily, type MueblesState } from './state'

const vol = (sku: string): number => {
  const m = MODULOS[sku]
  return m ? (m.eW * m.eD * m.eH) / 1e9 : 0
}

const priceOf = (state: MueblesState, sku: string): number =>
  state.prices[sku] ?? DEFAULT_SALE_PRICES[sku] ?? 0

// ===== Helpers nuevos (capítulo Muebles GLG6000A real) ==============

/** Empaqueta N bases contiguas con working tops 2-mod (GLG6009) y 3-mod (GLG6010).
 *  Devuelve el conteo óptimo (prioriza tops de 3, menos juntas).
 *  Si N < 2, no se puede cubrir y devuelve `unsupported = N`. */
export function packWorkingTop(n: number): { tops2: number; tops3: number; unsupported: number } {
  if (n < 2) return { tops2: 0, tops3: 0, unsupported: n }
  const rem = n % 3
  if (rem === 0) return { tops2: 0, tops3: n / 3, unsupported: 0 }
  if (rem === 2) return { tops2: 1, tops3: (n - 2) / 3, unsupported: 0 }
  // rem === 1 (N = 4, 7, 10, ...): tomamos 4 = 2 × top-2, resto en top-3.
  return { tops2: 2, tops3: (n - 4) / 3, unsupported: 0 }
}

/** Detecta runs de bases contiguas que pueden compartir working top (sub != tower).
 *  Móviles GLG6012 SE INCLUYEN: por convención el wood top + working top los nivelan
 *  con las bases vecinas. Solo las torres cortan el run. */
export function fixedBaseRuns(items: string[]): Array<string[]> {
  const runs: Array<string[]> = []
  let current: string[] = []
  for (const sku of items) {
    const m = MODULOS[sku]
    if (!m) continue
    if (m.klass === 'columna' && m.sub !== 'tower') {
      current.push(sku)
    } else {
      if (current.length > 0) runs.push(current)
      current = []
    }
  }
  if (current.length > 0) runs.push(current)
  return runs
}

/** Conteo de conexiones físicas entre módulos: pares adyacentes donde ninguno
 *  es 'mobile' (GLG6012 móvil no se conecta a vecinos). */
export function countConnections(items: string[]): number {
  let n = 0
  for (let i = 0; i < items.length - 1; i++) {
    const a = MODULOS[items[i]], b = MODULOS[items[i + 1]]
    if (!a || !b) continue
    if (a.sub === 'mobile' || b.sub === 'mobile') continue
    n++
  }
  return n
}

/** Los connectors GLG6008 vienen en pack de 5. Devuelve packs necesarios. */
const CONNECTORS_PER_PACK = 5

// ===== Catalog SKUs (constantes) ====================================
const SKU_WORKING_TOP_2 = 'GLG6009'
const SKU_WORKING_TOP_3 = 'GLG6010'
const SKU_CONNECTORS    = 'GLG6008'
const SKU_PEG_DEFAULT   = 'GLG6007'   // Panel perforado sin enchufe (default)
const SKU_UPPER         = 'GLG6001'   // Módulo superior con LED integrado

// =====================================================================

/** Dispatcher — el módulo expone esta función al shell. */
export function calcMuebles(state: MueblesState): CalcResult {
  return state.shape === 'L' ? calcL(state) : calcRecta(state)
}

// ===================== RECTA =====================

export function calcRecta(state: MueblesState): CalcResult {
  const famId = rectaFamily(state)
  const fam = familyById(famId)
  const { items, availMm } = state.recta[famId]

  // Suma usando ancho EFECTIVO (móvil cuenta como 680mm en layout, no 658).
  const totalW = items.reduce((s, sku) => {
    const m = MODULOS[sku]
    return s + (m ? effW(m) : 0)
  }, 0)

  // baseW excluye solo torres. Móvil incluido — peg / upper / working top se distribuyen
  // también sobre él (visualmente apoyados sobre el wood top integrado del GLG6012).
  const baseW = items
    .map((sku) => MODULOS[sku])
    .filter((m): m is NonNullable<typeof m> =>
      !!m && m.klass === 'columna' && m.sub !== 'tower',
    )
    .reduce((s, m) => s + effW(m), 0)

  // Conteo de items propiamente dichos
  const counts: Record<string, number> = {}
  for (const sku of items) counts[sku] = (counts[sku] || 0) + 1

  // === Overlays ===
  // 1) Working top: pack 2-mod (GLG6009) + 3-mod (GLG6010) por RUN de bases fijas.
  const runs = fixedBaseRuns(items)
  let orphanRuns = 0
  if (state.overlays.top) {
    for (const run of runs) {
      const pack = packWorkingTop(run.length)
      if (pack.tops2 > 0) counts[SKU_WORKING_TOP_2] = (counts[SKU_WORKING_TOP_2] || 0) + pack.tops2
      if (pack.tops3 > 0) counts[SKU_WORKING_TOP_3] = (counts[SKU_WORKING_TOP_3] || 0) + pack.tops3
      if (pack.unsupported > 0) orphanRuns += pack.unsupported
    }
  }

  // 2-3) Paneles perforados + uppers: relación 1:1 con el ancho de un upper (680mm).
  //      Cada conjunto panel+2 barras espaciadoras mide 680mm — encaja en cada base.
  //      El "1052mm" del catálogo es el largo total de la pieza con sus flaps internos.
  const upperMod = MODULOS[SKU_UPPER]
  if (upperMod && (state.overlays.peg || state.overlays.upper)) {
    for (const run of runs) {
      const runW = run.reduce((s, sku) => { const mm = MODULOS[sku]; return s + (mm ? effW(mm) : 0) }, 0)
      if (runW <= 0) continue
      const n = Math.ceil(runW / upperMod.W)
      if (state.overlays.upper) counts[SKU_UPPER] = (counts[SKU_UPPER] || 0) + n
      if (state.overlays.peg)   counts[SKU_PEG_DEFAULT] = (counts[SKU_PEG_DEFAULT] || 0) + n
    }
  }

  // 4) Connectors GLG6008: relación 1:1 con cada panel perforado.
  //    Cada pack contiene las 2 barras espaciadoras + tornillería necesarias
  //    para instalar 1 panel (independiente de si va junto a otro panel o no).
  //    Validado contra set oficial GLG6000A (5 paneles → 5 packs).
  const totalPanels = (counts[SKU_PEG_DEFAULT] || 0) + (counts['GLG6006'] || 0)
  if (totalPanels > 0) {
    counts[SKU_CONNECTORS] = (counts[SKU_CONNECTORS] || 0) + totalPanels
  }

  // === Agregados ===
  let nw = 0, gw = 0, cbm = 0, price = 0
  for (const sku of Object.keys(counts)) {
    const m = MODULOS[sku]; if (!m) continue
    const q = counts[sku]
    nw += m.nw * q
    gw += m.gw * q
    cbm += vol(sku) * q
    price += priceOf(state, sku) * q
  }

  const fits = totalW <= availMm
  const isEmpty = items.length === 0
  const isValid = !isEmpty
  const stateTone: Metric['tone'] = isEmpty ? 'empty' : fits ? 'ok' : 'warn'

  // BOM ordenado: columnas → working tops → peg → upper → connectors → resto
  const order = [
    ...fam.columns,
    SKU_WORKING_TOP_2, SKU_WORKING_TOP_3,
    SKU_PEG_DEFAULT, 'GLG6006',  // peg con enchufe queda al lado
    SKU_UPPER,
    SKU_CONNECTORS,
  ]
  const rank = (sku: string) => {
    const i = order.indexOf(sku)
    return i === -1 ? 999 : i
  }
  const bom: BomLine[] = Object.keys(counts).sort((a, b) => rank(a) - rank(b)).map((sku) => {
    const m = MODULOS[sku]!
    const tag = m.klass === 'overlay'
      ? (m.sub === 'connector' ? 'connector'
        : m.sub === 'top' ? 'working top'
        : m.sub === 'peg' ? 'panel'
        : 'capa')
      : (m.sub === 'mobile' ? 'móvil' : undefined)
    return {
      sku, name: m.name, tag,
      qty: counts[sku], nwKg: m.nw,
      priceUsd: priceOf(state, sku),
    }
  })

  // IVA 22%: el `price` es sin IVA. Calculamos IVA y total con IVA.
  const priceVat = price * VAT_RATE
  const priceGross = price + priceVat

  const metrics: Metric[] = [
    { key: 'Ancho total', value: totalW.toLocaleString('es-UY'), sub: 'mm', tone: stateTone },
    { key: 'Estado', value: isEmpty ? 'Vacío' : fits ? 'Entra ✓' : `Excede +${totalW - availMm}`, tone: stateTone },
    { key: 'Peso neto', value: Math.round(nw).toString(), sub: 'kg' },
    { key: 'Volumen', value: cbm.toFixed(2), sub: 'CBM' },
    { key: "Contenedor 20'", value: Math.round(pctContainer(cbm, CONT_20) * 100).toString(), sub: '%' },
    { key: 'Subtotal (sin IVA)', value: moneyUsd(price), tone: price > 0 ? 'neutral' : 'empty' },
    { key: 'IVA 22%',     value: moneyUsd(priceVat),   tone: price > 0 ? 'neutral' : 'empty' },
    { key: 'Total c/ IVA', value: moneyUsd(priceGross), tone: price > 0 ? 'neutral' : 'empty' },
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
    { k: 'Subtotal (sin IVA)',   v: moneyUsd(price) },
    { k: 'IVA 22%',              v: moneyUsd(priceVat) },
    { k: 'Total c/ IVA',         v: moneyUsd(priceGross) },
  ]
  if (state.overlays.top && orphanRuns > 0) {
    spec.push({
      k: '⚠ Aviso',
      v: `${orphanRuns} base${orphanRuns === 1 ? '' : 's'} aislada${orphanRuns === 1 ? '' : 's'} (sin vecina contigua) no soporta${orphanRuns === 1 ? '' : 'n'} working top. Agregá otra base al lado o el cliente debe cortar a medida.`,
    })
  }

  const bomLines = bom.map((b) => `• ${b.sku} ${b.name} ×${b.qty}`).join('\n')
  const warnLine = state.overlays.top && orphanRuns > 0
    ? `\n\nAviso: ${orphanRuns} base${orphanRuns === 1 ? '' : 's'} sin working top (necesita vecino contiguo).`
    : ''

  const whatsappBody =
`Hola SoluPark! Quiero cotizar esta estación de trabajo (Golden Line ${famId}):

Ancho: ${totalW} mm (pared ${availMm} mm)
Peso: ${nw.toFixed(0)} kg neto / ${gw.toFixed(0)} kg bruto
Volumen: ${cbm.toFixed(2)} CBM

Piezas:
${bomLines}${warnLine}`

  return {
    bom, metrics, spec,
    totalPriceUsd: price, totalNwKg: nw, totalGwKg: gw, totalCbm: cbm,
    whatsappBody, isValid,
    invalidReason: 'Agregá al menos un módulo.',
  }
}

// ===================== L =====================
// NOTA: calcL todavía usa la lógica vieja (mesada única distribuida).
// Se va a actualizar en un hito posterior (alineado con la reescritura de
// catálogo GLG7000). Por ahora, mantiene la API y devuelve resultados
// consistentes con el nuevo `state.overlays` (sin 'led').

export function calcL(state: MueblesState): CalcResult {
  const fam = familyById('GLG7000')
  const L = state.L
  const cornerBaseSku  = fam.corner!.base
  const cornerCoverSku = fam.corner!.cover
  const cornerUpperSku = fam.corner!.upper
  const cornerTopSku   = fam.corner!.cornerTop
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
    price += priceOf(state, sku) * q
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
    return { sku, name: m.name, tag, qty: counts[sku], nwKg: m.nw, priceUsd: priceOf(state, sku) }
  })

  const aEmpty = L.itemsA.length === 0 && !L.corner
  const bEmpty = L.itemsB.length === 0 && !L.corner
  const toneA: Metric['tone'] = aEmpty ? 'empty' : fitA ? 'ok' : 'warn'
  const toneB: Metric['tone'] = bEmpty ? 'empty' : fitB ? 'ok' : 'warn'

  // IVA 22%: el `price` es sin IVA.
  const priceVat = price * VAT_RATE
  const priceGross = price + priceVat

  const metrics: Metric[] = [
    { key: 'Lado A', value: widthA.toLocaleString('es-UY'), sub: 'mm', tone: toneA },
    { key: 'Lado B', value: widthB.toLocaleString('es-UY'), sub: 'mm', tone: toneB },
    { key: 'Peso neto', value: Math.round(nw).toString(), sub: 'kg' },
    { key: 'Volumen', value: cbm.toFixed(2), sub: 'CBM' },
    { key: "Contenedor 20'", value: Math.round(pctContainer(cbm, CONT_20) * 100).toString(), sub: '%' },
    { key: 'Subtotal (sin IVA)', value: moneyUsd(price), tone: price > 0 ? 'neutral' : 'empty' },
    { key: 'IVA 22%',     value: moneyUsd(priceVat),   tone: price > 0 ? 'neutral' : 'empty' },
    { key: 'Total c/ IVA', value: moneyUsd(priceGross), tone: price > 0 ? 'neutral' : 'empty' },
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
    { k: 'Subtotal (sin IVA)',      v: moneyUsd(price) },
    { k: 'IVA 22%',                 v: moneyUsd(priceVat) },
    { k: 'Total c/ IVA',            v: moneyUsd(priceGross) },
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
