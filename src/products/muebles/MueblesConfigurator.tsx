import type { ConfiguratorProps } from '../../shell/types'
import { MODULOS, familyById, type OverlayKey } from './catalog'
import { combosForFamily } from './combos'
import { Palette } from './Palette'
import { ElevationSVG } from './render/ElevationSVG'
import type { MueblesState } from './state'
import './muebles.css'

export function MueblesConfigurator({ state, setState }: ConfiguratorProps<MueblesState>) {
  const fam = familyById(state.family)
  const combos = combosForFamily(state.family)

  const setAvail = (v: number) =>
    setState((s) => ({ ...s, availMm: Math.max(0, v) }))

  const addItem = (sku: string) =>
    setState((s) => ({ ...s, items: [...s.items, sku] }))

  const removeAt = (i: number) =>
    setState((s) => ({ ...s, items: s.items.filter((_, j) => j !== i) }))

  const move = (i: number, dir: -1 | 1) =>
    setState((s) => {
      const arr = [...s.items]
      const j = i + dir
      if (j < 0 || j >= arr.length) return s
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...s, items: arr }
    })

  const toggleOverlay = (key: OverlayKey) =>
    setState((s) => ({ ...s, overlays: { ...s.overlays, [key]: !s.overlays[key] } }))

  const applyCombo = (composition: Array<{ sku: string; qty: number }>) =>
    setState((s) => {
      const items: string[] = []
      for (const { sku, qty } of composition) {
        const m = MODULOS[sku]
        if (m?.klass === 'columna') {
          for (let i = 0; i < qty; i++) items.push(sku)
        }
      }
      // overlays presentes en el combo → encender la capa correspondiente
      const subsPresent = new Set(
        composition.map((c) => MODULOS[c.sku]?.sub).filter(Boolean) as string[],
      )
      const overlays = {
        ...s.overlays,
        top:   subsPresent.has('top')   || s.overlays.top,
        peg:   subsPresent.has('peg')   || s.overlays.peg,
        led:   subsPresent.has('led')   || s.overlays.led,
        upper: subsPresent.has('upper') || s.overlays.upper,
      }
      return { ...s, items, overlays }
    })

  return (
    <div className="muebles-grid">
      <Palette
        family={fam}
        overlays={state.overlays}
        onAdd={addItem}
        onToggleOverlay={toggleOverlay}
      />
      <section className="panel">
        <div className="ph mb-tools">
          <div className="field">
            <label htmlFor="avail">Pared</label>
            <input
              id="avail" type="number"
              value={state.availMm} min={600} max={12000} step={50}
              onChange={(e) => setAvail(parseInt(e.target.value) || 0)}
            />
            <span className="unit">mm</span>
          </div>
          {combos.length > 0 && (
            <div className="presets">
              <span className="presets-lbl">Plantillas:</span>
              {combos.map((c) => (
                <button
                  key={c.code} className="btn" type="button"
                  title={c.notes ? `${c.label} · ${c.notes}` : c.label}
                  onClick={() => applyCombo(c.composition)}
                >
                  {c.code}
                </button>
              ))}
            </div>
          )}
        </div>

        <ElevationSVG state={state} />

        <div className="run">
          {state.items.length === 0 ? (
            <span className="empty">Vacío — tocá una columna en la paleta para empezar.</span>
          ) : state.items.map((sku, i) => {
            const m = MODULOS[sku]
            return (
              <span key={i} className="chip">
                <span className="c">{sku}</span>
                <span>{m?.name ?? sku}</span>
                <button type="button" onClick={() => move(i, -1)} title="Mover a la izquierda" aria-label="Mover a la izquierda">‹</button>
                <button type="button" onClick={() => move(i, +1)} title="Mover a la derecha"   aria-label="Mover a la derecha">›</button>
                <button type="button" onClick={() => removeAt(i)} title="Quitar"               aria-label="Quitar">×</button>
              </span>
            )
          })}
        </div>
      </section>
    </div>
  )
}
