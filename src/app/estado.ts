import type { Bancal, Orientacion, PerfilClima, PerfilSuelo, EleccionEspecie } from '../dominio/tipos'

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

export const estadoInicial: EstadoApp = {
  paso: 'inicio', modoUbicacion: null, coordenadas: null, zonaId: null,
  clima: null, suelo: null, orientacionNorte: 'norte', bancales: [], elecciones: [],
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
  }
}
