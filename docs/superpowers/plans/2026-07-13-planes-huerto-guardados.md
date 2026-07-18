# Planes de huerto guardados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir guardar varios planes de huerto con nombre y cargarlos desde la primera pantalla, aterrizando en el huerto ya montado (resultados).

**Architecture:** Un `PlanHuerto` es un snapshot plano y completo del estado (ubicación + clima + suelo + orientación + bancales + especies + `mesSiembra`), persistido en `localStorage` vía el almacén existente. La primera pantalla lista los planes; cargar rehidrata el estado y salta a `resultado`. El mes con el que se calcula la propuesta pasa a vivir en el estado (`estado.mesSiembra`), fijado automáticamente hoy y preparado para elegirse en el futuro.

**Tech Stack:** TypeScript, React 19 (`useReducer`/`useState`), Vitest + Testing Library (jsdom), `localStorage`, `crypto.randomUUID`.

## Global Constraints

- **Vocabulario:** `Cultivo` (tipo existente) = una especie; NO se renombra. El plan (huerto + especies) se llama `PlanHuerto`.
- **Texto de cara al usuario:** "Mis planes de huerto", "Crear mi huerto", "Guardar plan", "Abrir", "Borrar".
- **TDD estricto:** test que falla → mínimo código → verde. Un test por comportamiento.
- **Suite completa** tras cada tarea: `npm test` (debe quedar toda verde). Typecheck: `npx tsc -b`. Lint: `npm run lint`.
- **Sin versión** en el JSON guardado: robustez por validación de forma (descarta lo que no tenga `clima`/`suelo`/`bancales`).
- Idioma del código/tests/commits: español, siguiendo el estilo existente.

---

## Estructura de ficheros

- `src/almacenamiento/almacen.ts` — MODIFICAR: tipo `PlanHuerto`, API `guardar/cargar/borrar/listar`, validación de forma.
- `src/almacenamiento/almacen.test.ts` — MODIFICAR: nuevos tests del snapshot y `listar`.
- `src/app/estado.ts` — MODIFICAR: campos `idGuardado`/`nombreGuardado`/`mesSiembra`; acciones `empezar_plan`/`cargar_plan`.
- `src/app/estado.test.ts` — MODIFICAR: tests de las acciones nuevas.
- `src/ui/PantallaInicio.tsx` — MODIFICAR: lista de planes con subtítulo, Abrir/Borrar.
- `src/ui/PantallaInicio.test.tsx` — MODIFICAR: tests de la lista.
- `src/ui/App.tsx` — MODIFICAR: cablear listar/cargar/borrar/empezar, propuesta desde `estado.mesSiembra`, guardado con nombre.

---

### Task 1: Tipo `PlanHuerto` y almacén (snapshot + listar + validación)

**Files:**
- Modify: `src/almacenamiento/almacen.ts`
- Test: `src/almacenamiento/almacen.test.ts`
- Modify: `src/ui/App.tsx` (arregla la única llamada de guardado para que compile; el guardado real llega en Task 4)

**Interfaces:**
- Produces: `interface PlanHuerto`, `interface Almacen { guardar(plan: PlanHuerto): void; cargar(id: string): PlanHuerto | null; borrar(id: string): void; listar(): PlanHuerto[] }`, `crearAlmacenLocal(storage?: Storage): Almacen`.

- [x] **Step 1: Reescribir el test del almacén**

Reemplaza TODO el contenido de `src/almacenamiento/almacen.test.ts`:

```ts
import { expect, test } from 'vitest'
import { crearAlmacenLocal, type PlanHuerto } from './almacen'

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

function plan(over: Partial<PlanHuerto> = {}): PlanHuerto {
  return {
    id: 'p1', nombre: 'Terraza', guardadoEn: 1000, mesSiembra: 3,
    modoUbicacion: 'zona', coordenadas: null, zonaId: 'mediterraneo_litoral',
    clima: { id: 'z', nombre: 'Z', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: -1, mesPrimeraHelada: -1 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'norte', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }],
    elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
    ...over,
  }
}

test('guardar y cargar devuelve el mismo plan', () => {
  const a = crearAlmacenLocal(storageFalso())
  const p = plan()
  a.guardar(p)
  expect(a.cargar('p1')).toEqual(p)
})

test('cargar un id inexistente devuelve null', () => {
  const a = crearAlmacenLocal(storageFalso())
  expect(a.cargar('nada')).toBeNull()
})

test('borrar elimina el plan', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan())
  a.borrar('p1')
  expect(a.cargar('p1')).toBeNull()
})

test('listar devuelve los planes ordenados por guardadoEn descendente', () => {
  const a = crearAlmacenLocal(storageFalso())
  a.guardar(plan({ id: 'viejo', guardadoEn: 100 }))
  a.guardar(plan({ id: 'nuevo', guardadoEn: 900 }))
  expect(a.listar().map((p) => p.id)).toEqual(['nuevo', 'viejo'])
})

test('listar y cargar descartan entradas sin la forma de un plan (formato viejo o corrupto)', () => {
  const storage = storageFalso()
  storage.setItem('huertos:actual', JSON.stringify({ huerto: { orientacionNorte: 'norte', bancales: [] }, elecciones: [] }))
  storage.setItem('huertos:roto', 'no es json {')
  const a = crearAlmacenLocal(storage)
  a.guardar(plan({ id: 'bueno' }))
  expect(a.listar().map((p) => p.id)).toEqual(['bueno'])
  expect(a.cargar('actual')).toBeNull()
})

test('ignora claves de otros prefijos', () => {
  const storage = storageFalso()
  storage.setItem('otracosa', 'x')
  const a = crearAlmacenLocal(storage)
  a.guardar(plan({ id: 'bueno' }))
  expect(a.listar().map((p) => p.id)).toEqual(['bueno'])
})
```

- [x] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run src/almacenamiento/almacen.test.ts`
Expected: FAIL — `PlanHuerto` no exportado / `guardar` con firma antigua / `listar` no existe.

- [x] **Step 3: Reescribir el almacén**

Reemplaza TODO el contenido de `src/almacenamiento/almacen.ts`:

```ts
import type { PerfilClima, PerfilSuelo, Bancal, Orientacion, EleccionEspecie } from '../dominio/tipos'

// Un PlanHuerto es un huerto físico (ubicación, clima, suelo, orientación,
// bancales) + las especies elegidas. NO confundir con `Cultivo` (una especie).
export interface PlanHuerto {
  id: string
  nombre: string
  guardadoEn: number // Date.now()
  mesSiembra: number // 0-11, mes con el que se generó el plan
  modoUbicacion: 'precisa' | 'zona'
  coordenadas: { lat: number; lon: number } | null
  zonaId: string | null
  clima: PerfilClima
  suelo: PerfilSuelo
  orientacionNorte: Orientacion
  bancales: Bancal[]
  elecciones: EleccionEspecie[]
}

export interface Almacen {
  guardar(plan: PlanHuerto): void
  cargar(id: string): PlanHuerto | null
  borrar(id: string): void
  listar(): PlanHuerto[]
}

const PREFIJO = 'huertos:'

// Validación de forma: en vez de un número de versión, aceptamos solo lo que
// tiene los campos imprescindibles para montar el resultado. Descarta el viejo
// formato ('actual', sin clima/suelo) y cualquier JSON corrupto.
function esPlan(x: unknown): x is PlanHuerto {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.nombre === 'string' &&
    typeof p.guardadoEn === 'number' &&
    typeof p.mesSiembra === 'number' &&
    p.clima != null && typeof p.clima === 'object' &&
    p.suelo != null && typeof p.suelo === 'object' &&
    Array.isArray(p.bancales)
  )
}

function parsear(s: string | null): PlanHuerto | null {
  if (!s) return null
  try {
    const p: unknown = JSON.parse(s)
    return esPlan(p) ? p : null
  } catch {
    return null
  }
}

export function crearAlmacenLocal(storage: Storage = localStorage): Almacen {
  return {
    guardar(plan) { storage.setItem(PREFIJO + plan.id, JSON.stringify(plan)) },
    cargar(id) { return parsear(storage.getItem(PREFIJO + id)) },
    borrar(id) { storage.removeItem(PREFIJO + id) },
    listar() {
      const planes: PlanHuerto[] = []
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (!k || !k.startsWith(PREFIJO)) continue
        const p = parsear(storage.getItem(k))
        if (p) planes.push(p)
      }
      return planes.sort((a, b) => b.guardadoEn - a.guardadoEn)
    },
  }
}
```

- [x] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run src/almacenamiento/almacen.test.ts`
Expected: PASS (6 tests).

- [x] **Step 5: Arreglar la llamada de guardado en App.tsx para que compile**

En `src/ui/App.tsx`, el botón "Guardar" de la pantalla de resultados (dentro de `estado.paso === 'resultado'`) llama a la API vieja. Sustituye ESE botón por uno que construya un `PlanHuerto` (temporal; el guardado con nombre llega en Task 4):

```tsx
<button type="button" onClick={() => almacen.guardar({
  id: crypto.randomUUID(), nombre: 'Mi huerto', guardadoEn: Date.now(), mesSiembra: mesActual,
  modoUbicacion: estado.modoUbicacion ?? 'zona', coordenadas: estado.coordenadas, zonaId: estado.zonaId,
  clima: estado.clima!, suelo: estado.suelo!, orientacionNorte: estado.orientacionNorte,
  bancales: estado.bancales, elecciones: estado.elecciones,
})}>Guardar</button>
```

- [x] **Step 6: Verificar typecheck y suite completa**

Run: `npx tsc -b && npm test`
Expected: tsc sin errores; todos los tests verdes.

- [x] **Step 7: Commit**

```bash
git add src/almacenamiento/almacen.ts src/almacenamiento/almacen.test.ts src/ui/App.tsx
git commit -m "feat: PlanHuerto y almacen con listar/validacion de forma"
```

---

### Task 2: Estado — campos y acciones `empezar_plan` / `cargar_plan`

**Files:**
- Modify: `src/app/estado.ts`
- Test: `src/app/estado.test.ts`

**Interfaces:**
- Consumes: `PlanHuerto` de `../almacenamiento/almacen`.
- Produces: `EstadoApp` con `idGuardado: string | null`, `nombreGuardado: string | null`, `mesSiembra: number`. Acciones `{ tipo: 'empezar_plan'; mesSiembra: number }` y `{ tipo: 'cargar_plan'; plan: PlanHuerto }`.

- [x] **Step 1: Escribir los tests que fallan**

Añade al final de `src/app/estado.test.ts`:

```ts
import type { PlanHuerto } from '../almacenamiento/almacen'

test('empezar_plan fija el mes de siembra y pasa a ubicacion', () => {
  const s = reducer(estadoInicial, { tipo: 'empezar_plan', mesSiembra: 5 })
  expect(s.paso).toBe('ubicacion')
  expect(s.mesSiembra).toBe(5)
})

test('cargar_plan rehidrata el estado y aterriza en resultado', () => {
  const plan: PlanHuerto = {
    id: 'p1', nombre: 'Terraza', guardadoEn: 1000, mesSiembra: 3,
    modoUbicacion: 'precisa', coordenadas: { lat: 40, lon: -3 }, zonaId: null,
    clima: { id: 'coordenadas', nombre: 'Ubicación precisa', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: 2, mesPrimeraHelada: 10 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'sur', bancales: [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }],
    elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
  }
  const s = reducer(estadoInicial, { tipo: 'cargar_plan', plan })
  expect(s.paso).toBe('resultado')
  expect(s.idGuardado).toBe('p1')
  expect(s.nombreGuardado).toBe('Terraza')
  expect(s.mesSiembra).toBe(3)
  expect(s.clima).toEqual(plan.clima)
  expect(s.suelo).toEqual(plan.suelo)
  expect(s.bancales).toEqual(plan.bancales)
  expect(s.elecciones).toEqual(plan.elecciones)
  expect(s.orientacionNorte).toBe('sur')
  expect(s.modoUbicacion).toBe('precisa')
  expect(s.coordenadas).toEqual({ lat: 40, lon: -3 })
})
```

- [x] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run src/app/estado.test.ts`
Expected: FAIL — acciones `empezar_plan`/`cargar_plan` no existen; `mesSiembra`/`idGuardado`/`nombreGuardado` no están en el estado.

- [x] **Step 3: Implementar en `src/app/estado.ts`**

Añade el import al principio:

```ts
import type { PlanHuerto } from '../almacenamiento/almacen'
```

En `EstadoApp`, añade los tres campos:

```ts
  idGuardado: string | null
  nombreGuardado: string | null
  mesSiembra: number
```

En el tipo `Accion`, añade:

```ts
  | { tipo: 'empezar_plan'; mesSiembra: number }
  | { tipo: 'cargar_plan'; plan: PlanHuerto }
```

En `estadoInicial`, añade `idGuardado: null, nombreGuardado: null, mesSiembra: 0` (valor inocuo; siempre se sobrescribe antes de que exista una propuesta).

En el `switch` del reducer, añade dos casos:

```ts
    case 'empezar_plan': return { ...estado, paso: 'ubicacion', mesSiembra: accion.mesSiembra }
    case 'cargar_plan': {
      const p = accion.plan
      return {
        ...estado, paso: 'resultado',
        idGuardado: p.id, nombreGuardado: p.nombre, mesSiembra: p.mesSiembra,
        modoUbicacion: p.modoUbicacion, coordenadas: p.coordenadas, zonaId: p.zonaId,
        clima: p.clima, suelo: p.suelo, orientacionNorte: p.orientacionNorte,
        bancales: p.bancales, elecciones: p.elecciones,
      }
    }
```

- [x] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run src/app/estado.test.ts`
Expected: PASS.

- [x] **Step 5: Verificar typecheck y suite completa**

Run: `npx tsc -b && npm test`
Expected: verde.

- [x] **Step 6: Commit**

```bash
git add src/app/estado.ts src/app/estado.test.ts
git commit -m "feat: estado con mesSiembra y acciones empezar_plan/cargar_plan"
```

---

### Task 3: Primera pantalla con lista de planes + cableado en App

**Files:**
- Modify: `src/ui/PantallaInicio.tsx`
- Test: `src/ui/PantallaInicio.test.tsx`
- Modify: `src/ui/App.tsx`

**Interfaces:**
- Consumes: `PlanHuerto`, `Almacen.listar/cargar/borrar`, acciones `empezar_plan`/`cargar_plan`.
- Produces: `PantallaInicio` con props `{ planes: PlanHuerto[]; onEmpezar: () => void; onAbrir: (id: string) => void; onBorrar: (id: string) => void }`. Helper exportado `subtituloPlan(plan: PlanHuerto): string`.

- [x] **Step 1: Escribir los tests que fallan**

Reemplaza TODO el contenido de `src/ui/PantallaInicio.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PantallaInicio, subtituloPlan } from './PantallaInicio'
import type { PlanHuerto } from '../almacenamiento/almacen'

function plan(over: Partial<PlanHuerto> = {}): PlanHuerto {
  return {
    id: 'p1', nombre: 'Terraza sur', guardadoEn: Date.parse('2026-07-13T10:00:00Z'), mesSiembra: 3,
    modoUbicacion: 'zona', coordenadas: null, zonaId: 'mediterraneo_litoral',
    clima: { id: 'z', nombre: 'Mediterráneo litoral', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: -1, mesPrimeraHelada: -1 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'norte', bancales: [], elecciones: [], ...over,
  }
}

test('sin planes, solo muestra Crear mi huerto', () => {
  render(<PantallaInicio planes={[]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={() => {}} />)
  expect(screen.getByRole('button', { name: /Crear mi huerto/i })).toBeInTheDocument()
  expect(screen.queryByText(/Mis planes de huerto/i)).not.toBeInTheDocument()
})

test('con planes, lista cada uno con su nombre y subtítulo (incluye el mes)', () => {
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={() => {}} />)
  expect(screen.getByText(/Mis planes de huerto/i)).toBeInTheDocument()
  expect(screen.getByText('Terraza sur')).toBeInTheDocument()
  expect(screen.getByText(/abril/i)).toBeInTheDocument() // mesSiembra = 3
})

test('Abrir dispara onAbrir con el id del plan', async () => {
  const onAbrir = vi.fn()
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={onAbrir} onBorrar={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: /Abrir/i }))
  expect(onAbrir).toHaveBeenCalledWith('p1')
})

test('Borrar dispara onBorrar con el id tras confirmar', async () => {
  const onBorrar = vi.fn()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={onBorrar} />)
  await userEvent.click(screen.getByRole('button', { name: /Borrar/i }))
  expect(onBorrar).toHaveBeenCalledWith('p1')
})

test('subtituloPlan incluye el mes de siembra', () => {
  expect(subtituloPlan(plan({ mesSiembra: 3 }))).toMatch(/abril/i)
})
```

- [x] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run src/ui/PantallaInicio.test.tsx`
Expected: FAIL — `subtituloPlan` no exportado; `PantallaInicio` no acepta `planes`.

- [x] **Step 3: Implementar `src/ui/PantallaInicio.tsx`**

Reemplaza TODO el contenido:

```tsx
import type { PlanHuerto } from '../almacenamiento/almacen'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Subtítulo discreto: ubicación · mes de siembra · fecha de guardado.
export function subtituloPlan(plan: PlanHuerto): string {
  const ubicacion = plan.modoUbicacion === 'precisa' && plan.coordenadas
    ? `${plan.coordenadas.lat.toFixed(2)}, ${plan.coordenadas.lon.toFixed(2)}`
    : (plan.clima.nombre || plan.zonaId || 'Zona climática')
  const fecha = new Date(plan.guardadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${ubicacion} · siembra en ${MESES[plan.mesSiembra]} · guardado el ${fecha}`
}

export function PantallaInicio({
  planes, onEmpezar, onAbrir, onBorrar,
}: {
  planes: PlanHuerto[]
  onEmpezar: () => void
  onAbrir: (id: string) => void
  onBorrar: (id: string) => void
}) {
  return (
    <div>
      <h1>🌱 Planifica tu huerto</h1>
      <p>Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>

      {planes.length > 0 && (
        <section>
          <h2>Mis planes de huerto</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {planes.map((plan) => (
              <li key={plan.id} style={{ marginBottom: 12 }}>
                <strong>{plan.nombre}</strong>
                <div style={{ fontSize: '0.85em', color: '#555' }}>{subtituloPlan(plan)}</div>
                <button type="button" onClick={() => onAbrir(plan.id)}>Abrir</button>
                <button type="button" onClick={() => { if (window.confirm(`¿Borrar "${plan.nombre}"?`)) onBorrar(plan.id) }}>Borrar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onEmpezar}>Crear mi huerto</button>
      <p style={{ marginTop: 24, fontSize: '0.85em', color: '#555' }}>
        Contenido bajo licencia{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>{' '}
        (Reconocimiento – No Comercial).
      </p>
    </div>
  )
}
```

- [x] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run src/ui/PantallaInicio.test.tsx`
Expected: PASS (5 tests).

- [x] **Step 5: Cablear `src/ui/App.tsx`**

En `App`, tras crear el almacén, añade estado de planes y un refresco:

```tsx
  const [planes, setPlanes] = useState<PlanHuerto[]>(() => almacen.listar())
  const refrescarPlanes = () => setPlanes(almacen.listar())
```

Añade los imports necesarios: `useState` de `react` y `import type { PlanHuerto } from '../almacenamiento/almacen'`.

Sustituye el render de la pantalla de inicio:

```tsx
      {estado.paso === 'inicio' && (
        <PantallaInicio
          planes={planes}
          onEmpezar={() => dispatch({ tipo: 'empezar_plan', mesSiembra: mesActual })}
          onAbrir={(id) => { const p = almacen.cargar(id); if (p) dispatch({ tipo: 'cargar_plan', plan: p }) }}
          onBorrar={(id) => { almacen.borrar(id); refrescarPlanes() }}
        />
      )}
```

Cambia el cálculo de la propuesta para usar el mes del estado (línea del `useMemo`):

```tsx
    return proponerHuerto(estado.clima, estado.suelo, estado.mesSiembra, estado.bancales, estado.elecciones)
```

y añade `estado.mesSiembra` a las dependencias del `useMemo` (en lugar de `mesActual`).

Pasa el mes de siembra al selector de especies (para que ajustar un plan cargado use su mes):

```tsx
            clima={estado.clima} suelo={estado.suelo} mesActual={estado.mesSiembra} superficieM2={superficieM2}
```

(El `mesActual={mesActual}` de `PasoUbicacion` se queda como está: resaltado del mes de hoy en el clima.)

- [x] **Step 6: Verificar typecheck y suite completa**

Run: `npx tsc -b && npm test`
Expected: verde. (Si algún test de `App`/humo renderiza la pantalla de inicio, ahora recibe `planes=[]` desde `almacen.listar()` sobre un `localStorage` de jsdom vacío → sin planes, comportamiento idéntico al actual.)

- [x] **Step 7: Commit**

```bash
git add src/ui/PantallaInicio.tsx src/ui/PantallaInicio.test.tsx src/ui/App.tsx
git commit -m "feat: lista de planes en inicio, cargar aterriza en resultados"
```

---

### Task 4: Guardar con nombre en resultados (actualizar vs copia)

**Files:**
- Modify: `src/ui/App.tsx`
- Test: `src/ui/App.test.tsx`

**Interfaces:**
- Consumes: `estado.idGuardado`, `estado.nombreGuardado`, `estado.mesSiembra`, `almacen.guardar`, `refrescarPlanes`.
- Produces: acción `{ tipo: 'set_guardado'; id: string; nombre: string }` en el reducer (para que reguardar siga actualizando el mismo id).

- [x] **Step 1: Añadir la acción `set_guardado` al reducer (con su test)**

En `src/app/estado.test.ts`, añade:

```ts
test('set_guardado fija id y nombre guardados', () => {
  const s = reducer(estadoInicial, { tipo: 'set_guardado', id: 'abc', nombre: 'Terraza' })
  expect(s.idGuardado).toBe('abc')
  expect(s.nombreGuardado).toBe('Terraza')
})
```

Run: `npx vitest run src/app/estado.test.ts` → FAIL (acción no existe).

En `src/app/estado.ts`, añade al tipo `Accion`:

```ts
  | { tipo: 'set_guardado'; id: string; nombre: string }
```

y al `switch`:

```ts
    case 'set_guardado': return { ...estado, idGuardado: accion.id, nombreGuardado: accion.nombre }
```

Run: `npx vitest run src/app/estado.test.ts` → PASS.

- [x] **Step 2: Escribir el test del flujo de guardado**

Añade a `src/ui/App.test.tsx` (mismo estilo que los tests de App existentes; ajusta el import de helpers si el fichero ya los tiene):

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import { App } from './App'

beforeEach(() => localStorage.clear())

// Lleva la app hasta la pantalla de resultados con un plan mínimo por zona.
async function llegarAResultados() {
  render(<App mesActual={3} />)
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))
  // El recorrido concreto (ubicación por zona → bancales → suelo → especies)
  // sigue el mismo patrón que los tests de humo existentes; reutilízalo aquí.
}

test('guardar pide nombre y persiste un plan que luego aparece en la lista', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar().map((p) => p.nombre)).toContain('Mi terraza')
})

test('reguardar con el mismo nombre actualiza en vez de duplicar', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar()).toHaveLength(1)
})
```

> Nota para quien implemente: si `App.test.tsx` no existe o el recorrido por el asistente difiere, copia el patrón de navegación de `src/ui/humo.test.tsx` (que ya recorre el asistente completo) para `llegarAResultados`. Lo esencial que este test fija: existe un campo "Nombre del plan", un botón "Guardar plan", y reguardar con el mismo nombre no crea un segundo plan.

Run: `npx vitest run src/ui/App.test.tsx` → FAIL (no hay campo "Nombre del plan").

- [x] **Step 3: Implementar el guardado con nombre en `src/ui/App.tsx`**

Reemplaza el botón "Guardar" temporal (el de Task 1, dentro de `estado.paso === 'resultado'`) por un pequeño formulario controlado. Añade un estado local para el nombre y el aviso, cerca del inicio de `App`:

```tsx
  const [nombrePlan, setNombrePlan] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)
```

Cuando se entra en resultados con un plan cargado, el campo debe venir con su nombre: inicialízalo desde `estado.nombreGuardado` con un efecto:

```tsx
  useEffect(() => {
    if (estado.paso === 'resultado') { setNombrePlan(estado.nombreGuardado ?? ''); setGuardadoOk(false) }
  }, [estado.paso, estado.nombreGuardado])
```

(Añade `useEffect` al import de `react`.)

Sustituye el botón por:

```tsx
            <div>
              <label>Nombre del plan: <input value={nombrePlan} onChange={(e) => { setNombrePlan(e.target.value); setGuardadoOk(false) }} /></label>
              <button type="button" disabled={!nombrePlan.trim()} onClick={() => {
                const mismoNombre = estado.idGuardado != null && nombrePlan.trim() === estado.nombreGuardado
                const id = mismoNombre ? estado.idGuardado! : crypto.randomUUID()
                almacen.guardar({
                  id, nombre: nombrePlan.trim(), guardadoEn: Date.now(), mesSiembra: estado.mesSiembra,
                  modoUbicacion: estado.modoUbicacion ?? 'zona', coordenadas: estado.coordenadas, zonaId: estado.zonaId,
                  clima: estado.clima!, suelo: estado.suelo!, orientacionNorte: estado.orientacionNorte,
                  bancales: estado.bancales, elecciones: estado.elecciones,
                })
                dispatch({ tipo: 'set_guardado', id, nombre: nombrePlan.trim() })
                refrescarPlanes()
                setGuardadoOk(true)
              }}>Guardar plan</button>
              {guardadoOk && <span> Guardado ✓</span>}
            </div>
```

- [x] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run src/ui/App.test.tsx`
Expected: PASS.

- [x] **Step 5: Verificar typecheck, lint y suite completa**

Run: `npx tsc -b && npm run lint && npm test`
Expected: todo verde.

- [x] **Step 6: Commit**

```bash
git add src/ui/App.tsx src/app/estado.ts src/app/estado.test.ts src/ui/App.test.tsx
git commit -m "feat: guardar plan con nombre (actualizar o copia) en resultados"
```

---

## Self-Review

**Cobertura del spec:**
- S1 (PlanHuerto + almacén + listar + validación) → Task 1. ✅
- S2 (estado: idGuardado/nombreGuardado/mesSiembra, empezar_plan/cargar_plan, propuesta desde mesSiembra) → Task 2 + Task 3 (paso 5). ✅
- S3 (primera pantalla: lista, subtítulo con mes, Abrir/Borrar) → Task 3. ✅
- S4 (guardar con nombre, actualizar vs copia, incluye mesSiembra) → Task 4. ✅
- S5 (tests) → repartidos en todas las tareas (TDD). ✅
- Costura hacia B (mes elegible): `estado.mesSiembra` es la fuente única; añadir `set_mes_siembra` + `<select>` es todo lo que faltaría. Documentado, no implementado. ✅

**Consistencia de tipos:** `PlanHuerto` (Task 1) se consume idéntico en Tasks 2-4. Acciones `empezar_plan`/`cargar_plan`/`set_guardado` con las firmas declaradas. `Almacen.listar` devuelve `PlanHuerto[]`.

**Nota de verificación manual (fuera de TDD):** tras Task 4, arrancar `npm run dev`, crear un huerto, guardarlo con nombre, recargar la página y comprobar que aparece en "Mis planes de huerto" y que "Abrir" lleva a resultados con el mismo plano/calendario.
