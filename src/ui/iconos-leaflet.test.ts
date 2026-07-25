// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { Icon } from 'leaflet'
import { configurarIconoPorDefecto } from './iconos-leaflet'

test('el marcador por defecto apunta a las imágenes empaquetadas', () => {
  configurarIconoPorDefecto()
  const opciones = Icon.Default.prototype.options

  // Vite incrusta como `data:` los recursos de menos de 4 KB, y las tres
  // imágenes de marcador lo son (4.548 bytes entre las tres). En el build la
  // URL es un `data:` URI; en el entorno de test, la ruta del archivo. Las dos
  // formas sirven —y la `data:` es de hecho inmune al base path—, así que el
  // test acepta ambas en lugar de afirmar algo que solo es cierto en uno.
  expect(opciones.iconUrl).toMatch(/marker-icon\.png|^data:image\//)
  expect(opciones.iconRetinaUrl).toMatch(/marker-icon-2x\.png|^data:image\//)
  expect(opciones.shadowUrl).toMatch(/marker-shadow\.png|^data:image\//)

  // Con URLs `data:` los nombres de archivo desaparecen, así que esto es lo
  // que impide que un copiar-pegar asigne la misma imagen a las tres.
  const urls = [opciones.iconUrl, opciones.iconRetinaUrl, opciones.shadowUrl]
  expect(new Set(urls).size).toBe(3)
})
