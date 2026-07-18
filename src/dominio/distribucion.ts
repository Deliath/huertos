import type { Bancal, Cultivo } from './tipos'
import type { AsignacionCultivo } from './colocacion'
import { buscarCultivo } from '../datos/cultivos'

export type ModoIntercalado = 'bloques' | 'companeras' | 'mezcla'

export interface PlantaPosicionada { cultivoId: string; icono: string; xCm: number; yCm: number }
export interface ResultadoDistribucion { plantas: PlantaPosicionada[]; noCaben: AsignacionCultivo[] }

interface Entrada { c: Cultivo; n: number }
interface Fila { plantas: { c: Cultivo; xCm: number }[]; maxLineaCm: number }

function entradasDe(asignaciones: AsignacionCultivo[]): Entrada[] {
  const res: Entrada[] = []
  for (const a of asignaciones) {
    const c = buscarCultivo(a.cultivoId)
    if (c && a.numPlantas > 0) res.push({ c, n: a.numPlantas })
  }
  return res
}

function sonCompaneras(a: Cultivo, b: Cultivo): boolean {
  return a.companeras.includes(b.id) || b.companeras.includes(a.id)
}

// Agrupa especies según el modo; cada grupo empieza en fila nueva y los grupos
// se apilan de norte (altas) a sur (bajas), por orden de creación sobre la
// lista ya ordenada por altura.
function agrupar(entradas: Entrada[], modo: ModoIntercalado): Entrada[][] {
  const porAltura = [...entradas].sort((a, b) => b.c.alturaCm - a.c.alturaCm)
  if (modo === 'bloques') return porAltura.map((e) => [e])
  if (modo === 'mezcla') return porAltura.length ? [porAltura] : []
  // companeras: componentes conexas del grafo "es compañera de" (en cualquier sentido).
  const grupos: Entrada[][] = []
  for (const e of porAltura) {
    const conectados = grupos.filter((g) => g.some((x) => sonCompaneras(x.c, e.c)))
    if (conectados.length === 0) { grupos.push([e]); continue }
    const destino = conectados[0]
    destino.push(e)
    for (const otro of conectados.slice(1)) {
      destino.push(...otro)
      grupos.splice(grupos.indexOf(otro), 1)
    }
  }
  return grupos
}

// Alterna las especies del grupo en round-robin hasta agotar sus plantas.
function secuencia(grupo: Entrada[]): Cultivo[] {
  const restantes = grupo.map((e) => ({ c: e.c, n: e.n }))
  const out: Cultivo[] = []
  while (restantes.some((r) => r.n > 0)) {
    for (const r of restantes) if (r.n > 0) { out.push(r.c); r.n-- }
  }
  return out
}

function anotar(m: Map<string, number>, id: string): void { m.set(id, (m.get(id) ?? 0) + 1) }

export function distribuir(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado): ResultadoDistribucion {
  const anchoCm = bancal.anchoM * 100
  const largoCm = bancal.largoM * 100
  const noCaben = new Map<string, number>()
  const filas: Fila[] = []

  for (const grupo of agrupar(entradasDe(asignaciones), modo)) {
    let fila: Fila | null = null // cada grupo empieza en fila nueva
    for (const c of secuencia(grupo)) {
      if (c.distanciaPlantaCm > anchoCm) { anotar(noCaben, c.id); continue } // no cabe ni sola
      const ultima = fila?.plantas[fila.plantas.length - 1]
      const x = ultima ? ultima.xCm + Math.max(ultima.c.distanciaPlantaCm, c.distanciaPlantaCm) : c.distanciaPlantaCm / 2
      if (fila && x + c.distanciaPlantaCm / 2 <= anchoCm) {
        fila.plantas.push({ c, xCm: x })
        fila.maxLineaCm = Math.max(fila.maxLineaCm, c.distanciaLineaCm)
      } else {
        fila = { plantas: [{ c, xCm: c.distanciaPlantaCm / 2 }], maxLineaCm: c.distanciaLineaCm }
        filas.push(fila)
      }
    }
  }

  // Posición vertical de cada fila; las que desbordan el largo van a noCaben.
  const plantas: PlantaPosicionada[] = []
  let y = 0
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i]
    y = i === 0 ? f.maxLineaCm / 2 : y + Math.max(filas[i - 1].maxLineaCm, f.maxLineaCm)
    const cabe = y + f.maxLineaCm / 2 <= largoCm
    for (const p of f.plantas) {
      if (cabe) plantas.push({ cultivoId: p.c.id, icono: p.c.icono, xCm: Math.round(p.xCm), yCm: Math.round(y) })
      else anotar(noCaben, p.c.id)
    }
  }

  return { plantas, noCaben: [...noCaben].map(([cultivoId, numPlantas]) => ({ cultivoId, numPlantas })) }
}

// Prueba a colocar una planta más de la especie dada; la UI lo usa para el botón «+».
export function cabeUnaMas(bancal: Bancal, asignaciones: AsignacionCultivo[], modo: ModoIntercalado, cultivoId: string): boolean {
  const existente = asignaciones.find((a) => a.cultivoId === cultivoId)
  const conUnaMas = existente
    ? asignaciones.map((a) => (a.cultivoId === cultivoId ? { ...a, numPlantas: a.numPlantas + 1 } : a))
    : [...asignaciones, { cultivoId, numPlantas: 1 }]
  return distribuir(bancal, conUnaMas, modo).noCaben.length === 0
}
