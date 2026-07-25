import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { configurarIconoPorDefecto } from './iconos-leaflet'

configurarIconoPorDefecto()

function Clicks({ onSeleccion }: { onSeleccion: (lat: number, lon: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null)
  useMapEvents({
    click(e: LeafletMouseEvent) {
      setPos([e.latlng.lat, e.latlng.lng])
      onSeleccion(e.latlng.lat, e.latlng.lng)
    }
  })
  return pos ? <Marker position={pos} /> : null
}

export function MapaSelector({ onSeleccion }: { onSeleccion: (lat: number, lon: number) => void }) {
  const center: LatLngTuple = [40, -3.7]
  return (
    <MapContainer center={center} zoom={5} style={{ height: 320 }}>
      <TileLayer attribution="© OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clicks onSeleccion={onSeleccion} />
    </MapContainer>
  )
}
