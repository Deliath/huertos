import { expect, test } from 'vitest'
import { parsearNominatim } from './geocodificador'

test('parsea resultados de Nominatim a lat/lon numéricos', () => {
  const bruto = [{ display_name: 'Valencia, España', lat: '39.47', lon: '-0.37' }]
  const r = parsearNominatim(bruto)
  expect(r).toEqual([{ nombre: 'Valencia, España', lat: 39.47, lon: -0.37 }])
})

test('ignora entradas mal formadas', () => {
  const r = parsearNominatim([{ display_name: 'x' }, 42, null])
  expect(r).toEqual([])
})
