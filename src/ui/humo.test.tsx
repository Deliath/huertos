// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Humo } from './humo'

test('renderiza un componente React', () => {
  render(<Humo />)
  expect(screen.getByText('render-ok')).toBeInTheDocument()
})
