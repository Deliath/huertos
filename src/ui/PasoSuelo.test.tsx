// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PasoSuelo } from './PasoSuelo'
import { sueloManual } from '../dominio/suelo'

test('sin suelo automático muestra la guía de experimentación', () => {
  render(<PasoSuelo sueloAuto={null} onElegir={() => {}} />)
  expect(screen.getByText(/Prueba del bote/i)).toBeInTheDocument()
})

// Ejercita la rama con sueloAuto no nulo (antes solo se probaba con null) y de
// paso ancla el formato numérico en español: con coma decimal, no con punto.
test('con suelo automático muestra su pH con coma decimal', () => {
  const sueloAuto = sueloManual('franco', 6.5)
  render(<PasoSuelo sueloAuto={sueloAuto} onElegir={() => {}} />)
  expect(screen.getByText(/pH 6,5/)).toBeInTheDocument()
})

test('elegir una textura comunica un PerfilSuelo', async () => {
  const onElegir = vi.fn()
  render(<PasoSuelo sueloAuto={null} onElegir={onElegir} />)
  await userEvent.click(screen.getByRole('button', { name: /^Arcilloso/i }))
  expect(onElegir).toHaveBeenCalledWith(expect.objectContaining({ textura: 'arcilloso', drenaje: 'malo' }))
})
