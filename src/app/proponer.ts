import type { PerfilClima, PerfilSuelo, Bancal, EleccionEspecie, ResultadoIdoneidad } from '../dominio/tipos'
import { evaluarIdoneidad } from '../dominio/idoneidad'
import { colocar, aplicarAjustes, type ResultadoColocacion, type AjustesColocacion } from '../dominio/colocacion'
import { distribuir, type ModoIntercalado } from '../dominio/distribucion'
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

export interface Recorte { bancalId: string; cultivoId: string; numPlantas: number }

export interface Propuesta {
  cultivos: PropuestaCultivo[]
  colocacion: ResultadoColocacion
  recortes: Recorte[]
  sinergias: ParejaSinergia[]
  companerasSugeridas: string[]
  avisos: string[]
}

export function proponerHuerto(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  bancales: Bancal[], elecciones: EleccionEspecie[],
  ajustes: AjustesColocacion = {}, modoIntercalado: ModoIntercalado = 'bloques',
): Propuesta {
  // Descarta elecciones cuyo cultivo no exista en el catálogo (p. ej. datos guardados
  // de una versión anterior). Así las búsquedas posteriores en `idoneidades` no fallan.
  const eleccionesValidas = elecciones.filter((e) => buscarCultivo(e.cultivoId))

  const idoneidades = new Map<string, ResultadoIdoneidad>()
  for (const e of eleccionesValidas) {
    const c = buscarCultivo(e.cultivoId)!
    idoneidades.set(e.cultivoId, evaluarIdoneidad(c, clima, suelo, mesActual))
  }

  const aptas = eleccionesValidas.filter((e) => idoneidades.get(e.cultivoId)?.estado === 'apta')
  const conAjustes = aplicarAjustes(colocar(bancales, aptas), ajustes)

  // Recorte geométrico: reduce cada asignación a lo que cabe con las distancias
  // reales, para que plano, cosecha y calendario cuenten siempre lo mismo.
  const recortes: Recorte[] = []
  const colocacion: ResultadoColocacion = {
    ...conAjustes,
    bancales: conAjustes.bancales.map((bc) => {
      const bancal = bancales.find((b) => b.id === bc.bancalId)
      if (!bancal) return bc
      const { noCaben } = distribuir(bancal, bc.asignaciones, modoIntercalado)
      if (noCaben.length === 0) return bc
      for (const nc of noCaben) recortes.push({ bancalId: bc.bancalId, cultivoId: nc.cultivoId, numPlantas: nc.numPlantas })
      return {
        ...bc,
        asignaciones: bc.asignaciones.map((a) => {
          const nc = noCaben.find((x) => x.cultivoId === a.cultivoId)
          return nc ? { ...a, numPlantas: a.numPlantas - nc.numPlantas } : a
        }),
      }
    }),
  }

  const plantasPorCultivo = new Map<string, number>()
  for (const b of colocacion.bancales) {
    for (const a of b.asignaciones) {
      plantasPorCultivo.set(a.cultivoId, (plantasPorCultivo.get(a.cultivoId) ?? 0) + a.numPlantas)
    }
  }

  const cultivos: PropuestaCultivo[] = eleccionesValidas.map((e) => {
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
  for (const e of eleccionesValidas) {
    const r = idoneidades.get(e.cultivoId)
    if (r && r.estado !== 'apta' && r.motivo) {
      avisos.push(`${buscarCultivo(e.cultivoId)?.nombreComun ?? e.cultivoId}: ${r.motivo}`)
    }
  }

  const ids = eleccionesValidas.map((e) => e.cultivoId)
  return {
    cultivos,
    colocacion,
    recortes,
    sinergias: evaluarSinergias(ids),
    companerasSugeridas: sugerirCompaneras(ids, 2),
    avisos,
  }
}
