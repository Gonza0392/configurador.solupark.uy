export const moneyUsd = (n: number): string =>
  'US$ ' + Math.round(n).toLocaleString('es-UY')

export const mm = (n: number): string =>
  n.toLocaleString('es-UY') + ' mm'

export const kg = (n: number): string =>
  Math.round(n).toString() + ' kg'

export const cbm = (n: number): string =>
  n.toFixed(2) + ' CBM'

export const pct = (n: number): string =>
  Math.round(n * 100).toString() + '%'
