# Huertos

Planificador de huertos: dime dónde vives, qué bancales tienes y qué te gustaría
cultivar, y te propone un huerto con su plano, su calendario de siembra y sus
sinergias entre cultivos.

**Web publicada: https://Deliath.github.io/huertos/**

Funciona entero en el navegador. No hay servidor, no hay cuentas y no hay
analítica: los planes que guardes se quedan en el almacenamiento local de tu
navegador.

## Cómo ejecutarlo

Requiere Node 22.

```bash
npm install
npm run dev
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta la suite de tests. |
| `npm run lint` | Pasa oxlint. |
| `npm run build` | Compila a `dist/` y genera el aviso de licencias de terceros. |
| `npm run preview` | Sirve `dist/` tal y como se publicará, con el base path real. |
| `bash scripts/verificar-suite.sh` | Comprueba que la suite es fiable (3 ejecuciones seguidas). |

## Fuentes de datos

- Clima por coordenadas: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- Suelo por coordenadas: [SoilGrids, ISRIC](https://soilgrids.org/) (CC BY 4.0).
- Búsqueda de direcciones y mapa base: [OpenStreetMap](https://www.openstreetmap.org/copyright)
  vía Nominatim (ODbL).

## Licencias

Este repositorio tiene dos licencias distintas, según la parte:

- **El código** (todo lo que hay en `src/`, `scripts/` y la configuración) se
  publica bajo la licencia **MIT**. Ver [`LICENSE`](LICENSE).
- **El contenido** (el catálogo de cultivos, los datos curados de zonas
  climáticas y los textos de la interfaz) se publica bajo
  **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.es)**:
  se puede reutilizar citando la fuente, pero no con fines comerciales.

La web incluye código de terceros; sus avisos de licencia se generan durante el
build y se publican en
[`third-party-licenses.txt`](https://Deliath.github.io/huertos/third-party-licenses.txt).

Una nota para quien quiera reutilizar el proyecto: `react-leaflet` se distribuye
bajo la [Hippocratic License 2.1](https://firstdonoharm.dev/), que no está
aprobada por la OSI. No es copyleft y no afecta a la licencia de este código,
pero hay organizaciones que la rechazan por política. La alternativa sería usar
Leaflet directamente, que es BSD-2-Clause.
