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
    <div>
      <label>Orientación:
        <select value={orientacionNorte} onChange={(e) => onOrientacion(e.target.value as Orientacion)}>
          {ORIENTACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <div>
        <label>Ancho (m)<input type="number" min="0" step="0.1" value={ancho} onChange={(e) => setAncho(e.target.value)} /></label>
        <label>Largo (m)<input type="number" min="0" step="0.1" value={largo} onChange={(e) => setLargo(e.target.value)} /></label>
        <button type="button" onClick={añadir}>Añadir bancal</button>
      </div>

      {previewValido && (
        <div>
          <h4>Vista previa</h4>
          <PlanoBancal
            bancal={{ id: 'preview', nombre: 'nuevo bancal', anchoM, largoM }}
            asignaciones={[]}
            orientacionNorte={orientacionNorte}
            modoIntercalado="bloques"
            maxAnchoPx={anchoPxParaLadoLargo(anchoM, largoM, 260)}
          />
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {bancales.map((b) => (
          <li key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <PlanoBancal bancal={b} asignaciones={[]} orientacionNorte={orientacionNorte} modoIntercalado="bloques" maxAnchoPx={b.anchoM * pxPorMetro} />
            <span>{b.nombre}: {b.anchoM} × {b.largoM} m</span>
            <button type="button" onClick={() => onBorrar(b.id)} aria-label={`Borrar ${b.nombre}`}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
