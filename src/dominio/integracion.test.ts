import { expect, test } from 'vitest'
import { climaDeZona } from './clima'
import { sueloManual } from './suelo'
import { sugerirEspecies } from './sugerencia'
import { colocar } from './colocacion'
import { estimarCosecha } from './cosecha'
import { buscarCultivo } from '../datos/cultivos'
import type { Bancal } from './tipos'

test('flujo completo de extremo a extremo: clima+suelo → sugerencia → colocación → cosecha', () => {
  const clima = climaDeZona('mediterraneo_litoral')
  const suelo = sueloManual('franco', 6.5)
  const mes = 4 // mayo

  const sugeridas = sugerirEspecies(clima, suelo, mes, 4, 6)
  expect(sugeridas.length).toBeGreaterThan(0)
  for (const s of sugeridas) {
    expect(s.obligatoriedad).toBe('opcional')
    expect(s.cantidad).toBe('media')
    expect(buscarCultivo(s.cultivoId)).toBeDefined()
  }

  const bancales: Bancal[] = [
    { id: 'b1', nombre: 'Bancal 1', anchoM: 1.2, largoM: 3 },
    { id: 'b2', nombre: 'Bancal 2', anchoM: 1.2, largoM: 3 },
  ]
  const colocacion = colocar(bancales, sugeridas)

  // cada especie sugerida aparece colocada (con o sin plantas) o registrada como no colocada
  const colocadas = colocacion.bancales.flatMap((b) => b.asignaciones.map((a) => a.cultivoId))
  for (const s of sugeridas) {
    expect(colocadas.includes(s.cultivoId) || colocacion.noColocadas.includes(s.cultivoId)).toBe(true)
  }

  // al menos una asignación con plantas > 0, y su cosecha estimada es coherente
  const conPlantas = colocacion.bancales.flatMap((b) => b.asignaciones).find((a) => a.numPlantas > 0)
  expect(conPlantas).toBeDefined()
  const est = estimarCosecha(conPlantas!.cultivoId, conPlantas!.numPlantas)
  expect(est.cantidadMax).toBeGreaterThanOrEqual(est.cantidadMin)
  expect(est.cantidadMin).toBeGreaterThan(0)
  expect(est.unidad).toBe(buscarCultivo(conPlantas!.cultivoId)!.unidad)
})
