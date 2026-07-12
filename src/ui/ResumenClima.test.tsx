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

test('marca los meses con riesgo de helada (mínima < 0,5 °C)', () => {
  render(<ResumenClima clima={climaDeZona('montana')} mesActual={6} />) // ene -3, feb -2 → helada
  expect(screen.getByRole('columnheader', { name: /Ene/i })).toHaveAttribute('data-helada', 'true')
  expect(screen.getByRole('columnheader', { name: /Jul/i })).not.toHaveAttribute('data-helada', 'true')
})

test('sin meses de helada, lo indica y no marca ninguno', () => {
  render(<ResumenClima clima={climaDeZona('canarias')} mesActual={0} />)
  expect(screen.getByText(/sin.*helada/i)).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: /Ene/i })).not.toHaveAttribute('data-helada', 'true')
})
