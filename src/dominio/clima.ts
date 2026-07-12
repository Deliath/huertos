import type { PerfilClima } from './tipos'
import { buscarZona } from '../datos/zonas-climaticas'

const UMBRAL_HELADA = 0.5 // °C: un mes con mínima media por debajo se considera con riesgo de helada

export function climaDeZona(zonaId: string): PerfilClima {
  const z = buscarZona(zonaId)
  if (!z) throw new Error(`Zona climática desconocida: ${zonaId}`)
  return z
}

// La Climate API de Open-Meteo solo entrega series DIARIAS (no medias mensuales),
// así que agregamos nosotros las ~30 años de datos a 12 medias mensuales.
export interface RespuestaOpenMeteo {
  daily: {
    time: string[]
    temperature_2m_mean: (number | null)[]
    temperature_2m_min: (number | null)[]
  }
}

// Media de `valores` por mes (0-11) a partir de las fechas ISO de `time`,
// ignorando los días nulos. Devuelve NaN en un mes que se quede sin dato.
function mediaMensual(time: string[], valores: (number | null)[]): number[] {
  const suma = new Array<number>(12).fill(0)
  const cuenta = new Array<number>(12).fill(0)
  for (let i = 0; i < time.length; i++) {
    const v = valores[i]
    if (v === null || v === undefined || !Number.isFinite(v)) continue
    const mes = Number(time[i].slice(5, 7)) - 1
    if (mes < 0 || mes > 11) continue
    suma[mes] += v
    cuenta[mes] += 1
  }
  return suma.map((s, m) => (cuenta[m] > 0 ? s / cuenta[m] : NaN))
}

export function perfilDesdeOpenMeteo(respuesta: RespuestaOpenMeteo): PerfilClima {
  const { time, temperature_2m_mean, temperature_2m_min } = respuesta.daily
  const mean = mediaMensual(time, temperature_2m_mean)
  const min = mediaMensual(time, temperature_2m_min)
  if (mean.some((x) => !Number.isFinite(x)) || min.some((x) => !Number.isFinite(x))) {
    throw new Error('Open-Meteo no devolvió clima suficiente para estas coordenadas; prueba con una zona climática.')
  }
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
    `&daily=temperature_2m_mean,temperature_2m_min`
  const resp = await fetchImpl(url)
  if (!resp.ok) throw new Error(`Error consultando el clima: ${resp.status}`)
  const datos = (await resp.json()) as RespuestaOpenMeteo
  return perfilDesdeOpenMeteo(datos)
}
