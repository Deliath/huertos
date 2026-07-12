// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SelectorEspecies } from './SelectorEspecies'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)

test('marcar una especie la comunica como elección opcional/media por defecto', async () => {
  const onCambio = vi.fn()
  render(<SelectorEspecies elecciones={[]} onCambio={onCambio} clima={clima} suelo={suelo} mesActual={5} superficieM2={4} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Tomate/i }))
  expect(onCambio).toHaveBeenCalledWith([{ cultivoId: 'tomate', obligatoriedad: 'opcional', cantidad: 'media' }])
})

test('el botón de sugerencia propone especies no vacías', async () => {
  const onCambio = vi.fn()
  render(<SelectorEspecies elecciones={[]} onCambio={onCambio} clima={clima} suelo={suelo} mesActual={5} superficieM2={4} />)
  await userEvent.click(screen.getByRole('button', { name: /Hazme tú una sugerencia/i }))
  expect(onCambio).toHaveBeenCalled()
  const arg = onCambio.mock.calls.at(-1)![0]
  expect(arg.length).toBeGreaterThan(0)
})
