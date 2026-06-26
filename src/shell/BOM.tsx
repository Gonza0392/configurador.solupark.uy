import type { CalcResult } from './types'
import { moneyUsd } from '../lib/format'
import './bom.css'

type Props = {
  calc: CalcResult
  onPriceChange: (sku: string, price: number) => void
  onQuote: () => void
  onClear: () => void
}

export function BOM({ calc, onPriceChange, onQuote, onClear }: Props) {
  return (
    <div className="panel bom-panel">
      <div className="ph">
        <h2>Lista de piezas y costo</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={onClear}>Vaciar</button>
          <button className="btn cta" onClick={onQuote}>Pedir cotización →</button>
        </div>
      </div>
      <div className="bom-scroll">
        <table className="bom-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th className="r">Cant.</th>
              <th className="r">N.W. (kg)</th>
              <th className="r">Precio venta US$</th>
              <th className="r">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {calc.bom.length === 0 ? (
              <tr><td colSpan={6} className="bom-empty">Agregá módulos para ver la lista.</td></tr>
            ) : calc.bom.map((b) => (
              <tr key={b.sku}>
                <td><span className="code">{b.sku}</span></td>
                <td>
                  {b.name}
                  {b.tag && <span className="tag"> {b.tag}</span>}
                </td>
                <td className="r qty">×{b.qty}</td>
                <td className="r"><span className="code">{(b.nwKg * b.qty).toFixed(1)}</span></td>
                <td className="r">
                  <input
                    className="pin" type="number" min={0} step={1}
                    value={b.priceUsd || 0}
                    onChange={(e) => onPriceChange(b.sku, parseFloat(e.target.value) || 0)}
                    aria-label={`Precio ${b.sku}`}
                  />
                </td>
                <td className="r"><span className="code">{moneyUsd((b.priceUsd || 0) * b.qty)}</span></td>
              </tr>
            ))}
          </tbody>
          {calc.bom.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3}>Totales</td>
                <td className="r"><span className="code" style={{ fontWeight: 700 }}>{calc.totalNwKg.toFixed(0)} kg</span></td>
                <td></td>
                <td className="tot">{moneyUsd(calc.totalPriceUsd)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="bom-note">
        <b>Precios de venta editables.</b> Cargá el precio al cliente por ítem y el total se recalcula.
        El detalle por WhatsApp no incluye precios — modelo "Consulte por precio".
      </p>
    </div>
  )
}
