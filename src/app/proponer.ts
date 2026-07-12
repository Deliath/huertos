import type { PerfilClima, PerfilSuelo, Bancal, EleccionEspecie, ResultadoIdoneidad } from '../dominio/tipos'
import { evaluarIdoneidad } from '../dominio/idoneidad'
import { colocar, type ResultadoColocacion } from '../dominio/colocacion'
import { generarCalendario, type EntradaCalendario } from '../dominio/calendario'
import { estimarCosecha, type EstimacionCosecha } from '../dominio/cosecha'
import { evaluarSinergias, sugerirCompaneras, type ParejaSinergia } from '../dominio/sinergias'
import { buscarCultivo } from '../datos/cultivos'

export interface PropuestaCultivo {
  cultivoId: string
  idoneidad: ResultadoIdoneidad
  numPlantas: number
  calendario?: EntradaCalendario
  cosecha?: EstimacionCosecha
}

export interface Propuesta {
  cultivos: PropuestaCultivo[]
  colocacion: ResultadoColocacion
  sinergias: ParejaSinergia[]
  companerasSugeridas: string[]
  avisos: string[]
}

export function proponerHuerto(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  bancales: Bancal[], elecciones: EleccionEspecie[],
): Propuesta {
  const idoneidades = new Map<string, ResultadoIdoneidad>()
  for (const e of elecciones) {
    const c = buscarCultivo(e.cultivoId)
    if (!c) continue
    idoneidades.set(e.cultivoId, evaluarIdoneidad(c, clima, suelo, mesActual))
  }

  const aptas = elecciones.filter((e) => idoneidades.get(e.cultivoId)?.estado === 'apta')
  const colocacion = colocar(bancales, aptas)

  const plantasPorCultivo = new Map<string, number>()
  for (const b of colocacion.bancales) {
    for (const a of b.asignaciones) {
      plantasPorCultivo.set(a.cultivoId, (plantasPorCultivo.get(a.cultivoId) ?? 0) + a.numPlantas)
    }
  }

  const cultivos: PropuestaCultivo[] = elecciones.map((e) => {
    const idoneidad = idoneidades.get(e.cultivoId)!
    const numPlantas = plantasPorCultivo.get(e.cultivoId) ?? 0
    const colocado = numPlantas > 0 && idoneidad.mesRecomendado !== undefined
    return {
      cultivoId: e.cultivoId,
      idoneidad,
      numPlantas,
      calendario: colocado ? generarCalendario(e.cultivoId, idoneidad.mesRecomendado!) : undefined,
      cosecha: colocado ? estimarCosecha(e.cultivoId, numPlantas) : undefined,
    }
  })

  const avisos = [...colocacion.avisos]
  for (const e of elecciones) {
    const r = idoneidades.get(e.cultivoId)
    if (r && r.estado !== 'apta' && r.motivo) {
      avisos.push(`${buscarCultivo(e.cultivoId)?.nombreComun ?? e.cultivoId}: ${r.motivo}`)
    }
  }

  const ids = elecciones.map((e) => e.cultivoId)
  return {
    cultivos,
    colocacion,
    sinergias: evaluarSinergias(ids),
    companerasSugeridas: sugerirCompaneras(ids, 2),
    avisos,
  }
}
