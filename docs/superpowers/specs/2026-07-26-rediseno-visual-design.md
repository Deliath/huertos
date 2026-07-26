# Rediseño visual de la web de huertos

Fecha: 2026-07-26 · Proyecto 2

## 1. Propósito

La aplicación funciona pero está sin estilar: no hay ningún archivo CSS y solo
quedan 18 `style={{…}}` sueltos, casi todos para cosas puntuales como el ancho
máximo o un margen. Este proyecto le da su aspecto definitivo, siguiendo la
dirección visual «App limpia» que se validó con maquetas durante el proyecto 1.

## 2. Alcance

Entra todo el rediseño de una vez: el sistema de estilos, un armazón nuevo
(cabecera, miga de pan y barra de progreso), el revestimiento de las seis
pantallas y el escalado de los iconos del plano.

Queda fuera: modo oscuro, animaciones y transiciones, y cualquier cambio en el
cálculo del huerto. Solo hay **un** cambio de comportamiento —la miga de pan
navegable, y la retirada de los botones «Ajustar…» a los que sustituye— y **un**
cambio de dibujo —el tamaño del icono en el plano—; todo lo demás es aspecto.

## 3. Punto de partida

Ya decidido en la §9 de `2026-07-25-publicacion-github-pages-design.md`, no se
vuelve a discutir:

- Dirección visual «App limpia»: superficies blancas sobre fondo verde muy
  pálido, esquinas redondeadas, sombras suaves, verde de acento.
- Tipografía: la pila del sistema, sin ninguna fuente que descargar.
- El verde vivo `#16A34A` no alcanza el contraste mínimo y queda reservado a
  elementos decorativos.

Maquetas aprobadas en `docs/superpowers/specs/assets/`:
`2026-07-25-direcciones-visuales.html`,
`2026-07-25-maqueta-estilo-b-resultado.html`,
`2026-07-25-maqueta-estilo-b-bancales-5x5.html` y, de este proyecto,
`2026-07-26-sistema-y-armazon.html`.

## 4. Decisiones tomadas

| # | Decisión | Alternativas descartadas |
|---|---|---|
| 1 | Todo el rediseño en una sola spec | hacerlo en dos entregas; empezar solo por el sistema de estilos |
| 2 | Una hoja global `src/estilos.css` con variables CSS y clases semánticas | CSS Modules por componente; tokens en TypeScript con estilos en línea |
| 3 | Tamaño de icono `clamp(5, 0,85 × min(distancias), 26)` en cm | factor 0,55 con tope 20; compresión por raíz cuadrada |
| 4 | Miga de pan navegable, guardado donde está hoy | miga navegable con «Guardar plan» en la cabecera; armazón solo decorativo |
| 5 | `--texto-tenue` pasa de `#7A8B7F` a `#5E6E64` | conservar el valor de la maqueta |
| 6 | Cuerpo a 15px y metadatos a 12px | conservar los 13px y 11px de la maqueta |

Las decisiones 5 y 6 son desviaciones deliberadas de las maquetas aprobadas, y
están justificadas en las §5.1 y §5.2.

## 5. Sistema de estilos

Un único archivo `src/estilos.css`, importado una sola vez desde `src/main.tsx`,
ordenado en bloques: tokens → base → armazón → tarjetas → botones → formularios
→ avisos → utilidades de rejilla. Sin dependencias nuevas: Vite empaqueta el CSS
de serie y la CSP no se toca, porque la hoja se sirve desde el propio origen y
`style-src` ya admite `'self'`.

### Tokens

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--fondo` | `#F1F5F0` | fondo de página | — |
| `--superficie` | `#FFFFFF` | tarjetas | — |
| `--superficie-tenue` | `#FAFCFA` | zona del plano | — |
| `--texto` | `#16241C` | texto principal | 16,1:1 |
| `--texto-medio` | `#4B5D51` | texto secundario | 7,0:1 |
| `--texto-tenue` | `#5E6E64` | metadatos | 5,4:1 |
| `--borde` | `#DCE5DD` | borde de tarjeta | — |
| `--borde-suave` | `#EDF2EE` | separadores internos | — |
| `--borde-verde` | `#C6DFCB` | borde de botón de contorno | — |
| `--verde` | `#166534` | texto, bordes y botones | 7,1:1 |
| `--verde-vivo` | `#16A34A` | **solo decorativo** | 3,3:1 |
| `--pista` | `#E3EBE4` | fondo de progreso y de control segmentado | — |

Los contrastes son frente a blanco. `--texto-tenue` también se usa sobre
`--fondo`, donde da 4,9:1, por encima del mínimo.

Espaciado en escala de 4: `--espacio-1: 4px`, `-2: 8px`, `-3: 12px`, `-4: 16px`,
`-5: 24px`, `-6: 32px`. Radios `--radio-s: 8px`, `--radio-m: 10px`,
`--radio-l: 14px`. Sombra `--sombra: 0 1px 2px rgba(16,40,24,.06)`.

### 5.1 Corrección de contraste

Las maquetas usan `#7A8B7F` para todos los metadatos. Ese color da **3,6:1**
sobre blanco y no llega al 4,5:1 que exige WCAG AA para texto. Es el mismo
problema que ya se detectó con el verde vivo, pero en el otro color de la
paleta, y pasó desapercibido porque los metadatos parecían secundarios.

Se sustituye por `#5E6E64` (5,4:1 sobre blanco, 4,9:1 sobre el fondo). La
diferencia a ojo es mínima; se comprobó con las dos versiones enfrentadas en
`2026-07-26-sistema-y-armazon.html`.

### 5.2 Tamaños de letra

Las maquetas usan 13px de cuerpo y 11px de metadatos. Se sube a **15px de
cuerpo, 13px de secundario y 12px de mínimo absoluto**: las maquetas se miran de
cerca dentro de un marco pequeño, y a 13px la aplicación real se lee mal en
móvil. Los títulos de pantalla van a 22px y los de tarjeta a 15px con peso 650.

### 5.3 Anchos

El contenedor pasa de 760px a **960px**, que es lo que necesita la pantalla de
resultado a dos columnas. Las tarjetas del asistente se quedan en 720px para no
estirar las líneas de texto.

**Móvil:** una sola media query, en 720px. Por debajo, la tarjeta del bancal
apila el plano sobre la leyenda y las rejillas pasan a una columna.

### 5.4 Foco

Hoy no hay ningún estilo de foco. Se añade `outline: 2px solid var(--verde)` con
`outline-offset: 2px` sobre `:focus-visible`, para todo lo enfocable.

## 6. Armazón

Dos componentes nuevos, para no engordar `App.tsx`:

- **`src/ui/Cabecera.tsx`** — logo en cuadrado verde vivo y el nombre «Huertos».
- **`src/ui/MigaPasos.tsx`** — miga de pan y barra de progreso.

La miga es **navegable hacia atrás**: los pasos ya completados son botones que
llevan a ese paso; el actual va en verde y en negrita; los futuros salen
apagados y no son pulsables ni enfocables. La barra de progreso se rellena en
proporción al paso actual.

Consecuencia: **desaparecen del resultado los botones «Ajustar especies» y
«Ajustar bancales»**, porque la miga ya cumple esa función y tener dos maneras de
volver atrás sobra.

El guardado del plan **se queda donde está hoy**, como tarjeta al pie del
resultado con su campo de nombre y su «Guardado ✓». La cabecera no lleva botón,
a diferencia de lo que dibuja la maqueta de resultado.

## 7. El plano del bancal

### 7.1 Tamaño del icono

Hoy `PlanoBancal.tsx` dibuja todos los iconos con `fontSize={16}`, es decir 16 cm
en las unidades del plano, sea cual sea el cultivo. Con un bancal de 5 × 5 m y
cebollas a 10 cm de separación los iconos se solapan y el bloque queda ilegible.

Módulo nuevo `src/ui/tamano-icono.ts` con una función pura:

```ts
export const TAMAÑO_ICONO_MIN_CM = 5
export const TAMAÑO_ICONO_MAX_CM = 26
export const FACTOR_ICONO = 0.85

export function tamañoIcono(distanciaPlantaCm: number, distanciaLineaCm: number): number
```

Devuelve `clamp(5, 0,85 × min(distanciaPlantaCm, distanciaLineaCm), 26)`. Los
valores salen de medir la maqueta `2026-07-25-maqueta-estilo-b-bancales-5x5.html`,
que se hizo expresamente para validar este cambio.

`PlanoBancal` la aplica planta a planta. Como `PlantaPosicionada` ya lleva
`cultivoId`, las distancias se obtienen con `buscarCultivo`; se cachean en un
`Map` por `cultivoId` para no repetir la búsqueda una vez por planta, que en el
caso de 403 plantas se nota.

### 7.2 Restricción de la exportación

`exportar.ts` clona el nodo SVG y lo serializa aislado con `XMLSerializer`. Un
SVG estilado con clases de la hoja global saldría **sin colores** en el PNG y en
el PDF, porque el clon no arrastra la hoja de estilos.

Por eso el SVG se sigue estilando con **atributos de presentación en línea**,
nunca con clases. Sus colores —fondo `#F6F4EC`, marco `#C9CDBF`, cotas
`#9AA694` con etiqueta `#5E6B5A`— van como constantes del módulo, no como
variables CSS. Es la única parte de la aplicación que no usa los tokens.

## 8. Pantallas

| Componente | Qué cambia |
|---|---|
| `Cabecera`, `MigaPasos` | nuevos; armazón y navegación hacia atrás |
| `PantallaInicio` | portada con botón primario; planes guardados como tarjetas con fecha y acciones |
| `PasoUbicacion`, `MapaSelector`, `ResumenClima` | tarjeta; mapa con radio y borde; clima como fila de métricas |
| `EditorBancales` | alta en tarjeta; bancales como filas con sus medidas; orientación como control segmentado |
| `PasoSuelo`, `EditorSuelo` | textura como control segmentado |
| `SelectorEspecies` | rejilla de tarjetas de cultivo con icono, nombre e idoneidad |
| `PanelResultado` | la más grande: cabecera de resultado, intercalado segmentado, una tarjeta por bancal con cabecera (nombre, medidas, número de plantas) y botones de descarga, cuerpo a dos columnas con el plano a la izquierda y la leyenda editable a la derecha, recortes como caja destacada, y calendario, cosecha, sinergias, consejos y avisos como tarjetas en rejilla |
| `VistaCalendario` | barras de siembra y cosecha por mes |
| `PieAtribuciones`, `AvisoPrivacidad` | pie discreto |

Los controles que parecen segmentados siguen siendo `<input type="radio">`
reales dentro de su `<fieldset>` con su `<legend>`: cambia el aspecto, no la
semántica.

## 9. Verificación

No hay navegador en el entorno de desarrollo, así que la verificación se reparte
en cuatro sitios.

1. **`src/ui/tamano-icono.test.ts`** — función pura. Casos: cebolla 10 × 25 → 8,5;
   zanahoria 15 × 20 → 12,75; lechuga 25 × 30 → 21,25; berenjena 30 × 70 → 25,5;
   tomate 50 × 60 → 26 (tope); calabaza 100 × 100 → 26 (tope); y un cultivo de
   4 cm → 5 (suelo). Se toma el mínimo de las dos distancias, no la primera.
2. **`src/ui/MigaPasos.test.tsx`** — es el único comportamiento nuevo. Que un
   paso completado navegue a ese paso, y que uno futuro no sea pulsable ni
   enfocable.
3. **Los 14 archivos de test existentes tienen que seguir pasando.** Consultan
   por rol y etiqueta, pero el armazón añade encabezados y landmarks nuevos, así
   que alguna consulta `getByRole('heading')` se volverá ambigua. Cada tarea
   arregla lo que rompa **sin relajar la aserción**: si para que pase hay que
   debilitar un test, se para y se pregunta.
4. **Build y servido** — `npm run build` tiene que emitir el archivo CSS y
   `dist/index.html` enlazarlo. Se comprueba con `curl` contra `npm run preview`
   que la hoja devuelve 200 y que el `<link>` aparece en el HTML.

**No se afirma sobre color en jsdom.** Vitest no carga la hoja de estilos, así
que un test que comprobara un color estaría comprobando el estilo en línea o
nada. Lo puramente visual lo revisa el usuario sobre la web publicada, que se
despliega sola en cada push.

Toda ejecución de la suite va con `scripts/verificar-suite.sh` —nunca `npm test`
pelado, que no delata los archivos sin ejecutar— y en segundo plano, porque aquí
tarda unos 8,5 minutos y la herramienta corta a los 10.

Cada test nuevo se demuestra rompiendo a propósito lo que vigila y viéndolo
fallar, antes de darlo por bueno.

## 10. Pendiente heredado

`postcss` arrastra una vulnerabilidad alta (path traversal al cargar mapas de
código). Se dejó sin arreglar al cerrar el proyecto 1 con el argumento de que el
proyecto no tenía ningún archivo CSS.

**Ese argumento era falso:** `MapaSelector.tsx` importa `leaflet/dist/leaflet.css`
desde antes, y el build ya emitía un `dist/assets/MapaSelector-*.css`. Es decir,
postcss ya estaba procesando CSS de terceros, que es justo el caso que describe
el aviso. Sigue sin ser explotable —el CSS es el de una dependencia fijada, no
uno que traiga el usuario—, pero la razón para aplazarlo no se sostenía.

Ahora ya hay arreglo disponible: se ejecuta `npm audit fix` **en la primera
tarea, antes de crear `src/estilos.css`**, y se comprueba que `npm audit` baja a
cero.

## 11. Riesgos

| Riesgo | Cómo se trata |
|---|---|
| El armazón rompe consultas de los tests existentes | cada tarea las arregla sin debilitarlas; si hiciera falta debilitar una, se para y se pregunta |
| El SVG pierde color al exportar | §7.2: atributos en línea, nunca clases. La suite ya tiene `PanelResultado.export.test.tsx` |
| Los valores de icono no se ven bien en la app real | los tests fijan la fórmula, pero el juicio visual es del usuario sobre la web publicada |
| El CSS crece sin orden | un solo archivo con bloques fijos y todos los valores en tokens; ningún color literal fuera de `:root`, salvo el SVG del plano |
