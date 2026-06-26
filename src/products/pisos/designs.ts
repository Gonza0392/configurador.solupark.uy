/**
 * Generadores de diseños preconfigurados para Pisos v3.
 *
 * Cada función toma (cols, rows, principal, acento, params?) y devuelve una
 * matriz ColorKey[][]. Convención: `principal` = Brocha 1 (recibe la baldosa
 * impar cuando la asimetría existe); `acento` = Brocha 2.
 *
 * Los params son específicos por diseño; Fase A usa defaults razonables.
 * Fase B expondrá controles para tweakearlos en la UI.
 */
import type { ColorKey } from './catalog'

export type DesignKind =
  | 'color-unico'
  | 'damero'
  | 'damero-xl'
  | 'marco'
  | 'marco-damero'
  | 'franja'
  | 'racing'
  | 'box'

export type DesignParams = Record<string, unknown>

export type ActiveDesign = { kind: DesignKind; params: DesignParams }

export type DesignDef = {
  kind: DesignKind
  label: string
  /** Generador con defaults aplicados; ignora `params` en Fase A. */
  apply: (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams) => ColorKey[][]
}

// ---------- Helpers ----------

function fill(cols: number, rows: number, color: ColorKey): ColorKey[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => color))
}

// ---------- 1. Color único ----------

const colorUnico = (cols: number, rows: number, p: ColorKey, _a: ColorKey) =>
  fill(cols, rows, p)

// ---------- 2. Damero clásico ----------

const damero = (cols: number, rows: number, p: ColorKey, a: ColorKey): ColorKey[][] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ((r + c) % 2 === 0 ? p : a)),
  )

// ---------- 3. Damero XL (2×2) ----------

const dameroXL = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const block = Number((params?.block as number) ?? 2)
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const br = Math.floor(r / block)
      const bc = Math.floor(c / block)
      return (br + bc) % 2 === 0 ? p : a
    }),
  )
}

// ---------- 4. Marco perimetral ----------

const marco = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const th = Math.max(1, Number((params?.thickness as number) ?? 1))
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const onEdge = r < th || r >= rows - th || c < th || c >= cols - th
      return onEdge ? a : p  // marco (acento) por fuera, interior principal
    }),
  )
}

// ---------- 5. Marco + damero interior ----------

const marcoDamero = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const th = Math.max(1, Number((params?.thickness as number) ?? 1))
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const onEdge = r < th || r >= rows - th || c < th || c >= cols - th
      if (onEdge) return a
      // Interior: damero usando p y a, empieza con p
      const ri = r - th
      const ci = c - th
      return (ri + ci) % 2 === 0 ? p : a
    }),
  )
}

// ---------- 6. Franja central ----------

const franja = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const orientation = (params?.orientation as 'h' | 'v') ?? 'h'
  const width = Math.max(1, Number((params?.width as number) ?? 2))
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if (orientation === 'h') {
        // franja horizontal centrada
        const start = Math.floor((rows - width) / 2)
        const end = start + width
        return r >= start && r < end ? a : p
      } else {
        // franja vertical centrada
        const start = Math.floor((cols - width) / 2)
        const end = start + width
        return c >= start && c < end ? a : p
      }
    }),
  )
}

// ---------- 7. Doble franja Racing ----------

const racing = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const orientation = (params?.orientation as 'h' | 'v') ?? 'h'
  const lineWidth = Math.max(1, Number((params?.lineWidth as number) ?? 1))
  const separation = Math.max(1, Number((params?.separation as number) ?? 1))
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      if (orientation === 'h') {
        // dos líneas horizontales separadas
        const totalBlock = lineWidth * 2 + separation
        const startMid = Math.floor((rows - totalBlock) / 2)
        const line1Start = startMid
        const line1End = line1Start + lineWidth
        const line2Start = line1End + separation
        const line2End = line2Start + lineWidth
        const inLine = (r >= line1Start && r < line1End) || (r >= line2Start && r < line2End)
        return inLine ? a : p
      } else {
        const totalBlock = lineWidth * 2 + separation
        const startMid = Math.floor((cols - totalBlock) / 2)
        const line1Start = startMid
        const line1End = line1Start + lineWidth
        const line2Start = line1End + separation
        const line2End = line2Start + lineWidth
        const inLine = (c >= line1Start && c < line1End) || (c >= line2Start && c < line2End)
        return inLine ? a : p
      }
    }),
  )
}

// ---------- 8. Box de estacionamiento ----------

const box = (cols: number, rows: number, p: ColorKey, a: ColorKey, params?: DesignParams): ColorKey[][] => {
  const margin = Math.max(0, Number((params?.margin as number) ?? 2))
  const thickness = Math.max(1, Number((params?.thickness as number) ?? 1))
  const closed = (params?.closed as boolean) ?? true
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const boxInner = {
        r1: margin, r2: rows - margin - 1,
        c1: margin, c2: cols - margin - 1,
      }
      if (r < boxInner.r1 || r > boxInner.r2 || c < boxInner.c1 || c > boxInner.c2) {
        // Fuera del box: color principal
        return p
      }
      // Dentro: ver si está sobre el borde del box (con `thickness`)
      const onTop    = r >= boxInner.r1 && r < boxInner.r1 + thickness
      const onBottom = r > boxInner.r2 - thickness && r <= boxInner.r2
      const onLeft   = c >= boxInner.c1 && c < boxInner.c1 + thickness
      const onRight  = c > boxInner.c2 - thickness && c <= boxInner.c2
      // Si `closed=false`, el lado de "abajo" (entrada del vehículo) NO se pinta
      const isBorder = closed ? (onTop || onBottom || onLeft || onRight)
                              : (onTop || onLeft || onRight)
      return isBorder ? a : p
    }),
  )
}

// ---------- Registry ----------

export const DESIGNS: DesignDef[] = [
  { kind: 'color-unico',  label: 'Color único',              apply: colorUnico },
  { kind: 'damero',       label: 'Damero clásico',           apply: damero },
  { kind: 'damero-xl',    label: 'Damero XL',                apply: dameroXL },
  { kind: 'marco',        label: 'Marco',                    apply: marco },
  { kind: 'marco-damero', label: 'Marco + damero',           apply: marcoDamero },
  { kind: 'franja',       label: 'Franja central',           apply: franja },
  { kind: 'racing',       label: 'Doble Racing',             apply: racing },
  { kind: 'box',          label: 'Box de estacionamiento',   apply: box },
]

export const designByKind = (k: DesignKind): DesignDef =>
  DESIGNS.find((d) => d.kind === k) ?? DESIGNS[0]
