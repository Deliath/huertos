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

// Geometría del dibujo de cotas, compartida con PlanoBancal: separación de la
// línea de cota respecto a las plantas, tamaño de fuente y ancho estimado por
// carácter de la etiqueta (todo en cm del plano).
export const SEPARACION_COTA_CM = 12
export const FUENTE_COTA_CM = 9
const ANCHO_CARACTER_CM = 5.5

// Rectángulo que ocupan líneas, marcas y etiquetas de las cotas. El plano lo usa
// para ampliar su viewBox y que las etiquetas junto a los bordes no se corten.
export function cajaCotas(cotas: Cota[]): { minXCm: number; minYCm: number; maxXCm: number } {
  let minX = 0
  let minY = 0
  let maxX = 0
  for (const c of cotas) {
    const anchoEtiqueta = c.etiqueta.length * ANCHO_CARACTER_CM
    if (c.orientacion === 'horizontal') {
      const centro = (c.x1Cm + c.x2Cm) / 2
      minX = Math.min(minX, centro - anchoEtiqueta / 2)
      maxX = Math.max(maxX, centro + anchoEtiqueta / 2)
      minY = Math.min(minY, c.y1Cm - SEPARACION_COTA_CM - 3 - FUENTE_COTA_CM)
    } else {
      minX = Math.min(minX, c.x1Cm - SEPARACION_COTA_CM - 4 - anchoEtiqueta)
    }
  }
  return { minXCm: minX, minYCm: minY, maxXCm: maxX }
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
