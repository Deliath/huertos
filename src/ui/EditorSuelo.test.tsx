// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { EditorSuelo } from './EditorSuelo'

test('prefill con el suelo detectado; editar textura y pH devuelve el perfil', async () => {
  const onCambio = vi.fn()
  render(<EditorSuelo inicial={{ textura: 'franco', ph: 6.8, drenaje: 'medio' }} onCambio={onCambio} />)
  const selector = screen.getByLabelText(/Tipo de suelo/i)
  expect(selector).toHaveValue('franco')

  await userEvent.selectOptions(selector, 'arcilloso')
  expect(onCambio).toHaveBeenLastCalledWith(expect.objectContaining({ textura: 'arcilloso', drenaje: 'malo' }))

  const phInput = screen.getByLabelText(/pH/i)
  await userEvent.clear(phInput)
  await userEvent.type(phInput, '7.2')
  expect(onCambio).toHaveBeenLastCalledWith(expect.objectContaining({ textura: 'arcilloso', ph: 7.2 }))
})

test('sin suelo inicial arranca en "(sin especificar)" y emite null', async () => {
  const onCambio = vi.fn()
  render(<EditorSuelo inicial={null} onCambio={onCambio} />)
  const selector = screen.getByLabelText(/Tipo de suelo/i)
  expect(selector).toHaveValue('')
  await userEvent.selectOptions(selector, 'arenoso')
  expect(onCambio).toHaveBeenLastCalledWith(expect.objectContaining({ textura: 'arenoso' }))
  await userEvent.selectOptions(selector, '')
  expect(onCambio).toHaveBeenLastCalledWith(null)
})
