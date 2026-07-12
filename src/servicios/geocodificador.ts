export interface ResultadoGeocodificacion { nombre: string; lat: number; lon: number }

export function parsearNominatim(datos: unknown): ResultadoGeocodificacion[] {
  if (!Array.isArray(datos)) return []
  const out: ResultadoGeocodificacion[] = []
  for (const item of datos) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const lat = Number(o.lat)
    const lon = Number(o.lon)
    const nombre = typeof o.display_name === 'string' ? o.display_name : ''
    if (nombre && Number.isFinite(lat) && Number.isFinite(lon)) out.push({ nombre, lat, lon })
  }
  return out
}

export async function buscarDireccion(consulta: string, fetchImpl: typeof fetch = fetch): Promise<ResultadoGeocodificacion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=es&q=${encodeURIComponent(consulta)}`
  const resp = await fetchImpl(url, { headers: { 'Accept-Language': 'es' } })
  if (!resp.ok) throw new Error(`Error en la búsqueda de dirección: ${resp.status}`)
  return parsearNominatim(await resp.json())
}
