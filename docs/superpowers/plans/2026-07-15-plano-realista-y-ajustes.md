# Plano a escala real, ajustes de cantidades e intercalado — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dibujar el plano de cada bancal a escala real con cotas de distancias, permitir ajustar la cantidad de plantas por especie/bancal con −/+, e intercalar especies con un selector de tres modos; todo se recalcula al momento y se guarda con el plan.

**Architecture:** Un módulo puro nuevo `dominio/distribucion.ts` calcula la posición real de cada planta (filas, distancias del catálogo, altas al norte, tres modos de intercalado) y qué plantas no caben. `colocar()` no se toca; `proponerHuerto()` aplica overrides del usuario (`aplicarAjustes`) y recorta a lo que cabe geométricamente. La UI pinta posiciones ya calculadas y despacha acciones nuevas del reducer; los campos nuevos de `PlanHuerto` son opcionales (sin migración).

**Tech Stack:** React 19 + TypeScript (strict), Vite, Vitest + Testing Library (jsdom), sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-07-15-plano-realista-y-ajustes-design.md`

## Global Constraints

- Todo el código, tests, identificadores y copys de UI en español, siguiendo el estilo del repo (sin punto y coma, comillas simples, funciones puras en `dominio/`).
- Sin dependencias nuevas en `package.json`.
- TDD estricto: test en rojo antes de cada implementación.
- Comandos: tests `npm test` (o `npx vitest run <ruta>` para un archivo), lint `npm run lint`, build `npm run build`.
- Los tests de componentes llevan `// @vitest-environment jsdom` en la primera línea.
- `distribuir` debe ser determinista: mismas entradas → mismas posiciones.
- Commits frecuentes con prefijos `feat:`/`test:`/`refactor:` como en el historial.

---

### Task 1: `dominio/distribucion.ts` — modo `bloques`

**Files:**
- Create: `src/dominio/distribucion.ts`
- Test: `src/dominio/distribucion.test.ts`

**Interfaces:**
- Consumes: `Bancal`, `Cultivo` de `dominio/tipos`; `AsignacionCultivo` de `dominio/colocacion`; `buscarCultivo` de `datos/cultivos`.
- Produces (usado por Tasks 2, 3, 5, 8, 9, 10):
  - `export type ModoIntercalado = 'bloques' | 'companeras' | 'mezcla'`
  - `export interface PlantaPosicionada { cultivoId: string; icono: string; xCm: number; yCm: number }`
  - `export interface ResultadoDistribucion { plantas: PlantaPosicionada[]; noCaben: AsignacionCultivo[] }`
  - `export function distribuir(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado): ResultadoDistribucion`

Datos del catálogo usados en los tests (de `src/datos/cultivos.ts`): lechuga dp=25 dl=30 h=25; tomate dp=50 dl=60 h=150; zanahoria dp=8 dl=25 h=30; cebolla dp=12 dl=25 h=35 (dp=`distanciaPlantaCm`, dl=`distanciaLineaCm`, h=`alturaCm`).

- [ ] **Step 1: Escribir los tests en rojo**

```ts
// src/dominio/distribucion.test.ts
import { expect, test } from 'vitest'
import { distribuir } from './distribucion'
import type { Bancal } from './tipos'

const b2x2: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }

test('coloca las plantas en fila respetando distanciaPlantaCm', () => {
  const { plantas, noCaben } = distribuir(b2x2, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  expect(plantas).toHaveLength(4)
  expect(noCaben).toHaveLength(0)
  // Todas en la misma fila, separadas 25 cm (dp de la lechuga).
  const ys = new Set(plantas.map((p) => p.yCm))
  expect(ys.size).toBe(1)
  const xs = plantas.map((p) => p.xCm).sort((a, b) => a - b)
  for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBe(25)
})

test('deja margen de media distancia al borde del bancal', () => {
  const { plantas } = distribuir(b2x2, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  for (const p of plantas) {
    expect(p.xCm).toBeGreaterThanOrEqual(12) // ~dp/2, con redondeo
    expect(p.xCm).toBeLessThanOrEqual(188)
    expect(p.yCm).toBeGreaterThanOrEqual(14) // ~dl/2, con redondeo
    expect(p.yCm).toBeLessThanOrEqual(186)
  }
})

test('las especies altas quedan al norte (y menor)', () => {
  const alto: Bancal = { id: 'b2', nombre: 'Alto', anchoM: 1, largoM: 3 }
  const { plantas } = distribuir(alto, [
    { cultivoId: 'lechuga', numPlantas: 1 }, // 25 cm de alto
    { cultivoId: 'tomate', numPlantas: 1 }, // 150 cm de alto
  ], 'bloques')
  const tomate = plantas.find((p) => p.cultivoId === 'tomate')!
  const lechuga = plantas.find((p) => p.cultivoId === 'lechuga')!
  expect(tomate.yCm).toBeLessThan(lechuga.yCm)
})

test('entre bloques de especies distintas separa el máximo de sus distanciaLineaCm', () => {
  const b3x3: Bancal = { id: 'b3', nombre: 'B3', anchoM: 3, largoM: 3 }
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 }, // dl 60
    { cultivoId: 'lechuga', numPlantas: 2 }, // dl 30
  ], 'bloques')
  const yTomate = plantas.find((p) => p.cultivoId === 'tomate')!.yCm
  const yLechuga = plantas.find((p) => p.cultivoId === 'lechuga')!.yCm
  expect(yLechuga - yTomate).toBe(60) // max(60, 30)
})

test('una especie más ancha que el bancal va entera a noCaben', () => {
  const estrecho: Bancal = { id: 'b4', nombre: 'Estrecho', anchoM: 0.4, largoM: 2 }
  const { plantas, noCaben } = distribuir(estrecho, [{ cultivoId: 'tomate', numPlantas: 2 }], 'bloques')
  expect(plantas).toHaveLength(0)
  expect(noCaben).toEqual([{ cultivoId: 'tomate', numPlantas: 2 }])
})

test('las filas que desbordan el largo van a noCaben', () => {
  const corto: Bancal = { id: 'b5', nombre: 'Corto', anchoM: 2, largoM: 0.5 }
  // Caben 8 lechugas por fila; la segunda fila (y=45) desborda los 50 cm de largo.
  const { plantas, noCaben } = distribuir(corto, [{ cultivoId: 'lechuga', numPlantas: 10 }], 'bloques')
  expect(plantas).toHaveLength(8)
  expect(noCaben).toEqual([{ cultivoId: 'lechuga', numPlantas: 2 }])
})

test('es determinista y no superpone plantas', () => {
  const entrada = [{ cultivoId: 'lechuga', numPlantas: 6 }, { cultivoId: 'zanahoria', numPlantas: 6 }]
  const r1 = distribuir(b2x2, entrada, 'bloques')
  const r2 = distribuir(b2x2, entrada, 'bloques')
  expect(r1).toEqual(r2)
  const posiciones = new Set(r1.plantas.map((p) => `${p.xCm},${p.yCm}`))
  expect(posiciones.size).toBe(r1.plantas.length)
})

test('ignora cultivos desconocidos y cantidades a cero', () => {
  const { plantas, noCaben } = distribuir(b2x2, [
    { cultivoId: 'inexistente', numPlantas: 3 },
    { cultivoId: 'lechuga', numPlantas: 0 },
  ], 'bloques')
  expect(plantas).toHaveLength(0)
  expect(noCaben).toHaveLength(0)
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: FAIL — `Cannot find module './distribucion'` (o similar).

- [ ] **Step 3: Implementación mínima (solo `bloques`; la estructura de grupos ya queda lista para la Task 2)**

```ts
// src/dominio/distribucion.ts
import type { Bancal, Cultivo } from './tipos'
import type { AsignacionCultivo } from './colocacion'
import { buscarCultivo } from '../datos/cultivos'

export type ModoIntercalado = 'bloques' | 'companeras' | 'mezcla'

export interface PlantaPosicionada { cultivoId: string; icono: string; xCm: number; yCm: number }
export interface ResultadoDistribucion { plantas: PlantaPosicionada[]; noCaben: AsignacionCultivo[] }

interface Entrada { c: Cultivo; n: number }
interface Fila { plantas: { c: Cultivo; xCm: number }[]; maxLineaCm: number }

function entradasDe(asignaciones: AsignacionCultivo[]): Entrada[] {
  const res: Entrada[] = []
  for (const a of asignaciones) {
    const c = buscarCultivo(a.cultivoId)
    if (c && a.numPlantas > 0) res.push({ c, n: a.numPlantas })
  }
  return res
}

// Agrupa especies según el modo; cada grupo empieza en fila nueva y los grupos
// se apilan de norte (altas) a sur (bajas). En 'bloques' cada especie es su grupo.
function agrupar(entradas: Entrada[], modo: ModoIntercalado): Entrada[][] {
  const porAltura = [...entradas].sort((a, b) => b.c.alturaCm - a.c.alturaCm)
  void modo // los modos 'companeras' y 'mezcla' llegan en la siguiente tarea
  return porAltura.map((e) => [e])
}

// Alterna las especies del grupo en round-robin hasta agotar sus plantas.
function secuencia(grupo: Entrada[]): Cultivo[] {
  const restantes = grupo.map((e) => ({ c: e.c, n: e.n }))
  const out: Cultivo[] = []
  while (restantes.some((r) => r.n > 0)) {
    for (const r of restantes) if (r.n > 0) { out.push(r.c); r.n-- }
  }
  return out
}

function anotar(m: Map<string, number>, id: string): void { m.set(id, (m.get(id) ?? 0) + 1) }

export function distribuir(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado): ResultadoDistribucion {
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const noCaben = new Map<string, number>()
  const filas: Fila[] = []

  for (const grupo of agrupar(entradasDe(asignaciones), modo)) {
    let fila: Fila | null = null // cada grupo empieza en fila nueva
    for (const c of secuencia(grupo)) {
      if (c.distanciaPlantaCm > anchoCm) { anotar(noCaben, c.id); continue } // no cabe ni sola
      const ultima = fila?.plantas[fila.plantas.length - 1]
      const x = ultima ? ultima.xCm + Math.max(ultima.c.distanciaPlantaCm, c.distanciaPlantaCm) : c.distanciaPlantaCm / 2
      if (fila && x + c.distanciaPlantaCm / 2 <= anchoCm) {
        fila.plantas.push({ c, xCm: x })
        fila.maxLineaCm = Math.max(fila.maxLineaCm, c.distanciaLineaCm)
      } else {
        fila = { plantas: [{ c, xCm: c.distanciaPlantaCm / 2 }], maxLineaCm: c.distanciaLineaCm }
        filas.push(fila)
      }
    }
  }

  // Posición vertical de cada fila; las que desbordan el largo van a noCaben.
  const plantas: PlantaPosicionada[] = []
  let y = 0
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i]
    y = i === 0 ? f.maxLineaCm / 2 : y + Math.max(filas[i - 1].maxLineaCm, f.maxLineaCm)
    const cabe = y + f.maxLineaCm / 2 <= largoCm
    for (const p of f.plantas) {
      if (cabe) plantas.push({ cultivoId: p.c.id, icono: p.c.icono, xCm: Math.round(p.xCm), yCm: Math.round(y) })
      else anotar(noCaben, p.c.id)
    }
  }

  return { plantas, noCaben: [...noCaben].map(([cultivoId, numPlantas]) => ({ cultivoId, numPlantas })) }
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/distribucion.ts src/dominio/distribucion.test.ts
git commit -m "feat: distribución geométrica de plantas por filas (modo bloques)"
```

---

### Task 2: `distribucion.ts` — modos `companeras` y `mezcla`

**Files:**
- Modify: `src/dominio/distribucion.ts` (función `agrupar`)
- Test: `src/dominio/distribucion.test.ts` (añadir tests)

**Interfaces:**
- Consumes: lo definido en Task 1.
- Produces: `distribuir` acepta `'companeras'` y `'mezcla'` con la semántica del spec. Sin cambios de firma.

- [ ] **Step 1: Añadir tests en rojo** (al final de `src/dominio/distribucion.test.ts`)

```ts
test('mezcla: alterna las especies round-robin dentro de la fila', () => {
  const b3x3: Bancal = { id: 'b6', nombre: 'B6', anchoM: 3, largoM: 3 }
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 },
    { cultivoId: 'lechuga', numPlantas: 2 },
  ], 'mezcla')
  expect(plantas).toHaveLength(4)
  // Caben todas en una fila y se alternan: tomate, lechuga, tomate, lechuga.
  expect(new Set(plantas.map((p) => p.yCm)).size).toBe(1)
  const porX = [...plantas].sort((a, b) => a.xCm - b.xCm).map((p) => p.cultivoId)
  expect(porX).toEqual(['tomate', 'lechuga', 'tomate', 'lechuga'])
})

test('companeras: mezcla solo especies compañeras; el resto en bloques aparte', () => {
  const b3x3: Bancal = { id: 'b7', nombre: 'B7', anchoM: 3, largoM: 3 }
  // tomate y lechuga son compañeras; la cebolla no lo es de ninguna de las dos.
  const { plantas } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 2 },
    { cultivoId: 'lechuga', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'companeras')
  const yTomate = plantas.find((p) => p.cultivoId === 'tomate')!.yCm
  const yLechuga = plantas.find((p) => p.cultivoId === 'lechuga')!.yCm
  const ysCebolla = plantas.filter((p) => p.cultivoId === 'cebolla').map((p) => p.yCm)
  expect(yLechuga).toBe(yTomate) // comparten fila
  for (const y of ysCebolla) expect(y).toBeGreaterThan(yTomate) // bloque aparte, más al sur (menos alta)
})

test('companeras: una especie intermediaria une grupos (tomate-lechuga-zanahoria)', () => {
  const b3x3: Bancal = { id: 'b8', nombre: 'B8', anchoM: 3, largoM: 3 }
  // tomate↔lechuga y lechuga↔zanahoria son compañeras; tomate↔zanahoria no.
  const { plantas, noCaben } = distribuir(b3x3, [
    { cultivoId: 'tomate', numPlantas: 1 },
    { cultivoId: 'zanahoria', numPlantas: 1 },
    { cultivoId: 'lechuga', numPlantas: 1 },
  ], 'companeras')
  expect(noCaben).toHaveLength(0)
  expect(new Set(plantas.map((p) => p.yCm)).size).toBe(1) // las tres en la misma fila
})

test('companeras sin relación entre sí se comporta como bloques', () => {
  const b3x3: Bancal = { id: 'b9', nombre: 'B9', anchoM: 3, largoM: 3 }
  // pimiento y cebolla no son compañeras entre sí.
  const conBloques = distribuir(b3x3, [
    { cultivoId: 'pimiento', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'bloques')
  const conCompaneras = distribuir(b3x3, [
    { cultivoId: 'pimiento', numPlantas: 2 },
    { cultivoId: 'cebolla', numPlantas: 2 },
  ], 'companeras')
  expect(conCompaneras).toEqual(conBloques)
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: FAIL los 4 tests nuevos (hoy `agrupar` trata todo como bloques).

- [ ] **Step 3: Implementar `agrupar` completo** (sustituir la función en `src/dominio/distribucion.ts`)

```ts
function sonCompaneras(a: Cultivo, b: Cultivo): boolean {
  return a.companeras.includes(b.id) || b.companeras.includes(a.id)
}

// Agrupa especies según el modo; cada grupo empieza en fila nueva y los grupos
// se apilan de norte (altas) a sur (bajas), por orden de creación sobre la
// lista ya ordenada por altura.
function agrupar(entradas: Entrada[], modo: ModoIntercalado): Entrada[][] {
  const porAltura = [...entradas].sort((a, b) => b.c.alturaCm - a.c.alturaCm)
  if (modo === 'bloques') return porAltura.map((e) => [e])
  if (modo === 'mezcla') return porAltura.length ? [porAltura] : []
  // companeras: componentes conexas del grafo "es compañera de" (en cualquier sentido).
  const grupos: Entrada[][] = []
  for (const e of porAltura) {
    const conectados = grupos.filter((g) => g.some((x) => sonCompaneras(x.c, e.c)))
    if (conectados.length === 0) { grupos.push([e]); continue }
    const destino = conectados[0]
    destino.push(e)
    for (const otro of conectados.slice(1)) {
      destino.push(...otro)
      grupos.splice(grupos.indexOf(otro), 1)
    }
  }
  return grupos
}
```

Y eliminar el `void modo` del cuerpo anterior.

- [ ] **Step 4: Verificar que pasan todos**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/distribucion.ts src/dominio/distribucion.test.ts
git commit -m "feat: modos de intercalado companeras y mezcla en la distribución"
```

---

### Task 3: `cabeUnaMas`

**Files:**
- Modify: `src/dominio/distribucion.ts`
- Test: `src/dominio/distribucion.test.ts` (añadir tests)

**Interfaces:**
- Produces (usado por Task 10): `export function cabeUnaMas(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado, cultivoId: string): boolean`

- [ ] **Step 1: Tests en rojo** (al final de `src/dominio/distribucion.test.ts`; añadir `cabeUnaMas` al import de `./distribucion`)

```ts
test('cabeUnaMas: true cuando hay sitio para una planta más', () => {
  expect(cabeUnaMas(b2x2, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques', 'lechuga')).toBe(true)
})

test('cabeUnaMas: false cuando la siguiente planta no cabe', () => {
  const mini: Bancal = { id: 'm1', nombre: 'Mini', anchoM: 0.3, largoM: 0.3 }
  // Una lechuga cabe justa (25 cm de marco en 30 cm); la segunda ya no.
  expect(cabeUnaMas(mini, [{ cultivoId: 'lechuga', numPlantas: 1 }], 'bloques', 'lechuga')).toBe(false)
})

test('cabeUnaMas: funciona con una especie aún sin asignación', () => {
  expect(cabeUnaMas(b2x2, [], 'bloques', 'tomate')).toBe(true)
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: FAIL — `cabeUnaMas is not a function` (o no exportada).

- [ ] **Step 3: Implementar** (al final de `src/dominio/distribucion.ts`)

```ts
// Prueba a colocar una planta más de la especie dada; la UI lo usa para el botón «+».
export function cabeUnaMas(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado, cultivoId: string): boolean {
  const existente = asignaciones.find((a) => a.cultivoId === cultivoId)
  const conUnaMas = existente
    ? asignaciones.map((a) => (a.cultivoId === cultivoId ? { ...a, numPlantas: a.numPlantas + 1 } : a))
    : [...asignaciones, { cultivoId, numPlantas: 1 }]
  return distribuir(bancal, conUnaMas, modo).noCaben.length === 0
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/dominio/distribucion.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/distribucion.ts src/dominio/distribucion.test.ts
git commit -m "feat: cabeUnaMas para validar el límite del botón de añadir"
```

---

### Task 4: `aplicarAjustes` en `dominio/colocacion.ts`

**Files:**
- Modify: `src/dominio/colocacion.ts`
- Test: `src/dominio/colocacion.test.ts` (añadir tests)

**Interfaces:**
- Produces (usado por Tasks 5, 6, 7, 11):
  - `export type AjustesColocacion = Record<string, Record<string, number>>` — `bancalId → cultivoId → numPlantas`
  - `export function aplicarAjustes(colocacion: ResultadoColocacion, ajustes: AjustesColocacion): ResultadoColocacion`

- [ ] **Step 1: Tests en rojo** (al final de `src/dominio/colocacion.test.ts`; añadir `aplicarAjustes` al import de `./colocacion`)

```ts
test('aplicarAjustes sobrescribe numPlantas de asignaciones existentes', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b1: { tomate: 2 } })
  expect(resultado.bancales[0].asignaciones[0].numPlantas).toBe(2)
})

test('aplicarAjustes ignora bancales y cultivos que no están en la colocación', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b99: { tomate: 1 }, b1: { lechuga: 5 } })
  expect(resultado.bancales[0].asignaciones).toEqual([{ cultivoId: 'tomate', numPlantas: 6 }])
})

test('aplicarAjustes no muta la entrada y no baja de cero', () => {
  const colocacion = {
    bancales: [{ bancalId: 'b1', asignaciones: [{ cultivoId: 'tomate', numPlantas: 6 }] }],
    avisos: [], noColocadas: [],
  }
  const resultado = aplicarAjustes(colocacion, { b1: { tomate: -3 } })
  expect(resultado.bancales[0].asignaciones[0].numPlantas).toBe(0)
  expect(colocacion.bancales[0].asignaciones[0].numPlantas).toBe(6)
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/dominio/colocacion.test.ts`
Expected: FAIL — `aplicarAjustes` no existe.

- [ ] **Step 3: Implementar** (al final de `src/dominio/colocacion.ts`)

```ts
// Overrides del usuario sobre el resultado de colocar(): bancalId → cultivoId → numPlantas.
export type AjustesColocacion = Record<string, Record<string, number>>

export function aplicarAjustes(colocacion: ResultadoColocacion, ajustes: AjustesColocacion): ResultadoColocacion {
  return {
    ...colocacion,
    bancales: colocacion.bancales.map((b) => ({
      ...b,
      asignaciones: b.asignaciones.map((a) => {
        const n = ajustes[b.bancalId]?.[a.cultivoId]
        return n === undefined ? a : { ...a, numPlantas: Math.max(0, n) }
      }),
    })),
  }
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/dominio/colocacion.test.ts`
Expected: PASS (los existentes + 3 nuevos).

- [ ] **Step 5: Commit**

```bash
git add src/dominio/colocacion.ts src/dominio/colocacion.test.ts
git commit -m "feat: aplicarAjustes para overrides de cantidades del usuario"
```

---

### Task 5: `proponerHuerto` con ajustes, modo de intercalado y recorte geométrico

**Files:**
- Modify: `src/app/proponer.ts`
- Test: `src/app/proponer.test.ts` (añadir tests)

**Interfaces:**
- Consumes: `aplicarAjustes`, `AjustesColocacion` (Task 4); `distribuir`, `ModoIntercalado` (Task 1).
- Produces (usado por Tasks 10, 11):
  - `export interface Recorte { bancalId: string; cultivoId: string; numPlantas: number }`
  - `Propuesta` gana `recortes: Recorte[]`.
  - Firma nueva (parámetros opcionales, compatible con los llamadores actuales): `proponerHuerto(clima, suelo, mesActual, bancales, elecciones, ajustes: AjustesColocacion = {}, modoIntercalado: ModoIntercalado = 'bloques'): Propuesta`

- [ ] **Step 1: Tests en rojo** (al final de `src/app/proponer.test.ts`, reutilizando el estilo de fixtures del archivo: `climaDeZona('mediterraneo_litoral')`, `sueloManual('franco', 6.5)`, mes 5, bancal `{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }`, elección tomate obligatoria/media — si el archivo ya define estas constantes, reutilizarlas)

```ts
test('los ajustes cambian las cantidades y la cosecha estimada', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const sinAjustes = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const conAjustes = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 2 } })
  expect(sinAjustes.cultivos[0].numPlantas).toBeGreaterThan(2)
  expect(conAjustes.cultivos[0].numPlantas).toBe(2)
  expect(conAjustes.colocacion.bancales[0].asignaciones[0].numPlantas).toBe(2)
  expect(conAjustes.cultivos[0].cosecha!.cantidadMax).toBeLessThan(sinAjustes.cultivos[0].cosecha!.cantidadMax)
})

test('sin ajustes que desborden no hay recortes', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(propuesta.recortes).toEqual([])
})

test('un ajuste que no cabe se recorta a lo que cabe geométricamente', () => {
  const bancales = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  // En 200×300 cm caben 20 tomateras (4 por fila × 5 filas a 50×60 cm).
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 999 } })
  expect(propuesta.colocacion.bancales[0].asignaciones[0].numPlantas).toBe(20)
  expect(propuesta.cultivos[0].numPlantas).toBe(20)
  expect(propuesta.recortes).toEqual([{ bancalId: 'b1', cultivoId: 'tomate', numPlantas: 979 }])
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/app/proponer.test.ts`
Expected: FAIL — `recortes` undefined y los ajustes no aplican.

- [ ] **Step 3: Implementar en `src/app/proponer.ts`**

Añadir imports:

```ts
import { colocar, aplicarAjustes, type ResultadoColocacion, type AjustesColocacion } from '../dominio/colocacion'
import { distribuir, type ModoIntercalado } from '../dominio/distribucion'
```

Añadir el tipo y el campo en `Propuesta`:

```ts
export interface Recorte { bancalId: string; cultivoId: string; numPlantas: number }

export interface Propuesta {
  cultivos: PropuestaCultivo[]
  colocacion: ResultadoColocacion
  recortes: Recorte[]
  sinergias: ParejaSinergia[]
  companerasSugeridas: string[]
  avisos: string[]
}
```

Cambiar la firma y el cuerpo (sustituye a `const colocacion = colocar(bancales, aptas)`):

```ts
export function proponerHuerto(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  bancales: Bancal[], elecciones: EleccionEspecie[],
  ajustes: AjustesColocacion = {}, modoIntercalado: ModoIntercalado = 'bloques',
): Propuesta {
```

```ts
  const conAjustes = aplicarAjustes(colocar(bancales, aptas), ajustes)

  // Recorte geométrico: reduce cada asignación a lo que cabe con las distancias
  // reales, para que plano, cosecha y calendario cuenten siempre lo mismo.
  const recortes: Recorte[] = []
  const colocacion: ResultadoColocacion = {
    ...conAjustes,
    bancales: conAjustes.bancales.map((bc) => {
      const bancal = bancales.find((b) => b.id === bc.bancalId)
      if (!bancal) return bc
      const { noCaben } = distribuir(bancal, bc.asignaciones, modoIntercalado)
      if (noCaben.length === 0) return bc
      for (const nc of noCaben) recortes.push({ bancalId: bc.bancalId, cultivoId: nc.cultivoId, numPlantas: nc.numPlantas })
      return {
        ...bc,
        asignaciones: bc.asignaciones.map((a) => {
          const nc = noCaben.find((x) => x.cultivoId === a.cultivoId)
          return nc ? { ...a, numPlantas: a.numPlantas - nc.numPlantas } : a
        }),
      }
    }),
  }
```

Y añadir `recortes` al objeto de retorno.

- [ ] **Step 4: Verificar que pasan todos los tests del archivo y del proyecto**

Run: `npx vitest run src/app/proponer.test.ts && npm test`
Expected: PASS todo (la firma es retrocompatible).

- [ ] **Step 5: Commit**

```bash
git add src/app/proponer.ts src/app/proponer.test.ts
git commit -m "feat: proponerHuerto aplica ajustes y recorta a lo que cabe geométricamente"
```

---

### Task 6: `PlanHuerto` con campos opcionales y round-trip del almacén

**Files:**
- Modify: `src/almacenamiento/almacen.ts`
- Test: `src/almacenamiento/almacen.test.ts` (añadir tests)

**Interfaces:**
- Consumes: `ModoIntercalado` (Task 1), `AjustesColocacion` (Task 4).
- Produces (usado por Tasks 7, 11): `PlanHuerto` gana `modoIntercalado?: ModoIntercalado` y `ajustes?: AjustesColocacion`. `esPlan` NO cambia (campos opcionales → los planes viejos siguen validando). El archivo de test ya tiene los helpers `storageFalso()` y `plan(over: Partial<PlanHuerto>)` — reutilizarlos.

- [ ] **Step 1: Tests en rojo** (al final de `src/almacenamiento/almacen.test.ts`)

```ts
test('guarda y recupera modoIntercalado y ajustes', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan({ id: 'px', modoIntercalado: 'mezcla', ajustes: { b1: { tomate: 2 } } }))
  const cargado = a.cargar('px')!
  expect(cargado.modoIntercalado).toBe('mezcla')
  expect(cargado.ajustes).toEqual({ b1: { tomate: 2 } })
})

test('un plan guardado sin los campos nuevos sigue cargando', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan()) // sin modoIntercalado ni ajustes
  const cargado = a.cargar('p1')!
  expect(cargado.modoIntercalado).toBeUndefined()
  expect(cargado.ajustes).toBeUndefined()
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/almacenamiento/almacen.test.ts`
Expected: FAIL por tipos — `modoIntercalado` y `ajustes` no existen en `PlanHuerto`.

- [ ] **Step 3: Implementar en `src/almacenamiento/almacen.ts`**

Imports:

```ts
import type { PerfilClima, PerfilSuelo, Bancal, Orientacion, EleccionEspecie } from '../dominio/tipos'
import type { AjustesColocacion } from '../dominio/colocacion'
import type { ModoIntercalado } from '../dominio/distribucion'
```

En `PlanHuerto`, tras `elecciones`:

```ts
  // Personalización del resultado; opcionales para que los planes antiguos sigan cargando.
  modoIntercalado?: ModoIntercalado
  ajustes?: AjustesColocacion
```

`esPlan` no se toca.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/almacenamiento/almacen.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/almacenamiento/almacen.ts src/almacenamiento/almacen.test.ts
git commit -m "feat: PlanHuerto guarda modo de intercalado y ajustes (opcionales)"
```

---

### Task 7: Estado — `modoIntercalado`, `ajustes` y acciones nuevas

**Files:**
- Modify: `src/app/estado.ts`
- Test: `src/app/estado.test.ts` (añadir tests)

**Interfaces:**
- Consumes: `ModoIntercalado` (Task 1), `AjustesColocacion` (Task 4), campos opcionales de `PlanHuerto` (Task 6).
- Produces (usado por Task 11): campos `modoIntercalado: ModoIntercalado` y `ajustes: AjustesColocacion` en `EstadoApp`; acciones `{ tipo: 'set_modo_intercalado'; modo: ModoIntercalado }` y `{ tipo: 'ajustar_cantidad'; bancalId: string; cultivoId: string; numPlantas: number }`.

- [ ] **Step 1: Tests en rojo** (al final de `src/app/estado.test.ts`)

```ts
test('set_modo_intercalado cambia el modo', () => {
  const e = reducer(estadoInicial, { tipo: 'set_modo_intercalado', modo: 'mezcla' })
  expect(e.modoIntercalado).toBe('mezcla')
})

test('ajustar_cantidad acumula overrides por bancal y cultivo', () => {
  let e = reducer(estadoInicial, { tipo: 'ajustar_cantidad', bancalId: 'b1', cultivoId: 'tomate', numPlantas: 7 })
  e = reducer(e, { tipo: 'ajustar_cantidad', bancalId: 'b1', cultivoId: 'lechuga', numPlantas: 3 })
  expect(e.ajustes).toEqual({ b1: { tomate: 7, lechuga: 3 } })
})

test('empezar_plan resetea intercalado y ajustes', () => {
  let e = reducer(estadoInicial, { tipo: 'set_modo_intercalado', modo: 'mezcla' })
  e = reducer(e, { tipo: 'ajustar_cantidad', bancalId: 'b1', cultivoId: 'tomate', numPlantas: 7 })
  e = reducer(e, { tipo: 'empezar_plan', mesSiembra: 4 })
  expect(e.modoIntercalado).toBe('bloques')
  expect(e.ajustes).toEqual({})
})

test('cargar_plan restaura intercalado y ajustes, con valores por defecto si faltan', () => {
  const base = {
    id: 'p1', nombre: 'P', guardadoEn: 1, mesSiembra: 3,
    modoUbicacion: 'zona' as const, coordenadas: null, zonaId: 'z',
    clima: { id: 'z', nombre: 'Z', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: -1, mesPrimeraHelada: -1 },
    suelo: { textura: 'franco' as const, ph: 6.5, drenaje: 'bueno' as const },
    orientacionNorte: 'norte' as const, bancales: [], elecciones: [],
  }
  const con = reducer(estadoInicial, { tipo: 'cargar_plan', plan: { ...base, modoIntercalado: 'companeras', ajustes: { b1: { tomate: 2 } } } })
  expect(con.modoIntercalado).toBe('companeras')
  expect(con.ajustes).toEqual({ b1: { tomate: 2 } })
  const sin = reducer(estadoInicial, { tipo: 'cargar_plan', plan: base })
  expect(sin.modoIntercalado).toBe('bloques')
  expect(sin.ajustes).toEqual({})
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/app/estado.test.ts`
Expected: FAIL (acciones y campos inexistentes; error de tipos al compilar el test).

- [ ] **Step 3: Implementar en `src/app/estado.ts`**

Imports nuevos:

```ts
import type { AjustesColocacion } from '../dominio/colocacion'
import type { ModoIntercalado } from '../dominio/distribucion'
```

En `EstadoApp` añadir:

```ts
  modoIntercalado: ModoIntercalado
  ajustes: AjustesColocacion
```

En `Accion` añadir:

```ts
  | { tipo: 'set_modo_intercalado'; modo: ModoIntercalado }
  | { tipo: 'ajustar_cantidad'; bancalId: string; cultivoId: string; numPlantas: number }
```

En `estadoInicial` añadir: `modoIntercalado: 'bloques', ajustes: {},`

En el `reducer`:

```ts
    case 'set_modo_intercalado': return { ...estado, modoIntercalado: accion.modo }
    case 'ajustar_cantidad': return {
      ...estado,
      ajustes: { ...estado.ajustes, [accion.bancalId]: { ...estado.ajustes[accion.bancalId], [accion.cultivoId]: accion.numPlantas } },
    }
```

En `empezar_plan`: `return { ...estado, paso: 'ubicacion', mesSiembra: accion.mesSiembra, modoIntercalado: 'bloques', ajustes: {} }`

En `cargar_plan`, dentro del objeto devuelto: `modoIntercalado: p.modoIntercalado ?? 'bloques', ajustes: p.ajustes ?? {},`

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/app/estado.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/estado.ts src/app/estado.test.ts
git commit -m "feat: estado con modo de intercalado y ajustes de cantidades"
```

---

### Task 8: `ui/cotas.ts` — cotas de distancias a partir de posiciones

**Files:**
- Create: `src/ui/cotas.ts`
- Test: `src/ui/cotas.test.ts`

**Interfaces:**
- Consumes: `PlantaPosicionada` (Task 1).
- Produces (usado por Task 9):
  - `export interface Cota { cultivoId: string; orientacion: 'horizontal' | 'vertical'; x1Cm: number; y1Cm: number; x2Cm: number; y2Cm: number; etiqueta: string }`
  - `export function calcularCotas(plantas: PlantaPosicionada[]): Cota[]` — por especie, como mucho una cota horizontal (el par más cercano dentro de una misma fila) y una vertical (el par más cercano entre filas distintas); la etiqueta es la distancia medida, p. ej. `'25 cm'`.

- [ ] **Step 1: Tests en rojo**

```ts
// src/ui/cotas.test.ts
import { expect, test } from 'vitest'
import { calcularCotas } from './cotas'
import { distribuir } from '../dominio/distribucion'
import type { Bancal } from '../dominio/tipos'

test('una fila de lechugas produce solo la cota horizontal con su distancia', () => {
  const b: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }
  const { plantas } = distribuir(b, [{ cultivoId: 'lechuga', numPlantas: 4 }], 'bloques')
  const cotas = calcularCotas(plantas)
  expect(cotas).toHaveLength(1)
  expect(cotas[0]).toMatchObject({ cultivoId: 'lechuga', orientacion: 'horizontal', etiqueta: '25 cm' })
})

test('dos filas de lechugas añaden la cota vertical entre líneas', () => {
  const b: Bancal = { id: 'b2', nombre: 'B2', anchoM: 2, largoM: 1 }
  const { plantas } = distribuir(b, [{ cultivoId: 'lechuga', numPlantas: 10 }], 'bloques')
  const cotas = calcularCotas(plantas)
  const vertical = cotas.find((c) => c.orientacion === 'vertical')!
  expect(vertical.etiqueta).toBe('30 cm')
})

test('una especie con una sola planta no lleva cotas', () => {
  const b: Bancal = { id: 'b3', nombre: 'B3', anchoM: 2, largoM: 2 }
  const { plantas } = distribuir(b, [{ cultivoId: 'tomate', numPlantas: 1 }], 'bloques')
  expect(calcularCotas(plantas)).toEqual([])
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/ui/cotas.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// src/ui/cotas.ts
import type { PlantaPosicionada } from '../dominio/distribucion'

export interface Cota {
  cultivoId: string
  orientacion: 'horizontal' | 'vertical'
  x1Cm: number
  y1Cm: number
  x2Cm: number
  y2Cm: number
  etiqueta: string
}

// Por especie: una cota horizontal (par más cercano en la misma fila) y una
// vertical (par más cercano entre filas). La etiqueta es la distancia medida.
export function calcularCotas(plantas: PlantaPosicionada[]): Cota[] {
  const porCultivo = new Map<string, PlantaPosicionada[]>()
  for (const p of plantas) {
    const lista = porCultivo.get(p.cultivoId) ?? []
    lista.push(p)
    porCultivo.set(p.cultivoId, lista)
  }

  const cotas: Cota[] = []
  for (const [cultivoId, lista] of porCultivo) {
    let h: [PlantaPosicionada, PlantaPosicionada] | null = null
    let v: [PlantaPosicionada, PlantaPosicionada] | null = null
    for (const a of lista) {
      for (const b of lista) {
        if (a === b) continue
        if (a.yCm === b.yCm && a.xCm < b.xCm && (!h || b.xCm - a.xCm < h[1].xCm - h[0].xCm)) h = [a, b]
        if (a.yCm < b.yCm && (!v || b.yCm - a.yCm < v[1].yCm - v[0].yCm)) v = [a, b]
      }
    }
    if (h) cotas.push({ cultivoId, orientacion: 'horizontal', x1Cm: h[0].xCm, y1Cm: h[0].yCm, x2Cm: h[1].xCm, y2Cm: h[1].yCm, etiqueta: `${h[1].xCm - h[0].xCm} cm` })
    if (v) cotas.push({ cultivoId, orientacion: 'vertical', x1Cm: v[0].xCm, y1Cm: v[0].yCm, x2Cm: v[1].xCm, y2Cm: v[1].yCm, etiqueta: `${v[1].yCm - v[0].yCm} cm` })
  }
  return cotas
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run src/ui/cotas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/cotas.ts src/ui/cotas.test.ts
git commit -m "feat: cálculo de cotas de distancias a partir de las posiciones"
```

---

### Task 9: `PlanoBancal` a escala real con cotas; retirar `plano-geometria`

**Files:**
- Modify: `src/ui/PlanoBancal.tsx`
- Modify: `src/ui/PlanoBancal.test.tsx`
- Delete: `src/ui/plano-geometria.ts`, `src/ui/plano-geometria.test.ts`

**Interfaces:**
- Consumes: `distribuir`, `ModoIntercalado` (Task 1); `calcularCotas` (Task 8).
- Produces (usado por Task 10): `PlanoBancal` gana la prop obligatoria `modoIntercalado: ModoIntercalado`. Las marcas siguen llevando `data-marca`; las cotas llevan `data-cota`.

- [ ] **Step 1: Actualizar/añadir tests en rojo** (reemplazar el contenido de `src/ui/PlanoBancal.test.tsx`)

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PlanoBancal } from './PlanoBancal'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 2 }

test('renderiza un SVG accesible con el nombre del bancal', () => {
  render(<PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 2 }]} orientacionNorte="norte" modoIntercalado="bloques" />)
  expect(screen.getByRole('img', { name: /Bancal 1/i })).toBeInTheDocument()
})

test('dibuja una marca por planta en su posición real', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 3 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  const marcas = [...container.querySelectorAll('[data-marca]')]
  expect(marcas).toHaveLength(3)
  // Posiciones reales: separadas 25 cm dentro de la fila.
  const xs = marcas.map((m) => Number(/translate\((\d+),/.exec(m.getAttribute('transform') ?? '')?.[1])).sort((a, b) => a - b)
  expect(xs[1] - xs[0]).toBe(25)
  expect(xs[2] - xs[1]).toBe(25)
})

test('muestra cotas con la distancia entre plantas', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 4 }]} orientacionNorte="norte" modoIntercalado="bloques" />,
  )
  expect(container.querySelectorAll('[data-cota]').length).toBeGreaterThan(0)
  expect(screen.getByText('25 cm')).toBeInTheDocument()
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/ui/PlanoBancal.test.tsx`
Expected: FAIL (prop inexistente, sin cotas, posiciones de rejilla uniforme).

- [ ] **Step 3: Reescribir `src/ui/PlanoBancal.tsx`**

```tsx
import type { Bancal, Orientacion } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { distribuir, type ModoIntercalado } from '../dominio/distribucion'
import { calcularCotas, type Cota } from './cotas'

const FLECHA: Record<Orientacion, string> = { norte: '↑ N', sur: '↓ N', este: '→ N', oeste: '← N' }

function LineaCota({ cota }: { cota: Cota }) {
  if (cota.orientacion === 'horizontal') {
    const y = cota.y1Cm - 12
    return (
      <g data-cota stroke="#888" strokeWidth={0.8}>
        <line x1={cota.x1Cm} y1={y} x2={cota.x2Cm} y2={y} />
        <line x1={cota.x1Cm} y1={y - 3} x2={cota.x1Cm} y2={y + 3} />
        <line x1={cota.x2Cm} y1={y - 3} x2={cota.x2Cm} y2={y + 3} />
        <text x={(cota.x1Cm + cota.x2Cm) / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="#555" stroke="none">{cota.etiqueta}</text>
      </g>
    )
  }
  const x = cota.x1Cm - 12
  return (
    <g data-cota stroke="#888" strokeWidth={0.8}>
      <line x1={x} y1={cota.y1Cm} x2={x} y2={cota.y2Cm} />
      <line x1={x - 3} y1={cota.y1Cm} x2={x + 3} y2={cota.y1Cm} />
      <line x1={x - 3} y1={cota.y2Cm} x2={x + 3} y2={cota.y2Cm} />
      <text x={x - 4} y={(cota.y1Cm + cota.y2Cm) / 2} textAnchor="end" dominantBaseline="central" fontSize={9} fill="#555" stroke="none">{cota.etiqueta}</text>
    </g>
  )
}

export function PlanoBancal(props: {
  bancal: Bancal; asignaciones: AsignacionCultivo[]; orientacionNorte: Orientacion
  modoIntercalado: ModoIntercalado; maxAnchoPx?: number
}) {
  const { bancal, asignaciones, orientacionNorte, modoIntercalado, maxAnchoPx = 480 } = props
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const { plantas } = distribuir(bancal, asignaciones, modoIntercalado)
  const cotas = calcularCotas(plantas)

  return (
    <svg
      role="img"
      aria-label={`Plano del ${bancal.nombre}`}
      viewBox={`0 0 ${anchoCm} ${largoCm}`}
      width="100%"
      style={{ maxWidth: maxAnchoPx, border: '1px solid #999', background: '#f7f5ef' }}
    >
      <rect x={0} y={0} width={anchoCm} height={largoCm} fill="none" stroke="#bbb" />
      {plantas.map((p, i) => (
        <g key={i} data-marca transform={`translate(${p.xCm}, ${p.yCm})`}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={16}>{p.icono}</text>
        </g>
      ))}
      {cotas.map((c, i) => <LineaCota key={`${c.cultivoId}-${c.orientacion}-${i}`} cota={c} />)}
      <text x={6} y={18} fontSize={14} fill="#333">{FLECHA[orientacionNorte]}</text>
    </svg>
  )
}
```

- [ ] **Step 4: Borrar la rejilla uniforme**

```bash
rm src/ui/plano-geometria.ts src/ui/plano-geometria.test.ts
```

- [ ] **Step 5: Verificar** — el resto del proyecto aún no compila del todo porque `PanelResultado` no pasa la prop nueva; pasarla ya con el valor fijo `"bloques"` en `src/ui/PanelResultado.tsx` (línea del `<PlanoBancal …>`) como apaño temporal que la Task 10 sustituye:

```tsx
<PlanoBancal bancal={b} asignaciones={col?.asignaciones ?? []} orientacionNorte={orientacionNorte} modoIntercalado="bloques" />
```

Run: `npx vitest run src/ui/PlanoBancal.test.tsx && npm test`
Expected: PASS todo.

- [ ] **Step 6: Commit**

```bash
git add -A src/ui
git commit -m "feat: plano del bancal a escala real con cotas de distancias"
```

---

### Task 10: `PanelResultado` — leyenda con −/+, selector de intercalado y avisos de recorte

**Files:**
- Modify: `src/ui/PanelResultado.tsx`
- Modify: `src/ui/PanelResultado.test.tsx`
- Modify: `src/ui/PanelResultado.export.test.tsx`

**Interfaces:**
- Consumes: `cabeUnaMas`, `ModoIntercalado` (Tasks 1, 3); `Propuesta.recortes` (Task 5); `PlanoBancal` con `modoIntercalado` (Task 9).
- Produces (usado por Task 11): firma nueva de `PanelResultado`:

```tsx
export function PanelResultado(props: {
  propuesta: Propuesta
  bancales: Bancal[]
  orientacionNorte: Orientacion
  modoIntercalado: ModoIntercalado
  onModoIntercalado: (modo: ModoIntercalado) => void
  onAjustarCantidad: (bancalId: string, cultivoId: string, numPlantas: number) => void
})
```

- [ ] **Step 1: Actualizar los tests existentes y añadir los nuevos**

En `src/ui/PanelResultado.export.test.tsx`, añadir a la llamada `render` las props nuevas:

```tsx
render(<PanelResultado propuesta={propuesta} bancales={bancales} orientacionNorte="norte" modoIntercalado="bloques" onModoIntercalado={() => {}} onAjustarCantidad={() => {}} />)
```

En `src/ui/PanelResultado.test.tsx`, actualizar el test existente (el tomate ahora aparece 3 veces: calendario, cosecha y leyenda) y añadir los nuevos:

```tsx
// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { PanelResultado } from './PanelResultado'
import { proponerHuerto } from '../app/proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]

const propsBase = { bancales, orientacionNorte: 'norte' as const, modoIntercalado: 'bloques' as const, onModoIntercalado: () => {}, onAjustarCantidad: () => {} }

test('muestra el resumen de cosecha del tomate en kg', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  // Calendario + cosecha + leyenda del bancal.
  expect(screen.getAllByText(/Tomate/i)).toHaveLength(3)
  expect(screen.getByText(/kg/i)).toBeInTheDocument()
})

test('la leyenda muestra cantidad y marco de plantación por especie', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  const leyenda = within(screen.getByRole('list', { name: /Plantas en B1/i }))
  expect(leyenda.getByText(/50 × 60 cm/)).toBeInTheDocument() // marco del tomate
  expect(leyenda.getByText('6')).toBeInTheDocument() // 6 tomateras en 2×3 m
})

test('el botón + pide una planta más y el − una menos', async () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const onAjustarCantidad = vi.fn()
  render(<PanelResultado propuesta={propuesta} {...propsBase} onAjustarCantidad={onAjustarCantidad} />)
  await userEvent.click(screen.getByRole('button', { name: /Añadir Tomate/i }))
  expect(onAjustarCantidad).toHaveBeenCalledWith('b1', 'tomate', 7)
  await userEvent.click(screen.getByRole('button', { name: /Quitar Tomate/i }))
  expect(onAjustarCantidad).toHaveBeenCalledWith('b1', 'tomate', 5)
})

test('el botón + se deshabilita cuando no cabe ni una planta más', () => {
  const mini: Bancal[] = [{ id: 'b1', nombre: 'Mini', anchoM: 0.4, largoM: 0.4 }]
  const propuesta = proponerHuerto(clima, suelo, 5, mini, elecciones)
  render(<PanelResultado propuesta={propuesta} {...propsBase} bancales={mini} />)
  expect(screen.getByRole('button', { name: /Añadir Tomate/i })).toBeDisabled()
})

test('el selector de intercalado notifica el modo elegido', async () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  const onModoIntercalado = vi.fn()
  render(<PanelResultado propuesta={propuesta} {...propsBase} onModoIntercalado={onModoIntercalado} />)
  await userEvent.click(screen.getByRole('radio', { name: /Solo compañeras/i }))
  expect(onModoIntercalado).toHaveBeenCalledWith('companeras')
})

test('muestra el aviso de recorte cuando no caben las plantas pedidas', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones, { b1: { tomate: 999 } })
  render(<PanelResultado propuesta={propuesta} {...propsBase} />)
  expect(screen.getByText(/no caben 979 Tomate con las distancias requeridas/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/ui/PanelResultado.test.tsx`
Expected: FAIL (props y elementos inexistentes).

- [ ] **Step 3: Implementar en `src/ui/PanelResultado.tsx`**

Imports nuevos:

```tsx
import type { Propuesta } from '../app/proponer'
import type { Bancal, Orientacion } from '../dominio/tipos'
import { buscarCultivo } from '../datos/cultivos'
import { cabeUnaMas, type ModoIntercalado } from '../dominio/distribucion'
```

Firma nueva (ver Interfaces). Dentro del `bancales.map((b) => …)` existente, tras el `<PlanoBancal …>` (que ahora recibe `modoIntercalado={modoIntercalado}` en lugar del apaño `"bloques"` de la Task 9), añadir la leyenda y los avisos:

```tsx
<ul aria-label={`Plantas en ${b.nombre}`}>
  {(col?.asignaciones ?? []).map((a) => {
    const c = buscarCultivo(a.cultivoId)
    if (!c) return null
    return (
      <li key={a.cultivoId}>
        {c.icono} {c.nombreComun} — {c.distanciaPlantaCm} × {c.distanciaLineaCm} cm{' '}
        <button type="button" aria-label={`Quitar ${c.nombreComun} de ${b.nombre}`} disabled={a.numPlantas === 0}
          onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas - 1)}>−</button>
        <span> {a.numPlantas} </span>
        <button type="button" aria-label={`Añadir ${c.nombreComun} en ${b.nombre}`}
          disabled={!cabeUnaMas(b, col?.asignaciones ?? [], modoIntercalado, a.cultivoId)}
          onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas + 1)}>+</button>
      </li>
    )
  })}
</ul>
{propuesta.recortes.filter((r) => r.bancalId === b.id).map((r) => (
  <p key={r.cultivoId} role="alert">En {b.nombre} no caben {r.numPlantas} {nombre(r.cultivoId)} con las distancias requeridas.</p>
))}
```

Y antes del `bancales.map`, dentro de la sección «Tu huerto», el selector:

```tsx
<fieldset>
  <legend>¿Intercalar especies?</legend>
  {([['bloques', 'Sin intercalar'], ['companeras', 'Solo compañeras'], ['mezcla', 'Todas las compatibles']] as const).map(([valor, etiqueta]) => (
    <label key={valor} style={{ marginRight: 12 }}>
      <input type="radio" name="modo-intercalado" checked={modoIntercalado === valor} onChange={() => onModoIntercalado(valor)} /> {etiqueta}
    </label>
  ))}
</fieldset>
```

- [ ] **Step 4: Verificar que pasan (incluido el test de exportación)**

Run: `npx vitest run src/ui/PanelResultado.test.tsx src/ui/PanelResultado.export.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/PanelResultado.tsx src/ui/PanelResultado.test.tsx src/ui/PanelResultado.export.test.tsx
git commit -m "feat: leyenda con ajustes de cantidad, selector de intercalado y avisos de recorte"
```

---

### Task 11: Cablear `App` — recálculo, acciones y persistencia; verificación final

**Files:**
- Modify: `src/ui/App.tsx`
- Test: `src/ui/App.test.tsx` (añadir test)

**Interfaces:**
- Consumes: todo lo anterior. No produce interfaces nuevas.

- [ ] **Step 1: Test en rojo** (al final de `src/ui/App.test.tsx`)

```tsx
test('ajustar cantidad con + actualiza la leyenda y se guarda con el plan', async () => {
  await llegarAResultados()
  // 6 tomateras por defecto en un bancal de 2×3 m.
  const leyenda = within(screen.getByRole('list', { name: /Plantas en/i }))
  expect(leyenda.getByText('6')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Añadir Tomate/i }))
  expect(leyenda.getByText('7')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('radio', { name: /Todas las compatibles/i }))

  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Con ajustes')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  const plan = crearAlmacenLocal().listar().find((p) => p.nombre === 'Con ajustes')!
  expect(plan.modoIntercalado).toBe('mezcla')
  expect(Object.values(plan.ajustes!)[0]).toEqual({ tomate: 7 })
})
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run src/ui/App.test.tsx`
Expected: FAIL (App no pasa las props nuevas → error de tipos/compilación).

- [ ] **Step 3: Implementar en `src/ui/App.tsx`**

`useMemo` de la propuesta (sustituir el existente, `src/ui/App.tsx:36-39`):

```tsx
const propuesta = useMemo(() => {
  if (!estado.clima || !estado.suelo) return null
  return proponerHuerto(estado.clima, estado.suelo, estado.mesSiembra, estado.bancales, estado.elecciones, estado.ajustes, estado.modoIntercalado)
}, [estado.clima, estado.suelo, estado.bancales, estado.elecciones, estado.mesSiembra, estado.ajustes, estado.modoIntercalado])
```

Llamada a `PanelResultado` (sustituir la existente, `src/ui/App.tsx:92`):

```tsx
<PanelResultado
  propuesta={propuesta} bancales={estado.bancales} orientacionNorte={estado.orientacionNorte}
  modoIntercalado={estado.modoIntercalado}
  onModoIntercalado={(modo) => dispatch({ tipo: 'set_modo_intercalado', modo })}
  onAjustarCantidad={(bancalId, cultivoId, numPlantas) => dispatch({ tipo: 'ajustar_cantidad', bancalId, cultivoId, numPlantas })}
/>
```

En `almacen.guardar({ … })` (`src/ui/App.tsx:103-108`), añadir al objeto:

```tsx
modoIntercalado: estado.modoIntercalado, ajustes: estado.ajustes,
```

- [ ] **Step 4: Verificación final completa**

Run: `npm test`
Expected: PASS toda la suite.

Run: `npm run lint`
Expected: sin errores.

Run: `npm run build`
Expected: build correcto (`tsc -b` sin errores de tipos).

- [ ] **Step 5: Commit**

```bash
git add src/ui/App.tsx src/ui/App.test.tsx
git commit -m "feat: ajustes e intercalado cableados en la app y persistidos con el plan"
```
