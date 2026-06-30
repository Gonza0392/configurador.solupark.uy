import type { FamilyId } from './catalog'

export type ComboPart = { sku: string; qty: number }

export type Combo = {
  code: string
  family: FamilyId | 'GLG9000'
  label: string
  type: string
  sideAMm: number
  sideBMm?: number
  totalGwKg?: number
  totalCbm?: number
  per20gp?: number
  per40hq?: number
  composition: ComboPart[]
  notes?: string
}

const parse = (s: string): ComboPart[] =>
  s.split(',').map((p) => p.trim()).filter(Boolean).map((tok) => {
    const m = tok.match(/^(.+?)x(\d+)$/i)
    return m ? { sku: m[1].trim(), qty: parseInt(m[2], 10) } : { sku: tok, qty: 1 }
  })

export const COMBOS: Combo[] = [
  // GLG6000 (recta)
  { code:'GLG6000A', family:'GLG6000', label:'Pared recta · 4915 mm', type:'Pared recta', sideAMm:4915, totalGwKg:530, totalCbm:4.7, per20gp:5,  per40hq:15,
    composition: parse('GLG6001x5, GLG6002x1, GLG6003x1, GLG6004x1, GLG6005x1, GLG6006x2, GLG6007x3, GLG6008x5, GLG6009x1, GLG6010x1, GLG6011x1, GLG6012x1, GLG6013x1') },
  { code:'GLG6000B', family:'GLG6000', label:'Pared recta · 4235 mm', type:'Pared recta', sideAMm:4235, totalGwKg:440, totalCbm:4.2, per20gp:7,  per40hq:18,
    composition: parse('GLG6001x4, GLG6002x1, GLG6003x1, GLG6004x1, GLG6005x1, GLG6006x2, GLG6007x2, GLG6008x4, GLG6009x2, GLG6011x1, GLG6013x1') },
  { code:'GLG6000C', family:'GLG6000', label:'Pared recta · 2955 mm', type:'Pared recta', sideAMm:2955, totalGwKg:310, totalCbm:2.9, per20gp:10, per40hq:26,
    composition: parse('GLG6001x3, GLG6003x1, GLG6005x1, GLG6006x1, GLG6007x2, GLG6008x3, GLG6010x1, GLG6011x1, GLG6013x1'),
    notes:'composición aprox., verificar' },
  { code:'GLG6000D', family:'GLG6000', label:'Pared recta · 2640 mm', type:'Pared recta', sideAMm:2640, totalGwKg:290, totalCbm:2.5, per20gp:12, per40hq:30,
    composition: parse('GLG6001x3, GLG6002x1, GLG6003x1, GLG6005x1, GLG6006x1, GLG6007x2, GLG6008x3, GLG6010x1, GLG6012x1') },
  { code:'GLG6000E', family:'GLG6000', label:'Pared recta · 2275 mm', type:'Pared recta', sideAMm:2275, totalGwKg:235, totalCbm:2.0, per20gp:12, per40hq:30,
    composition: parse('GLG6001x2, GLG6003x1, GLG6005x1, GLG6006x1, GLG6008x2, GLG6009x1, GLG6010x1, GLG6013x1'),
    notes:'composición aprox., verificar' },

  // GLG7000 (en L) — presets unificados con catálogo GLG6xxx + esquinero.
  // Las composiciones oficiales Goldenline usan SKUs GLG7xxx propios pero
  // SoluPark solo ofrece GLG6 + esquinero GLG7000D, así que las plantillas
  // se traducen: GLG7001→GLG6001, GLG7002→GLG6002, etc. El bloque del corner
  // (GLG7014/15/16/20 + 2× GLG6008) se aplica automático cuando corner está
  // activo. Los presets cargan los items de lados + activan el esquinero.
  //
  // Plantilla L: itemsA va al lado A, itemsB al lado B. Esquinero implícito.
  { code:'GLG7000A', family:'GLG7000', label:'L · 3450 + 2170 mm', type:'En L (A+B)',
    sideAMm:3450, sideBMm:2170, totalGwKg:480, totalCbm:4.5, per20gp:6, per40hq:15,
    // Lado A (810 corner + 3 bases 680 + torre 600 = ~3450): GLG6003 + GLG6005 + GLG6004 + GLG6002
    // Lado B (810 corner + 2 bases 680 = ~2170): GLG6011 + GLG6012
    composition: parse('GLG6003x1, GLG6005x1, GLG6004x1, GLG6002x1, GLG6011x1, GLG6012x1') },
  { code:'GLG7000B', family:'GLG7000', label:'L · 3085 + 2170 mm', type:'En L (A+B)',
    sideAMm:3085, sideBMm:2170, totalGwKg:450, totalCbm:4.4, per20gp:7, per40hq:15,
    // Lado A (810 + 680*2 + 915 = 3085): GLG6003 + GLG6005 + GLG6013
    // Lado B (810 + 680*2 = 2170): GLG6011 + GLG6004
    composition: parse('GLG6003x1, GLG6005x1, GLG6013x1, GLG6011x1, GLG6004x1') },
  { code:'GLG7000C', family:'GLG7000', label:'L · 1725 + 2170 mm', type:'En L (A+B)',
    sideAMm:1725, sideBMm:2170,
    // Lado A (810 + 915 = 1725): GLG6013
    // Lado B (810 + 680*2 = 2170): GLG6005 + GLG6011
    composition: parse('GLG6013x1, GLG6005x1, GLG6011x1') },
  { code:'GLG7000D', family:'GLG7000', label:'Esquinero suelto · 810×810 mm', type:'Solo esquinero',
    sideAMm:810, sideBMm:810, totalGwKg:90, totalCbm:1.2, per20gp:24, per40hq:52,
    // Solo el pack del esquinero — sin items en lados. Útil para extender
    // una pared GLG6000 recta existente.
    composition: [],
    notes:'conecta con serie GLG6000 — solo el esquinero, sin bases' },
]

export const combosForFamily = (familyId: FamilyId): Combo[] =>
  COMBOS.filter((c) => c.family === familyId)
