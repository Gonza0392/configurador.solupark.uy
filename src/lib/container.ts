// CBM útil cargable por contenedor, aprox. (consistente con los MVPs).
export const CONT_20 = 28
export const CONT_40 = 68

export const pctContainer = (cbmTotal: number, capacity: number): number =>
  capacity > 0 ? cbmTotal / capacity : 0
