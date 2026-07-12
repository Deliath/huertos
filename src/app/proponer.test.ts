import { expect, test } from 'vitest'
import { proponerHuerto } from './proponer'
import { climaDeZona } from '../dominio/clima'
import { sueloManual } from '../dominio/suelo'
import type { Bancal, EleccionEspecie } from '../dominio/tipos'

const clima = climaDeZona('mediterraneo_litoral')
const suelo = sueloManual('franco', 6.5)
const bancales: Bancal[] = [{ id: 'b1', nombre: 'B1', anchoM: 2, largoM: 3 }]

test('genera cosecha y calendario para una especie apta y colocada', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'obligatoria', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones) // junio
  const t = p.cultivos.find((c) => c.cultivoId === 'tomate')!
  expect(t.idoneidad.estado).toBe('apta')
  expect(t.numPlantas).toBeGreaterThan(0)
  expect(t.cosecha).toBeDefined()
  expect(t.calendario).toBeDefined()
})

test('incluye avisos de sinergia conflictiva vía sinergias', () => {
  const elecciones: EleccionEspecie[] = [
    { cultivoId: 'cebolla', obligatoriedad: 'obligatoria', cantidad: 'media' },
    { cultivoId: 'judia', obligatoriedad: 'obligatoria', cantidad: 'media' },
  ]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.sinergias.some((s) => s.tipo === 'conflictiva')).toBe(true)
})

test('sugiere compañeras no elegidas', () => {
  const elecciones: EleccionEspecie[] = [{ cultivoId: 'tomate', obligatoriedad: 'opcional', cantidad: 'media' }]
  const p = proponerHuerto(clima, suelo, 5, bancales, elecciones)
  expect(p.companerasSugeridas).toContain('albahaca')
})
