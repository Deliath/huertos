import { useMemo, useReducer } from 'react'
import { reducer, estadoInicial } from '../app/estado'
import { proponerHuerto } from '../app/proponer'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import { PantallaInicio } from './PantallaInicio'
import { PasoUbicacion } from './PasoUbicacion'
import { EditorBancales } from './EditorBancales'
import { PasoSuelo } from './PasoSuelo'
import { SelectorEspecies } from './SelectorEspecies'
import { PanelResultado } from './PanelResultado'
import { AvisoPrivacidad } from './AvisoPrivacidad'

export function App({ mesActual: mesInyectado }: { mesActual?: number } = {}) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)
  const mesActual = mesInyectado ?? new Date().getMonth()
  const almacen = useMemo(() => crearAlmacenLocal(), [])

  const superficieM2 = estado.bancales.reduce((s, b) => s + b.anchoM * b.largoM, 0)

  const propuesta = useMemo(() => {
    if (!estado.clima || !estado.suelo) return null
    return proponerHuerto(estado.clima, estado.suelo, mesActual, estado.bancales, estado.elecciones)
  }, [estado.clima, estado.suelo, estado.bancales, estado.elecciones, mesActual])

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {estado.paso === 'inicio' && <PantallaInicio onEmpezar={() => dispatch({ tipo: 'ir_a_paso', paso: 'ubicacion' })} />}

      {estado.paso === 'ubicacion' && (
        <PasoUbicacion mesActual={mesActual} onListo={(r) => {
          dispatch({ tipo: 'set_modo_ubicacion', modo: r.modo, coordenadas: r.coordenadas, zonaId: r.zonaId })
          dispatch({ tipo: 'set_clima', clima: r.clima })
          if (r.sueloAuto) dispatch({ tipo: 'set_suelo', suelo: r.sueloAuto })
          dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })
        }} />
      )}

      {estado.paso === 'bancales' && (
        <div>
          <EditorBancales
            bancales={estado.bancales} orientacionNorte={estado.orientacionNorte}
            onAñadir={(b) => dispatch({ tipo: 'añadir_bancal', bancal: b })}
            onBorrar={(id) => dispatch({ tipo: 'borrar_bancal', id })}
            onOrientacion={(o) => dispatch({ tipo: 'set_orientacion', orientacion: o })}
          />
          <button type="button" disabled={estado.bancales.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'suelo' })}>Siguiente</button>
        </div>
      )}

      {estado.paso === 'suelo' && (
        <div>
          <PasoSuelo sueloAuto={estado.suelo} onElegir={(s) => dispatch({ tipo: 'set_suelo', suelo: s })} />
          <button type="button" disabled={!estado.suelo} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Siguiente</button>
        </div>
      )}

      {estado.paso === 'especies' && estado.clima && estado.suelo && (
        <div>
          <SelectorEspecies
            elecciones={estado.elecciones} onCambio={(e) => dispatch({ tipo: 'set_elecciones', elecciones: e })}
            clima={estado.clima} suelo={estado.suelo} mesActual={mesActual} superficieM2={superficieM2}
          />
          <button type="button" disabled={estado.elecciones.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'resultado' })}>Ver mi huerto</button>
        </div>
      )}

      {estado.paso === 'resultado' && propuesta && (
        <div>
          <PanelResultado propuesta={propuesta} bancales={estado.bancales} orientacionNorte={estado.orientacionNorte} />
          <div>
            <h2>Ajustar (validación)</h2>
            <p>¿Quieres cambiar algo? Vuelve a las especies o los bancales y el huerto se recalcula solo.</p>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Ajustar especies</button>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })}>Ajustar bancales</button>
            <button type="button" onClick={() => almacen.guardar('actual', { huerto: { orientacionNorte: estado.orientacionNorte, bancales: estado.bancales }, elecciones: estado.elecciones })}>Guardar</button>
          </div>
        </div>
      )}

      <AvisoPrivacidad />
    </main>
  )
}
