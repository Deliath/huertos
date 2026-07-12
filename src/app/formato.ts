const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function nombreMes(indice: number): string {
  return MESES[((indice % 12) + 12) % 12]
}

export function rangoMeses(inicio: number, fin: number): string {
  return inicio === fin ? nombreMes(inicio) : `${nombreMes(inicio)} – ${nombreMes(fin)}`
}
