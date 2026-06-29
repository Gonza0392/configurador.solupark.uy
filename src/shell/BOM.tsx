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
              <th className="r">Precio venta US$</th>
              <th className="r">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {calc.bom.length === 0 ? (
              <tr><td colSpan={5} className="bom-empty">Agregá módulos para ver la lista.</td></tr>
            ) : calc.bom.map((b) => (
              <tr key={b.sku}>
                <td><span className="code">{b.sku}</span></td>
                <td>
                  {b.name}
                  {b.tag && <span className="tag"> {b.tag}</span>}
                </td>
                <td className="r qty">×{b.qty}</td>
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
              <tr className="subtotal">
                <td colSpan={4}>Subtotal</td>
                <td className="r amt">{moneyUsd(calc.totalPriceUsd)}</td>
              </tr>
              <tr className="iva">
                <td colSpan={4} className="lbl">+ IVA 22% <small>(sobre subtotal)</small></td>
                <td className="r amt">{moneyUsd(calc.totalPriceUsd * 0.22)}</td>
              </tr>
              <tr className="total">
                <td colSpan={4}>Total final</td>
                <td className="r amt">{moneyUsd(calc.totalPriceUsd * 1.22)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {calc.bom.length > 0 && (
        <div className="bom-logistics" aria-label="Datos logísticos para uso interno">
          <span className="bom-logistics-lbl">Logística (uso interno)</span>
          <span className="bom-logistics-chip">
            <span className="b">{calc.totalNwKg.toFixed(0)}</span> kg
          </span>
          <span className="bom-logistics-chip">
            <span className="b">{calc.totalCbm.toFixed(2)}</span> CBM
          </span>
          <span className="bom-logistics-chip">
            <span className="b">{calc.bom.reduce((s, b) => s + b.qty, 0)}</span> bultos
          </span>
        </div>
      )}

      <p className="bom-note">
        <b>Precios + IVA (22%).</b> Cargá el precio al cliente por ítem (sin IVA) y el sistema
        calcula el IVA y total automáticamente.
      </p>
    </div>
  )
}
