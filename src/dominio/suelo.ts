import type { PerfilSuelo, Textura, Drenaje } from './tipos'
import { TIPOS_SUELO } from '../datos/suelos'

function drenajeDeTextura(textura: Textura): Drenaje {
  const info = TIPOS_SUELO.find((t) => t.textura === textura)
  return info ? info.drenajeTipico : 'medio'
}

export function sueloManual(textura: Textura, ph = 6.5): PerfilSuelo {
  return { textura, ph, drenaje: drenajeDeTextura(textura) }
}

export interface RespuestaSoilGrids {
  properties: { layers: Array<{ name: string; depths: Array<{ values: { mean: number | null } }> }> }
}

function capa(r: RespuestaSoilGrids, nombre: string): number | undefined {
  const l = r.properties.layers.find((x) => x.name === nombre)
  const v = l?.depths[0]?.values.mean
  // SoilGrids devuelve mean:null en píxeles sin dato (p. ej. suelo urbano);
  // lo tratamos igual que "ausente" para no fabricar textura/pH = 0.
  return v == null ? undefined : v
}

export function perfilDesdeSoilGrids(r: RespuestaSoilGrids): PerfilSuelo {
  const clayRaw = capa(r, 'clay')
  const sandRaw = capa(r, 'sand')
  if (clayRaw === undefined || sandRaw === undefined) {
    throw new Error('SoilGrids no devolvió datos de textura para estas coordenadas; indica el suelo a mano.')
  }
  const clay = clayRaw / 10 // g/kg*10 → %
  const sand = sandRaw / 10
  const phRaw = capa(r, 'phh2o')
  const ph = phRaw !== undefined ? phRaw / 10 : 6.5
  let textura: Textura = 'franco'
  if (clay >= 40) textura = 'arcilloso'
  else if (sand >= 50) textura = 'arenoso'
  return { textura, ph, drenaje: drenajeDeTextura(textura) }
}

export async function sueloDeCoordenadas(
  lat: number, lon: number, fetchImpl: typeof fetch = fetch,
): Promise<PerfilSuelo> {
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}` +
    `&property=clay&property=sand&property=phh2o&depth=0-5cm&value=mean`
  const resp = await fetchImpl(url)
  if (!resp.ok) throw new Error(`Error consultando el suelo: ${resp.status}`)
  const datos = (await resp.json()) as RespuestaSoilGrids
  return perfilDesdeSoilGrids(datos)
}
