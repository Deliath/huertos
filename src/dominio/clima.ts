import type { PerfilClima } from './tipos'
import { buscarZona } from '../datos/zonas-climaticas'

const UMBRAL_HELADA = 0.5 // °C: un mes con mínima media por debajo se considera con riesgo de helada

export function climaDeZona(zonaId: string): PerfilClima {
  const z = buscarZona(zonaId)
  if (!z) throw new Error(`Zona climática desconocida: ${zonaId}`)
  return z
}

export interface RespuestaOpenMeteo {
  monthly: { temperature_2m_mean: number[]; temperature_2m_min: number[] }
}

export function perfilDesdeOpenMeteo(respuesta: RespuestaOpenMeteo): PerfilClima {
  const mean = respuesta.monthly.temperature_2m_mean
  const min = respuesta.monthly.temperature_2m_min
  const mesesConHelada = min.map((t, i) => ({ t, i })).filter((x) => x.t < UMBRAL_HELADA).map((x) => x.i)
  // última helada de primavera: último mes frío en la primera mitad del año (ene-jun)
  const primavera = mesesConHelada.filter((i) => i <= 5)
  const otono = mesesConHelada.filter((i) => i >= 6)
  return {
    id: 'coordenadas', nombre: 'Ubicación precisa',
    tempMediaMensual: mean, tempMinMensual: min,
    mesUltimaHelada: primavera.length ? Math.max(...primavera) : -1,
    mesPrimeraHelada: otono.length ? Math.min(...otono) : -1,
  }
}

export async function climaDeCoordenadas(
  lat: number, lon: number, fetchImpl: typeof fetch = fetch,
): Promise<PerfilClima> {
  const url =
    `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}` +
    `&start_date=1991-01-01&end_date=2020-12-31&models=MRI_AGCM3_2_S` +
    `&monthly=temperature_2m_mean,temperature_2m_min`
  const resp = await fetchImpl(url)
  if (!resp.ok) throw new Error(`Error consultando el clima: ${resp.status}`)
  const datos = (await resp.json()) as RespuestaOpenMeteo
  return perfilDesdeOpenMeteo(datos)
}
