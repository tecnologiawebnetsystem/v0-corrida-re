'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GeoPosition } from '@/lib/types'

// Ícone customizado para posição atual (amarelo/preto gaming style)
const currentPositionIcon = L.divIcon({
  className: 'current-position-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #FACC15;
      border: 3px solid #000;
      border-radius: 50%;
      box-shadow: 0 0 15px #FACC15, 0 0 30px #FACC1580;
      animation: pulse 1.5s ease-in-out infinite;
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Ícone para ponto de início (verde)
const startIcon = L.divIcon({
  className: 'start-marker',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #22C55E;
      border: 2px solid #000;
      border-radius: 50%;
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface MapUpdaterProps {
  position: GeoPosition | null
  path: GeoPosition[]
  isTracking: boolean
}

// Componente para atualizar o centro do mapa
function MapUpdater({ position, isTracking }: MapUpdaterProps) {
  const map = useMap()
  const hasSetInitialView = useRef(false)

  useEffect(() => {
    if (position && isTracking) {
      if (!hasSetInitialView.current) {
        map.setView([position.latitude, position.longitude], 17)
        hasSetInitialView.current = true
      } else {
        map.panTo([position.latitude, position.longitude], { animate: true })
      }
    }
  }, [position, map, isTracking])

  useEffect(() => {
    if (!isTracking) {
      hasSetInitialView.current = false
    }
  }, [isTracking])

  return null
}

interface RunMapProps {
  position: GeoPosition | null
  path: GeoPosition[]
  isTracking: boolean
}

export function RunMap({ position, path, isTracking }: RunMapProps) {
  // Converte path para formato Leaflet
  const polylinePath = path.map(p => [p.latitude, p.longitude] as [number, number])
  
  // Posição inicial padrão (São Paulo)
  const defaultCenter: [number, number] = position 
    ? [position.latitude, position.longitude] 
    : [-23.5505, -46.6333]

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border-2 border-primary">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater position={position} path={path} isTracking={isTracking} />
        
        {/* Linha do percurso */}
        {polylinePath.length > 1 && (
          <Polyline
            positions={polylinePath}
            pathOptions={{
              color: '#FACC15',
              weight: 5,
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
      
      {/* Overlay quando não está rastreando */}
      {!isTracking && !position && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-primary text-lg font-bold">Aguardando GPS</div>
            <div className="text-muted-foreground text-sm">Pressione PLAY para iniciar</div>
          </div>
        </div>
      )}
      
      {/* Indicador de rastreamento ativo */}
      {isTracking && (
        <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse"></span>
          GRAVANDO
        </div>
      )}
    </div>
  )
}
