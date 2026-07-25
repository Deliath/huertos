import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

const workflow = () => readFileSync('.github/workflows/deploy.yml', 'utf8')

test('el despliegue se dispara con los push a main y a mano', () => {
  const yml = workflow()
  expect(yml).toContain('branches: [main]')
  expect(yml).toContain('workflow_dispatch:')
})

test('el despliegue verifica antes de publicar', () => {
  const yml = workflow()
  expect(yml).toContain('npm ci')
  expect(yml).toContain('npm run lint')
  // No basta con "npm test" a secas: no distingue un archivo de test que
  // falló al arrancar de uno que pasó. Se exige la comprobación que sí lo
  // detecta.
  expect(yml).toContain('bash scripts/verificar-suite.sh')
  expect(yml).toContain('npm run build')
  // Publicar solo si la verificación pasó, y que sea justo el trabajo
  // "desplegar" el que dependa de "verificar" (no que la cadena esté
  // huérfana en cualquier otro sitio del archivo).
  expect(yml).toMatch(/desplegar:[\s\S]*needs: verificar/)
})

test('el despliegue usa los permisos mínimos y la misma versión de Node que el desarrollo', () => {
  const yml = workflow()
  expect(yml).toContain('contents: read')
  expect(yml).toContain('pages: write')
  expect(yml).toContain('id-token: write')
  expect(yml).toContain("node-version: '22'")
})

test('dos push seguidos no se pisan', () => {
  const yml = workflow()
  expect(yml).toContain('group: pages')
  expect(yml).toContain('cancel-in-progress: false')
})
