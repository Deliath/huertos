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
      <h3>Clima detectado</h3>
      <table>
        <caption style={{ captionSide: 'bottom', textAlign: 'left' }}>
          Temperatura media y mínima por mes (°C). Es informativa: se usa para el calendario y las heladas.
        </caption>
        <thead>
          <tr>
            <td />
            {MESES.map((m, i) => (
              <th
                key={m}
                scope="col"
                data-helada={conHelada[i] ? 'true' : undefined}
                aria-current={i === mesActual ? 'date' : undefined}
                title={conHelada[i] ? 'Riesgo de helada' : undefined}
                style={{
                  fontWeight: i === mesActual ? 700 : 400,
                  color: conHelada[i] ? '#1a5aa8' : undefined,
                  whiteSpace: 'nowrap',
                }}
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
              <td key={i} style={{ fontWeight: i === mesActual ? 700 : 400 }}>{Math.round(t)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Mínima</th>
            {clima.tempMinMensual.map((t, i) => (
              <td key={i} style={{ color: conHelada[i] ? '#1a5aa8' : undefined, fontWeight: i === mesActual ? 700 : 400 }}>
                {Math.round(t)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {hayHelada
        ? <p>❄️ Meses con riesgo de helada resaltados: planta ahí solo especies resistentes o espera.</p>
        : <p>Sin meses con riesgo de helada.</p>}
    </section>
  )
}
