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

  // GLG7000 (en L)
  { code:'GLG7000A', family:'GLG7000', label:'L · 3450 + 2170 mm', type:'En L (A+B)', sideAMm:3450, sideBMm:2170, totalGwKg:480, totalCbm:4.5, per20gp:6, per40hq:15,
    composition: parse('GLG7001x5, GLG7002x1, GLG7003x1, GLG7005x2, GLG7006x1, GLG7007x4, GLG7008x7, GLG7009x1, GLG7010x1, GLG7011x1, GLG7012x1, GLG7014x1, GLG7015x1, GLG7016x1, GLG7020x1') },
  { code:'GLG7000B', family:'GLG7000', label:'L · 3085 + 2170 mm', type:'En L (A+B)', sideAMm:3085, sideBMm:2170, totalGwKg:450, totalCbm:4.4, per20gp:7, per40hq:15,
    composition: parse('GLG7001x4, GLG7003x1, GLG7007x3, GLG7008x6, GLG7009x3, GLG7011x1, GLG7013x1, GLG7014x1, GLG7015x1, GLG7016x1, GLG7020x1'),
    notes:'composición aprox., verificar' },
  { code:'GLG7000C', family:'GLG7000', label:'L · 1725 + 2170 mm', type:'En L (A+B)', sideAMm:1725, sideBMm:2170,
    composition: parse('GLG7001x2, GLG7005x1, GLG7006x1, GLG7007x1, GLG7008x4, GLG7008-1x1, GLG7009x1, GLG7011x1, GLG7014x1, GLG7015x1, GLG7016x1, GLG7017x1, GLG7018x1, GLG7019x1, GLG7020x1'),
    notes:'peso/CBM/sets no visibles en catálogo' },
  { code:'GLG7000D', family:'GLG7000', label:'Esquinero suelto · 485 + 470 mm', type:'Esquinero suelto', sideAMm:485, sideBMm:470, totalGwKg:90, totalCbm:1.2, per20gp:24, per40hq:52,
    composition: parse('GLG7008x2, GLG7014x1, GLG7015x1, GLG7016x1, GLG7020x1'),
    notes:'conecta con serie GLG6000' },
]

export const combosForFamily = (familyId: FamilyId): Combo[] =>
  COMBOS.filter((c) => c.family === familyId)
