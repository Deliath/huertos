// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MigaPasos } from './MigaPasos'

describe('MigaPasos', () => {
  it('lleva a un paso ya completado al pulsarlo', async () => {
    const onIr = vi.fn()
    render(<MigaPasos pasoActual="suelo" onIr={onIr} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ubicación' }))

    expect(onIr).toHaveBeenCalledWith('ubicacion')
  })

  it('no ofrece como botón el paso actual ni los futuros', () => {
    render(<MigaPasos pasoActual="suelo" onIr={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Suelo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Especies' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tu huerto' })).toBeNull()
    // Pero siguen leyéndose, no desaparecen de la pantalla.
    expect(screen.getByText('Especies')).toBeInTheDocument()
  })

  it('señala el paso actual para el lector de pantalla', () => {
    render(<MigaPasos pasoActual="suelo" onIr={vi.fn()} />)

    expect(screen.getByText('Suelo')).toHaveAttribute('aria-current', 'step')
  })

  it('no se dibuja en la pantalla de inicio, que está fuera del asistente', () => {
    const { container } = render(<MigaPasos pasoActual="inicio" onIr={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
