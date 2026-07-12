// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PanelResultado } from './PanelResultado'
import { proponerHuerto } from '../app/proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]
const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]

test('muestra el resumen de cosecha del tomate en kg', () => {
  const propuesta = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  render(<PanelResultado propuesta={propuesta} bancales={bancales} orientacionNorte="norte" />)
  // El tomate debe aparecer en ambas secciones: fila del calendario + línea de cosecha.
  expect(screen.getAllByText(/Tomate/i)).toHaveLength(2)
  expect(screen.getByText(/kg/i)).toBeInTheDocument()
})
