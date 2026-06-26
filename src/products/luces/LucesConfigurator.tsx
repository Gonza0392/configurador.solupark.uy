import type { ConfiguratorProps } from '../../shell/types'
import { moneyUsd } from '../../lib/format'
import { loadState } from '../../lib/storage'
import { BOXES, BOX_KEYS, coverageM2, recommendBoxesFor, type BoxKey, type LightBox } from './catalog'
import { CoverageSVG } from './render/CoverageSVG'
import { garageM2, type LucesState } from './state'
import './luces.css'

/** Lee dimensiones del módulo Pisos si fueron configuradas. */
function readPisosDims(): { largoM: number; anchoM: number } | null {
  try {
    const ls = loadState('pisos', { largoM: 0, anchoM: 0 } as { largoM: number; anchoM: number })
    if (ls.largoM > 0 && ls.anchoM > 0) return { largoM: ls.largoM, anchoM: ls.anchoM }
    return null
  } catch {
    return null
  }
}

export function LucesConfigurator(props: ConfiguratorProps<LucesState>) {
  const { step, setStep } = props
  if (step === 0) return <FichaTecnica onNext={() => setStep(1)} />
  if (step === 1) return <Personalizar {...props} />
  return <Resumen {...props} />
}

// ---------------------------------------------------------------- Step 0

function FichaTecnica({ onNext }: { onNext: () => void }) {
  return (
    <section className="panel luces-ficha">
      <div className="ph"><h2>Ficha técnica · 2 modelos</h2></div>
      <div className="ficha-body-2">
        {BOX_KEYS.map((k) => {
          const box = BOXES[k]
          return (
            <div key={k} className="model-card">
              <div className="model-card-icon" aria-hidden="true">
                {k === 'hex' ? '⬡' : '▭'}
              </div>
              <h3>{box.label}</h3>
              <p className="model-card-sku">SKU: <strong>{box.sku}</strong> · {box.power} · {box.colorTemp}</p>
              <p className="model-card-layout">{box.standardLayout}</p>
              <p className="model-card-size">Tamaño armado: <strong>{box.sizeM.wM} × {box.sizeM.hM} m</strong> (≈ {coverageM2(box).toFixed(1)} m²)</p>
              <p className="model-card-price">USD <strong>{box.priceUsd}</strong> + iva · <em>caja completa</em></p>
              <details className="model-card-parts">
                <summary>Qué viene en la caja ({box.parts.reduce((s, p) => s + p.qty, 0)} piezas)</summary>
                <ul>
                  {box.parts.map((p) => (
                    <li key={p.name}><strong>{p.qty}×</strong> {p.name}</li>
                  ))}
                </ul>
              </details>
            </div>
          )
        })}
      </div>
      <div className="ficha-actions">
        <p className="ficha-foot">
          SoluPark vende la <strong>caja completa</strong>. La disposición final
          la define el instalador según el espacio y el gusto.
          Mirá <em>"garage LED hex"</em> en Pinterest para inspiración.
        </p>
        <button type="button" className="btn cta" onClick={onNext}>
          Configurar mis luces →
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Step 1

function Personalizar({ state, setState, setStep }: ConfiguratorProps<LucesState>) {
  const pisosDims = readPisosDims()
  const gM2 = garageM2(state)

  const setLargo = (v: number) =>
    setState((s) => ({ ...s, largoM: Math.max(0, v) }))
  const setAncho = (v: number) =>
    setState((s) => ({ ...s, anchoM: Math.max(0, v) }))

  const usePisosDims = () => {
    if (!pisosDims) return
    setState((s) => ({ ...s, largoM: pisosDims.largoM, anchoM: pisosDims.anchoM }))
  }

  const setBoxCount = (key: BoxKey) => (n: number) =>
    setState((s) => key === 'hex'
      ? { ...s, atl0101Boxes: Math.max(0, Math.floor(n)) }
      : { ...s, atl0120Boxes: Math.max(0, Math.floor(n)) },
    )

  const getBoxCount = (key: BoxKey): number =>
    key === 'hex' ? state.atl0101Boxes : state.atl0120Boxes

  const applyRecommendation = (key: BoxKey) => {
    const box = BOXES[key]
    const n = recommendBoxesFor(box, gM2)
    setBoxCount(key)(n)
  }

  return (
    <div className="luces-grid">
      {/* PREVIEW */}
      <section className="panel luces-canvas-panel">
        <div className="ph">
          <h2>Cobertura del galpón</h2>
        </div>
        <CoverageSVG state={state} size="large" />
      </section>

      {/* CONTROLES */}
      <section className="panel luces-controls">
        <div className="ph"><h2>Configuración</h2></div>

        {/* Dimensiones del galpón */}
        <div className="cat">
          <h3>Dimensiones del galpón</h3>
          {pisosDims && (
            <button type="button" className="btn use-pisos-btn" onClick={usePisosDims}
              title="Tomar las medidas configuradas en el módulo Pisos">
              📐 Usar medidas de pisos ({pisosDims.largoM} × {pisosDims.anchoM} m)
            </button>
          )}
          <div className="form-rows">
            <div className="form-row">
              <label htmlFor="luces-largo">Largo (m)</label>
              <input id="luces-largo" type="number" min={0} step={0.1}
                value={state.largoM}
                onChange={(e) => setLargo(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-row">
              <label htmlFor="luces-ancho">Ancho (m)</label>
              <input id="luces-ancho" type="number" min={0} step={0.1}
                value={state.anchoM}
                onChange={(e) => setAncho(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-row info-row">
              <span className="info-lbl">Área del galpón</span>
              <span className="info-val">{gM2.toFixed(2)} m²</span>
            </div>
          </div>
        </div>

        {/* Por modelo */}
        {BOX_KEYS.map((k) => {
          const box = BOXES[k]
          const qty = getBoxCount(k)
          const reco = recommendBoxesFor(box, gM2)
          const subtotal = qty * box.priceUsd
          return (
            <BoxConfigCard
              key={k}
              box={box}
              qty={qty}
              recommended={reco}
              subtotal={subtotal}
              onQty={setBoxCount(k)}
              onApplyReco={() => applyRecommendation(k)}
            />
          )
        })}

        <p className="model-card-layout" style={{ margin: '12px 16px', fontSize: 11.5 }}>
          La disposición física la define el instalador. Las cajas se compran
          completas; el armado se puede adaptar (centrado, en filas, etc.).
        </p>

        <div className="step-nav">
          <button type="button" className="btn ghost" onClick={() => setStep(0)}>← Atrás</button>
          <button type="button" className="btn cta" onClick={() => setStep(2)}>Ver resumen →</button>
        </div>
      </section>
    </div>
  )
}

function BoxConfigCard({
  box, qty, recommended, subtotal, onQty, onApplyReco,
}: {
  box: LightBox
  qty: number
  recommended: number
  subtotal: number
  onQty: (n: number) => void
  onApplyReco: () => void
}) {
  const matches = qty === recommended && recommended > 0
  return (
    <div className="cat box-config-card">
      <h3>{box.label}</h3>
      <p className="box-config-meta">
        <span>{box.sku}</span> · <span>USD {box.priceUsd}+iva</span> · <span>{box.power}</span> · <span>cubre {coverageM2(box).toFixed(1)} m²</span>
      </p>
      <div className="box-counter">
        <button type="button" className="btn" onClick={() => onQty(qty - 1)} disabled={qty <= 0} aria-label="Menos">−</button>
        <input
          type="number" min={0} step={1}
          value={qty}
          onChange={(e) => onQty(parseInt(e.target.value) || 0)}
          aria-label={`Cantidad de cajas ${box.label}`}
        />
        <button type="button" className="btn" onClick={() => onQty(qty + 1)} aria-label="Más">+</button>
        <span className="box-subtotal">{moneyUsd(subtotal)}</span>
      </div>
      {recommended > 0 && (
        <p className={`box-reco ${matches ? 'matches' : ''}`}>
          {matches
            ? <>✓ Coincide con la recomendación para tu galpón ({recommended} caja{recommended === 1 ? '' : 's'}).</>
            : <>
                Recomendado para tu galpón: <strong>{recommended} caja{recommended === 1 ? '' : 's'}</strong>.
                {' '}<button type="button" className="btn-link" onClick={onApplyReco}>Aplicar</button>
              </>}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Step 2

function Resumen({ state, calc, setStep, openFinalView }: ConfiguratorProps<LucesState>) {
  return (
    <section className="panel luces-resumen">
      <div className="ph">
        <h2>Resumen</h2>
        <div className="step-nav inline">
          <button type="button" className="btn ghost" onClick={() => setStep(1)}>← Modificar</button>
          <button type="button" className="btn cta" onClick={openFinalView}>Pedir cotización →</button>
        </div>
      </div>
      <CoverageSVG state={state} size="large" />
      <div className="resumen-spec">
        {calc.spec.map((r, i) => (
          <div key={i} className="row">
            <span className="k">{r.k}</span>
            <span className="v">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="resumen-total">
        <span className="lbl">Costo total estimado</span>
        <span className="amt">{moneyUsd(calc.totalPriceUsd)}</span>
        <span className="hint">+ IVA · Precios editables en el BOM</span>
      </div>
    </section>
  )
}
