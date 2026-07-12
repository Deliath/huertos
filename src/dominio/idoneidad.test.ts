import { expect, test } from 'vitest'
import { evaluarIdoneidad } from './idoneidad'
import { buscarCultivo } from '../datos/cultivos'
import { climaDeZona } from './clima'
import { sueloManual } from './suelo'

const tomate = buscarCultivo('tomate')!
const litoral = climaDeZona('mediterraneo_litoral')
const sueloFranco = sueloManual('franco', 6.5)

test('tomate en litoral en junio es apta', () => {
  const r = evaluarIdoneidad(tomate, litoral, sueloFranco, 5) // junio
  expect(r.estado).toBe('apta')
  expect(r.puntuacion).toBeGreaterThan(60)
})

test('tomate en litoral en diciembre recomienda esperar a la primavera', () => {
  const r = evaluarIdoneidad(tomate, litoral, sueloFranco, 11) // diciembre
  expect(r.estado).toBe('esperar')
  expect(r.mesRecomendado).toBeGreaterThanOrEqual(2)
  expect(r.mesRecomendado).toBeLessThanOrEqual(6)
})

test('suelo arcilloso (drenaje malo) para tomate añade consejo y baja la puntuación', () => {
  const arcilloso = sueloManual('arcilloso', 6.5)
  const bueno = evaluarIdoneidad(tomate, litoral, sueloFranco, 5)
  const malo = evaluarIdoneidad(tomate, litoral, arcilloso, 5)
  expect(malo.consejosSuelo.length).toBeGreaterThan(0)
  expect(malo.puntuacion).toBeLessThan(bueno.puntuacion)
})
