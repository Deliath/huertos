import type { PerfilClima } from '../dominio/tipos'
import { esMesHelada } from '../dominio/clima'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function ResumenClima({ clima, mesActual }: { clima: PerfilClima; mesActual: number }) {
  // Definición unificada con dominio/clima.ts e idoneidad.ts: la helada se decide
  // por la ventana de riesgo, no por la mínima media (que puede ser > 0 y helar igual).
  const conHelada = MESES.map((_, i) => esMesHelada(clima, i))
  const hayHelada = conHelada.some(Boolean)

  return (
    <section>
      <h3 className="tarjeta-titulo">Clima detectado</h3>
      <div className="envoltorio-tabla">
        <table className="tabla">
          <caption>
            Temperatura media y mínima por mes (°C). Es informativa: se usa para el calendario y las heladas.
          </caption>
          <thead>
            <tr>
              <td />
              {MESES.map((m, i) => (
                <th
                  key={m}
                  scope="col"
                  className={i === mesActual ? 'mes-actual' : undefined}
                  data-helada={conHelada[i] ? 'true' : undefined}
                  aria-current={i === mesActual ? 'date' : undefined}
                  title={conHelada[i] ? 'Riesgo de helada' : undefined}
                  style={{ color: conHelada[i] ? '#1a5aa8' : undefined }}
                >
                  {m}{conHelada[i] ? ' ❄️' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Media</th>
              {clima.tempMediaMensual.map((t, i) => (
                <td key={i} className={i === mesActual ? 'mes-actual' : undefined}>{Math.round(t)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Mínima</th>
              {clima.tempMinMensual.map((t, i) => (
                <td
                  key={i}
                  className={i === mesActual ? 'mes-actual' : undefined}
                  style={{ color: conHelada[i] ? '#1a5aa8' : undefined }}
                >
                  {Math.round(t)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {hayHelada
        ? <p>❄️ Meses con riesgo de helada resaltados: planta ahí solo especies resistentes o espera.</p>
        : <p>Sin meses con riesgo de helada.</p>}
    </section>
  )
}
