import type { UnidadCosecha } from './tipos'
import { buscarCultivo } from '../datos/cultivos'

export interface EstimacionCosecha {
  cultivoId: string
  cantidadMin: number
  cantidadMax: number
  unidad: UnidadCosecha
}

function redondear(n: number, unidad: UnidadCosecha): number {
  if (unidad === 'unidades') return Math.round(n)
  return Math.round(n * 10) / 10
}

export function estimarCosecha(cultivoId: string, numPlantas: number): EstimacionCosecha {
  const c = buscarCultivo(cultivoId)
  if (!c) throw new Error(`Cultivo desconocido: ${cultivoId}`)
  const base = numPlantas * c.rendimientoPorPlanta
  return {
    cultivoId,
    cantidadMin: redondear(base * 0.8, c.unidad),
    cantidadMax: redondear(base * 1.2, c.unidad),
    unidad: c.unidad,
  }
}
