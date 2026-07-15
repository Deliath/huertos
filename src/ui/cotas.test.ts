import { expect, test } from 'vitest'
import { calcularCotas } from './cotas'
import { distribuir } from '../dominio/distribucion'
import type { Bancal } from '../dominio/tipos'

test('una fila de lechugas produce solo la cota horizontal con su distancia', () => {
  const b: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }
  const { plantas } = distribuir(b, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  const cotas = calcularCotas(plantas)
  expect(cotas).toHaveLength(1)
  expect(cotas[0]).toMatchObject({ cultivoId: 'lechuga', orientacion: 'horizontal', etiqueta: '25 cm' })
})

test('dos filas de lechugas añaden la cota vertical entre líneas', () => {
  const b: Bancal = { id: 'b2', nombre: 'B2', anchoM: 2, largoM: 1 }
  const { plantas } = distribuir(b, [{ cultivoId: 'lechuga', numPlantas: 10 }], 'bloques')
  const cotas = calcularCotas(plantas)
  const vertical = cotas.find((c) => c.orientacion === 'vertical')!
  expect(vertical.etiqueta).toBe('30 cm')
})

test('una especie con una sola planta no lleva cotas', () => {
  const b: Bancal = { id: 'b3', nombre: 'B3', anchoM: 2, largoM: 2 }
  const { plantas } = distribuir(b, [{ cultivoId: 'tomate', numPlantas: 1 }], 'bloques')
  expect(calcularCotas(plantas)).toEqual([])
})
