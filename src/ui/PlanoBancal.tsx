import type { Bancal, Orientacion } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { calcularMarcas } from './plano-geometria'

const FLECHA: Record<Orientacion, string> = { norte: '↑ N', sur: '↓ N', este: '→ N', oeste: '← N' }

export function PlanoBancal(props: { bancal: Bancal; asignaciones: AsignacionCultivo[]; orientacionNorte: Orientacion; maxAnchoPx?: number }) {
  const { bancal, asignaciones, orientacionNorte, maxAnchoPx = 480 } = props
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const marcas = calcularMarcas(bancal, asignaciones)

  return (
    <svg
      role="img"
      aria-label={`Plano del ${bancal.nombre}`}
      viewBox={`0 0 ${anchoCm} ${largoCm}`}
      width="100%"
      style={{ maxWidth: maxAnchoPx, border: '1px solid #999', background: '#f7f5ef' }}
    >
      <rect x={0} y={0} width={anchoCm} height={largoCm} fill="none" stroke="#bbb" />
      {marcas.map((m, i) => (
        <g key={i} data-marca transform={`translate(${m.xCm}, ${m.yCm})`}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={16}>{m.icono}</text>
        </g>
      ))}
      <text x={6} y={18} fontSize={14} fill="#333">{FLECHA[orientacionNorte]}</text>
    </svg>
  )
}
