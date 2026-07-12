import type { PerfilClima, PerfilSuelo, EleccionEspecie } from './tipos'
import { CULTIVOS, buscarCultivo } from '../datos/cultivos'
import { evaluarIdoneidad } from './idoneidad'

export function sugerirEspecies(
  clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
  superficieM2: number, especiesPorM2 = 6,
): EleccionEspecie[] {
  const maximo = Math.max(1, Math.round(superficieM2 * especiesPorM2))

  const candidatas = CULTIVOS
    .map((c) => ({ c, r: evaluarIdoneidad(c, clima, suelo, mesActual) }))
    .filter((x) => x.r.estado === 'apta')
    .sort((a, b) => b.r.puntuacion - a.r.puntuacion)

  const elegidas: string[] = []
  for (const { c } of candidatas) {
    if (elegidas.length >= maximo) break
    const chocaConElegida = elegidas.some((id) => {
      const otra = buscarCultivo(id)!
      return c.antagonistas.includes(id) || otra.antagonistas.includes(c.id)
    })
    if (chocaConElegida) continue
    elegidas.push(c.id)
  }

  return elegidas.map((cultivoId) => ({ cultivoId, obligatoriedad: 'opcional', cantidad: 'media' }))
}
