# Huertos — Núcleo (datos + dominio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la capa de datos (catálogo de cultivos, zonas climáticas, suelos) y el "cerebro" (`dominio/*`) como una librería TypeScript pura, totalmente probada con TDD, sin interfaz.

**Architecture:** Proyecto Vite + React + TypeScript (la UI llega en el Plan 2). Todo el dominio son funciones puras sin dependencias de React, agrupadas por responsabilidad. Los servicios que hablan con APIs externas (clima por coordenadas, suelo por coordenadas) se parten en una función de *parseo* pura y testeable + un envoltorio `fetch` fino, ambos detrás de una interfaz con una implementación alternativa offline (zona climática / suelo indicado a mano).

**Tech Stack:** TypeScript, Vite, Vitest. Sin dependencias de red en los tests (se usan fixtures). Sin librerías de UI en este plan.

## Global Constraints

- **Lenguaje del código y comentarios:** español para nombres de dominio (cultivos, bancal, idoneidad…) y textos de usuario; inglés solo si algún término técnico es más claro. Coherente con el dominio del spec.
- **TypeScript estricto:** `strict: true` en `tsconfig`. Nada de `any` implícito.
- **Sin claves de API en el código** (spec §13). Los servicios externos usados son sin clave (Open-Meteo, SoilGrids).
- **Sin secretos, sin analítica, sin llamadas de red en tests.**
- **TDD siempre:** test que falla → mínima implementación → test que pasa → commit.
- **Catálogo semilla del MVP:** al menos 8 cultivos reales bien cargados; el resto (~30-50) es carga de datos posterior siguiendo el mismo esquema.
- **Zonas climáticas curadas de España** (spec §3): mínimo 6 (mediterráneo litoral, interior continental, norte atlántico, montaña, sur árido/subtropical, Canarias).
- **Meses:** índice 0 = enero … 11 = diciembre en todo el dominio.

---

## File Structure

- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` — configuración.
- `src/dominio/tipos.ts` — todos los tipos del dominio (fuente única de la verdad).
- `src/datos/cultivos.ts` — catálogo semilla de cultivos + helpers de acceso.
- `src/datos/zonas-climaticas.ts` — zonas climáticas curadas con su perfil.
- `src/datos/suelos.ts` — tipos de suelo y guía de experimentación.
- `src/dominio/clima.ts` — servicio de clima (interfaz + impl zona + impl coordenadas).
- `src/dominio/suelo.ts` — servicio de suelo (interfaz + impl manual + impl coordenadas).
- `src/dominio/idoneidad.ts` — idoneidad clima+época+suelo, con puntuación y consejos.
- `src/dominio/sinergias.ts` — evaluación de sinergias + sugerencia de compañeras extra.
- `src/dominio/sugerencia.ts` — "hazme tú una sugerencia".
- `src/dominio/colocacion.ts` — colocación priorizada en bancales.
- `src/dominio/calendario.ts` — calendario de siembra/trasplante/cosecha.
- `src/dominio/cosecha.ts` — estimación de cosecha.
- `src/almacenamiento/almacen.ts` — interfaz de guardado + impl localStorage.
- Tests junto a cada módulo: `*.test.ts`.

---

## Task 1: Scaffolding del proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `src/index.ts`
- Test: `src/scaffolding.test.ts`

**Interfaces:**
- Produces: proyecto compilable con `npm test` funcionando (Vitest).

- [ ] **Step 1: Crear el proyecto Vite (plantilla react-ts) e instalar Vitest**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest
```

- [ ] **Step 2: Configurar Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
})
```

Añadir a `package.json` en `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Asegurar `strict` en tsconfig**

En `tsconfig.json` (o `tsconfig.app.json` según la plantilla), confirmar `"strict": true`. Añadirlo si no está.

- [ ] **Step 4: Escribir un test de humo que falla**

Create `src/scaffolding.test.ts`:

```ts
import { expect, test } from 'vitest'
import { saludo } from './index'

test('el scaffolding compila y ejecuta tests', () => {
  expect(saludo()).toBe('huertos-ok')
})
```

- [ ] **Step 5: Ejecutar y verificar que falla**

Run: `npm test`
Expected: FAIL — `saludo` no existe / módulo no encontrado.

- [ ] **Step 6: Implementación mínima**

Create `src/index.ts`:

```ts
export function saludo(): string {
  return 'huertos-ok'
}
```

- [ ] **Step 7: Ejecutar y verificar que pasa**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig*.json vite.config.ts vitest.config.ts src/index.ts src/scaffolding.test.ts package-lock.json
git commit -m "chore: scaffolding Vite+React+TS con Vitest"
```

---

## Task 2: Tipos del dominio

**Files:**
- Create: `src/dominio/tipos.ts`
- Test: `src/dominio/tipos.test.ts`

**Interfaces:**
- Produces: todos los tipos usados por el resto del plan (ver bloque de código). Los tipos son la referencia exacta de nombres para las tareas siguientes.

- [ ] **Step 1: Escribir un test que fija la forma de un `Cultivo` válido**

Create `src/dominio/tipos.test.ts`:

```ts
import { expect, test } from 'vitest'
import type { Cultivo } from './tipos'

test('un Cultivo se puede construir con todos sus campos', () => {
  const tomate: Cultivo = {
    id: 'tomate', nombreComun: 'Tomate', nombreCientifico: 'Solanum lycopersicum',
    icono: '🍅', familia: 'solanáceas', tipo: 'fruto',
    tempMinGerminacion: 12, tempOptima: 22, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 6.8, drenajeRequerido: 'bueno',
    metodo: 'semillero_trasplante', sol: 'pleno_sol',
    distanciaPlantaCm: 50, distanciaLineaCm: 60, alturaCm: 150,
    diasACosecha: 90, rendimientoPorPlanta: 2.5, unidad: 'kg',
    ventana: 'continua', ventanaDias: 60,
    companeras: ['albahaca'], antagonistas: ['patata'],
    riego: 'Riego regular, evitar encharcar.', plagas: 'Mildiu; airear y no mojar la hoja.',
    notas: 'Entutorar.',
  }
  expect(tomate.id).toBe('tomate')
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/tipos.test.ts`
Expected: FAIL — módulo `./tipos` no existe.

- [ ] **Step 3: Escribir los tipos**

Create `src/dominio/tipos.ts`:

```ts
export type Textura = 'arenoso' | 'franco' | 'arcilloso'
export type Drenaje = 'malo' | 'medio' | 'bueno'
export type Sol = 'pleno_sol' | 'semisombra'
export type Metodo = 'siembra_directa' | 'semillero_trasplante'
export type ToleranciaHelada = 'sensible' | 'resistente'
export type TipoCultivo = 'fruto' | 'hoja' | 'raiz' | 'bulbo' | 'leguminosa' | 'otro'
export type UnidadCosecha = 'kg' | 'unidades' | 'manojos'
export type VentanaTipo = 'puntual' | 'continua'
export type NivelCantidad = 'poca' | 'media' | 'mucha'
export type Obligatoriedad = 'obligatoria' | 'opcional'
export type Orientacion = 'norte' | 'sur' | 'este' | 'oeste'

export interface Cultivo {
  id: string
  nombreComun: string
  nombreCientifico: string
  icono: string
  familia: string
  tipo: TipoCultivo
  tempMinGerminacion: number // °C, media diaria por debajo de la cual no germina bien
  tempOptima: number // °C
  toleranciaHelada: ToleranciaHelada
  texturaPreferida: Textura[]
  phMin: number
  phMax: number
  drenajeRequerido: Drenaje // drenaje mínimo que tolera la especie
  metodo: Metodo
  sol: Sol
  distanciaPlantaCm: number
  distanciaLineaCm: number
  alturaCm: number
  diasACosecha: number
  rendimientoPorPlanta: number // en `unidad`
  unidad: UnidadCosecha
  ventana: VentanaTipo
  ventanaDias?: number // duración de la recogida si ventana === 'continua'
  companeras: string[] // ids de cultivos
  antagonistas: string[] // ids de cultivos
  riego: string
  plagas: string
  notas: string
}

// 12 valores, índice 0 = enero … 11 = diciembre
export interface PerfilClima {
  id: string
  nombre: string
  tempMediaMensual: number[] // media mensual de la temperatura media diaria
  tempMinMensual: number[] // media mensual de la temperatura mínima diaria
  mesUltimaHelada: number // último mes de riesgo de helada en primavera (0-11); -1 si no hay
  mesPrimeraHelada: number // primer mes de riesgo en otoño (0-11); -1 si no hay
}

export interface PerfilSuelo {
  textura: Textura
  ph: number
  drenaje: Drenaje
}

export interface Bancal {
  id: string
  nombre: string
  anchoM: number
  largoM: number
}

export interface Huerto {
  orientacionNorte: Orientacion // hacia dónde queda el norte respecto al huerto
  bancales: Bancal[]
}

export interface EleccionEspecie {
  cultivoId: string
  obligatoriedad: Obligatoriedad
  cantidad: NivelCantidad
}

export type EstadoIdoneidad = 'apta' | 'esperar' | 'no_recomendada'

export interface ResultadoIdoneidad {
  cultivoId: string
  estado: EstadoIdoneidad
  puntuacion: number // 0-100
  mesRecomendado?: number // 0-11, cuándo sembrar si estado === 'esperar' o 'apta'
  consejosSuelo: string[]
  motivo?: string
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/tipos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/dominio/tipos.ts src/dominio/tipos.test.ts
git commit -m "feat: tipos del dominio de huertos"
```

---

## Task 3: Catálogo semilla de cultivos

**Files:**
- Create: `src/datos/cultivos.ts`
- Test: `src/datos/cultivos.test.ts`

**Interfaces:**
- Consumes: `Cultivo` de `tipos.ts`.
- Produces: `export const CULTIVOS: Cultivo[]`; `export function buscarCultivo(id: string): Cultivo | undefined`.

- [ ] **Step 1: Escribir tests de integridad del catálogo**

Create `src/datos/cultivos.test.ts`:

```ts
import { expect, test } from 'vitest'
import { CULTIVOS, buscarCultivo } from './cultivos'

test('hay al menos 8 cultivos', () => {
  expect(CULTIVOS.length).toBeGreaterThanOrEqual(8)
})

test('todos los ids son únicos', () => {
  const ids = CULTIVOS.map((c) => c.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('las referencias de compañeras y antagonistas apuntan a cultivos existentes', () => {
  const ids = new Set(CULTIVOS.map((c) => c.id))
  for (const c of CULTIVOS) {
    for (const ref of [...c.companeras, ...c.antagonistas]) {
      expect(ids.has(ref), `${c.id} referencia a ${ref} inexistente`).toBe(true)
    }
  }
})

test('buscarCultivo devuelve el cultivo o undefined', () => {
  expect(buscarCultivo('tomate')?.nombreComun).toBe('Tomate')
  expect(buscarCultivo('inexistente')).toBeUndefined()
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/datos/cultivos.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Escribir el catálogo semilla (8 cultivos coherentes entre sí)**

Create `src/datos/cultivos.ts`. Cargar 8 cultivos reales con datos plausibles de huerto mediterráneo. Las referencias cruzadas solo pueden citar ids presentes en esta misma lista.

```ts
import type { Cultivo } from '../dominio/tipos'

export const CULTIVOS: Cultivo[] = [
  {
    id: 'tomate', nombreComun: 'Tomate', nombreCientifico: 'Solanum lycopersicum',
    icono: '🍅', familia: 'solanáceas', tipo: 'fruto',
    tempMinGerminacion: 12, tempOptima: 22, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 6.8, drenajeRequerido: 'bueno',
    metodo: 'semillero_trasplante', sol: 'pleno_sol',
    distanciaPlantaCm: 50, distanciaLineaCm: 60, alturaCm: 150,
    diasACosecha: 90, rendimientoPorPlanta: 2.5, unidad: 'kg', ventana: 'continua', ventanaDias: 60,
    companeras: ['albahaca', 'lechuga'], antagonistas: ['patata'],
    riego: 'Riego regular y constante; evitar mojar la hoja.', plagas: 'Mildiu y pulgón; airear y vigilar.',
    notas: 'Entutorar y podar brotes axilares.',
  },
  {
    id: 'lechuga', nombreComun: 'Lechuga', nombreCientifico: 'Lactuca sativa',
    icono: '🥬', familia: 'compuestas', tipo: 'hoja',
    tempMinGerminacion: 5, tempOptima: 16, toleranciaHelada: 'resistente',
    texturaPreferida: ['franco', 'arenoso'], phMin: 6, phMax: 7, drenajeRequerido: 'medio',
    metodo: 'siembra_directa', sol: 'semisombra',
    distanciaPlantaCm: 25, distanciaLineaCm: 30, alturaCm: 25,
    diasACosecha: 55, rendimientoPorPlanta: 1, unidad: 'unidades', ventana: 'puntual',
    companeras: ['zanahoria', 'tomate'], antagonistas: [],
    riego: 'Riego frecuente y ligero; no debe faltar humedad.', plagas: 'Babosas y pulgón.',
    notas: 'Cosechar antes de que suba a flor.',
  },
  {
    id: 'pimiento', nombreComun: 'Pimiento', nombreCientifico: 'Capsicum annuum',
    icono: '🫑', familia: 'solanáceas', tipo: 'fruto',
    tempMinGerminacion: 15, tempOptima: 24, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 7, drenajeRequerido: 'bueno',
    metodo: 'semillero_trasplante', sol: 'pleno_sol',
    distanciaPlantaCm: 40, distanciaLineaCm: 50, alturaCm: 70,
    diasACosecha: 100, rendimientoPorPlanta: 1.5, unidad: 'kg', ventana: 'continua', ventanaDias: 50,
    companeras: ['albahaca'], antagonistas: [],
    riego: 'Riego regular; sensible a la falta de agua en fructificación.', plagas: 'Pulgón y araña roja.',
    notas: 'Necesita calor; proteger del viento fuerte.',
  },
  {
    id: 'calabacin', nombreComun: 'Calabacín', nombreCientifico: 'Cucurbita pepo',
    icono: '🥒', familia: 'cucurbitáceas', tipo: 'fruto',
    tempMinGerminacion: 13, tempOptima: 24, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 7, drenajeRequerido: 'bueno',
    metodo: 'siembra_directa', sol: 'pleno_sol',
    distanciaPlantaCm: 80, distanciaLineaCm: 100, alturaCm: 60,
    diasACosecha: 50, rendimientoPorPlanta: 3, unidad: 'kg', ventana: 'continua', ventanaDias: 70,
    companeras: ['judia'], antagonistas: ['patata'],
    riego: 'Necesita bastante agua; riego abundante en verano.', plagas: 'Oídio; airear.',
    notas: 'Ocupa mucho espacio; cosechar tiernos y a menudo.',
  },
  {
    id: 'zanahoria', nombreComun: 'Zanahoria', nombreCientifico: 'Daucus carota',
    icono: '🥕', familia: 'umbelíferas', tipo: 'raiz',
    tempMinGerminacion: 7, tempOptima: 18, toleranciaHelada: 'resistente',
    texturaPreferida: ['arenoso', 'franco'], phMin: 6, phMax: 7, drenajeRequerido: 'bueno',
    metodo: 'siembra_directa', sol: 'pleno_sol',
    distanciaPlantaCm: 8, distanciaLineaCm: 25, alturaCm: 30,
    diasACosecha: 80, rendimientoPorPlanta: 0.12, unidad: 'kg', ventana: 'puntual',
    companeras: ['lechuga', 'cebolla'], antagonistas: [],
    riego: 'Humedad constante hasta germinar; luego moderado.', plagas: 'Mosca de la zanahoria.',
    notas: 'Suelo suelto y sin piedras para raíces rectas.',
  },
  {
    id: 'cebolla', nombreComun: 'Cebolla', nombreCientifico: 'Allium cepa',
    icono: '🧅', familia: 'liliáceas', tipo: 'bulbo',
    tempMinGerminacion: 8, tempOptima: 18, toleranciaHelada: 'resistente',
    texturaPreferida: ['franco'], phMin: 6, phMax: 7, drenajeRequerido: 'bueno',
    metodo: 'siembra_directa', sol: 'pleno_sol',
    distanciaPlantaCm: 12, distanciaLineaCm: 25, alturaCm: 35,
    diasACosecha: 120, rendimientoPorPlanta: 0.15, unidad: 'kg', ventana: 'puntual',
    companeras: ['zanahoria'], antagonistas: ['judia'],
    riego: 'Moderado; reducir al final para que engorde el bulbo.', plagas: 'Mildiu de la cebolla.',
    notas: 'Cosechar cuando la hoja se dobla y seca.',
  },
  {
    id: 'judia', nombreComun: 'Judía', nombreCientifico: 'Phaseolus vulgaris',
    icono: '🫘', familia: 'leguminosas', tipo: 'leguminosa',
    tempMinGerminacion: 12, tempOptima: 21, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco', 'arenoso'], phMin: 6, phMax: 7.5, drenajeRequerido: 'medio',
    metodo: 'siembra_directa', sol: 'pleno_sol',
    distanciaPlantaCm: 15, distanciaLineaCm: 40, alturaCm: 40,
    diasACosecha: 65, rendimientoPorPlanta: 0.3, unidad: 'kg', ventana: 'continua', ventanaDias: 40,
    companeras: ['calabacin', 'zanahoria'], antagonistas: ['cebolla'],
    riego: 'Regular; evitar encharcar.', plagas: 'Pulgón.',
    notas: 'Fija nitrógeno; mejora el suelo para el cultivo siguiente.',
  },
  {
    id: 'albahaca', nombreComun: 'Albahaca', nombreCientifico: 'Ocimum basilicum',
    icono: '🌿', familia: 'labiadas', tipo: 'otro',
    tempMinGerminacion: 14, tempOptima: 22, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 7, drenajeRequerido: 'bueno',
    metodo: 'siembra_directa', sol: 'pleno_sol',
    distanciaPlantaCm: 20, distanciaLineaCm: 25, alturaCm: 40,
    diasACosecha: 60, rendimientoPorPlanta: 4, unidad: 'manojos', ventana: 'continua', ventanaDias: 90,
    companeras: ['tomate', 'pimiento'], antagonistas: [],
    riego: 'Riego regular; no encharcar.', plagas: 'Pulgón.',
    notas: 'Pinzar flores para prolongar la hoja. Buena compañera del tomate.',
  },
]

export function buscarCultivo(id: string): Cultivo | undefined {
  return CULTIVOS.find((c) => c.id === id)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/datos/cultivos.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/datos/cultivos.ts src/datos/cultivos.test.ts
git commit -m "feat: catalogo semilla de cultivos con integridad referencial"
```

---

## Task 4: Zonas climáticas de España

**Files:**
- Create: `src/datos/zonas-climaticas.ts`
- Test: `src/datos/zonas-climaticas.test.ts`

**Interfaces:**
- Consumes: `PerfilClima` de `tipos.ts`.
- Produces: `export const ZONAS_CLIMATICAS: PerfilClima[]`; `export function buscarZona(id: string): PerfilClima | undefined`.

- [ ] **Step 1: Escribir tests de integridad**

Create `src/datos/zonas-climaticas.test.ts`:

```ts
import { expect, test } from 'vitest'
import { ZONAS_CLIMATICAS, buscarZona } from './zonas-climaticas'

test('hay al menos 6 zonas', () => {
  expect(ZONAS_CLIMATICAS.length).toBeGreaterThanOrEqual(6)
})

test('cada zona tiene 12 valores mensuales de temperatura', () => {
  for (const z of ZONAS_CLIMATICAS) {
    expect(z.tempMediaMensual).toHaveLength(12)
    expect(z.tempMinMensual).toHaveLength(12)
  }
})

test('los meses de helada están en rango o son -1', () => {
  for (const z of ZONAS_CLIMATICAS) {
    expect(z.mesUltimaHelada).toBeGreaterThanOrEqual(-1)
    expect(z.mesUltimaHelada).toBeLessThanOrEqual(11)
    expect(z.mesPrimeraHelada).toBeGreaterThanOrEqual(-1)
    expect(z.mesPrimeraHelada).toBeLessThanOrEqual(11)
  }
})

test('buscarZona funciona', () => {
  expect(buscarZona('mediterraneo_litoral')?.nombre).toContain('editerráneo')
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/datos/zonas-climaticas.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Escribir las 6 zonas con perfiles plausibles**

Create `src/datos/zonas-climaticas.ts`. Valores mensuales representativos (media y mínima diaria por mes) y meses de helada aproximados para cada zona. Enero→Diciembre.

```ts
import type { PerfilClima } from '../dominio/tipos'

export const ZONAS_CLIMATICAS: PerfilClima[] = [
  {
    id: 'mediterraneo_litoral', nombre: 'Mediterráneo litoral',
    tempMediaMensual: [11, 12, 14, 16, 19, 23, 26, 26, 23, 19, 15, 12],
    tempMinMensual: [6, 7, 9, 11, 14, 18, 21, 21, 18, 14, 10, 7],
    mesUltimaHelada: 1, mesPrimeraHelada: 11,
  },
  {
    id: 'interior_continental', nombre: 'Interior continental',
    tempMediaMensual: [5, 7, 10, 12, 16, 21, 25, 24, 20, 14, 9, 6],
    tempMinMensual: [0, 1, 3, 5, 9, 13, 16, 16, 12, 7, 3, 1],
    mesUltimaHelada: 3, mesPrimeraHelada: 10,
  },
  {
    id: 'norte_atlantico', nombre: 'Norte atlántico',
    tempMediaMensual: [9, 9, 11, 12, 15, 18, 20, 20, 18, 15, 12, 10],
    tempMinMensual: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6],
    mesUltimaHelada: 2, mesPrimeraHelada: 11,
  },
  {
    id: 'montana', nombre: 'Montaña',
    tempMediaMensual: [2, 3, 6, 8, 12, 16, 20, 19, 15, 10, 5, 3],
    tempMinMensual: [-3, -2, 0, 2, 6, 10, 13, 13, 9, 4, 0, -2],
    mesUltimaHelada: 4, mesPrimeraHelada: 9,
  },
  {
    id: 'sur_arido', nombre: 'Sur árido / subtropical',
    tempMediaMensual: [13, 14, 16, 18, 21, 25, 28, 28, 25, 21, 17, 14],
    tempMinMensual: [7, 8, 10, 12, 15, 19, 22, 22, 19, 15, 11, 8],
    mesUltimaHelada: 0, mesPrimeraHelada: -1,
  },
  {
    id: 'canarias', nombre: 'Canarias',
    tempMediaMensual: [18, 18, 19, 19, 21, 22, 24, 25, 24, 23, 21, 19],
    tempMinMensual: [14, 14, 15, 15, 17, 18, 20, 21, 20, 19, 17, 15],
    mesUltimaHelada: -1, mesPrimeraHelada: -1,
  },
]

export function buscarZona(id: string): PerfilClima | undefined {
  return ZONAS_CLIMATICAS.find((z) => z.id === id)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/datos/zonas-climaticas.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/datos/zonas-climaticas.ts src/datos/zonas-climaticas.test.ts
git commit -m "feat: zonas climaticas curadas de Espana"
```

---

## Task 5: Tipos de suelo y guía de experimentación

**Files:**
- Create: `src/datos/suelos.ts`
- Test: `src/datos/suelos.test.ts`

**Interfaces:**
- Consumes: `Textura`, `Drenaje` de `tipos.ts`.
- Produces: `export interface TipoSueloInfo { textura: Textura; nombre: string; drenajeTipico: Drenaje; descripcion: string }`; `export const TIPOS_SUELO: TipoSueloInfo[]`; `export const GUIA_EXPERIMENTACION: { titulo: string; pasos: string[] }[]`.

- [ ] **Step 1: Escribir tests**

Create `src/datos/suelos.test.ts`:

```ts
import { expect, test } from 'vitest'
import { TIPOS_SUELO, GUIA_EXPERIMENTACION } from './suelos'

test('hay tres texturas de suelo cubiertas', () => {
  const texturas = TIPOS_SUELO.map((t) => t.textura).sort()
  expect(texturas).toEqual(['arcilloso', 'arenoso', 'franco'])
})

test('la guía de experimentación tiene al menos la prueba del bote', () => {
  const titulos = GUIA_EXPERIMENTACION.map((g) => g.titulo.toLowerCase())
  expect(titulos.some((t) => t.includes('bote'))).toBe(true)
  for (const g of GUIA_EXPERIMENTACION) {
    expect(g.pasos.length).toBeGreaterThan(0)
  }
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/datos/suelos.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Escribir los datos**

Create `src/datos/suelos.ts`:

```ts
import type { Textura, Drenaje } from '../dominio/tipos'

export interface TipoSueloInfo {
  textura: Textura
  nombre: string
  drenajeTipico: Drenaje
  descripcion: string
}

export const TIPOS_SUELO: TipoSueloInfo[] = [
  { textura: 'arenoso', nombre: 'Arenoso', drenajeTipico: 'bueno', descripcion: 'Ligero y suelto, drena rápido; retiene poca agua y nutrientes.' },
  { textura: 'franco', nombre: 'Franco', drenajeTipico: 'bueno', descripcion: 'Equilibrado entre arena, limo y arcilla; el ideal para huerto.' },
  { textura: 'arcilloso', nombre: 'Arcilloso', drenajeTipico: 'malo', descripcion: 'Pesado y compacto, retiene mucha agua; puede encharcarse.' },
]

export const GUIA_EXPERIMENTACION: { titulo: string; pasos: string[] }[] = [
  {
    titulo: 'Prueba del bote (sedimentación)',
    pasos: [
      'Llena un bote de cristal 1/3 con tierra del bancal y el resto con agua.',
      'Agita fuerte un minuto y déjalo reposar 24 horas.',
      'Se formarán capas: la arena abajo, el limo en medio y la arcilla arriba.',
      'La capa más gruesa indica la textura dominante de tu suelo.',
    ],
  },
  {
    titulo: 'Prueba del rollito (a mano)',
    pasos: [
      'Humedece un poco de tierra y amásala.',
      'Si puedes hacer un rollito fino que no se rompe, es arcilloso.',
      'Si se deshace enseguida y notas los granos, es arenoso.',
      'Si hace un rollito que se agrieta, es franco.',
    ],
  },
  {
    titulo: 'Prueba de drenaje',
    pasos: [
      'Cava un hoyo de unos 30 cm y llénalo de agua; deja que se vacíe.',
      'Vuelve a llenarlo y mide cuánto tarda en filtrar.',
      'Menos de 1-2 horas: drenaje bueno. Varias horas: drenaje malo (arcilloso).',
    ],
  },
  {
    titulo: 'Nota sobre el pH',
    pasos: [
      'La mayoría de hortalizas prefieren pH 6-7 (ligeramente ácido a neutro).',
      'Puedes medirlo con tiras/kit de jardinería baratos.',
      'Si no lo mides, asume un pH neutro; corrige solo si notas problemas.',
    ],
  },
]
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/datos/suelos.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/datos/suelos.ts src/datos/suelos.test.ts
git commit -m "feat: tipos de suelo y guia de experimentacion"
```

---

## Task 6: Servicio de clima (zona + coordenadas)

**Files:**
- Create: `src/dominio/clima.ts`
- Test: `src/dominio/clima.test.ts`

**Interfaces:**
- Consumes: `PerfilClima` de `tipos.ts`; `buscarZona` de `datos/zonas-climaticas.ts`.
- Produces:
  - `export function climaDeZona(zonaId: string): PerfilClima` (lanza si no existe).
  - `export function perfilDesdeOpenMeteo(respuesta: RespuestaOpenMeteo): PerfilClima` — función pura de parseo.
  - `export interface RespuestaOpenMeteo { monthly: { temperature_2m_mean: number[]; temperature_2m_min: number[] } }`.
  - `export async function climaDeCoordenadas(lat: number, lon: number, fetchImpl?: typeof fetch): Promise<PerfilClima>` — envoltorio fino que llama a Open-Meteo y usa `perfilDesdeOpenMeteo`.

- [ ] **Step 1: Escribir tests (impl zona + parseo puro)**

Create `src/dominio/clima.test.ts`:

```ts
import { expect, test } from 'vitest'
import { climaDeZona, perfilDesdeOpenMeteo } from './clima'

test('climaDeZona devuelve el perfil de una zona conocida', () => {
  const p = climaDeZona('mediterraneo_litoral')
  expect(p.tempMediaMensual).toHaveLength(12)
})

test('climaDeZona lanza si la zona no existe', () => {
  expect(() => climaDeZona('marte')).toThrow()
})

test('perfilDesdeOpenMeteo calcula meses de helada a partir de la mínima mensual', () => {
  const min = [-1, 0, 2, 5, 9, 13, 16, 16, 12, 7, 1, -2] // helada donde < 0.5°C: ene, feb, dic
  const mean = min.map((m) => m + 6)
  const p = perfilDesdeOpenMeteo({ monthly: { temperature_2m_mean: mean, temperature_2m_min: min } })
  expect(p.mesUltimaHelada).toBe(1) // febrero es el último mes frío de la primera mitad
  expect(p.mesPrimeraHelada).toBe(11) // diciembre, primer mes frío de la segunda mitad
  expect(p.tempMediaMensual).toEqual(mean)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/clima.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar el servicio**

Create `src/dominio/clima.ts`:

```ts
import type { PerfilClima } from './tipos'
import { buscarZona } from '../datos/zonas-climaticas'

const UMBRAL_HELADA = 0.5 // °C: un mes con mínima media por debajo se considera con riesgo de helada

export function climaDeZona(zonaId: string): PerfilClima {
  const z = buscarZona(zonaId)
  if (!z) throw new Error(`Zona climática desconocida: ${zonaId}`)
  return z
}

export interface RespuestaOpenMeteo {
  monthly: { temperature_2m_mean: number[]; temperature_2m_min: number[] }
}

export function perfilDesdeOpenMeteo(respuesta: RespuestaOpenMeteo): PerfilClima {
  const mean = respuesta.monthly.temperature_2m_mean
  const min = respuesta.monthly.temperature_2m_min
  const mesesConHelada = min.map((t, i) => ({ t, i })).filter((x) => x.t < UMBRAL_HELADA).map((x) => x.i)
  // última helada de primavera: último mes frío en la primera mitad del año (ene-jun)
  const primavera = mesesConHelada.filter((i) => i <= 5)
  const otono = mesesConHelada.filter((i) => i >= 6)
  return {
    id: 'coordenadas', nombre: 'Ubicación precisa',
    tempMediaMensual: mean, tempMinMensual: min,
    mesUltimaHelada: primavera.length ? Math.max(...primavera) : -1,
    mesPrimeraHelada: otono.length ? Math.min(...otono) : -1,
  }
}

export async function climaDeCoordenadas(
  lat: number, lon: number, fetchImpl: typeof fetch = fetch,
): Promise<PerfilClima> {
  const url =
    `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}` +
    `&start_date=1991-01-01&end_date=2020-12-31&models=MRI_AGCM3_2_S` +
    `&monthly=temperature_2m_mean,temperature_2m_min`
  const resp = await fetchImpl(url)
  if (!resp.ok) throw new Error(`Error consultando el clima: ${resp.status}`)
  const datos = (await resp.json()) as RespuestaOpenMeteo
  return perfilDesdeOpenMeteo(datos)
}
```

> Nota para el implementador: si al integrar con la API real la forma de `monthly` difiere (p. ej. medias diarias en vez de mensuales), ajusta **solo** `climaDeCoordenadas` y `RespuestaOpenMeteo`; `perfilDesdeOpenMeteo` debe seguir recibiendo 12 valores mensuales. La lógica del cerebro no cambia.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/clima.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/clima.ts src/dominio/clima.test.ts
git commit -m "feat: servicio de clima por zona y por coordenadas"
```

---

## Task 7: Servicio de suelo (manual + coordenadas)

**Files:**
- Create: `src/dominio/suelo.ts`
- Test: `src/dominio/suelo.test.ts`

**Interfaces:**
- Consumes: `PerfilSuelo`, `Textura`, `Drenaje` de `tipos.ts`; `TIPOS_SUELO` de `datos/suelos.ts`.
- Produces:
  - `export function sueloManual(textura: Textura, ph?: number): PerfilSuelo` (usa `drenajeTipico` de la textura; pH por defecto 6.5).
  - `export interface RespuestaSoilGrids { properties: { layers: Array<{ name: string; depths: Array<{ values: { mean: number } }> }> } }`.
  - `export function perfilDesdeSoilGrids(r: RespuestaSoilGrids): PerfilSuelo` — función pura de parseo (clay/sand → textura; phh2o → pH).
  - `export async function sueloDeCoordenadas(lat: number, lon: number, fetchImpl?: typeof fetch): Promise<PerfilSuelo>`.

- [ ] **Step 1: Escribir tests (manual + parseo puro)**

Create `src/dominio/suelo.test.ts`:

```ts
import { expect, test } from 'vitest'
import { sueloManual, perfilDesdeSoilGrids } from './suelo'

test('sueloManual usa el drenaje típico de la textura', () => {
  expect(sueloManual('arcilloso').drenaje).toBe('malo')
  expect(sueloManual('arenoso').drenaje).toBe('bueno')
  expect(sueloManual('franco', 7).ph).toBe(7)
})

test('sueloManual aplica pH por defecto 6.5', () => {
  expect(sueloManual('franco').ph).toBe(6.5)
})

test('perfilDesdeSoilGrids clasifica textura por dominancia de arcilla/arena', () => {
  const r = {
    properties: {
      layers: [
        { name: 'clay', depths: [{ values: { mean: 450 } }] }, // 45% (SoilGrids da g/kg*10)
        { name: 'sand', depths: [{ values: { mean: 300 } }] }, // 30%
        { name: 'phh2o', depths: [{ values: { mean: 68 } }] }, // pH 6.8 (x10)
      ],
    },
  }
  const p = perfilDesdeSoilGrids(r)
  expect(p.textura).toBe('arcilloso')
  expect(p.ph).toBeCloseTo(6.8, 1)
  expect(p.drenaje).toBe('malo')
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/suelo.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar el servicio**

Create `src/dominio/suelo.ts`:

```ts
import type { PerfilSuelo, Textura, Drenaje } from './tipos'
import { TIPOS_SUELO } from '../datos/suelos'

function drenajeDeTextura(textura: Textura): Drenaje {
  const info = TIPOS_SUELO.find((t) => t.textura === textura)
  return info ? info.drenajeTipico : 'medio'
}

export function sueloManual(textura: Textura, ph = 6.5): PerfilSuelo {
  return { textura, ph, drenaje: drenajeDeTextura(textura) }
}

export interface RespuestaSoilGrids {
  properties: { layers: Array<{ name: string; depths: Array<{ values: { mean: number } }> }> }
}

function capa(r: RespuestaSoilGrids, nombre: string): number | undefined {
  const l = r.properties.layers.find((x) => x.name === nombre)
  return l?.depths[0]?.values.mean
}

export function perfilDesdeSoilGrids(r: RespuestaSoilGrids): PerfilSuelo {
  const clay = (capa(r, 'clay') ?? 0) / 10 // g/kg*10 → %
  const sand = (capa(r, 'sand') ?? 0) / 10
  const phRaw = capa(r, 'phh2o')
  const ph = phRaw !== undefined ? phRaw / 10 : 6.5
  let textura: Textura = 'franco'
  if (clay >= 40) textura = 'arcilloso'
  else if (sand >= 50) textura = 'arenoso'
  return { textura, ph, drenaje: drenajeDeTextura(textura) }
}

export async function sueloDeCoordenadas(
  lat: number, lon: number, fetchImpl: typeof fetch = fetch,
): Promise<PerfilSuelo> {
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}` +
    `&property=clay&property=sand&property=phh2o&depth=0-5cm&value=mean`
  const resp = await fetchImpl(url)
  if (!resp.ok) throw new Error(`Error consultando el suelo: ${resp.status}`)
  const datos = (await resp.json()) as RespuestaSoilGrids
  return perfilDesdeSoilGrids(datos)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/suelo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/suelo.ts src/dominio/suelo.test.ts
git commit -m "feat: servicio de suelo manual y por coordenadas"
```

---

## Task 8: Idoneidad (clima + época + suelo, con puntuación)

**Files:**
- Create: `src/dominio/idoneidad.ts`
- Test: `src/dominio/idoneidad.test.ts`

**Interfaces:**
- Consumes: `Cultivo`, `PerfilClima`, `PerfilSuelo`, `ResultadoIdoneidad` de `tipos.ts`.
- Produces: `export function evaluarIdoneidad(cultivo: Cultivo, clima: PerfilClima, suelo: PerfilSuelo, mesActual: number): ResultadoIdoneidad`.

**Reglas (deterministas):**
- Ventana térmica de siembra: meses cuya `tempMediaMensual >= tempMinGerminacion` **y**, si el cultivo es `sensible` a heladas, posteriores a `mesUltimaHelada` y anteriores a `mesPrimeraHelada`.
- Si `mesActual` está en la ventana → `apta` (mesRecomendado = mesActual).
- Si hay ventana pero `mesActual` no está en ella → `esperar` (mesRecomendado = primer mes futuro de la ventana).
- Si no hay ningún mes en la ventana → `no_recomendada` (motivo climático).
- Suelo: penaliza la puntuación y añade `consejosSuelo` si textura/pH/drenaje no encajan; drenaje `malo` para cultivo que requiere `bueno` es incompatibilidad fuerte → resta mucho y, si además no hay ventana buena, refuerza `no_recomendada`; si la hay, sigue `apta`/`esperar` pero con consejo de enmienda.
- Puntuación 0-100: parte de 100, resta por lejanía térmica respecto a `tempOptima` en el mes recomendado y por desajustes de suelo.

- [ ] **Step 1: Escribir tests de las tres ramas + suelo**

Create `src/dominio/idoneidad.test.ts`:

```ts
import { expect, test } from 'vitest'
import { evaluarIdoneidad } from './idoneidad'
import { buscarCultivo } from '../datos/cultivos'
import { climaDeZona } from './clima'
import { sueloManual } from './suelo'

const tomate = buscarCultivo('tomate')!
const litoral = climaDeZona('mediterraneo_litoral')
const sueloFranco = sueloManual('franco', 6.5)

test('tomate en litoral en junio es apta', () => {
  const r = evaluarIdoneidad(tomate, litoral, sueloFranco, 5) // junio
  expect(r.estado).toBe('apta')
  expect(r.puntuacion).toBeGreaterThan(60)
})

test('tomate en litoral en diciembre recomienda esperar a la primavera', () => {
  const r = evaluarIdoneidad(tomate, litoral, sueloFranco, 11) // diciembre
  expect(r.estado).toBe('esperar')
  expect(r.mesRecomendado).toBeGreaterThanOrEqual(2)
  expect(r.mesRecomendado).toBeLessThanOrEqual(6)
})

test('suelo arcilloso (drenaje malo) para tomate añade consejo y baja la puntuación', () => {
  const arcilloso = sueloManual('arcilloso', 6.5)
  const bueno = evaluarIdoneidad(tomate, litoral, sueloFranco, 5)
  const malo = evaluarIdoneidad(tomate, litoral, arcilloso, 5)
  expect(malo.consejosSuelo.length).toBeGreaterThan(0)
  expect(malo.puntuacion).toBeLessThan(bueno.puntuacion)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/idoneidad.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/idoneidad.ts`:

```ts
import type { Cultivo, PerfilClima, PerfilSuelo, ResultadoIdoneidad, Drenaje } from './tipos'

const ORDEN_DRENAJE: Record<Drenaje, number> = { malo: 0, medio: 1, bueno: 2 }

function mesesEnVentana(cultivo: Cultivo, clima: PerfilClima): number[] {
  const meses: number[] = []
  for (let m = 0; m < 12; m++) {
    const calido = clima.tempMediaMensual[m] >= cultivo.tempMinGerminacion
    let sinHelada = true
    if (cultivo.toleranciaHelada === 'sensible') {
      if (clima.mesUltimaHelada >= 0 && m <= clima.mesUltimaHelada) sinHelada = false
      if (clima.mesPrimeraHelada >= 0 && m >= clima.mesPrimeraHelada) sinHelada = false
    }
    if (calido && sinHelada) meses.push(m)
  }
  return meses
}

function evaluarSuelo(cultivo: Cultivo, suelo: PerfilSuelo): { penalizacion: number; consejos: string[] } {
  const consejos: string[] = []
  let penalizacion = 0
  if (!cultivo.texturaPreferida.includes(suelo.textura)) {
    penalizacion += 10
    consejos.push(`Prefiere suelo ${cultivo.texturaPreferida.join('/')}; el tuyo es ${suelo.textura}. Aporta compost para mejorar la estructura.`)
  }
  if (suelo.ph < cultivo.phMin || suelo.ph > cultivo.phMax) {
    penalizacion += 8
    const dir = suelo.ph < cultivo.phMin ? 'ácido' : 'alcalino'
    consejos.push(`Tu pH (${suelo.ph}) es algo ${dir} para este cultivo (ideal ${cultivo.phMin}-${cultivo.phMax}). Corrígelo poco a poco.`)
  }
  if (ORDEN_DRENAJE[suelo.drenaje] < ORDEN_DRENAJE[cultivo.drenajeRequerido]) {
    penalizacion += 25
    consejos.push('El drenaje es insuficiente: cultiva en caballón/bancal elevado y añade material que aligere el suelo.')
  }
  return { penalizacion, consejos }
}

export function evaluarIdoneidad(
  cultivo: Cultivo, clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
): ResultadoIdoneidad {
  const ventana = mesesEnVentana(cultivo, clima)
  const { penalizacion, consejos } = evaluarSuelo(cultivo, suelo)

  if (ventana.length === 0) {
    return { cultivoId: cultivo.id, estado: 'no_recomendada', puntuacion: 0, consejosSuelo: consejos, motivo: 'El clima no alcanza sus necesidades térmicas en ningún mes.' }
  }

  const enVentanaAhora = ventana.includes(mesActual)
  const mesRecomendado = enVentanaAhora
    ? mesActual
    : (ventana.find((m) => m > mesActual) ?? ventana[0])

  const distanciaTermica = Math.abs(clima.tempMediaMensual[mesRecomendado] - cultivo.tempOptima)
  let puntuacion = 100 - distanciaTermica * 3 - penalizacion
  puntuacion = Math.max(0, Math.min(100, Math.round(puntuacion)))

  return {
    cultivoId: cultivo.id,
    estado: enVentanaAhora ? 'apta' : 'esperar',
    puntuacion,
    mesRecomendado,
    consejosSuelo: consejos,
    motivo: enVentanaAhora ? undefined : 'Aún no es su época; mejor esperar.',
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/idoneidad.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/idoneidad.ts src/dominio/idoneidad.test.ts
git commit -m "feat: evaluacion de idoneidad clima+epoca+suelo con puntuacion"
```

---

## Task 9: Sinergias y compañeras extra

**Files:**
- Create: `src/dominio/sinergias.ts`
- Test: `src/dominio/sinergias.test.ts`

**Interfaces:**
- Consumes: `Cultivo` de `tipos.ts`; `CULTIVOS`, `buscarCultivo` de `datos/cultivos.ts`.
- Produces:
  - `export interface ParejaSinergia { a: string; b: string; tipo: 'favorable' | 'conflictiva' }`.
  - `export function evaluarSinergias(cultivoIds: string[]): ParejaSinergia[]`.
  - `export function sugerirCompaneras(cultivoIds: string[], maximo?: number): string[]` — ids de compañeras del catálogo, no ya elegidas, ordenadas por nº de elegidas a las que ayudan.

- [ ] **Step 1: Escribir tests**

Create `src/dominio/sinergias.test.ts`:

```ts
import { expect, test } from 'vitest'
import { evaluarSinergias, sugerirCompaneras } from './sinergias'

test('detecta pareja favorable tomate-albahaca', () => {
  const parejas = evaluarSinergias(['tomate', 'albahaca'])
  expect(parejas).toContainEqual({ a: 'albahaca', b: 'tomate', tipo: 'favorable' })
})

test('detecta pareja conflictiva cebolla-judia', () => {
  const parejas = evaluarSinergias(['cebolla', 'judia'])
  expect(parejas.some((p) => p.tipo === 'conflictiva')).toBe(true)
})

test('sugiere compañeras no elegidas que ayudan a las elegidas', () => {
  const sugeridas = sugerirCompaneras(['tomate'], 2)
  expect(sugeridas).toContain('albahaca')
  expect(sugeridas).not.toContain('tomate')
  expect(sugeridas.length).toBeLessThanOrEqual(2)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/sinergias.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/sinergias.ts`:

```ts
import { CULTIVOS, buscarCultivo } from '../datos/cultivos'

export interface ParejaSinergia { a: string; b: string; tipo: 'favorable' | 'conflictiva' }

function ordenar(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export function evaluarSinergias(cultivoIds: string[]): ParejaSinergia[] {
  const parejas: ParejaSinergia[] = []
  const vistas = new Set<string>()
  for (const id of cultivoIds) {
    const c = buscarCultivo(id)
    if (!c) continue
    for (const otro of cultivoIds) {
      if (id === otro) continue
      const [a, b] = ordenar(id, otro)
      const clave = `${a}|${b}`
      if (vistas.has(clave)) continue
      if (c.companeras.includes(otro)) { parejas.push({ a, b, tipo: 'favorable' }); vistas.add(clave) }
      else if (c.antagonistas.includes(otro)) { parejas.push({ a, b, tipo: 'conflictiva' }); vistas.add(clave) }
    }
  }
  return parejas
}

export function sugerirCompaneras(cultivoIds: string[], maximo = 2): string[] {
  const elegidas = new Set(cultivoIds)
  const puntos = new Map<string, number>()
  for (const id of cultivoIds) {
    const c = buscarCultivo(id)
    if (!c) continue
    for (const comp of c.companeras) {
      if (elegidas.has(comp)) continue
      if (!buscarCultivo(comp)) continue
      puntos.set(comp, (puntos.get(comp) ?? 0) + 1)
    }
  }
  return [...puntos.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
    .slice(0, maximo)
    .map(([id]) => id)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/sinergias.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/sinergias.ts src/dominio/sinergias.test.ts
git commit -m "feat: evaluacion de sinergias y sugerencia de companeras"
```

---

## Task 10: Sugerencia automática ("Hazme tú una sugerencia")

**Files:**
- Create: `src/dominio/sugerencia.ts`
- Test: `src/dominio/sugerencia.test.ts`

**Interfaces:**
- Consumes: `Cultivo`, `PerfilClima`, `PerfilSuelo`, `EleccionEspecie` de `tipos.ts`; `CULTIVOS` de `datos/cultivos.ts`; `evaluarIdoneidad` de `idoneidad.ts`.
- Produces: `export function sugerirEspecies(clima: PerfilClima, suelo: PerfilSuelo, mesActual: number, superficieM2: number, especiesPorM2?: number): EleccionEspecie[]` — devuelve especies aptas ordenadas por puntuación, limitadas a `round(superficieM2 * especiesPorM2)`, evitando antagonistas ya incluidos; todas como `opcional`/`media`.

- [ ] **Step 1: Escribir tests**

Create `src/dominio/sugerencia.test.ts`:

```ts
import { expect, test } from 'vitest'
import { sugerirEspecies } from './sugerencia'
import { climaDeZona } from './clima'
import { sueloManual } from './suelo'

const litoral = climaDeZona('mediterraneo_litoral')
const franco = sueloManual('franco', 6.5)

test('escala con la superficie: ~6 especies/m² como tope', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 1, 6) // 1 m² → máx 6
  expect(sugeridas.length).toBeGreaterThan(0)
  expect(sugeridas.length).toBeLessThanOrEqual(6)
})

test('todas las sugeridas entran como opcional/media', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 2, 6)
  for (const e of sugeridas) {
    expect(e.obligatoriedad).toBe('opcional')
    expect(e.cantidad).toBe('media')
  }
})

test('no incluye a la vez dos antagonistas entre sí', () => {
  const sugeridas = sugerirEspecies(litoral, franco, 5, 5, 6).map((e) => e.cultivoId)
  const tieneCebolla = sugeridas.includes('cebolla')
  const tieneJudia = sugeridas.includes('judia')
  expect(tieneCebolla && tieneJudia).toBe(false)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/sugerencia.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/sugerencia.ts`:

```ts
import type { PerfilClima, PerfilSuelo, EleccionEspecie } from './tipos'
import { CULTIVOS, buscarCultivo } from '../datos/cultivos'
import { evaluarIdoneidad } from './idoneidad'

export function sugerirEspecies(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  superficieM2: number, especiesPorM2 = 6,
): EleccionEspecie[] {
  const maximo = Math.max(1, Math.round(superficieM2 * especiesPorM2))

  const candidatas = CULTIVOS
    .map((c) => ({ c, r: evaluarIdoneidad(c, clima, suelo, mesActual) }))
    .filter((x) => x.r.estado === 'apta')
    .sort((a, b) => b.r.puntuacion - a.r.puntuacion)

  const elegidas: string[] = []
  for (const { c } of candidatas) {
    if (elegidas.length >= maximo) break
    const chocaConElegida = elegidas.some((id) => {
      const otra = buscarCultivo(id)!
      return c.antagonistas.includes(id) || otra.antagonistas.includes(c.id)
    })
    if (chocaConElegida) continue
    elegidas.push(c.id)
  }

  return elegidas.map((cultivoId) => ({ cultivoId, obligatoriedad: 'opcional', cantidad: 'media' }))
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/sugerencia.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/sugerencia.ts src/dominio/sugerencia.test.ts
git commit -m "feat: sugerencia automatica de especies idoneas"
```

---

## Task 11: Colocación priorizada en bancales

**Files:**
- Create: `src/dominio/colocacion.ts`
- Test: `src/dominio/colocacion.test.ts`

**Interfaces:**
- Consumes: `Cultivo`, `Bancal`, `EleccionEspecie`, `NivelCantidad` de `tipos.ts`; `buscarCultivo` de `datos/cultivos.ts`.
- Produces:
  - `export interface AsignacionCultivo { cultivoId: string; numPlantas: number }`.
  - `export interface BancalColocado { bancalId: string; asignaciones: AsignacionCultivo[] }`.
  - `export interface ResultadoColocacion { bancales: BancalColocado[]; avisos: string[] }`.
  - `export function colocar(bancales: Bancal[], elecciones: EleccionEspecie[]): ResultadoColocacion`.

**Reglas (MVP, deterministas):**
- Peso por nivel: poca=1, media=2, mucha=3.
- Capacidad de un bancal en "celdas de planta": `area_m2 * factorDensidad`, donde el nº de plantas de un cultivo que caben en un área = `area_cm2 / (distanciaPlantaCm * distanciaLineaCm)`. Para repartir por peso, se asigna a cada cultivo una fracción del área proporcional a su peso; las obligatorias reservan su parte primero.
- Un cultivo se asigna entero a un bancal (no se parte entre bancales) — se colocan por orden de peso descendente en el bancal con más área libre, separando antagonistas (no poner dos antagonistas en el mismo bancal).
- Si una obligatoria no cabe (numPlantas calculado = 0), se añade un aviso.

- [ ] **Step 1: Escribir tests**

Create `src/dominio/colocacion.test.ts`:

```ts
import { expect, test } from 'vitest'
import { colocar } from './colocacion'
import type { Bancal, EleccionEspecie } from './tipos'

const bancalGrande: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 3 } // 6 m²

test('coloca una especie con nº de plantas > 0', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'lechuga', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const r = colocar([bancalGrande], elecciones)
  const asig = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'lechuga')
  expect(asig).toBeDefined()
  expect(asig!.numPlantas).toBeGreaterThan(0)
})

test('las obligatorias reservan sitio; una opcional se recorta antes en bancal pequeño', () => {
  const bancalMini: Bancal = { id: 'b2', nombre: 'Mini', anchoM: 0.5, largoM: 0.5 } // 0.25 m²
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'lechuga', obligatoriedad: 'obligatoria', cantidad: 'mucha' },
    { cultivoId: 'calabacin', obligatoriedad: 'opcional', cantidad: 'poca' },
  ]
  const r = colocar([bancalMini], elecciones)
  const lechuga = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'lechuga')
  const calabacin = r.bancales[0].asignaciones.find((a) => a.cultivoId === 'calabacin')
  expect(lechuga?.numPlantas ?? 0).toBeGreaterThan(0)
  expect(calabacin?.numPlantas ?? 0).toBe(0) // se recorta la opcional
})

test('no coloca dos antagonistas en el mismo bancal', () => {
  const b1: Bancal = { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 }
  const b2: Bancal = { id: 'b2', nombre: 'B2', anchoM: 1, largoM: 1 }
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'obligatoria', cantidad: 'media' },
  ]
  const r = colocar([b1, b2], elecciones)
  for (const banc of r.bancales) {
    const ids = banc.asignaciones.map((a) => a.cultivoId)
    expect(ids.includes('cebolla') && ids.includes('judia')).toBe(false)
  }
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/colocacion.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/colocacion.ts`:

```ts
import type { Bancal, EleccionEspecie, NivelCantidad, Cultivo } from './tipos'
import { buscarCultivo } from '../datos/cultivos'

export interface AsignacionCultivo { cultivoId: string; numPlantas: number }
export interface BancalColocado { bancalId: string; asignaciones: AsignacionCultivo[] }
export interface ResultadoColocacion { bancales: BancalColocado[]; avisos: string[] }

const PESO: Record<NivelCantidad, number> = { poca: 1, media: 2, mucha: 3 }

interface EstadoBancal { bancal: Bancal; areaLibreCm2: number; asignaciones: AsignacionCultivo[]; ids: Set<string> }

function areaCm2(b: Bancal): number { return b.anchoM * 100 * b.largoM * 100 }
function areaPorPlanta(c: Cultivo): number { return c.distanciaPlantaCm * c.distanciaLineaCm }

function esAntagonistaDe(c: Cultivo, ids: Set<string>): boolean {
  for (const id of ids) {
    const otro = buscarCultivo(id)
    if (!otro) continue
    if (c.antagonistas.includes(id) || otro.antagonistas.includes(c.id)) return true
  }
  return false
}

export function colocar(bancales: Bancal[], elecciones: EleccionEspecie[]): ResultadoColocacion {
  const estados: EstadoBancal[] = bancales.map((b) => ({ bancal: b, areaLibreCm2: areaCm2(b), asignaciones: [], ids: new Set() }))
  const avisos: string[] = []

  // Ordenar: obligatorias antes que opcionales; dentro, mayor peso primero.
  const orden = [...elecciones].sort((a, b) => {
    if (a.obligatoriedad !== b.obligatoriedad) return a.obligatoriedad === 'obligatoria' ? -1 : 1
    return PESO[b.cantidad] - PESO[a.cantidad]
  })

  for (const e of orden) {
    const c = buscarCultivo(e.cultivoId)
    if (!c) continue

    // Bancales válidos: sin antagonista ya colocado, ordenados por área libre desc.
    const candidatos = estados
      .filter((s) => !esAntagonistaDe(c, s.ids))
      .sort((s1, s2) => s2.areaLibreCm2 - s1.areaLibreCm2)

    const destino = candidatos[0]
    if (!destino) {
      if (e.obligatoriedad === 'obligatoria') avisos.push(`No hay bancal compatible para ${c.nombreComun} (conflicto de vecindad).`)
      continue
    }

    // Área objetivo proporcional al peso, acotada al área libre.
    const fraccion = PESO[e.cantidad] / 6 // 1..3 sobre un máximo de referencia 6
    const areaObjetivo = Math.min(destino.areaLibreCm2, areaCm2(destino.bancal) * fraccion)
    const numPlantas = Math.floor(areaObjetivo / areaPorPlanta(c))

    if (numPlantas <= 0) {
      if (e.obligatoriedad === 'obligatoria') {
        avisos.push(`El bancal es demasiado pequeño para ${c.nombreComun}: necesita al menos ${Math.ceil(areaPorPlanta(c) / 10000 * 100) / 100} m² por planta.`)
      }
      destino.asignaciones.push({ cultivoId: c.id, numPlantas: 0 })
      destino.ids.add(c.id)
      continue
    }

    destino.areaLibreCm2 -= numPlantas * areaPorPlanta(c)
    destino.asignaciones.push({ cultivoId: c.id, numPlantas })
    destino.ids.add(c.id)
  }

  return {
    bancales: estados.map((s) => ({ bancalId: s.bancal.id, asignaciones: s.asignaciones })),
    avisos,
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/colocacion.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/colocacion.ts src/dominio/colocacion.test.ts
git commit -m "feat: colocacion priorizada en bancales con separacion de antagonistas"
```

---

## Task 12: Calendario de siembra/trasplante/cosecha

**Files:**
- Create: `src/dominio/calendario.ts`
- Test: `src/dominio/calendario.test.ts`

**Interfaces:**
- Consumes: `Cultivo` de `tipos.ts`; `buscarCultivo` de `datos/cultivos.ts`.
- Produces:
  - `export interface EntradaCalendario { cultivoId: string; mesSiembra: number; mesTrasplante?: number; mesCosechaInicio: number; mesCosechaFin: number }`.
  - `export function generarCalendario(cultivoId: string, mesSiembra: number): EntradaCalendario` — usa `diasACosecha` (30 días ≈ 1 mes) y `ventanaDias` para el fin de cosecha; trasplante ≈ mesSiembra+1 si método es semillero.

- [ ] **Step 1: Escribir tests**

Create `src/dominio/calendario.test.ts`:

```ts
import { expect, test } from 'vitest'
import { generarCalendario } from './calendario'

test('cosecha del tomate ~3 meses después de sembrar en abril', () => {
  const e = generarCalendario('tomate', 3) // abril
  expect(e.mesCosechaInicio).toBe(6) // julio (abril + 90 días)
  expect(e.mesCosechaFin).toBeGreaterThanOrEqual(e.mesCosechaInicio)
})

test('el tomate (semillero) tiene mes de trasplante', () => {
  const e = generarCalendario('tomate', 3)
  expect(e.mesTrasplante).toBe(4)
})

test('los meses se envuelven en el año (módulo 12)', () => {
  const e = generarCalendario('tomate', 11) // diciembre + 3 meses → marzo
  expect(e.mesCosechaInicio).toBe(2)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/calendario.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/calendario.ts`:

```ts
import { buscarCultivo } from '../datos/cultivos'

export interface EntradaCalendario {
  cultivoId: string
  mesSiembra: number
  mesTrasplante?: number
  mesCosechaInicio: number
  mesCosechaFin: number
}

function mod12(n: number): number { return ((n % 12) + 12) % 12 }

export function generarCalendario(cultivoId: string, mesSiembra: number): EntradaCalendario {
  const c = buscarCultivo(cultivoId)
  if (!c) throw new Error(`Cultivo desconocido: ${cultivoId}`)
  const mesesACosecha = Math.round(c.diasACosecha / 30)
  const mesCosechaInicio = mod12(mesSiembra + mesesACosecha)
  const mesesVentana = c.ventana === 'continua' ? Math.max(1, Math.round((c.ventanaDias ?? 30) / 30)) : 0
  const mesCosechaFin = mod12(mesCosechaInicio + mesesVentana)
  const mesTrasplante = c.metodo === 'semillero_trasplante' ? mod12(mesSiembra + 1) : undefined
  return { cultivoId, mesSiembra, mesTrasplante, mesCosechaInicio, mesCosechaFin }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/calendario.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/calendario.ts src/dominio/calendario.test.ts
git commit -m "feat: generacion de calendario de siembra y cosecha"
```

---

## Task 13: Estimación de cosecha

**Files:**
- Create: `src/dominio/cosecha.ts`
- Test: `src/dominio/cosecha.test.ts`

**Interfaces:**
- Consumes: `Cultivo`, `UnidadCosecha` de `tipos.ts`; `buscarCultivo` de `datos/cultivos.ts`.
- Produces:
  - `export interface EstimacionCosecha { cultivoId: string; cantidadMin: number; cantidadMax: number; unidad: UnidadCosecha }`.
  - `export function estimarCosecha(cultivoId: string, numPlantas: number): EstimacionCosecha` — rango ±20% sobre `numPlantas * rendimientoPorPlanta`, redondeado.

- [ ] **Step 1: Escribir tests**

Create `src/dominio/cosecha.test.ts`:

```ts
import { expect, test } from 'vitest'
import { estimarCosecha } from './cosecha'

test('estima un rango alrededor de plantas × rendimiento', () => {
  const e = estimarCosecha('tomate', 6) // 6 × 2.5 = 15 kg
  expect(e.unidad).toBe('kg')
  expect(e.cantidadMin).toBeLessThan(15)
  expect(e.cantidadMax).toBeGreaterThan(15)
  expect(e.cantidadMin).toBeGreaterThan(0)
})

test('0 plantas → 0', () => {
  const e = estimarCosecha('lechuga', 0)
  expect(e.cantidadMin).toBe(0)
  expect(e.cantidadMax).toBe(0)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/dominio/cosecha.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/dominio/cosecha.ts`:

```ts
import type { UnidadCosecha } from './tipos'
import { buscarCultivo } from '../datos/cultivos'

export interface EstimacionCosecha {
  cultivoId: string
  cantidadMin: number
  cantidadMax: number
  unidad: UnidadCosecha
}

function redondear(n: number, unidad: UnidadCosecha): number {
  if (unidad === 'unidades') return Math.round(n)
  return Math.round(n * 10) / 10
}

export function estimarCosecha(cultivoId: string, numPlantas: number): EstimacionCosecha {
  const c = buscarCultivo(cultivoId)
  if (!c) throw new Error(`Cultivo desconocido: ${cultivoId}`)
  const base = numPlantas * c.rendimientoPorPlanta
  return {
    cultivoId,
    cantidadMin: redondear(base * 0.8, c.unidad),
    cantidadMax: redondear(base * 1.2, c.unidad),
    unidad: c.unidad,
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/dominio/cosecha.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/cosecha.ts src/dominio/cosecha.test.ts
git commit -m "feat: estimacion de cosecha por rango"
```

---

## Task 14: Almacenamiento (interfaz + localStorage)

**Files:**
- Create: `src/almacenamiento/almacen.ts`
- Test: `src/almacenamiento/almacen.test.ts`

**Interfaces:**
- Consumes: `Huerto`, `EleccionEspecie` de `tipos.ts`.
- Produces:
  - `export interface HuertoGuardado { huerto: Huerto; elecciones: EleccionEspecie[] }`.
  - `export interface Almacen { guardar(clave: string, datos: HuertoGuardado): void; cargar(clave: string): HuertoGuardado | null; borrar(clave: string): void }`.
  - `export function crearAlmacenLocal(storage?: Storage): Almacen` — usa `localStorage` por defecto; acepta un `Storage` inyectado para test.

- [ ] **Step 1: Escribir tests con un Storage falso en memoria**

Create `src/almacenamiento/almacen.test.ts`:

```ts
import { expect, test } from 'vitest'
import { crearAlmacenLocal, type HuertoGuardado } from './almacen'

function storageFalso(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  } as Storage
}

const datos: HuertoGuardado = {
  huerto: { orientacionNorte: 'norte', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }] },
  elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
}

test('guardar y cargar devuelve los mismos datos', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar('mi-huerto', datos)
  expect(a.cargar('mi-huerto')).toEqual(datos)
})

test('cargar una clave inexistente devuelve null', () => {
  const a = crearAlmacenLocal(storageFalso())
  expect(a.cargar('nada')).toBeNull()
})

test('borrar elimina los datos', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar('x', datos)
  a.borrar('x')
  expect(a.cargar('x')).toBeNull()
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/almacenamiento/almacen.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/almacenamiento/almacen.ts`:

```ts
import type { Huerto, EleccionEspecie } from '../dominio/tipos'

export interface HuertoGuardado { huerto: Huerto; elecciones: EleccionEspecie[] }

export interface Almacen {
  guardar(clave: string, datos: HuertoGuardado): void
  cargar(clave: string): HuertoGuardado | null
  borrar(clave: string): void
}

const PREFIJO = 'huertos:'

export function crearAlmacenLocal(storage: Storage = localStorage): Almacen {
  return {
    guardar(clave, datos) { storage.setItem(PREFIJO + clave, JSON.stringify(datos)) },
    cargar(clave) {
      const s = storage.getItem(PREFIJO + clave)
      return s ? (JSON.parse(s) as HuertoGuardado) : null
    },
    borrar(clave) { storage.removeItem(PREFIJO + clave) },
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/almacenamiento/almacen.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/almacenamiento/almacen.ts src/almacenamiento/almacen.test.ts
git commit -m "feat: almacenamiento local del huerto tras una interfaz"
```

---

## Task 15: Barrido final y suite completa

**Files:**
- Test: toda la suite.

- [ ] **Step 1: Ejecutar toda la suite**

Run: `npm test`
Expected: PASS — todos los tests de las tareas 1-14 en verde.

- [ ] **Step 2: Comprobar tipos del proyecto**

Run: `npx tsc --noEmit`
Expected: sin errores de tipos.

- [ ] **Step 3: Commit de cierre (si hubo ajustes)**

```bash
git add -A
git commit -m "chore: nucleo de dominio completo y en verde" || echo "nada que commitear"
```

---

## Self-Review (rellenado por el autor del plan)

**1. Cobertura del spec:**
- §3 flujo (datos que consume): zonas (T4), suelo (T5/T7), clima (T6), especies (T3), sugerencia (T10). La UI del flujo va en el Plan 2.
- §4 arquitectura: scaffolding React+Vite+TS (T1); servicios intercambiables clima (T6) y suelo (T7). CSP/HTTPS/seguridad de cliente → Plan 2 (config de build e índice HTML).
- §5 módulos: cultivos (T3), zonas (T4), suelos (T5), clima (T6), suelo (T7), idoneidad (T8), sinergias (T9), sugerencia (T10), colocacion (T11), calendario (T12), cosecha (T13), almacenamiento (T14). `ui/` y `app/` → Plan 2.
- §6 modelo de cultivo: `Cultivo` en T2, cargado en T3.
- §7 cerebro: idoneidad (T8), sugerencia (T10), sinergias (T9), colocacion (T11), cosecha (T13). "Salida/plano" (§7e, §8) es render → Plan 2.
- §9 calendario/cosecha: T12, T13.
- §11 pruebas: cada módulo con TDD.
- §13 seguridad: sin claves (servicios sin clave, T6/T7), sin red en tests, almacenamiento tras interfaz (T14). CSP/render seguro/HTTPS → Plan 2.

**Gaps conocidos, cubiertos en el Plan 2 (Interfaz y flujo):** componentes `ui/`, orquestación `app/` con recalculación (validación), plano SVG (§8), export imagen/PDF, geocodificador, CSP estricta e índice HTML, manejo de errores de UI (§10), aviso de privacidad.

**2. Placeholder scan:** sin TBD/TODO; todos los pasos con código real.

**3. Consistencia de tipos:** los nombres (`evaluarIdoneidad`, `PerfilClima`, `EleccionEspecie`, `colocar`, `AsignacionCultivo`, etc.) se definen en T2 y se reutilizan idénticos en T8-T14.
