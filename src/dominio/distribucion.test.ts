import { expect, test } from 'vitest'
import { distribuir } from './distribucion'
import type { Bancal } from './tipos'

const b2x2: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }

test('coloca las plantas en fila respetando distanciaPlantaCm', () => {
  const { plantas, noCaben } = distribuir(b2x2, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  expect(plantas).toHaveLength(4)
  expect(noCaben).toHaveLength(0)
  // Todas en la misma fila, separadas 25 cm (dp de la lechuga).
  const ys = new Set(plantas.map((p) => p.yCm))
  expect(ys.size).toBe(1)
  const xs = plantas.map((p) => p.xCm).sort((a, b) => a - b)
  for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBe(25)
})

test('deja margen de media distancia al borde del bancal', () => {
  const { plantas } = distribuir(b2x2, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  for (const p of plantas) {
    expect(p.xCm).toBeGreaterThanOrEqual(12) // ~dp/2, con redondeo
    expect(p.xCm).toBeLessThanOrEqual(188)
    expect(p.yCm).toBeGreaterThanOrEqual(14) // ~dl/2, con redondeo
    expect(p.yCm).toBeLessThanOrEqual(186)
  }
})

test('las especies altas quedan al norte (y menor)', () => {
  const alto: Bancal = { id: 'b2', nombre: 'Alto', anchoM: 1, largoM: 3 }
  const { plantas } = distribuir(alto, [
    { cultivoId: 'lechuga', numPlantas: 1 }, // 25 cm de alto
    { cultivoId: 'tomate', numPlantas: 1 }, // 150 cm de alto
  ], 'bloques')
  const tomate = plantas.find((p) => p.cultivoId === 'tomate')!
  const lechuga = plantas.find((p) => p.cultivoId === 'lechuga')!
  expect(tomate.yCm).toBeLessThan(lechuga.yCm)
})

test('entre bloques de especies distintas separa el máximo de sus distanciaLineaCm', () => {
  const b3x3: Bancal = { id: 'b3', nombre: 'B3', anchoM: 3, largoM: 3 }
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 }, // dl 60
    { cultivoId: 'lechuga', numPlantas: 2 }, // dl 30
  ], 'bloques')
  const yTomate = plantas.find((p) => p.cultivoId === 'tomate')!.yCm
  const yLechuga = plantas.find((p) => p.cultivoId === 'lechuga')!.yCm
  expect(yLechuga - yTomate).toBe(60) // max(60, 30)
})

test('una especie más ancha que el bancal va entera a noCaben', () => {
  const estrecho: Bancal = { id: 'b4', nombre: 'Estrecho', anchoM: 0.4, largoM: 2 }
  const { plantas, noCaben } = distribuir(estrecho, [{ cultivoId: 'tomate', numPlantas: 2 }], 'bloques')
  expect(plantas).toHaveLength(0)
  expect(noCaben).toEqual([{ cultivoId: 'tomate', numPlantas: 2 }])
})

test('las filas que desbordan el largo van a noCaben', () => {
  const corto: Bancal = { id: 'b5', nombre: 'Corto', anchoM: 2, largoM: 0.5 }
  // Caben 8 lechugas por fila; la segunda fila (y=45) desborda los 50 cm de largo.
  const { plantas, noCaben } = distribuir(corto, [{ cultivoId: 'lechuga', numPlantas: 10 }], 'bloques')
  expect(plantas).toHaveLength(8)
  expect(noCaben).toEqual([{ cultivoId: 'lechuga', numPlantas: 2 }])
})

test('es determinista y no superpone plantas', () => {
  const entrada = [{ cultivoId: 'lechuga', numPlantas: 6 }, { cultivoId: 'zanahoria', numPlantas: 6 }]
  const r1 = distribuir(b2x2, entrada, 'bloques')
  const r2 = distribuir(b2x2, entrada, 'bloques')
  expect(r1).toEqual(r2)
  const posiciones = new Set(r1.plantas.map((p) => `${p.xCm},${p.yCm}`))
  expect(posiciones.size).toBe(r1.plantas.length)
})

test('ignora cultivos desconocidos y cantidades a cero', () => {
  const { plantas, noCaben } = distribuir(b2x2, [
    { cultivoId: 'inexistente', numPlantas: 3 },
    { cultivoId: 'lechuga', numPlantas: 0 },
  ], 'bloques')
  expect(plantas).toHaveLength(0)
  expect(noCaben).toHaveLength(0)
})

test('mezcla: alterna las especies round-robin dentro de la fila', () => {
  const b3x3: Bancal = { id: 'b6', nombre: 'B6', anchoM: 3, largoM: 3 }
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 },
    { cultivoId: 'lechuga', numPlantas: 2 },
  ], 'mezcla')
  expect(plantas).toHaveLength(4)
  // Caben todas en una fila y se alternan: tomate, lechuga, tomate, lechuga.
  expect(new Set(plantas.map((p) => p.yCm)).size).toBe(1)
  const porX = [...plantas].sort((a, b) => a.xCm - b.xCm).map((p) => p.cultivoId)
  expect(porX).toEqual(['tomate', 'lechuga', 'tomate', 'lechuga'])
})

test('companeras: mezcla solo especies compañeras; el resto en bloques aparte', () => {
  const b3x3: Bancal = { id: 'b7', nombre: 'B7', anchoM: 3, largoM: 3 }
  // tomate y lechuga son compañeras; la cebolla no lo es de ninguna de las dos.
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 },
    { cultivoId: 'lechuga', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'companeras')
  const yTomate = plantas.find((p) => p.cultivoId === 'tomate')!.yCm
  const yLechuga = plantas.find((p) => p.cultivoId === 'lechuga')!.yCm
  const ysCebolla = plantas.filter((p) => p.cultivoId === 'cebolla').map((p) => p.yCm)
  expect(yLechuga).toBe(yTomate) // comparten fila
  for (const y of ysCebolla) expect(y).toBeGreaterThan(yTomate) // bloque aparte, más al sur (menos alta)
})

test('companeras: una especie intermediaria une grupos (tomate-lechuga-zanahoria)', () => {
  const b3x3: Bancal = { id: 'b8', nombre: 'B8', anchoM: 3, largoM: 3 }
  // tomate↔lechuga y lechuga↔zanahoria son compañeras; tomate↔zanahoria no.
  const { plantas, noCaben } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 1 },
    { cultivoId: 'zanahoria', numPlantas: 1 },
    { cultivoId: 'lechuga', numPlantas: 1 },
  ], 'companeras')
  expect(noCaben).toHaveLength(0)
  expect(new Set(plantas.map((p) => p.yCm)).size).toBe(1) // las tres en la misma fila
})

test('companeras sin relación entre sí se comporta como bloques', () => {
  const b3x3: Bancal = { id: 'b9', nombre: 'B9', anchoM: 3, largoM: 3 }
  // pimiento y cebolla no son compañeras entre sí.
  const conBloques = distribuir(b3x3, [
    { cultivoId: 'pimiento', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'bloques')
  const conCompaneras = distribuir(b3x3, [
    { cultivoId: 'pimiento', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'companeras')
  expect(conCompaneras).toEqual(conBloques)
})
