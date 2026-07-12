// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { svgAString } from './exportar'

test('serializa un svg incluyendo el namespace xmlns', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '10')
  const s = svgAString(svg)
  expect(s).toContain('http://www.w3.org/2000/svg')
  expect(s.startsWith('<svg')).toBe(true)
})
