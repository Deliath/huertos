import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

test('vite compila con el base path de GitHub Pages', () => {
  const config = readFileSync('vite.config.ts', 'utf8')
  expect(config).toContain("base: '/huertos/'")
})
