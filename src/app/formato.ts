const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function nombreMes(indice: number): string {
  return MESES[((indice % 12) + 12) % 12]
}

export function rangoMeses(inicio: number, fin: number): string {
  return inicio === fin ? nombreMes(inicio) : `${nombreMes(inicio)} – ${nombreMes(fin)}`
}

// La interfaz está en español, así que los números se muestran con coma
// decimal. `maximumFractionDigits` también quita los ceros finales, que es lo
// que se quiere: «6 m²» y no «6,0 m²».
export function numero(valor: number, decimalesMax = 1): string {
  return valor.toLocaleString('es-ES', { maximumFractionDigits: decimalesMax })
}
