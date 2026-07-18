import { expect, test } from 'vitest'
import { proponerHuerto } from './proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]

test('genera cosecha y calendario para una especie apta y colocada', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones) // junio
  const t = p.cultivos.find((c) => c.cultivoId === 'tomate')!
  expect(t.idoneidad.estado).toBe('apta')
  expect(t.numPlantas).toBeGreaterThan(0)
  expect(t.cosecha).toBeDefined()
  expect(t.calendario).toBeDefined()
})

test('incluye avisos de sinergia conflictiva vía sinergias', () => {
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'obligatoria', cantidad: 'media' },
  ]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.sinergias.some((s) => s.tipo === 'conflictiva')).toBe(true)
})

test('sugiere compañeras no elegidas', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'opcional', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.companerasSugeridas).toContain('albahaca')
})

test('ignora sin fallar las elecciones con un cultivo desconocido', () => {
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'dragon', obligatoriedad: 'obligatoria', cantidad: 'media' }, // no existe en el catálogo
  ]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.cultivos.map((c) => c.cultivoId)).toEqual(['tomate'])
  expect(p.cultivos.find((c) => c.cultivoId === 'dragon')).toBeUndefined()
})

test('los ajustes cambian las cantidades y la cosecha estimada', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const sinAjustes = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const conAjustes = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 2 } })
  expect(sinAjustes.cultivos[0].numPlantas).toBeGreaterThan(2)
  expect(conAjustes.cultivos[0].numPlantas).toBe(2)
  expect(conAjustes.colocacion.bancales[0].asignaciones[0].numPlantas).toBe(2)
  expect(conAjustes.cultivos[0].cosecha!.cantidadMax).toBeLessThan(sinAjustes.cultivos[0].cosecha!.cantidadMax)
})

test('sin ajustes que desborden no hay recortes', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(propuesta.recortes).toEqual([])
})

test('el área de una especie recortada se reofrece a las demás (captura Bug-distribucion)', () => {
  // Bancal 5×4.5 m, tomate/pimiento/calabacín «mucha»: colocar() da 30/48/4,
  // pero la fila de calabacín (línea 100) no cabe y se recorta entera. Su área
  // debe reaprovecharse: cabe una fila más de tomate (30 → 40) y el plano
  // resultante no deja plantas fuera.
  const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 5, largoM: 4.5 }]
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'pimiento', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'calabacin', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
  ]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.recortes).toEqual([{ bancalId: 'b1', cultivoId: 'calabacin', numPlantas: 4 }])
  expect(p.colocacion.bancales[0].asignaciones).toEqual([
    { cultivoId: 'tomate', numPlantas: 40 },
    { cultivoId: 'pimiento', numPlantas: 48 },
    { cultivoId: 'calabacin', numPlantas: 0 },
  ])
})

test('el relleno no toca las especies ajustadas a mano', () => {
  const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 5, largoM: 4.5 }]
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'pimiento', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'calabacin', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
  ]
  // Con el tomate fijado a mano en 30, la fila liberada va al pimiento (48 → 60).
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 30 } })
  expect(p.colocacion.bancales[0].asignaciones).toEqual([
    { cultivoId: 'tomate', numPlantas: 30 },
    { cultivoId: 'pimiento', numPlantas: 60 },
    { cultivoId: 'calabacin', numPlantas: 0 },
  ])
})

test('un ajuste que no cabe se recorta a lo que cabe geométricamente', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  // En 200×300 cm caben 20 tomateras (4 por fila × 5 filas a 50×60 cm).
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 999 } })
  expect(propuesta.colocacion.bancales[0].asignaciones[0].numPlantas).toBe(20)
  expect(propuesta.cultivos[0].numPlantas).toBe(20)
  expect(propuesta.recortes).toEqual([{ bancalId: 'b1', cultivoId: 'tomate', numPlantas: 979 }])
})
