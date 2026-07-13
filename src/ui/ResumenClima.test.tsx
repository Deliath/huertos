// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ResumenClima } from './ResumenClima'
import { climaDeZona } from '../dominio/clima'

test('muestra las medias y las mínimas de los 12 meses', () => {
  render(<ResumenClima clima={climaDeZona('mediterraneo_litoral')} mesActual={6} />)
  expect(screen.getAllByRole('columnheader')).toHaveLength(12)
  expect(screen.getByRole('rowheader', { name: /Media/i })).toBeInTheDocument()
  expect(screen.getByRole('rowheader', { name: /Mínima/i })).toBeInTheDocument()
})

test('resalta el mes actual', () => {
  render(<ResumenClima clima={climaDeZona('mediterraneo_litoral')} mesActual={6} />) // julio
  expect(screen.getByRole('columnheader', { name: /Jul/i })).toHaveAttribute('aria-current', 'date')
  expect(screen.getByRole('columnheader', { name: /Ene/i })).not.toHaveAttribute('aria-current')
})

test('marca los meses dentro de la ventana de heladas', () => {
  render(<ResumenClima clima={climaDeZona('montana')} mesActual={6} />) // ultima=4, primera=9
  expect(screen.getByRole('columnheader', { name: /Ene/i })).toHaveAttribute('data-helada', 'true')
  expect(screen.getByRole('columnheader', { name: /Jul/i })).not.toHaveAttribute('data-helada', 'true')
})

test('marca meses de helada por la ventana aunque la mínima media sea > 0,5 °C (Madrid)', () => {
  const madrid = {
    id: 'coordenadas', nombre: 'Ubicación precisa',
    tempMediaMensual: [6, 8, 11, 13, 17, 23, 26, 26, 21, 15, 10, 7],
    tempMinMensual: [2, 3, 5, 8, 11, 15, 18, 18, 15, 10, 5, 3], // todas > 0,5 °C
    mesUltimaHelada: 2, mesPrimeraHelada: 10, // marzo / noviembre
  }
  render(<ResumenClima clima={madrid} mesActual={6} />)
  expect(screen.getByRole('columnheader', { name: /Ene/i })).toHaveAttribute('data-helada', 'true')
  expect(screen.getByRole('columnheader', { name: /Mar/i })).toHaveAttribute('data-helada', 'true')
  expect(screen.getByRole('columnheader', { name: /Nov/i })).toHaveAttribute('data-helada', 'true')
  expect(screen.getByRole('columnheader', { name: /Jul/i })).not.toHaveAttribute('data-helada', 'true')
})

test('sin meses de helada, lo indica y no marca ninguno', () => {
  render(<ResumenClima clima={climaDeZona('canarias')} mesActual={0} />)
  expect(screen.getByText(/sin.*helada/i)).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: /Ene/i })).not.toHaveAttribute('data-helada', 'true')
})
