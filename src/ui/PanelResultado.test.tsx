// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { PanelResultado } from './PanelResultado'
import { proponerHuerto } from '../app/proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]

const propsBase = { bancales, orientacionNorte: 'norte' as const, modoIntercalado: 'bloques' as const, onModoIntercalado: () => {}, onAjustarCantidad: () => {} }

test('muestra el resumen de cosecha del tomate en kg', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  // Calendario + cosecha + leyenda del bancal.
  expect(screen.getAllByText(/Tomate/i)).toHaveLength(3)
  expect(screen.getByText(/kg/i)).toBeInTheDocument()
})

test('la leyenda muestra cantidad y marco de plantación por especie', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  const leyenda = within(screen.getByRole('list', { name: /Plantas en B1/i }))
  expect(leyenda.getByText(/50 × 60 cm/)).toBeInTheDocument() // marco del tomate
  expect(leyenda.getByText('6')).toBeInTheDocument() // 6 tomateras en 2×3 m
})

test('el botón + pide una planta más y el − una menos', async () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const onAjustarCantidad = vi.fn()
  render(<PanelResultado propuesta={propuesta} {...propsBase} onAjustarCantidad={onAjustarCantidad} />)
  await userEvent.click(screen.getByRole('button', { name: /Añadir Tomate/i }))
  expect(onAjustarCantidad).toHaveBeenCalledWith('b1', 'tomate', 7)
  await userEvent.click(screen.getByRole('button', { name: /Quitar Tomate/i }))
  expect(onAjustarCantidad).toHaveBeenCalledWith('b1', 'tomate', 5)
})

test('el botón + se deshabilita cuando no cabe ni una planta más', () => {
  const mini: Bancal[] = [{ id: 'b1', nombre: 'Mini', anchoM: 0.4, largoM: 0.4 }]
  const propuesta = proponerHuerto(clima, suelo, 5, mini, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} bancales={mini} />)
  expect(screen.getByRole('button', { name: /Añadir Tomate/i })).toBeDisabled()
})

test('el selector de intercalado notifica el modo elegido', async () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const onModoIntercalado = vi.fn()
  render(<PanelResultado propuesta={propuesta} {...propsBase} onModoIntercalado={onModoIntercalado} />)
  await userEvent.click(screen.getByRole('radio', { name: /Solo compañeras/i }))
  expect(onModoIntercalado).toHaveBeenCalledWith('companeras')
})

test('muestra el aviso de recorte cuando no caben las plantas pedidas', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 999 } })
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  expect(screen.getByText(/no caben 979 Tomate con las distancias requeridas/i)).toBeInTheDocument()
})
