// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { PerfilClima, PerfilSuelo } from '../dominio/tipos'
import { PasoUbicacion } from './PasoUbicacion'

vi.mock('../servicios/geocodificador', () => ({
  buscarDireccion: vi.fn(async () => [{ nombre: 'Valencia, España', lat: 39.47, lon: -0.38 }]),
}))

vi.mock('../dominio/clima', () => ({
  climaDeZona: vi.fn(),
  climaDeCoordenadas: vi.fn(
    async (): Promise<PerfilClima> => ({
      id: 'coordenadas', nombre: 'Ubicación precisa',
      tempMediaMensual: Array(12).fill(15), tempMinMensual: Array(12).fill(5),
      mesUltimaHelada: -1, mesPrimeraHelada: -1,
    }),
  ),
  esMesHelada: (clima: PerfilClima, mes: number) =>
    (clima.mesUltimaHelada >= 0 && mes <= clima.mesUltimaHelada) ||
    (clima.mesPrimeraHelada >= 0 && mes >= clima.mesPrimeraHelada),
}))

vi.mock('../dominio/suelo', () => ({
  sueloDeCoordenadas: vi.fn(async (): Promise<PerfilSuelo> => ({ textura: 'franco', ph: 6.8, drenaje: 'medio' })),
}))

test('buscar una dirección y elegir un resultado usa esas coordenadas', async () => {
  const onListo = vi.fn()
  render(<PasoUbicacion onListo={onListo} />)
  await userEvent.click(screen.getByRole('button', { name: /Usar ubicación precisa/i }))
  await userEvent.type(screen.getByLabelText(/Buscar dirección/i), 'Valencia')
  await userEvent.click(screen.getByRole('button', { name: /^Buscar$/i }))
  expect(await screen.findByText(/Valencia, España/i)).toBeInTheDocument()
  await userEvent.click(screen.getByText(/Valencia, España/i))
  // Tras cargar clima/suelo aparece la confirmación; "Continuar" entrega las coordenadas.
  await userEvent.click(await screen.findByRole('button', { name: /Continuar/i }))
  await waitFor(() =>
    expect(onListo).toHaveBeenCalledWith(
      expect.objectContaining({ modo: 'precisa', coordenadas: { lat: 39.47, lon: -0.38 } }),
    ),
  )
})
