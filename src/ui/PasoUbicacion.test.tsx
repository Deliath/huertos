// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PasoUbicacion } from './PasoUbicacion'

test('elegir una zona climática entrega su perfil sin suelo automático', async () => {
  const onListo = vi.fn()
  render(<PasoUbicacion onListo={onListo} />)
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ modo: 'zona', zonaId: 'mediterraneo_litoral', sueloAuto: null }))
})
