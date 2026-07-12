import { useState } from 'react'
import type { Bancal, Orientacion } from '../dominio/tipos'

interface Props {
  bancales: Bancal[]
  orientacionNorte: Orientacion
  onAñadir: (b: Bancal) => void
  onBorrar: (id: string) => void
  onOrientacion: (o: Orientacion) => void
}

const ORIENTACIONES: Orientacion[] = ['norte', 'sur', 'este', 'oeste']

export function EditorBancales({ bancales, orientacionNorte, onAñadir, onBorrar, onOrientacion }: Props) {
  const [ancho, setAncho] = useState('')
  const [largo, setLargo] = useState('')

  function añadir() {
    const anchoM = Number(ancho)
    const largoM = Number(largo)
    if (!(anchoM > 0) || !(largoM > 0)) return
    const siguiente = bancales.reduce((max, b) => Math.max(max, Number(b.id.replace('b', '')) || 0), 0) + 1
    onAñadir({ id: `b${siguiente}`, nombre: `Bancal ${siguiente}`, anchoM, largoM })
    setAncho(''); setLargo('')
  }

  return (
    <div>
      <label>El norte queda hacia el:
        <select value={orientacionNorte} onChange={(e) => onOrientacion(e.target.value as Orientacion)}>
          {ORIENTACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <div>
        <label>Ancho (m)<input type="number" min="0" step="0.1" value={ancho} onChange={(e) => setAncho(e.target.value)} /></label>
        <label>Largo (m)<input type="number" min="0" step="0.1" value={largo} onChange={(e) => setLargo(e.target.value)} /></label>
        <button type="button" onClick={añadir}>Añadir bancal</button>
      </div>
      <ul>
        {bancales.map((b) => (
          <li key={b.id}>{b.nombre}: {b.anchoM} × {b.largoM} m
            <button type="button" onClick={() => onBorrar(b.id)} aria-label={`Borrar ${b.nombre}`}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
