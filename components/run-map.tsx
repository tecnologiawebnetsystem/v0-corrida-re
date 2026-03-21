'use client'

import { useEffect, useRef, useState } from 'react'
import { GeoPosition } from '@/lib/types'

interface RunMapProps {
  position: GeoPosition | null
  path: { lat: number; lng: number }[]
  isTracking: boolean
  isPaused?: boolean
}

// Tipos para Leaflet
type LeafletMap = any
type LeafletMarker = any
type LeafletPolyline = any

export function RunMap({ position, path, isTracking, isPaused = false }: RunMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const polylineRef = useRef<LeafletPolyline | null>(null)
  const startMarkerRef = useRef<LeafletMarker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)

  // Carrega Leaflet dinamicamente no cliente
  useEffect(() => {
    let isMounted = true
    
    const loadLeaflet = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      
      if (isMounted) {
        setLeaflet(L)
      }
    }
    
    loadLeaflet()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Cria o icone do marcador atual
  const createCurrentIcon = (L: any) => {
    return L.divIcon({
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
  }

  // Cria o icone do ponto inicial
  const createStartIcon = (L: any) => {
    return L.divIcon({
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
  }

  // Inicializa o mapa quando Leaflet estiver carregado
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current || mapInstanceRef.current) return

    const L = leaflet
    const defaultCenter: [number, number] = position 
      ? [position.latitude, position.longitude] 
      : [-23.5505, -46.6333]

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        polylineRef.current = null
        startMarkerRef.current = null
        setMapReady(false)
      }
    }
  }, [leaflet])

  // Atualiza a posicao do marcador
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !position || !mapReady) return

    const L = leaflet
    const latLng: [number, number] = [position.latitude, position.longitude]

    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { icon: createCurrentIcon(L) }).addTo(mapInstanceRef.current)
      mapInstanceRef.current.setView(latLng, 17)
    } else {
      markerRef.current.setLatLng(latLng)
      if (isTracking) {
        mapInstanceRef.current.panTo(latLng, { animate: true, duration: 0.5 })
      }
    }
  }, [leaflet, position, isTracking, mapReady])

  // Atualiza a linha do percurso
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !mapReady) return

    const L = leaflet
    const polylinePath = path.map(p => [p.lat, p.lng] as [number, number])

    if (polylinePath.length > 1) {
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(polylinePath, {
          color: '#FFD60A',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstanceRef.current)
      } else {
        polylineRef.current.setLatLngs(polylinePath)
      }
    }

    // Marcador de inicio
    if (polylinePath.length > 0 && !startMarkerRef.current) {
      startMarkerRef.current = L.marker(polylinePath[0], { icon: createStartIcon(L) }).addTo(mapInstanceRef.current)
    }
  }, [leaflet, path, mapReady])

  return (
    <div className="relative w-full h-[280px] md:h-[350px] rounded-xl overflow-hidden gaming-border">
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
      />
      
      {/* Overlay gradiente nas bordas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/80 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/80 to-transparent"></div>
      </div>
      
      {/* Loading do mapa */}
      {!mapReady && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-primary text-lg font-bold tracking-wider">CARREGANDO MAPA</div>
          </div>
        </div>
      )}
      
      {/* Overlay quando nao tem posicao */}
      {mapReady && !position && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-primary text-lg font-bold tracking-wider">LOCALIZANDO</div>
            <div className="text-muted-foreground text-sm mt-1">Obtendo sua posicao GPS...</div>
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
      
      {/* Precisao GPS */}
      {position && (
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
          GPS: <span className={position.accuracy < 15 ? 'text-[#22C55E]' : position.accuracy < 30 ? 'text-primary' : 'text-accent'}>{Math.round(position.accuracy)}m</span>
        </div>
      )}
    </div>
  )
}
