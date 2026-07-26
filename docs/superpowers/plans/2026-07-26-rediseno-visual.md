# Plan de implementación del rediseño visual

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar `superpowers:subagent-driven-development` (recomendada) o `superpowers:executing-plans` para ejecutar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** dar a la web de huertos su aspecto definitivo —dirección «App limpia»— con una hoja de estilos con tokens, un armazón nuevo con miga de pan navegable, y los iconos del plano escalados a la separación real de cada cultivo.

**Arquitectura:** un único `src/estilos.css` importado desde `src/main.tsx`, con variables CSS en `:root` y clases semánticas que consumen todos los componentes. Dos componentes nuevos (`Cabecera`, `MigaPasos`) sacan el armazón fuera de `App.tsx`. El SVG del plano es la excepción deliberada: se estila con atributos en línea porque se exporta aislado.

**Tecnologías:** React 19, TypeScript, Vite 8, Vitest 4 con jsdom, Testing Library, oxlint. CSS plano, sin preprocesador ni dependencias nuevas.

## Restricciones globales

Se aplican a **todas** las tareas:

- **Todo en español**: texto de interfaz, comentarios de código, nombres de clases CSS, mensajes de commit. Excepción: el texto de la licencia MIT.
- **Ninguna dependencia nueva.** Nada que obligue a tocar la CSP de `index.html`.
- **Ningún color literal fuera de `:root`**, con dos excepciones y ninguna más: las constantes `COLOR_*` de `PlanoBancal.tsx` (§7.2 de la spec: el SVG se exporta aislado y perdería las clases) y el azul `#1a5aa8` de las heladas en `ResumenClima.tsx` (es un color con significado, ya existía y contrasta 6,1:1).
- **El SVG del plano se estila con atributos de presentación en línea, nunca con clases.** `exportar.ts` clona y serializa el nodo aislado; con clases, el PNG y el PDF saldrían sin color.
- **Los controles siguen siendo elementos nativos.** Un control «segmentado» es un `<fieldset>` con `<legend>` e `<input type="radio">` reales; cambia el aspecto, no la semántica.
- **Contraste mínimo 4,5:1** para todo texto. `--verde-vivo` (`#16A34A`, 3,3:1) solo para elementos decorativos: nunca texto ni fondo de texto.
- **No se afirma sobre color en los tests.** Vitest no carga la hoja de estilos; un test de color sería falso.
- **Si un test existente falla, se arregla sin debilitar la aserción.** Si la única forma de que pase es relajar lo que comprueba, **parar y preguntar**.
- **Durante las tareas, ejecutar solo los tests afectados** con `npx vitest run <archivo>` (segundos). La suite completa tarda ~8,5 minutos y solo se ejecuta en la tarea 12.
- **Cualquier ejecución larga va en segundo plano** (la herramienta Bash corta a los 10 minutos), y hay que consultar su salida en bucle, no esperar una notificación.

---

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `src/estilos.css` | tokens y clases compartidas; único archivo CSS |
| `src/ui/tamano-icono.ts` | función pura del tamaño del icono en el plano |
| `src/ui/tamano-icono.test.ts` | sus tests |
| `src/ui/Cabecera.tsx` | logo y nombre |
| `src/ui/MigaPasos.tsx` | miga de pan navegable y barra de progreso |
| `src/ui/MigaPasos.test.tsx` | sus tests |

**Se modifican:** `src/main.tsx`, `src/ui/App.tsx`, `PlanoBancal.tsx`, `PantallaInicio.tsx`, `PasoUbicacion.tsx`, `ResumenClima.tsx`, `MapaSelector.tsx`, `EditorBancales.tsx`, `PasoSuelo.tsx`, `EditorSuelo.tsx`, `SelectorEspecies.tsx`, `PanelResultado.tsx`, `VistaCalendario.tsx`, `PieAtribuciones.tsx`, `AvisoPrivacidad.tsx`, y `package-lock.json`.

---

## Tarea 1: Hoja de estilos y vocabulario compartido

Es la base de todo lo demás: crea los tokens y las clases que consumen las once tareas siguientes. También salda el `postcss` pendiente, **antes** de que exista el primer archivo CSS.

**Archivos:**
- Crear: `src/estilos.css`
- Modificar: `src/main.tsx`
- Modificar: `package-lock.json` (vía `npm audit fix`)

**Interfaces:**
- Produce: las variables CSS de `:root` y las clases `.pagina`, `.contenido`, `.contenido-estrecho`, `.titulo-pantalla`, `.subtitulo-pantalla`, `.meta`, `.tarjeta`, `.tarjeta-cabecera`, `.tarjeta-cuerpo`, `.tarjeta-titulo`, `.boton`, `.boton-primario`, `.boton-contorno`, `.boton-plano`, `.boton-icono`, `.boton-pequeno`, `.campo`, `.entrada`, `.selector`, `.grupo-segmentado`, `.segmentado`, `.segmentado-opcion`, `.rejilla`, `.fila`, `.aviso`, `.aviso-atencion`, `.lista-limpia`.

- [ ] **Paso 1: Saldar la vulnerabilidad de postcss**

```bash
npm audit fix
npm audit
```

Esperado: `found 0 vulnerabilities`. Si `npm audit fix` no la resuelve y propone `--force`, **parar y preguntar**: `--force` puede subir Vite de versión mayor y eso no está en el alcance.

- [ ] **Paso 2: Crear `src/estilos.css`**

```css
/* Hoja de estilos única de la aplicación.
 *
 * Orden de los bloques: tokens → base → armazón → tarjetas → botones →
 * formularios → avisos → utilidades → móvil. Ningún color literal fuera de
 * :root; la excepción deliberada es el SVG del plano (PlanoBancal.tsx), que
 * se estila en línea porque se exporta aislado y perdería las clases.
 */

/* ─────────────── TOKENS ─────────────── */
:root {
  --fondo: #F1F5F0;
  --superficie: #FFFFFF;
  --superficie-tenue: #FAFCFA;

  --texto: #16241C;
  --texto-medio: #4B5D51;
  --texto-tenue: #5E6E64;
  --texto-apagado: #9FB0A4;

  --borde: #DCE5DD;
  --borde-suave: #EDF2EE;
  --borde-verde: #C6DFCB;

  --verde: #166534;
  /* Decorativo: 3,3:1, no alcanza el mínimo para texto. */
  --verde-vivo: #16A34A;
  --pista: #E3EBE4;

  --aviso-fondo: #FFF8E6;
  --aviso-borde: #E8D9A8;
  --aviso-texto: #6B5200;

  /* Estado y contraste. Existen como tokens y no como literales sueltos para
   * que la regla «ningún color fuera de :root» siga siendo comprobable con un
   * grep en la tarea 12. */
  --fondo-desactivado: #F4F7F4;
  --texto-sobre-verde: #FFFFFF;

  --espacio-1: 4px;
  --espacio-2: 8px;
  --espacio-3: 12px;
  --espacio-4: 16px;
  --espacio-5: 24px;
  --espacio-6: 32px;

  --radio-s: 8px;
  --radio-m: 10px;
  --radio-l: 14px;

  --sombra: 0 1px 2px rgba(16, 40, 24, .06);
  --sombra-elevada: 0 1px 2px rgba(16, 40, 24, .10);

  --fuente: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --ancho-contenido: 960px;
  --ancho-estrecho: 720px;
}

/* ─────────────── BASE ─────────────── */
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--fuente);
  font-size: 15px;
  line-height: 1.5;
  color: var(--texto);
  background: var(--fondo);
}

a { color: var(--verde); }

:focus-visible {
  outline: 2px solid var(--verde);
  outline-offset: 2px;
  border-radius: var(--radio-s);
}

/* ─────────────── ARMAZÓN ─────────────── */
.pagina { min-height: 100vh; }

.contenido {
  max-width: var(--ancho-contenido);
  margin: 0 auto;
  padding: var(--espacio-5) var(--espacio-4) var(--espacio-6);
}

.contenido-estrecho {
  max-width: var(--ancho-estrecho);
  margin: 0 auto;
}

.titulo-pantalla {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.02em;
  margin: 0 0 var(--espacio-1);
}

.subtitulo-pantalla {
  font-size: 15px;
  color: var(--texto-medio);
  margin: 0 0 var(--espacio-4);
}

.meta {
  font-size: 12px;
  color: var(--texto-tenue);
}

/* ─────────────── TARJETAS ─────────────── */
.tarjeta {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--radio-l);
  box-shadow: var(--sombra);
  overflow: hidden;
  margin-bottom: var(--espacio-3);
}

.tarjeta-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-3);
  flex-wrap: wrap;
  padding: var(--espacio-3) var(--espacio-4);
  border-bottom: 1px solid var(--borde-suave);
}

.tarjeta-cuerpo { padding: var(--espacio-4); }

.tarjeta-titulo {
  font-size: 15px;
  font-weight: 650;
  margin: 0;
}

/* ─────────────── BOTONES ─────────────── */
.boton {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radio-s);
  padding: 9px 18px;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--texto-medio);
}

/* --texto-apagado contrasta 2,28:1, por debajo del mínimo. Es correcto aquí y
 * SOLO aquí: WCAG exime explícitamente el texto de los controles inactivos. */
.boton:disabled {
  cursor: default;
  color: var(--texto-apagado);
  background: var(--fondo-desactivado);
  border-color: var(--borde);
}

.boton-primario {
  background: var(--verde);
  border-color: var(--verde);
  color: var(--texto-sobre-verde);
}

.boton-contorno {
  background: var(--superficie);
  border-color: var(--borde-verde);
  color: var(--verde);
}

.boton-plano { color: var(--texto-medio); }

.boton-icono {
  padding: 4px 9px;
  font-size: 14px;
  line-height: 1.2;
}

.boton-pequeno {
  font-size: 12px;
  padding: 5px 10px;
}

/* ─────────────── FORMULARIOS ─────────────── */
.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-1);
  font-size: 13px;
  font-weight: 600;
  color: var(--texto-medio);
}

.entrada,
.selector {
  font-family: inherit;
  font-size: 15px;
  font-weight: 400;
  color: var(--texto);
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--radio-s);
  padding: 8px 10px;
}

.entrada:disabled { background: var(--fondo-desactivado); color: var(--texto-apagado); }

/* Control segmentado: por dentro sigue siendo un fieldset con radios reales.
 * El radio se mantiene enfocable y visible para el lector de pantalla; solo
 * se oculta a la vista.
 *
 * La píldora es un div INTERIOR, no el propio fieldset: un <legend> dentro de
 * un fieldset con display:inline-flex se convierte en elemento flex y se mete
 * dentro de la píldora. */
.grupo-segmentado {
  border: 0;
  padding: 0;
  margin: 0;
}

.grupo-segmentado legend {
  padding: 0;
  margin-bottom: var(--espacio-2);
  font-size: 12px;
  color: var(--texto-tenue);
}

.segmentado {
  display: inline-flex;
  flex-wrap: wrap;
  background: var(--pista);
  border-radius: 9px;
  padding: 3px;
}

.segmentado-opcion {
  position: relative;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 7px;
  color: var(--texto-medio);
  cursor: pointer;
}

.segmentado-opcion input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.segmentado-opcion:has(input:checked) {
  background: var(--superficie);
  color: var(--texto);
  font-weight: 600;
  box-shadow: var(--sombra-elevada);
}

.segmentado-opcion:has(input:focus-visible) {
  outline: 2px solid var(--verde);
  outline-offset: 2px;
}

/* ─────────────── AVISOS ─────────────── */
.aviso {
  background: var(--aviso-fondo);
  border: 1px solid var(--aviso-borde);
  border-radius: var(--radio-m);
  color: var(--aviso-texto);
  font-size: 14px;
  padding: var(--espacio-3) var(--espacio-4);
  margin: var(--espacio-3) 0;
}

.aviso-atencion { font-weight: 600; }

/* ─────────────── UTILIDADES ─────────────── */
.lista-limpia {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--espacio-3);
}

/* Dentro de la rejilla el hueco lo pone el gap, no el margen de la tarjeta. */
.rejilla > .tarjeta { margin-bottom: 0; }

.fila {
  display: flex;
  align-items: center;
  gap: var(--espacio-2);
  flex-wrap: wrap;
}

/* ─────────────── MÓVIL ─────────────── */
@media (max-width: 720px) {
  .contenido { padding: var(--espacio-4) var(--espacio-3) var(--espacio-5); }
  .rejilla { grid-template-columns: 1fr; }
}
```

- [ ] **Paso 3: Importar la hoja desde `src/main.tsx`**

Añadir la importación como primera línea del archivo:

```tsx
import './estilos.css'
import { StrictMode } from 'react'
```

- [ ] **Paso 4: Comprobar que el build emite el CSS y el HTML lo enlaza**

```bash
npm run build
grep -o '<link rel="stylesheet"[^>]*>' dist/index.html
ls dist/assets/*.css
```

Esperado: un `<link rel="stylesheet" crossorigin href="/huertos/assets/index-*.css">` en el HTML. Si no aparece, la importación de `estilos.css` no está llegando al grafo de módulos: revisar el paso 3 antes de seguir.

**Ojo con el listado de `dist/assets/*.css`:** ya había un `MapaSelector-*.css` antes de esta tarea, porque `MapaSelector.tsx` importa `leaflet/dist/leaflet.css`. Ese llega en su propio fragmento perezoso y **no** se enlaza desde `index.html`. Lo que hay que ver aparecer es el `index-*.css`, que es el nuevo.

- [ ] **Paso 5: Comprobar que se sirve**

```bash
npm run preview &
sleep 3
hoja=$(grep -o 'assets/index-[^"]*\.css' dist/index.html | head -1)
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:4173/huertos/$hoja"
kill %1
```

Esperado: `200`.

- [ ] **Paso 6: Lint y tests afectados**

```bash
npm run lint
npx vitest run src/ui/App.test.tsx
```

Esperado: lint limpio y los tests de `App` en verde — la hoja de estilos no cambia el DOM, así que nada debería romperse todavía.

- [ ] **Paso 7: Commit**

```bash
git add src/estilos.css src/main.tsx package.json package-lock.json
git commit -m "feat: hoja de estilos con tokens y vocabulario compartido

Crea src/estilos.css con las variables de color, espaciado y radios de la
spec, y las clases que consumirán todas las pantallas. Salda de paso la
vulnerabilidad de postcss, que se dejó abierta en el proyecto 1 porque
entonces no había ningún archivo CSS."
```

---

## Tarea 2: La función del tamaño del icono

Función pura, sin React ni DOM. Se prueba sola y es la única pieza del cambio de dibujo que se puede verificar de verdad sin navegador.

**Archivos:**
- Crear: `src/ui/tamano-icono.ts`
- Test: `src/ui/tamano-icono.test.ts`

**Interfaces:**
- Produce: `tamañoIcono(distanciaPlantaCm: number, distanciaLineaCm: number): number`, y las constantes `TAMAÑO_ICONO_MIN_CM = 5`, `TAMAÑO_ICONO_MAX_CM = 26`, `FACTOR_ICONO = 0.85`. Lo consume la tarea 3.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/ui/tamano-icono.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { tamañoIcono, TAMAÑO_ICONO_MAX_CM, TAMAÑO_ICONO_MIN_CM } from './tamano-icono'

describe('tamañoIcono', () => {
  // Los valores salen de medir la maqueta aprobada
  // docs/superpowers/specs/assets/2026-07-25-maqueta-estilo-b-bancales-5x5.html,
  // que se hizo expresamente para validar este cambio.
  it.each([
    ['cebolla', 10, 25, 8.5],
    ['zanahoria', 15, 20, 12.75],
    ['lechuga', 25, 30, 21.25],
    ['berenjena', 30, 70, 25.5],
  ])('escala %s a la separación menor', (_nombre, planta, linea, esperado) => {
    expect(tamañoIcono(planta, linea)).toBeCloseTo(esperado, 5)
  })

  it('toma la separación menor, no la primera', () => {
    expect(tamañoIcono(70, 30)).toBeCloseTo(tamañoIcono(30, 70), 5)
  })

  it('recorta los cultivos muy separados al tope', () => {
    expect(tamañoIcono(50, 60)).toBe(TAMAÑO_ICONO_MAX_CM)
    expect(tamañoIcono(100, 100)).toBe(TAMAÑO_ICONO_MAX_CM)
  })

  it('sube los cultivos muy juntos al mínimo legible', () => {
    expect(tamañoIcono(4, 4)).toBe(TAMAÑO_ICONO_MIN_CM)
  })

  it('nunca sale del intervalo, sea cual sea la entrada', () => {
    for (const sep of [0, 1, 3, 7, 12, 40, 200, 1000]) {
      const t = tamañoIcono(sep, sep)
      expect(t).toBeGreaterThanOrEqual(TAMAÑO_ICONO_MIN_CM)
      expect(t).toBeLessThanOrEqual(TAMAÑO_ICONO_MAX_CM)
    }
  })
})
```

- [ ] **Paso 2: Ejecutar el test y verlo fallar**

```bash
npx vitest run src/ui/tamano-icono.test.ts
```

Esperado: FALLO, «Failed to resolve import "./tamano-icono"».

- [ ] **Paso 3: Escribir la implementación mínima**

Crear `src/ui/tamano-icono.ts`:

```ts
// Tamaño del icono de una planta en el plano, en cm de las unidades del plano.
//
// Antes todos los iconos se dibujaban a 16 cm fijos: con cebollas a 10 cm de
// separación se solapaban y el bloque quedaba ilegible. El icono se escala a la
// separación real del cultivo, con un mínimo para que se siga distinguiendo y
// un tope para que los cultivos muy separados no salgan enormes.
export const TAMAÑO_ICONO_MIN_CM = 5
export const TAMAÑO_ICONO_MAX_CM = 26
export const FACTOR_ICONO = 0.85

export function tamañoIcono(distanciaPlantaCm: number, distanciaLineaCm: number): number {
  const separacion = Math.min(distanciaPlantaCm, distanciaLineaCm)
  const escalado = FACTOR_ICONO * separacion
  return Math.min(TAMAÑO_ICONO_MAX_CM, Math.max(TAMAÑO_ICONO_MIN_CM, escalado))
}
```

- [ ] **Paso 4: Ejecutar el test y verlo pasar**

```bash
npx vitest run src/ui/tamano-icono.test.ts
```

Esperado: PASA, 5 tests.

- [ ] **Paso 5: Demostrar que los tests discriminan**

Cambiar temporalmente `Math.min` por `Math.max` en la primera línea de la función y volver a ejecutar. Esperado: fallan los casos de la maqueta y el de «toma la separación menor». Después, subir el `FACTOR_ICONO` a `1` y volver a ejecutar: esperado, fallan los cuatro casos de la maqueta. **Deshacer ambos cambios** y confirmar que vuelve a pasar. Si algún sabotaje NO hace fallar ningún test, el test correspondiente no vigila nada: pararse a arreglarlo.

- [ ] **Paso 6: Commit**

```bash
git add src/ui/tamano-icono.ts src/ui/tamano-icono.test.ts
git commit -m "feat: función del tamaño del icono según la separación del cultivo"
```

---

## Tarea 3: El plano usa el tamaño escalado y los colores nuevos

**Archivos:**
- Modificar: `src/ui/PlanoBancal.tsx`
- Test: `src/ui/PlanoBancal.test.tsx` (existente, se amplía)

**Interfaces:**
- Consume: `tamañoIcono(distanciaPlantaCm, distanciaLineaCm)` de la tarea 2.
- Produce: nada nuevo hacia otras tareas; `PlanoBancal` conserva su firma actual.

- [ ] **Paso 1: Escribir el test que falla**

Añadir al final de `src/ui/PlanoBancal.test.tsx`:

```tsx
it('escala el icono a la separación de cada cultivo', () => {
  // La cebolla va a 10 cm y el tomate a 50: sus iconos no pueden medir igual.
  const bancal = { id: 'b1', nombre: 'Bancal 1', anchoM: 5, largoM: 5 }
  const { container } = render(
    <PlanoBancal
      bancal={bancal}
      asignaciones={[
        { cultivoId: 'cebolla', numPlantas: 4 },
        { cultivoId: 'tomate', numPlantas: 4 },
      ]}
      orientacionNorte="norte"
      modoIntercalado="bloques"
    />,
  )

  const tamaños = new Set(
    [...container.querySelectorAll('[data-marca] text')].map((t) => t.getAttribute('font-size')),
  )
  expect(tamaños.size).toBe(2)
  expect(tamaños).not.toContain('16')
})
```

Si los identificadores `cebolla` o `tomate` no existen en `src/datos/cultivos.ts`, usar dos que sí existan con separaciones claramente distintas, y ajustar el comentario. Comprobarlo con:

```bash
grep -n "id: '" src/datos/cultivos.ts | head -20
```

- [ ] **Paso 2: Ejecutar el test y verlo fallar**

```bash
npx vitest run src/ui/PlanoBancal.test.tsx
```

Esperado: FALLO, `expected 1 to be 2` — hoy todos los iconos miden 16.

- [ ] **Paso 3: Aplicar el tamaño escalado**

En `src/ui/PlanoBancal.tsx`, añadir a las importaciones:

```tsx
import { buscarCultivo } from '../datos/cultivos'
import { tamañoIcono } from './tamano-icono'
```

Dentro del componente, después de `const cotas = calcularCotas(plantas)`, cachear el tamaño por cultivo:

```tsx
  // Se cachea por cultivo: con 400 plantas, buscar el cultivo una vez por
  // planta se nota.
  const tamañoPorCultivo = new Map<string, number>()
  for (const p of plantas) {
    if (tamañoPorCultivo.has(p.cultivoId)) continue
    const c = buscarCultivo(p.cultivoId)
    tamañoPorCultivo.set(p.cultivoId, c ? tamañoIcono(c.distanciaPlantaCm, c.distanciaLineaCm) : 16)
  }
```

Y sustituir el `fontSize={16}` del `<text>` de las marcas:

```tsx
          <text textAnchor="middle" dominantBaseline="central" fontSize={tamañoPorCultivo.get(p.cultivoId) ?? 16}>{p.icono}</text>
```

- [ ] **Paso 4: Ejecutar el test y verlo pasar**

```bash
npx vitest run src/ui/PlanoBancal.test.tsx
```

Esperado: PASA, incluidos los tests que ya había.

- [ ] **Paso 5: Aplicar los colores del plano**

Los colores del SVG van como constantes del módulo, **no** como variables CSS, porque `exportar.ts` serializa el nodo aislado. Añadir arriba de `PlanoBancal.tsx`, junto a `FLECHA`:

```tsx
// Colores del plano. No usan las variables CSS a propósito: exportar.ts clona
// el SVG y lo serializa aislado, así que el PNG y el PDF saldrían sin color si
// dependieran de la hoja de estilos.
const COLOR_FONDO_PLANO = '#F6F4EC'
const COLOR_BORDE_PLANO = '#E2E6DC'
const COLOR_MARCO_BANCAL = '#C9CDBF'
const COLOR_LINEA_COTA = '#9AA694'
const COLOR_TEXTO_COTA = '#5E6B5A'
const COLOR_BRUJULA = '#166534'
```

Sustituir en `LineaCota` los `stroke="#888"` por `stroke={COLOR_LINEA_COTA}` (las dos apariciones) y los `fill="#555"` por `fill={COLOR_TEXTO_COTA}` (las dos apariciones).

En el `<svg>`, cambiar el `style`:

```tsx
      style={{ maxWidth: maxAnchoPx, border: `1px solid ${COLOR_BORDE_PLANO}`, borderRadius: 10, background: COLOR_FONDO_PLANO }}
```

En el `<rect>` del bancal, `stroke="#bbb"` pasa a `stroke={COLOR_MARCO_BANCAL}`. En el `<text>` de la flecha, `fill="#333"` pasa a `fill={COLOR_BRUJULA}` y se le añade `fontWeight={600}`.

- [ ] **Paso 6: Verificar que la exportación sigue viva**

```bash
npx vitest run src/ui/PlanoBancal.test.tsx src/ui/PanelResultado.export.test.tsx
npm run lint
```

Esperado: todo en verde. `PanelResultado.export.test.tsx` es el que vigila que el SVG se serializa bien.

- [ ] **Paso 7: Commit**

```bash
git add src/ui/PlanoBancal.tsx src/ui/PlanoBancal.test.tsx
git commit -m "feat: el plano escala el icono al cultivo y adopta los colores nuevos"
```

---

## Tarea 4: MigaPasos

Componente aislado, con el único comportamiento nuevo del proyecto. Se construye y se prueba antes de tocar `App.tsx`.

**Archivos:**
- Crear: `src/ui/MigaPasos.tsx`
- Test: `src/ui/MigaPasos.test.tsx`

**Interfaces:**
- Consume: el tipo `Paso` de `src/app/estado.ts` (`'inicio' | 'ubicacion' | 'bancales' | 'suelo' | 'especies' | 'resultado'`).
- Produce: `<MigaPasos pasoActual={paso} onIr={(paso) => void} />` y la constante `PASOS_ASISTENTE`. Lo consume la tarea 5.

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/ui/MigaPasos.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MigaPasos } from './MigaPasos'

describe('MigaPasos', () => {
  it('lleva a un paso ya completado al pulsarlo', async () => {
    const onIr = vi.fn()
    render(<MigaPasos pasoActual="suelo" onIr={onIr} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ubicación' }))

    expect(onIr).toHaveBeenCalledWith('ubicacion')
  })

  it('no ofrece como botón el paso actual ni los futuros', () => {
    render(<MigaPasos pasoActual="suelo" onIr={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Suelo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Especies' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tu huerto' })).toBeNull()
    // Pero siguen leyéndose, no desaparecen de la pantalla.
    expect(screen.getByText('Especies')).toBeInTheDocument()
  })

  it('señala el paso actual para el lector de pantalla', () => {
    render(<MigaPasos pasoActual="suelo" onIr={vi.fn()} />)

    expect(screen.getByText('Suelo')).toHaveAttribute('aria-current', 'step')
  })

  it('no se dibuja en la pantalla de inicio, que está fuera del asistente', () => {
    const { container } = render(<MigaPasos pasoActual="inicio" onIr={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Paso 2: Ejecutar el test y verlo fallar**

```bash
npx vitest run src/ui/MigaPasos.test.tsx
```

Esperado: FALLO, «Failed to resolve import "./MigaPasos"».

- [ ] **Paso 3: Escribir la implementación**

Crear `src/ui/MigaPasos.tsx`:

```tsx
import type { Paso } from '../app/estado'

// El asistente, en orden. 'inicio' queda fuera a propósito: es la portada, no
// un paso, y desde ella no hay miga que enseñar.
export const PASOS_ASISTENTE: { paso: Paso; etiqueta: string }[] = [
  { paso: 'ubicacion', etiqueta: 'Ubicación' },
  { paso: 'bancales', etiqueta: 'Bancales' },
  { paso: 'suelo', etiqueta: 'Suelo' },
  { paso: 'especies', etiqueta: 'Especies' },
  { paso: 'resultado', etiqueta: 'Tu huerto' },
]

export function MigaPasos({ pasoActual, onIr }: { pasoActual: Paso; onIr: (paso: Paso) => void }) {
  const actual = PASOS_ASISTENTE.findIndex((p) => p.paso === pasoActual)
  if (actual < 0) return null

  const progreso = ((actual + 1) / PASOS_ASISTENTE.length) * 100

  return (
    <nav aria-label="Pasos del asistente">
      <ol className="miga">
        {PASOS_ASISTENTE.map(({ paso, etiqueta }, i) => (
          <li key={paso} className="miga-paso">
            {i < actual ? (
              <button type="button" className="miga-enlace" onClick={() => onIr(paso)}>{etiqueta}</button>
            ) : (
              <span
                className={i === actual ? 'miga-actual' : 'miga-futuro'}
                aria-current={i === actual ? 'step' : undefined}
              >
                {etiqueta}
              </span>
            )}
            {i < PASOS_ASISTENTE.length - 1 && <span className="miga-separador" aria-hidden="true">›</span>}
          </li>
        ))}
      </ol>
      <div className="progreso">
        <div className="progreso-relleno" style={{ width: `${progreso}%` }} />
      </div>
    </nav>
  )
}
```

- [ ] **Paso 4: Añadir sus estilos**

Añadir al bloque ARMAZÓN de `src/estilos.css`, después de `.meta`:

```css
.miga {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--espacio-1);
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
}

.miga-paso {
  display: flex;
  align-items: center;
  gap: var(--espacio-1);
}

.miga-enlace {
  font-family: inherit;
  font-size: 12px;
  color: var(--verde);
  background: none;
  border: 0;
  padding: 2px 4px;
  cursor: pointer;
}

.miga-enlace:hover { text-decoration: underline; }

.miga-actual {
  color: var(--verde);
  font-weight: 650;
  padding: 2px 4px;
}

/* Los pasos futuros van en el gris de metadatos, no en --texto-apagado: son
 * texto que hay que poder leer, y --texto-apagado (2,28:1) solo vale para
 * controles inactivos. La señal de «aún no has llegado» la da que no son
 * pulsables ni van en verde. */
.miga-futuro {
  color: var(--texto-tenue);
  padding: 2px 4px;
}

.miga-separador { color: #C3D2C6; }

.progreso {
  height: 3px;
  background: var(--pista);
  border-radius: 2px;
  margin-top: var(--espacio-2);
}

.progreso-relleno {
  height: 3px;
  background: var(--verde-vivo);
  border-radius: 2px;
}
```

- [ ] **Paso 5: Ejecutar el test y verlo pasar**

```bash
npx vitest run src/ui/MigaPasos.test.tsx
npm run lint
```

Esperado: PASA, 4 tests.

- [ ] **Paso 6: Demostrar que los tests discriminan**

Cambiar temporalmente `i < actual` por `i <= actual` en el ternario y volver a ejecutar. Esperado: falla «no ofrece como botón el paso actual ni los futuros». Después, cambiarlo por `i < PASOS_ASISTENTE.length` y volver a ejecutar: esperado, fallan también los futuros. **Deshacer** y confirmar que vuelve a pasar.

- [ ] **Paso 7: Commit**

```bash
git add src/ui/MigaPasos.tsx src/ui/MigaPasos.test.tsx src/estilos.css
git commit -m "feat: miga de pan navegable con barra de progreso"
```

---

## Tarea 5: Cabecera y armazón en App

Aquí es donde el armazón entra en la aplicación y donde desaparecen los botones «Ajustar…».

**Archivos:**
- Crear: `src/ui/Cabecera.tsx`
- Modificar: `src/ui/App.tsx`
- Modificar: `src/estilos.css`
- Test: `src/ui/App.test.tsx` (existente, se ajusta si hace falta)

**Interfaces:**
- Consume: `<MigaPasos pasoActual onIr />` de la tarea 4.
- Produce: `<Cabecera />`, sin props.

- [ ] **Paso 1: Crear la cabecera**

Crear `src/ui/Cabecera.tsx`:

```tsx
export function Cabecera() {
  return (
    <div className="cabecera-marca">
      <span className="cabecera-logo" aria-hidden="true">🌱</span>
      <span className="cabecera-nombre">Huertos</span>
    </div>
  )
}
```

- [ ] **Paso 2: Añadir sus estilos**

Añadir al bloque ARMAZÓN de `src/estilos.css`, antes de `.miga`:

```css
.cabecera {
  background: var(--superficie);
  border-bottom: 1px solid var(--borde);
  padding: var(--espacio-3) var(--espacio-4);
}

.cabecera-interior {
  max-width: var(--ancho-contenido);
  margin: 0 auto;
}

.cabecera-marca {
  display: flex;
  align-items: center;
  gap: var(--espacio-2);
  margin-bottom: var(--espacio-3);
}

.cabecera-logo {
  width: 26px;
  height: 26px;
  border-radius: var(--radio-s);
  background: var(--verde-vivo);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.cabecera-nombre {
  font-weight: 650;
  font-size: 15px;
}
```

- [ ] **Paso 3: Montar el armazón en `App.tsx`**

Añadir a las importaciones:

```tsx
import { Cabecera } from './Cabecera'
import { MigaPasos } from './MigaPasos'
```

Sustituir el `return` (que hoy empieza en `<div style={{ maxWidth: 760, …}}>`) por:

```tsx
  return (
    <div className="pagina">
      <header className="cabecera">
        <div className="cabecera-interior">
          <Cabecera />
          <MigaPasos pasoActual={estado.paso} onIr={(paso) => dispatch({ tipo: 'ir_a_paso', paso })} />
        </div>
      </header>
      <div className="contenido">
        <main>
```

…manteniendo el contenido de `<main>` tal cual, y cerrando al final con:

```tsx
        </main>
        <PieAtribuciones />
      </div>
    </div>
  )
```

- [ ] **Paso 4: Quitar los botones «Ajustar…»**

En el bloque de `estado.paso === 'resultado'`, borrar estas dos líneas y el `<h2>` y el `<p>` que las introducen:

```tsx
                <h2>Ajustar (validación)</h2>
                <p>¿Quieres cambiar algo? Vuelve a las especies o los bancales y el huerto se recalcula solo.</p>
                <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Ajustar especies</button>
                <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })}>Ajustar bancales</button>
```

La miga de pan ya cumple esa función y tener dos maneras de volver atrás sobra. El resto de ese `<div>` —el guardado del plan— **se queda**, envuelto en una tarjeta:

```tsx
            <div className="tarjeta">
              <div className="tarjeta-cuerpo">
                <label className="campo">Nombre del plan
                  <input className="entrada" value={nombrePlan} onChange={(e) => { setNombrePlan(e.target.value); setGuardadoOk(false) }} />
                </label>
                <div className="fila" style={{ marginTop: 'var(--espacio-3)' }}>
                  <button type="button" className="boton boton-primario" disabled={!nombrePlan.trim()} onClick={/* copiar literalmente el onClick de App.tsx:106-119, sin cambiar una coma */}>Guardar plan</button>
                  {guardadoOk && <span className="meta">Guardado ✓</span>}
                </div>
              </div>
            </div>
```

**Cuidado:** el `onClick` de «Guardar plan» se copia entero y sin modificar. Es la lógica de guardado, no aspecto.

- [ ] **Paso 5: Ejecutar los tests y arreglar lo que rompa**

```bash
npx vitest run src/ui/App.test.tsx src/ui/PieAtribuciones.test.tsx
```

Ninguno de los tests actuales consulta «Ajustar especies» ni «Ajustar bancales» (comprobado con `grep`), así que en principio pasan. Si alguno falla por un encabezado o un landmark ambiguo —la cabecera nueva añade un `banner`—, arreglar la **consulta del test**, no la aserción. Si para que pase hubiera que debilitar lo que comprueba, **parar y preguntar**.

- [ ] **Paso 6: Comprobar que el pie sigue fuera de `<main>`**

```bash
npx vitest run src/ui/PieAtribuciones.test.tsx
```

Esperado: PASA. Este detalle se corrigió a propósito en el proyecto 1; el armazón no puede volver a meter el pie dentro de `<main>`.

- [ ] **Paso 7: Lint y commit**

```bash
npm run lint
git add src/ui/Cabecera.tsx src/ui/App.tsx src/estilos.css src/ui/App.test.tsx
git commit -m "feat: armazón con cabecera y miga de pan

Los botones «Ajustar especies» y «Ajustar bancales» desaparecen del
resultado: la miga de pan ya sirve para volver atrás y tener dos maneras
de hacerlo sobra."
```

---

## Tarea 6: PantallaInicio

**Archivos:**
- Modificar: `src/ui/PantallaInicio.tsx`
- Test: `src/ui/PantallaInicio.test.tsx` (existente)

- [ ] **Paso 1: Revestir la portada**

Sustituir el cuerpo de `PantallaInicio` por:

```tsx
    <div className="contenido-estrecho">
      <h1 className="titulo-pantalla">🌱 Planifica tu huerto</h1>
      <p className="subtitulo-pantalla">Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>

      <button type="button" className="boton boton-primario" onClick={onEmpezar}>Crear mi huerto</button>

      {planes.length > 0 && (
        <section style={{ marginTop: 'var(--espacio-5)' }}>
          <h2 className="tarjeta-titulo" style={{ marginBottom: 'var(--espacio-3)' }}>Mis planes de huerto</h2>
          <ul className="lista-limpia">
            {planes.map((plan) => (
              <li key={plan.id} className="tarjeta">
                <div className="tarjeta-cabecera">
                  <div>
                    <div className="tarjeta-titulo">{plan.nombre}</div>
                    <div className="meta">{subtituloPlan(plan)}</div>
                  </div>
                  <div className="fila">
                    <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => onAbrir(plan.id)}>Abrir</button>
                    <button type="button" className="boton boton-plano boton-pequeno" onClick={() => { if (window.confirm(`¿Borrar "${plan.nombre}"?`)) onBorrar(plan.id) }}>Borrar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="meta" style={{ marginTop: 'var(--espacio-5)' }}>
        Contenido bajo licencia{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>{' '}
        (Reconocimiento – No Comercial).
      </p>
    </div>
```

El botón «Crear mi huerto» sube por encima de la lista de planes: es la acción principal y antes quedaba enterrada debajo.

- [ ] **Paso 2: Ejecutar los tests**

```bash
npx vitest run src/ui/PantallaInicio.test.tsx
npm run lint
```

Esperado: PASA. Los textos y los roles no cambian; solo el orden y las clases. Si algún test depende del orden de los elementos, ajustar la consulta sin debilitar la aserción.

- [ ] **Paso 3: Commit**

```bash
git add src/ui/PantallaInicio.tsx src/ui/PantallaInicio.test.tsx
git commit -m "feat: revestir la pantalla de inicio"
```

---

## Tarea 7: PasoUbicacion, ResumenClima y MapaSelector

**Archivos:**
- Modificar: `src/ui/PasoUbicacion.tsx`, `src/ui/ResumenClima.tsx`
- Modificar: `src/estilos.css`
- Test: `src/ui/PasoUbicacion.test.tsx`, `src/ui/PasoUbicacion.direccion.test.tsx`, `src/ui/ResumenClima.test.tsx` (existentes)

**`src/ui/MapaSelector.tsx` no se toca.** Su `style={{ height: 320 }}` se queda: Leaflet exige una altura explícita en el contenedor del mapa o no dibuja nada. El redondeo y el borde se los pone el `<div className="mapa">` que lo envuelve desde `PasoUbicacion`.

- [ ] **Paso 1: Añadir los estilos de la tabla de clima y del mapa**

Añadir al bloque UTILIDADES de `src/estilos.css`:

```css
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tabla th,
.tabla td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--borde-suave);
}

.tabla thead th {
  color: var(--texto-tenue);
  font-size: 12px;
  font-weight: 600;
}

.tabla caption {
  caption-side: bottom;
  text-align: left;
  font-size: 12px;
  color: var(--texto-tenue);
  padding-top: var(--espacio-2);
}

.envoltorio-tabla { overflow-x: auto; }

.mapa {
  border: 1px solid var(--borde);
  border-radius: var(--radio-m);
  overflow: hidden;
}
```

- [ ] **Paso 2: Revestir `PasoUbicacion`**

En la rama de confirmación, envolver en tarjeta y usar los botones:

```tsx
      <div className="contenido-estrecho">
        <h2 className="titulo-pantalla">Confirma tu ubicación</h2>
        <div className="tarjeta">
          <div className="tarjeta-cuerpo">
            <ResumenClima clima={confirmando.clima} mesActual={mesActual} />
            <EditorSuelo inicial={confirmando.sueloAuto} onCambio={setSueloElegido} />
            <div className="fila" style={{ marginTop: 'var(--espacio-4)' }}>
              <button type="button" className="boton boton-primario" onClick={continuar}>Continuar</button>
              <button type="button" className="boton boton-contorno" onClick={() => setConfirmando(null)}>Cambiar ubicación</button>
            </div>
          </div>
        </div>
      </div>
```

Nótese que «Continuar» pasa a ir primero: es la acción principal.

En la rama principal, añadir un título de pantalla y envolver en tarjeta:

```tsx
      <div className="contenido-estrecho">
        <h2 className="titulo-pantalla">¿Dónde está tu huerto?</h2>
        <p className="subtitulo-pantalla">Con la ubicación deducimos tu clima y una estimación del suelo.</p>
        <div className="tarjeta">
          <div className="tarjeta-cuerpo">
            <div className="fila" role="group" aria-label="Modo de ubicación">
              <button type="button" className="boton boton-contorno" onClick={() => setModo('precisa')}>Usar ubicación precisa</button>
              <button type="button" className="boton boton-contorno" onClick={() => setModo('zona')}>Elegir por zona climática</button>
            </div>
            {/* … el resto del contenido actual, sin cambios de lógica … */}
          </div>
        </div>
        {error && <p className="aviso aviso-atencion" role="alert">{error}</p>}
      </div>
```

Dentro de la rama `modo === 'precisa'`: el `<form>` pasa a `className="fila"`, el `<input>` a `className="entrada"`, «Buscar» a `className="boton boton-contorno"`, la `<ul>` de resultados a `className="lista-limpia"` y cada botón de resultado a `className="boton boton-plano"`. El `<MapaSelector>` se envuelve en `<div className="mapa">`.

Dentro de la rama `modo === 'zona'`: el `<label>` pasa a `className="campo"`, el `<select>` a `className="selector"` y «Usar esta zona» a `className="boton boton-primario"`.

**No tocar ninguna función**: `buscar`, `usarCoordenadas`, `usarZona` y `continuar` se quedan exactamente igual.

- [ ] **Paso 3: Revestir `ResumenClima`**

Cambiar `<h3>Clima detectado</h3>` por `<h3 className="tarjeta-titulo">Clima detectado</h3>`, envolver la `<table>` en `<div className="envoltorio-tabla">` y darle `className="tabla"`. Quitar el `style` del `<caption>` (ahora lo pone `.tabla caption`). El azul `#1a5aa8` de las heladas se queda: es un color con significado, no decorativo, y contrasta 6,1:1 sobre blanco.

- [ ] **Paso 4: Ejecutar los tests**

```bash
npx vitest run src/ui/PasoUbicacion.test.tsx src/ui/PasoUbicacion.direccion.test.tsx src/ui/ResumenClima.test.tsx
npm run lint
```

Esperado: PASAN. Si alguno rompe por el `<h2>` nuevo, ajustar la consulta sin debilitar la aserción.

- [ ] **Paso 5: Commit**

```bash
git add src/ui/PasoUbicacion.tsx src/ui/ResumenClima.tsx src/estilos.css src/ui/PasoUbicacion.test.tsx src/ui/PasoUbicacion.direccion.test.tsx src/ui/ResumenClima.test.tsx
git commit -m "feat: revestir el paso de ubicación y el resumen de clima"
```

---

## Tarea 8: EditorBancales

**Archivos:**
- Modificar: `src/ui/EditorBancales.tsx`, `src/ui/App.tsx` (el botón «Siguiente» del paso)
- Test: `src/ui/EditorBancales.test.tsx` (existente)

- [ ] **Paso 1: Revestir el editor**

Sustituir el `return` de `EditorBancales` por:

```tsx
    <div className="contenido-estrecho">
      <h2 className="titulo-pantalla">Tus bancales</h2>
      <p className="subtitulo-pantalla">Añade cada bancal con sus medidas. Verás una vista previa a escala.</p>

      <div className="tarjeta">
        <div className="tarjeta-cuerpo">
          <fieldset className="grupo-segmentado" style={{ marginBottom: 'var(--espacio-4)' }}>
            <legend>¿Hacia dónde está el norte?</legend>
            <div className="segmentado">
              {ORIENTACIONES.map((o) => (
                <label key={o} className="segmentado-opcion">
                  <input
                    type="radio" name="orientacion-norte" value={o}
                    checked={orientacionNorte === o}
                    onChange={() => onOrientacion(o)}
                  />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="fila">
            <label className="campo">Ancho (m)
              <input className="entrada" type="number" min="0" step="0.1" value={ancho} onChange={(e) => setAncho(e.target.value)} />
            </label>
            <label className="campo">Largo (m)
              <input className="entrada" type="number" min="0" step="0.1" value={largo} onChange={(e) => setLargo(e.target.value)} />
            </label>
            <button type="button" className="boton boton-contorno" onClick={añadir}>Añadir bancal</button>
          </div>

          {previewValido && (
            <div style={{ marginTop: 'var(--espacio-4)' }}>
              <h4 className="meta">Vista previa</h4>
              <PlanoBancal
                bancal={{ id: 'preview', nombre: 'nuevo bancal', anchoM, largoM }}
                asignaciones={[]}
                orientacionNorte={orientacionNorte}
                modoIntercalado="bloques"
                maxAnchoPx={anchoPxParaLadoLargo(anchoM, largoM, 260)}
              />
            </div>
          )}
        </div>
      </div>

      <ul className="lista-limpia">
        {bancales.map((b) => (
          <li key={b.id} className="tarjeta">
            <div className="tarjeta-cabecera">
              <div className="fila">
                <PlanoBancal bancal={b} asignaciones={[]} orientacionNorte={orientacionNorte} modoIntercalado="bloques" maxAnchoPx={b.anchoM * pxPorMetro} />
                <div>
                  <div className="tarjeta-titulo">{b.nombre}</div>
                  <div className="meta">{b.anchoM} × {b.largoM} m</div>
                </div>
              </div>
              <button type="button" className="boton boton-plano boton-icono" onClick={() => onBorrar(b.id)} aria-label={`Borrar ${b.nombre}`}>✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
```

**Ojo:** la orientación pasa de `<select>` a radios. El `<select>` tenía `aria-label` implícito por el `<label>Orientación:`; ahora la etiqueta accesible del grupo la da el `<legend>`. Si `EditorBancales.test.tsx` consulta el `<select>` por etiqueta, hay que actualizar la consulta a los radios —esa es una consulta obsoleta, no una aserción debilitada.

- [ ] **Paso 2: Revestir el botón «Siguiente» del paso**

En `src/ui/App.tsx`, en el bloque `estado.paso === 'bancales'`:

```tsx
            <button type="button" className="boton boton-primario" disabled={estado.bancales.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'suelo' })}>Siguiente</button>
```

- [ ] **Paso 3: Ejecutar los tests**

```bash
npx vitest run src/ui/EditorBancales.test.tsx src/ui/App.test.tsx
npm run lint
```

- [ ] **Paso 4: Commit**

```bash
git add src/ui/EditorBancales.tsx src/ui/App.tsx src/ui/EditorBancales.test.tsx
git commit -m "feat: revestir el editor de bancales"
```

---

## Tarea 9: PasoSuelo y EditorSuelo

**Archivos:**
- Modificar: `src/ui/PasoSuelo.tsx`, `src/ui/EditorSuelo.tsx`, `src/ui/App.tsx`
- Test: `src/ui/PasoSuelo.test.tsx`, `src/ui/EditorSuelo.test.tsx` (existentes)

- [ ] **Paso 1: Revestir `PasoSuelo`**

```tsx
    <div className="contenido-estrecho">
      <h2 className="titulo-pantalla">¿Cómo es tu suelo?</h2>
      {sueloAuto && (
        <p className="subtitulo-pantalla">Hemos deducido de tu ubicación un suelo <strong>{sueloAuto.textura}</strong> (pH {sueloAuto.ph}). Puedes cambiarlo abajo.</p>
      )}
      <div className="tarjeta">
        <div className="tarjeta-cuerpo">
          <ul className="lista-limpia">
            {TIPOS_SUELO.map((t) => (
              <li key={t.textura} style={{ marginBottom: 'var(--espacio-2)' }}>
                <button type="button" className="boton boton-contorno" style={{ textAlign: 'left', width: '100%' }} onClick={() => onElegir(sueloManual(t.textura))}>
                  <span className="tarjeta-titulo">{t.nombre}</span>
                  <span className="meta" style={{ display: 'block', fontWeight: 400 }}>{t.descripcion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!sueloAuto && (
        <div className="tarjeta">
          <div className="tarjeta-cuerpo">
            <h3 className="tarjeta-titulo">¿No sabes qué suelo tienes? Averígualo así</h3>
            {GUIA_EXPERIMENTACION.map((g) => (
              <details key={g.titulo} style={{ marginTop: 'var(--espacio-2)' }}>
                <summary>{g.titulo}</summary>
                <ol>{g.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
```

**Ojo:** el nombre accesible del botón pasa de «Nombre — descripción» a «Nombre descripción» (sin el guion). Si `PasoSuelo.test.tsx` consulta por el texto exacto con guion, actualizar la consulta.

- [ ] **Paso 2: Revestir `EditorSuelo`**

Cambiar `<h3>Tu suelo</h3>` por `<h3 className="tarjeta-titulo">Tu suelo</h3>`, los dos `<label>` a `className="campo"`, el `<select>` a `className="selector"` y el `<input>` de pH a `className="entrada"`. Los dos `<p>` informativos pasan a `className="meta"`. La lógica de `emitir` no se toca.

- [ ] **Paso 3: Revestir el botón «Siguiente» del paso**

En `src/ui/App.tsx`, bloque `estado.paso === 'suelo'`:

```tsx
            <button type="button" className="boton boton-primario" disabled={!estado.suelo} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Siguiente</button>
```

- [ ] **Paso 4: Ejecutar los tests**

```bash
npx vitest run src/ui/PasoSuelo.test.tsx src/ui/EditorSuelo.test.tsx src/ui/App.test.tsx
npm run lint
```

- [ ] **Paso 5: Commit**

```bash
git add src/ui/PasoSuelo.tsx src/ui/EditorSuelo.tsx src/ui/App.tsx src/ui/PasoSuelo.test.tsx src/ui/EditorSuelo.test.tsx
git commit -m "feat: revestir el paso de suelo"
```

---

## Tarea 10: SelectorEspecies

**Archivos:**
- Modificar: `src/ui/SelectorEspecies.tsx`, `src/ui/App.tsx`, `src/estilos.css`
- Test: `src/ui/SelectorEspecies.test.tsx` (existente)

- [ ] **Paso 1: Añadir el estilo de la tarjeta de cultivo**

Añadir al bloque UTILIDADES de `src/estilos.css`:

```css
.cultivo {
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--radio-m);
  padding: var(--espacio-3);
}

.cultivo:has(input:checked) {
  border-color: var(--verde);
  background: var(--superficie-tenue);
}

.cultivo-nombre {
  display: flex;
  align-items: center;
  gap: var(--espacio-2);
  font-size: 14px;
  cursor: pointer;
}

.cultivo-ajustes {
  display: flex;
  gap: var(--espacio-2);
  margin-top: var(--espacio-2);
}

.cultivo-ajustes .selector {
  font-size: 13px;
  padding: 5px 8px;
}
```

- [ ] **Paso 2: Revestir el selector**

```tsx
    <div className="contenido-estrecho">
      <h2 className="titulo-pantalla">¿Qué quieres cultivar?</h2>
      <p className="subtitulo-pantalla">Marca lo que te apetezca, o deja que te propongamos una selección para tu clima y tu superficie.</p>

      <button type="button" className="boton boton-contorno" style={{ marginBottom: 'var(--espacio-4)' }} onClick={() => onCambio(sugerirEspecies(clima, suelo, mesActual, superficieM2))}>
        Hazme tú una sugerencia
      </button>

      <ul className="lista-limpia rejilla">
        {CULTIVOS.map((c) => {
          const eleccion = porId.get(c.id)
          return (
            <li key={c.id} className="cultivo">
              <label className="cultivo-nombre">
                <input type="checkbox" checked={!!eleccion} onChange={() => alternar(c.id)} aria-label={c.nombreComun} />
                <span>{c.icono} {c.nombreComun}</span>
              </label>
              {eleccion && (
                <div className="cultivo-ajustes">
                  <select
                    className="selector"
                    aria-label={`Obligatoriedad de ${c.nombreComun}`}
                    value={eleccion.obligatoriedad}
                    onChange={(ev) => actualizar(c.id, { obligatoriedad: ev.target.value as Obligatoriedad })}
                  >
                    <option value="opcional">Opcional</option>
                    <option value="obligatoria">Obligatoria</option>
                  </select>
                  <select
                    className="selector"
                    aria-label={`Cantidad de ${c.nombreComun}`}
                    value={eleccion.cantidad}
                    onChange={(ev) => actualizar(c.id, { cantidad: ev.target.value as NivelCantidad })}
                  >
                    <option value="poca">Poca</option>
                    <option value="media">Media</option>
                    <option value="mucha">Mucha</option>
                  </select>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
```

La `rejilla` usa `minmax(300px, 1fr)`, que para tarjetas de cultivo es demasiado ancho. Añadir en el mismo bloque de estilos:

```css
.rejilla-cultivos { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
```

…y usar `className="lista-limpia rejilla rejilla-cultivos"` en la `<ul>`.

- [ ] **Paso 3: Revestir el botón «Ver mi huerto»**

En `src/ui/App.tsx`, bloque `estado.paso === 'especies'`:

```tsx
            <button type="button" className="boton boton-primario" disabled={estado.elecciones.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'resultado' })}>Ver mi huerto</button>
```

- [ ] **Paso 4: Ejecutar los tests**

```bash
npx vitest run src/ui/SelectorEspecies.test.tsx src/ui/App.test.tsx
npm run lint
```

- [ ] **Paso 5: Commit**

```bash
git add src/ui/SelectorEspecies.tsx src/ui/App.tsx src/estilos.css src/ui/SelectorEspecies.test.tsx
git commit -m "feat: revestir el selector de especies"
```

---

## Tarea 11: PanelResultado y VistaCalendario

La tarea más grande. Es la pantalla que las maquetas detallan al máximo: tarjeta por bancal con cabecera, plano a la izquierda, leyenda editable a la derecha, y el resto en rejilla.

**Archivos:**
- Modificar: `src/ui/PanelResultado.tsx`, `src/ui/VistaCalendario.tsx`, `src/estilos.css`
- Test: `src/ui/PanelResultado.test.tsx`, `src/ui/PanelResultado.export.test.tsx` (existentes)

- [ ] **Paso 1: Añadir los estilos del bancal a dos columnas**

Añadir al bloque UTILIDADES de `src/estilos.css`:

```css
.bancal-cuerpo {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
}

.bancal-plano {
  flex: 1 1 340px;
  min-width: 300px;
  padding: var(--espacio-4);
  background: var(--superficie-tenue);
  text-align: center;
}

.bancal-leyenda {
  flex: 1 1 260px;
  padding: var(--espacio-4);
}

.leyenda-fila {
  display: flex;
  align-items: center;
  gap: var(--espacio-2);
  padding: var(--espacio-2) 0;
  border-bottom: 1px solid var(--borde-suave);
  font-size: 14px;
}

.leyenda-fila:last-child { border-bottom: 0; }

.leyenda-nombre { flex: 1 1 auto; }

.leyenda-cantidad {
  min-width: 2.5em;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
```

Y en el bloque MÓVIL, dentro de la media query que ya existe:

```css
  .bancal-plano,
  .bancal-leyenda { flex-basis: 100%; }
```

- [ ] **Paso 2: Revestir el modo de intercalado como control segmentado**

Sustituir el `<fieldset>` actual por:

```tsx
        <fieldset className="grupo-segmentado" style={{ marginBottom: 'var(--espacio-4)' }}>
          <legend>¿Intercalar especies?</legend>
          <div className="segmentado">
            {([['bloques', 'Sin intercalar'], ['companeras', 'Solo compañeras'], ['mezcla', 'Todas las compatibles']] as const).map(([valor, etiqueta]) => (
              <label key={valor} className="segmentado-opcion">
                <input type="radio" name="modo-intercalado" checked={modoIntercalado === valor} onChange={() => onModoIntercalado(valor)} /> {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
```

El `style={{ marginRight: 12 }}` de cada `<label>` desaparece: lo hace el `.segmentado`.

- [ ] **Paso 3: Revestir la tarjeta del bancal**

Sustituir el `map` de `bancales` por:

```tsx
        {bancales.map((b) => {
          const col = propuesta.colocacion.bancales.find((x) => x.bancalId === b.id)
          const asignaciones = col?.asignaciones ?? []
          const totalPlantas = asignaciones.reduce((s, a) => s + a.numPlantas, 0)
          return (
            <div key={b.id} className="tarjeta" ref={(el) => { contenedores.current[b.id] = el }}>
              <div className="tarjeta-cabecera">
                <div>
                  <h3 className="tarjeta-titulo">{b.nombre}</h3>
                  <div className="meta">{b.anchoM} × {b.largoM} m · {(b.anchoM * b.largoM).toFixed(1)} m² · {totalPlantas} plantas</div>
                </div>
                <div className="fila">
                  <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => { void exportarPng(b) }}>Descargar PNG</button>
                  <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => { void exportarPdf(b) }}>Descargar PDF</button>
                </div>
              </div>

              <div className="bancal-cuerpo">
                <div className="bancal-plano">
                  <PlanoBancal bancal={b} asignaciones={asignaciones} orientacionNorte={orientacionNorte} modoIntercalado={modoIntercalado} />
                </div>
                <div className="bancal-leyenda">
                  <ul className="lista-limpia" aria-label={`Plantas en ${b.nombre}`}>
                    {asignaciones.map((a) => {
                      const c = buscarCultivo(a.cultivoId)
                      if (!c) return null
                      return (
                        <li key={a.cultivoId} className="leyenda-fila">
                          <span aria-hidden="true">{c.icono}</span>
                          <span className="leyenda-nombre">
                            {c.nombreComun}
                            <span className="meta" style={{ display: 'block' }}>{c.distanciaPlantaCm} × {c.distanciaLineaCm} cm</span>
                          </span>
                          <button type="button" className="boton boton-contorno boton-icono" aria-label={`Quitar ${c.nombreComun} de ${b.nombre}`} disabled={a.numPlantas === 0}
                            onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas - 1)}>−</button>
                          <span className="leyenda-cantidad">{a.numPlantas}</span>
                          <button type="button" className="boton boton-contorno boton-icono" aria-label={`Añadir ${c.nombreComun} en ${b.nombre}`}
                            disabled={!cabeUnaMas(b, asignaciones, modoIntercalado, a.cultivoId)}
                            onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas + 1)}>+</button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {propuesta.recortes.filter((r) => r.bancalId === b.id).map((r) => (
                <p key={r.cultivoId} className="aviso aviso-atencion" style={{ margin: 'var(--espacio-3)' }} role="alert">
                  En {b.nombre} no caben {r.numPlantas} {nombre(r.cultivoId)} con las distancias requeridas.
                </p>
              ))}
            </div>
          )
        })}
```

**Cuidado con dos cosas:**
- El `ref` del contenedor tiene que seguir estando en el elemento que **contiene el `<svg>`**, porque `exportarPng`/`exportarPdf` hacen `contenedores.current[b.id]?.querySelector('svg')`. Aquí sigue en el `<div className="tarjeta">`, que sigue conteniéndolo.
- El texto de la leyenda se reparte ahora en dos líneas (nombre arriba, distancias abajo). Si `PanelResultado.test.tsx` consulta por un texto continuo tipo «Tomate — 50 × 60 cm», hay que actualizar la consulta.

- [ ] **Paso 4: Revestir las secciones restantes como rejilla de tarjetas**

Envolver las seis secciones finales en un único contenedor de rejilla. Cada una conserva su condicional actual y su contenido; solo cambia el envoltorio:

```tsx
      <div className="rejilla">
        <section className="tarjeta">
          <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Cuándo sembrar y cosechar</h2></div>
          <div className="tarjeta-cuerpo"><VistaCalendario cultivos={propuesta.cultivos} /></div>
        </section>

        <section className="tarjeta">
          <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Cosecha estimada</h2></div>
          <div className="tarjeta-cuerpo">
            <ul className="lista-limpia">
              {propuesta.cultivos.filter((c) => c.cosecha).map((c) => (
                <li key={c.cultivoId} className="leyenda-fila">
                  <span aria-hidden="true">{buscarCultivo(c.cultivoId)?.icono}</span>
                  <span className="leyenda-nombre">{nombre(c.cultivoId)} — ~{c.numPlantas} plantas</span>
                  <strong>{c.cosecha!.cantidadMin}–{c.cosecha!.cantidadMax} {c.cosecha!.unidad}</strong>
                </li>
              ))}
            </ul>
            <p className="meta">Estimaciones orientativas; dependen del cuidado y del año.</p>
          </div>
        </section>

        {propuesta.sinergias.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Sinergias</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.sinergias.map((s, i) => (
                  <li key={i} className="leyenda-fila">
                    <span aria-hidden="true">{s.tipo === 'favorable' ? '✅' : '⚠️'}</span>
                    <span className="leyenda-nombre">{nombre(s.a)} y {nombre(s.b)}: {s.tipo === 'favorable' ? 'se ayudan' : 'mejor separarlos'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.companerasSugeridas.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Podrías añadir</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.companerasSugeridas.map((id) => (
                  <li key={id} className="leyenda-fila">
                    <span aria-hidden="true">{buscarCultivo(id)?.icono}</span>
                    <span className="leyenda-nombre">{nombre(id)} — mejora tu huerto por sus compañeras.</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.cultivos.some((c) => c.idoneidad.consejosSuelo.length > 0) && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Consejos de suelo</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.cultivos.flatMap((c) => c.idoneidad.consejosSuelo.map((cs, i) => (
                  <li key={`${c.cultivoId}-${i}`} className="leyenda-fila">
                    <span className="leyenda-nombre">{nombre(c.cultivoId)}: {cs}</span>
                  </li>
                )))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.avisos.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Avisos</h2></div>
            <div className="tarjeta-cuerpo">
              {propuesta.avisos.map((a, i) => <p key={i} className="aviso" role="alert">{a}</p>)}
            </div>
          </section>
        )}
      </div>
```

**Dos detalles que no se pueden perder:** el `role="alert"` de cada aviso, y el `<em>` de «Estimaciones orientativas» se sustituye por `.meta` —el énfasis lo daba el estilo, no el significado—. La lista de avisos pasa de `<ul>/<li>` a `<p>` para poder usar `.aviso` como caja; si `PanelResultado.test.tsx` los consulta como elementos de lista, actualizar la consulta.

También la cabecera de la pantalla, al principio del componente:

```tsx
      <h2 className="titulo-pantalla">Tu huerto</h2>
```

- [ ] **Paso 5: Revestir `VistaCalendario`**

Envolver la `<table>` en `<div className="envoltorio-tabla">` y darle `className="tabla"`. Nada más.

- [ ] **Paso 6: Ejecutar los tests**

```bash
npx vitest run src/ui/PanelResultado.test.tsx src/ui/PanelResultado.export.test.tsx src/ui/App.test.tsx
npm run lint
```

Esperado: PASAN. `PanelResultado.export.test.tsx` es el que vigila que el `ref` sigue encontrando el `<svg>`; si falla, el `ref` se ha movido a un elemento que ya no lo contiene.

- [ ] **Paso 7: Commit**

```bash
git add src/ui/PanelResultado.tsx src/ui/VistaCalendario.tsx src/estilos.css src/ui/PanelResultado.test.tsx
git commit -m "feat: revestir la pantalla de resultado

El bancal pasa a tarjeta con cabecera, plano a la izquierda y leyenda
editable a la derecha, que se apilan en móvil. El resto de secciones van
en rejilla de tarjetas."
```

---

## Tarea 12: Pie, cierre y verificación completa

**Archivos:**
- Modificar: `src/ui/PieAtribuciones.tsx`, `src/ui/AvisoPrivacidad.tsx`, `src/estilos.css`
- Test: toda la suite

- [ ] **Paso 1: Añadir el estilo del pie**

Añadir al bloque ARMAZÓN de `src/estilos.css`:

```css
.pie {
  font-size: 12px;
  color: var(--texto-tenue);
  line-height: 1.6;
  border-top: 1px solid var(--borde);
  margin-top: var(--espacio-6);
  padding-top: var(--espacio-4);
}

.pie p { margin: var(--espacio-1) 0; }
```

- [ ] **Paso 2: Revestir el pie**

En `src/ui/PieAtribuciones.tsx`, borrar las constantes `estiloPie` y `estiloLista`, quitar el `<hr />` (ahora el borde lo pone `.pie`), poner `className="pie"` en el `<footer>`, `className="lista-limpia"` en la `<ul>` y quitar los `style` de los `<p>`. **El `<footer>` sigue fuera de `<main>`** y el comentario sobre la obligación legal de atribuir se conserva íntegro.

En `src/ui/AvisoPrivacidad.tsx`, sustituir el `style={{ fontSize: 12, color: '#555' }}` por `className="meta"`. Es el mismo tamaño y un gris que sí pasa el contraste.

- [ ] **Paso 3: Buscar restos de estilos en línea y colores literales**

```bash
grep -rn "style={{" src/ui/ --include=*.tsx | grep -v "var(--"
grep -rniE "#[0-9a-f]{3,6}" src/ui/ --include=*.tsx
```

Esperado: los únicos colores literales que quedan son los de `PlanoBancal.tsx` (constantes `COLOR_*`, con su comentario) y el azul `#1a5aa8` de las heladas en `ResumenClima.tsx`. Los únicos `style` en línea que quedan son los que calculan un valor en tiempo de ejecución: el `width` del progreso, el `maxWidth` del plano y el `maxAnchoPx` de las miniaturas. Si aparece cualquier otro, moverlo a `estilos.css`.

- [ ] **Paso 4: Build y servido**

```bash
npm run build
grep -o '<link rel="stylesheet"[^>]*>' dist/index.html
npm run preview &
sleep 3
hoja=$(grep -o 'assets/index-[^"]*\.css' dist/index.html | head -1)
curl -s -o /dev/null -w 'CSS %{http_code}\n' "http://localhost:4173/huertos/$hoja"
curl -s -o /dev/null -w 'HTML %{http_code}\n' "http://localhost:4173/huertos/"
kill %1
```

Esperado: `CSS 200` y `HTML 200`, y el `<link>` presente.

- [ ] **Paso 5: Auditoría y lint**

```bash
npm audit
npm run lint
```

Esperado: `found 0 vulnerabilities` y lint limpio.

- [ ] **Paso 6: Suite completa, en segundo plano**

```bash
./scripts/verificar-suite.sh 3
```

Tres ejecuciones a ~8,5 minutos cada una: unos 25 minutos. **Lanzarlo en segundo plano y consultar su salida en bucle**, alternando consulta y espera acotada. No terminar el turno esperando una notificación.

Esperado: «La suite es fiable: 3 de 3 ejecuciones correctas». El guion compara los archivos ejecutados con los que hay en disco; ahora hay **16** archivos de test (los 14 de antes más `tamano-icono.test.ts` y `MigaPasos.test.tsx`) y el guion los cuenta solo, no hay nada que actualizar.

- [ ] **Paso 7: Commit y despliegue**

```bash
git add src/ui/PieAtribuciones.tsx src/ui/AvisoPrivacidad.tsx src/estilos.css
git commit -m "feat: revestir el pie de atribuciones y cerrar el rediseño"
git push
```

El push despliega solo. **Avisar al usuario de que ya puede revisar https://Deliath.github.io/huertos/**, que es donde se juzga lo puramente visual: aquí no hay navegador.

- [ ] **Paso 8: Recordarle el recorrido pendiente**

Sigue abierto desde el proyecto 1 el recorrido de verificación de la §8 de la spec de publicación, y en particular el punto 2: entrar en el paso de ubicación, elegir ubicación precisa y pinchar en el mapa para ver si aparece el marcador. Nadie lo ha comprobado nunca. Ahora que el usuario va a mirar la web de todas formas, es el momento de pedírselo.

---

## Notas para quien ejecute

- **Los tests existentes son el contrato.** Este proyecto es aspecto: si un test de comportamiento falla, lo más probable es que se haya roto algo de verdad, no que el test esté anticuado. Las únicas consultas que legítimamente cambian son las que dependen de la estructura del DOM o del texto exacto que este plan cambia a propósito, y están señaladas tarea por tarea.
- **`:has()` se usa en tres sitios** (`.segmentado-opcion`, `.cultivo`). Es CSS estándar y está soportado en todos los navegadores actuales; no necesita alternativa.
- **Si el resumen de una tarea parece incompleto o su premisa falsa, parar y preguntar** en vez de improvisar. En el proyecto anterior, cinco defectos reales salieron precisamente de ahí.
