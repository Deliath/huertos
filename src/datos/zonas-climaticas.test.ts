import { expect, test } from 'vitest'
import { ZONAS_CLIMATICAS, buscarZona } from './zonas-climaticas'

test('hay al menos 6 zonas', () => {
  expect(ZONAS_CLIMATICAS.length).toBeGreaterThanOrEqual(6)
})

test('cada zona tiene 12 valores mensuales de temperatura', () => {
  for (const z of ZONAS_CLIMATICAS) {
    expect(z.tempMediaMensual).toHaveLength(12)
    expect(z.tempMinMensual).toHaveLength(12)
  }
})

test('los meses de helada están en rango o son -1', () => {
  for (const z of ZONAS_CLIMATICAS) {
    expect(z.mesUltimaHelada).toBeGreaterThanOrEqual(-1)
    expect(z.mesUltimaHelada).toBeLessThanOrEqual(11)
    expect(z.mesPrimeraHelada).toBeGreaterThanOrEqual(-1)
    expect(z.mesPrimeraHelada).toBeLessThanOrEqual(11)
  }
})

test('buscarZona funciona', () => {
  expect(buscarZona('mediterraneo_litoral')?.nombre).toContain('editerráneo')
})
