'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GeoPosition } from '@/lib/types'

// Ícone para posição atual - estilo gaming amarelo pulsante
const currentPositionIcon = L.divIcon({
  className: 'current-position-marker',
  html: `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
    ">
      <div style="
        position: absolute;
        inset: 0;
        background: #FFD60A;
        border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.75;
      "></div>
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #FFD60A, #F59E0B);
        border: 4px solid #050505;
        border-radius: 50%;
        box-shadow: 0 0 20px #FFD60A, 0 0 40px rgba(255, 214, 10, 0.5);
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #050505;
          border-radius: 50%;
        "></div>
      </div>
    </div>
    <style>
      @keyframes ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    </style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Ícone para ponto de início - verde gaming
const startIcon = L.divIcon({
  className: 'start-marker',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: linear-gradient(135deg, #22C55E, #16A34A);
      border: 3px solid #050505;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

interface MapUpdaterProps {
  position: GeoPosition | null
  isTracking: boolean
}

// Componente para atualizar o centro do mapa
function MapUpdater({ position, isTracking }: MapUpdaterProps) {
  const map = useMap()
  const hasSetInitialView = useRef(false)

  useEffect(() => {
    if (position) {
      if (!hasSetInitialView.current) {
        map.setView([position.latitude, position.longitude], 17, { animate: true })
        hasSetInitialView.current = true
      } else if (isTracking) {
        map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.5 })
      }
    }
  }, [position, map, isTracking])

  return null
}

interface MapClientProps {
  position: GeoPosition | null
  path: { lat: number; lng: number }[]
  isTracking: boolean
  isPaused?: boolean
}

export default function MapClient({ position, path, isTracking, isPaused = false }: MapClientProps) {
  const mapRef = useRef<L.Map | null>(null)
  
  // Converte path para formato Leaflet
  const polylinePath = path.map(p => [p.lat, p.lng] as [number, number])
  
  // Posição inicial
  const defaultCenter: [number, number] = position 
    ? [position.latitude, position.longitude] 
    : [-23.5505, -46.6333]

  return (
    <MapContainer
      ref={mapRef}
      center={defaultCenter}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapUpdater position={position} isTracking={isTracking} />
      
      {/* Linha do percurso - amarelo */}
      {polylinePath.length > 1 && (
        <Polyline
          positions={polylinePath}
          pathOptions={{
            color: '#FFD60A',
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
      
      {/* Marcador de início */}
      {polylinePath.length > 0 && (
        <Marker
          position={polylinePath[0]}
          icon={startIcon}
        />
      )}
      
      {/* Marcador de posição atual */}
      {position && (
        <Marker
          position={[position.latitude, position.longitude]}
          icon={currentPositionIcon}
        />
      )}
    </MapContainer>
  )
}
