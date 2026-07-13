// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PantallaInicio, subtituloPlan } from './PantallaInicio'
import type { PlanHuerto } from '../almacenamiento/almacen'

function plan(over: Partial<PlanHuerto> = {}): PlanHuerto {
  return {
    id: 'p1', nombre: 'Terraza sur', guardadoEn: Date.parse('2026-07-13T10:00:00Z'), mesSiembra: 3,
    modoUbicacion: 'zona', coordenadas: null, zonaId: 'mediterraneo_litoral',
    clima: { id: 'z', nombre: 'Mediterráneo litoral', tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5), mesUltimaHelada: -1, mesPrimeraHelada: -1 },
    suelo: { textura: 'franco', ph: 6.8, drenaje: 'medio' },
    orientacionNorte: 'norte', bancales: [], elecciones: [], ...over,
  }
}

test('sin planes, solo muestra Crear mi huerto', () => {
  render(<PantallaInicio planes={[]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={() => {}} />)
  expect(screen.getByRole('button', { name: /Crear mi huerto/i })).toBeInTheDocument()
  expect(screen.queryByText(/Mis planes de huerto/i)).not.toBeInTheDocument()
})

test('con planes, lista cada uno con su nombre y subtítulo (incluye el mes)', () => {
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={() => {}} />)
  expect(screen.getByText(/Mis planes de huerto/i)).toBeInTheDocument()
  expect(screen.getByText('Terraza sur')).toBeInTheDocument()
  expect(screen.getByText(/abril/i)).toBeInTheDocument() // mesSiembra = 3
})

test('Abrir dispara onAbrir con el id del plan', async () => {
  const onAbrir = vi.fn()
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={onAbrir} onBorrar={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: /Abrir/i }))
  expect(onAbrir).toHaveBeenCalledWith('p1')
})

test('Borrar dispara onBorrar con el id tras confirmar', async () => {
  const onBorrar = vi.fn()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<PantallaInicio planes={[plan()]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={onBorrar} />)
  await userEvent.click(screen.getByRole('button', { name: /Borrar/i }))
  expect(onBorrar).toHaveBeenCalledWith('p1')
})

test('subtituloPlan incluye el mes de siembra', () => {
  expect(subtituloPlan(plan({ mesSiembra: 3 }))).toMatch(/abril/i)
})

test('muestra la referencia a la licencia CC BY-NC 4.0', () => {
  render(<PantallaInicio planes={[]} onEmpezar={() => {}} onAbrir={() => {}} onBorrar={() => {}} />)
  const enlace = screen.getByRole('link', { name: /CC BY-NC 4\.0/i })
  expect(enlace).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nc/4.0/')
})
