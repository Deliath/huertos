// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { PanelResultado } from './PanelResultado'
import { descargarPng, descargarPdf } from './exportar'
import { proponerHuerto } from '../app/proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

vi.mock('./exportar', () => ({ descargarPng: vi.fn(), descargarPdf: vi.fn(), svgAString: vi.fn() }))

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]

test('los botones de descarga exportan el SVG del bancal a PNG y PDF', async () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} bancales={bancales} orientacionNorte="norte" />)

  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('button', { name: 'Descargar PNG' }))

  // El handler importa `./exportar` de forma perezosa (dynamic import), así que la
  // llamada al mock ocurre tras un microtask: esperamos a que se registre.
  await waitFor(() => expect(descargarPng).toHaveBeenCalledTimes(1))
  const [svgArgPng, nombrePng] = vi.mocked(descargarPng).mock.calls[0]
  expect(svgArgPng).toBeTruthy()
  expect((svgArgPng as SVGSVGElement).tagName.toLowerCase()).toBe('svg')
  expect(nombrePng.endsWith('.png')).toBe(true)

  await usuario.click(screen.getByRole('button', { name: 'Descargar PDF' }))

  await waitFor(() => expect(descargarPdf).toHaveBeenCalledTimes(1))
  const [svgArgPdf, nombrePdf] = vi.mocked(descargarPdf).mock.calls[0]
  expect(svgArgPdf).toBeTruthy()
  expect((svgArgPdf as SVGSVGElement).tagName.toLowerCase()).toBe('svg')
  expect(nombrePdf.endsWith('.pdf')).toBe(true)
})
