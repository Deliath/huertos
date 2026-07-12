// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PasoSuelo } from './PasoSuelo'

test('sin suelo automático muestra la guía de experimentación', () => {
  render(<PasoSuelo sueloAuto={null} onElegir={() => {}} />)
  expect(screen.getByText(/Prueba del bote/i)).toBeInTheDocument()
})

test('elegir una textura comunica un PerfilSuelo', async () => {
  const onElegir = vi.fn()
  render(<PasoSuelo sueloAuto={null} onElegir={onElegir} />)
  await userEvent.click(screen.getByRole('button', { name: /^Arcilloso/i }))
  expect(onElegir).toHaveBeenCalledWith(expect.objectContaining({ textura: 'arcilloso', drenaje: 'malo' }))
})
