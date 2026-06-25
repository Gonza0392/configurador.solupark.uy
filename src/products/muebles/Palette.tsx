import type { Family, OverlayKey } from './catalog'
import { MODULOS } from './catalog'
import { Glyph } from './render/glyphs'

type Props = {
  family: Family
  overlays: Record<OverlayKey, boolean>
  onAdd: (sku: string) => void
  onToggleOverlay: (key: OverlayKey) => void
}

export function Palette({ family, overlays, onAdd, onToggleOverlay }: Props) {
  return (
    <aside className="panel" aria-label="Módulos disponibles">
      <div className="ph"><h2>Columnas</h2></div>
      <div className="cat">
        <h3>Bases y torres</h3>
        <div className="mods">
          {family.columns.map((sku) => {
            const m = MODULOS[sku]
            if (!m) return null
            return (
              <button
                key={sku}
                type="button"
                className="mod"
                onClick={() => onAdd(sku)}
                aria-label={`Agregar ${m.name} ${sku}`}
              >
                <span className="g"><Glyph sub={m.sub} /></span>
                <span>
                  <span className="code">{sku}</span>
                  <span className="nm">{m.name}</span>
                  <span className="dim">{m.W}×{m.D}×{m.H}</span>
                </span>
                <span className="add" aria-hidden="true">+</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="cat">
        <h3>Capas (se distribuyen solas)</h3>
        {family.overlays.map((slot) => (
          <div key={slot.key} className="ov">
            <label>
              <span>{slot.label}</span>
              <small>{slot.sku} · auto</small>
            </label>
            <span className="sw">
              <input
                type="checkbox"
                checked={overlays[slot.key]}
                onChange={() => onToggleOverlay(slot.key)}
                aria-label={slot.label}
              />
              <span></span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}
