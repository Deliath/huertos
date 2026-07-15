import type { PerfilClima, PerfilSuelo, Bancal, Orientacion, EleccionEspecie } from '../dominio/tipos'
import type { AjustesColocacion } from '../dominio/colocacion'
import type { ModoIntercalado } from '../dominio/distribucion'

// Un PlanHuerto es un huerto físico (ubicación, clima, suelo, orientación,
// bancales) + las especies elegidas. NO confundir con `Cultivo` (una especie).
export interface PlanHuerto {
  id: string
  nombre: string
  guardadoEn: number // Date.now()
  mesSiembra: number // 0-11, mes con el que se generó el plan
  modoUbicacion: 'precisa' | 'zona'
  coordenadas: { lat: number; lon: number } | null
  zonaId: string | null
  clima: PerfilClima
  suelo: PerfilSuelo
  orientacionNorte: Orientacion
  bancales: Bancal[]
  elecciones: EleccionEspecie[]
  // Personalización del resultado; opcionales para que los planes antiguos sigan cargando.
  modoIntercalado?: ModoIntercalado
  ajustes?: AjustesColocacion
}

export interface Almacen {
  guardar(plan: PlanHuerto): void
  cargar(id: string): PlanHuerto | null
  borrar(id: string): void
  listar(): PlanHuerto[]
}

const PREFIJO = 'huertos:'

// Validación de forma: en vez de un número de versión, aceptamos solo lo que
// tiene los campos imprescindibles para montar el resultado. Descarta el viejo
// formato ('actual', sin clima/suelo) y cualquier JSON corrupto.
function esPlan(x: unknown): x is PlanHuerto {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.nombre === 'string' &&
    typeof p.guardadoEn === 'number' &&
    typeof p.mesSiembra === 'number' &&
    p.clima != null && typeof p.clima === 'object' &&
    p.suelo != null && typeof p.suelo === 'object' &&
    Array.isArray(p.bancales)
  )
}

function parsear(s: string | null): PlanHuerto | null {
  if (!s) return null
  try {
    const p: unknown = JSON.parse(s)
    return esPlan(p) ? p : null
  } catch {
    return null
  }
}

export function crearAlmacenLocal(storage: Storage = localStorage): Almacen {
  return {
    guardar(plan) { storage.setItem(PREFIJO + plan.id, JSON.stringify(plan)) },
    cargar(id) { return parsear(storage.getItem(PREFIJO + id)) },
    borrar(id) { storage.removeItem(PREFIJO + id) },
    listar() {
      const planes: PlanHuerto[] = []
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (!k || !k.startsWith(PREFIJO)) continue
        const p = parsear(storage.getItem(k))
        if (p) planes.push(p)
      }
      return planes.sort((a, b) => b.guardadoEn - a.guardadoEn)
    },
  }
}
