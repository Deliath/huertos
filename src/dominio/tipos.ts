export type Textura = 'arenoso' | 'franco' | 'arcilloso'
export type Drenaje = 'malo' | 'medio' | 'bueno'
export type Sol = 'pleno_sol' | 'semisombra'
export type Metodo = 'siembra_directa' | 'semillero_trasplante'
export type ToleranciaHelada = 'sensible' | 'resistente'
export type TipoCultivo = 'fruto' | 'hoja' | 'raiz' | 'bulbo' | 'leguminosa' | 'otro'
export type UnidadCosecha = 'kg' | 'unidades' | 'manojos'
export type VentanaTipo = 'puntual' | 'continua'
export type NivelCantidad = 'poca' | 'media' | 'mucha'
export type Obligatoriedad = 'obligatoria' | 'opcional'
export type Orientacion = 'norte' | 'sur' | 'este' | 'oeste'

export interface Cultivo {
  id: string
  nombreComun: string
  nombreCientifico: string
  icono: string
  familia: string
  tipo: TipoCultivo
  tempMinGerminacion: number // °C, media diaria por debajo de la cual no germina bien
  tempOptima: number // °C
  toleranciaHelada: ToleranciaHelada
  texturaPreferida: Textura[]
  phMin: number
  phMax: number
  drenajeRequerido: Drenaje // drenaje mínimo que tolera la especie
  metodo: Metodo
  sol: Sol
  distanciaPlantaCm: number
  distanciaLineaCm: number
  alturaCm: number
  diasACosecha: number
  rendimientoPorPlanta: number // en `unidad`
  unidad: UnidadCosecha
  ventana: VentanaTipo
  ventanaDias?: number // duración de la recogida si ventana === 'continua'
  companeras: string[] // ids de cultivos
  antagonistas: string[] // ids de cultivos
  riego: string
  plagas: string
  notas: string
}

// 12 valores, índice 0 = enero … 11 = diciembre
export interface PerfilClima {
  id: string
  nombre: string
  tempMediaMensual: number[] // media mensual de la temperatura media diaria
  tempMinMensual: number[] // media mensual de la temperatura mínima diaria
  mesUltimaHelada: number // último mes de riesgo de helada en primavera (0-11); -1 si no hay
  mesPrimeraHelada: number // primer mes de riesgo en otoño (0-11); -1 si no hay
}

export interface PerfilSuelo {
  textura: Textura
  ph: number
  drenaje: Drenaje
}

export interface Bancal {
  id: string
  nombre: string
  anchoM: number
  largoM: number
}

export interface Huerto {
  orientacionNorte: Orientacion // hacia dónde queda el norte respecto al huerto
  bancales: Bancal[]
}

export interface EleccionEspecie {
  cultivoId: string
  obligatoriedad: Obligatoriedad
  cantidad: NivelCantidad
}

export type EstadoIdoneidad = 'apta' | 'esperar' | 'no_recomendada'

export interface ResultadoIdoneidad {
  cultivoId: string
  estado: EstadoIdoneidad
  puntuacion: number // 0-100
  mesRecomendado?: number // 0-11, cuándo sembrar si estado === 'esperar' o 'apta'
  consejosSuelo: string[]
  motivo?: string
}
