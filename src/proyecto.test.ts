import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

test('el código se publica con licencia MIT', () => {
  const licencia = readFileSync('LICENSE', 'utf8')
  expect(licencia).toContain('MIT License')
  expect(licencia).toContain('Eva')
  expect(licencia).toContain('Permission is hereby granted, free of charge')
})

test('el README distingue la licencia del código de la del contenido', () => {
  const readme = readFileSync('README.md', 'utf8')
  expect(readme).toContain('https://Deliath.github.io/huertos/')
  expect(readme).toContain('MIT')
  expect(readme).toContain('CC BY-NC 4.0')
})
