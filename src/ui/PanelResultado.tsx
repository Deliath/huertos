import { useRef } from 'react'
import type { Propuesta } from '../app/proponer'
import type { Bancal, Orientacion } from '../dominio/tipos'
import { buscarCultivo } from '../datos/cultivos'
import { PlanoBancal } from './PlanoBancal'
import { VistaCalendario } from './VistaCalendario'

export function PanelResultado({ propuesta, bancales, orientacionNorte }: { propuesta: Propuesta; bancales: Bancal[]; orientacionNorte: Orientacion }) {
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
        <h2>Tu huerto</h2>
        {bancales.map((b) => {
          const col = propuesta.colocacion.bancales.find((x) => x.bancalId === b.id)
          return (
            <div key={b.id} ref={(el) => { contenedores.current[b.id] = el }}>
              <h3>{b.nombre}</h3>
              <PlanoBancal bancal={b} asignaciones={col?.asignaciones ?? []} orientacionNorte={orientacionNorte} modoIntercalado="bloques" />
              <div>
                <button type="button" onClick={() => { void exportarPng(b) }}>Descargar PNG</button>
                <button type="button" onClick={() => { void exportarPdf(b) }}>Descargar PDF</button>
              </div>
            </div>
          )
        })}
      </section>

      <section>
        <h2>Cuándo sembrar y cosechar</h2>
        <VistaCalendario cultivos={propuesta.cultivos} />
      </section>

      <section>
        <h2>Cosecha estimada</h2>
        <ul>
          {propuesta.cultivos.filter((c) => c.cosecha).map((c) => (
            <li key={c.cultivoId}>
              {buscarCultivo(c.cultivoId)?.icono} {nombre(c.cultivoId)} — ~{c.numPlantas} plantas → <strong>{c.cosecha!.cantidadMin}–{c.cosecha!.cantidadMax} {c.cosecha!.unidad}</strong> aprox.
            </li>
          ))}
        </ul>
        <p><em>Estimaciones orientativas; dependen del cuidado y del año.</em></p>
      </section>

      {propuesta.sinergias.length > 0 && (
        <section>
          <h2>Sinergias</h2>
          <ul>
            {propuesta.sinergias.map((s, i) => (
              <li key={i}>{s.tipo === 'favorable' ? '✅' : '⚠️'} {nombre(s.a)} y {nombre(s.b)}: {s.tipo === 'favorable' ? 'se ayudan' : 'mejor separarlos'}</li>
            ))}
          </ul>
        </section>
      )}

      {propuesta.companerasSugeridas.length > 0 && (
        <section>
          <h2>Podrías añadir</h2>
          <ul>{propuesta.companerasSugeridas.map((id) => <li key={id}>{buscarCultivo(id)?.icono} {nombre(id)} — mejora tu huerto por sus compañeras.</li>)}</ul>
        </section>
      )}

      {propuesta.cultivos.some((c) => c.idoneidad.consejosSuelo.length > 0) && (
        <section>
          <h2>Consejos de suelo</h2>
          <ul>
            {propuesta.cultivos.flatMap((c) => c.idoneidad.consejosSuelo.map((cs, i) => <li key={`${c.cultivoId}-${i}`}>{nombre(c.cultivoId)}: {cs}</li>))}
          </ul>
        </section>
      )}

      {propuesta.avisos.length > 0 && (
        <section>
          <h2>Avisos</h2>
          <ul>{propuesta.avisos.map((a, i) => <li key={i} role="alert">{a}</li>)}</ul>
        </section>
      )}
    </div>
  )
}
