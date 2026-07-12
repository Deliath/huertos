import { expect, test } from 'vitest'
import type { Cultivo } from './tipos'

test('un Cultivo se puede construir con todos sus campos', () => {
  const tomate: Cultivo = {
    id: 'tomate', nombreComun: 'Tomate', nombreCientifico: 'Solanum lycopersicum',
    icono: '🍅', familia: 'solanáceas', tipo: 'fruto',
    tempMinGerminacion: 12, tempOptima: 22, toleranciaHelada: 'sensible',
    texturaPreferida: ['franco'], phMin: 6, phMax: 6.8, drenajeRequerido: 'bueno',
    metodo: 'semillero_trasplante', sol: 'pleno_sol',
    distanciaPlantaCm: 50, distanciaLineaCm: 60, alturaCm: 150,
    diasACosecha: 90, rendimientoPorPlanta: 2.5, unidad: 'kg',
    ventana: 'continua', ventanaDias: 60,
    companeras: ['albahaca'], antagonistas: ['patata'],
    riego: 'Riego regular, evitar encharcar.', plagas: 'Mildiu; airear y no mojar la hoja.',
    notas: 'Entutorar.',
  }
  expect(tomate.id).toBe('tomate')
})
