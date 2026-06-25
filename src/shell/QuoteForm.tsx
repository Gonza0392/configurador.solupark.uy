import { useState } from 'react'
import { buildWhatsappUrl, type LeadFields } from '../lib/whatsapp'
import './quoteform.css'

export function QuoteForm({ whatsappBody }: { whatsappBody: string }) {
  const [lead, setLead] = useState<LeadFields>({})
  const set = (k: keyof LeadFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLead((p) => ({ ...p, [k]: e.target.value }))
  const url = buildWhatsappUrl(whatsappBody, lead)

  return (
    <div className="form">
      <h4>Solicitar cotización</h4>
      <p className="hint">Completá tus datos y enviá el detalle por WhatsApp.</p>

      <label>
        <span>Nombre y apellido</span>
        <input autoComplete="name" value={lead.nombre ?? ''} onChange={set('nombre')} />
      </label>
      <label>
        <span>Documento</span>
        <input value={lead.documento ?? ''} onChange={set('documento')} />
      </label>
      <label>
        <span>Ubicación</span>
        <input value={lead.ubicacion ?? ''} onChange={set('ubicacion')} />
      </label>
      <label>
        <span>Correo</span>
        <input type="email" autoComplete="email" value={lead.correo ?? ''} onChange={set('correo')} />
      </label>
      <label>
        <span>Teléfono</span>
        <input inputMode="tel" autoComplete="tel" value={lead.telefono ?? ''} onChange={set('telefono')} />
      </label>

      <div className="wa-wrap">
        <a className="btn wa" href={url} target="_blank" rel="noopener noreferrer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.519 5.26l-.999 3.648 3.97-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
          </svg>
          <span>Enviar por WhatsApp</span>
        </a>
      </div>
      <p className="hint center">Se abre WhatsApp con el detalle ya escrito. Lo revisás y tocás enviar.</p>
    </div>
  )
}
