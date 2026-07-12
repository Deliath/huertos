import { expect, test } from 'vitest'
import { generarCalendario } from './calendario'

test('cosecha del tomate ~3 meses después de sembrar en abril', () => {
  const e = generarCalendario('tomate', 3) // abril
  expect(e.mesCosechaInicio).toBe(6) // julio (abril + 90 días)
  expect(e.mesCosechaFin).toBeGreaterThanOrEqual(e.mesCosechaInicio)
})

test('el tomate (semillero) tiene mes de trasplante', () => {
  const e = generarCalendario('tomate', 3)
  expect(e.mesTrasplante).toBe(4)
})

test('los meses se envuelven en el año (módulo 12)', () => {
  const e = generarCalendario('tomate', 11) // diciembre + 3 meses → marzo
  expect(e.mesCosechaInicio).toBe(2)
})
