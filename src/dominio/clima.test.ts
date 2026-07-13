import { expect, test } from 'vitest'
import { climaDeZona, esMesHelada, perfilDesdeOpenMeteo } from './clima'

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
  const minPorMes = [-1, 0, 2, 5, 9, 13, 16, 16, 12, 7, 1, -2]
  const p = perfilDesdeOpenMeteo(dailySintetico(minPorMes))
  expect(p.tempMinMensual).toHaveLength(12)
  expect(p.tempMinMensual[0]).toBeCloseTo(-1, 5)
  expect(p.tempMediaMensual[0]).toBeCloseTo(5, 5) // -1 + 6
})

// Construye una respuesta diaria controlando, por mes, cuántas NOCHES de helada
// (Tmin<0) hay en total repartidas en `anios` años. Cada mes recibe además
// `anios` días templados (Tmin=tempCalida) para que ningún mes quede vacío y
// para que la mínima MEDIA quede claramente por encima de 0°C.
function dailyConHeladas(
  heladaPorMes: number[],
  { anios = 10, tempCalida = 8, tempHelada = -3 } = {},
) {
  const time: string[] = []
  const min: number[] = []
  const mean: number[] = []
  let k = 0
  const emit = (mes: number, t: number) => {
    const anio = 2000 + (k % anios)
    k++
    const mm = String(mes + 1).padStart(2, '0')
    const dd = String((k % 28) + 1).padStart(2, '0')
    time.push(`${anio}-${mm}-${dd}`)
    min.push(t)
    mean.push(t + 6)
  }
  for (let mes = 0; mes < 12; mes++) {
    for (let i = 0; i < heladaPorMes[mes]; i++) emit(mes, tempHelada)
    for (let i = 0; i < anios; i++) emit(mes, tempCalida)
  }
  return { daily: { time, temperature_2m_mean: mean, temperature_2m_min: min } }
}

test('perfilDesdeOpenMeteo detecta helada por FRECUENCIA de noches bajo cero, aunque la mínima media sea > 0.5°C (regresión Madrid)', () => {
  // Enero: 10 noches de helada en 10 años (= 1/año), pero mínima media 2.5°C
  const p = perfilDesdeOpenMeteo(dailyConHeladas([10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
  expect(p.tempMinMensual[0]).toBeGreaterThan(0.5) // el criterio viejo (media<0.5) NO lo veía
  expect(p.mesUltimaHelada).toBe(0) // enero SÍ es mes de helada
})

test('perfilDesdeOpenMeteo ignora meses que hielan menos de 1 noche/año', () => {
  // Febrero: 5 noches en 10 años = 0.5/año < umbral
  const p = perfilDesdeOpenMeteo(dailyConHeladas([0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
  expect(p.mesUltimaHelada).toBe(-1)
  expect(p.mesPrimeraHelada).toBe(-1)
})

test('perfilDesdeOpenMeteo separa última helada de primavera y primera de otoño', () => {
  // Helada frecuente en feb (idx 1) y nov (idx 10)
  const p = perfilDesdeOpenMeteo(dailyConHeladas([0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0]))
  expect(p.mesUltimaHelada).toBe(1)
  expect(p.mesPrimeraHelada).toBe(10)
})

test('esMesHelada marca los meses dentro de la ventana de heladas', () => {
  const litoral = climaDeZona('mediterraneo_litoral') // ultima=1, primera=11
  expect(esMesHelada(litoral, 0)).toBe(true) // enero <= última (1)
  expect(esMesHelada(litoral, 1)).toBe(true) // febrero == última
  expect(esMesHelada(litoral, 6)).toBe(false) // julio, fuera de ventana
  expect(esMesHelada(litoral, 11)).toBe(true) // diciembre >= primera (11)
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
