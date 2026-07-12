import { expect, test } from 'vitest'
import { TIPOS_SUELO, GUIA_EXPERIMENTACION } from './suelos'

test('hay tres texturas de suelo cubiertas', () => {
  const texturas = TIPOS_SUELO.map((t) => t.textura).sort()
  expect(texturas).toEqual(['arcilloso', 'arenoso', 'franco'])
})

test('la guía de experimentación tiene al menos la prueba del bote', () => {
  const titulos = GUIA_EXPERIMENTACION.map((g) => g.titulo.toLowerCase())
  expect(titulos.some((t) => t.includes('bote'))).toBe(true)
  for (const g of GUIA_EXPERIMENTACION) {
    expect(g.pasos.length).toBeGreaterThan(0)
  }
})
