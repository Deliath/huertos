import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { reducer, estadoInicial } from '../app/estado'
import { proponerHuerto } from '../app/proponer'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import type { PlanHuerto } from '../almacenamiento/almacen'
import { PantallaInicio } from './PantallaInicio'
import { PasoUbicacion } from './PasoUbicacion'
import { EditorBancales } from './EditorBancales'
import { PasoSuelo } from './PasoSuelo'
import { SelectorEspecies } from './SelectorEspecies'
import { PanelResultado } from './PanelResultado'
import { PieAtribuciones } from './PieAtribuciones'

export function App({ mesActual: mesInyectado }: { mesActual?: number } = {}) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)
  const mesActual = mesInyectado ?? new Date().getMonth()
  const almacen = useMemo(() => crearAlmacenLocal(), [])
  const [planes, setPlanes] = useState<PlanHuerto[]>(() => almacen.listar())
  const refrescarPlanes = () => setPlanes(almacen.listar())
  const [nombrePlan, setNombrePlan] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)
  const pasoAnteriorRef = useRef(estado.paso)

  // Solo reinicia el campo/aviso al ENTRAR en resultado (no en cada guardado,
  // que también cambia estado.nombreGuardado y borraría el "Guardado ✓").
  useEffect(() => {
    if (estado.paso === 'resultado' && pasoAnteriorRef.current !== 'resultado') {
      setNombrePlan(estado.nombreGuardado ?? '')
      setGuardadoOk(false)
    }
    pasoAnteriorRef.current = estado.paso
  }, [estado.paso, estado.nombreGuardado])

  const superficieM2 = estado.bancales.reduce((s, b) => s + b.anchoM * b.largoM, 0)

  const propuesta = useMemo(() => {
    if (!estado.clima || !estado.suelo) return null
    return proponerHuerto(estado.clima, estado.suelo, estado.mesSiembra, estado.bancales, estado.elecciones, estado.ajustes, estado.modoIntercalado)
  }, [estado.clima, estado.suelo, estado.bancales, estado.elecciones, estado.mesSiembra, estado.ajustes, estado.modoIntercalado])

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {estado.paso === 'inicio' && (
        <PantallaInicio
          planes={planes}
          onEmpezar={() => dispatch({ tipo: 'empezar_plan', mesSiembra: mesActual })}
          onAbrir={(id) => { const p = almacen.cargar(id); if (p) dispatch({ tipo: 'cargar_plan', plan: p }) }}
          onBorrar={(id) => { almacen.borrar(id); refrescarPlanes() }}
        />
      )}

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
            clima={estado.clima} suelo={estado.suelo} mesActual={estado.mesSiembra} superficieM2={superficieM2}
          />
          <button type="button" disabled={estado.elecciones.length === 0} onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'resultado' })}>Ver mi huerto</button>
        </div>
      )}

      {estado.paso === 'resultado' && propuesta && (
        <div>
          <PanelResultado
            propuesta={propuesta} bancales={estado.bancales} orientacionNorte={estado.orientacionNorte}
            modoIntercalado={estado.modoIntercalado}
            onModoIntercalado={(modo) => dispatch({ tipo: 'set_modo_intercalado', modo })}
            onAjustarCantidad={(bancalId, cultivoId, numPlantas) => dispatch({ tipo: 'ajustar_cantidad', bancalId, cultivoId, numPlantas })}
          />
          <div>
            <h2>Ajustar (validación)</h2>
            <p>¿Quieres cambiar algo? Vuelve a las especies o los bancales y el huerto se recalcula solo.</p>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'especies' })}>Ajustar especies</button>
            <button type="button" onClick={() => dispatch({ tipo: 'ir_a_paso', paso: 'bancales' })}>Ajustar bancales</button>
            <div>
              <label>Nombre del plan: <input value={nombrePlan} onChange={(e) => { setNombrePlan(e.target.value); setGuardadoOk(false) }} /></label>
              <button type="button" disabled={!nombrePlan.trim()} onClick={() => {
                const mismoNombre = estado.idGuardado != null && nombrePlan.trim() === estado.nombreGuardado
                const id = mismoNombre ? estado.idGuardado! : crypto.randomUUID()
                almacen.guardar({
                  id, nombre: nombrePlan.trim(), guardadoEn: Date.now(), mesSiembra: estado.mesSiembra,
                  modoUbicacion: estado.modoUbicacion ?? 'zona', coordenadas: estado.coordenadas, zonaId: estado.zonaId,
                  clima: estado.clima!, suelo: estado.suelo!, orientacionNorte: estado.orientacionNorte,
                  bancales: estado.bancales, elecciones: estado.elecciones,
                  modoIntercalado: estado.modoIntercalado, ajustes: estado.ajustes,
                })
                dispatch({ tipo: 'set_guardado', id, nombre: nombrePlan.trim() })
                refrescarPlanes()
                setGuardadoOk(true)
              }}>Guardar plan</button>
              {guardadoOk && <span> Guardado ✓</span>}
            </div>
          </div>
        </div>
      )}

      <PieAtribuciones />
    </main>
  )
}
