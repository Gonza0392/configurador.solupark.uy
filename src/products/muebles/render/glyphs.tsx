import type { SubType } from '../catalog'

/** Mini-iconos para la paleta de módulos. Estilo "mini-mueble negro" que
 *  refleja la estética real del producto (cuerpo oscuro, manijas plateadas,
 *  detalle de puertas/cajones). ViewBox 30×36 — mismo aspect que los glyphs
 *  anteriores para no romper layout. */
export function Glyph({ sub }: { sub: SubType }) {
  const body = '#222933'
  const stroke = '#0d1015'
  const trim = '#9aa2ad'      // manijas / detalles plateados
  const wood = '#b88c4d'      // wood top integrado
  const ledOn = '#ffe08a'

  // ---- Torre alta (full-height, 2 puertas con manijas largas) ----
  if (sub === 'tower') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={6} y={1.5} width={18} height={33} rx={1} fill={body} stroke={stroke} strokeWidth={0.5} />
        <line x1={15} y1={3} x2={15} y2={33} stroke={stroke} strokeWidth={0.4} />
        <rect x={13.5} y={6} width={1} height={20} fill={trim} rx={0.3} />
        <rect x={15.5} y={6} width={1} height={20} fill={trim} rx={0.3} />
        <rect x={6} y={32.8} width={18} height={1.7} fill="#0a0c10" />
      </svg>
    )
  }

  // ---- Base con cajones (5 líneas plateadas) ----
  if (sub === 'drawer') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={4} y={12} width={22} height={22} rx={1} fill={body} stroke={stroke} strokeWidth={0.5} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x={5.5} y={13.5 + i * 4} width={19} height={3.2}
              fill="#1a1f27" stroke={stroke} strokeWidth={0.3} rx={0.3} />
            <rect x={12} y={14.6 + i * 4} width={6} height={0.9} fill={trim} rx={0.3} />
          </g>
        ))}
        <rect x={4} y={33.5} width={22} height={1.5} fill="#0a0c10" />
      </svg>
    )
  }

  // ---- Cajonera móvil (5 cajones + 2 ruedas + wood top arriba) ----
  if (sub === 'mobile') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={5} y={11} width={20} height={2} fill={wood} rx={0.4} />
        <rect x={5} y={13} width={20} height={18} rx={0.5} fill={body} stroke={stroke} strokeWidth={0.5} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={6.3} y={14.5 + i * 4} width={17.4} height={2.6}
              fill="#1a1f27" stroke={stroke} strokeWidth={0.3} rx={0.3} />
            <rect x={12} y={15.4 + i * 4} width={6} height={0.7} fill={trim} rx={0.3} />
          </g>
        ))}
        <circle cx={8.5} cy={33} r={1.5} fill="#0a0c10" stroke={trim} strokeWidth={0.3} />
        <circle cx={21.5} cy={33} r={1.5} fill="#0a0c10" stroke={trim} strokeWidth={0.3} />
      </svg>
    )
  }

  // ---- Módulo superior LED (caja chata + tira LED amarilla) ----
  if (sub === 'upper') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={4} y={14} width={22} height={11} rx={1} fill={body} stroke={stroke} strokeWidth={0.5} />
        <line x1={15} y1={14} x2={15} y2={25} stroke={stroke} strokeWidth={0.4} />
        <rect x={13.5} y={17} width={1} height={5} fill={trim} rx={0.3} />
        <rect x={15.5} y={17} width={1} height={5} fill={trim} rx={0.3} />
        <rect x={4} y={24.2} width={22} height={1.1} fill={ledOn} />
      </svg>
    )
  }

  // ---- Panel perforado (cuerpo + grilla de puntitos) ----
  if (sub === 'peg') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={4} y={11} width={22} height={15} rx={0.5} fill={body} stroke={stroke} strokeWidth={0.5} />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 8 }).map((__, c) => (
            <rect key={`${r}-${c}`} x={5.5 + c * 2.4} y={13 + r * 2.4} width={1} height={1}
              fill={trim} opacity={0.85} />
          )),
        )}
      </svg>
    )
  }

  // ---- Working top stainless (barra fina horizontal con brillo) ----
  if (sub === 'top') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={3} y={16} width={24} height={4} rx={0.5} fill="#cfd5dc" stroke="#7a8088" strokeWidth={0.5} />
        <rect x={3} y={16} width={24} height={1.2} fill="#fff" opacity={0.6} />
        <rect x={5} y={19} width={20} height={0.5} fill="#7a8088" opacity={0.5} />
      </svg>
    )
  }

  // ---- Conector (2 barras verticales) ----
  if (sub === 'connector') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={9} y={5} width={3.5} height={26} rx={0.4} fill={body} stroke={stroke} strokeWidth={0.4} />
        <rect x={17.5} y={5} width={3.5} height={26} rx={0.4} fill={body} stroke={stroke} strokeWidth={0.4} />
        <circle cx={10.75} cy={9} r={0.5} fill={trim} />
        <circle cx={10.75} cy={27} r={0.5} fill={trim} />
        <circle cx={19.25} cy={9} r={0.5} fill={trim} />
        <circle cx={19.25} cy={27} r={0.5} fill={trim} />
      </svg>
    )
  }

  // ---- Esquinero (forma de diamante visto desde arriba) ----
  if (sub === 'corner') {
    return (
      <svg viewBox="0 0 30 36">
        <path d="M 15 4 L 27 16 L 15 28 L 3 16 Z" fill={body} stroke={stroke} strokeWidth={0.5} />
        <path d="M 15 9 L 23 17 L 15 25 L 7 17 Z" fill="none" stroke={trim} strokeWidth={0.4} opacity={0.7} />
        <rect x={13.5} y={29} width={3} height={4} fill={body} stroke={stroke} strokeWidth={0.4} />
      </svg>
    )
  }

  // ---- Default (door): cuerpo con 2 puertas + manijas ----
  return (
    <svg viewBox="0 0 30 36">
      <rect x={4} y={12} width={22} height={22} rx={1} fill={body} stroke={stroke} strokeWidth={0.5} />
      <line x1={15} y1={13} x2={15} y2={33} stroke={stroke} strokeWidth={0.4} />
      <rect x={13.5} y={20} width={1} height={6} fill={trim} rx={0.3} />
      <rect x={15.5} y={20} width={1} height={6} fill={trim} rx={0.3} />
      <rect x={4} y={33.5} width={22} height={1.5} fill="#0a0c10" />
    </svg>
  )
}
