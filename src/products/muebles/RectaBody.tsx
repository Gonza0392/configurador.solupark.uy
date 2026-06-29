import type { Dispatch, SetStateAction } from 'react'
import { MODULOS, familyById, type OverlayKey } from './catalog'
import { combosForFamily } from './combos'
import { Palette } from './Palette'
import { ElevationSVG } from './render/ElevationSVG'
import { rectaFamily, type MueblesState, type RectaState } from './state'

type Props = {
  state: MueblesState
  setState: Dispatch<SetStateAction<MueblesState>>
}

export function RectaBody({ state, setState }: Props) {
  const famId = rectaFamily(state)
  const fam = familyById(famId)
  const current = state.recta[famId]
  const combos = combosForFamily(famId)

  const updateRecta = (patch: Partial<RectaState> | ((r: RectaState) => Partial<RectaState>)) =>
    setState((s) => {
      const key = rectaFamily(s)
      const p = typeof patch === 'function' ? patch(s.recta[key]) : patch
      return { ...s, recta: { ...s.recta, [key]: { ...s.recta[key], ...p } } }
    })

  const setAvail = (v: number) => updateRecta({ availMm: Math.max(0, v) })
  const addItem  = (sku: string) => updateRecta((r) => ({ items: [...r.items, sku] }))
  const removeAt = (i: number) => updateRecta((r) => ({ items: r.items.filter((_, j) => j !== i) }))
  const reorder = (from: number, to: number) =>
    updateRecta((r) => {
      if (from === to) return {}
      const arr = [...r.items]
      if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return {}
      const [it] = arr.splice(from, 1)
      arr.splice(to, 0, it)
      return { items: arr }
    })
  const toggleOverlay = (key: OverlayKey) =>
    setState((s) => ({ ...s, overlays: { ...s.overlays, [key]: !s.overlays[key] } }))

  const applyCombo = (composition: Array<{ sku: string; qty: number }>) => {
    const items: string[] = []
    for (const { sku, qty } of composition) {
      const m = MODULOS[sku]
      if (m?.klass === 'columna' && m.family === famId) {
        for (let i = 0; i < qty; i++) items.push(sku)
      }
    }
    const subs = new Set(composition.map((c) => MODULOS[c.sku]?.sub).filter(Boolean) as string[])
    updateRecta({ items })
    setState((s) => ({
      ...s,
      overlays: {
        ...s.overlays,
        top:   subs.has('top')   || s.overlays.top,
        peg:   subs.has('peg')   || s.overlays.peg,
        upper: subs.has('upper') || s.overlays.upper,
      },
    }))
  }

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
            <input id="avail" type="number" value={current.availMm} min={600} max={12000} step={50}
              onChange={(e) => setAvail(parseInt(e.target.value) || 0)} />
            <span className="unit">mm</span>
          </div>
          {combos.length > 0 && (
            <div className="presets">
              <span className="presets-lbl">Plantillas:</span>
              {combos.map((c) => (
                <button key={c.code} className="btn" type="button"
                  title={c.notes ? `${c.label} · ${c.notes}` : c.label}
                  onClick={() => applyCombo(c.composition)}>
                  {c.code}
                </button>
              ))}
            </div>
          )}
        </div>

        <ElevationSVG
          items={current.items}
          availMm={current.availMm}
          overlays={state.overlays}
          onReorder={reorder}
        />

        <div className="run">
          {current.items.length === 0 ? (
            <span className="empty">Vacío — tocá una columna en la paleta para empezar.</span>
          ) : current.items.map((sku, i) => {
            const m = MODULOS[sku]
            return (
              <span key={i} className="chip">
                <span className="c">{sku}</span>
                <span>{m?.name ?? sku}</span>
                <button type="button" onClick={() => removeAt(i)} title="Quitar" aria-label="Quitar">×</button>
              </span>
            )
          })}
        </div>
      </section>
    </div>
  )
}
