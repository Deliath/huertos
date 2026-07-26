import { useState } from 'react'
import type { Bancal, Orientacion } from '../dominio/tipos'
import { PlanoBancal } from './PlanoBancal'

interface Props {
  bancales: Bancal[]
  orientacionNorte: Orientacion
  onAñadir: (b: Bancal) => void
  onBorrar: (id: string) => void
  onOrientacion: (o: Orientacion) => void
}

const ORIENTACIONES: Orientacion[] = ['norte', 'sur', 'este', 'oeste']

// Limita el dibujo por su lado MÁS LARGO: `ladoLargoPx` es el alto/ancho máximo
// en pantalla, y el ancho del SVG se deriva manteniendo la proporción real.
const anchoPxParaLadoLargo = (anchoM: number, largoM: number, ladoLargoPx: number) =>
  (ladoLargoPx * anchoM) / Math.max(anchoM, largoM)

export function EditorBancales({ bancales, orientacionNorte, onAñadir, onBorrar, onOrientacion }: Props) {
  const [ancho, setAncho] = useState('')
  const [largo, setLargo] = useState('')

  const anchoM = Number(ancho)
  const largoM = Number(largo)
  const previewValido = anchoM > 0 && largoM > 0

  // Escala común para las miniaturas: el lado más largo de TODO el conjunto marca el
  // tamaño máximo, y todos los bancales usan los mismos px por metro → se ven a escala
  // uno respecto al otro.
  const LADO_MINIATURA_PX = 120
  const maxLadoGlobal = bancales.reduce((m, b) => Math.max(m, b.anchoM, b.largoM), 0)
  const pxPorMetro = maxLadoGlobal > 0 ? LADO_MINIATURA_PX / maxLadoGlobal : 0

  function añadir() {
    if (!(anchoM > 0) || !(largoM > 0)) return
    const siguiente = bancales.reduce((max, b) => Math.max(max, Number(b.id.replace('b', '')) || 0), 0) + 1
    onAñadir({ id: `b${siguiente}`, nombre: `Bancal ${siguiente}`, anchoM, largoM })
    setAncho(''); setLargo('')
  }

  return (
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
  )
}
