import type { PerfilSuelo } from '../dominio/tipos'
import { sueloManual } from '../dominio/suelo'
import { TIPOS_SUELO, GUIA_EXPERIMENTACION } from '../datos/suelos'

export function PasoSuelo({ sueloAuto, onElegir }: { sueloAuto: PerfilSuelo | null; onElegir: (s: PerfilSuelo) => void }) {
  return (
    <div>
      {sueloAuto && (
        <p>Hemos deducido de tu ubicación un suelo <strong>{sueloAuto.textura}</strong> (pH {sueloAuto.ph}). Puedes cambiarlo abajo.</p>
      )}
      <div>
        {TIPOS_SUELO.map((t) => (
          <button key={t.textura} type="button" onClick={() => onElegir(sueloManual(t.textura))}>
            {t.nombre} — {t.descripcion}
          </button>
        ))}
      </div>
      {!sueloAuto && (
        <section>
          <h3>¿No sabes qué suelo tienes? Averígualo así</h3>
          {GUIA_EXPERIMENTACION.map((g) => (
            <details key={g.titulo}>
              <summary>{g.titulo}</summary>
              <ol>{g.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
