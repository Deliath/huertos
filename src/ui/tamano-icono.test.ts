import { describe, expect, it } from 'vitest'
import { tamañoIcono, TAMAÑO_ICONO_MAX_CM, TAMAÑO_ICONO_MIN_CM } from './tamano-icono'

describe('tamañoIcono', () => {
  // Los valores salen de medir la maqueta aprobada
  // docs/superpowers/specs/assets/2026-07-25-maqueta-estilo-b-bancales-5x5.html,
  // que se hizo expresamente para validar este cambio.
  it.each([
    ['cebolla', 10, 25, 8.5],
    ['zanahoria', 15, 20, 12.75],
    ['lechuga', 25, 30, 21.25],
    ['berenjena', 30, 70, 25.5],
  ])('escala %s a la separación menor', (_nombre, planta, linea, esperado) => {
    expect(tamañoIcono(planta, linea)).toBeCloseTo(esperado, 5)
  })

  it('toma la separación menor, no la primera', () => {
    expect(tamañoIcono(70, 30)).toBeCloseTo(tamañoIcono(30, 70), 5)
  })

  it('recorta los cultivos muy separados al tope', () => {
    expect(tamañoIcono(50, 60)).toBe(TAMAÑO_ICONO_MAX_CM)
    expect(tamañoIcono(100, 100)).toBe(TAMAÑO_ICONO_MAX_CM)
  })

  it('sube los cultivos muy juntos al mínimo legible', () => {
    expect(tamañoIcono(4, 4)).toBe(TAMAÑO_ICONO_MIN_CM)
  })

  it('nunca sale del intervalo, sea cual sea la entrada', () => {
    for (const sep of [0, 1, 3, 7, 12, 40, 200, 1000]) {
      const t = tamañoIcono(sep, sep)
      expect(t).toBeGreaterThanOrEqual(TAMAÑO_ICONO_MIN_CM)
      expect(t).toBeLessThanOrEqual(TAMAÑO_ICONO_MAX_CM)
    }
  })
})
