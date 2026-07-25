# Plan de implementación — Publicación de Huertos en GitHub Pages

> **Para agentes ejecutores:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development` (recomendada) o `superpowers:executing-plans` para implementar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** poner la web de Huertos en `https://Deliath.github.io/huertos/`, con despliegue automático en cada push a `main`, cumpliendo las obligaciones de licencia y atribución que nacen de publicar.

**Arquitectura:** el repositorio `Deliath/huertos` (público) recibe un workflow de GitHub Actions que verifica (`lint` + `test` + `build`) y despliega `dist/` como artefacto de Pages. Vite compila con `base: '/huertos/'` porque la web cuelga de un subdirectorio. Antes de tocar nada del despliegue hay que estabilizar la suite de tests, porque al montar el workflow pasa a ser la puerta que bloquea la publicación.

**Pila:** React 19.2.7 + Vite 8.1.1, TypeScript ~6.0.2, Vitest 4.1.10, oxlint, GitHub Actions.

**Spec de referencia:** `docs/superpowers/specs/2026-07-25-publicacion-github-pages-design.md`

## Restricciones globales

Aplican a todas las tareas.

- **Node 22.** Entorno local: v22.23.1, npm 10.9.8. El workflow usa `actions/setup-node` con `node-version: 22`.
- **URL de publicación:** `https://Deliath.github.io/huertos/`. **`base` de Vite:** `'/huertos/'`.
- **Repositorio:** `Deliath/huertos`, **público**, rama publicada **`main`** (hoy la rama local se llama `master`).
- **Identidad de git:** `Eva <vamayanez@gmail.com>`. Ya está configurada y todo el historial reescrito con ella.
- **Licencias:** código MIT (`LICENSE` en la raíz); contenido CC BY-NC 4.0.
- **Sin analítica y sin dominio propio.**
- **Todo el texto de interfaz, comentarios y mensajes de commit en español.**
- **Sin CSS.** El proyecto no tiene hojas de estilo: usa estilos en línea. El rediseño visual es el proyecto 2 y **no se toca aquí**. Cualquier elemento nuevo se hace con el estilo actual, discreto.
- **No tocar `src/ui/PlanoBancal.tsx`.** El escalado de iconos está reservado al proyecto 2 (spec §9).
- **Convenciones de test del repo:**
  - `globals: false` — hay que importar siempre: `import { expect, test } from 'vitest'`.
  - Los tests que tocan el DOM llevan `// @vitest-environment jsdom` **en la primera línea**.
  - Los tests incluidos son `src/**/*.test.{ts,tsx}`. Un test de un script fuera de `src/` va igualmente en `src/`.
  - Hay precedente de tests que leen archivos del disco y comprueban su contenido (`src/seguridad.test.ts`). Se sigue ese patrón para los archivos de configuración y legales, que no son código ejecutable.
- **`tsc -b` solo typechequea `src/`, `vite.config.ts` y `vitest.config.ts`** (ver `tsconfig.app.json` y `tsconfig.node.json`). Lo que se ponga en `scripts/` no se typechequea: por eso ese directorio usa JavaScript ESM plano (`.mjs`), no TypeScript.

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `scripts/verificar-suite.sh` | Comprueba que la suite es fiable: 3 ejecuciones seguidas, todas verdes y sin archivos silenciosamente omitidos. |
| `scripts/generar-licencias.mjs` | Recorre las dependencias de producción y escribe `third-party-licenses.txt` en el directorio de salida. |
| `LICENSE` | Licencia MIT del código. |
| `README.md` | Qué es el proyecto, cómo se ejecuta y qué licencia cubre cada parte. |
| `src/proyecto.test.ts` | Comprueba que `LICENSE` y `README.md` existen y dicen lo que tienen que decir. |
| `src/licencias.test.ts` | Ejecuta el generador de licencias contra un directorio temporal y comprueba su salida. |
| `src/publicacion.test.ts` | Comprueba que `vite.config.ts` declara el `base` correcto. |
| `src/despliegue.test.ts` | Comprueba que el workflow de Pages existe y contiene lo imprescindible. |
| `src/ui/iconos-leaflet.ts` | Fija el icono de marcador por defecto de Leaflet a las imágenes empaquetadas. |
| `src/ui/iconos-leaflet.test.ts` | Test de lo anterior. |
| `src/ui/PieAtribuciones.tsx` | Pie de página con el aviso de privacidad, las atribuciones de las fuentes de datos y el enlace a los avisos de licencia. |
| `src/ui/PieAtribuciones.test.tsx` | Test de lo anterior. |
| `.github/workflows/deploy.yml` | Verificación y despliegue en GitHub Pages. |

**Se modifican:**

| Archivo | Cambio |
|---|---|
| `vitest.config.ts` | Acotar el número de trabajadores simultáneos. |
| `vite.config.ts` | Añadir `base: '/huertos/'`. |
| `package.json` | El script `build` pasa a generar también el aviso de licencias. |
| `src/ui/MapaSelector.tsx:1-6` | Llamar a `configurarIconoPorDefecto()`. |
| `src/ui/App.tsx:12` y `:125` | Sustituir `<AvisoPrivacidad />` por `<PieAtribuciones />`. |

---

### Tarea 1: Estabilizar la suite de tests

Es la primera porque el workflow convierte los tests en la puerta del despliegue. Hoy `npm test` **termina en 1** y deja hasta 7 de los 36 archivos sin ejecutar, sin avisar (spec §7.1). No falla ningún test: lo que falla es arrancar los procesos de trabajo de Vitest, por competencia de CPU al levantar 14 entornos `jsdom` a la vez.

**Archivos:**
- Crear: `scripts/verificar-suite.sh`
- Modificar: `vitest.config.ts`

**Interfaces:**
- Consume: nada.
- Produce: `bash scripts/verificar-suite.sh` — sale 0 si la suite es fiable, 1 si no. Las tareas siguientes lo usan como comprobación final antes de cada commit importante.

**Por qué el guion no comprueba «156 tests»:** ese número crece con cada tarea de este plan. Lo que hay que garantizar es que **no se omite ningún archivo en silencio**, así que el guion cuenta los archivos de test que hay en el disco y exige que Vitest ejecute exactamente esos.

- [ ] **Paso 1: Escribir el guion de verificación**

Crear `scripts/verificar-suite.sh`:

```bash
#!/usr/bin/env bash
# Comprueba que la suite de tests es fiable.
#
# El problema que vigila: cuando Vitest no consigue arrancar un proceso de
# trabajo, el archivo afectado no se ejecuta y el resumen no lo distingue de
# los que sí pasaron. Por eso no basta con mirar el código de salida: hay que
# comparar el número de archivos ejecutados con los que hay en el disco.
set -u

ejecuciones=${1:-3}
esperados=$(find src -name '*.test.ts' -o -name '*.test.tsx' | wc -l | tr -d ' ')
fallos=0

echo "Archivos de test en el disco: $esperados"
echo "Ejecuciones a realizar: $ejecuciones"
echo

for i in $(seq 1 "$ejecuciones"); do
  registro=$(mktemp)
  inicio=$SECONDS
  npm test >"$registro" 2>&1
  salida=$?
  duracion=$(( SECONDS - inicio ))

  # Vitest colorea la salida; se quitan los códigos ANSI antes de analizarla.
  limpio=$(mktemp)
  sed -E 's/\x1b\[[0-9;]*m//g' "$registro" >"$limpio"

  archivos=$(sed -nE 's/.*Test Files.*\(([0-9]+)\).*/\1/p' "$limpio" | tail -1)
  tests=$(sed -nE 's/.*[^A-Za-z]Tests +.*\(([0-9]+)\).*/\1/p' "$limpio" | tail -1)
  archivos=${archivos:-0}
  tests=${tests:-0}

  estado="OK"
  if [ "$salida" -ne 0 ]; then estado="FALLO (salida $salida)"; fi
  if [ "$archivos" -ne "$esperados" ]; then estado="FALLO (solo $archivos de $esperados archivos)"; fi

  printf 'Ejecución %s: %s — %s archivos, %s tests, %s s\n' "$i" "$estado" "$archivos" "$tests" "$duracion"

  if [ "$estado" != "OK" ]; then
    fallos=$(( fallos + 1 ))
    echo "  Registro completo en: $registro"
  else
    rm -f "$registro"
  fi
  rm -f "$limpio"
done

echo
if [ "$fallos" -ne 0 ]; then
  echo "La suite NO es fiable: $fallos de $ejecuciones ejecuciones no cumplen el criterio."
  exit 1
fi
echo "La suite es fiable: $ejecuciones de $ejecuciones ejecuciones correctas."
```

Darle permiso de ejecución:

```bash
chmod +x scripts/verificar-suite.sh
```

- [ ] **Paso 2: Ejecutar el guion sin tocar nada, para confirmar el problema**

Ejecutar: `bash scripts/verificar-suite.sh 2`

Esperado: **FALLA.** Debe informar de menos de 36 archivos en al menos una de las dos ejecuciones y salir con 1. Esto reproduce lo medido en la spec §7.1. Tarda unos 6 minutos.

Si por lo que sea sale OK las dos veces, ejecutarlo una tercera vez (`bash scripts/verificar-suite.sh 3`) antes de dar el problema por inexistente: es intermitente. Si sigue saliendo OK, saltar al paso 5 y dejar `vitest.config.ts` sin cambios, anotándolo en el mensaje de commit.

- [ ] **Paso 3: Acotar los trabajadores simultáneos**

Modificar `vitest.config.ts` para que quede así:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Los 14 archivos de interfaz levantan cada uno un entorno jsdom, que es
    // caro. Arrancarlos todos a la vez agota la CPU y Vitest acaba sin poder
    // crear los procesos de trabajo: los archivos afectados no se ejecutan y
    // el resumen no lo delata. Acotar los trabajadores lo evita sin
    // renunciar del todo al paralelismo.
    maxWorkers: 2,
  },
})
```

- [ ] **Paso 4: Verificar que ahora la suite es fiable**

Ejecutar: `bash scripts/verificar-suite.sh 3`

Esperado: **PASA** — las tres ejecuciones con 36 de 36 archivos y salida 0.

Si no pasa, subir por esta escalera en orden, repitiendo la verificación después de cada peldaño y quedándose con **el primero que pase**:

1. `maxWorkers: 1` (sustituye a `maxWorkers: 2`).
2. `maxWorkers: 2` más `pool: 'threads'`:
   ```ts
       pool: 'threads',
       maxWorkers: 2,
   ```
3. Red de seguridad, ya medida como verde pero lenta (17,5 min): `pool: 'threads'` más `fileParallelism: false`:
   ```ts
       pool: 'threads',
       fileParallelism: false,
   ```

Si se acaba en el peldaño 3, añadir este comentario encima para que quien lo lea sepa por qué:

```ts
    // Serializar los archivos es la única configuración que resultó fiable en
    // este equipo. Cuesta unos 17 minutos. Si en otro equipo `maxWorkers: 2`
    // resulta estable, es preferible.
```

- [ ] **Paso 5: Commit**

```bash
git add scripts/verificar-suite.sh vitest.config.ts
git commit -m "test: acotar los trabajadores de vitest para que la suite sea fiable"
```

---

### Tarea 2: Base path de Vite

**Archivos:**
- Crear: `src/publicacion.test.ts`
- Modificar: `vite.config.ts`

**Interfaces:**
- Consume: nada.
- Produce: el build emite rutas bajo `/huertos/`, y `import.meta.env.BASE_URL` vale `'/huertos/'` en producción. La tarea 5 usa `import.meta.env.BASE_URL` para enlazar el aviso de licencias.

**Nota sobre la spec:** §4.1 dice que `base` «no afecta a `npm run dev`». Con precisión: el servidor de desarrollo también pasa a servir bajo `/huertos/` y redirige `/` hacia allí. Es inocuo, pero conviene saberlo para no pensar que algo se ha roto.

**Sobre el test:** comprueba el texto de `vite.config.ts`, no el resultado del build, porque construir dentro de un test costaría decenas de segundos en cada ejecución. Es un guardarraíl contra borrados accidentales de una constante crítica; la comprobación real del comportamiento es el `npm run preview` del paso 5. Sigue el mismo patrón que `src/seguridad.test.ts`, que ya comprueba `index.html` leyéndolo del disco.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/publicacion.test.ts`:

```ts
import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

test('vite compila con el base path de GitHub Pages', () => {
  const config = readFileSync('vite.config.ts', 'utf8')
  expect(config).toContain("base: '/huertos/'")
})
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/publicacion.test.ts`

Esperado: FALLA, porque `vite.config.ts` todavía no declara `base`.

- [ ] **Paso 3: Añadir el base**

Modificar `vite.config.ts` para que quede así:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // La web se sirve desde https://Deliath.github.io/huertos/, es decir, desde
  // un subdirectorio y no desde la raíz del dominio. Sin esto, los recursos se
  // pedirían a /assets/… y darían 404 en producción.
  base: '/huertos/',
  plugins: [react()],
  server: {
    host: true,
  },
})
```

- [ ] **Paso 4: Ejecutar el test para ver que pasa**

Ejecutar: `npx vitest run src/publicacion.test.ts`

Esperado: PASA.

- [ ] **Paso 5: Comprobar el build real con la vista previa**

```bash
npm run build
npm run preview
```

Abrir la URL que imprime `preview` — debe ser `http://localhost:4173/huertos/`. Comprobar en el navegador:

1. La página carga con la pantalla de inicio (no en blanco).
2. En la pestaña Red del navegador, los `.js` y `.css` se piden a `/huertos/assets/…` y responden 200.
3. En la consola no hay errores de CSP ni 404.

Detener la vista previa con Ctrl-C.

- [ ] **Paso 6: Commit**

```bash
git add vite.config.ts src/publicacion.test.ts
git commit -m "build: compilar con el base path de GitHub Pages"
```

---

### Tarea 3: Licencia y README del proyecto

**Archivos:**
- Crear: `LICENSE`, `README.md`, `src/proyecto.test.ts`

**Interfaces:**
- Consume: nada.
- Produce: `LICENSE` en la raíz, que GitHub detecta y muestra en la portada del repositorio.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/proyecto.test.ts`:

```ts
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
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/proyecto.test.ts`

Esperado: FALLA con `ENOENT: no such file or directory, open 'LICENSE'`.

- [ ] **Paso 3: Escribir el LICENSE**

Crear `LICENSE`:

```
MIT License

Copyright (c) 2026 Eva

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Paso 4: Escribir el README**

Crear `README.md`:

````markdown
# Huertos

Planificador de huertos: dime dónde vives, qué bancales tienes y qué te gustaría
cultivar, y te propone un huerto con su plano, su calendario de siembra y sus
sinergias entre cultivos.

**Web publicada: https://Deliath.github.io/huertos/**

Funciona entero en el navegador. No hay servidor, no hay cuentas y no hay
analítica: los planes que guardes se quedan en el almacenamiento local de tu
navegador.

## Cómo ejecutarlo

Requiere Node 22.

```bash
npm install
npm run dev
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta la suite de tests. |
| `npm run lint` | Pasa oxlint. |
| `npm run build` | Compila a `dist/` y genera el aviso de licencias de terceros. |
| `npm run preview` | Sirve `dist/` tal y como se publicará, con el base path real. |
| `bash scripts/verificar-suite.sh` | Comprueba que la suite es fiable (3 ejecuciones seguidas). |

## Fuentes de datos

- Clima por coordenadas: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- Suelo por coordenadas: [SoilGrids, ISRIC](https://soilgrids.org/) (CC BY 4.0).
- Búsqueda de direcciones y mapa base: [OpenStreetMap](https://www.openstreetmap.org/copyright)
  vía Nominatim (ODbL).

## Licencias

Este repositorio tiene dos licencias distintas, según la parte:

- **El código** (todo lo que hay en `src/`, `scripts/` y la configuración) se
  publica bajo la licencia **MIT**. Ver [`LICENSE`](LICENSE).
- **El contenido** (el catálogo de cultivos, los datos curados de zonas
  climáticas y los textos de la interfaz) se publica bajo
  **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.es)**:
  se puede reutilizar citando la fuente, pero no con fines comerciales.

La web incluye código de terceros; sus avisos de licencia se generan durante el
build y se publican en
[`third-party-licenses.txt`](https://Deliath.github.io/huertos/third-party-licenses.txt).

Una nota para quien quiera reutilizar el proyecto: `react-leaflet` se distribuye
bajo la [Hippocratic License 2.1](https://firstdonoharm.dev/), que no está
aprobada por la OSI. No es copyleft y no afecta a la licencia de este código,
pero hay organizaciones que la rechazan por política. La alternativa sería usar
Leaflet directamente, que es BSD-2-Clause.
````

- [ ] **Paso 5: Ejecutar el test para ver que pasa**

Ejecutar: `npx vitest run src/proyecto.test.ts`

Esperado: PASA, los dos tests.

- [ ] **Paso 6: Commit**

```bash
git add LICENSE README.md src/proyecto.test.ts
git commit -m "docs: añadir licencia MIT y README con las licencias del proyecto"
```

---

### Tarea 4: Generar el aviso de licencias de terceros

MIT, BSD-2-Clause e Hippocratic-2.1 exigen las tres que quien recibe una copia del software reciba también el texto de la licencia y el aviso de copyright. El `dist/` se entrega a cada visitante, así que la obligación aplica y hoy se incumple (spec §6.3a).

Hay **29 paquetes de producción** en el árbol de dependencias, no solo los 5 directos: `jspdf` arrastra `canvg`, `html2canvas`, `core-js`, `dompurify` y compañía. El generador los recorre todos leyendo `package-lock.json`, para que la lista no se quede obsoleta al cambiar una dependencia.

**Archivos:**
- Crear: `scripts/generar-licencias.mjs`, `src/licencias.test.ts`
- Modificar: `package.json` (script `build`)

**Interfaces:**
- Consume: nada.
- Produce: `node scripts/generar-licencias.mjs <directorio>` escribe `<directorio>/third-party-licenses.txt`. Si no se pasa directorio, usa `dist`. La tarea 5 enlaza ese archivo desde el pie de página.

**Por qué `.mjs` y no TypeScript:** `tsc -b` solo cubre `src/` y los dos archivos de configuración, así que un `.ts` en `scripts/` no se typechequearía de todas formas, y un `.mjs` importado desde un test en `src/` daría error de tipos por falta de declaraciones. El test lo ejecuta como proceso, que además comprueba el guion tal y como lo invoca el build.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/licencias.test.ts`:

```ts
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

test('reconoce los archivos de licencia con nombre no estándar', () => {
  const destino = mkdtempSync(join(tmpdir(), 'licencias-'))
  execFileSync('node', ['scripts/generar-licencias.mjs', destino])
  const texto = readFileSync(join(destino, 'third-party-licenses.txt'), 'utf8')

  // stackblur-canvas guarda su licencia en LICENSE-MIT.txt. Un patrón que solo
  // acepte «LICENSE» o «LICENSE.» lo da por ausente y publica un enlace
  // genérico en lugar del aviso de copyright que MIT obliga a reproducir.
  expect(texto).toContain('stackblur-canvas')
  expect(texto).toContain('Copyright (c) 2010 Mario Klingemann')
  expect(texto).not.toMatch(/stackblur-canvas[\s\S]{0,400}no incluye un archivo de licencia/)
})

test('no se incluyen las dependencias de desarrollo, que no se distribuyen', () => {
  const destino = mkdtempSync(join(tmpdir(), 'licencias-'))
  execFileSync('node', ['scripts/generar-licencias.mjs', destino])
  const texto = readFileSync(join(destino, 'third-party-licenses.txt'), 'utf8')

  expect(texto).not.toContain('\nvitest ')
  expect(texto).not.toContain('\noxlint ')
  expect(texto).not.toContain('\njsdom ')
})
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/licencias.test.ts`

Esperado: FALLA — `Cannot find module '…/scripts/generar-licencias.mjs'`.

- [ ] **Paso 3: Escribir el generador**

Crear `scripts/generar-licencias.mjs`:

```js
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
  // El separador tras «license» puede ser un punto, un guion o un espacio:
  // stackblur-canvas la guarda en LICENSE-MIT.txt. Anclar solo al punto deja
  // fuera avisos de copyright que hay obligación de reproducir.
  const archivo = entradas.find((n) => /^(licen[cs]e|copying)([-_.\s]|$)/i.test(n))
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
```

- [ ] **Paso 4: Ejecutar los tests para ver que pasan**

Ejecutar: `npx vitest run src/licencias.test.ts`

Esperado: PASAN los tres.

- [ ] **Paso 5: Enganchar el generador al build**

Modificar el bloque `scripts` de `package.json` para que la línea `build` quede así:

```json
    "build": "tsc -b && vite build && node scripts/generar-licencias.mjs dist",
```

- [ ] **Paso 6: Comprobar que el build lo produce**

```bash
npm run build
head -20 dist/third-party-licenses.txt
grep -c '^====' dist/third-party-licenses.txt
```

Esperado: el encabezado dice «Paquetes incluidos: 29» y `grep` cuenta 58 líneas de separador (dos por paquete).

- [ ] **Paso 7: Commit**

```bash
git add scripts/generar-licencias.mjs src/licencias.test.ts package.json
git commit -m "build: generar el aviso de licencias de terceros al compilar"
```

---

### Tarea 5: Pie de página con las atribuciones

Hoy solo se atribuyen los tiles de OpenStreetMap. Faltan Open-Meteo (CC BY 4.0), SoilGrids/ISRIC (CC BY 4.0) y Nominatim (ODbL), y las tres lo exigen (spec §6.3b). Falta también el enlace al aviso de licencias que genera la tarea 4.

**Archivos:**
- Crear: `src/ui/PieAtribuciones.tsx`, `src/ui/PieAtribuciones.test.tsx`
- Modificar: `src/ui/App.tsx:12` (import) y `src/ui/App.tsx:125` (uso)

**Interfaces:**
- Consume: `AvisoPrivacidad` de `./AvisoPrivacidad` (se sigue usando tal cual, no se toca); `third-party-licenses.txt` de la tarea 4; `import.meta.env.BASE_URL` de la tarea 2.
- Produce: `export function PieAtribuciones(): JSX.Element`, sin props.

**Sobre el estilo:** discreto y en línea, igual que `AvisoPrivacidad` (`fontSize: 12, color: '#555'`). El pie definitivo se maqueta en el proyecto 2 (spec §9); aquí solo se cumple la obligación legal.

**Sobre el enlace:** usa `import.meta.env.BASE_URL`, que vale `'/huertos/'` en producción y `'/'` en los tests, de modo que la URL sale bien en los dos sitios sin condicionales.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/ui/PieAtribuciones.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PieAtribuciones } from './PieAtribuciones'

test('atribuye las tres fuentes de datos que lo exigen', () => {
  render(<PieAtribuciones />)
  expect(screen.getByRole('link', { name: /Open-Meteo/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /ISRIC/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /OpenStreetMap/i })).toBeInTheDocument()
})

test('indica la licencia de cada fuente', () => {
  render(<PieAtribuciones />)
  const pie = screen.getByRole('contentinfo')
  expect(pie).toHaveTextContent('CC BY 4.0')
  expect(pie).toHaveTextContent('ODbL')
})

test('enlaza los avisos de licencia de terceros', () => {
  render(<PieAtribuciones />)
  const enlace = screen.getByRole('link', { name: /licencias de terceros/i })
  expect(enlace).toHaveAttribute('href', expect.stringContaining('third-party-licenses.txt'))
})

test('indica la licencia del contenido y conserva el aviso de privacidad', () => {
  render(<PieAtribuciones />)
  const pie = screen.getByRole('contentinfo')
  expect(pie).toHaveTextContent('CC BY-NC 4.0')
  expect(pie).toHaveTextContent(/se guardan solo en este navegador/i)
})
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/ui/PieAtribuciones.test.tsx`

Esperado: FALLA — no se puede resolver `./PieAtribuciones`.

- [ ] **Paso 3: Escribir el componente**

Crear `src/ui/PieAtribuciones.tsx`:

```tsx
import { AvisoPrivacidad } from './AvisoPrivacidad'

// Open-Meteo y SoilGrids publican sus datos bajo CC BY 4.0, y Nominatim y los
// tiles del mapa bajo ODbL. Las tres licencias exigen atribución visible, así
// que este pie no es decorativo: es una obligación de publicar la web.
const estiloPie = { fontSize: 12, color: '#555', marginTop: 24, lineHeight: 1.6 }
const estiloLista = { listStyle: 'none', padding: 0, margin: '4px 0' }

export function PieAtribuciones() {
  const urlLicencias = `${import.meta.env.BASE_URL}third-party-licenses.txt`

  return (
    <footer style={estiloPie}>
      <hr />
      <AvisoPrivacidad />
      <p style={{ margin: '4px 0' }}>Datos de:</p>
      <ul style={estiloLista}>
        <li>
          Clima: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0)
        </li>
        <li>
          Suelo: <a href="https://soilgrids.org/" target="_blank" rel="noreferrer">SoilGrids — ISRIC</a> (CC BY 4.0)
        </li>
        <li>
          Mapa y direcciones: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> (ODbL)
        </li>
      </ul>
      <p style={{ margin: '4px 0' }}>
        Código bajo licencia MIT. Contenido bajo{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.es" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>.{' '}
        <a href={urlLicencias} target="_blank" rel="noreferrer">Licencias de terceros</a>.
      </p>
    </footer>
  )
}
```

- [ ] **Paso 4: Ejecutar el test para ver que pasa**

Ejecutar: `npx vitest run src/ui/PieAtribuciones.test.tsx`

Esperado: PASAN los cuatro.

- [ ] **Paso 5: Colgar el pie de la aplicación**

En `src/ui/App.tsx`, sustituir la línea 12:

```tsx
import { AvisoPrivacidad } from './AvisoPrivacidad'
```

por:

```tsx
import { PieAtribuciones } from './PieAtribuciones'
```

y colocar el pie **fuera de `<main>`**. Un `<footer>` solo adopta el rol de
región `contentinfo` si no desciende de `<main>`, y las atribuciones de todo el
sitio no son contenido principal. Para eso, envolver lo que hoy devuelve `App`
en un `<div>` que se queda con el estilo de centrado, dejando `<main>` sin
estilo propio: el resultado visual es idéntico.

Es decir, la estructura de `return` pasa de:

```tsx
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {/* … cuerpo … */}
      <AvisoPrivacidad />
    </main>
  )
```

a:

```tsx
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <main>
        {/* … el mismo cuerpo, sin ningún otro cambio … */}
      </main>
      <PieAtribuciones />
    </div>
  )
```

El cuerpo se reindenta un nivel, pero no cambia en nada más.

- [ ] **Paso 6: Ejecutar la suite entera**

Ejecutar: `bash scripts/verificar-suite.sh 1`

Esperado: PASA. `App.test.tsx` sigue verde porque el aviso de privacidad se sigue mostrando, ahora dentro del pie.

- [ ] **Paso 7: Commit**

```bash
git add src/ui/PieAtribuciones.tsx src/ui/PieAtribuciones.test.tsx src/ui/App.tsx
git commit -m "feat: pie con las atribuciones de las fuentes de datos y las licencias"
```

---

### Tarea 6: Iconos de marcador de Leaflet con base path

Leaflet deduce la ruta de sus imágenes de marcador a partir de la hoja de estilos, y ese mecanismo se rompe al empaquetar con un `base` distinto de la raíz. La spec lo recoge como riesgo (§7) y como punto 2 de la verificación (§8). Se ataca de forma preventiva: fijar las URL a los módulos importados es más robusto que depender de la deducción, y cuesta unas pocas líneas.

**Archivos:**
- Crear: `src/ui/iconos-leaflet.ts`, `src/ui/iconos-leaflet.test.ts`
- Modificar: `src/ui/MapaSelector.tsx:1-6`

**Interfaces:**
- Consume: `leaflet` y las tres imágenes de `leaflet/dist/images/`.
- Produce: `export function configurarIconoPorDefecto(): void`.

**Por qué un módulo aparte y no dentro de `MapaSelector.tsx`:** así el test no tiene que importar `react-leaflet` ni la hoja de estilos de Leaflet, y queda rápido y sin sorpresas.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/ui/iconos-leaflet.test.ts`:

```ts
// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { Icon } from 'leaflet'
import { configurarIconoPorDefecto } from './iconos-leaflet'

test('el marcador por defecto apunta a las imágenes empaquetadas', () => {
  configurarIconoPorDefecto()
  const opciones = Icon.Default.prototype.options
  expect(opciones.iconUrl).toMatch(/marker-icon/)
  expect(opciones.iconRetinaUrl).toMatch(/marker-icon-2x/)
  expect(opciones.shadowUrl).toMatch(/marker-shadow/)
})
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/ui/iconos-leaflet.test.ts`

Esperado: FALLA — no se puede resolver `./iconos-leaflet`.

- [ ] **Paso 3: Escribir el módulo**

Crear `src/ui/iconos-leaflet.ts`:

```ts
import { Icon } from 'leaflet'
import urlIcono from 'leaflet/dist/images/marker-icon.png?url'
import urlIconoRetina from 'leaflet/dist/images/marker-icon-2x.png?url'
import urlSombra from 'leaflet/dist/images/marker-shadow.png?url'

/**
 * Leaflet deduce las rutas de sus imágenes de marcador a partir de la hoja de
 * estilos, y esa deducción se rompe al servir la web desde un subdirectorio
 * (`base: '/huertos/'`): el marcador desaparece al pinchar en el mapa.
 * Importarlas como módulos hace que las resuelva Vite, que sí conoce el base.
 */
export function configurarIconoPorDefecto(): void {
  Icon.Default.mergeOptions({
    iconUrl: urlIcono,
    iconRetinaUrl: urlIconoRetina,
    shadowUrl: urlSombra,
  })
}
```

- [ ] **Paso 4: Ejecutar el test para ver que pasa**

Ejecutar: `npx vitest run src/ui/iconos-leaflet.test.ts`

Esperado: PASA.

Si TypeScript se queja de los imports `?url`, comprobar que `tsconfig.app.json` tiene `"types": ["vite/client", "node"]` — ahí es donde está declarado el módulo `*?url`. Debería estar ya.

- [ ] **Paso 5: Usarlo en el mapa**

En `src/ui/MapaSelector.tsx`, sustituir las líneas 1-5:

```tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
```

por:

```tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { configurarIconoPorDefecto } from './iconos-leaflet'

configurarIconoPorDefecto()
```

- [ ] **Paso 6: Comprobarlo en la vista previa, que es donde se ve de verdad**

```bash
npm run lint
npm run build
npm run preview
```

En `http://localhost:4173/huertos/`, entrar en el paso de ubicación, elegir ubicación precisa y **pinchar en el mapa**: debe aparecer el marcador azul con su sombra. En la pestaña Red, las tres imágenes deben pedirse a `/huertos/assets/…` y responder 200.

Detener la vista previa con Ctrl-C.

- [ ] **Paso 7: Commit**

```bash
git add src/ui/iconos-leaflet.ts src/ui/iconos-leaflet.test.ts src/ui/MapaSelector.tsx
git commit -m "fix: fijar los iconos de marcador de Leaflet para que funcionen bajo el base path"
```

---

### Tarea 7: Workflow de GitHub Actions

**Archivos:**
- Crear: `.github/workflows/deploy.yml`, `src/despliegue.test.ts`

**Interfaces:**
- Consume: los scripts `lint`, `test` y `build` de `package.json`.
- Produce: despliegue automático en cada push a `main`.

**Sobre el test:** un workflow no se puede ejecutar en local, así que el test comprueba que el archivo contiene lo que no puede faltar. Es un guardarraíl contra ediciones que rompan el despliegue en silencio, del mismo tipo que `src/seguridad.test.ts`.

**Requisito del token:** subir un archivo bajo `.github/workflows/` exige que el token de GitHub tenga el permiso **Workflows: Read and write** además de **Contents: Read and write**. Ya está confirmado.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/despliegue.test.ts`:

```ts
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
  expect(yml).toContain('npm test')
  expect(yml).toContain('npm run build')
  // Publicar solo si la verificación pasó.
  expect(yml).toContain('needs: verificar')
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
```

- [ ] **Paso 2: Ejecutar el test para ver que falla**

Ejecutar: `npx vitest run src/despliegue.test.ts`

Esperado: FALLA con `ENOENT` sobre `.github/workflows/deploy.yml`.

- [ ] **Paso 3: Escribir el workflow**

Crear `.github/workflows/deploy.yml`:

```yaml
name: Desplegar en GitHub Pages

on:
  push:
    branches: [main]
  # Permite volver a publicar a mano desde la pestaña Actions.
  workflow_dispatch:

# Permisos mínimos: leer el código y publicar en Pages, nada más.
permissions:
  contents: read
  pages: write
  id-token: write

# Dos push seguidos no deben pisarse. No se cancela el que esté en curso para
# no dejar un despliegue a medias.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      - name: Pasar el linter
        run: npm run lint

      - name: Ejecutar los tests
        run: npm test

      - name: Compilar
        run: npm run build

      - uses: actions/configure-pages@v5

      - name: Subir dist/ como artefacto de Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  desplegar:
    needs: verificar
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.despliegue.outputs.page_url }}
    steps:
      - name: Publicar
        id: despliegue
        uses: actions/deploy-pages@v4
```

- [ ] **Paso 4: Ejecutar el test para ver que pasa**

Ejecutar: `npx vitest run src/despliegue.test.ts`

Esperado: PASAN los cuatro.

- [ ] **Paso 5: Ejecutar la suite entera y el linter**

```bash
npm run lint
bash scripts/verificar-suite.sh 3
```

Esperado: los dos en verde. Esta es la última comprobación antes de que los tests pasen a bloquear la publicación, así que las **tres** ejecuciones importan.

- [ ] **Paso 6: Commit**

```bash
git add .github/workflows/deploy.yml src/despliegue.test.ts
git commit -m "ci: workflow de verificación y despliegue en GitHub Pages"
```

---

### Tarea 8: Publicar y verificar en vivo

Esta tarea no escribe código: conecta el repositorio local con GitHub y comprueba la web publicada. Los pasos marcados **[usuaria]** los tiene que dar Eva en la web de GitHub.

**Archivos:** ninguno.

**Interfaces:**
- Consume: todo lo anterior.
- Produce: `https://Deliath.github.io/huertos/` en marcha.

- [ ] **Paso 1: [usuaria] Hacer público el repositorio**

En `https://github.com/Deliath/huertos` → Settings → General → Danger Zone → *Change repository visibility* → Make public.

Es imprescindible: GitHub Pages en cuenta gratuita solo publica desde repositorios públicos. No se puede hacer desde aquí porque el token no tiene el permiso *Administration*.

Comprobar desde el terminal que ya es público:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.github.com/repos/Deliath/huertos
```

Esperado: `200` (sin autenticación). Si sale `404`, sigue privado.

- [ ] **Paso 2: Revisar que el historial no lleva secretos**

El repositorio pasa a ser público con todo su historial. Las tres APIs que usa el proyecto son gratuitas y sin clave, así que no debería haber nada, pero hay que verificarlo:

```bash
git log --all -p | grep -inE 'api[_-]?key|secret|password|token|Bearer [A-Za-z0-9]|github_pat_|ghp_' | head -40
```

Esperado: sin resultados, o solo coincidencias inocuas (por ejemplo la palabra «token» en un comentario). Revisar una a una las que salgan. Si apareciera un secreto real, **parar** y avisar antes de subir nada.

- [ ] **Paso 3: Renombrar la rama y añadir el remoto**

```bash
git branch -m master main
git remote add origin https://github.com/Deliath/huertos.git
git remote -v
```

Esperado: `origin` apuntando a `https://github.com/Deliath/huertos.git` para fetch y push, **sin ningún token en la URL** (el token vive en `~/.git-credentials`, no en `.git/config`).

- [ ] **Paso 4: Subir**

```bash
git push -u origin main
```

Esperado: sube los 90 y pico commits y deja `main` siguiendo a `origin/main`.

Si falla con `refusing to allow a Personal Access Token to create or update workflow`, es que al token le falta el permiso **Workflows: Read and write**: añadírselo en Settings → Developer settings → Personal access tokens, sin regenerarlo, y repetir el push.

- [ ] **Paso 5: [usuaria] Activar Pages**

En `https://github.com/Deliath/huertos` → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.

- [ ] **Paso 6: Ver el primer despliegue**

En la pestaña Actions del repositorio, el workflow «Desplegar en GitHub Pages» debe haberse disparado con el push. Esperar a que los dos trabajos terminen en verde.

Si `verificar` falla en `npm test`, mirar cuántos archivos ejecutó: si son menos de los que hay, el ejecutor de GitHub también sufre el problema de CPU y hay que bajar `maxWorkers` a 1 en `vitest.config.ts` (o poner `fileParallelism: false`), commitear y volver a empujar.

- [ ] **Paso 7: Verificar la web publicada**

Sobre `https://Deliath.github.io/huertos/`, **en escritorio y en móvil**, la lista de la spec §8:

1. [ ] La página carga y muestra la pantalla de inicio.
2. [ ] El mapa muestra los tiles de OpenStreetMap y **el marcador aparece al pinchar**.
3. [ ] La búsqueda por dirección devuelve resultados.
4. [ ] Con ubicación precisa se obtienen clima y suelo por coordenadas.
5. [ ] El resultado dibuja el plano de los bancales con sus cotas.
6. [ ] Se guarda un plan, se recarga la página y el plan sigue ahí.
7. [ ] Las descargas de PNG y de PDF funcionan.
8. [ ] No hay errores de CSP en la consola del navegador.
9. [ ] El pie muestra las atribuciones de Open-Meteo, SoilGrids/ISRIC y OpenStreetMap, y el enlace «Licencias de terceros» abre un archivo que contiene los textos de MIT, BSD-2-Clause e Hippocratic-2.1.

Si algo falla, anotarlo y arreglarlo antes de dar el proyecto por cerrado. El punto 2 es el que más papeletas tiene, pese a la tarea 6.

- [ ] **Paso 8: Dejar constancia**

Actualizar el estado de la spec: en `docs/superpowers/specs/2026-07-25-publicacion-github-pages-design.md`, cambiar la línea 4 por:

```markdown
**Estado:** Implementado — publicado en https://Deliath.github.io/huertos/
```

```bash
git add docs/superpowers/specs/2026-07-25-publicacion-github-pages-design.md
git commit -m "docs: marcar la spec de publicación como implementada"
git push
```

---

## Cobertura de la spec

| Sección de la spec | Dónde se implementa |
|---|---|
| §3 rama `main`, repo público | Tarea 8, pasos 1 y 3 |
| §4.1 `base: '/huertos/'` | Tarea 2 |
| §4.2 workflow con dos trabajos, permisos, concurrencia, Node 22 | Tarea 7 |
| §4.3 los tests como puerta del despliegue | Tarea 1 (prerrequisito) y tarea 7 |
| §5 compatibilidades verificadas | Ya comprobadas en la spec; no requieren código |
| §6.3a avisos de licencia de terceros | Tarea 4 (generación) y tarea 5 (enlace) |
| §6.3b atribución de las fuentes de datos | Tarea 5 |
| §6.4 MIT y CC BY-NC 4.0 | Tarea 3 |
| §7 riesgo de los iconos de Leaflet | Tarea 6 |
| §7 riesgo de rutas rotas | Tarea 2, paso 5 (vista previa) |
| §7 riesgo de historial con secretos | Tarea 8, paso 2 |
| §7.1 suite inestable | Tarea 1 |
| §8 verificación | Tarea 2 paso 5, tarea 6 paso 6, tarea 8 paso 7 |
| §9 punto de partida del proyecto 2 | Fuera de alcance, por diseño |
