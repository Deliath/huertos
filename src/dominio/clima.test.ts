import { expect, test } from 'vitest'
import { climaDeZona, perfilDesdeOpenMeteo } from './clima'

test('climaDeZona devuelve el perfil de una zona conocida', () => {
  const p = climaDeZona('mediterraneo_litoral')
  expect(p.tempMediaMensual).toHaveLength(12)
})

test('climaDeZona lanza si la zona no existe', () => {
  expect(() => climaDeZona('marte')).toThrow()
})

test('perfilDesdeOpenMeteo calcula meses de helada a partir de la mínima mensual', () => {
  const min = [-1, 0, 2, 5, 9, 13, 16, 16, 12, 7, 1, -2] // helada donde < 0.5°C: ene, feb, dic
  const mean = min.map((m) => m + 6)
  const p = perfilDesdeOpenMeteo({ monthly: { temperature_2m_mean: mean, temperature_2m_min: min } })
  expect(p.mesUltimaHelada).toBe(1) // febrero es el último mes frío de la primera mitad
  expect(p.mesPrimeraHelada).toBe(11) // diciembre, primer mes frío de la segunda mitad
  expect(p.tempMediaMensual).toEqual(mean)
})
