import type { Bancal, EleccionEspecie, NivelCantidad, Cultivo } from './tipos'
import { buscarCultivo } from '../datos/cultivos'

export interface AsignacionCultivo { cultivoId: string; numPlantas: number }
export interface BancalColocado { bancalId: string; asignaciones: AsignacionCultivo[] }
export interface ResultadoColocacion { bancales: BancalColocado[]; avisos: string[]; noColocadas: string[] }

const PESO: Record<NivelCantidad, number> = { poca: 1, media: 2, mucha: 3 }

interface EstadoBancal { bancal: Bancal; areaLibreCm2: number; asignaciones: AsignacionCultivo[]; ids: Set<string> }

function areaCm2(b: Bancal): number { return b.anchoM * 100 * b.largoM * 100 }
function areaPorPlanta(c: Cultivo): number { return c.distanciaPlantaCm * c.distanciaLineaCm }

function esAntagonistaDe(c: Cultivo, ids: Set<string>): boolean {
  for (const id of ids) {
    const otro = buscarCultivo(id)
    if (!otro) continue
    if (c.antagonistas.includes(id) || otro.antagonistas.includes(c.id)) return true
  }
  return false
}

export function colocar(bancales: Bancal[], elecciones: EleccionEspecie[]): ResultadoColocacion {
  const estados: EstadoBancal[] = bancales.map((b) => ({ bancal: b, areaLibreCm2: areaCm2(b), asignaciones: [], ids: new Set() }))
  const avisos: string[] = []
  const noColocadas: string[] = []

  // Ordenar: obligatorias antes que opcionales; dentro, mayor peso primero.
  const orden = [...elecciones].sort((a, b) => {
    if (a.obligatoriedad !== b.obligatoriedad) return a.obligatoriedad === 'obligatoria' ? -1 : 1
    return PESO[b.cantidad] - PESO[a.cantidad]
  })

  for (const e of orden) {
    const c = buscarCultivo(e.cultivoId)
    if (!c) continue

    // Bancales válidos: sin antagonista ya colocado, ordenados por área libre desc.
    const candidatos = estados
      .filter((s) => !esAntagonistaDe(c, s.ids))
      .sort((s1, s2) => s2.areaLibreCm2 - s1.areaLibreCm2)

    const destino = candidatos[0]
    if (!destino) {
      noColocadas.push(c.id)
      if (e.obligatoriedad === 'obligatoria') avisos.push(`No hay bancal compatible para ${c.nombreComun} (conflicto de vecindad).`)
      continue
    }

    // Área objetivo proporcional al peso, acotada al área libre.
    const fraccion = PESO[e.cantidad] / 6 // 1..3 sobre un máximo de referencia 6
    const areaObjetivo = Math.min(destino.areaLibreCm2, areaCm2(destino.bancal) * fraccion)
    const numPlantas = Math.floor(areaObjetivo / areaPorPlanta(c))

    if (numPlantas <= 0) {
      if (e.obligatoriedad === 'obligatoria') {
        avisos.push(`El bancal es demasiado pequeño para ${c.nombreComun}: necesita al menos ${Math.ceil(areaPorPlanta(c) / 10000 * 100) / 100} m² por planta.`)
      }
      destino.asignaciones.push({ cultivoId: c.id, numPlantas: 0 })
      destino.ids.add(c.id)
      continue
    }

    destino.areaLibreCm2 -= numPlantas * areaPorPlanta(c)
    destino.asignaciones.push({ cultivoId: c.id, numPlantas })
    destino.ids.add(c.id)
  }

  return {
    bancales: estados.map((s) => ({ bancalId: s.bancal.id, asignaciones: s.asignaciones })),
    avisos,
    noColocadas,
  }
}
