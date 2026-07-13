import type { PlanHuerto } from '../almacenamiento/almacen'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Subtítulo discreto: ubicación · mes de siembra · fecha de guardado.
export function subtituloPlan(plan: PlanHuerto): string {
  const ubicacion = plan.modoUbicacion === 'precisa' && plan.coordenadas
    ? `${plan.coordenadas.lat.toFixed(2)}, ${plan.coordenadas.lon.toFixed(2)}`
    : (plan.clima.nombre || plan.zonaId || 'Zona climática')
  const fecha = new Date(plan.guardadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${ubicacion} · siembra en ${MESES[plan.mesSiembra]} · guardado el ${fecha}`
}
