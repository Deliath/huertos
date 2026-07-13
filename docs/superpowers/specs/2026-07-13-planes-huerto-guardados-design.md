# Diseño — Cargar planes de huerto guardados

Fecha: 2026-07-13

## Contexto

Hoy la app es un asistente de un solo uso: el usuario crea un huerto y ve el
resultado, pero **no puede volver a él en otra sesión**. La primera pantalla
(`PantallaInicio.tsx`) solo ofrece "Crear mi huerto".

Existe una capa de almacenamiento (`src/almacenamiento/almacen.ts`,
`crearAlmacenLocal` sobre `localStorage`) y un botón "Guardar" en la pantalla de
resultados, pero **están a medias**:

- El guardado usa una clave fija `'actual'` y persiste solo
  `{ huerto: { orientacionNorte, bancales }, elecciones }`. **No guarda clima ni
  suelo**, que son imprescindibles para reconstruir el resultado.
- **No existe ninguna funcionalidad de cargar**: nada llama a `almacen.cargar`.

Objetivo: permitir **guardar varios planes de huerto con nombre** y **cargarlos
desde la primera pantalla**, aterrizando directamente en el huerto ya montado
(resultados). El resultado debe reproducirse igual con independencia de en qué
mes se abra el plan.

### Vocabulario

- **`Cultivo`** (tipo existente en `dominio/tipos.ts`) = **una especie** (tomate,
  lechuga). **No se toca.**
- **`PlanHuerto`** (nuevo) = un **plan de huerto** = un huerto físico (ubicación,
  clima, suelo, orientación, bancales) **+ las especies elegidas** para plantar.
  De cara al usuario: "plan de huerto" / "Mis planes de huerto".

## Decisiones tomadas

1. **Varios planes con nombre** (no un único slot).
2. **Al cargar se aterriza en resultados** (el huerto ya montado); desde ahí los
   botones "Ajustar especies/bancales" existentes permiten seguir editando.
3. **Guardar pide nombre y actualiza o copia** (no genera duplicados al reguardar
   el mismo plan tras un ajuste).
4. **Snapshot completo, sin versión** (opción A): persistimos todo el estado
   reconstruible. La normal climática 1991-2020 es estática, así que congelar el
   clima no pierde nada y evita depender de la red (y de recalcular) al cargar.
   La robustez frente a datos viejos/corruptos se logra con **validación de
   forma**, no con un número de versión.
5. **`mesSiembra` automático, preparado para evolucionar a elegible** (A con
   costura hacia B): el plan guarda el mes con el que se generó; hoy es el mes
   actual, mañana podrá ser un mes elegido por el usuario.

## S1 — Modelo de datos y almacenamiento (`src/almacenamiento/almacen.ts`)

```ts
export interface PlanHuerto {
  id: string                 // clave estable (crypto.randomUUID()), al guardar por 1ª vez
  nombre: string
  guardadoEn: number         // Date.now(); para ordenar y mostrar "guardado el…"
  mesSiembra: number         // 0-11, mes con el que se generó el plan (hoy = automático)
  // snapshot reconstruible del estado:
  modoUbicacion: 'precisa' | 'zona'
  coordenadas: { lat: number; lon: number } | null
  zonaId: string | null
  clima: PerfilClima
  suelo: PerfilSuelo
  orientacionNorte: Orientacion
  bancales: Bancal[]
  elecciones: EleccionEspecie[]
}
```

API del almacén (evoluciona la actual `guardar(clave, datos)/cargar/borrar`):

```ts
guardar(plan: PlanHuerto): void            // clave = PREFIJO + plan.id
cargar(id: string): PlanHuerto | null      // null si no supera la validación de forma
borrar(id: string): void
listar(): PlanHuerto[]                      // claves 'huertos:', validadas, orden guardadoEn desc
```

**Validación de forma** (en `cargar` y `listar`): se descarta cualquier entrada
cuyo JSON no tenga los campos imprescindibles para montar el resultado
(`clima`, `suelo`, `bancales` array). Así el viejo `'actual'` (que guardaba
`{huerto, elecciones}` sin clima) y cualquier JSON corrupto se ignoran en
silencio, sin romper la lista.

El tipo previo `HuertoGuardado` se sustituye por `PlanHuerto`.

## S2 — Estado (`src/app/estado.ts`)

`EstadoApp` gana tres campos:

- `idGuardado: string | null` — id del plan del que proviene el estado actual
  (para decidir actualizar vs copia al guardar).
- `nombreGuardado: string | null` — nombre con el que se guardó/cargó.
- `mesSiembra: number` — **fuente única** del mes con el que se calcula la
  propuesta.

Acciones nuevas:

- `empezar_plan { mesSiembra: number }` — la usa "Crear mi huerto"; fija
  `mesSiembra` (= mes de hoy) y pasa a `ubicacion`. Reemplaza el
  `ir_a_paso: 'ubicacion'` que hoy dispara `onEmpezar`.
- `cargar_plan { plan: PlanHuerto }` — rehidrata **todo** el estado desde el
  snapshot (ubicación, clima, suelo, orientación, bancales, elecciones,
  `mesSiembra`), fija `idGuardado`/`nombreGuardado` y `paso: 'resultado'`.

`estadoInicial` añade `idGuardado: null`, `nombreGuardado: null`,
`mesSiembra: 0` (valor inocuo; siempre se sobrescribe por `empezar_plan` o
`cargar_plan` antes de que exista una propuesta).

La propuesta en `App.tsx` se calcula con **`estado.mesSiembra`** en vez de
`mesActual`. `mesActual` (hoy, de `new Date()` o inyectado en tests) se conserva
solo para inicializar planes nuevos (`empezar_plan`) y para el resaltado "mes
actual" del calendario/clima.

### Costura hacia B (mes elegible)

No se implementa ahora (sería código muerto), pero el punto de extensión queda
fijado: para que el usuario elija el mes de siembra bastará con **(1)** añadir una
acción `set_mes_siembra { mes }` al reducer y **(2)** un `<select>` de mes (en el
paso de especies o en resultados) que la dispare. Todo el cálculo ya pasa por
`estado.mesSiembra`, así que no hay más que tocar.

## S3 — Primera pantalla (`src/ui/PantallaInicio.tsx`)

`App.tsx` calcula `almacen.listar()` y lo pasa como prop. Nuevas props:
`planes: PlanHuerto[]`, `onAbrir(id: string)`, `onBorrar(id: string)` (además del
`onEmpezar` actual).

- **Con planes guardados:** bloque **"Mis planes de huerto"** encima de "Crear mi
  huerto". Cada fila:
  - **nombre** del plan;
  - subtítulo discreto: **ubicación + mes del plan + fecha de guardado**, p. ej.
    `Madrid · siembra en abril · guardado el 13 jul`. El mes sale de
    `plan.mesSiembra` con el array `MESES` ya usado en la UI; la ubicación es el
    nombre de zona o las coordenadas;
  - acciones **Abrir** (→ `cargar_plan` → resultados) y **Borrar**
    (con confirmación `window.confirm`).
- **Sin planes:** la pantalla actual tal cual (solo "Crear mi huerto").
- La nota de licencia CC BY-NC se mantiene abajo.

## S4 — Guardar (en resultados, `src/ui/App.tsx`)

Se sustituye el botón "Guardar" de clave fija por un guardado con nombre:

- `input` de nombre (prefijado con `nombreGuardado` si el plan viene de uno
  cargado) + botón **"Guardar plan"**, con feedback "Guardado ✓".
- **Actualizar vs copia:** si `idGuardado` existe **y** el nombre no cambió →
  sobrescribe ese `id`; si el nombre cambió o no había `idGuardado` → crea `id`
  nuevo (`crypto.randomUUID()`). Tras guardar, `dispatch` fija
  `idGuardado`/`nombreGuardado` para que reguardar siga actualizando.
- El `PlanHuerto` se construye desde el estado (clima, suelo, ubicación… ya
  presentes en `resultado`), **incluido `mesSiembra: estado.mesSiembra`** y
  `guardadoEn: Date.now()`.

## S5 — Testing (TDD)

- **`almacen.test.ts`**: ida y vuelta `guardar`→`cargar` del snapshot completo
  (con `mesSiembra`); `listar()` ordena por `guardadoEn` desc; la validación de
  forma descarta entradas sin `clima`/`suelo`/`bancales` (incluido el formato
  viejo `'actual'`); `borrar` elimina.
- **`estado.test.ts`**: `empezar_plan` fija `mesSiembra` y el paso; `cargar_plan`
  rehidrata todo el estado, deja `paso: 'resultado'` y fija
  `idGuardado`/`nombreGuardado`/`mesSiembra`.
- **`PantallaInicio.test.tsx`**: con planes, renderiza la lista y el subtítulo
  (incluye el mes); `onAbrir`/`onBorrar` disparan con el id correcto; sin planes,
  solo aparece "Crear mi huerto".
- **Guardar (App o componente)**: guardar crea entrada; reguardar con el mismo
  nombre actualiza (no duplica); nombre distinto crea copia.
- **Reproducibilidad**: un plan guardado con `mesSiembra` fijo produce la misma
  propuesta al cargarlo aunque se inyecte un "hoy" (`mesActual`) distinto.

Estilo Vitest existente, con `localStorage` y `crypto.randomUUID` de jsdom.

## Fuera de alcance

- Elegir el mes de siembra manualmente (evolución B; costura ya preparada).
- Exportar/importar planes o sincronización entre dispositivos.
- Migrar automáticamente el viejo guardado `'actual'` (se ignora por validación
  de forma; no había clima/suelo, así que no era cargable).
