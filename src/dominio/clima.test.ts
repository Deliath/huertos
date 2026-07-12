import { expect, test } from 'vitest'
import { climaDeZona, perfilDesdeOpenMeteo } from './clima'

test('climaDeZona devuelve el perfil de una zona conocida', () => {
  const p = climaDeZona('mediterraneo_litoral')
  expect(p.tempMediaMensual).toHaveLength(12)
})

test('climaDeZona lanza si la zona no existe', () => {
  expect(() => climaDeZona('marte')).toThrow()
})

// Construye una respuesta "daily" de Open-Meteo: para cada mes, `dias` jornadas
// con una mínima conocida (y media = mínima + 6). Así la media mensual agregada
// debe reproducir exactamente el valor conocido de cada mes.
function dailySintetico(minPorMes: number[], dias = 3) {
  const time: string[] = []
  const min: number[] = []
  const mean: number[] = []
  minPorMes.forEach((m, mesIdx) => {
    for (let d = 1; d <= dias; d++) {
      const mm = String(mesIdx + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      time.push(`2000-${mm}-${dd}`)
      min.push(m)
      mean.push(m + 6)
    }
  })
  return { daily: { time, temperature_2m_mean: mean, temperature_2m_min: min } }
}

test('perfilDesdeOpenMeteo agrega los datos diarios en 12 medias mensuales', () => {
  const minPorMes = [-1, 0, 2, 5, 9, 13, 16, 16, 12, 7, 1, -2] // helada donde < 0.5°C: ene, feb, dic
  const p = perfilDesdeOpenMeteo(dailySintetico(minPorMes))
  expect(p.tempMinMensual).toHaveLength(12)
  expect(p.tempMinMensual[0]).toBeCloseTo(-1, 5)
  expect(p.tempMediaMensual[0]).toBeCloseTo(5, 5) // -1 + 6
  expect(p.mesUltimaHelada).toBe(1) // febrero, último mes frío de la primera mitad
  expect(p.mesPrimeraHelada).toBe(11) // diciembre, primer mes frío de la segunda mitad
})

test('perfilDesdeOpenMeteo ignora los días con valores nulos', () => {
  const base = dailySintetico([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
  // Introduce un nulo en enero: la media de enero debe seguir siendo 10.
  ;(base.daily.temperature_2m_min as (number | null)[])[0] = null
  ;(base.daily.temperature_2m_mean as (number | null)[])[0] = null
  const p = perfilDesdeOpenMeteo(base)
  expect(p.tempMinMensual[0]).toBeCloseTo(10, 5)
})

test('perfilDesdeOpenMeteo lanza si un mes se queda sin ningún dato', () => {
  const base = dailySintetico([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
  // Anula por completo el mes de julio (índice 6): días 18,19,20 del array.
  for (let i = 18; i < 21; i++) {
    ;(base.daily.temperature_2m_min as (number | null)[])[i] = null
    ;(base.daily.temperature_2m_mean as (number | null)[])[i] = null
  }
  expect(() => perfilDesdeOpenMeteo(base)).toThrow()
})
