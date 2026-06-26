import './stepper.css'

type Props = {
  steps: string[]
  current: number
  onPick: (i: number) => void
}

export function Stepper({ steps, current, onPick }: Props) {
  return (
    <ol className="stepper" aria-label="Pasos">
      {steps.map((s, i) => (
        <li key={s} className={i === current ? 'on' : i < current ? 'done' : ''}>
          <button
            type="button"
            onClick={() => onPick(i)}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="n">{i + 1}</span>
            <span className="t">{s}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
