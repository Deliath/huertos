import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('el generador reúne los avisos de licencia de las dependencias de producción', () => {
  const destino = mkdtempSync(join(tmpdir(), 'licencias-'))
  execFileSync('node', ['scripts/generar-licencias.mjs', destino])
  const texto = readFileSync(join(destino, 'third-party-licenses.txt'), 'utf8')

  // Una de cada licencia distinta que se distribuye.
  expect(texto).toContain('react 19.2.7')
  expect(texto).toContain('Permission is hereby granted, free of charge')
  expect(texto).toContain('leaflet 1.9.4')
  expect(texto).toContain('BSD 2-Clause License')
  expect(texto).toContain('react-leaflet 5.0.0')
  expect(texto).toContain('Hippocratic License')

  // Dependencias transitivas: jspdf arrastra muchas y también cuentan.
  expect(texto).toContain('html2canvas')
  expect(texto).toContain('dompurify')
})

test('un paquete sin archivo de licencia aparece igualmente, con su identificador', () => {
  const destino = mkdtempSync(join(tmpdir(), 'licencias-'))
  execFileSync('node', ['scripts/generar-licencias.mjs', destino])
  const texto = readFileSync(join(destino, 'third-party-licenses.txt'), 'utf8')

  // stackblur-canvas se declara MIT en su package.json pero no incluye el
  // archivo. Omitirlo sería peor que anotar la carencia.
  expect(texto).toContain('stackblur-canvas')
  expect(texto).toMatch(/stackblur-canvas[\s\S]{0,400}no incluye un archivo de licencia/)
})

test('no se incluyen las dependencias de desarrollo, que no se distribuyen', () => {
  const destino = mkdtempSync(join(tmpdir(), 'licencias-'))
  execFileSync('node', ['scripts/generar-licencias.mjs', destino])
  const texto = readFileSync(join(destino, 'third-party-licenses.txt'), 'utf8')

  expect(texto).not.toContain('\nvitest ')
  expect(texto).not.toContain('\noxlint ')
  expect(texto).not.toContain('\njsdom ')
})
