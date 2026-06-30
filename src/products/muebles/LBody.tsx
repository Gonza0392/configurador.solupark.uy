import { useState, type Dispatch, type SetStateAction } from 'react'
import { MODULOS, familyById, type OverlayKey } from './catalog'
import { combosForFamily } from './combos'
import { Glyph } from './render/glyphs'
import { ElevationSVG } from './render/ElevationSVG'
import { PlanSVG } from './render/PlanSVG'
import type { LState, MueblesState, Side } from './state'

type Props = {
  state: MueblesState
  setState: Dispatch<SetStateAction<MueblesState>>
}

export function LBody({ state, setState }: Props) {
  const fam = familyById('GLG7000')
  const combos = combosForFamily('GLG7000')
  const L = state.L
  const [elevTab, setElevTab] = useState<Side>('A')

  const itemsKey = (s: Side): 'itemsA' | 'itemsB' => (s === 'A' ? 'itemsA' : 'itemsB')
  const availKey = (s: Side): 'availMmA' | 'availMmB' => (s === 'A' ? 'availMmA' : 'availMmB')

  const updateL = (patch: Partial<LState> | ((L: LState) => Partial<LState>)) =>
    setState((s) => {
      const p = typeof patch === 'function' ? patch(s.L) : patch
      return { ...s, L: { ...s.L, ...p } }
    })

  const setTarget = (t: Side) => setState((s) => ({ ...s, target: t }))
  const setAvailA = (v: number) => updateL({ availMmA: Math.max(0, v) })
  const setAvailB = (v: number) => updateL({ availMmB: Math.max(0, v) })

  const addItem = (sku: string) =>
    setState((s) => {
      const k = itemsKey(s.target)
      return { ...s, L: { ...s.L, [k]: [...s.L[k], sku] } }
    })

  const removeAt = (side: Side, i: number) =>
    updateL((L) => {
      const k = itemsKey(side)
      return { [k]: L[k].filter((_, j) => j !== i) } as Partial<LState>
    })

  const reorder = (side: Side) => (from: number, to: number) =>
    updateL((L) => {
      if (from === to) return {}
      const k = itemsKey(side)
      const arr = [...L[k]]
      if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return {}
      const [it] = arr.splice(from, 1)
      arr.splice(to, 0, it)
      return { [k]: arr } as Partial<LState>
    })

  const toggleOverlay = (key: OverlayKey) =>
    setState((s) => ({ ...s, overlays: { ...s.overlays, [key]: !s.overlays[key] } }))

  const toggleCorner = () => updateL((L) => ({ corner: !L.corner }))

  const applyCombo = (composition: Array<{ sku: string; qty: number }>) => {
    const items: string[] = []
    let cornerOn = L.corner
    for (const { sku, qty } of composition) {
      const m = MODULOS[sku]
      if (!m) continue
      if (m.klass === 'columna') {
        for (let i = 0; i < qty; i++) items.push(sku)
      } else if (m.klass === 'esquina') {
        cornerOn = true
      }
    }
    const subs = new Set(composition.map((c) => MODULOS[c.sku]?.sub).filter(Boolean) as string[])
    setState((s) => {
      const k = itemsKey(s.target)
      return {
        ...s,
        L: { ...s.L, [k]: items, corner: cornerOn },
        overlays: {
          ...s.overlays,
          top:   subs.has('top')   || s.overlays.top,
          peg:   subs.has('peg')   || s.overlays.peg,
          upper: subs.has('upper') || s.overlays.upper,
        },
      }
    })
  }

  const renderChips = (side: Side) => {
    const arr = L[itemsKey(side)]
    if (arr.length === 0) {
      return <span className="empty">Vacío — elegí "Lado {side}" arriba y agregá módulos.</span>
    }
    return arr.map((sku, i) => {
      const m = MODULOS[sku]
      return (
        <span key={i} className="chip">
          <span className="c">{sku}</span>
          <span>{m?.name ?? sku}</span>
          <button type="button" onClick={() => removeAt(side, i)} title="Quitar" aria-label="Quitar">×</button>
        </span>
      )
    })
  }

  return (
    <div className="muebles-grid">
      <aside className="panel" aria-label="Módulos">
        <div className="ph"><h2>Módulos</h2></div>

        <div className="cat lbody-target">
          <h3>Agregando al</h3>
          <div className="seg" role="tablist">
            {(['A', 'B'] as const).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={state.target === s}
                className={state.target === s ? 'on' : ''}
                onClick={() => setTarget(s)}>Lado {s}</button>
            ))}
          </div>
        </div>

        <div className="cat">
          <h3>Bases y torres</h3>
          <div className="mods">
            {fam.columns.map((sku) => {
              const m = MODULOS[sku]; if (!m) return null
              return (
                <button key={sku} type="button" className="mod"
                  onClick={() => addItem(sku)}
                  aria-label={`Agregar ${m.name} ${sku} al lado ${state.target}`}>
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
          <h3>Esquinero (el codo)</h3>
          <label className="ov">
            <div>
              <span>Incluir esquinero GLG7000D</span>
              <small>pack: {fam.corner!.base} + {fam.corner!.cover} + {fam.corner!.upper} + {fam.corner!.cornerTop} + 2× GLG6008</small>
            </div>
            <span className="sw">
              <input type="checkbox" checked={L.corner} onChange={toggleCorner} aria-label="Incluir esquinero GLG7000D" />
              <span></span>
            </span>
          </label>
        </div>

        <div className="cat">
          <h3>Capas (auto, ambos lados)</h3>
          {fam.overlays.map((slot) => (
            <label key={slot.key} className="ov">
              <div>
                <span>{slot.label}</span>
                <small>{slot.sku} · auto</small>
              </div>
              <span className="sw">
                <input type="checkbox" checked={state.overlays[slot.key]} onChange={() => toggleOverlay(slot.key)} aria-label={slot.label} />
                <span></span>
              </span>
            </label>
          ))}
        </div>

        <div className="cat lbody-walls">
          <h3>Paredes disponibles</h3>
          <div className="field">
            <label htmlFor="availA">Pared A</label>
            <input id="availA" type="number" value={L.availMmA} min={600} step={50}
              onChange={(e) => setAvailA(parseInt(e.target.value) || 0)} />
            <span className="unit">mm</span>
          </div>
          <div className="field">
            <label htmlFor="availB">Pared B</label>
            <input id="availB" type="number" value={L.availMmB} min={600} step={50}
              onChange={(e) => setAvailB(parseInt(e.target.value) || 0)} />
            <span className="unit">mm</span>
          </div>
        </div>
      </aside>

      <section className="panel">
        <div className="ph">
          <h2>Planta (vista superior)</h2>
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
        <PlanSVG state={state} />

        <div className="ph">
          <h2>Alzado</h2>
          <div className="seg" role="tablist" aria-label="Lado a mostrar">
            {(['A', 'B'] as const).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={elevTab === s}
                className={elevTab === s ? 'on' : ''}
                onClick={() => setElevTab(s)}>Lado {s}</button>
            ))}
          </div>
        </div>
        <ElevationSVG
          items={L[itemsKey(elevTab)]}
          availMm={L[availKey(elevTab)]}
          overlays={state.overlays}
          cornerSku={L.corner ? fam.corner!.base : undefined}
          cornerSpaceMm={L.corner ? undefined : 460}
          sideLabel={`Lado ${elevTab}`}
          maxScale={0.13}
          patternId={`pgL${elevTab}`}
          onReorder={reorder(elevTab)}
        />

        <div className="run-wrap">
          <h4>Lado A</h4>
          <div className="run">{renderChips('A')}</div>
        </div>
        <div className="run-wrap nobtop">
          <h4>Lado B</h4>
          <div className="run">{renderChips('B')}</div>
        </div>
      </section>
    </div>
  )
}
