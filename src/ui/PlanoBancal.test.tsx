// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PlanoBancal } from './PlanoBancal'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 2 }

test('renderiza un SVG accesible con el nombre del bancal', () => {
  render(<PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 2 }]} orientacionNorte="norte" modoIntercalado="bloques" />)
  expect(screen.getByRole('img', { name: /Bancal 1/i })).toBeInTheDocument()
})

test('dibuja una marca por planta en su posición real', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 3 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  const marcas = [...container.querySelectorAll('[data-marca]')]
  expect(marcas).toHaveLength(3)
  // Posiciones reales: separadas 25 cm dentro de la fila.
  const xs = marcas.map((m) => Number(/translate\((\d+),/.exec(m.getAttribute('transform') ?? '')?.[1])).sort((a, b) => a - b)
  expect(xs[1] - xs[0]).toBe(25)
  expect(xs[2] - xs[1]).toBe(25)
})

test('muestra cotas con la distancia entre plantas', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 4 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  expect(container.querySelectorAll('[data-cota]').length).toBeGreaterThan(0)
  expect(screen.getByText('25 cm')).toBeInTheDocument()
})
