import type { ConfiguratorProps } from '../../shell/types'
import type { MueblesState, Shape } from './state'
import { RectaBody } from './RectaBody'
import { LBody } from './LBody'
import './muebles.css'

export function MueblesConfigurator({ state, setState }: ConfiguratorProps<MueblesState>) {
  /** Cambia la forma. Como cada forma vive en su propio sub-estado
   *  (state.recta[family] y state.L), el toggle no pierde nada. */
  const setShape = (shape: Shape) =>
    setState((s) => {
      if (s.shape === shape) return s
      return { ...s, shape, family: shape === 'L' ? 'GLG7000' : 'GLG6000' }
    })

  return (
    <>
      <div className="shape-switch" role="tablist" aria-label="Forma de la estación">
        {(['recta', 'L'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={state.shape === s}
            className={state.shape === s ? 'on' : ''}
            onClick={() => setShape(s)}
          >
            {s === 'recta' ? 'Pared recta' : 'En L'}
          </button>
        ))}
      </div>

      {state.shape === 'L'
        ? <LBody state={state} setState={setState} />
        : <RectaBody state={state} setState={setState} />}
    </>
  )
}
