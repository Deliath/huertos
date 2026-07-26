// Tamaño del icono de una planta en el plano, en cm de las unidades del plano.
//
// Antes todos los iconos se dibujaban a 16 cm fijos: con cebollas a 10 cm de
// separación se solapaban y el bloque quedaba ilegible. El icono se escala a la
// separación real del cultivo, con un mínimo para que se siga distinguiendo y
// un tope para que los cultivos muy separados no salgan enormes.
export const TAMAÑO_ICONO_MIN_CM = 5
export const TAMAÑO_ICONO_MAX_CM = 26
export const FACTOR_ICONO = 0.85

export function tamañoIcono(distanciaPlantaCm: number, distanciaLineaCm: number): number {
  const separacion = Math.min(distanciaPlantaCm, distanciaLineaCm)
  const escalado = FACTOR_ICONO * separacion
  return Math.min(TAMAÑO_ICONO_MAX_CM, Math.max(TAMAÑO_ICONO_MIN_CM, escalado))
}
