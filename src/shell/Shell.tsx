import { useEffect, useMemo, useState } from 'react'
import type { AnyProductModule, CalcResult } from './types'
import { ProductSelector } from './ProductSelector'
import { Stepper } from './Stepper'
import { Readout } from './Readout'
import { BOM } from './BOM'
import { FinalView } from './FinalView'
import { loadState, saveState } from '../lib/storage'

type Props = { products: AnyProductModule[] }

export function Shell({ products }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    () => loadState('shell', { activeId: null as string | null }).activeId,
  )

  useEffect(() => { saveState('shell', { activeId }) }, [activeId])

  if (!activeId) {
    return <ProductSelector products={products} onPick={setActiveId} />
  }
  const module_ = products.find((p) => p.id === activeId)
  if (!module_ || module_.comingSoon) {
    return <ProductSelector products={products} onPick={setActiveId} />
  }
  return <ProductHost key={module_.id} module={module_} onBack={() => setActiveId(null)} />
}

function ProductHost({ module, onBack }: { module: AnyProductModule; onBack: () => void }) {
  const [state, setStateRaw] = useState<any>(() => loadState(module.id, module.initialState))
  const [step, setStep] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => { saveState(module.id, state) }, [module.id, state])

  const setState = (next: any | ((s: any) => any)) =>
    setStateRaw((prev: any) => (typeof next === 'function' ? next(prev) : next))

  const calc: CalcResult = useMemo(() => module.calc(state), [module, state])

  const onPriceChange = (sku: string, price: number) =>
    setStateRaw((prev: any) => module.setPrice(prev, sku, price))

  const Configurator = module.Configurator
  const showStepper = module.steps.length > 1

  return (
    <>
      <header className="shell">
        <div className="shell-hi">
          <div className="brand">
            <span className="sp">SoluPark</span>
            <span className="tag">{module.name}</span>
            <button className="back" onClick={onBack} aria-label="Volver al selector de productos">
              ← Otro producto
            </button>
          </div>
          <h1 className="shell-h1">{module.tagline}</h1>
          {module.subtitle && <p className="shell-sub">{module.subtitle}</p>}
          <Readout metrics={calc.metrics} />
        </div>
      </header>
      <div className="wrap">
        {showStepper && <Stepper steps={module.steps} current={step} onPick={setStep} />}
        <Configurator
          state={state}
          setState={setState}
          step={step}
          setStep={setStep}
          calc={calc}
        />
        <BOM
          calc={calc}
          onPriceChange={onPriceChange}
          onClear={() => {
            if (confirm('¿Vaciar el armado actual?')) setStateRaw(module.initialState)
          }}
          onQuote={() => {
            if (!calc.isValid) {
              alert(calc.invalidReason ?? 'Agregá algo antes de cotizar.')
              return
            }
            setModalOpen(true)
          }}
        />
      </div>
      <FinalView
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        spec={calc.spec}
        whatsappBody={calc.whatsappBody}
      />
      <footer className="shell-foot">Configurador SoluPark · v0.1</footer>
    </>
  )
}
