import type { Huerto, EleccionEspecie } from '../dominio/tipos'

export interface HuertoGuardado { huerto: Huerto; elecciones: EleccionEspecie[] }

export interface Almacen {
  guardar(clave: string, datos: HuertoGuardado): void
  cargar(clave: string): HuertoGuardado | null
  borrar(clave: string): void
}

const PREFIJO = 'huertos:'

export function crearAlmacenLocal(storage: Storage = localStorage): Almacen {
  return {
    guardar(clave, datos) { storage.setItem(PREFIJO + clave, JSON.stringify(datos)) },
    cargar(clave) {
      const s = storage.getItem(PREFIJO + clave)
      return s ? (JSON.parse(s) as HuertoGuardado) : null
    },
    borrar(clave) { storage.removeItem(PREFIJO + clave) },
  }
}
