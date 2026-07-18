import { expect, test } from 'vitest'
import { calcularCotas, cajaCotas } from './cotas'
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

test('cajaCotas reserva hueco a la izquierda para la etiqueta de la cota vertical', () => {
  const b: Bancal = { id: 'b4', nombre: 'B4', anchoM: 2, largoM: 1 }
  const { plantas } = distribuir(b, [{ cultivoId: 'lechuga', numPlantas: 10 }], 'bloques')
  const caja = cajaCotas(calcularCotas(plantas))
  // La cota vertical se dibuja a la izquierda de la primera columna (x=12) y su
  // etiqueta «30 cm» sobresale del borde del bancal.
  expect(caja.minXCm).toBeLessThan(0)
})

test('cajaCotas sin cotas no reserva ningún hueco', () => {
  expect(cajaCotas([])).toEqual({ minXCm: 0, minYCm: 0, maxXCm: 0 })
})

test('una especie con una sola planta no lleva cotas', () => {
  const b: Bancal = { id: 'b3', nombre: 'B3', anchoM: 2, largoM: 2 }
  const { plantas } = distribuir(b, [{ cultivoId: 'tomate', numPlantas: 1 }], 'bloques')
  expect(calcularCotas(plantas)).toEqual([])
})
