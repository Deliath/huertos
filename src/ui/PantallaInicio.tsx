import type { PlanHuerto } from '../almacenamiento/almacen'
import { subtituloPlan } from './plan-resumen'

export function PantallaInicio({
  planes, onEmpezar, onAbrir, onBorrar,
}: {
  planes: PlanHuerto[]
  onEmpezar: () => void
  onAbrir: (id: string) => void
  onBorrar: (id: string) => void
}) {
  return (
    <div className="contenido-estrecho">
      <h1 className="titulo-pantalla">🌱 Planifica tu huerto</h1>
      <p className="subtitulo-pantalla">Dinos dónde estás y qué te gustaría cultivar, y te propondremos qué plantar, dónde y cuándo, con una estimación de tu cosecha.</p>

      <button type="button" className="boton boton-primario" onClick={onEmpezar}>Crear mi huerto</button>

      {planes.length > 0 && (
        <section style={{ marginTop: 'var(--espacio-5)' }}>
          <h2 className="tarjeta-titulo" style={{ marginBottom: 'var(--espacio-3)' }}>Mis planes de huerto</h2>
          <ul className="lista-limpia">
            {planes.map((plan) => (
              <li key={plan.id} className="tarjeta">
                <div className="tarjeta-cabecera">
                  <div>
                    <div className="tarjeta-titulo">{plan.nombre}</div>
                    <div className="meta">{subtituloPlan(plan)}</div>
                  </div>
                  <div className="fila">
                    <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => onAbrir(plan.id)}>Abrir</button>
                    <button type="button" className="boton boton-plano boton-pequeno" onClick={() => { if (window.confirm(`¿Borrar "${plan.nombre}"?`)) onBorrar(plan.id) }}>Borrar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="meta" style={{ marginTop: 'var(--espacio-5)' }}>
        Contenido bajo licencia{' '}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC 4.0
        </a>{' '}
        (Reconocimiento – No Comercial).
      </p>
    </div>
  )
}
