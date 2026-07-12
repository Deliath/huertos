import { expect, test } from 'vitest'
import { CULTIVOS, buscarCultivo } from './cultivos'

test('hay al menos 8 cultivos', () => {
  expect(CULTIVOS.length).toBeGreaterThanOrEqual(8)
})

test('todos los ids son únicos', () => {
  const ids = CULTIVOS.map((c) => c.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('las referencias de compañeras y antagonistas apuntan a cultivos existentes', () => {
  const ids = new Set(CULTIVOS.map((c) => c.id))
  for (const c of CULTIVOS) {
    for (const ref of [...c.companeras, ...c.antagonistas]) {
      expect(ids.has(ref), `${c.id} referencia a ${ref} inexistente`).toBe(true)
    }
  }
})

test('buscarCultivo devuelve el cultivo o undefined', () => {
  expect(buscarCultivo('tomate')?.nombreComun).toBe('Tomate')
  expect(buscarCultivo('inexistente')).toBeUndefined()
})
