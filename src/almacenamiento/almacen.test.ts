import { expect, test } from 'vitest'
import { crearAlmacenLocal, type PlanHuerto } from './almacen'

function storageFalso(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  } as Storage
}

function plan(over: Partial<PlanHuerto> = {}): PlanHuerto {
  return {
    id: 'p1', nombre: 'Terraza', guardadoEn: 1000, mesSiembra: 3,
    modoUbicacion: 'zona', coordenadas: null, zonaId: 'mediterraneo_litoral',
    clima: { id: 'z', nombre: 'Z', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: -1, mesPrimeraHelada: -1 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'norte', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }],
    elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
    ...over,
  }
}

test('guardar y cargar devuelve el mismo plan', () => {
  const a = crearAlmacenLocal(storageFalso())
  const p = plan()
  a.guardar(p)
  expect(a.cargar('p1')).toEqual(p)
})

test('cargar un id inexistente devuelve null', () => {
  const a = crearAlmacenLocal(storageFalso())
  expect(a.cargar('nada')).toBeNull()
})

test('borrar elimina el plan', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan())
  a.borrar('p1')
  expect(a.cargar('p1')).toBeNull()
})

test('listar devuelve los planes ordenados por guardadoEn descendente', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan({ id: 'viejo', guardadoEn: 100 }))
  a.guardar(plan({ id: 'nuevo', guardadoEn: 900 }))
  expect(a.listar().map((p) => p.id)).toEqual(['nuevo', 'viejo'])
})

test('listar y cargar descartan entradas sin la forma de un plan (formato viejo o corrupto)', () => {
  const storage = storageFalso()
  storage.setItem('huertos:actual', JSON.stringify({ huerto: { orientacionNorte: 'norte', bancales: [] }, elecciones: [] }))
  storage.setItem('huertos:roto', 'no es json {')
  const a = crearAlmacenLocal(storage)
  a.guardar(plan({ id: 'bueno' }))
  expect(a.listar().map((p) => p.id)).toEqual(['bueno'])
  expect(a.cargar('actual')).toBeNull()
})

test('ignora claves de otros prefijos', () => {
  const storage = storageFalso()
  storage.setItem('otracosa', 'x')
  const a = crearAlmacenLocal(storage)
  a.guardar(plan({ id: 'bueno' }))
  expect(a.listar().map((p) => p.id)).toEqual(['bueno'])
})

test('guarda y recupera modoIntercalado y ajustes', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan({ id: 'px', modoIntercalado: 'mezcla', ajustes: { b1: { tomate: 2 } } }))
  const cargado = a.cargar('px')!
  expect(cargado.modoIntercalado).toBe('mezcla')
  expect(cargado.ajustes).toEqual({ b1: { tomate: 2 } })
})

test('un plan guardado sin los campos nuevos sigue cargando', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan()) // sin modoIntercalado ni ajustes
  const cargado = a.cargar('p1')!
  expect(cargado.modoIntercalado).toBeUndefined()
  expect(cargado.ajustes).toBeUndefined()
})
