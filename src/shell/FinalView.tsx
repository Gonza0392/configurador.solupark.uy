import { useEffect } from 'react'
import type { SpecRow } from './types'
import { QuoteForm } from './QuoteForm'
import './finalview.css'

type Props = {
  open: boolean
  onClose: () => void
  spec: SpecRow[]
  whatsappBody: string
}

export function FinalView({ open, onClose, spec, whatsappBody }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fv-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="sheet">
        <div className="sh-h">
          <h2 id="fv-title">Vista final · Cotización</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="sh-b">
          <div className="spec">
            <h4>Ficha</h4>
            {spec.map((r, i) => (
              <div key={i} className="row">
                <span className="k">{r.k}</span>
                <span className="v">{r.v}</span>
              </div>
            ))}
          </div>
          <QuoteForm whatsappBody={whatsappBody} />
        </div>
      </div>
    </div>
  )
}
