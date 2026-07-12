// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { EditorBancales } from './EditorBancales'

test('añadir un bancal válido llama a onAñadir con medidas numéricas', async () => {
  const onAñadir = vi.fn()
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={onAñadir} onBorrar={() => {}} onOrientacion={() => {}} />)
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  expect(onAñadir).toHaveBeenCalledWith(expect.objectContaining({ anchoM: 2, largoM: 3 }))
})

test('no añade con medidas a cero', async () => {
  const onAñadir = vi.fn()
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={onAñadir} onBorrar={() => {}} onOrientacion={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  expect(onAñadir).not.toHaveBeenCalled()
})
