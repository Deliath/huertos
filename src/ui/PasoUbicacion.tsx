import { lazy, Suspense, useState } from 'react'
import type { PerfilClima, PerfilSuelo } from '../dominio/tipos'
import { ZONAS_CLIMATICAS } from '../datos/zonas-climaticas'
import { climaDeZona, climaDeCoordenadas } from '../dominio/clima'
import { sueloDeCoordenadas } from '../dominio/suelo'
import { buscarDireccion, type ResultadoGeocodificacion } from '../servicios/geocodificador'
import { ResumenClima } from './ResumenClima'
import { EditorSuelo } from './EditorSuelo'

const MapaSelector = lazy(() => import('./MapaSelector').then((m) => ({ default: m.MapaSelector })))

type Listo = {
  modo: 'precisa' | 'zona'; clima: PerfilClima; sueloAuto: PerfilSuelo | null
  coordenadas?: { lat: number; lon: number }; zonaId?: string
}

// Ubicación elegida a la espera de que el usuario confirme (y ajuste el suelo).
type Confirmando = { modo: 'precisa' | 'zona'; clima: PerfilClima; sueloAuto: PerfilSuelo | null; coordenadas?: { lat: number; lon: number }; zonaId?: string }

export function PasoUbicacion({ onListo, mesActual = new Date().getMonth() }: { onListo: (r: Listo) => void; mesActual?: number }) {
  const [modo, setModo] = useState<'precisa' | 'zona' | null>(null)
  const [zonaId, setZonaId] = useState('mediterraneo_litoral')
  const [error, setError] = useState<string | null>(null)
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<ResultadoGeocodificacion[]>([])
  const [confirmando, setConfirmando] = useState<Confirmando | null>(null)
  const [sueloElegido, setSueloElegido] = useState<PerfilSuelo | null>(null)

  async function buscar() {
    if (!consulta.trim()) return // no lanzar una búsqueda vacía a Nominatim
    setError(null)
    try {
      setResultados(await buscarDireccion(consulta))
    } catch {
      setError('No hemos podido buscar esa dirección; prueba de nuevo o pincha en el mapa.')
    }
  }

  async function usarCoordenadas(lat: number, lon: number) {
    setError(null)
    try {
      // El clima es imprescindible; el suelo es opcional: si esa zona no tiene dato
      // (típico en suelo urbano), seguimos con sueloAuto=null y se elige a mano.
      const clima = await climaDeCoordenadas(lat, lon)
      const sueloAuto = await sueloDeCoordenadas(lat, lon).catch(() => null)
      setSueloElegido(sueloAuto)
      setConfirmando({ modo: 'precisa', clima, sueloAuto, coordenadas: { lat, lon } })
    } catch {
      setError('No hemos podido obtener el clima de ese punto. Prueba con una zona climática.')
    }
  }

  function usarZona() {
    setError(null)
    setSueloElegido(null)
    setConfirmando({ modo: 'zona', clima: climaDeZona(zonaId), sueloAuto: null, zonaId })
  }

  function continuar() {
    if (!confirmando) return
    onListo({
      modo: confirmando.modo, clima: confirmando.clima, sueloAuto: sueloElegido,
      coordenadas: confirmando.coordenadas, zonaId: confirmando.zonaId,
    })
  }

  if (confirmando) {
    return (
      <div className="contenido-estrecho">
        <h1 className="titulo-pantalla">Confirma tu ubicación</h1>
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
    )
  }

  return (
    <div className="contenido-estrecho">
      <h1 className="titulo-pantalla">¿Dónde está tu huerto?</h1>
      <p className="subtitulo-pantalla">Con la ubicación deducimos tu clima y una estimación del suelo.</p>
      <div className="tarjeta">
        <div className="tarjeta-cuerpo">
          <div className="fila" role="group" aria-label="Modo de ubicación">
            <button type="button" className="boton boton-contorno" onClick={() => setModo('precisa')}>Usar ubicación precisa</button>
            <button type="button" className="boton boton-contorno" onClick={() => setModo('zona')}>Elegir por zona climática</button>
          </div>

          {modo === 'precisa' && (
            <div>
              <form className="fila" onSubmit={(e) => { e.preventDefault(); void buscar() }}>
                <label className="campo">Buscar dirección
                  <input className="entrada" aria-label="Buscar dirección" value={consulta} onChange={(e) => setConsulta(e.target.value)} />
                </label>
                <button type="submit" className="boton boton-contorno">Buscar</button>
              </form>
              {resultados.length > 0 && (
                <ul className="lista-limpia">
                  {resultados.map((r, i) => (
                    <li key={`${r.lat}-${r.lon}-${i}`}>
                      <button type="button" className="boton boton-plano" onClick={() => usarCoordenadas(r.lat, r.lon)}>{r.nombre}</button>
                    </li>
                  ))}
                </ul>
              )}
              <Suspense fallback={<p className="meta">Cargando mapa…</p>}>
                <div className="mapa">
                  <MapaSelector onSeleccion={usarCoordenadas} />
                </div>
                <p className="meta">Pincha tu punto en el mapa.</p>
              </Suspense>
            </div>
          )}

          {modo === 'zona' && (
            <div>
              <label className="campo">Zona climática
                <select className="selector" aria-label="Zona climática" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
                  {ZONAS_CLIMATICAS.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                </select>
              </label>
              <button type="button" className="boton boton-primario" onClick={usarZona}>Usar esta zona</button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="aviso aviso-atencion" role="alert">{error}</p>}
    </div>
  )
}
