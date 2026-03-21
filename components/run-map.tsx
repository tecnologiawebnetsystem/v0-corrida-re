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

interface RunMapProps {
  position: GeoPosition | null
  path: { lat: number; lng: number }[]
  isTracking: boolean
  isPaused?: boolean
}

export function RunMap({ position, path, isTracking, isPaused = false }: RunMapProps) {
  // Converte path para formato Leaflet
  const polylinePath = path.map(p => [p.lat, p.lng] as [number, number])
  
  // Posição inicial
  const defaultCenter: [number, number] = position 
    ? [position.latitude, position.longitude] 
    : [-23.5505, -46.6333]

  return (
    <div className="relative w-full h-[280px] md:h-[350px] rounded-xl overflow-hidden gaming-border">
      <MapContainer
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
      
      {/* Overlay gradiente nas bordas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/80 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/80 to-transparent"></div>
      </div>
      
      {/* Overlay quando não tem posição */}
      {!position && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-primary text-lg font-bold tracking-wider">LOCALIZANDO</div>
            <div className="text-muted-foreground text-sm mt-1">Obtendo sua posição GPS...</div>
          </div>
        </div>
      )}
      
      {/* Status badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        {isTracking && !isPaused && (
          <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 pulse-red">
            <span className="w-2 h-2 bg-accent-foreground rounded-full"></span>
            GRAVANDO
          </div>
        )}
        {isPaused && (
          <div className="bg-[#3B82F6] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            PAUSADO
          </div>
        )}
      </div>
      
      {/* Precisão GPS */}
      {position && (
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
          GPS: <span className={position.accuracy < 15 ? 'text-[#22C55E]' : position.accuracy < 30 ? 'text-primary' : 'text-accent'}>{Math.round(position.accuracy)}m</span>
        </div>
      )}
    </div>
  )
}
