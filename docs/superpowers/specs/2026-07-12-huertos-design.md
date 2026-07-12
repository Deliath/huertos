# Diseño — Huertos: recomendador de huerto para pequeños terrenos

**Fecha:** 2026-07-12
**Estado:** Diseño aprobado (pendiente de revisión final)

## 1. Propósito

Web dirigida a personas **no profesionales** con un pequeño terreno que quieren montar un huerto con éxito. El usuario indica su **ubicación real** y las **especies que le interesan**; la web recomienda, en función de la **climatología del punto**, la **época del año** y las **características de cada cultivo**, una **disposición de plantas** (plano visual + calendario) e **instrucciones de cuidado**, además de una **estimación de cosecha**.

## 2. Alcance

- **Geográfico:** España primero, con la arquitectura preparada para ampliar a global más adelante.
- **Producto:** MVP funcional sin cuentas de usuario, **diseñado para crecer** a una versión con backend/login sin reescribir el núcleo.
- **Catálogo:** curado y cerrado en el MVP (~30-50 especies de huerto típicas), con datos de calidad y ampliable con el tiempo.

## 3. Flujo del usuario (asistente por pasos)

1. **Inicio** — explicación breve + "Crear mi huerto".
2. **Ubicación** — el usuario elige entre dos modos:
   - **Ubicación precisa:** busca su dirección o pincha su punto en un mapa (Leaflet + OpenStreetMap) → obtenemos latitud/longitud y consultamos el clima real de ese punto (Open-Meteo).
   - **Zona climática:** selecciona una de las zonas climáticas curadas (sobre un mapa estilizado de España o desde tarjetas con descripción) → usamos el perfil climático de esa zona. Alternativa respetuosa con la privacidad (no hace falta revelar la ubicación exacta).
3. **Bancales** — el usuario define uno o varios bancales (ancho × largo en metros) y la **orientación** del huerto (hacia dónde está el norte).
4. **Suelo** — el tipo de suelo entra en la recomendación:
   - Si se dio **ubicación precisa**, deducimos el tipo de suelo automáticamente por coordenadas (base de datos SoilGrids/ISRIC, gratuita y sin clave) y el usuario puede **corregirlo**.
   - Si no (modo zona climática o suelo desconocido), el usuario **elige el tipo de suelo**, con una **guía de cómo averiguarlo experimentando** (prueba del bote/sedimentación, prueba del rollito a mano, prueba de drenaje y nota sobre el pH).
5. **Especies** — elige del catálogo curado las especies que le interesan (agrupadas por tipo, con icono). Por cada especie indica si es **obligatoria u opcional** para su huerto y un **nivel de cantidad relativo** (poca / media / mucha), proporcional al bancal — sin introducir números exactos.
   - Si el usuario no sabe qué plantar, un botón **"Hazme tú una sugerencia"** propone automáticamente un conjunto de especies **muy idóneas** para su clima, época y suelo, con buena diversidad y sinergias. Base de densidad: **~6 especies distintas por m²** de bancal (parámetro configurable), escalando con la superficie total. La propuesta **rellena la selección** y el usuario puede **retocarla** libremente después.
6. **Resultado** — la web calcula y muestra:
   - Aviso de **idoneidad** por especie (apta ahora / mejor sembrar en tal mes / no recomendada en tu clima).
   - **Plano visual** de cada bancal con la colocación de las plantas y la orientación.
   - **Calendario** de siembra, trasplante y cosecha.
   - **Fichas de cuidados** por especie.
   - **Resumen de cosecha**: cantidad estimada por especie (en su unidad natural) y fecha/ventana de recogida.
   - **Avisos de sinergias**: qué especies elegidas se ayudan o se perjudican, y **1-2 sugerencias de compañeras extra** que mejorarían el huerto.
   - **Consejos de suelo**: si el suelo no es el ideal para alguna especie, cómo mejorarlo (enmiendas, drenaje, corrección de pH).
7. **Validación / ajuste** — la propuesta es editable, no definitiva. El usuario ajusta las **entradas** (añadir/quitar especies, cambiar obligatoria↔opcional, nivel de cantidad, aceptar/rechazar las compañeras sugeridas, retocar bancales) y el huerto se **recalcula** al momento (plano, cosecha, calendario y avisos se actualizan). *(La edición manual directa sobre el plano —mover/fijar plantas— queda como evolución futura, ver §12.)*
8. **Guardar / exportar** — guarda en el navegador y puede descargar el plano como imagen/PDF.

## 4. Arquitectura técnica

- **React + Vite**, aplicación de una sola página, **sin servidor** (Opción 1).
- **Clima:** dos fuentes intercambiables que entregan el mismo perfil al cerebro (temperaturas por mes, temporada libre de heladas, riesgo de heladas):
  - por **coordenadas** → API gratuita (Open-Meteo, sin clave);
  - por **zona climática** → perfil climático curado que guardamos nosotros.
- **Suelo:** dos fuentes intercambiables → por **coordenadas** (SoilGrids/ISRIC, gratuita y sin clave) o **indicado por el usuario** (con guía de experimentación).
- **Mapa:** Leaflet + OpenStreetMap (gratis, sin clave).
- **Plano:** dibujado en **SVG** a escala (nítido y fácil de exportar).
- **Almacenamiento:** navegador (localStorage) en el MVP, detrás de una interfaz intercambiable.
- **Alojamiento:** gratuito (GitHub Pages / Netlify), siempre por **HTTPS**.
- **Seguridad y privacidad por defecto** (ver §13): al no haber servidor, los datos del usuario se quedan en su navegador; a terceros solo se envía lo imprescindible.
- **Principio clave:** separación estricta entre el **cerebro** (lógica de dominio, funciones puras sin React) y la **interfaz**, para que migrar a la Opción 3 (full-stack con cuentas) sea *añadir* backend/login + un pequeño cambio de armazón, no una reescritura.

### Camino de evolución a la Opción 3 (referencia)

Se conserva intacto: catálogo, todo `dominio/*`, componentes de UI (Next.js es React), plano SVG. Trabajo nuevo (inevitable al añadir cuentas): backend, base de datos, login, y cambiar la implementación de `almacenamiento` y `clima` detrás de sus interfaces. Reconversión pequeña: armazón Vite → Next.js.

## 5. Módulos (una responsabilidad cada uno)

- `datos/cultivos` — el catálogo de especies (datos).
- `datos/zonas-climaticas` — las zonas climáticas curadas de España y su perfil climático (datos).
- `datos/suelos` — tipos de suelo, sus características y la guía de experimentación para identificarlos (datos).
- `dominio/clima` — servicio con dos implementaciones tras una misma interfaz: coordenadas (Open-Meteo) o zona climática → temporada y temperaturas.
- `dominio/suelo` — servicio con dos implementaciones tras una misma interfaz: coordenadas (SoilGrids/ISRIC) o tipo indicado por el usuario → perfil de suelo.
- `dominio/idoneidad` — decide si una especie es apta ahora / cuándo sembrarla / no apta, combinando **clima + época + suelo**; devuelve además una **puntuación de idoneidad** y genera consejos de enmienda del suelo.
- `dominio/sugerencia` — propone automáticamente un conjunto de especies muy idóneas (base ~6 especies distintas por m²), priorizando puntuación de idoneidad, diversidad y sinergias.
- `dominio/colocacion` — reparte y coloca las plantas en los bancales por prioridad (obligatorias/opcionales) y peso de cantidad, respetando sinergias, sol/orientación y marco.
- `dominio/calendario` — genera el calendario de siembra/trasplante/cosecha.
- `dominio/cosecha` — estima cantidad y fecha/ventana de recogida por especie.
- `dominio/sinergias` — evalúa combinaciones entre las especies elegidas y sugiere compañeras extra.
- `almacenamiento/almacen` — interfaz `guardar/cargar` (localStorage hoy; servidor mañana).
- `ui/` — componentes: mapa de ubicación, editor de bancales, selector de especies, plano SVG, calendario, ficha de cultivo, resumen de cosecha, pantalla de resultado.
- `app/` — estado global del huerto y orquestación del asistente por pasos, incluida la **recalculación** de la propuesta cuando el usuario ajusta las entradas en la fase de validación.

Todo `dominio/*` son funciones puras, sin React → se testean solas y se reutilizan intactas en el futuro.

## 6. Modelo de datos de cada cultivo

Cada especie del catálogo incluye:

- **Identidad:** nombre común, nombre científico, icono, familia botánica, tipo (fruto / hoja / raíz / bulbo / leguminosa…).
- **Requisitos térmicos:** temperatura mínima de germinación, temperatura óptima, tolerancia a heladas (sensible / resistente).
- **Preferencias de suelo:** textura preferida (arenoso / franco / arcilloso), rango de pH y necesidad de drenaje.
- **Método:** siembra directa o semillero + trasplante.
- **Sol:** pleno sol / semisombra.
- **Marco de plantación:** distancia entre plantas y entre líneas (define cuántas caben por bancal).
- **Porte / altura:** para el cálculo de sombras según la orientación.
- **Días hasta cosecha.**
- **Rendimiento estimado por planta** y **unidad natural** (kg, unidades/piezas, manojos…).
- **Ventana de recogida:** puntual (una recogida) o continua (produce durante semanas).
- **Sinergias:** especies compañeras (favorables) y antagonistas (a separar).
- **Cuidados:** riego (frecuencia orientativa), plagas/problemas comunes y prevención, notas.

## 7. El cerebro: cómo se genera la recomendación

**a) Idoneidad (clima + época + suelo).** Con las temperaturas del punto del usuario, para cada especie elegida se decide: *apta para sembrar ahora* / *mejor esperar a tal mes* / *no recomendada en tu clima*. La regla es térmica (sembrar cuando la temperatura media supera el umbral de la especie y dentro de la temporada libre de heladas), no una simple tabla fija de meses. El **suelo** entra como modificador: se compara el perfil del suelo (textura, pH, drenaje) con las preferencias de la especie y, si no encaja, se recomienda cómo **enmendarlo** (compost, mejorar drenaje, corregir pH) en lugar de descartarla — salvo incompatibilidades extremas (p. ej. drenaje muy deficiente para una especie que no lo tolera).

**a-bis) Sugerencia automática (opcional).** Si el usuario pulsa "Hazme tú una sugerencia", se selecciona un conjunto de especies partiendo de las de **mayor puntuación de idoneidad**, buscando **diversidad** (distintas familias/tipos) y **buenas sinergias** (evitando antagonistas). El tamaño del conjunto parte de **~6 especies distintas por m²** de bancal (parámetro configurable) y escala con la superficie total. El resultado precarga la selección de especies (por defecto opcionales, cantidad media) y sigue siendo editable por el usuario.

**b) Sinergias.** Se evalúan las combinaciones entre las especies aptas: se marcan las parejas favorables y las conflictivas, y se generan **1-2 sugerencias de compañeras extra** del catálogo que mejorarían el conjunto.

**c) Colocación priorizada en los bancales.** Con las especies aptas:
- **Prioridad y cantidad relativa:** cada especie es *obligatoria* u *opcional* y tiene un nivel de cantidad (poca / media / mucha) que actúa como **peso**. El espacio del bancal se reparte en proporción a esos pesos. Las **obligatorias reservan su parte primero** (con un mínimo garantizado); las **opcionales** se reparten el espacio restante y son las primeras en recortarse si falta sitio.
- Ese reparto proporcional se convierte en **nº de plantas** usando el **marco de plantación** (define cuántas caben) — de forma interna; el usuario no introduce números.
- **Asociación de cultivos:** se agrupan las compañeras y se separan las antagonistas (en zonas o bancales distintos).
- **Sol y orientación:** las plantas **altas** se colocan al **norte** del bancal para no dar sombra a las bajas; las de pleno sol, en las posiciones más soleadas.
- MVP: **heurística voraz** (reservar obligatorias por peso, repartir opcionales en el hueco, ordenar por altura de norte a sur, separar incompatibles) — sencilla, explicable y suficiente.
- Si una **obligatoria no cabe** en la cantidad implícita mínima, se avisa claramente y se indica cuánto espacio faltaría.

**d) Cosecha.** Por especie: `nº de plantas × rendimiento por planta` = cantidad total estimada (en unidad natural), y **fecha/ventana de cosecha** = fecha de siembra recomendada + días hasta cosecha. Siempre presentada como **rango orientativo** con aviso de que depende de las condiciones.

**e) Salida.** Una estructura con, por bancal, qué planta va en cada posición → alimenta el plano SVG; más el calendario, las fichas, el resumen de cosecha y los avisos de sinergias.

## 8. El plano visual

Un SVG por bancal, a escala, con cuadrícula, cada planta con su icono y etiqueta, leyenda de colores y una **flecha del norte / rosa de los vientos** que refleja la orientación indicada.

## 9. Calendario, cuidados y cosecha en el Resultado

- **Calendario** anual tipo línea de tiempo: por especie, meses de siembra, trasplante y cosecha estimada.
- **Fichas de cuidados** (útiles, algo detalladas): sol, riego, siembra directa/semillero, marco, plagas comunes y prevención, cuándo cosechar.
- **Resumen de cosecha** por especie en su unidad natural, con fecha/ventana. Ejemplo:
  > 🍅 Tomate — ~6 plantas → **9-15 kg** aprox., recogida de mediados de julio a septiembre.
  > 🥬 Lechuga — ~12 plantas → **12 unidades**, listas hacia finales de mayo.

## 10. Manejo de errores

- **API de clima caída o sin datos** (modo ubicación precisa) → aviso y propuesta de cambiar al **modo zona climática** para no bloquear al usuario.
- **Servicio de suelo caído o sin datos** para las coordenadas → aviso y opción de que el usuario **indique el tipo de suelo a mano** (con la guía de experimentación).
- **Ubicación fuera de España** → advertencia (el catálogo está pensado para España) pero se puede continuar.
- **Ninguna especie apta ahora** → se explica por qué y se sugiere cuándo volver.
- **Bancal demasiado pequeño** → si no caben las **obligatorias**, se avisa y se indica cuánto falta; las opcionales se recortan automáticamente antes que las obligatorias.
- **Datos inválidos** (medidas a cero, etc.) → validación en los formularios.

## 11. Pruebas

- Tests unitarios del **cerebro** (`idoneidad`, `sugerencia`, `sinergias`, `colocacion`, `calendario`, `cosecha`) con casos claros: la sugerencia respeta ~6 especies/m² y escala con la superficie, prioriza idoneidad y evita antagonistas; clima frío vs. cálido, suelo compatible vs. suelo que requiere enmienda vs. incompatibilidad extrema de drenaje, antagonistas que acaban separados, plantas altas al norte, bancal pequeño que obliga a priorizar, cálculo de cantidad y fechas de cosecha. Con Vitest.
- Al ser lógica pura, se prueba sin interfaz. El cerebro se construye con **TDD**.

## 12. Fuera del alcance del MVP (YAGNI)

Cuentas de usuario, guardado en la nube, seguimiento durante la temporada, notificaciones, comunidad, terreno de forma libre, multi-idioma, alcance global y la **edición manual directa sobre el plano** (mover/fijar plantas y re-optimizar el resto alrededor — opción C de la fase de validación). El diseño deja la puerta abierta a todo ello.

## 13. Seguridad y privacidad (por defecto)

Principio transversal: **minimizar los datos, mantenerlos locales y aplicar mínimo privilegio** en toda conexión externa. La ubicación es un dato personal (RGPD), así que se trata con cuidado desde el diseño.

**Privacidad de los datos del usuario**
- La ubicación y la configuración del huerto **no salen del navegador**: se guardan solo en local (localStorage) y el usuario puede borrarlas.
- A servicios externos se envía únicamente lo imprescindible (coordenadas al servicio de clima y al de suelo; texto de búsqueda al geocodificador). Se valora **reducir la precisión** de las coordenadas antes de enviarlas.
- El **modo "zona climática" + suelo indicado a mano** permite usar la web **sin revelar la ubicación exacta** ni contactar con servicios externos de mapa/clima/suelo: privacidad máxima por elección del usuario.
- **Sin analítica de rastreo** ni cesión de la ubicación a terceros. Aviso de privacidad claro y sencillo.

**Seguridad del cliente (secure by default)**
- **Content Security Policy (CSP) estricta**: el navegador solo puede conectar y cargar recursos de los orígenes que usamos (clima, mapa/tiles, geocodificador); todo lo demás, bloqueado → corta inyección y exfiltración de datos.
- **Renderizado seguro**: React escapa por defecto; se prohíbe `dangerouslySetInnerHTML`; el texto introducido por el usuario (p. ej. nombres de bancal) y el SVG generado se tratan de forma segura → prevención de XSS.
- **HTTPS obligatorio** en el alojamiento y en todas las llamadas externas.
- **Validación de entradas** (coordenadas y medidas dentro de rangos razonables) también como medida defensiva, no solo de usabilidad.

**Cadena de suministro / dependencias**
- Dependencias mínimas y necesarias, versiones fijadas con lockfile, `npm audit` dentro del proceso de build/CI.
- **Sin claves de API en el cliente**: se usan servicios sin clave (Open-Meteo, OpenStreetMap). Si en el futuro un servicio requiere clave, se accede a través de un backend, nunca embebida en el navegador.

**Preparación para la Opción 3 (seguro desde el diseño)**
Cuando se añadan cuentas y backend: autenticación con buenas prácticas (contraseñas con hashing fuerte u OAuth), **autorización** estricta (cada usuario solo accede a sus propios huertos), validación también en el servidor, gestión de secretos fuera del código, límites de peticiones (rate limiting) y almacenamiento de la ubicación solo mientras sea necesario. Se anota ahora para no tomar en el MVP decisiones que después resulten inseguras.
