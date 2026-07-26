// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
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

test('el grupo de orientación tiene la etiqueta accesible correcta y permite elegir el norte', async () => {
  const onOrientacion = vi.fn()
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={() => {}} onBorrar={() => {}} onOrientacion={onOrientacion} />)
  const grupo = screen.getByRole('group', { name: /¿Hacia dónde está el norte\?/i })
  const radioSur = within(grupo).getByRole('radio', { name: /sur/i })
  expect(radioSur).toBeInTheDocument()
  await userEvent.click(radioSur)
  expect(onOrientacion).toHaveBeenCalledWith('sur')
})

test('muestra una vista previa del bancal al introducir dimensiones', async () => {
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={() => {}} onBorrar={() => {}} onOrientacion={() => {}} />)
  expect(screen.queryByRole('img', { name: /nuevo bancal/i })).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  expect(screen.getByRole('img', { name: /nuevo bancal/i })).toBeInTheDocument()
})

test('las miniaturas comparten escala: un bancal el doble de grande se ve el doble', () => {
  const bancales = [
    { id: 'b1', nombre: 'Grande', anchoM: 2, largoM: 1 },
    { id: 'b2', nombre: 'Pequeño', anchoM: 1, largoM: 0.5 },
  ]
  render(<EditorBancales bancales={bancales} orientacionNorte="norte" onAñadir={() => {}} onBorrar={() => {}} onOrientacion={() => {}} />)
  const anchoPx = (nombre: RegExp) => parseFloat(getComputedStyle(screen.getByRole('img', { name: nombre })).maxWidth)
  // "Grande" (2×1) tiene el doble de lado que "Pequeño" (1×0,5): a escala común, el doble de píxeles.
  expect(anchoPx(/Plano del Grande/i)).toBeCloseTo(2 * anchoPx(/Plano del Pequeño/i), 1)
})

test('cada bancal añadido muestra su miniatura', () => {
  const bancales = [
    { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 3 },
    { id: 'b2', nombre: 'Bancal 2', anchoM: 1, largoM: 1 },
  ]
  render(<EditorBancales bancales={bancales} orientacionNorte="norte" onAñadir={() => {}} onBorrar={() => {}} onOrientacion={() => {}} />)
  expect(screen.getByRole('img', { name: /Plano del Bancal 1/i })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Plano del Bancal 2/i })).toBeInTheDocument()
})
