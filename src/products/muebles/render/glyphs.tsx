import type { SubType } from '../catalog'

/** Glifo simple para la paleta — distingue bases por subtipo. */
export function Glyph({ sub }: { sub: SubType }) {
  if (sub === 'tower') {
    return (
      <svg viewBox="0 0 30 36">
        <rect x={7} y={2} width={16} height={32} rx={1} fill="#cdb27a" stroke="#9a7d3e" />
        <line x1={15} y1={2} x2={15} y2={34} stroke="#9a7d3e" strokeWidth={0.6} />
      </svg>
    )
  }
  const head = (
    <>
      <rect x={3} y={2} width={24} height={11} fill="#dfe3e8" stroke="#9aa2ad" />
      <rect x={4} y={13} width={22} height={2.5} fill="#8b94a0" />
    </>
  )
  if (sub === 'drawer') {
    return (
      <svg viewBox="0 0 30 36">
        {head}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={6} y={15 + i * 4.6} width={18} height={3.4}
            fill="#cdd3da" stroke="#9aa2ad" strokeWidth={0.5} />
        ))}
      </svg>
    )
  }
  // door / default
  return (
    <svg viewBox="0 0 30 36">
      {head}
      <rect x={6} y={15} width={18} height={19} fill="#cdd3da" stroke="#9aa2ad" />
      <line x1={15} y1={15} x2={15} y2={34} stroke="#9aa2ad" />
    </svg>
  )
}
