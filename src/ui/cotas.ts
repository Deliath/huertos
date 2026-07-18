import type { PlantaPosicionada } from '../dominio/distribucion'

export interface Cota {
  cultivoId: string
  orientacion: 'horizontal' | 'vertical'
  x1Cm: number
  y1Cm: number
  x2Cm: number
  y2Cm: number
  etiqueta: string
}

// Por especie: una cota horizontal (par más cercano en la misma fila) y una
// vertical (par más cercano entre filas). La etiqueta es la distancia medida.
export function calcularCotas(plantas: PlantaPosicionada[]): Cota[] {
  const porCultivo = new Map<string, PlantaPosicionada[]>()
  for (const p of plantas) {
    const lista = porCultivo.get(p.cultivoId) ?? []
    lista.push(p)
    porCultivo.set(p.cultivoId, lista)
  }

  const cotas: Cota[] = []
  for (const [cultivoId, lista] of porCultivo) {
    let h: [PlantaPosicionada, PlantaPosicionada] | null = null
    let v: [PlantaPosicionada, PlantaPosicionada] | null = null
    for (const a of lista) {
      for (const b of lista) {
        if (a === b) continue
        if (a.yCm === b.yCm && a.xCm < b.xCm && (!h || b.xCm - a.xCm < h[1].xCm - h[0].xCm)) h = [a, b]
        if (a.yCm < b.yCm && (!v || b.yCm - a.yCm < v[1].yCm - v[0].yCm)) v = [a, b]
      }
    }
    if (h) cotas.push({ cultivoId, orientacion: 'horizontal', x1Cm: h[0].xCm, y1Cm: h[0].yCm, x2Cm: h[1].xCm, y2Cm: h[1].yCm, etiqueta: `${h[1].xCm - h[0].xCm} cm` })
    if (v) cotas.push({ cultivoId, orientacion: 'vertical', x1Cm: v[0].xCm, y1Cm: v[0].yCm, x2Cm: v[1].xCm, y2Cm: v[1].yCm, etiqueta: `${v[1].yCm - v[0].yCm} cm` })
  }
  return cotas
}
