import { AvisoPrivacidad } from './AvisoPrivacidad'

// Open-Meteo y SoilGrids publican sus datos bajo CC BY 4.0, y Nominatim y los
// tiles del mapa bajo ODbL. Las tres licencias exigen atribución visible, así
// que este pie no es decorativo: es una obligación de publicar la web.

export function PieAtribuciones() {
  const urlLicencias = `${import.meta.env.BASE_URL}third-party-licenses.txt`

  return (
    <footer className="pie">
      <AvisoPrivacidad />
      <p>Datos de:</p>
      <ul className="lista-limpia">
        <li>
          Clima: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0)
        </li>
        <li>
          Suelo: <a href="https://soilgrids.org/" target="_blank" rel="noreferrer">SoilGrids — ISRIC</a> (CC BY 4.0)
        </li>
        <li>
          Mapa y direcciones: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> (ODbL)
        </li>
      </ul>
      <p>
        Código bajo licencia MIT. Contenido bajo{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.es" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>.{' '}
        <a href={urlLicencias} target="_blank" rel="noreferrer">Licencias de terceros</a>.
      </p>
    </footer>
  )
}
