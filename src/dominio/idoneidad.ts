import type { Cultivo, PerfilClima, PerfilSuelo, ResultadoIdoneidad, Drenaje } from './tipos'

const ORDEN_DRENAJE: Record<Drenaje, number> = { malo: 0, medio: 1, bueno: 2 }

function mesesEnVentana(cultivo: Cultivo, clima: PerfilClima): number[] {
  const meses: number[] = []
  for (let m = 0; m < 12; m++) {
    const calido = clima.tempMediaMensual[m] >= cultivo.tempMinGerminacion
    let sinHelada = true
    if (cultivo.toleranciaHelada === 'sensible') {
      if (clima.mesUltimaHelada >= 0 && m <= clima.mesUltimaHelada) sinHelada = false
      if (clima.mesPrimeraHelada >= 0 && m >= clima.mesPrimeraHelada) sinHelada = false
    }
    if (calido && sinHelada) meses.push(m)
  }
  return meses
}

function evaluarSuelo(cultivo: Cultivo, suelo: PerfilSuelo): { penalizacion: number; consejos: string[] } {
  const consejos: string[] = []
  let penalizacion = 0
  if (!cultivo.texturaPreferida.includes(suelo.textura)) {
    penalizacion += 10
    consejos.push(`Prefiere suelo ${cultivo.texturaPreferida.join('/')}; el tuyo es ${suelo.textura}. Aporta compost para mejorar la estructura.`)
  }
  if (suelo.ph < cultivo.phMin || suelo.ph > cultivo.phMax) {
    penalizacion += 8
    const dir = suelo.ph < cultivo.phMin ? 'ácido' : 'alcalino'
    consejos.push(`Tu pH (${suelo.ph}) es algo ${dir} para este cultivo (ideal ${cultivo.phMin}-${cultivo.phMax}). Corrígelo poco a poco.`)
  }
  if (ORDEN_DRENAJE[suelo.drenaje] < ORDEN_DRENAJE[cultivo.drenajeRequerido]) {
    penalizacion += 25
    consejos.push('El drenaje es insuficiente: cultiva en caballón/bancal elevado y añade material que aligere el suelo.')
  }
  return { penalizacion, consejos }
}

export function evaluarIdoneidad(
  cultivo: Cultivo, clima: PerfilClima, suelo: PerfilSuelo, mesActual: number,
): ResultadoIdoneidad {
  const ventana = mesesEnVentana(cultivo, clima)
  const { penalizacion, consejos } = evaluarSuelo(cultivo, suelo)

  if (ventana.length === 0) {
    return { cultivoId: cultivo.id, estado: 'no_recomendada', puntuacion: 0, consejosSuelo: consejos, motivo: 'El clima no alcanza sus necesidades térmicas en ningún mes.' }
  }

  const enVentanaAhora = ventana.includes(mesActual)
  const mesRecomendado = enVentanaAhora
    ? mesActual
    : (ventana.find((m) => m > mesActual) ?? ventana[0])

  const distanciaTermica = Math.abs(clima.tempMediaMensual[mesRecomendado] - cultivo.tempOptima)
  let puntuacion = 100 - distanciaTermica * 3 - penalizacion
  puntuacion = Math.max(0, Math.min(100, Math.round(puntuacion)))

  return {
    cultivoId: cultivo.id,
    estado: enVentanaAhora ? 'apta' : 'esperar',
    puntuacion,
    mesRecomendado,
    consejosSuelo: consejos,
    motivo: enVentanaAhora ? undefined : 'Aún no es su época; mejor esperar.',
  }
}
