import { expect, test } from 'vitest'
import { nombreMes, rangoMeses } from './formato'

test('nombreMes mapea índices a nombres', () => {
  expect(nombreMes(0)).toBe('enero')
  expect(nombreMes(11)).toBe('diciembre')
  expect(nombreMes(12)).toBe('enero')
})

test('rangoMeses formatea inicio y fin', () => {
  expect(rangoMeses(6, 8)).toBe('julio – septiembre')
  expect(rangoMeses(4, 4)).toBe('mayo')
})
