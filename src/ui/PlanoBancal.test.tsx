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

test('amplía el viewBox para que las etiquetas de las cotas no queden cortadas', () => {
  // 10 lechugas en 2×1 m: dos filas, con la cota vertical pegada al borde izquierdo.
  const estrecho: Bancal = { id: 'b2', nombre: 'B2', anchoM: 2, largoM: 1 }
  const { container } = render(
    <PlanoBancal bancal={estrecho} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 10 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  const [x, , ancho] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
  expect(x).toBeLessThan(0) // hueco a la izquierda para la etiqueta
  expect(x + ancho).toBeGreaterThanOrEqual(200) // el bancal sigue entero a la vista
})

test('sin cotas el viewBox es exactamente el bancal', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 200 200')
})

test('muestra cotas con la distancia entre plantas', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 4 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  expect(container.querySelectorAll('[data-cota]').length).toBeGreaterThan(0)
  expect(screen.getByText('25 cm')).toBeInTheDocument()
})
