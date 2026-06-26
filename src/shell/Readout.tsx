import type { Metric } from './types'
import './readout.css'

export function Readout({ metrics }: { metrics: Metric[] }) {
  if (!metrics.length) return null
  return (
    <div className="readout">
      {metrics.map((m) => (
        <div key={m.key} className="ro">
          <div className="k">{m.key}</div>
          <div className={`v tone-${m.tone ?? 'neutral'}`}>
            {m.value}
            {m.sub && <small> {m.sub}</small>}
          </div>
        </div>
      ))}
    </div>
  )
}
