import { colorByKey, type ColorKey } from '../catalog'
import { designByKind, type DesignKind } from '../designs'

type Props = {
  kind: DesignKind
  colorPrimary: ColorKey
  colorSecondary: ColorKey
  selected: boolean
  onClick: () => void
  /** Cols/rows del thumbnail. Default 8×5 — proporción de garage típico. */
  thumbCols?: number
  thumbRows?: number
}

/** Tarjeta clickeable con thumbnail SVG en vivo del diseño usando los colores
 *  actuales de las brochas del cliente. */
export function DesignCard({
  kind, colorPrimary, colorSecondary, selected, onClick,
  thumbCols = 8, thumbRows = 5,
}: Props) {
  const def = designByKind(kind)
  const matrix = def.apply(thumbCols, thumbRows, colorPrimary, colorSecondary)
  const cell = 12
  const W = thumbCols * cell
  const H = thumbRows * cell

  return (
    <button
      type="button"
      className={`design-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Aplicar diseño ${def.label}`}
      title={def.label}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="dc-thumb">
        {matrix.map((row, r) =>
          row.map((color, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell} y={r * cell}
              width={cell} height={cell}
              fill={colorByKey(color).fallbackHex}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={0.4}
            />
          )),
        )}
      </svg>
      <span className="dc-label">{def.label}</span>
    </button>
  )
}
