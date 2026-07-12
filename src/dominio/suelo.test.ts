import { expect, test } from 'vitest'
import { sueloManual, perfilDesdeSoilGrids } from './suelo'

test('sueloManual usa el drenaje típico de la textura', () => {
  expect(sueloManual('arcilloso').drenaje).toBe('malo')
  expect(sueloManual('arenoso').drenaje).toBe('bueno')
  expect(sueloManual('franco', 7).ph).toBe(7)
})

test('sueloManual aplica pH por defecto 6.5', () => {
  expect(sueloManual('franco').ph).toBe(6.5)
})

test('perfilDesdeSoilGrids clasifica textura por dominancia de arcilla/arena', () => {
  const r = {
    properties: {
      layers: [
        { name: 'clay', depths: [{ values: { mean: 450 } }] }, // 45% (SoilGrids da g/kg*10)
        { name: 'sand', depths: [{ values: { mean: 300 } }] }, // 30%
        { name: 'phh2o', depths: [{ values: { mean: 68 } }] }, // pH 6.8 (x10)
      ],
    },
  }
  const p = perfilDesdeSoilGrids(r)
  expect(p.textura).toBe('arcilloso')
  expect(p.ph).toBeCloseTo(6.8, 1)
  expect(p.drenaje).toBe('malo')
})
