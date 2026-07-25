#!/usr/bin/env node
// Genera el aviso de licencias de terceros que se entrega junto a la web.
//
// MIT, BSD-2-Clause e Hippocratic-2.1 exigen que quien recibe una copia del
// software reciba también el texto de la licencia y el aviso de copyright.
// El dist/ se sirve a cada visitante, así que la obligación aplica.
//
// Uso: node scripts/generar-licencias.mjs [directorio-destino]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.cwd()
const PREFIJO = 'node_modules/'
const destino = process.argv[2] ?? 'dist'
const salida = join(destino, 'third-party-licenses.txt')

const lock = JSON.parse(readFileSync(join(RAIZ, 'package-lock.json'), 'utf8'))

// Las dependencias de desarrollo (vite, vitest, oxlint, tipos…) no acaban en
// dist/, así que no se distribuyen y no imponen obligaciones sobre la web.
const paquetes = Object.entries(lock.packages)
  .filter(([ruta, info]) => ruta.startsWith(PREFIJO) && !info.dev && !info.devOptional)
  .map(([ruta, info]) => ({
    // Las dependencias anidadas viven en rutas como
    // node_modules/a/node_modules/b; el nombre es lo que va tras el último.
    nombre: ruta.slice(ruta.lastIndexOf(PREFIJO) + PREFIJO.length),
    ruta,
    version: info.version ?? 'sin versión',
    licencia: info.license ?? 'sin declarar',
  }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre))

function textoLicencia(ruta) {
  let entradas
  try {
    entradas = readdirSync(join(RAIZ, ruta))
  } catch {
    return null
  }
  const archivo = entradas.find((n) => /^(licen[cs]e|copying)(\.|$)/i.test(n))
  return archivo ? readFileSync(join(RAIZ, ruta, archivo), 'utf8').trimEnd() : null
}

const separador = '='.repeat(72)

const bloques = paquetes.map((p) => {
  const texto = textoLicencia(p.ruta)
  const cuerpo = texto ?? [
    `El paquete no incluye un archivo de licencia en su distribución.`,
    `Se declara bajo «${p.licencia}»; el texto completo de esa licencia está`,
    `disponible en https://spdx.org/licenses/`,
  ].join('\n')
  return `${separador}\n${p.nombre} ${p.version}\nLicencia declarada: ${p.licencia}\n${separador}\n\n${cuerpo}\n`
})

const encabezado = `Avisos de licencia de terceros
==============================

Esta web incluye código de los proyectos de software libre que se listan a
continuación. Se reproduce el aviso de copyright y el texto de licencia de
cada uno, tal y como exigen sus condiciones.

El código propio de Huertos se publica bajo licencia MIT; su contenido, bajo
CC BY-NC 4.0. Ver https://github.com/Deliath/huertos

Paquetes incluidos: ${paquetes.length}
`

mkdirSync(destino, { recursive: true })
writeFileSync(salida, `${encabezado}\n${bloques.join('\n')}`, 'utf8')
console.log(`Escrito ${salida} con ${paquetes.length} paquetes.`)
