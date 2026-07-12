import { expect, test } from 'vitest'
import { reducer, estadoInicial } from './estado'

test('añadir_bancal agrega un bancal con id único', () => {
  const s1 = reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 } })
  expect(s1.bancales).toHaveLength(1)
})

test('borrar_bancal elimina por id', () => {
  const s1 = reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 } })
  const s2 = reducer(s1, { tipo: 'borrar_bancal', id: 'b1' })
  expect(s2.bancales).toHaveLength(0)
})

test('ir_a_paso cambia el paso', () => {
  const s = reducer(estadoInicial, { tipo: 'ir_a_paso', paso: 'especies' })
  expect(s.paso).toBe('especies')
})

test('el reducer no muta el estado anterior', () => {
  const antes = estadoInicial.bancales.length
  reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 } })
  expect(estadoInicial.bancales.length).toBe(antes)
})
