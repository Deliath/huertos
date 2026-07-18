import type { Bancal, Orientacion } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { distribuir, type ModoIntercalado } from '../dominio/distribucion'
import { calcularCotas, type Cota } from './cotas'

const FLECHA: Record<Orientacion, string> = { norte: '↑ N', sur: '↓ N', este: '→ N', oeste: '← N' }

function LineaCota({ cota }: { cota: Cota }) {
  if (cota.orientacion === 'horizontal') {
    const y = cota.y1Cm - 12
    return (
      <g data-cota stroke="#888" strokeWidth={0.8}>
        <line x1={cota.x1Cm} y1={y} x2={cota.x2Cm} y2={y} />
        <line x1={cota.x1Cm} y1={y - 3} x2={cota.x1Cm} y2={y + 3} />
        <line x1={cota.x2Cm} y1={y - 3} x2={cota.x2Cm} y2={y + 3} />
        <text x={(cota.x1Cm + cota.x2Cm) / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="#555" stroke="none">{cota.etiqueta}</text>
      </g>
    )
  }
  const x = cota.x1Cm - 12
  return (
    <g data-cota stroke="#888" strokeWidth={0.8}>
      <line x1={x} y1={cota.y1Cm} x2={x} y2={cota.y2Cm} />
      <line x1={x - 3} y1={cota.y1Cm} x2={x + 3} y2={cota.y1Cm} />
      <line x1={x - 3} y1={cota.y2Cm} x2={x + 3} y2={cota.y2Cm} />
      <text x={x - 4} y={(cota.y1Cm + cota.y2Cm) / 2} textAnchor="end" dominantBaseline="central" fontSize={9} fill="#555" stroke="none">{cota.etiqueta}</text>
    </g>
  )
}

export function PlanoBancal(props: {
  bancal: Bancal; asignaciones: AsignacionCultivo[]; orientacionNorte: Orientacion
  modoIntercalado: ModoIntercalado; maxAnchoPx?: number
}) {
  const { bancal, asignaciones, orientacionNorte, modoIntercalado, maxAnchoPx = 480 } = props
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const { plantas } = distribuir(bancal, asignaciones, modoIntercalado)
  const cotas = calcularCotas(plantas)

  return (
    <svg
      role="img"
      aria-label={`Plano del ${bancal.nombre}`}
      viewBox={`0 0 ${anchoCm} ${largoCm}`}
      width="100%"
      style={{ maxWidth: maxAnchoPx, border: '1px solid #999', background: '#f7f5ef' }}
    >
      <rect x={0} y={0} width={anchoCm} height={largoCm} fill="none" stroke="#bbb" />
      {plantas.map((p, i) => (
        <g key={i} data-marca transform={`translate(${p.xCm}, ${p.yCm})`}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={16}>{p.icono}</text>
        </g>
      ))}
      {cotas.map((c, i) => <LineaCota key={`${c.cultivoId}-${c.orientacion}-${i}`} cota={c} />)}
      <text x={6} y={18} fontSize={14} fill="#333">{FLECHA[orientacionNorte]}</text>
    </svg>
  )
}
