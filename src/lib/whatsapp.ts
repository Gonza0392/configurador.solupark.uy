export const WA_NUMBER = '59892877444'

export type LeadFields = {
  nombre?: string
  documento?: string
  ubicacion?: string
  correo?: string
  telefono?: string
}

/** Construye un link wa.me con el cuerpo del producto + datos del cliente.
 *  IMPORTANTE: productBody NUNCA debe incluir precios (modelo "Consulte por precio"). */
export function buildWhatsappUrl(productBody: string, lead: LeadFields): string {
  let text = productBody.trim() + '\n\n'
  const pairs: Array<[string, string | undefined]> = [
    ['Nombre', lead.nombre],
    ['Documento', lead.documento],
    ['Ubicación', lead.ubicacion],
    ['Correo', lead.correo],
    ['Teléfono', lead.telefono],
  ]
  const filled = pairs.filter(([, v]) => v && v.trim())
  if (filled.length) {
    text += 'Mis datos:\n' + filled.map(([k, v]) => `${k}: ${v!.trim()}`).join('\n')
  }
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}
