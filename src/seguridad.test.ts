import { expect, test } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return archivosFuente(p)
    return /\.tsx?$/.test(n) ? [p] : []
  })
}

test('no se usa dangerouslySetInnerHTML en ningún componente', () => {
  const ofensores = archivosFuente('src')
    .filter((f) => f !== join('src', 'seguridad.test.ts'))
    .filter((f) => readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML'))
  expect(ofensores).toEqual([])
})

test('index.html declara una CSP con los orígenes permitidos', () => {
  const html = readFileSync('index.html', 'utf8')
  expect(html).toContain('Content-Security-Policy')
  expect(html).toContain('climate-api.open-meteo.com')
  expect(html).toContain('rest.isric.org')
  expect(html).toContain('nominatim.openstreetmap.org')
  expect(html).toContain('tile.openstreetmap.org')
})
