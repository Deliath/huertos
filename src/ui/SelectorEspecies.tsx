import type { EleccionEspecie, PerfilClima, PerfilSuelo, NivelCantidad, Obligatoriedad } from '../dominio/tipos'
import { CULTIVOS } from '../datos/cultivos'
import { sugerirEspecies } from '../dominio/sugerencia'

interface Props {
  elecciones: EleccionEspecie[]
  onCambio: (e: EleccionEspecie[]) => void
  clima: PerfilClima
  suelo: PerfilSuelo
  mesActual: number
  superficieM2: number
}

export function SelectorEspecies({ elecciones, onCambio, clima, suelo, mesActual, superficieM2 }: Props) {
  const porId = new Map(elecciones.map((e) => [e.cultivoId, e]))

  function alternar(id: string) {
    if (porId.has(id)) onCambio(elecciones.filter((e) => e.cultivoId !== id))
    else onCambio([...elecciones, { cultivoId: id, obligatoriedad: 'opcional', cantidad: 'media' }])
  }
  function actualizar(id: string, cambio: Partial<EleccionEspecie>) {
    onCambio(elecciones.map((e) => (e.cultivoId === id ? { ...e, ...cambio } : e)))
  }

  return (
    <div className="contenido-estrecho">
      <h2 className="titulo-pantalla">¿Qué quieres cultivar?</h2>
      <p className="subtitulo-pantalla">Marca lo que te apetezca, o deja que te propongamos una selección para tu clima y tu superficie.</p>

      <button type="button" className="boton boton-contorno" style={{ marginBottom: 'var(--espacio-4)' }} onClick={() => onCambio(sugerirEspecies(clima, suelo, mesActual, superficieM2))}>
        Hazme tú una sugerencia
      </button>

      <ul className="lista-limpia rejilla rejilla-cultivos">
        {CULTIVOS.map((c) => {
          const eleccion = porId.get(c.id)
          return (
            <li key={c.id} className="cultivo">
              <label className="cultivo-nombre">
                <input type="checkbox" checked={!!eleccion} onChange={() => alternar(c.id)} aria-label={c.nombreComun} />
                <span>{c.icono} {c.nombreComun}</span>
              </label>
              {eleccion && (
                <div className="cultivo-ajustes">
                  <select
                    className="selector"
                    aria-label={`Obligatoriedad de ${c.nombreComun}`}
                    value={eleccion.obligatoriedad}
                    onChange={(ev) => actualizar(c.id, { obligatoriedad: ev.target.value as Obligatoriedad })}
                  >
                    <option value="opcional">Opcional</option>
                    <option value="obligatoria">Obligatoria</option>
                  </select>
                  <select
                    className="selector"
                    aria-label={`Cantidad de ${c.nombreComun}`}
                    value={eleccion.cantidad}
                    onChange={(ev) => actualizar(c.id, { cantidad: ev.target.value as NivelCantidad })}
                  >
                    <option value="poca">Poca</option>
                    <option value="media">Media</option>
                    <option value="mucha">Mucha</option>
                  </select>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
