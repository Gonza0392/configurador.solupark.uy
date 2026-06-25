/**
 * Catálogo Golden Line — generado a partir de files/Golden_Line_Modulos_GLG.xlsx (hoja "Modulos").
 * Curado a mano para clasificar correctamente clase (columna/overlay/esquina) y subtipo
 * de render (tower/drawer/door/peg/led/top/upper/corner/panel).
 *
 * Familias incluidas:
 *   - GLG6000 (pared recta, 13 módulos)
 *   - GLG7000 (en L, 20 módulos — incluye esquineros 7014/7015/7016/7020)
 *   - GLG8000 (recta con bases más anchas/profundas) — OCULTA en UI hasta validar
 *
 * GLG9000 (knock-down) NO está acá: el catálogo no tabula medidas por módulo, solo combos.
 *
 * Para regenerar este archivo cuando cambie el xlsx: `npm run import:catalog`
 */

export type SubType =
  | 'tower' | 'drawer' | 'door'
  | 'top' | 'peg' | 'led' | 'upper'
  | 'corner' | 'panel' | 'other'

export type Klass = 'columna' | 'overlay' | 'esquina'

export type FamilyId = 'GLG6000' | 'GLG7000' | 'GLG8000'

export type Modulo = {
  sku: string
  name: string
  family: FamilyId
  klass: Klass
  sub: SubType
  /** Medidas del producto (mm). */
  W: number; D: number; H: number
  /** Medidas del embalaje (mm). */
  eW: number; eD: number; eH: number
  /** Peso neto / bruto (kg). */
  nw: number; gw: number
  /** Rol original del catálogo. */
  role: string
}

export type OverlayKey = 'top' | 'peg' | 'led' | 'upper'

export type OverlaySlot = {
  key: OverlayKey
  label: string
  /** SKU por defecto que se usa al activar la capa. */
  sku: string
}

export type Family = {
  id: FamilyId
  label: string
  /** SKUs de columnas/bases/torres que se ofrecen en la paleta. */
  columns: string[]
  overlays: OverlaySlot[]
  /** Solo para GLG7000: piezas del esquinero. */
  corner?: {
    base: string         // GLG7016
    cover: string        // GLG7015
    upper: string        // GLG7014
    cornerTop: string    // GLG7020 — mesada de zona esquina
  }
  /** Si está oculta en la UI hasta validación. */
  hidden?: boolean
}

// ===== Tabla de módulos ===============================================================

export const MODULOS: Record<string, Modulo> = {
  // ---- GLG6000 (pared recta) ----
  'GLG6001': { sku:'GLG6001', name:'Módulo superior',       family:'GLG6000', klass:'overlay', sub:'upper', W:680,  D:281,  H:350,  eW:745,  eD:350, eH:430,  nw:10.5, gw:12.5, role:'Modulo superior' },
  'GLG6002': { sku:'GLG6002', name:'Torre alta angosta',    family:'GLG6000', klass:'columna', sub:'tower', W:600,  D:460,  H:2000, eW:665,  eD:540, eH:2020, nw:52,   gw:58,   role:'Torre alta angosta' },
  'GLG6003': { sku:'GLG6003', name:'Base con puertas',      family:'GLG6000', klass:'columna', sub:'door',  W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:27.5, gw:31,   role:'Base con puertas' },
  'GLG6004': { sku:'GLG6004', name:'Base 4 cajones',        family:'GLG6000', klass:'columna', sub:'drawer',W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:47.2, gw:51,   role:'Base con cajones' },
  'GLG6005': { sku:'GLG6005', name:'Base 6 cajones',        family:'GLG6000', klass:'columna', sub:'drawer',W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:48.5, gw:52,   role:'Base con cajones' },
  'GLG6006': { sku:'GLG6006', name:'Mesada',                family:'GLG6000', klass:'overlay', sub:'top',   W:1052, D:605,  H:28,   eW:1090, eD:635, eH:55,   nw:6.2,  gw:8.1,  role:'Mesada' },
  'GLG6007': { sku:'GLG6007', name:'Mesada (var.)',         family:'GLG6000', klass:'overlay', sub:'top',   W:1052, D:605,  H:28,   eW:1090, eD:635, eH:55,   nw:5.7,  gw:7.6,  role:'Mesada' },
  'GLG6008': { sku:'GLG6008', name:'Barra LED',             family:'GLG6000', klass:'overlay', sub:'led',   W:1420, D:50.5, H:30,   eW:1460, eD:90,  eH:50,   nw:3.4,  gw:3.8,  role:'Barra/riel (luz)' },
  'GLG6009': { sku:'GLG6009', name:'Panel perforado',       family:'GLG6000', klass:'overlay', sub:'peg',   W:1362, D:467,  H:36,   eW:1410, eD:495, eH:60,   nw:8.9,  gw:10,   role:'Panel perforado' },
  'GLG6010': { sku:'GLG6010', name:'Panel perforado ancho', family:'GLG6000', klass:'overlay', sub:'peg',   W:2043, D:467,  H:36,   eW:2090, eD:495, eH:60,   nw:13.2, gw:15,   role:'Panel perforado ancho' },
  'GLG6011': { sku:'GLG6011', name:'Base cajones',          family:'GLG6000', klass:'columna', sub:'drawer',W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:35.4, gw:39,   role:'Base con cajones' },
  'GLG6012': { sku:'GLG6012', name:'Cajonera',              family:'GLG6000', klass:'columna', sub:'drawer',W:658,  D:460,  H:895,  eW:725,  eD:525, eH:815,  nw:48,   gw:51.5, role:'Cajonera' },
  'GLG6013': { sku:'GLG6013', name:'Torre alta',            family:'GLG6000', klass:'columna', sub:'tower', W:915,  D:460,  H:2000, eW:980,  eD:535, eH:2020, nw:77.5, gw:85.5, role:'Torre alta' },

  // ---- GLG7000 (en L) ----
  'GLG7001': { sku:'GLG7001', name:'Módulo superior',       family:'GLG7000', klass:'overlay', sub:'upper', W:680,  D:281,  H:350,  eW:745,  eD:350, eH:430,  nw:10.5, gw:12.5, role:'Modulo superior' },
  'GLG7002': { sku:'GLG7002', name:'Torre alta angosta',    family:'GLG7000', klass:'columna', sub:'tower', W:600,  D:460,  H:2000, eW:665,  eD:540, eH:2020, nw:52,   gw:58,   role:'Torre alta angosta' },
  'GLG7003': { sku:'GLG7003', name:'Base con puertas',      family:'GLG7000', klass:'columna', sub:'door',  W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:27.5, gw:31,   role:'Base con puertas' },
  'GLG7005': { sku:'GLG7005', name:'Base 6 cajones',        family:'GLG7000', klass:'columna', sub:'drawer',W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:48.5, gw:52,   role:'Base con cajones' },
  'GLG7006': { sku:'GLG7006', name:'Mesada',                family:'GLG7000', klass:'overlay', sub:'top',   W:1052, D:605,  H:28,   eW:1090, eD:635, eH:55,   nw:6.2,  gw:8.1,  role:'Mesada' },
  'GLG7007': { sku:'GLG7007', name:'Mesada (var.)',         family:'GLG7000', klass:'overlay', sub:'top',   W:1052, D:605,  H:28,   eW:1090, eD:635, eH:55,   nw:5.7,  gw:7.6,  role:'Mesada' },
  'GLG7008': { sku:'GLG7008', name:'Barra LED',             family:'GLG7000', klass:'overlay', sub:'led',   W:1420, D:50.5, H:30,   eW:1460, eD:90,  eH:50,   nw:3.4,  gw:3.8,  role:'Barra/riel (luz)' },
  'GLG7008-1':{ sku:'GLG7008-1', name:'Barra LED (var.)',   family:'GLG7000', klass:'overlay', sub:'led',   W:1420, D:50.5, H:30,   eW:1460, eD:90,  eH:50,   nw:3.4,  gw:3.8,  role:'Barra/riel (luz) var.' },
  'GLG7009': { sku:'GLG7009', name:'Panel perforado',       family:'GLG7000', klass:'overlay', sub:'peg',   W:1362, D:467,  H:36,   eW:1410, eD:495, eH:60,   nw:8.9,  gw:10,   role:'Panel perforado' },
  'GLG7010': { sku:'GLG7010', name:'Panel perforado ancho', family:'GLG7000', klass:'overlay', sub:'peg',   W:2043, D:467,  H:36,   eW:2090, eD:495, eH:60,   nw:13.2, gw:15,   role:'Panel perforado ancho' },
  'GLG7011': { sku:'GLG7011', name:'Base cajones',          family:'GLG7000', klass:'columna', sub:'drawer',W:680,  D:460,  H:910,  eW:745,  eD:525, eH:945,  nw:35.4, gw:39,   role:'Base con cajones' },
  'GLG7012': { sku:'GLG7012', name:'Cajonera',              family:'GLG7000', klass:'columna', sub:'drawer',W:658,  D:460,  H:895,  eW:725,  eD:525, eH:815,  nw:48,   gw:51.5, role:'Cajonera' },
  'GLG7013': { sku:'GLG7013', name:'Torre alta',            family:'GLG7000', klass:'columna', sub:'tower', W:915,  D:460,  H:2000, eW:980,  eD:535, eH:2020, nw:77.5, gw:85.5, role:'Torre alta' },
  'GLG7014': { sku:'GLG7014', name:'Esquinero superior',    family:'GLG7000', klass:'esquina', sub:'corner',W:810,  D:810,  H:355,  eW:875,  eD:875, eH:430,  nw:14.55,gw:18.35,role:'Esquinero superior' },
  'GLG7015': { sku:'GLG7015', name:'Esquinero tapa',        family:'GLG7000', klass:'esquina', sub:'corner',W:810,  D:810,  H:40,   eW:835,  eD:835, eH:50,   nw:10,   gw:11.5, role:'Esquinero tapa/panel' },
  'GLG7016': { sku:'GLG7016', name:'Esquinero base',        family:'GLG7000', klass:'esquina', sub:'corner',W:810,  D:810,  H:870,  eW:875,  eD:875, eH:945,  nw:37,   gw:39,   role:'Esquinero base' },
  'GLG7017': { sku:'GLG7017', name:'Módulo superior alto',  family:'GLG7000', klass:'overlay', sub:'upper', W:915,  D:285,  H:1055, eW:980,  eD:350, eH:1130, nw:40,   gw:42,   role:'Modulo superior alto' },
  'GLG7018': { sku:'GLG7018', name:'Panel/tapa',            family:'GLG7000', klass:'overlay', sub:'panel', W:915,  D:470,  H:40,   eW:940,  eD:495, eH:50,   nw:8,    gw:9.5,  role:'Panel/tapa' },
  'GLG7019': { sku:'GLG7019', name:'Base ancha',            family:'GLG7000', klass:'columna', sub:'door',  W:915,  D:460,  H:870,  eW:980,  eD:525, eH:945,  nw:36,   gw:39,   role:'Base' },
  'GLG7020': { sku:'GLG7020', name:'Mesada de esquina',     family:'GLG7000', klass:'esquina', sub:'corner',W:1052, D:732,  H:60,   eW:1080, eD:732, eH:75,   nw:15.5, gw:16.5, role:'Mesada (zona esquina)' },

  // ---- GLG8000 (recta, bases anchas/profundas — OCULTA hasta validar) ----
  'GLG8001': { sku:'GLG8001', name:'Módulo superior',       family:'GLG8000', klass:'overlay', sub:'upper', W:900,  D:281,  H:350,  eW:960,  eD:345, eH:430,  nw:13.6, gw:15.6, role:'Modulo superior' },
  'GLG8002': { sku:'GLG8002', name:'Módulo superior ancho', family:'GLG8000', klass:'overlay', sub:'upper', W:1800, D:281,  H:693,  eW:1860, eD:340, eH:770,  nw:32.6, gw:36,   role:'Modulo superior ancho' },
  'GLG8003': { sku:'GLG8003', name:'Base',                  family:'GLG8000', klass:'columna', sub:'door',  W:900,  D:700,  H:965,  eW:960,  eD:760, eH:990,  nw:50.8, gw:55,   role:'Base' },
  'GLG8005': { sku:'GLG8005', name:'Base liviana',          family:'GLG8000', klass:'columna', sub:'door',  W:900,  D:675,  H:915,  eW:950,  eD:780, eH:255,  nw:18.8, gw:22,   role:'Base liviano' },
  'GLG8006': { sku:'GLG8006', name:'Mesada',                family:'GLG8000', klass:'overlay', sub:'top',   W:1052, D:825,  H:28,   eW:1085, eD:850, eH:55,   nw:7.8,  gw:9.8,  role:'Mesada' },
  'GLG8008': { sku:'GLG8008', name:'Barra LED',             family:'GLG8000', klass:'overlay', sub:'led',   W:1420, D:50.5, H:30,   eW:1460, eD:90,  eH:50,   nw:3.4,  gw:3.8,  role:'Barra/riel (luz)' },
  'GLG8010': { sku:'GLG8010', name:'Panel perforado',       family:'GLG8000', klass:'overlay', sub:'peg',   W:900,  D:700,  H:36,   eW:930,  eD:725, eH:55,   nw:8.2,  gw:10,   role:'Panel perforado' },
  'GLG8011': { sku:'GLG8011', name:'Base con cajones',      family:'GLG8000', klass:'columna', sub:'drawer',W:900,  D:675,  H:915,  eW:950,  eD:735, eH:945,  nw:47.4, gw:51,   role:'Base con cajones' },
  'GLG8012': { sku:'GLG8012', name:'Cajonera',              family:'GLG8000', klass:'columna', sub:'drawer',W:658,  D:460,  H:895,  eW:725,  eD:525, eH:815,  nw:48,   gw:51.5, role:'Cajonera' },
  'GLG8013': { sku:'GLG8013', name:'Torre alta',            family:'GLG8000', klass:'columna', sub:'tower', W:915,  D:460,  H:2000, eW:980,  eD:535, eH:2020, nw:63.2, gw:71.5, role:'Torre alta' },
}

// ===== Familias =======================================================================

export const FAMILIES: Family[] = [
  {
    id: 'GLG6000',
    label: 'GLG6000 · pared recta',
    columns: ['GLG6013', 'GLG6002', 'GLG6003', 'GLG6004', 'GLG6005', 'GLG6011', 'GLG6012'],
    overlays: [
      { key: 'top',   label: 'Mesada',             sku: 'GLG6006' },
      { key: 'peg',   label: 'Panel perforado',    sku: 'GLG6009' },
      { key: 'led',   label: 'Barra LED',          sku: 'GLG6008' },
      { key: 'upper', label: 'Módulos superiores', sku: 'GLG6001' },
    ],
  },
  {
    id: 'GLG7000',
    label: 'GLG7000 · en L',
    columns: ['GLG7013', 'GLG7002', 'GLG7019', 'GLG7003', 'GLG7005', 'GLG7011', 'GLG7012'],
    overlays: [
      { key: 'top',   label: 'Mesada',             sku: 'GLG7006' },
      { key: 'peg',   label: 'Panel perforado',    sku: 'GLG7009' },
      { key: 'led',   label: 'Barra LED',          sku: 'GLG7008' },
      { key: 'upper', label: 'Módulos superiores', sku: 'GLG7001' },
    ],
    corner: {
      base: 'GLG7016',
      cover: 'GLG7015',
      upper: 'GLG7014',
      cornerTop: 'GLG7020',
    },
  },
  {
    id: 'GLG8000',
    label: 'GLG8000 · pared recta (bases anchas)',
    columns: ['GLG8013', 'GLG8003', 'GLG8005', 'GLG8011', 'GLG8012'],
    overlays: [
      { key: 'top',   label: 'Mesada',             sku: 'GLG8006' },
      { key: 'peg',   label: 'Panel perforado',    sku: 'GLG8010' },
      { key: 'led',   label: 'Barra LED',          sku: 'GLG8008' },
      { key: 'upper', label: 'Módulos superiores', sku: 'GLG8001' },
    ],
    hidden: true,
  },
]

export const familyById = (id: FamilyId): Family =>
  FAMILIES.find((f) => f.id === id)!
