# Diseño — Publicación de Huertos en GitHub Pages

**Fecha:** 2026-07-25
**Estado:** Diseño aprobado por el usuario — listo para plan de implementación

## 1. Propósito

Poner la web de Huertos en Internet, accesible por HTTPS para cualquiera, con despliegue automático en cada cambio. Hoy el proyecto solo existe en el equipo de desarrollo: no hay `remote` de git, así que publicar resuelve además la falta de copia de seguridad fuera del equipo.

## 2. Alcance

Este documento cubre **solo la publicación**. La mejora visual es un proyecto aparte, con su propia spec y su propio plan (ver §9), y se decidió abordarla después: teniendo el despliegue automático montado, cada avance del rediseño se publica solo al hacer push y puede revisarse en un móvil real.

Sí entran aquí, aunque toquen la interfaz, las dos obligaciones legales que nacen de publicar: los avisos de licencia de terceros y la atribución de las fuentes de datos (§6.3).

Queda fuera: rediseño visual, analítica de uso, dominio propio, backend y cuentas de usuario.

## 3. Decisiones tomadas

| Decisión | Valor |
|---|---|
| Alojamiento | GitHub Pages |
| URL | `https://Deliath.github.io/huertos/` |
| Visibilidad del repo | Público (GitHub Pages con cuenta gratuita lo exige) |
| Nombre del repo | `huertos` |
| Rama publicada | `main` (se renombra `master` → `main`) |
| Licencia del código | MIT |
| Licencia del contenido | CC BY-NC 4.0 (sin cambios respecto a hoy) |
| Analítica | Ninguna |
| Dominio propio | No por ahora; se puede añadir después sin rehacer nada |

### 3.1 Requisitos previos (fuera del código)

Estos pasos los da la usuaria, no se pueden automatizar desde aquí:

1. **Cuenta de GitHub** y su nombre de usuario, que es lo que fija la URL final (`https://Deliath.github.io/huertos/`) y por tanto no puede quedar sin decidir antes de configurar `base`.
2. **Autenticación para hacer push** (clave SSH o token personal). El repo local ya tiene la identidad de git configurada.
3. **Activar Pages** en el repo, con origen «GitHub Actions».

## 4. Arquitectura del despliegue

```
push a main
   │
   ├─▶ Trabajo «verificar»  ── npm ci → npm run lint → npm test → npm run build
   │                              └─ upload-pages-artifact (dist/)
   │                              │
   │                              └─ si algo falla: no se publica nada
   │                                 (la versión anterior sigue en pie)
   │
   └─▶ Trabajo «desplegar»  ── deploy-pages
                                  │
                                  └─▶ https://Deliath.github.io/huertos/
```

### 4.1 Compilación

`vite.config.ts` añade `base: '/huertos/'`. Es lo que hace que los recursos se pidan a `/huertos/assets/…` en lugar de a la raíz del dominio, porque la web cuelga de un subdirectorio. No afecta a `npm run dev` ni a los tests: `base` solo interviene en el build.

Si en el futuro se añade un dominio propio, la web pasaría a la raíz y `base` volvería a `'/'`.

### 4.2 Workflow

Un único archivo, `.github/workflows/deploy.yml`, con dos trabajos encadenados:

- **`verificar`** — `npm ci`, `npm run lint`, `npm test`, `npm run build`. Sube `dist/` como artefacto de Pages.
- **`desplegar`** — depende de `verificar`; ejecuta `deploy-pages`.

Detalles:

- **Disparadores:** `push` a `main` y `workflow_dispatch` (para republicar a mano).
- **Permisos mínimos:** `contents: read`, `pages: write`, `id-token: write`.
- **`concurrency`** con grupo `pages` y `cancel-in-progress: false`, para que dos pushes seguidos no se pisen.
- **Node:** `actions/setup-node` con Node 22, la misma versión mayor que se usa en desarrollo (local: v22.23.1), y caché de npm.

### 4.3 Consecuencia importante

Los tests pasan a ser **la puerta del despliegue**. Un test roto deja de ser una molestia local y bloquea la publicación. Esto es deliberado: es la protección que evita publicar una web rota.

Por eso la suite tiene que ser fiable antes de montar el workflow. Hoy no lo es (§7.1) y estabilizarla es la primera tarea del plan.

## 5. Compatibilidades verificadas

Comprobado sobre el código actual, no supuesto:

- **No hay router.** El asistente cambia de paso con estado de React (`app/estado.ts`), no con URLs. No hay rutas profundas, así que no hace falta el truco de `404.html` que necesitan las SPA con router en GitHub Pages.
- **El CSS de Leaflet va empaquetado**, no de un CDN (`import 'leaflet/dist/leaflet.css'` en `src/ui/MapaSelector.tsx`). La CSP estricta declarada en `index.html` (`default-src 'self'` más las APIs de clima, suelo, geocodificación y tiles) funciona tal cual en GitHub Pages, que sirve siempre por HTTPS.
- **La búsqueda de direcciones se lanza al enviar el formulario**, no en cada pulsación (`src/ui/PasoUbicacion.tsx`, `onSubmit`). Eso cumple la política de uso de Nominatim, que prohíbe expresamente el autocompletado por tecla. Publicar no incumple sus condiciones.
- **El `<script src="/src/main.tsx">` absoluto de `index.html`** lo reescribe Vite en el build aplicando `base`; no hay que tocarlo a mano.

## 6. Licencias y atribución

Comprobado sobre las versiones instaladas en `node_modules`, no de memoria.

### 6.1 Dependencias que se distribuyen al usuario

Acaban dentro de `dist/` y por tanto se entregan a cada visitante:

| Paquete | Versión | Licencia |
|---|---|---|
| `react`, `react-dom` | 19.2.7 | MIT |
| `jspdf` | 4.2.1 | MIT |
| `leaflet` | 1.9.4 | BSD-2-Clause |
| `react-leaflet` | 5.0.0 | **Hippocratic-2.1** |

Las herramientas de desarrollo (vite, vitest, oxlint, jsdom, testing-library, tipos) son MIT y TypeScript es Apache-2.0; no se distribuyen, así que no imponen obligaciones sobre la web publicada.

**Ninguna impide licenciar el código propio como MIT.** Ninguna es copyleft.

### 6.2 El caso de react-leaflet

`react-leaflet` 5.0.0 no es MIT: usa la **Hippocratic License 2.1**, que no está aprobada por la OSI y añade condiciones que MIT no tiene (cumplimiento de principios de derechos humanos, arbitraje bajo las Reglas de La Haya, e indemnización al autor).

Consecuencias reales para este proyecto:

- **No contagia.** No es copyleft; el código propio puede seguir siendo MIT.
- **Riesgo práctico nulo** para un planificador de huertos gratuito.
- **Sí conviene dejarlo escrito**, porque muchos departamentos legales rechazan esta licencia de plano. Si algún día alguien quisiera reutilizar el proyecto en un contexto empresarial, este es el punto que lo bloquearía, y la salida sería sustituir `react-leaflet` por Leaflet directamente (que es BSD-2).

### 6.3 Obligaciones que hoy se incumplen

Dos, y las dos nacen precisamente de publicar. Se incluyen en el plan de este proyecto.

**a) Avisos de licencia de terceros.** MIT, BSD-2-Clause e Hippocratic-2.1 exigen las tres que quien recibe una copia del software reciba también el texto de la licencia y el aviso de copyright. El `dist/` incluye código de todas ellas y se entrega a cada visitante, así que la obligación aplica. Hoy no hay ningún aviso. Solución: generar un `third-party-licenses.txt` durante el build y enlazarlo desde el pie de página.

**b) Atribución de las fuentes de datos.** Hoy solo se atribuyen los tiles de OpenStreetMap (`attribution="© OpenStreetMap"` en `src/ui/MapaSelector.tsx`). Faltan tres, y las tres la exigen:

| Fuente | Licencia de los datos |
|---|---|
| Open-Meteo (clima por coordenadas) | CC BY 4.0 |
| SoilGrids / ISRIC (suelo por coordenadas) | CC BY 4.0 |
| Nominatim (búsqueda de direcciones) | ODbL (datos de OpenStreetMap) |

Solución: un pie de página con las atribuciones, junto al aviso de privacidad y la licencia del contenido que ya existen. El diseño visual definitivo de ese pie corresponde al proyecto 2; aquí se implementa con el estilo actual y allí se reviste.

### 6.4 Licencias del proyecto

- **Código:** MIT, en un archivo `LICENSE` en la raíz.
- **Contenido** (catálogo de cultivos, textos, datos curados de zonas climáticas): CC BY-NC 4.0, como hasta ahora. Se deja indicado en el `README` para que la distinción entre ambas quede clara en un repo público.

## 7. Riesgos y cómo se tratan

| Riesgo | Tratamiento |
|---|---|
| **Iconos del marcador de Leaflet.** Leaflet deduce la ruta de sus imágenes de marcador a partir del CSS, y eso se rompe con frecuencia al empaquetar con un `base` distinto de la raíz. | Verificación explícita en la web publicada: abrir el mapa y comprobar que el marcador aparece al pinchar. Si falla, configurar el icono por defecto de Leaflet importando las imágenes como módulos. |
| **Rutas rotas por el base path** que solo se ven en producción. | `npm run build && npm run preview` en local antes de subir, que sirve con el `base` real. |
| **Límites de las APIs de terceros** (Open-Meteo, SoilGrids/ISRIC, Nominatim) al haber usuarios reales. | Ninguna acción ahora: el uso es una petición por acción del usuario y sin autocompletado. Queda anotado como cosa a vigilar si la web recibe tráfico apreciable. |
| **Repo público con historial.** | Revisar antes de subir que el historial no contiene claves ni datos personales. No hay ninguna clave de API en el proyecto: las tres APIs usadas son gratuitas y sin clave. |
| **La suite de tests es inestable y hoy falla.** Ver §7.1. | Estabilizarla **antes** de convertirla en la puerta del despliegue. Es la primera tarea del plan. |

### 7.1 La suite de tests, medida

Medido en el entorno de desarrollo actual, `npm test` **termina con código 1**. El detalle importa porque de esto depende todo el despliegue:

- **Ningún test falla.** Cuando consiguen ejecutarse, los 156 pasan.
- **Lo que falla es arrancar los procesos de trabajo de Vitest:** `[vitest-pool]: Failed to start forks worker` … `Timeout waiting for worker to respond`. Afecta solo a los archivos de test de interfaz, que son los 14 que piden entorno `jsdom` con `// @vitest-environment jsdom`.
- **El número de archivos que llegan a ejecutarse varía entre ejecuciones** (29, 30, 31 de 36 en tres intentos), y los que no arrancan no se distinguen a simple vista de los que pasan: el resumen dice «passed» sobre los que sí corrieron.
- **Causa probable:** arrancar 14 entornos `jsdom` en procesos separados es muy costoso (más de 300 s acumulados de *setup*) y este entorno de desarrollo no da para tanto. Los ejecutores de GitHub Actions son más rápidos, así que puede que allí pase sin más — pero **el plan no debe apoyarse en esa suposición**.

**La cifra real de la suite son 36 archivos y 156 tests.** Las ejecuciones «verdes» anteriores se dejaban hasta 31 tests sin ejecutar sin avisar de ello.

Medidas tomadas, todas en este mismo entorno:

| Configuración | Archivos | Tests | Salida | Duración |
|---|---|---|---|---|
| Por defecto (`forks`, en paralelo) | 30 de 36 | 144 | **1** | 181 s |
| `pool: 'threads'`, en paralelo | 31 de 36 | 149 | **1** | 173 s |
| `pool: 'threads'`, sin paralelismo entre archivos | **36 de 36** | **156** | **0** | 1.049 s |

**Conclusión: la causa es la competencia por CPU al levantar muchos entornos `jsdom` a la vez, no el tipo de trabajador.** Quitar el paralelismo entre archivos lo arregla del todo, pero multiplica por seis la duración (17,5 minutos), lo que es demasiado castigo para el ciclo de desarrollo local.

Tratamiento en el plan, como primera tarea y antes de tocar el despliegue: buscar el punto medio, acotando el número de trabajadores simultáneos (`maxWorkers` bajo, p. ej. 2) en lugar de serializar del todo, y quedarse con la configuración más rápida que cumpla el criterio. `fileParallelism: false` queda como red de seguridad si no se encuentra un valor fiable.

**Criterio de aceptación: `npm test` termina en 0 y ejecuta los 36 archivos y los 156 tests, de forma repetible en tres ejecuciones seguidas.**

## 8. Verificación

**Antes de publicar** (local): `npm run lint`, `npm test`, `npm run build`, `npm run preview` y recorrido completo del asistente sobre la vista previa.

**Después de publicar** (sobre la URL real, en escritorio y en móvil):

1. La página carga y muestra la pantalla de inicio.
2. El mapa muestra los tiles de OpenStreetMap y **el marcador aparece al pinchar**.
3. La búsqueda por dirección devuelve resultados.
4. Con ubicación precisa se obtienen clima y suelo por coordenadas.
5. El resultado dibuja el plano de los bancales con sus cotas.
6. Se guarda un plan, se recarga la página y el plan sigue ahí.
7. Las descargas de PNG y de PDF funcionan.
8. No hay errores de CSP en la consola del navegador.
9. El pie muestra las atribuciones de Open-Meteo, SoilGrids/ISRIC y OpenStreetMap, y el enlace a los avisos de licencia de terceros abre un archivo que contiene los textos de MIT, BSD-2-Clause e Hippocratic-2.1.

## 9. Punto de partida del proyecto 2 (rediseño visual)

Decisiones ya validadas con maquetas, para no repetir el trabajo de exploración:

- **Dirección visual: «App limpia».** Superficies blancas sobre fondo verde muy pálido, esquinas redondeadas, sombras suaves, verde de acento. Se descartaron una dirección cálida de cuaderno de campo y otra editorial con serifa.
- **Tipografía: la pila del sistema** (`system-ui, -apple-system, 'Segoe UI', sans-serif`). Decisión explícita del usuario. Ventaja añadida: ninguna fuente que descargar y ningún cambio en la CSP.
- **Contraste.** El verde vivo `#16A34A` no alcanza el contraste mínimo para texto ni para botón relleno con texto blanco. Se reserva para elementos decorativos (fondo del logo, barra de progreso) y se usa un verde oscuro (`#166534` o similar) para texto, bordes y botones. Los valores definitivos se fijan en la spec del proyecto 2.
- **Armazón:** cabecera con logo, miga de pan del asistente con barra de progreso, y contenido en tarjetas.
- **Pantalla de resultado:** el bancal como tarjeta con cabecera (nombre, medidas, número de plantas) y botones de descarga; plano a la izquierda y leyenda editable a la derecha, apilándose en móvil; avisos de recorte como caja destacada; calendario, cosecha y sinergias como tarjetas en rejilla.
- **Plano — cambio funcional acordado:** hoy `src/ui/PlanoBancal.tsx` dibuja todos los iconos con `fontSize={16}`, es decir 16 cm en las unidades del plano, sea cual sea el cultivo. Con un bancal de 5 × 5 m y cebollas a 10 cm de separación los iconos se solapan y el bloque queda ilegible. **El icono debe escalarse a la separación del cultivo** (`min(distanciaPlantaCm, distanciaLineaCm)` por un factor, con un mínimo legible). Se descartaron dibujar los cultivos densos como puntos y añadir ampliar/desplazar al plano.

Maquetas aprobadas, en `docs/superpowers/specs/assets/`:

- `2026-07-25-direcciones-visuales.html` — las tres direcciones exploradas.
- `2026-07-25-maqueta-estilo-b-resultado.html` — resultado con un bancal de 2,40 × 1,20 m.
- `2026-07-25-maqueta-estilo-b-bancales-5x5.html` — dos bancales de 5 × 5 m, 403 plantas, con los iconos ya escalados.
