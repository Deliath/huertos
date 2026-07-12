import type { PerfilClima } from '../dominio/tipos'

export const ZONAS_CLIMATICAS: PerfilClima[] = [
  {
    id: 'mediterraneo_litoral', nombre: 'Mediterráneo litoral',
    tempMediaMensual: [11, 12, 14, 16, 19, 23, 26, 26, 23, 19, 15, 12],
    tempMinMensual: [6, 7, 9, 11, 14, 18, 21, 21, 18, 14, 10, 7],
    mesUltimaHelada: 1, mesPrimeraHelada: 11,
  },
  {
    id: 'interior_continental', nombre: 'Interior continental',
    tempMediaMensual: [5, 7, 10, 12, 16, 21, 25, 24, 20, 14, 9, 6],
    tempMinMensual: [0, 1, 3, 5, 9, 13, 16, 16, 12, 7, 3, 1],
    mesUltimaHelada: 3, mesPrimeraHelada: 10,
  },
  {
    id: 'norte_atlantico', nombre: 'Norte atlántico',
    tempMediaMensual: [9, 9, 11, 12, 15, 18, 20, 20, 18, 15, 12, 10],
    tempMinMensual: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6],
    mesUltimaHelada: 2, mesPrimeraHelada: 11,
  },
  {
    id: 'montana', nombre: 'Montaña',
    tempMediaMensual: [2, 3, 6, 8, 12, 16, 20, 19, 15, 10, 5, 3],
    tempMinMensual: [-3, -2, 0, 2, 6, 10, 13, 13, 9, 4, 0, -2],
    mesUltimaHelada: 4, mesPrimeraHelada: 9,
  },
  {
    id: 'sur_arido', nombre: 'Sur árido / subtropical',
    tempMediaMensual: [13, 14, 16, 18, 21, 25, 28, 28, 25, 21, 17, 14],
    tempMinMensual: [7, 8, 10, 12, 15, 19, 22, 22, 19, 15, 11, 8],
    mesUltimaHelada: 0, mesPrimeraHelada: -1,
  },
  {
    id: 'canarias', nombre: 'Canarias',
    tempMediaMensual: [18, 18, 19, 19, 21, 22, 24, 25, 24, 23, 21, 19],
    tempMinMensual: [14, 14, 15, 15, 17, 18, 20, 21, 20, 19, 17, 15],
    mesUltimaHelada: -1, mesPrimeraHelada: -1,
  },
]

export function buscarZona(id: string): PerfilClima | undefined {
  return ZONAS_CLIMATICAS.find((z) => z.id === id)
}
