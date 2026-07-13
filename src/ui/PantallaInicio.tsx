import type { PlanHuerto } from '../almacenamiento/almacen'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Subtítulo discreto: ubicación · mes de siembra · fecha de guardado.
export function subtituloPlan(plan: PlanHuerto): string {
  const ubicacion = plan.modoUbicacion === 'precisa' && plan.coordenadas
    ? `${plan.coordenadas.lat.toFixed(2)}, ${plan.coordenadas.lon.toFixed(2)}`
    : (plan.clima.nombre || plan.zonaId || 'Zona climática')
  const fecha = new Date(plan.guardadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${ubicacion} · siembra en ${MESES[plan.mesSiembra]} · guardado el ${fecha}`
}

export function PantallaInicio({
  planes, onEmpezar, onAbrir, onBorrar,
}: {
  planes: PlanHuerto[]
  onEmpezar: () => void
  onAbrir: (id: string) => void
  onBorrar: (id: string) => void
}) {
  return (
    <div>
      <h1>🌱 Planifica tu huerto</h1>
      <p>Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>

      {planes.length > 0 && (
        <section>
          <h2>Mis planes de huerto</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {planes.map((plan) => (
              <li key={plan.id} style={{ marginBottom: 12 }}>
                <strong>{plan.nombre}</strong>
                <div style={{ fontSize: '0.85em', color: '#555' }}>{subtituloPlan(plan)}</div>
                <button type="button" onClick={() => onAbrir(plan.id)}>Abrir</button>
                <button type="button" onClick={() => { if (window.confirm(`¿Borrar "${plan.nombre}"?`)) onBorrar(plan.id) }}>Borrar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onEmpezar}>Crear mi huerto</button>
      <p style={{ marginTop: 24, fontSize: '0.85em', color: '#555' }}>
        Contenido bajo licencia{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>{' '}
        (Reconocimiento – No Comercial).
      </p>
    </div>
  )
}
