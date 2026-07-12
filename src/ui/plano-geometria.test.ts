import { expect, test } from 'vitest'
import { calcularMarcas } from './plano-geometria'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }

test('genera una marca por planta', () => {
  const marcas = calcularMarcas(bancal, [{ cultivoId: 'lechuga', numPlantas: 4 }])
  expect(marcas).toHaveLength(4)
})

test('las plantas más altas quedan más al norte (y menor) que las bajas', () => {
  // Bancal estrecho y largo (1×3 m) fuerza una sola columna → dos filas,
  // de modo que la altura decide la fila (norte) y no solo la columna.
  const bancalAlto: Bancal = { id: 'b2', nombre: 'Alto', anchoM: 1, largoM: 3 }
  const marcas = calcularMarcas(bancalAlto, [
    { cultivoId: 'tomate', numPlantas: 1 }, // 150 cm
    { cultivoId: 'lechuga', numPlantas: 1 }, // 25 cm
  ])
  const tomate = marcas.find((m) => m.cultivoId === 'tomate')!
  const lechuga = marcas.find((m) => m.cultivoId === 'lechuga')!
  expect(tomate.yCm).toBeLessThan(lechuga.yCm)
})

test('todas las marcas caen dentro del bancal', () => {
  const marcas = calcularMarcas(bancal, [{ cultivoId: 'zanahoria', numPlantas: 10 }])
  for (const m of marcas) {
    expect(m.xCm).toBeGreaterThanOrEqual(0)
    expect(m.xCm).toBeLessThanOrEqual(200)
    expect(m.yCm).toBeGreaterThanOrEqual(0)
    expect(m.yCm).toBeLessThanOrEqual(200)
  }
})
