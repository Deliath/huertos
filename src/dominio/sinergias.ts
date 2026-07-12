import { CULTIVOS, buscarCultivo } from '../datos/cultivos'

export interface ParejaSinergia { a: string; b: string; tipo: 'favorable' | 'conflictiva' }

function ordenar(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export function evaluarSinergias(cultivoIds: string[]): ParejaSinergia[] {
  const parejas: ParejaSinergia[] = []
  const vistas = new Set<string>()
  for (const id of cultivoIds) {
    const c = buscarCultivo(id)
    if (!c) continue
    for (const otro of cultivoIds) {
      if (id === otro) continue
      const [a, b] = ordenar(id, otro)
      const clave = `${a}|${b}`
      if (vistas.has(clave)) continue
      if (c.companeras.includes(otro)) { parejas.push({ a, b, tipo: 'favorable' }); vistas.add(clave) }
      else if (c.antagonistas.includes(otro)) { parejas.push({ a, b, tipo: 'conflictiva' }); vistas.add(clave) }
    }
  }
  return parejas
}

export function sugerirCompaneras(cultivoIds: string[], maximo = 2): string[] {
  const elegidas = new Set(cultivoIds)
  const puntos = new Map<string, number>()
  for (const id of cultivoIds) {
    const c = buscarCultivo(id)
    if (!c) continue
    for (const comp of c.companeras) {
      if (elegidas.has(comp)) continue
      if (!buscarCultivo(comp)) continue
      puntos.set(comp, (puntos.get(comp) ?? 0) + 1)
    }
  }
  return [...puntos.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
    .slice(0, maximo)
    .map(([id]) => id)
}
