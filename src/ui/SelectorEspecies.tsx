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
    <div>
      <button type="button" onClick={() => onCambio(sugerirEspecies(clima, suelo, mesActual, superficieM2))}>
        Hazme tú una sugerencia
      </button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {CULTIVOS.map((c) => {
          const eleccion = porId.get(c.id)
          return (
            <li key={c.id}>
              <label>
                <input type="checkbox" checked={!!eleccion} onChange={() => alternar(c.id)} aria-label={c.nombreComun} />
                {c.icono} {c.nombreComun}
              </label>
              {eleccion && (
                <span>
                  <select
                    aria-label={`Obligatoriedad de ${c.nombreComun}`}
                    value={eleccion.obligatoriedad}
                    onChange={(ev) => actualizar(c.id, { obligatoriedad: ev.target.value as Obligatoriedad })}
                  >
                    <option value="opcional">Opcional</option>
                    <option value="obligatoria">Obligatoria</option>
                  </select>
                  <select
                    aria-label={`Cantidad de ${c.nombreComun}`}
                    value={eleccion.cantidad}
                    onChange={(ev) => actualizar(c.id, { cantidad: ev.target.value as NivelCantidad })}
                  >
                    <option value="poca">Poca</option>
                    <option value="media">Media</option>
                    <option value="mucha">Mucha</option>
                  </select>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
