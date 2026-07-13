// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import { App } from './App'

beforeEach(() => localStorage.clear())

test('flujo por zona climática hasta ver el resultado', async () => {
  render(<App mesActual={5} />) // junio, fijo para el test
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))

  // Ubicación por zona
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))

  // Confirmación de ubicación (clima + suelo)
  await userEvent.click(screen.getByRole('button', { name: /Continuar/i }))

  // Bancales
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Suelo
  await userEvent.click(screen.getByRole('button', { name: /^Franco/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Especies
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  await userEvent.click(screen.getByRole('button', { name: /Ver mi huerto/i }))

  // Resultado
  expect(await screen.findByText(/Cosecha estimada/i)).toBeInTheDocument()
})

// Lleva la app hasta la pantalla de resultados con un plan mínimo por zona.
async function llegarAResultados() {
  render(<App mesActual={3} />)
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))

  // Ubicación por zona
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))

  // Confirmación de ubicación (clima + suelo)
  await userEvent.click(screen.getByRole('button', { name: /Continuar/i }))

  // Bancales
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Suelo
  await userEvent.click(screen.getByRole('button', { name: /^Franco/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Especies
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  await userEvent.click(screen.getByRole('button', { name: /Ver mi huerto/i }))

  expect(await screen.findByText(/Cosecha estimada/i)).toBeInTheDocument()
}

test('guardar pide nombre y persiste un plan que luego aparece en la lista', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar().map((p) => p.nombre)).toContain('Mi terraza')
  expect(await screen.findByText(/Guardado ✓/i)).toBeInTheDocument()
})

test('reguardar con el mismo nombre actualiza en vez de duplicar', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar()).toHaveLength(1)
})
