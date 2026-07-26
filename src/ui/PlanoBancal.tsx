import type { Bancal, Orientacion } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { distribuir, type ModoIntercalado } from '../dominio/distribucion'
import { calcularCotas, cajaCotas, SEPARACION_COTA_CM, FUENTE_COTA_CM, type Cota } from './cotas'
import { buscarCultivo } from '../datos/cultivos'
import { tamañoIcono } from './tamano-icono'

const FLECHA: Record<Orientacion, string> = { norte: '↑ N', sur: '↓ N', este: '→ N', oeste: '← N' }

// Colores del plano. No usan las variables CSS a propósito: exportar.ts clona
// el SVG y lo serializa aislado, así que el PNG y el PDF saldrían sin color si
// dependieran de la hoja de estilos.
const COLOR_FONDO_PLANO = '#F6F4EC'
const COLOR_BORDE_PLANO = '#E2E6DC'
const COLOR_MARCO_BANCAL = '#C9CDBF'
const COLOR_LINEA_COTA = '#9AA694'
const COLOR_TEXTO_COTA = '#5E6B5A'
// Duplica el valor de --verde a propósito (ver comentario de arriba): si cambia
// --verde, este literal también hay que cambiarlo a mano.
const COLOR_BRUJULA = '#166534'

// Igual que los colores de arriba: en pantalla el <svg> heredaría `system-ui`
// de body, pero exportar.ts lo clona y serializa aislado, así que sin este
// atributo el PNG/PDF saldrían con la fuente por defecto del renderizador.
// Mismo valor que --fuente en estilos.css.
const FUENTE_PLANO = "system-ui, -apple-system, 'Segoe UI', sans-serif"

function LineaCota({ cota }: { cota: Cota }) {
  if (cota.orientacion === 'horizontal') {
    const y = cota.y1Cm - SEPARACION_COTA_CM
    return (
      <g data-cota stroke={COLOR_LINEA_COTA} strokeWidth={0.8}>
        <line x1={cota.x1Cm} y1={y} x2={cota.x2Cm} y2={y} />
        <line x1={cota.x1Cm} y1={y - 3} x2={cota.x1Cm} y2={y + 3} />
        <line x1={cota.x2Cm} y1={y - 3} x2={cota.x2Cm} y2={y + 3} />
        <text x={(cota.x1Cm + cota.x2Cm) / 2} y={y - 3} textAnchor="middle" fontSize={FUENTE_COTA_CM} fill={COLOR_TEXTO_COTA} stroke="none">{cota.etiqueta}</text>
      </g>
    )
  }
  const x = cota.x1Cm - SEPARACION_COTA_CM
  return (
    <g data-cota stroke={COLOR_LINEA_COTA} strokeWidth={0.8}>
      <line x1={x} y1={cota.y1Cm} x2={x} y2={cota.y2Cm} />
      <line x1={x - 3} y1={cota.y1Cm} x2={x + 3} y2={cota.y1Cm} />
      <line x1={x - 3} y1={cota.y2Cm} x2={x + 3} y2={cota.y2Cm} />
      <text x={x - 4} y={(cota.y1Cm + cota.y2Cm) / 2} textAnchor="end" dominantBaseline="central" fontSize={FUENTE_COTA_CM} fill={COLOR_TEXTO_COTA} stroke="none">{cota.etiqueta}</text>
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
  // Se cachea por cultivo: con 400 plantas, buscar el cultivo una vez por
  // planta se nota.
  const tamañoPorCultivo = new Map<string, number>()
  for (const p of plantas) {
    if (tamañoPorCultivo.has(p.cultivoId)) continue
    const c = buscarCultivo(p.cultivoId)
    tamañoPorCultivo.set(p.cultivoId, c ? tamañoIcono(c.distanciaPlantaCm, c.distanciaLineaCm) : 16)
  }
  // El viewBox se amplía con el hueco que ocupan las etiquetas de las cotas para
  // que las pegadas a los bordes del bancal no queden cortadas.
  const caja = cajaCotas(cotas)
  const x0 = Math.min(0, caja.minXCm)
  const y0 = Math.min(0, caja.minYCm)
  const anchoVista = Math.max(anchoCm, caja.maxXCm) - x0

  return (
    <svg
      role="img"
      aria-label={`Plano del ${bancal.nombre}`}
      viewBox={`${x0} ${y0} ${anchoVista} ${largoCm - y0}`}
      width="100%"
      fontFamily={FUENTE_PLANO}
      style={{ maxWidth: maxAnchoPx, border: `1px solid ${COLOR_BORDE_PLANO}`, borderRadius: 10, background: COLOR_FONDO_PLANO }}
    >
      <rect x={0} y={0} width={anchoCm} height={largoCm} fill="none" stroke={COLOR_MARCO_BANCAL} />
      {plantas.map((p, i) => (
        <g key={i} data-marca transform={`translate(${p.xCm}, ${p.yCm})`}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={tamañoPorCultivo.get(p.cultivoId) ?? 16}>{p.icono}</text>
        </g>
      ))}
      {cotas.map((c, i) => <LineaCota key={`${c.cultivoId}-${c.orientacion}-${i}`} cota={c} />)}
      <text x={6} y={18} fontSize={14} fill={COLOR_BRUJULA} fontWeight={600}>{FLECHA[orientacionNorte]}</text>
    </svg>
  )
}
