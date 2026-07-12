import { expect, test } from 'vitest'
import { crearAlmacenLocal, type HuertoGuardado } from './almacen'

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

const datos: HuertoGuardado = {
  huerto: { orientacionNorte: 'norte', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }] },
  elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
}

test('guardar y cargar devuelve los mismos datos', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar('mi-huerto', datos)
  expect(a.cargar('mi-huerto')).toEqual(datos)
})

test('cargar una clave inexistente devuelve null', () => {
  const a = crearAlmacenLocal(storageFalso())
  expect(a.cargar('nada')).toBeNull()
})

test('borrar elimina los datos', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar('x', datos)
  a.borrar('x')
  expect(a.cargar('x')).toBeNull()
})
