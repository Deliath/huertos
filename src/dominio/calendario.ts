import { buscarCultivo } from '../datos/cultivos'

export interface EntradaCalendario {
  cultivoId: string
  mesSiembra: number
  mesTrasplante?: number
  mesCosechaInicio: number
  mesCosechaFin: number
}

function mod12(n: number): number { return ((n % 12) + 12) % 12 }

export function generarCalendario(cultivoId: string, mesSiembra: number): EntradaCalendario {
  const c = buscarCultivo(cultivoId)
  if (!c) throw new Error(`Cultivo desconocido: ${cultivoId}`)
  const mesesACosecha = Math.round(c.diasACosecha / 30)
  const mesCosechaInicio = mod12(mesSiembra + mesesACosecha)
  const mesesVentana = c.ventana === 'continua' ? Math.max(1, Math.round((c.ventanaDias ?? 30) / 30)) : 0
  const mesCosechaFin = mod12(mesCosechaInicio + mesesVentana)
  const mesTrasplante = c.metodo === 'semillero_trasplante' ? mod12(mesSiembra + 1) : undefined
  return { cultivoId, mesSiembra, mesTrasplante, mesCosechaInicio, mesCosechaFin }
}
