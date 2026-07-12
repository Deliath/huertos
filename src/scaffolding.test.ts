import { expect, test } from 'vitest'
import { saludo } from './index'

test('el scaffolding compila y ejecuta tests', () => {
  expect(saludo()).toBe('huertos-ok')
})
