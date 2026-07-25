import { Icon } from 'leaflet'
import urlIcono from 'leaflet/dist/images/marker-icon.png?url'
import urlIconoRetina from 'leaflet/dist/images/marker-icon-2x.png?url'
import urlSombra from 'leaflet/dist/images/marker-shadow.png?url'

/**
 * Leaflet deduce las rutas de sus imágenes de marcador a partir de la hoja de
 * estilos, y esa deducción se rompe al servir la web desde un subdirectorio
 * (`base: '/huertos/'`): el marcador desaparece al pinchar en el mapa.
 * Importarlas como módulos hace que las resuelva Vite, que sí conoce el base.
 */
export function configurarIconoPorDefecto(): void {
  Icon.Default.mergeOptions({
    iconUrl: urlIcono,
    iconRetinaUrl: urlIconoRetina,
    shadowUrl: urlSombra,
  })
}
