import { expect, test } from 'vitest'
import { colocar, aplicarAjustes } from './colocacion'
import type { Bancal, EleccionEspecie } from './tipos'

const bancalGrande: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 3 } // 6 m²

test('coloca una especie con nº de plantas > 0', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'lechuga', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const r = colocar([bancalGrande], elecciones)
  const asig = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'lechuga')
  expect(asig).toBeDefined()
  expect(asig!.numPlantas).toBeGreaterThan(0)
})

test('las obligatorias reservan sitio; una opcional se recorta antes en bancal pequeño', () => {
  const bancalMini: Bancal = { id: 'b2', nombre: 'Mini', anchoM: 0.5, largoM: 0.5 } // 0.25 m²
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'lechuga', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'calabacin', obligatoriedad: 'opcional', cantidad: 'poca' },
  ]
  const r = colocar([bancalMini], elecciones)
  const lechuga = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'lechuga')
  const calabacin = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'calabacin')
  expect(lechuga?.numPlantas ?? 0).toBeGreaterThan(0)
  expect(calabacin?.numPlantas ?? 0).toBe(0) // se recorta la opcional
})

test('no coloca dos antagonistas en el mismo bancal', () => {
  const b1: Bancal = { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 }
  const b2: Bancal = { id: 'b2', nombre: 'B2', anchoM: 1, largoM: 1 }
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'obligatoria', cantidad: 'media' },
  ]
  const r = colocar([b1, b2], elecciones)
  for (const banc of r.bancales) {
    const ids = banc.asignaciones.map((a) => a.cultivoId)
    expect(ids.includes('cebolla') && ids.includes('judia')).toBe(false)
  }
})

test('una opcional sin bancal compatible se registra en noColocadas', () => {
  const b1: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'opcional', cantidad: 'media' },
  ]
  const r = colocar([b1], elecciones)
  expect(r.noColocadas).toContain('judia')
})

test('aplicarAjustes sobrescribe numPlantas de asignaciones existentes', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b1: { tomate: 2 } })
  expect(resultado.bancales[0].asignaciones[0].numPlantas).toBe(2)
})

test('aplicarAjustes ignora bancales y cultivos que no están en la colocación', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b99: { tomate: 1 }, b1: { lechuga: 5 } })
  expect(resultado.bancales[0].asignaciones).toEqual([{ cultivoId: 'tomate', numPlantas: 6 }])
})

test('aplicarAjustes no muta la entrada y no baja de cero', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b1: { tomate: -3 } })
  expect(resultado.bancales[0].asignaciones[0].numPlantas).toBe(0)
  expect(colocacion.bancales[0].asignaciones[0].numPlantas).toBe(6)
})
