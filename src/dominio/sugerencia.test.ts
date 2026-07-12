import { expect, test } from 'vitest'
import { sugerirEspecies } from './sugerencia'
import { climaDeZona } from './clima'
import { sueloManual } from './suelo'

const litoral = climaDeZona('mediterraneo_litoral')
const franco = sueloManual('franco', 6.5)

test('escala con la superficie: ~6 especies/m² como tope', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 1, 6) // 1 m² → máx 6
  expect(sugeridas.length).toBeGreaterThan(0)
  expect(sugeridas.length).toBeLessThanOrEqual(6)
})

test('todas las sugeridas entran como opcional/media', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 2, 6)
  for (const e of sugeridas) {
    expect(e.obligatoriedad).toBe('opcional')
    expect(e.cantidad).toBe('media')
  }
})

test('no incluye a la vez dos antagonistas entre sí', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 5, 6).map((e) => e.cultivoId)
  const tieneCebolla = sugeridas.includes('cebolla')
  const tieneJudia = sugeridas.includes('judia')
  expect(tieneCebolla && tieneJudia).toBe(false)
})
