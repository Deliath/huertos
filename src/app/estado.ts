import type { Bancal, Orientacion, PerfilClima, PerfilSuelo, EleccionEspecie } from '../dominio/tipos'
import type { PlanHuerto } from '../almacenamiento/almacen'
import type { AjustesColocacion } from '../dominio/colocacion'
import type { ModoIntercalado } from '../dominio/distribucion'

export type Paso = 'inicio' | 'ubicacion' | 'bancales' | 'suelo' | 'especies' | 'resultado'

export interface EstadoApp {
  paso: Paso
  modoUbicacion: 'precisa' | 'zona' | null
  coordenadas: { lat: number; lon: number } | null
  zonaId: string | null
  clima: PerfilClima | null
  suelo: PerfilSuelo | null
  orientacionNorte: Orientacion
  bancales: Bancal[]
  elecciones: EleccionEspecie[]
  idGuardado: string | null
  nombreGuardado: string | null
  mesSiembra: number
  modoIntercalado: ModoIntercalado
  ajustes: AjustesColocacion
}

export type Accion =
  | { tipo: 'ir_a_paso'; paso: Paso }
  | { tipo: 'set_modo_ubicacion'; modo: 'precisa' | 'zona'; coordenadas?: { lat: number; lon: number }; zonaId?: string }
  | { tipo: 'set_clima'; clima: PerfilClima }
  | { tipo: 'set_suelo'; suelo: PerfilSuelo }
  | { tipo: 'set_orientacion'; orientacion: Orientacion }
  | { tipo: 'añadir_bancal'; bancal: Bancal }
  | { tipo: 'editar_bancal'; bancal: Bancal }
  | { tipo: 'borrar_bancal'; id: string }
  | { tipo: 'set_elecciones'; elecciones: EleccionEspecie[] }
  | { tipo: 'empezar_plan'; mesSiembra: number }
  | { tipo: 'cargar_plan'; plan: PlanHuerto }
  | { tipo: 'set_guardado'; id: string; nombre: string }
  | { tipo: 'set_modo_intercalado'; modo: ModoIntercalado }
  | { tipo: 'ajustar_cantidad'; bancalId: string; cultivoId: string; numPlantas: number }

export const estadoInicial: EstadoApp = {
  paso: 'inicio', modoUbicacion: null, coordenadas: null, zonaId: null,
  clima: null, suelo: null, orientacionNorte: 'norte', bancales: [], elecciones: [],
  idGuardado: null, nombreGuardado: null, mesSiembra: 0,
  modoIntercalado: 'bloques', ajustes: {},
}

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case 'ir_a_paso': return { ...estado, paso: accion.paso }
    case 'set_modo_ubicacion': return { ...estado, modoUbicacion: accion.modo, coordenadas: accion.coordenadas ?? null, zonaId: accion.zonaId ?? null }
    case 'set_clima': return { ...estado, clima: accion.clima }
    case 'set_suelo': return { ...estado, suelo: accion.suelo }
    case 'set_orientacion': return { ...estado, orientacionNorte: accion.orientacion }
    case 'añadir_bancal': return { ...estado, bancales: [...estado.bancales, accion.bancal] }
    case 'editar_bancal': return { ...estado, bancales: estado.bancales.map((b) => (b.id === accion.bancal.id ? accion.bancal : b)) }
    case 'borrar_bancal': return { ...estado, bancales: estado.bancales.filter((b) => b.id !== accion.id) }
    case 'set_elecciones': return { ...estado, elecciones: accion.elecciones }
    case 'empezar_plan': return { ...estado, paso: 'ubicacion', mesSiembra: accion.mesSiembra, modoIntercalado: 'bloques', ajustes: {} }
    case 'cargar_plan': {
      const p = accion.plan
      return {
        ...estado, paso: 'resultado',
        idGuardado: p.id, nombreGuardado: p.nombre, mesSiembra: p.mesSiembra,
        modoUbicacion: p.modoUbicacion, coordenadas: p.coordenadas, zonaId: p.zonaId,
        clima: p.clima, suelo: p.suelo, orientacionNorte: p.orientacionNorte,
        bancales: p.bancales, elecciones: p.elecciones,
        modoIntercalado: p.modoIntercalado ?? 'bloques', ajustes: p.ajustes ?? {},
      }
    }
    case 'set_guardado': return { ...estado, idGuardado: accion.id, nombreGuardado: accion.nombre }
    case 'set_modo_intercalado': return { ...estado, modoIntercalado: accion.modo }
    case 'ajustar_cantidad': return {
      ...estado,
      ajustes: { ...estado.ajustes, [accion.bancalId]: { ...estado.ajustes[accion.bancalId], [accion.cultivoId]: accion.numPlantas } },
    }
  }
}
