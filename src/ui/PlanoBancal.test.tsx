// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PlanoBancal } from './PlanoBancal'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 2 }

test('renderiza un SVG accesible con el nombre del bancal', () => {
  render(<PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 2 }]} orientacionNorte="norte" />)
  const svg = screen.getByRole('img', { name: /Bancal 1/i })
  expect(svg).toBeInTheDocument()
})

test('dibuja una marca por planta', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 3 }]} orientacionNorte="norte" />,
  )
  expect(container.querySelectorAll('[data-marca]')).toHaveLength(3)
})
