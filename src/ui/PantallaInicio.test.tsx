// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PantallaInicio } from './PantallaInicio'

test('muestra la referencia a la licencia CC BY-NC 4.0', () => {
  render(<PantallaInicio onEmpezar={() => {}} />)
  const enlace = screen.getByRole('link', { name: /CC BY-NC 4\.0/i })
  expect(enlace).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nc/4.0/')
})
