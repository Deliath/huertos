// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PieAtribuciones } from './PieAtribuciones'

test('atribuye las tres fuentes de datos que lo exigen', () => {
  render(<PieAtribuciones />)
  expect(screen.getByRole('link', { name: /Open-Meteo/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /ISRIC/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /OpenStreetMap/i })).toBeInTheDocument()
})

test('indica la licencia de cada fuente', () => {
  render(<PieAtribuciones />)
  const pie = screen.getByRole('contentinfo')
  expect(pie).toHaveTextContent('CC BY 4.0')
  expect(pie).toHaveTextContent('ODbL')
})

test('enlaza los avisos de licencia de terceros', () => {
  render(<PieAtribuciones />)
  const enlace = screen.getByRole('link', { name: /licencias de terceros/i })
  expect(enlace).toHaveAttribute('href', expect.stringContaining('third-party-licenses.txt'))
})

test('indica la licencia del contenido y conserva el aviso de privacidad', () => {
  render(<PieAtribuciones />)
  const pie = screen.getByRole('contentinfo')
  expect(pie).toHaveTextContent('CC BY-NC 4.0')
  expect(pie).toHaveTextContent(/se guardan solo en este navegador/i)
})
