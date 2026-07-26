import { useRef } from 'react'
import type { Propuesta } from '../app/proponer'
import type { Bancal, Orientacion } from '../dominio/tipos'
import { buscarCultivo } from '../datos/cultivos'
import { cabeUnaMas, type ModoIntercalado } from '../dominio/distribucion'
import { numero } from '../app/formato'
import { PlanoBancal } from './PlanoBancal'
import { VistaCalendario } from './VistaCalendario'

export function PanelResultado({ propuesta, bancales, orientacionNorte, modoIntercalado, onModoIntercalado, onAjustarCantidad }: {
  propuesta: Propuesta
  bancales: Bancal[]
  orientacionNorte: Orientacion
  modoIntercalado: ModoIntercalado
  onModoIntercalado: (modo: ModoIntercalado) => void
  onAjustarCantidad: (bancalId: string, cultivoId: string, numPlantas: number) => void
}) {
  const nombre = (id: string) => buscarCultivo(id)?.nombreComun ?? id
  const contenedores = useRef<Record<string, HTMLDivElement | null>>({})

  // `exportar` arrastra jsPDF (~400 kB); se carga de forma perezosa solo al exportar,
  // igual que el mapa de Leaflet, para no engordar la carga inicial.
  const exportarPng = async (b: Bancal) => {
    const svg = contenedores.current[b.id]?.querySelector('svg')
    if (!svg) return
    const { descargarPng } = await import('./exportar')
    void descargarPng(svg, `huerto-${b.nombre}.png`)
  }

  const exportarPdf = async (b: Bancal) => {
    const svg = contenedores.current[b.id]?.querySelector('svg')
    if (!svg) return
    const { descargarPdf } = await import('./exportar')
    void descargarPdf(svg, `huerto-${b.nombre}.pdf`)
  }

  return (
    <div>
      <section>
        <h2 className="titulo-pantalla">Tu huerto</h2>
        <fieldset className="grupo-segmentado" style={{ marginBottom: 'var(--espacio-4)' }}>
          <legend>¿Intercalar especies?</legend>
          <div className="segmentado">
            {([['bloques', 'Sin intercalar'], ['companeras', 'Solo compañeras'], ['mezcla', 'Todas las compatibles']] as const).map(([valor, etiqueta]) => (
              <label key={valor} className="segmentado-opcion">
                <input type="radio" name="modo-intercalado" checked={modoIntercalado === valor} onChange={() => onModoIntercalado(valor)} /> {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
        {bancales.map((b) => {
          const col = propuesta.colocacion.bancales.find((x) => x.bancalId === b.id)
          const asignaciones = col?.asignaciones ?? []
          const totalPlantas = asignaciones.reduce((s, a) => s + a.numPlantas, 0)
          return (
            <div key={b.id} className="tarjeta" ref={(el) => { contenedores.current[b.id] = el }}>
              <div className="tarjeta-cabecera">
                <div>
                  <h3 className="tarjeta-titulo">{b.nombre}</h3>
                  <div className="meta">{numero(b.anchoM)} × {numero(b.largoM)} m · {numero(b.anchoM * b.largoM, 2)} m² · {totalPlantas} plantas</div>
                </div>
                <div className="fila">
                  <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => { void exportarPng(b) }}>Descargar PNG</button>
                  <button type="button" className="boton boton-contorno boton-pequeno" onClick={() => { void exportarPdf(b) }}>Descargar PDF</button>
                </div>
              </div>

              <div className="bancal-cuerpo">
                <div className="bancal-plano">
                  <PlanoBancal bancal={b} asignaciones={asignaciones} orientacionNorte={orientacionNorte} modoIntercalado={modoIntercalado} />
                </div>
                <div className="bancal-leyenda">
                  <ul className="lista-limpia" aria-label={`Plantas en ${b.nombre}`}>
                    {asignaciones.map((a) => {
                      const c = buscarCultivo(a.cultivoId)
                      if (!c) return null
                      return (
                        <li key={a.cultivoId} className="leyenda-fila">
                          <span aria-hidden="true">{c.icono}</span>
                          <span className="leyenda-nombre">
                            {c.nombreComun}
                            <span className="meta" style={{ display: 'block' }}>{c.distanciaPlantaCm} × {c.distanciaLineaCm} cm</span>
                          </span>
                          <button type="button" className="boton boton-contorno boton-icono" aria-label={`Quitar ${c.nombreComun} de ${b.nombre}`} disabled={a.numPlantas === 0}
                            onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas - 1)}>−</button>
                          <span className="leyenda-cantidad">{a.numPlantas}</span>
                          <button type="button" className="boton boton-contorno boton-icono" aria-label={`Añadir ${c.nombreComun} en ${b.nombre}`}
                            disabled={!cabeUnaMas(b, asignaciones, modoIntercalado, a.cultivoId)}
                            onClick={() => onAjustarCantidad(b.id, a.cultivoId, a.numPlantas + 1)}>+</button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {propuesta.recortes.filter((r) => r.bancalId === b.id).map((r) => (
                <p key={r.cultivoId} className="aviso aviso-atencion" style={{ margin: 'var(--espacio-3)' }} role="alert">
                  En {b.nombre} no caben {r.numPlantas} {nombre(r.cultivoId)} con las distancias requeridas.
                </p>
              ))}
            </div>
          )
        })}
      </section>

      <div className="rejilla">
        <section className="tarjeta">
          <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Cuándo sembrar y cosechar</h2></div>
          <div className="tarjeta-cuerpo"><VistaCalendario cultivos={propuesta.cultivos} /></div>
        </section>

        <section className="tarjeta">
          <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Cosecha estimada</h2></div>
          <div className="tarjeta-cuerpo">
            <ul className="lista-limpia">
              {propuesta.cultivos.filter((c) => c.cosecha).map((c) => (
                <li key={c.cultivoId} className="leyenda-fila">
                  <span aria-hidden="true">{buscarCultivo(c.cultivoId)?.icono}</span>
                  <span className="leyenda-nombre">{nombre(c.cultivoId)} — ~{c.numPlantas} plantas</span>
                  <strong>{numero(c.cosecha!.cantidadMin)}–{numero(c.cosecha!.cantidadMax)} {c.cosecha!.unidad}</strong>
                </li>
              ))}
            </ul>
            <p className="meta">Estimaciones orientativas; dependen del cuidado y del año.</p>
          </div>
        </section>

        {propuesta.sinergias.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Sinergias</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.sinergias.map((s, i) => (
                  <li key={i} className="leyenda-fila">
                    <span aria-hidden="true">{s.tipo === 'favorable' ? '✅' : '⚠️'}</span>
                    <span className="leyenda-nombre">{nombre(s.a)} y {nombre(s.b)}: {s.tipo === 'favorable' ? 'se ayudan' : 'mejor separarlos'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.companerasSugeridas.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Podrías añadir</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.companerasSugeridas.map((id) => (
                  <li key={id} className="leyenda-fila">
                    <span aria-hidden="true">{buscarCultivo(id)?.icono}</span>
                    <span className="leyenda-nombre">{nombre(id)} — mejora tu huerto por sus compañeras.</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.cultivos.some((c) => c.idoneidad.consejosSuelo.length > 0) && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Consejos de suelo</h2></div>
            <div className="tarjeta-cuerpo">
              <ul className="lista-limpia">
                {propuesta.cultivos.flatMap((c) => c.idoneidad.consejosSuelo.map((cs, i) => (
                  <li key={`${c.cultivoId}-${i}`} className="leyenda-fila">
                    <span className="leyenda-nombre">{nombre(c.cultivoId)}: {cs}</span>
                  </li>
                )))}
              </ul>
            </div>
          </section>
        )}

        {propuesta.avisos.length > 0 && (
          <section className="tarjeta">
            <div className="tarjeta-cabecera"><h2 className="tarjeta-titulo">Avisos</h2></div>
            <div className="tarjeta-cuerpo">
              {propuesta.avisos.map((a, i) => <p key={i} className="aviso" role="alert">{a}</p>)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
