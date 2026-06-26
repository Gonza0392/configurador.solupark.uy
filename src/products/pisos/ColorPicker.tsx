import { COLORS, type ColorKey } from './catalog'

type Props = {
  label: string
  value: ColorKey
  onChange: (v: ColorKey) => void
  /** ID base para asociar el label a los inputs. */
  idBase: string
  /** Modo compacto (swatches más chicos). */
  compact?: boolean
  /** Si está activo, marca este picker como "brocha en uso" (visualmente). */
  active?: boolean
}

/** Picker de 12 colores. Cada swatch es la imagen real del producto en
 *  solupark.uy/pisos cuando está cargada; si swatchUrl está vacío, muestra
 *  solo el color liso (caso de colores recién incorporados al catálogo). */
export function ColorPicker({ label, value, onChange, idBase, compact, active }: Props) {
  return (
    <fieldset className={`color-picker ${compact ? 'compact' : ''} ${active ? 'active-brush' : ''}`}>
      <legend>
        {label}
        {active && <span className="active-badge">brocha activa</span>}
        <span className="cp-sep"> · </span>
        <span className="cp-current">{COLORS.find((c) => c.key === value)?.label}</span>
      </legend>
      <div className="cp-grid" role="radiogroup" aria-label={label}>
        {COLORS.map((c) => {
          const id = `${idBase}-${c.key}`
          const selected = value === c.key
          const fillStyle: React.CSSProperties = c.swatchUrl
            ? { backgroundImage: `url('${c.swatchUrl}')`, backgroundColor: c.fallbackHex }
            : { backgroundColor: c.fallbackHex }
          return (
            <label key={c.key} className={`cp-swatch ${selected ? 'on' : ''}`} title={c.label} htmlFor={id}>
              <input
                id={id} type="radio" name={idBase}
                value={c.key} checked={selected}
                onChange={() => onChange(c.key)}
              />
              <span className="cp-fill" style={fillStyle} aria-hidden="true" />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
