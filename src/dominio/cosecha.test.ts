import { expect, test } from 'vitest'
import { estimarCosecha } from './cosecha'

test('estima un rango alrededor de plantas × rendimiento', () => {
  const e = estimarCosecha('tomate', 6) // 6 × 2.5 = 15 kg
  expect(e.unidad).toBe('kg')
  expect(e.cantidadMin).toBeLessThan(15)
  expect(e.cantidadMax).toBeGreaterThan(15)
  expect(e.cantidadMin).toBeGreaterThan(0)
})

test('0 plantas → 0', () => {
  const e = estimarCosecha('lechuga', 0)
  expect(e.cantidadMin).toBe(0)
  expect(e.cantidadMax).toBe(0)
})
