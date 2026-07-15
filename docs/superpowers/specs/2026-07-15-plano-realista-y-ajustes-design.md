# Plano a escala real, ajustes de cantidades e intercalado

Fecha: 2026-07-15

## Objetivo

Mejorar la visualización del resultado (mapa del huerto propuesto) y permitir modificar la propuesta:

1. Dibujar cada planta en su posición real dentro del bancal, respetando las distancias de plantación del catálogo, y mostrar esas distancias con cotas en el plano.
2. Indicar cuántas plantas de cada especie hay en cada bancal.
3. Permitir al usuario ajustar la cantidad de plantas de cada especie (botones −/+ por especie y bancal).
4. Permitir intercalar especies distintas mediante un selector con tres modos, aplicado a todos los bancales.

Los ajustes y el modo de intercalado se recalculan al momento (plano, cosecha estimada, calendario) y se guardan con el plan.

## Decisiones tomadas

- Nivel de edición: ajustar cantidades por especie y bancal; la app recoloca automáticamente. No hay arrastre de plantas individuales ni movimiento manual entre bancales.
- Intercalado: un selector global (afecta a todos los bancales) con tres modos: sin intercalar (bloques), intercalar solo compañeras, intercalar todo lo compatible.
- Distancias: plano a escala real con cotas (líneas con medida en cm) entre plantas representativas de cada especie.
- Efectos de los ajustes: la cosecha estimada y el plano se recalculan al momento, y los ajustes se persisten con el plan guardado.
- Arquitectura: capa de distribución geométrica pura + ajustes como overrides ligeros sobre el resultado de `colocar()` (enfoque A). `colocar()` no se modifica.

## Arquitectura

Reparto de responsabilidades:

- `dominio/colocacion.ts` (`colocar`) — sin cambios: decide cuántas plantas de cada especie van a cada bancal.
- `dominio/distribucion.ts` (nuevo) — decide dónde va cada planta dentro de un bancal; es el único módulo que entiende de distancias e intercalado.
- `app/estado.ts` — guarda los overrides del usuario y el modo de intercalado.
- `app/proponer.ts` — aplica los overrides tras `colocar()` y recorta a lo que cabe geométricamente; el resto de su lógica no cambia.
- UI (`PanelResultado`, `PlanoBancal`) — pinta posiciones ya calculadas y ofrece los controles.

### Módulo nuevo: `src/dominio/distribucion.ts`

Módulo puro que sustituye a la rejilla uniforme de `ui/plano-geometria.ts` (que se elimina junto con sus tests).

```ts
export type ModoIntercalado = 'bloques' | 'companeras' | 'mezcla'

export interface PlantaPosicionada { cultivoId: string; icono: string; xCm: number; yCm: number }

export interface ResultadoDistribucion {
  plantas: PlantaPosicionada[]
  noCaben: { cultivoId: string; numPlantas: number }[] // plantas asignadas que no caben geométricamente
}

export function distribuir(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado): ResultadoDistribucion
export function cabeUnaMas(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado, cultivoId: string): boolean
```

Reglas de colocación:

- Por filas a lo largo del bancal (eje Y = largo). Las especies altas van al norte (arriba del plano), como hasta ahora.
- Separación entre plantas vecinas dentro de una fila: el máximo de los `distanciaPlantaCm` de ambas.
- Separación entre filas adyacentes: el máximo de los `distanciaLineaCm` de las especies presentes en ambas filas.
- Margen al borde del bancal: la mitad de la distancia correspondiente de la planta (una planta a `d` cm de otra necesita `d/2` cm al borde).
- Determinista: mismas entradas producen siempre las mismas posiciones.

Modos de intercalado:

- `bloques`: cada especie ocupa filas consecutivas propias, ordenadas de más alta a más baja.
- `companeras`: solo se mezclan dentro de las mismas filas las especies declaradas compañeras entre sí (según `companeras` del catálogo, en cualquiera de los dos sentidos); las demás siguen en bloques. Dentro de un grupo mezclado, las plantas se alternan de forma round-robin entre las especies del grupo.
- `mezcla`: todas las especies del bancal se alternan round-robin (los antagonistas ya no coinciden en un bancal porque `colocar()` los separa). El orden alto→norte se conserva a nivel de grupo: en `mezcla` todo el bancal es un grupo, así que este criterio no aplica dentro de él.

Si las plantas asignadas no caben con las distancias reales (la heurística de área de `colocar()` puede ser optimista), `distribuir` coloca las que quepan —en el orden de recorrido— y devuelve el resto en `noCaben`.

`cabeUnaMas` se implementa probando `distribuir` con una planta más de la especie dada y comprobando que `noCaben` queda vacío.

## Estado y recálculo

### `app/estado.ts`

Campos nuevos en `EstadoApp`:

- `modoIntercalado: ModoIntercalado` — por defecto `'bloques'`.
- `ajustes: Record<string, Record<string, number>>` — `bancalId → cultivoId → numPlantas`; vacío por defecto.

Acciones nuevas:

- `{ tipo: 'set_modo_intercalado'; modo: ModoIntercalado }`
- `{ tipo: 'ajustar_cantidad'; bancalId: string; cultivoId: string; numPlantas: number }` — fija el override (la UI envía el valor ya validado: ≥ 0 y que cabe).

`empezar_plan` resetea ambos campos a sus valores por defecto. `cargar_plan` los restaura del plan (por defecto si el plan no los trae).

### `app/proponer.ts`

- `proponerHuerto()` gana dos parámetros opcionales: `ajustes` y `modoIntercalado` (por defecto `'bloques'`).
- Función pura nueva `aplicarAjustes(colocacion, ajustes): ResultadoColocacion` (en `dominio/colocacion.ts`): devuelve una copia de la colocación con los `numPlantas` sobrescritos donde haya override. Un override solo aplica si el cultivo ya está asignado a ese bancal (no crea asignaciones nuevas).
- `proponerHuerto` la aplica justo después de `colocar()` y, a continuación, hace el recorte geométrico: ejecuta `distribuir` por bancal con el modo activo y reduce cada `numPlantas` a lo que realmente cabe (según `noCaben`). El recuento de plantas, la cosecha estimada y el calendario salen ya con las cantidades ajustadas y recortadas, sin tocar su lógica interna.
- Así el plano y la cosecha siempre cuentan lo mismo: las plantas que no caben no se dibujan ni se cosechan, y generan un aviso (ver UI). El usuario puede bajar la cantidad con «−» hasta que todo quepa y desaparezca el aviso.

## Persistencia

`PlanHuerto` (en `almacenamiento/almacen.ts`) gana dos campos opcionales:

- `modoIntercalado?: ModoIntercalado`
- `ajustes?: Record<string, Record<string, number>>`

Al ser opcionales, `esPlan` no cambia y los planes ya guardados cargan sin migración (se comportan como `'bloques'` y sin ajustes). Al guardar un plan se incluyen siempre los valores actuales.

## UI

### `PanelResultado`

- Encima de los planos, un grupo de radios «¿Intercalar especies?» con tres opciones: «Sin intercalar», «Solo compañeras», «Todas las compatibles». Cambia `modoIntercalado` para todos los bancales.
- Bajo cada plano, una leyenda por bancal: por cada especie asignada, icono, nombre común, marco de plantación («50 × 70 cm») y la cantidad con botones «−» y «+».
  - «−» baja de uno en uno hasta 0 (la especie sigue en la leyenda con 0).
  - «+» sube de uno en uno y se deshabilita cuando `cabeUnaMas` devuelve `false`.
  - Cada pulsación despacha `ajustar_cantidad` y provoca el recálculo completo.
- «Cosecha estimada» no cambia de estructura: ya muestra los totales por especie y se actualiza sola con el recálculo.

### `PlanoBancal`

- Dibuja las plantas en las posiciones que devuelve `distribuir` (icono de la especie, como ahora), manteniendo el `viewBox` en cm, la flecha del norte y la exportación PNG/PDF sin cambios (cotas incluidas en la exportación, al formar parte del SVG).
- Cotas: para cada especie, una cota horizontal entre dos plantas vecinas de una misma fila (su `distanciaPlantaCm`) y una vertical entre dos filas que contengan la especie (su `distanciaLineaCm`), estilo plano técnico (línea con topes y etiqueta «50 cm»). Solo una pareja de cotas por especie para no recargar el dibujo. Si una especie tiene una sola planta, no lleva cotas.

### Avisos

- El recorte geométrico de `proponerHuerto` deja constancia en la `Propuesta` de lo recortado (`recortes: { bancalId; cultivoId; numPlantas }[]`). Por cada entrada, `PanelResultado` muestra un aviso junto al bancal correspondiente: «En {bancal} no caben {n} {especie} con las distancias requeridas.» Tras el recorte, las asignaciones que llegan a `PlanoBancal` caben siempre por construcción.

## Manejo de errores

- Cultivos desconocidos en asignaciones o ajustes se ignoran (mismo criterio que el resto del código: `buscarCultivo` devuelve `undefined` y se salta).
- Ajustes que referencian bancales o cultivos que ya no existen en el plan se ignoran al aplicar (no rompen la carga).
- Especies con 0 plantas: siguen en la leyenda con 0 y su «+» activo si cabe alguna; no aparecen en el plano ni en la cosecha (comportamiento actual de `proponer` para `numPlantas === 0`).

## Testing (TDD)

- `dominio/distribucion.test.ts`: respeto de distancias dentro de fila y entre filas (incluidas fronteras entre especies), margen al borde, altas al norte en `bloques` y `companeras`, sin solapamientos, los tres modos (agrupación, mezcla solo de compañeras, round-robin), `noCaben` cuando no hay sitio, `cabeUnaMas`, determinismo.
- `dominio/colocacion.test.ts`: `aplicarAjustes` (sobrescribe, ignora bancales/cultivos inexistentes, no muta la entrada).
- `app/estado.test.ts`: acciones nuevas, reset en `empezar_plan`, restauración en `cargar_plan` (con y sin campos en el plan).
- `app/proponer.test.ts`: la cosecha estimada refleja los ajustes; el recorte geométrico reduce cantidades y produce `recortes`.
- `almacenamiento/almacen.test.ts`: ida y vuelta con los campos nuevos; carga de planes antiguos sin ellos.
- `ui/PanelResultado.test.tsx`: el stepper cambia la cantidad, el plano y la cosecha; «+» deshabilitado cuando no cabe; radios de intercalado cambian el modo.
- `ui/PlanoBancal.test.tsx`: el SVG contiene las plantas en posiciones reales y las cotas con las medidas correctas.
- Se eliminan `ui/plano-geometria.ts` y su test.

## Fuera de alcance

- Arrastre de plantas individuales o edición de posiciones.
- Mover especies entre bancales manualmente.
- Modo de intercalado por bancal (el selector es global).
- Cambios en el algoritmo `colocar()`.
