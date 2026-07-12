import type { PropuestaCultivo } from '../app/proponer'
import { buscarCultivo } from '../datos/cultivos'
import { nombreMes, rangoMeses } from '../app/formato'

export function VistaCalendario({ cultivos }: { cultivos: PropuestaCultivo[] }) {
  const conCalendario = cultivos.filter((c) => c.calendario)
  return (
    <table>
      <thead><tr><th>Cultivo</th><th>Siembra</th><th>Cosecha</th></tr></thead>
      <tbody>
        {conCalendario.map((c) => {
          const cal = c.calendario!
          return (
            <tr key={c.cultivoId}>
              <td>{buscarCultivo(c.cultivoId)?.nombreComun}</td>
              <td>{nombreMes(cal.mesSiembra)}</td>
              <td>{rangoMeses(cal.mesCosechaInicio, cal.mesCosechaFin)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
