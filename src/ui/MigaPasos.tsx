import type { Paso } from '../app/estado'

// El asistente, en orden. 'inicio' queda fuera a propósito: es la portada, no
// un paso, y desde ella no hay miga que enseñar.
const PASOS_ASISTENTE: { paso: Paso; etiqueta: string }[] = [
  { paso: 'ubicacion', etiqueta: 'Ubicación' },
  { paso: 'bancales', etiqueta: 'Bancales' },
  { paso: 'suelo', etiqueta: 'Suelo' },
  { paso: 'especies', etiqueta: 'Especies' },
  { paso: 'resultado', etiqueta: 'Tu huerto' },
]

export function MigaPasos({ pasoActual, onIr }: { pasoActual: Paso; onIr: (paso: Paso) => void }) {
  const actual = PASOS_ASISTENTE.findIndex((p) => p.paso === pasoActual)
  if (actual < 0) return null

  const progreso = ((actual + 1) / PASOS_ASISTENTE.length) * 100

  return (
    <nav aria-label="Pasos del asistente">
      <ol className="miga">
        {PASOS_ASISTENTE.map(({ paso, etiqueta }, i) => (
          <li key={paso} className="miga-paso">
            {i < actual ? (
              <button type="button" className="miga-enlace" onClick={() => onIr(paso)}>{etiqueta}</button>
            ) : (
              <span
                className={i === actual ? 'miga-actual' : 'miga-futuro'}
                aria-current={i === actual ? 'step' : undefined}
              >
                {etiqueta}
              </span>
            )}
            {i < PASOS_ASISTENTE.length - 1 && <span className="miga-separador" aria-hidden="true">›</span>}
          </li>
        ))}
      </ol>
      <div className="progreso">
        <div className="progreso-relleno" style={{ width: `${progreso}%` }} />
      </div>
    </nav>
  )
}
