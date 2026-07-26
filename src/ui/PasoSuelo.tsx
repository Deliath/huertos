import type { PerfilSuelo } from '../dominio/tipos'
import { sueloManual } from '../dominio/suelo'
import { TIPOS_SUELO, GUIA_EXPERIMENTACION } from '../datos/suelos'
import { numero } from '../app/formato'

export function PasoSuelo({ sueloAuto, onElegir }: { sueloAuto: PerfilSuelo | null; onElegir: (s: PerfilSuelo) => void }) {
  return (
    <div className="contenido-estrecho">
      <h1 className="titulo-pantalla">¿Cómo es tu suelo?</h1>
      {sueloAuto && (
        <p className="subtitulo-pantalla">Hemos deducido de tu ubicación un suelo <strong>{sueloAuto.textura}</strong> (pH {numero(sueloAuto.ph)}). Puedes cambiarlo abajo.</p>
      )}
      <div className="tarjeta">
        <div className="tarjeta-cuerpo">
          <ul className="lista-limpia">
            {TIPOS_SUELO.map((t) => (
              <li key={t.textura} style={{ marginBottom: 'var(--espacio-2)' }}>
                <button type="button" className="boton boton-contorno boton-ancho" onClick={() => onElegir(sueloManual(t.textura))}>
                  <span className="tarjeta-titulo">{t.nombre}</span>
                  <span className="meta meta-bloque">{t.descripcion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!sueloAuto && (
        <div className="tarjeta">
          <div className="tarjeta-cuerpo">
            <h2 className="tarjeta-titulo">¿No sabes qué suelo tienes? Averígualo así</h2>
            {GUIA_EXPERIMENTACION.map((g) => (
              <details key={g.titulo} style={{ marginTop: 'var(--espacio-2)' }}>
                <summary>{g.titulo}</summary>
                <ol>{g.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
