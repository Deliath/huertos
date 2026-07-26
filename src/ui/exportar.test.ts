// @vitest-environment jsdom
import { createElement } from 'react'
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { svgAString } from './exportar'
import { PlanoBancal } from './PlanoBancal'

test('serializa un svg incluyendo el namespace xmlns', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '10')
  const s = svgAString(svg)
  expect(s).toContain('http://www.w3.org/2000/svg')
  expect(s.startsWith('<svg')).toBe(true)
})

// Guarda la invariante que hace posible exportar.ts: el SVG del plano se
// estila SOLO con atributos en línea (fill=, stroke=, etc.), nunca con
// className. exportar.ts clona el <svg> y lo serializa aislado de la hoja de
// estilos, así que un className que hoy no hace nada en jsdom (porque jsdom no
// aplica CSS) haría que el PNG/PDF exportado saliera sin color el día que
// alguien lo añada, sin que ningún test lo note.
//
// Esto NO afirma sobre un color computado a partir de la hoja de estilos (lo
// que está prohibido en jsdom): consulta la FORMA del marcado ya serializado,
// que es texto plano. Es estructura, no estilo — no lo borres pensando que
// infringe esa regla.
test('el plano serializado no lleva className y sí lleva el color como atributo', () => {
  const bancal = { id: 'b1', nombre: 'Bancal de prueba', anchoM: 2, largoM: 2 }
  // Archivo .ts, no .tsx: sin sintaxis JSX, se monta con createElement.
  const { container } = render(
    createElement(PlanoBancal, { bancal, asignaciones: [{ cultivoId: 'lechuga', numPlantas: 2 }], orientacionNorte: 'norte', modoIntercalado: 'bloques' }),
  )
  const svg = container.querySelector('svg')!
  const cadena = svgAString(svg)
  expect(cadena).not.toContain('class=')
  expect(cadena).toContain('fill="#')
})
