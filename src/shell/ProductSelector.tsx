import type { AnyProductModule } from './types'
import './selector.css'

type Props = {
  products: AnyProductModule[]
  onPick: (id: string) => void
}

export function ProductSelector({ products, onPick }: Props) {
  return (
    <>
      <header className="shell">
        <div className="shell-hi">
          <div className="brand">
            <span className="sp">SoluPark</span>
            <span className="tag">Armá tu taller</span>
          </div>
          <h1 className="shell-h1">¿Qué <span className="t">querés diseñar</span> hoy?</h1>
          <p className="shell-sub">
            Elegí una línea para empezar. Podés diseñar las tres y combinarlas en tu taller.
          </p>
        </div>
      </header>
      <div className="wrap">
        <ul className="selector">
          {products.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={'card' + (p.comingSoon ? ' soon' : '')}
                onClick={() => !p.comingSoon && onPick(p.id)}
                disabled={p.comingSoon}
                aria-label={p.comingSoon ? `${p.name} — próximamente` : `Empezar con ${p.name}`}
              >
                <div className="ic" aria-hidden="true">{p.icon ?? '⬚'}</div>
                <div className="bo">
                  <div className="nm">{p.name}</div>
                  <div className="tag2">{p.tagline}</div>
                </div>
                {p.comingSoon
                  ? <span className="soon-tag">Próximamente</span>
                  : <span className="go">Empezar →</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <footer className="shell-foot">Configurador SoluPark · v0.1</footer>
    </>
  )
}
