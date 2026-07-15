// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, beforeEach } from 'vitest'
import { crearAlmacenLocal } from '../almacenamiento/almacen'
import type { PlanHuerto } from '../almacenamiento/almacen'
import { App } from './App'

beforeEach(() => localStorage.clear())

test('flujo por zona climática hasta ver el resultado', async () => {
  render(<App mesActual={5} />) // junio, fijo para el test
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))

  // Ubicación por zona
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))

  // Confirmación de ubicación (clima + suelo)
  await userEvent.click(screen.getByRole('button', { name: /Continuar/i }))

  // Bancales
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Suelo
  await userEvent.click(screen.getByRole('button', { name: /^Franco/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Especies
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  await userEvent.click(screen.getByRole('button', { name: /Ver mi huerto/i }))

  // Resultado
  expect(await screen.findByText(/Cosecha estimada/i)).toBeInTheDocument()
})

// Lleva la app hasta la pantalla de resultados con un plan mínimo por zona.
async function llegarAResultados() {
  render(<App mesActual={3} />)
  await userEvent.click(screen.getByRole('button', { name: /Crear mi huerto/i }))

  // Ubicación por zona
  await userEvent.click(screen.getByRole('button', { name: /Elegir por zona climática/i }))
  await userEvent.selectOptions(screen.getByLabelText(/Zona climática/i), 'mediterraneo_litoral')
  await userEvent.click(screen.getByRole('button', { name: /Usar esta zona/i }))

  // Confirmación de ubicación (clima + suelo)
  await userEvent.click(screen.getByRole('button', { name: /Continuar/i }))

  // Bancales
  await userEvent.type(screen.getByLabelText(/Ancho/i), '2')
  await userEvent.type(screen.getByLabelText(/Largo/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /Añadir bancal/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Suelo
  await userEvent.click(screen.getByRole('button', { name: /^Franco/i }))
  await userEvent.click(screen.getByRole('button', { name: /Siguiente/i }))

  // Especies
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  await userEvent.click(screen.getByRole('button', { name: /Ver mi huerto/i }))

  expect(await screen.findByText(/Cosecha estimada/i)).toBeInTheDocument()
}

test('guardar pide nombre y persiste un plan que luego aparece en la lista', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar().map((p) => p.nombre)).toContain('Mi terraza')
  expect(await screen.findByText(/Guardado ✓/i)).toBeInTheDocument()
})

test('reguardar con el mismo nombre actualiza en vez de duplicar', async () => {
  await llegarAResultados()
  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Mi terraza')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  expect(crearAlmacenLocal().listar()).toHaveLength(1)
})

// S5: un plan guardado debe reproducir SIEMPRE el mismo resultado, sin
// importar el mes de hoy. El clima de este plan solo alcanza los 12°C que
// necesita el tomate para germinar en abril (mesSiembra: 3); en cualquier
// otro mes -incluido octubre, el mesActual que inyectamos- el tomate saldría
// "esperar" si la app usara por error el mes de hoy en vez del mesSiembra
// guardado. Que salga "apta" (con cosecha) prueba que se usó el mesSiembra.
test('un plan guardado reproduce el mismo resultado sin importar el mes actual', async () => {
  const plan: PlanHuerto = {
    id: 'p1', nombre: 'Plan de abril', guardadoEn: Date.now(), mesSiembra: 3,
    modoUbicacion: 'zona', coordenadas: null, zonaId: 'mediterraneo_litoral',
    clima: {
      id: 'z', nombre: 'Zona de prueba',
      tempMediaMensual: Array(12).fill(5).map((v, i) => (i === 3 ? 20 : v)),
      tempMinMensual: Array(12).fill(2),
      mesUltimaHelada: -1, mesPrimeraHelada: -1,
    },
    suelo: { textura: 'franco', ph: 6.5, drenaje: 'bueno' },
    orientacionNorte: 'norte',
    bancales: [{ id: 'b1', nombre: 'Bancal 1', anchoM: 2, largoM: 3 }],
    elecciones: [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }],
  }
  crearAlmacenLocal().guardar(plan)

  render(<App mesActual={9} />) // octubre: mes de "hoy" distinto al mesSiembra del plan (abril)
  await userEvent.click(screen.getByRole('button', { name: /Abrir/i }))

  const tituloCosecha = await screen.findByRole('heading', { name: /Cosecha estimada/i })
  const seccionCosecha = tituloCosecha.closest('section')!
  expect(within(seccionCosecha).getByRole('listitem')).toHaveTextContent(/Tomate/i)
  expect(screen.queryByText(/Aún no es su época/i)).not.toBeInTheDocument()
})

test('ajustar cantidad con + actualiza la leyenda y se guarda con el plan', async () => {
  await llegarAResultados()
  // 6 tomateras por defecto en un bancal de 2×3 m.
  const leyenda = within(screen.getByRole('list', { name: /Plantas en/i }))
  expect(leyenda.getByText('6')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Añadir Tomate/i }))
  expect(leyenda.getByText('7')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('radio', { name: /Todas las compatibles/i }))

  await userEvent.type(screen.getByLabelText(/Nombre del plan/i), 'Con ajustes')
  await userEvent.click(screen.getByRole('button', { name: /Guardar plan/i }))
  const plan = crearAlmacenLocal().listar().find((p) => p.nombre === 'Con ajustes')!
  expect(plan.modoIntercalado).toBe('mezcla')
  expect(Object.values(plan.ajustes!)[0]).toEqual({ tomate: 7 })
})
