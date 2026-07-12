import type { Bancal } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { buscarCultivo } from '../datos/cultivos'

export interface MarcaPlano { cultivoId: string; icono: string; xCm: number; yCm: number }

export function calcularMarcas(bancal: Bancal, asignaciones: AsignacionCultivo[]): MarcaPlano[] {
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100

  // Expandir a una lista de plantas individuales, altas primero (irán al norte, arriba).
  const plantas: { cultivoId: string; icono: string; alturaCm: number }[] = []
  for (const a of asignaciones) {
    const c = buscarCultivo(a.cultivoId)
    if (!c) continue
    for (let i = 0; i < a.numPlantas; i++) plantas.push({ cultivoId: c.id, icono: c.icono, alturaCm: c.alturaCm })
  }
  plantas.sort((p, q) => q.alturaCm - p.alturaCm)

  // Rejilla uniforme suficiente para todas las plantas.
  const n = plantas.length
  if (n === 0) return []
  const columnas = Math.max(1, Math.ceil(Math.sqrt((n * anchoCm) / largoCm)))
  const filas = Math.ceil(n / columnas)
  const pasoX = anchoCm / columnas
  const pasoY = largoCm / filas

  return plantas.map((p, idx) => {
    const fila = Math.floor(idx / columnas)
    const col = idx % columnas
    return {
      cultivoId: p.cultivoId,
      icono: p.icono,
      xCm: Math.round(pasoX * (col + 0.5)),
      yCm: Math.round(pasoY * (fila + 0.5)),
    }
  })
}
