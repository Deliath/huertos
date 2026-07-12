# Huertos — Interfaz y flujo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la interfaz React (asistente por pasos), el orquestador de la propuesta con recálculo en la fase de validación, el plano SVG, la exportación y el endurecimiento de seguridad del cliente, todo sobre el núcleo del Plan 1.

**Architecture:** SPA React + Vite + TypeScript. El estado del asistente vive en un `useReducer` puro y testeable (`app/estado.ts`). Un orquestador puro (`app/proponer.ts`) transforma estado → propuesta llamando al dominio. Los componentes son presentacionales y reciben datos por props. El plano es SVG generado a partir de la colocación. Seguridad por defecto: CSP estricta, sin `dangerouslySetInnerHTML`, validación de entradas, HTTPS.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + @testing-library/react (jsdom), Leaflet + react-leaflet (mapa), Nominatim (geocodificador, sin clave), jsPDF (export PDF). Núcleo del Plan 1 como dependencia interna.

## Global Constraints

- **Depende del Plan 1 completo y en verde** (todos los módulos `src/dominio/*`, `src/datos/*`, `src/almacenamiento/*`).
- **TypeScript estricto**; español en dominio y textos de usuario.
- **Sin claves de API**: Open-Meteo, SoilGrids, OSM/Nominatim, tiles de OSM — todos sin clave (spec §13).
- **Seguridad de cliente (spec §13):** CSP estricta que solo permita los orígenes usados; **prohibido `dangerouslySetInnerHTML`**; validar coordenadas y medidas; HTTPS en despliegue.
- **Privacidad (spec §13):** datos solo en `localStorage`; el modo "zona climática + suelo manual" no debe emitir ninguna llamada externa; aviso de privacidad visible.
- **Tests de componentes** con `// @vitest-environment jsdom` en la cabecera del archivo de test.
- **Meses:** 0 = enero … 11 = diciembre (igual que el núcleo).
- **TDD, DRY, YAGNI, commits frecuentes.**

---

## File Structure

- `index.html` — meta CSP estricta + `lang="es"`.
- `src/app/estado.ts` — tipos de estado del asistente + `reducer` puro + `estadoInicial`.
- `src/app/proponer.ts` — orquestador puro estado → `Propuesta`.
- `src/app/formato.ts` — helpers de formato (nombres de mes, textos de cantidad).
- `src/servicios/geocodificador.ts` — búsqueda de direcciones (Nominatim) con parseo puro.
- `src/ui/App.tsx` — contenedor del asistente y navegación por pasos.
- `src/ui/PantallaInicio.tsx`
- `src/ui/PasoUbicacion.tsx` (+ `MapaSelector.tsx`)
- `src/ui/EditorBancales.tsx`
- `src/ui/PasoSuelo.tsx`
- `src/ui/SelectorEspecies.tsx`
- `src/ui/PlanoBancal.tsx` (SVG) + `src/ui/plano-geometria.ts` (cálculo puro de posiciones)
- `src/ui/VistaCalendario.tsx`
- `src/ui/PanelResultado.tsx` (fichas, cosecha, sinergias, consejos de suelo; editable = validación)
- `src/ui/exportar.ts` — SVG → PNG/PDF + descarga.
- `src/ui/AvisoPrivacidad.tsx`
- Tests `*.test.ts(x)` junto a cada archivo.

---

## Task 1: Dependencias de UI y configuración de tests de componentes

**Files:**
- Modify: `package.json`, `vitest.config.ts`
- Create: `src/ui/humo.test.tsx`

**Interfaces:**
- Produces: entorno capaz de renderizar componentes React en tests (jsdom + testing-library).

- [ ] **Step 1: Instalar dependencias**

```bash
npm install leaflet react-leaflet jspdf
npm install -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Permitir tests .tsx en Vitest**

Modify `vitest.config.ts` para incluir `.tsx` y setup:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Escribir un test de humo de render que falla**

Create `src/ui/humo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Humo } from './humo'

test('renderiza un componente React', () => {
  render(<Humo />)
  expect(screen.getByText('render-ok')).toBeInTheDocument()
})
```

- [ ] **Step 4: Ejecutar y verificar que falla**

Run: `npm test src/ui/humo.test.tsx`
Expected: FAIL — `./humo` no existe.

- [ ] **Step 5: Implementación mínima**

Create `src/ui/humo.tsx`:

```tsx
export function Humo() {
  return <p>render-ok</p>
}
```

- [ ] **Step 6: Ejecutar y verificar que pasa**

Run: `npm test src/ui/humo.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test-setup.ts src/ui/humo.tsx src/ui/humo.test.tsx
git commit -m "chore: entorno de tests de componentes (jsdom + testing-library)"
```

---

## Task 2: Estado del asistente (reducer puro)

**Files:**
- Create: `src/app/estado.ts`
- Test: `src/app/estado.test.ts`

**Interfaces:**
- Consumes: `Huerto`, `Bancal`, `Orientacion`, `PerfilClima`, `PerfilSuelo`, `EleccionEspecie`, `Textura` de `dominio/tipos`.
- Produces:
  - `export type Paso = 'inicio' | 'ubicacion' | 'bancales' | 'suelo' | 'especies' | 'resultado'`.
  - `export interface EstadoApp { paso: Paso; modoUbicacion: 'precisa' | 'zona' | null; coordenadas: { lat: number; lon: number } | null; zonaId: string | null; clima: PerfilClima | null; suelo: PerfilSuelo | null; orientacionNorte: Orientacion; bancales: Bancal[]; elecciones: EleccionEspecie[] }`.
  - `export type Accion` (union con: `ir_a_paso`, `set_clima`, `set_suelo`, `set_orientacion`, `añadir_bancal`, `editar_bancal`, `borrar_bancal`, `set_elecciones`).
  - `export const estadoInicial: EstadoApp`.
  - `export function reducer(estado: EstadoApp, accion: Accion): EstadoApp`.

- [ ] **Step 1: Escribir tests del reducer**

Create `src/app/estado.test.ts`:

```ts
import { expect, test } from 'vitest'
import { reducer, estadoInicial } from './estado'

test('añadir_bancal agrega un bancal con id único', () => {
  const s1 = reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 } })
  expect(s1.bancales).toHaveLength(1)
})

test('borrar_bancal elimina por id', () => {
  const s1 = reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 } })
  const s2 = reducer(s1, { tipo: 'borrar_bancal', id: 'b1' })
  expect(s2.bancales).toHaveLength(0)
})

test('ir_a_paso cambia el paso', () => {
  const s = reducer(estadoInicial, { tipo: 'ir_a_paso', paso: 'especies' })
  expect(s.paso).toBe('especies')
})

test('el reducer no muta el estado anterior', () => {
  const antes = estadoInicial.bancales.length
  reducer(estadoInicial, { tipo: 'añadir_bancal', bancal: { id: 'b1', nombre: 'B1', anchoM: 1, largoM: 1 } })
  expect(estadoInicial.bancales.length).toBe(antes)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/app/estado.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar el reducer**

Create `src/app/estado.ts`:

```ts
import type { Bancal, Orientacion, PerfilClima, PerfilSuelo, EleccionEspecie } from '../dominio/tipos'

export type Paso = 'inicio' | 'ubicacion' | 'bancales' | 'suelo' | 'especies' | 'resultado'

export interface EstadoApp {
  paso: Paso
  modoUbicacion: 'precisa' | 'zona' | null
  coordenadas: { lat: number; lon: number } | null
  zonaId: string | null
  clima: PerfilClima | null
  suelo: PerfilSuelo | null
  orientacionNorte: Orientacion
  bancales: Bancal[]
  elecciones: EleccionEspecie[]
}

export type Accion =
  | { tipo: 'ir_a_paso'; paso: Paso }
  | { tipo: 'set_modo_ubicacion'; modo: 'precisa' | 'zona'; coordenadas?: { lat: number; lon: number }; zonaId?: string }
  | { tipo: 'set_clima'; clima: PerfilClima }
  | { tipo: 'set_suelo'; suelo: PerfilSuelo }
  | { tipo: 'set_orientacion'; orientacion: Orientacion }
  | { tipo: 'añadir_bancal'; bancal: Bancal }
  | { tipo: 'editar_bancal'; bancal: Bancal }
  | { tipo: 'borrar_bancal'; id: string }
  | { tipo: 'set_elecciones'; elecciones: EleccionEspecie[] }

export const estadoInicial: EstadoApp = {
  paso: 'inicio', modoUbicacion: null, coordenadas: null, zonaId: null,
  clima: null, suelo: null, orientacionNorte: 'norte', bancales: [], elecciones: [],
}

export function reducer(estado: EstadoApp, accion: Accion): EstadoApp {
  switch (accion.tipo) {
    case 'ir_a_paso': return { ...estado, paso: accion.paso }
    case 'set_modo_ubicacion': return { ...estado, modoUbicacion: accion.modo, coordenadas: accion.coordenadas ?? null, zonaId: accion.zonaId ?? null }
    case 'set_clima': return { ...estado, clima: accion.clima }
    case 'set_suelo': return { ...estado, suelo: accion.suelo }
    case 'set_orientacion': return { ...estado, orientacionNorte: accion.orientacion }
    case 'añadir_bancal': return { ...estado, bancales: [...estado.bancales, accion.bancal] }
    case 'editar_bancal': return { ...estado, bancales: estado.bancales.map((b) => (b.id === accion.bancal.id ? accion.bancal : b)) }
    case 'borrar_bancal': return { ...estado, bancales: estado.bancales.filter((b) => b.id !== accion.id) }
    case 'set_elecciones': return { ...estado, elecciones: accion.elecciones }
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/app/estado.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/estado.ts src/app/estado.test.ts
git commit -m "feat: estado del asistente con reducer puro"
```

---

## Task 3: Orquestador de la propuesta (recálculo)

**Files:**
- Create: `src/app/proponer.ts`
- Test: `src/app/proponer.test.ts`

**Interfaces:**
- Consumes: del núcleo → `evaluarIdoneidad`, `colocar` (+ `ResultadoColocacion`), `generarCalendario` (+ `EntradaCalendario`), `estimarCosecha` (+ `EstimacionCosecha`), `evaluarSinergias` (+ `ParejaSinergia`), `sugerirCompaneras`, `buscarCultivo`; tipos `PerfilClima`, `PerfilSuelo`, `Bancal`, `EleccionEspecie`, `ResultadoIdoneidad`.
- Produces:
  - `export interface PropuestaCultivo { cultivoId: string; idoneidad: ResultadoIdoneidad; numPlantas: number; calendario?: EntradaCalendario; cosecha?: EstimacionCosecha }`.
  - `export interface Propuesta { cultivos: PropuestaCultivo[]; colocacion: ResultadoColocacion; sinergias: ParejaSinergia[]; companerasSugeridas: string[]; avisos: string[] }`.
  - `export function proponerHuerto(clima: PerfilClima, suelo: PerfilSuelo, mesActual: number, bancales: Bancal[], elecciones: EleccionEspecie[]): Propuesta`.

**Lógica:** evalúa idoneidad de cada elección; las `apta` van a `colocar`; para cada asignación con `numPlantas>0` se genera calendario (con `mesRecomendado` de la idoneidad) y cosecha; se agregan avisos de colocación + motivos de las no aptas; sinergias y compañeras sobre los ids elegidos.

- [ ] **Step 1: Escribir tests del orquestador**

Create `src/app/proponer.test.ts`:

```ts
import { expect, test } from 'vitest'
import { proponerHuerto } from './proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]

test('genera cosecha y calendario para una especie apta y colocada', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones) // junio
  const t = p.cultivos.find((c) => c.cultivoId === 'tomate')!
  expect(t.idoneidad.estado).toBe('apta')
  expect(t.numPlantas).toBeGreaterThan(0)
  expect(t.cosecha).toBeDefined()
  expect(t.calendario).toBeDefined()
})

test('incluye avisos de sinergia conflictiva vía sinergias', () => {
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'obligatoria', cantidad: 'media' },
  ]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.sinergias.some((s) => s.tipo === 'conflictiva')).toBe(true)
})

test('sugiere compañeras no elegidas', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'opcional', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.companerasSugeridas).toContain('albahaca')
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/app/proponer.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar el orquestador**

Create `src/app/proponer.ts`:

```ts
import type { PerfilClima, PerfilSuelo, Bancal, EleccionEspecie, ResultadoIdoneidad } from '../dominio/tipos'
import { evaluarIdoneidad } from '../dominio/idoneidad'
import { colocar, type ResultadoColocacion } from '../dominio/colocacion'
import { generarCalendario, type EntradaCalendario } from '../dominio/calendario'
import { estimarCosecha, type EstimacionCosecha } from '../dominio/cosecha'
import { evaluarSinergias, sugerirCompaneras, type ParejaSinergia } from '../dominio/sinergias'
import { buscarCultivo } from '../datos/cultivos'

export interface PropuestaCultivo {
  cultivoId: string
  idoneidad: ResultadoIdoneidad
  numPlantas: number
  calendario?: EntradaCalendario
  cosecha?: EstimacionCosecha
}

export interface Propuesta {
  cultivos: PropuestaCultivo[]
  colocacion: ResultadoColocacion
  sinergias: ParejaSinergia[]
  companerasSugeridas: string[]
  avisos: string[]
}

export function proponerHuerto(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  bancales: Bancal[], elecciones: EleccionEspecie[],
): Propuesta {
  const idoneidades = new Map<string, ResultadoIdoneidad>()
  for (const e of elecciones) {
    const c = buscarCultivo(e.cultivoId)
    if (!c) continue
    idoneidades.set(e.cultivoId, evaluarIdoneidad(c, clima, suelo, mesActual))
  }

  const aptas = elecciones.filter((e) => idoneidades.get(e.cultivoId)?.estado === 'apta')
  const colocacion = colocar(bancales, aptas)

  const plantasPorCultivo = new Map<string, number>()
  for (const b of colocacion.bancales) {
    for (const a of b.asignaciones) {
      plantasPorCultivo.set(a.cultivoId, (plantasPorCultivo.get(a.cultivoId) ?? 0) + a.numPlantas)
    }
  }

  const cultivos: PropuestaCultivo[] = elecciones.map((e) => {
    const idoneidad = idoneidades.get(e.cultivoId)!
    const numPlantas = plantasPorCultivo.get(e.cultivoId) ?? 0
    const colocado = numPlantas > 0 && idoneidad.mesRecomendado !== undefined
    return {
      cultivoId: e.cultivoId,
      idoneidad,
      numPlantas,
      calendario: colocado ? generarCalendario(e.cultivoId, idoneidad.mesRecomendado!) : undefined,
      cosecha: colocado ? estimarCosecha(e.cultivoId, numPlantas) : undefined,
    }
  })

  const avisos = [...colocacion.avisos]
  for (const e of elecciones) {
    const r = idoneidades.get(e.cultivoId)
    if (r && r.estado !== 'apta' && r.motivo) {
      avisos.push(`${buscarCultivo(e.cultivoId)?.nombreComun ?? e.cultivoId}: ${r.motivo}`)
    }
  }

  const ids = elecciones.map((e) => e.cultivoId)
  return {
    cultivos,
    colocacion,
    sinergias: evaluarSinergias(ids),
    companerasSugeridas: sugerirCompaneras(ids, 2),
    avisos,
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/app/proponer.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/proponer.ts src/app/proponer.test.ts
git commit -m "feat: orquestador puro estado->propuesta con recalculo"
```

---

## Task 4: Helpers de formato

**Files:**
- Create: `src/app/formato.ts`
- Test: `src/app/formato.test.ts`

**Interfaces:**
- Produces:
  - `export function nombreMes(indice: number): string` (0→'enero' … 11→'diciembre'; envuelve con módulo 12).
  - `export function rangoMeses(inicio: number, fin: number): string` (p. ej. `'julio – septiembre'`; si inicio===fin → un solo mes).

- [ ] **Step 1: Escribir tests**

Create `src/app/formato.test.ts`:

```ts
import { expect, test } from 'vitest'
import { nombreMes, rangoMeses } from './formato'

test('nombreMes mapea índices a nombres', () => {
  expect(nombreMes(0)).toBe('enero')
  expect(nombreMes(11)).toBe('diciembre')
  expect(nombreMes(12)).toBe('enero')
})

test('rangoMeses formatea inicio y fin', () => {
  expect(rangoMeses(6, 8)).toBe('julio – septiembre')
  expect(rangoMeses(4, 4)).toBe('mayo')
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/app/formato.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/app/formato.ts`:

```ts
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function nombreMes(indice: number): string {
  return MESES[((indice % 12) + 12) % 12]
}

export function rangoMeses(inicio: number, fin: number): string {
  return inicio === fin ? nombreMes(inicio) : `${nombreMes(inicio)} – ${nombreMes(fin)}`
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/app/formato.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/formato.ts src/app/formato.test.ts
git commit -m "feat: helpers de formato de meses"
```

---

## Task 5: Geometría del plano (cálculo puro de posiciones)

**Files:**
- Create: `src/ui/plano-geometria.ts`
- Test: `src/ui/plano-geometria.test.ts`

**Interfaces:**
- Consumes: `Bancal`, `Orientacion` de `dominio/tipos`; `AsignacionCultivo` de `dominio/colocacion`; `buscarCultivo` de `datos/cultivos`.
- Produces:
  - `export interface MarcaPlano { cultivoId: string; icono: string; xCm: number; yCm: number }`.
  - `export function calcularMarcas(bancal: Bancal, asignaciones: AsignacionCultivo[]): MarcaPlano[]` — coloca las plantas altas al norte (parte superior, y menor) ordenando por altura descendente y rellenando en rejilla según el marco de plantación.

- [ ] **Step 1: Escribir tests**

Create `src/ui/plano-geometria.test.ts`:

```ts
import { expect, test } from 'vitest'
import { calcularMarcas } from './plano-geometria'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'B1', anchoM: 2, largoM: 2 }

test('genera una marca por planta', () => {
  const marcas = calcularMarcas(bancal, [{ cultivoId: 'lechuga', numPlantas: 4 }])
  expect(marcas).toHaveLength(4)
})

test('las plantas más altas quedan más al norte (y menor) que las bajas', () => {
  const marcas = calcularMarcas(bancal, [
    { cultivoId: 'tomate', numPlantas: 1 }, // 150 cm
    { cultivoId: 'lechuga', numPlantas: 1 }, // 25 cm
  ])
  const tomate = marcas.find((m) => m.cultivoId === 'tomate')!
  const lechuga = marcas.find((m) => m.cultivoId === 'lechuga')!
  expect(tomate.yCm).toBeLessThanOrEqual(lechuga.yCm)
})

test('todas las marcas caen dentro del bancal', () => {
  const marcas = calcularMarcas(bancal, [{ cultivoId: 'zanahoria', numPlantas: 10 }])
  for (const m of marcas) {
    expect(m.xCm).toBeGreaterThanOrEqual(0)
    expect(m.xCm).toBeLessThanOrEqual(200)
    expect(m.yCm).toBeGreaterThanOrEqual(0)
    expect(m.yCm).toBeLessThanOrEqual(200)
  }
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/plano-geometria.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/plano-geometria.ts`:

```ts
import type { Bancal } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { buscarCultivo } from '../datos/cultivos'

export interface MarcaPlano { cultivoId: string; icono: string; xCm: number; yCm: number }

export function calcularMarcas(bancal: Bancal, asignaciones: AsignacionCultivo[]): MarcaPlano[] {
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100

  // Expandir a una lista de plantas individuales, altas primero (irán al norte, arriba).
  const plantas: { cultivoId: string; icono: string; alturaCm: number }[] = []
  for (const a of asignaciones) {
    const c = buscarCultivo(a.cultivoId)
    if (!c) continue
    for (let i = 0; i < a.numPlantas; i++) plantas.push({ cultivoId: c.id, icono: c.icono, alturaCm: c.alturaCm })
  }
  plantas.sort((p, q) => q.alturaCm - p.alturaCm)

  // Rejilla uniforme suficiente para todas las plantas.
  const n = plantas.length
  if (n === 0) return []
  const columnas = Math.max(1, Math.ceil(Math.sqrt((n * anchoCm) / largoCm)))
  const filas = Math.ceil(n / columnas)
  const pasoX = anchoCm / columnas
  const pasoY = largoCm / filas

  return plantas.map((p, idx) => {
    const fila = Math.floor(idx / columnas)
    const col = idx % columnas
    return {
      cultivoId: p.cultivoId,
      icono: p.icono,
      xCm: Math.round(pasoX * (col + 0.5)),
      yCm: Math.round(pasoY * (fila + 0.5)),
    }
  })
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/plano-geometria.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/plano-geometria.ts src/ui/plano-geometria.test.ts
git commit -m "feat: geometria del plano (altas al norte, rejilla)"
```

---

## Task 6: Plano SVG del bancal

**Files:**
- Create: `src/ui/PlanoBancal.tsx`
- Test: `src/ui/PlanoBancal.test.tsx`

**Interfaces:**
- Consumes: `Bancal`, `Orientacion` de `dominio/tipos`; `AsignacionCultivo` de `dominio/colocacion`; `calcularMarcas` de `plano-geometria`.
- Produces: `export function PlanoBancal(props: { bancal: Bancal; asignaciones: AsignacionCultivo[]; orientacionNorte: Orientacion }): JSX.Element` — un `<svg>` con `role="img"` y `aria-label`, rejilla, iconos por planta y una flecha del norte.

- [ ] **Step 1: Escribir test**

Create `src/ui/PlanoBancal.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PlanoBancal } from './PlanoBancal'
import type { Bancal } from '../dominio/tipos'

const bancal: Bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 2 }

test('renderiza un SVG accesible con el nombre del bancal', () => {
  render(<PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 2 }]} orientacionNorte="norte" />)
  const svg = screen.getByRole('img', { name: /Bancal 1/i })
  expect(svg).toBeInTheDocument()
})

test('dibuja una marca por planta', () => {
  const { container } = render(
    <PlanoBancal bancal={bancal} asignaciones={[{ cultivoId: 'lechuga', numPlantas: 3 }]} orientacionNorte="norte" />,
  )
  expect(container.querySelectorAll('[data-marca]')).toHaveLength(3)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/PlanoBancal.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/PlanoBancal.tsx`:

```tsx
import type { Bancal, Orientacion } from '../dominio/tipos'
import type { AsignacionCultivo } from '../dominio/colocacion'
import { calcularMarcas } from './plano-geometria'

const FLECHA: Record<Orientacion, string> = { norte: '↑ N', sur: '↓ N', este: '→ N', oeste: '← N' }

export function PlanoBancal(props: { bancal: Bancal; asignaciones: AsignacionCultivo[]; orientacionNorte: Orientacion }) {
  const { bancal, asignaciones, orientacionNorte } = props
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const marcas = calcularMarcas(bancal, asignaciones)

  return (
    <svg
      role="img"
      aria-label={`Plano del ${bancal.nombre}`}
      viewBox={`0 0 ${anchoCm} ${largoCm}`}
      width="100%"
      style={{ maxWidth: 480, border: '1px solid #999', background: '#f7f5ef' }}
    >
      <rect x={0} y={0} width={anchoCm} height={largoCm} fill="none" stroke="#bbb" />
      {marcas.map((m, i) => (
        <g key={i} data-marca transform={`translate(${m.xCm}, ${m.yCm})`}>
          <text textAnchor="middle" dominantBaseline="central" fontSize={16}>{m.icono}</text>
        </g>
      ))}
      <text x={6} y={18} fontSize={14} fill="#333">{FLECHA[orientacionNorte]}</text>
    </svg>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/PlanoBancal.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/PlanoBancal.tsx src/ui/PlanoBancal.test.tsx
git commit -m "feat: plano SVG del bancal con flecha del norte"
```

---

## Task 7: Selector de especies (obligatoria/opcional, cantidad, sugerencia)

**Files:**
- Create: `src/ui/SelectorEspecies.tsx`
- Test: `src/ui/SelectorEspecies.test.tsx`

**Interfaces:**
- Consumes: `EleccionEspecie`, `PerfilClima`, `PerfilSuelo` de `dominio/tipos`; `CULTIVOS` de `datos/cultivos`; `sugerirEspecies` de `dominio/sugerencia`.
- Produces: `export function SelectorEspecies(props: { elecciones: EleccionEspecie[]; onCambio: (e: EleccionEspecie[]) => void; clima: PerfilClima; suelo: PerfilSuelo; mesActual: number; superficieM2: number }): JSX.Element`. Incluye botón "Hazme tú una sugerencia" que llama a `sugerirEspecies` y sustituye la selección.

- [ ] **Step 1: Escribir test de interacción**

Create `src/ui/SelectorEspecies.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SelectorEspecies } from './SelectorEspecies'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)

test('marcar una especie la comunica como elección opcional/media por defecto', async () => {
  const onCambio = vi.fn()
  render(<SelectorEspecies elecciones={[]} onCambio={onCambio} clima={clima} suelo={suelo} mesActual={5} superficieM2={4} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  expect(onCambio).toHaveBeenCalledWith([{ cultivoId: 'tomate', obligatoriedad: 'opcional', cantidad: 'media' }])
})

test('el botón de sugerencia propone especies no vacías', async () => {
  const onCambio = vi.fn()
  render(<SelectorEspecies elecciones={[]} onCambio={onCambio} clima={clima} suelo={suelo} mesActual={5} superficieM2={4} />)
  await userEvent.click(screen.getByRole('button', { name: /Hazme tú una sugerencia/i }))
  expect(onCambio).toHaveBeenCalled()
  const arg = onCambio.mock.calls.at(-1)![0]
  expect(arg.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/SelectorEspecies.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/SelectorEspecies.tsx`:

```tsx
import type { EleccionEspecie, PerfilClima, PerfilSuelo, NivelCantidad, Obligatoriedad } from '../dominio/tipos'
import { CULTIVOS } from '../datos/cultivos'
import { sugerirEspecies } from '../dominio/sugerencia'

interface Props {
  elecciones: EleccionEspecie[]
  onCambio: (e: EleccionEspecie[]) => void
  clima: PerfilClima
  suelo: PerfilSuelo
  mesActual: number
  superficieM2: number
}

export function SelectorEspecies({ elecciones, onCambio, clima, suelo, mesActual, superficieM2 }: Props) {
  const porId = new Map(elecciones.map((e) => [e.cultivoId, e]))

  function alternar(id: string) {
    if (porId.has(id)) onCambio(elecciones.filter((e) => e.cultivoId !== id))
    else onCambio([...elecciones, { cultivoId: id, obligatoriedad: 'opcional', cantidad: 'media' }])
  }
  function actualizar(id: string, cambio: Partial<EleccionEspecie>) {
    onCambio(elecciones.map((e) => (e.cultivoId === id ? { ...e, ...cambio } : e)))
  }

  return (
    <div>
      <button type="button" onClick={() => onCambio(sugerirEspecies(clima, suelo, mesActual, superficieM2))}>
        Hazme tú una sugerencia
      </button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {CULTIVOS.map((c) => {
          const eleccion = porId.get(c.id)
          return (
            <li key={c.id}>
              <label>
                <input type="checkbox" checked={!!eleccion} onChange={() => alternar(c.id)} aria-label={c.nombreComun} />
                {c.icono} {c.nombreComun}
              </label>
              {eleccion && (
                <span>
                  <select
                    aria-label={`Obligatoriedad de ${c.nombreComun}`}
                    value={eleccion.obligatoriedad}
                    onChange={(ev) => actualizar(c.id, { obligatoriedad: ev.target.value as Obligatoriedad })}
                  >
                    <option value="opcional">Opcional</option>
                    <option value="obligatoria">Obligatoria</option>
                  </select>
                  <select
                    aria-label={`Cantidad de ${c.nombreComun}`}
                    value={eleccion.cantidad}
                    onChange={(ev) => actualizar(c.id, { cantidad: ev.target.value as NivelCantidad })}
                  >
                    <option value="poca">Poca</option>
                    <option value="media">Media</option>
                    <option value="mucha">Mucha</option>
                  </select>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/SelectorEspecies.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/SelectorEspecies.tsx src/ui/SelectorEspecies.test.tsx
git commit -m "feat: selector de especies con obligatoriedad, cantidad y sugerencia"
```

---

## Task 8: Editor de bancales y orientación

**Files:**
- Create: `src/ui/EditorBancales.tsx`
- Test: `src/ui/EditorBancales.test.tsx`

**Interfaces:**
- Consumes: `Bancal`, `Orientacion` de `dominio/tipos`.
- Produces: `export function EditorBancales(props: { bancales: Bancal[]; orientacionNorte: Orientacion; onAñadir: (b: Bancal) => void; onBorrar: (id: string) => void; onOrientacion: (o: Orientacion) => void }): JSX.Element`. Valida ancho/largo > 0 antes de añadir. El id de bancal nuevo se genera a partir del máximo actual (determinista, sin `Date.now`).

- [ ] **Step 1: Escribir test**

Create `src/ui/EditorBancales.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { EditorBancales } from './EditorBancales'

test('añadir un bancal válido llama a onAñadir con medidas numéricas', async () => {
  const onAñadir = vi.fn()
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={onAñadir} onBorrar={() => {}} onOrientacion={() => {}} />)
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  expect(onAñadir).toHaveBeenCalledWith(expect.objectContaining({ anchoM: 2, largoM: 3 }))
})

test('no añade con medidas a cero', async () => {
  const onAñadir = vi.fn()
  render(<EditorBancales bancales={[]} orientacionNorte="norte" onAñadir={onAñadir} onBorrar={() => {}} onOrientacion={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  expect(onAñadir).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/EditorBancales.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/EditorBancales.tsx`:

```tsx
import { useState } from 'react'
import type { Bancal, Orientacion } from '../dominio/tipos'

interface Props {
  bancales: Bancal[]
  orientacionNorte: Orientacion
  onAñadir: (b: Bancal) => void
  onBorrar: (id: string) => void
  onOrientacion: (o: Orientacion) => void
}

const ORIENTACIONES: Orientacion[] = ['norte', 'sur', 'este', 'oeste']

export function EditorBancales({ bancales, orientacionNorte, onAñadir, onBorrar, onOrientacion }: Props) {
  const [ancho, setAncho] = useState('')
  const [largo, setLargo] = useState('')

  function añadir() {
    const anchoM = Number(ancho)
    const largoM = Number(largo)
    if (!(anchoM > 0) || !(largoM > 0)) return
    const siguiente = bancales.reduce((max, b) => Math.max(max, Number(b.id.replace('b', '')) || 0), 0) + 1
    onAñadir({ id: `b${siguiente}`, nombre: `Bancal ${siguiente}`, anchoM, largoM })
    setAncho(''); setLargo('')
  }

  return (
    <div>
      <label>El norte queda hacia el:
        <select value={orientacionNorte} onChange={(e) => onOrientacion(e.target.value as Orientacion)}>
          {ORIENTACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <div>
        <label>Ancho (m)<input type="number" min="0" step="0.1" value={ancho} onChange={(e) => setAncho(e.target.value)} /></label>
        <label>Largo (m)<input type="number" min="0" step="0.1" value={largo} onChange={(e) => setLargo(e.target.value)} /></label>
        <button type="button" onClick={añadir}>Añadir bancal</button>
      </div>
      <ul>
        {bancales.map((b) => (
          <li key={b.id}>{b.nombre}: {b.anchoM} × {b.largoM} m
            <button type="button" onClick={() => onBorrar(b.id)} aria-label={`Borrar ${b.nombre}`}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/EditorBancales.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/EditorBancales.tsx src/ui/EditorBancales.test.tsx
git commit -m "feat: editor de bancales con validacion y orientacion"
```

---

## Task 9: Paso de suelo (auto por coordenadas o manual + guía)

**Files:**
- Create: `src/ui/PasoSuelo.tsx`
- Test: `src/ui/PasoSuelo.test.tsx`

**Interfaces:**
- Consumes: `PerfilSuelo`, `Textura` de `dominio/tipos`; `sueloManual` de `dominio/suelo`; `TIPOS_SUELO`, `GUIA_EXPERIMENTACION` de `datos/suelos`.
- Produces: `export function PasoSuelo(props: { sueloAuto: PerfilSuelo | null; onElegir: (s: PerfilSuelo) => void }): JSX.Element`. Si `sueloAuto` existe, lo muestra como preseleccionado y editable; si no, muestra el selector de textura + la guía de experimentación.

- [ ] **Step 1: Escribir test**

Create `src/ui/PasoSuelo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PasoSuelo } from './PasoSuelo'

test('sin suelo automático muestra la guía de experimentación', () => {
  render(<PasoSuelo sueloAuto={null} onElegir={() => {}} />)
  expect(screen.getByText(/Prueba del bote/i)).toBeInTheDocument()
})

test('elegir una textura comunica un PerfilSuelo', async () => {
  const onElegir = vi.fn()
  render(<PasoSuelo sueloAuto={null} onElegir={onElegir} />)
  await userEvent.click(screen.getByRole('button', { name: /^Arcilloso/i }))
  expect(onElegir).toHaveBeenCalledWith(expect.objectContaining({ textura: 'arcilloso', drenaje: 'malo' }))
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/PasoSuelo.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/PasoSuelo.tsx`:

```tsx
import type { PerfilSuelo } from '../dominio/tipos'
import { sueloManual } from '../dominio/suelo'
import { TIPOS_SUELO, GUIA_EXPERIMENTACION } from '../datos/suelos'

export function PasoSuelo({ sueloAuto, onElegir }: { sueloAuto: PerfilSuelo | null; onElegir: (s: PerfilSuelo) => void }) {
  return (
    <div>
      {sueloAuto && (
        <p>Hemos deducido de tu ubicación un suelo <strong>{sueloAuto.textura}</strong> (pH {sueloAuto.ph}). Puedes cambiarlo abajo.</p>
      )}
      <div>
        {TIPOS_SUELO.map((t) => (
          <button key={t.textura} type="button" onClick={() => onElegir(sueloManual(t.textura))}>
            {t.nombre} — {t.descripcion}
          </button>
        ))}
      </div>
      {!sueloAuto && (
        <section>
          <h3>¿No sabes qué suelo tienes? Averígualo así</h3>
          {GUIA_EXPERIMENTACION.map((g) => (
            <details key={g.titulo}>
              <summary>{g.titulo}</summary>
              <ol>{g.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/PasoSuelo.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/PasoSuelo.tsx src/ui/PasoSuelo.test.tsx
git commit -m "feat: paso de suelo con auto/manual y guia de experimentacion"
```

---

## Task 10: Geocodificador (Nominatim) con parseo puro

**Files:**
- Create: `src/servicios/geocodificador.ts`
- Test: `src/servicios/geocodificador.test.ts`

**Interfaces:**
- Produces:
  - `export interface ResultadoGeocodificacion { nombre: string; lat: number; lon: number }`.
  - `export function parsearNominatim(datos: unknown): ResultadoGeocodificacion[]` — puro.
  - `export async function buscarDireccion(consulta: string, fetchImpl?: typeof fetch): Promise<ResultadoGeocodificacion[]>`.

- [ ] **Step 1: Escribir test del parseo puro**

Create `src/servicios/geocodificador.test.ts`:

```ts
import { expect, test } from 'vitest'
import { parsearNominatim } from './geocodificador'

test('parsea resultados de Nominatim a lat/lon numéricos', () => {
  const bruto = [{ display_name: 'Valencia, España', lat: '39.47', lon: '-0.37' }]
  const r = parsearNominatim(bruto)
  expect(r).toEqual([{ nombre: 'Valencia, España', lat: 39.47, lon: -0.37 }])
})

test('ignora entradas mal formadas', () => {
  const r = parsearNominatim([{ display_name: 'x' }, 42, null])
  expect(r).toEqual([])
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/servicios/geocodificador.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/servicios/geocodificador.ts`:

```ts
export interface ResultadoGeocodificacion { nombre: string; lat: number; lon: number }

export function parsearNominatim(datos: unknown): ResultadoGeocodificacion[] {
  if (!Array.isArray(datos)) return []
  const out: ResultadoGeocodificacion[] = []
  for (const item of datos) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const lat = Number(o.lat)
    const lon = Number(o.lon)
    const nombre = typeof o.display_name === 'string' ? o.display_name : ''
    if (nombre && Number.isFinite(lat) && Number.isFinite(lon)) out.push({ nombre, lat, lon })
  }
  return out
}

export async function buscarDireccion(consulta: string, fetchImpl: typeof fetch = fetch): Promise<ResultadoGeocodificacion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=es&q=${encodeURIComponent(consulta)}`
  const resp = await fetchImpl(url, { headers: { 'Accept-Language': 'es' } })
  if (!resp.ok) throw new Error(`Error en la búsqueda de dirección: ${resp.status}`)
  return parsearNominatim(await resp.json())
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/servicios/geocodificador.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/servicios/geocodificador.ts src/servicios/geocodificador.test.ts
git commit -m "feat: geocodificador Nominatim con parseo puro"
```

---

## Task 11: Paso de ubicación (precisa o zona) + mapa

**Files:**
- Create: `src/ui/PasoUbicacion.tsx`, `src/ui/MapaSelector.tsx`
- Test: `src/ui/PasoUbicacion.test.tsx`

**Interfaces:**
- Consumes: `ZONAS_CLIMATICAS` de `datos/zonas-climaticas`; `climaDeZona`, `climaDeCoordenadas` de `dominio/clima`; `sueloDeCoordenadas` de `dominio/suelo`; `buscarDireccion` de `servicios/geocodificador`; tipos `PerfilClima`, `PerfilSuelo`.
- Produces: `export function PasoUbicacion(props: { onListo: (r: { modo: 'precisa' | 'zona'; clima: PerfilClima; sueloAuto: PerfilSuelo | null; coordenadas?: { lat: number; lon: number }; zonaId?: string }) => void }): JSX.Element`. `MapaSelector` es un envoltorio fino de react-leaflet que emite `onSeleccion(lat, lon)`; se importa de forma perezosa y no se prueba en unidad (solo se prueba la rama de zona climática).

- [ ] **Step 1: Escribir test de la rama "zona climática"**

Create `src/ui/PasoUbicacion.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PasoUbicacion } from './PasoUbicacion'

test('elegir una zona climática entrega su perfil sin suelo automático', async () => {
  const onListo = vi.fn()
  render(<PasoUbicacion onListo={onListo} />)
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ modo: 'zona', zonaId: 'mediterraneo_litoral', sueloAuto: null }))
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/PasoUbicacion.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar `MapaSelector` (envoltorio fino)**

Create `src/ui/MapaSelector.tsx`:

```tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'

function Clicks({ onSeleccion }: { onSeleccion: (lat: number, lon: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null)
  useMapEvents({ click(e) { setPos([e.latlng.lat, e.latlng.lng]); onSeleccion(e.latlng.lat, e.latlng.lng) } })
  return pos ? <Marker position={pos} /> : null
}

export function MapaSelector({ onSeleccion }: { onSeleccion: (lat: number, lon: number) => void }) {
  return (
    <MapContainer center={[40, -3.7]} zoom={5} style={{ height: 320 }}>
      <TileLayer attribution="© OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clicks onSeleccion={onSeleccion} />
    </MapContainer>
  )
}
```

- [ ] **Step 4: Implementar `PasoUbicacion`**

Create `src/ui/PasoUbicacion.tsx`:

```tsx
import { lazy, Suspense, useState } from 'react'
import type { PerfilClima, PerfilSuelo } from '../dominio/tipos'
import { ZONAS_CLIMATICAS } from '../datos/zonas-climaticas'
import { climaDeZona, climaDeCoordenadas } from '../dominio/clima'
import { sueloDeCoordenadas } from '../dominio/suelo'

const MapaSelector = lazy(() => import('./MapaSelector').then((m) => ({ default: m.MapaSelector })))

type Listo = {
  modo: 'precisa' | 'zona'; clima: PerfilClima; sueloAuto: PerfilSuelo | null
  coordenadas?: { lat: number; lon: number }; zonaId?: string
}

export function PasoUbicacion({ onListo }: { onListo: (r: Listo) => void }) {
  const [modo, setModo] = useState<'precisa' | 'zona' | null>(null)
  const [zonaId, setZonaId] = useState('mediterraneo_litoral')
  const [error, setError] = useState<string | null>(null)

  async function usarCoordenadas(lat: number, lon: number) {
    setError(null)
    try {
      const [clima, sueloAuto] = await Promise.all([climaDeCoordenadas(lat, lon), sueloDeCoordenadas(lat, lon)])
      onListo({ modo: 'precisa', clima, sueloAuto, coordenadas: { lat, lon } })
    } catch {
      setError('No hemos podido obtener el clima/suelo de ese punto. Prueba con una zona climática.')
    }
  }

  return (
    <div>
      <div role="group" aria-label="Modo de ubicación">
        <button type="button" onClick={() => setModo('precisa')}>Usar ubicación precisa</button>
        <button type="button" onClick={() => setModo('zona')}>Elegir por zona climática</button>
      </div>

      {modo === 'precisa' && (
        <Suspense fallback={<p>Cargando mapa…</p>}>
          <MapaSelector onSeleccion={usarCoordenadas} />
          <p>Pincha tu punto en el mapa.</p>
        </Suspense>
      )}

      {modo === 'zona' && (
        <div>
          <label>Zona climática
            <select aria-label="Zona climática" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
              {ZONAS_CLIMATICAS.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onListo({ modo: 'zona', clima: climaDeZona(zonaId), sueloAuto: null, zonaId })}>
            Usar esta zona
          </button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npm test src/ui/PasoUbicacion.test.tsx`
Expected: PASS (1 test). (El mapa se carga de forma perezosa y no interviene en la rama de zona.)

- [ ] **Step 6: Commit**

```bash
git add src/ui/PasoUbicacion.tsx src/ui/MapaSelector.tsx src/ui/PasoUbicacion.test.tsx
git commit -m "feat: paso de ubicacion precisa (mapa) o zona climatica"
```

---

## Task 12: Panel de resultado (calendario, cosecha, sinergias, consejos)

**Files:**
- Create: `src/ui/VistaCalendario.tsx`, `src/ui/PanelResultado.tsx`
- Test: `src/ui/PanelResultado.test.tsx`

**Interfaces:**
- Consumes: `Propuesta`, `PropuestaCultivo` de `app/proponer`; `Huerto`, `Bancal` de `dominio/tipos`; `buscarCultivo` de `datos/cultivos`; `PlanoBancal`; `nombreMes`, `rangoMeses` de `app/formato`.
- Produces:
  - `export function VistaCalendario(props: { cultivos: PropuestaCultivo[] }): JSX.Element`.
  - `export function PanelResultado(props: { propuesta: Propuesta; bancales: Bancal[]; orientacionNorte: Orientacion }): JSX.Element` — muestra plano por bancal, calendario, resumen de cosecha (unidad natural), avisos de sinergias, compañeras sugeridas, consejos de suelo y avisos generales.

- [ ] **Step 1: Escribir test**

Create `src/ui/PanelResultado.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PanelResultado } from './PanelResultado'
import { proponerHuerto } from '../app/proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]

test('muestra el resumen de cosecha del tomate en kg', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} bancales={bancales} orientacionNorte="norte" />)
  expect(screen.getByText(/Tomate/i)).toBeInTheDocument()
  expect(screen.getByText(/kg/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/PanelResultado.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar `VistaCalendario`**

Create `src/ui/VistaCalendario.tsx`:

```tsx
import type { PropuestaCultivo } from '../app/proponer'
import { buscarCultivo } from '../datos/cultivos'
import { nombreMes, rangoMeses } from '../app/formato'

export function VistaCalendario({ cultivos }: { cultivos: PropuestaCultivo[] }) {
  const conCalendario = cultivos.filter((c) => c.calendario)
  return (
    <table>
      <thead><tr><th>Cultivo</th><th>Siembra</th><th>Cosecha</th></tr></thead>
      <tbody>
        {conCalendario.map((c) => {
          const cal = c.calendario!
          return (
            <tr key={c.cultivoId}>
              <td>{buscarCultivo(c.cultivoId)?.nombreComun}</td>
              <td>{nombreMes(cal.mesSiembra)}</td>
              <td>{rangoMeses(cal.mesCosechaInicio, cal.mesCosechaFin)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Implementar `PanelResultado`**

Create `src/ui/PanelResultado.tsx`:

```tsx
import type { Propuesta } from '../app/proponer'
import type { Bancal, Orientacion } from '../dominio/tipos'
import { buscarCultivo } from '../datos/cultivos'
import { PlanoBancal } from './PlanoBancal'
import { VistaCalendario } from './VistaCalendario'

export function PanelResultado({ propuesta, bancales, orientacionNorte }: { propuesta: Propuesta; bancales: Bancal[]; orientacionNorte: Orientacion }) {
  const nombre = (id: string) => buscarCultivo(id)?.nombreComun ?? id
  return (
    <div>
      <section>
        <h2>Tu huerto</h2>
        {bancales.map((b) => {
          const col = propuesta.colocacion.bancales.find((x) => x.bancalId === b.id)
          return <div key={b.id}><h3>{b.nombre}</h3><PlanoBancal bancal={b} asignaciones={col?.asignaciones ?? []} orientacionNorte={orientacionNorte} /></div>
        })}
      </section>

      <section>
        <h2>Cuándo sembrar y cosechar</h2>
        <VistaCalendario cultivos={propuesta.cultivos} />
      </section>

      <section>
        <h2>Cosecha estimada</h2>
        <ul>
          {propuesta.cultivos.filter((c) => c.cosecha).map((c) => (
            <li key={c.cultivoId}>
              {buscarCultivo(c.cultivoId)?.icono} {nombre(c.cultivoId)} — ~{c.numPlantas} plantas → <strong>{c.cosecha!.cantidadMin}–{c.cosecha!.cantidadMax} {c.cosecha!.unidad}</strong> aprox.
            </li>
          ))}
        </ul>
        <p><em>Estimaciones orientativas; dependen del cuidado y del año.</em></p>
      </section>

      {propuesta.sinergias.length > 0 && (
        <section>
          <h2>Sinergias</h2>
          <ul>
            {propuesta.sinergias.map((s, i) => (
              <li key={i}>{s.tipo === 'favorable' ? '✅' : '⚠️'} {nombre(s.a)} y {nombre(s.b)}: {s.tipo === 'favorable' ? 'se ayudan' : 'mejor separarlos'}</li>
            ))}
          </ul>
        </section>
      )}

      {propuesta.companerasSugeridas.length > 0 && (
        <section>
          <h2>Podrías añadir</h2>
          <ul>{propuesta.companerasSugeridas.map((id) => <li key={id}>{buscarCultivo(id)?.icono} {nombre(id)} — mejora tu huerto por sus compañeras.</li>)}</ul>
        </section>
      )}

      {propuesta.cultivos.some((c) => c.idoneidad.consejosSuelo.length > 0) && (
        <section>
          <h2>Consejos de suelo</h2>
          <ul>
            {propuesta.cultivos.flatMap((c) => c.idoneidad.consejosSuelo.map((cs, i) => <li key={`${c.cultivoId}-${i}`}>{nombre(c.cultivoId)}: {cs}</li>))}
          </ul>
        </section>
      )}

      {propuesta.avisos.length > 0 && (
        <section>
          <h2>Avisos</h2>
          <ul>{propuesta.avisos.map((a, i) => <li key={i} role="alert">{a}</li>)}</ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npm test src/ui/PanelResultado.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/ui/VistaCalendario.tsx src/ui/PanelResultado.tsx src/ui/PanelResultado.test.tsx
git commit -m "feat: panel de resultado (plano, calendario, cosecha, sinergias, consejos)"
```

---

## Task 13: Exportar el plano (SVG → PNG y PDF)

**Files:**
- Create: `src/ui/exportar.ts`
- Test: `src/ui/exportar.test.ts`

**Interfaces:**
- Produces:
  - `export function svgAString(svg: SVGSVGElement): string` — serializa un `<svg>` con el namespace correcto (puro, testeable en jsdom).
  - `export async function descargarPng(svg: SVGSVGElement, nombreArchivo: string): Promise<void>` — rasteriza vía canvas.
  - `export async function descargarPdf(svg: SVGSVGElement, nombreArchivo: string): Promise<void>` — usa jsPDF con la imagen PNG.

- [ ] **Step 1: Escribir test del serializador puro**

Create `src/ui/exportar.test.ts`:

```ts
// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { svgAString } from './exportar'

test('serializa un svg incluyendo el namespace xmlns', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '10')
  const s = svgAString(svg)
  expect(s).toContain('http://www.w3.org/2000/svg')
  expect(s.startsWith('<svg')).toBe(true)
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/exportar.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

Create `src/ui/exportar.ts`:

```ts
import { jsPDF } from 'jspdf'

export function svgAString(svg: SVGSVGElement): string {
  const clon = svg.cloneNode(true) as SVGSVGElement
  clon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clon)
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

async function svgACanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
  const texto = svgAString(svg)
  const blob = new Blob([texto], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('No se pudo cargar el SVG')); img.src = url })
    const canvas = document.createElement('canvas')
    canvas.width = svg.clientWidth || 480
    canvas.height = svg.clientHeight || 480
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally { URL.revokeObjectURL(url) }
}

export async function descargarPng(svg: SVGSVGElement, nombreArchivo: string): Promise<void> {
  const canvas = await svgACanvas(svg)
  await new Promise<void>((res) => canvas.toBlob((b) => { if (b) descargarBlob(b, nombreArchivo); res() }, 'image/png'))
}

export async function descargarPdf(svg: SVGSVGElement, nombreArchivo: string): Promise<void> {
  const canvas = await svgACanvas(svg)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(nombreArchivo)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/ui/exportar.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/ui/exportar.ts src/ui/exportar.test.ts
git commit -m "feat: exportar plano a PNG y PDF"
```

---

## Task 14: App — asistente por pasos, validación y guardado

**Files:**
- Create: `src/ui/App.tsx`, `src/ui/PantallaInicio.tsx`, `src/ui/AvisoPrivacidad.tsx`
- Modify: `src/main.tsx` (montar `App`)
- Test: `src/ui/App.test.tsx`

**Interfaces:**
- Consumes: `reducer`, `estadoInicial`, `EstadoApp` de `app/estado`; `proponerHuerto` de `app/proponer`; todos los componentes de paso; `crearAlmacenLocal` de `almacenamiento/almacen`.
- Produces: `export function App(props?: { mesActual?: number }): JSX.Element` — orquesta los pasos; en el paso `resultado` recalcula la propuesta con `useMemo` a partir del estado (fase de validación: cualquier cambio en especies/bancales re-deriva la propuesta); permite volver a pasos anteriores, guardar y exportar. `mesActual` es inyectable para test (por defecto `new Date().getMonth()` calculado en el propio componente, no en el módulo).

- [ ] **Step 1: Escribir test de flujo mínimo (rama zona → resultado)**

Create `src/ui/App.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { App } from './App'

test('flujo por zona climática hasta ver el resultado', async () => {
  render(<App mesActual={5} />) // junio, fijo para el test
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))

  // Ubicación por zona
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))

  // Bancales
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Suelo
  await userEvent.click(screen.getByRole('button', { name: /^Franco/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Especies
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  await userEvent.click(screen.getByRole('button', { name: /Ver mi huerto/i }))

  // Resultado
  expect(await screen.findByText(/Cosecha estimada/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/ui/App.test.tsx`
Expected: FAIL — módulos no existen.

- [ ] **Step 3: Implementar `PantallaInicio` y `AvisoPrivacidad`**

Create `src/ui/PantallaInicio.tsx`:

```tsx
export function PantallaInicio({ onEmpezar }: { onEmpezar: () => void }) {
  return (
    <div>
      <h1>🌱 Planifica tu huerto</h1>
      <p>Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>
      <button type="button" onClick={onEmpezar}>Crear mi huerto</button>
    </div>
  )
}
```

Create `src/ui/AvisoPrivacidad.tsx`:

```tsx
export function AvisoPrivacidad() {
  return (
    <p style={{ fontSize: 12, color: '#555' }}>
      Tus datos se guardan solo en este navegador. Si usas una zona climática y eliges el suelo a mano, no enviamos tu ubicación a ningún servicio externo.
    </p>
  )
}
```

- [ ] **Step 4: Implementar `App`**

Create `src/ui/App.tsx`:

```tsx
import { useMemo, useReducer } from 'react'
import { reducer, estadoInicial } from '../app/estado'
import { proponerHuerto } from '../app/proponer'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import { PantallaInicio } from './PantallaInicio'
import { PasoUbicacion } from './PasoUbicacion'
import { EditorBancales } from './EditorBancales'
import { PasoSuelo } from './PasoSuelo'
import { SelectorEspecies } from './SelectorEspecies'
import { PanelResultado } from './PanelResultado'
import { AvisoPrivacidad } from './AvisoPrivacidad'

export function App({ mesActual: mesInyectado }: { mesActual?: number } = {}) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)
  const mesActual = mesInyectado ?? new Date().getMonth()
  const almacen = useMemo(() => crearAlmacenLocal(), [])

  const superficieM2 = estado.bancales.reduce((s, b) => s + b.anchoM * b.largoM, 0)

  const propuesta = useMemo(() => {
    if (!estado.clima || !estado.suelo) return null
    return proponerHuerto(estado.clima, estado.suelo, mesActual, estado.bancales, estado.elecciones)
  }, [estado.clima, estado.suelo, estado.bancales, estado.elecciones, mesActual])

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {estado.paso === 'inicio' && <PantallaInicio onEmpezar={() => dispatch({ tipo: 'ir_a_paso', paso: 'ubicacion' })} />}

      {estado.paso === 'ubicacion' && (
        <PasoUbicacion onListo={(r) => {
          dispatch({ tipo: 'set_modo_ubicacion', modo: r.modo, coordenadas: r.coordenadas, zonaId: r.zonaId })
          dispatch({ tipo: 'set_clima', clima: r.clima })
          if (r.sueloAuto) dispatch({ tipo: 'set_suelo', suelo: r.sueloAuto })
          dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })
        }} />
      )}

      {estado.paso === 'bancales' && (
        <div>
          <EditorBancales
            bancales={estado.bancales} orientacionNorte={estado.orientacionNorte}
            onAñadir={(b) => dispatch({ tipo: 'añadir_bancal', bancal: b })}
            onBorrar={(id) => dispatch({ tipo: 'borrar_bancal', id })}
            onOrientacion={(o) => dispatch({ tipo: 'set_orientacion', orientacion: o })}
          />
          <button type="button" disabled={estado.bancales.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'suelo' })}>Siguiente</button>
        </div>
      )}

      {estado.paso === 'suelo' && (
        <div>
          <PasoSuelo sueloAuto={estado.suelo} onElegir={(s) => dispatch({ tipo: 'set_suelo', suelo: s })} />
          <button type="button" disabled={!estado.suelo} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Siguiente</button>
        </div>
      )}

      {estado.paso === 'especies' && estado.clima && estado.suelo && (
        <div>
          <SelectorEspecies
            elecciones={estado.elecciones} onCambio={(e) => dispatch({ tipo: 'set_elecciones', elecciones: e })}
            clima={estado.clima} suelo={estado.suelo} mesActual={mesActual} superficieM2={superficieM2}
          />
          <button type="button" disabled={estado.elecciones.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'resultado' })}>Ver mi huerto</button>
        </div>
      )}

      {estado.paso === 'resultado' && propuesta && (
        <div>
          <PanelResultado propuesta={propuesta} bancales={estado.bancales} orientacionNorte={estado.orientacionNorte} />
          <div>
            <h2>Ajustar (validación)</h2>
            <p>¿Quieres cambiar algo? Vuelve a las especies o los bancales y el huerto se recalcula solo.</p>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Ajustar especies</button>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })}>Ajustar bancales</button>
            <button type="button" onClick={() => almacen.guardar('actual', { huerto: { orientacionNorte: estado.orientacionNorte, bancales: estado.bancales }, elecciones: estado.elecciones })}>Guardar</button>
          </div>
        </div>
      )}

      <AvisoPrivacidad />
    </main>
  )
}
```

- [ ] **Step 5: Montar `App` en `main.tsx`**

Modify `src/main.tsx` para renderizar `App` (sustituir el contenido de la plantilla):

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

- [ ] **Step 6: Ejecutar y verificar que pasa**

Run: `npm test src/ui/App.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add src/ui/App.tsx src/ui/PantallaInicio.tsx src/ui/AvisoPrivacidad.tsx src/main.tsx src/ui/App.test.tsx
git commit -m "feat: asistente por pasos con validacion, guardado y aviso de privacidad"
```

---

## Task 15: Endurecimiento de seguridad y barrido final

**Files:**
- Modify: `index.html`
- Test: `src/seguridad.test.ts`, toda la suite.

**Interfaces:**
- Produces: CSP estricta en `index.html`; verificación automatizada de que no se usa `dangerouslySetInnerHTML`.

- [ ] **Step 1: Escribir un test que prohíbe `dangerouslySetInnerHTML` y verifica la CSP**

Create `src/seguridad.test.ts`:

```ts
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
  const ofensores = archivosFuente('src').filter((f) => readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML'))
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
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm test src/seguridad.test.ts`
Expected: FAIL — la CSP aún no está en `index.html`.

- [ ] **Step 3: Añadir la CSP estricta a `index.html`**

Modify `index.html`: en `<head>`, poner `<html lang="es">` y añadir la meta (una sola línea, sin saltos):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; connect-src 'self' https://climate-api.open-meteo.com https://rest.isric.org https://nominatim.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; form-action 'self'" />
```

> Nota: `style-src 'unsafe-inline'` es necesario por los estilos en línea de Leaflet y de los componentes. `img-src data:` permite el PNG rasterizado del plano. No se permite ningún otro origen.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm test src/seguridad.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Barrido final de toda la suite y tipos**

Run: `npm test`
Expected: PASS — toda la suite (Plan 1 + Plan 2) en verde.

Run: `npx tsc --noEmit`
Expected: sin errores de tipos.

Run: `npm run build`
Expected: build de producción sin errores.

- [ ] **Step 6: Commit**

```bash
git add index.html src/seguridad.test.ts
git commit -m "feat: CSP estricta y verificacion de seguridad del cliente"
```

---

## Self-Review (rellenado por el autor del plan)

**1. Cobertura del spec:**
- §3 flujo completo: Inicio (T14), Ubicación precisa/zona (T11), Bancales+orientación (T8), Suelo auto/manual+guía (T9), Especies+sugerencia (T7), Resultado (T12), Validación=recálculo con `useMemo` al volver a pasos (T14), Guardar/Exportar (T13, T14).
- §4 arquitectura: React+Vite (Plan 1 T1), servicios intercambiables ya en núcleo; App como orquestador (T14).
- §5 módulos `ui/` y `app/`: cubiertos (T2-T14).
- §6/§7 cerebro: consumido por el orquestador (T3); plano (T5, T6); cosecha/calendario/sinergias/consejos mostrados (T12).
- §8 plano SVG con flecha del norte: T5, T6.
- §9 calendario/cuidados/cosecha: T12.
- §10 errores: fallo de clima/suelo por coordenadas → mensaje y sugerir zona (T11); bancal pequeño/obligatoria → avisos del núcleo mostrados (T12); medidas inválidas → validación (T8).
- §13 seguridad/privacidad: CSP estricta (T15), sin `dangerouslySetInnerHTML` (verificado en T15), datos en localStorage (T14), modo zona+suelo manual sin llamadas externas (T11 no invoca red en esa rama), aviso de privacidad (T14), sin claves de API (servicios sin clave).

**Gaps conscientes / notas:** el mapa Leaflet (T11 `MapaSelector`) no tiene test unitario (interacción de canvas geográfico); se aísla como envoltorio fino y se prueba la rama de zona. La edición manual directa sobre el plano (opción C) queda fuera por diseño (spec §12). El icono por defecto de Leaflet puede requerir configuración de assets en el build; si el marcador no aparece, importar los iconos de `leaflet/dist/images` en `MapaSelector` (ajuste local, no afecta a la lógica).

**2. Placeholder scan:** sin TBD/TODO; todos los pasos con código real.

**3. Consistencia de tipos:** `EstadoApp`/`Accion`/`reducer` (T2) usados por `App` (T14); `Propuesta`/`PropuestaCultivo` (T3) usados por `PanelResultado`/`VistaCalendario` (T12); `MarcaPlano`/`calcularMarcas` (T5) usados por `PlanoBancal` (T6); firmas de componentes coinciden con cómo `App` los invoca (T14). Nombres del núcleo (`proponerHuerto`, `climaDeZona`, `sueloManual`, `sugerirEspecies`, `crearAlmacenLocal`) idénticos a los definidos en el Plan 1.
