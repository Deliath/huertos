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

import type { PlanHuerto } from '../almacenamiento/almacen'

test('empezar_plan fija el mes de siembra y pasa a ubicacion', () => {
  const s = reducer(estadoInicial, { tipo: 'empezar_plan', mesSiembra: 5 })
  expect(s.paso).toBe('ubicacion')
  expect(s.mesSiembra).toBe(5)
})

test('cargar_plan rehidrata el estado y aterriza en resultado', () => {
  const plan: PlanHuerto = {
    id: 'p1', nombre: 'Terraza', guardadoEn: 1000, mesSiembra: 3,
    modoUbicacion: 'precisa', coordenadas: { lat: 40, lon: -3 }, zonaId: null,
    clima: { id: 'coordenadas', nombre: 'Ubicación precisa', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: 2, mesPrimeraHelada: 10 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'sur', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }],
    elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
  }
  const s = reducer(estadoInicial, { tipo: 'cargar_plan', plan })
  expect(s.paso).toBe('resultado')
  expect(s.idGuardado).toBe('p1')
  expect(s.nombreGuardado).toBe('Terraza')
  expect(s.mesSiembra).toBe(3)
  expect(s.clima).toEqual(plan.clima)
  expect(s.suelo).toEqual(plan.suelo)
  expect(s.bancales).toEqual(plan.bancales)
  expect(s.elecciones).toEqual(plan.elecciones)
  expect(s.orientacionNorte).toBe('sur')
  expect(s.modoUbicacion).toBe('precisa')
  expect(s.coordenadas).toEqual({ lat: 40, lon: -3 })
})
