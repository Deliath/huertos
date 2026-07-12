import { lazy, Suspense, useState } from 'react'
import type { PerfilClima, PerfilSuelo } from '../dominio/tipos'
import { ZONAS_CLIMATICAS } from '../datos/zonas-climaticas'
import { climaDeZona, climaDeCoordenadas } from '../dominio/clima'
import { sueloDeCoordenadas } from '../dominio/suelo'

const MapaSelector = lazy(() => import('./MapaSelector').then((m) => ({ default: m.MapaSelector })))

type Listo = {
  modo: 'precisa' | 'zona'; clima: PerfilClima; sueloAuto: PerfilSuelo | null
  coordenadas?: { lat: number; lon: number }; zonaId?: string
}

export function PasoUbicacion({ onListo }: { onListo: (r: Listo) => void }) {
  const [modo, setModo] = useState<'precisa' | 'zona' | null>(null)
  const [zonaId, setZonaId] = useState('mediterraneo_litoral')
  const [error, setError] = useState<string | null>(null)

  async function usarCoordenadas(lat: number, lon: number) {
    setError(null)
    try {
      const [clima, sueloAuto] = await Promise.all([climaDeCoordenadas(lat, lon), sueloDeCoordenadas(lat, lon)])
      onListo({ modo: 'precisa', clima, sueloAuto, coordenadas: { lat, lon } })
    } catch {
      setError('No hemos podido obtener el clima/suelo de ese punto. Prueba con una zona climática.')
    }
  }

  return (
    <div>
      <div role="group" aria-label="Modo de ubicación">
        <button type="button" onClick={() => setModo('precisa')}>Usar ubicación precisa</button>
        <button type="button" onClick={() => setModo('zona')}>Elegir por zona climática</button>
      </div>

      {modo === 'precisa' && (
        <Suspense fallback={<p>Cargando mapa…</p>}>
          <MapaSelector onSeleccion={usarCoordenadas} />
          <p>Pincha tu punto en el mapa.</p>
        </Suspense>
      )}

      {modo === 'zona' && (
        <div>
          <label>Zona climática
            <select aria-label="Zona climática" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
              {ZONAS_CLIMATICAS.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onListo({ modo: 'zona', clima: climaDeZona(zonaId), sueloAuto: null, zonaId })}>
            Usar esta zona
          </button>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  )
}
