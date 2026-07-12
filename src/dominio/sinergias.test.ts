import { expect, test } from 'vitest'
import { evaluarSinergias, sugerirCompaneras } from './sinergias'

test('detecta pareja favorable tomate-albahaca', () => {
  const parejas = evaluarSinergias(['tomate', 'albahaca'])
  expect(parejas).toContainEqual({ a: 'albahaca', b: 'tomate', tipo: 'favorable' })
})

test('detecta pareja conflictiva cebolla-judia', () => {
  const parejas = evaluarSinergias(['cebolla', 'judia'])
  expect(parejas.some((p) => p.tipo === 'conflictiva')).toBe(true)
})

test('sugiere compañeras no elegidas que ayudan a las elegidas', () => {
  const sugeridas = sugerirCompaneras(['tomate'], 2)
  expect(sugeridas).toContain('albahaca')
  expect(sugeridas).not.toContain('tomate')
  expect(sugeridas.length).toBeLessThanOrEqual(2)
})
