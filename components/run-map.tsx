'use client'

/**
 * Componente de Mapa - PULSE RUN
 * Usa Leaflet API direta (NÃO usa react-leaflet)
 * Carrega leaflet dinamicamente no useEffect para evitar erro SSR "window is not defined"
 * Atualizado: v2
 */
import { useEffect, useRef, useState } from 'react'
import { GeoPosition } from '@/lib/types'
import { ZoomIn, ZoomOut, Crosshair, Layers } from 'lucide-react'

interface RunMapProps {
  position: GeoPosition | null
  path: { lat: number; lng: number }[]
  isTracking: boolean
  isPaused?: boolean
}

type LeafletMap = any
type LeafletMarker = any
type LeafletPolyline = any
type LeafletTileLayer = any

export function RunMap({ position, path, isTracking, isPaused = false }: RunMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const polylineRef = useRef<LeafletPolyline | null>(null)
  const startMarkerRef = useRef<LeafletMarker | null>(null)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')

  // Carrega Leaflet dinamicamente
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

  const createCurrentIcon = (L: any) => {
    return L.divIcon({
      className: 'current-position-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="
            position: absolute;
            inset: -4px;
            background: #FFD60A;
            border-radius: 50%;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            opacity: 0.6;
          "></div>
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #FFD60A 0%, #F59E0B 100%);
            border: 4px solid #000;
            border-radius: 50%;
            box-shadow: 0 0 20px #FFD60A, 0 0 40px rgba(255, 214, 10, 0.4), inset 0 2px 4px rgba(255,255,255,0.3);
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 10px;
              height: 10px;
              background: #000;
              border-radius: 50%;
            "></div>
          </div>
        </div>
        <style>
          @keyframes ping {
            75%, 100% { transform: scale(2.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  const createStartIcon = (L: any) => {
    return L.divIcon({
      className: 'start-marker',
      html: `
        <div style="
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #22C55E, #16A34A);
          border: 3px solid #000;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), inset 0 2px 4px rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background: #000; border-radius: 2px;"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })
  }

  const getTileUrl = () => {
    if (mapStyle === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  // Inicializa o mapa
  useEffect(() => {
    if (!leaflet || !mapContainerRef.current || mapInstanceRef.current) return

    const L = leaflet
    const defaultCenter: [number, number] = position 
      ? [position.latitude, position.longitude] 
      : [-23.5505, -46.6333]

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    })

    tileLayerRef.current = L.tileLayer(getTileUrl(), {
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        polylineRef.current = null
        startMarkerRef.current = null
        tileLayerRef.current = null
        setMapReady(false)
      }
    }
  }, [leaflet])

  // Troca estilo do mapa
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !tileLayerRef.current) return
    
    tileLayerRef.current.setUrl(getTileUrl())
  }, [mapStyle, leaflet])

  // Atualiza posicao
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !position || !mapReady) return

    const L = leaflet
    const latLng: [number, number] = [position.latitude, position.longitude]

    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { icon: createCurrentIcon(L) }).addTo(mapInstanceRef.current)
      mapInstanceRef.current.setView(latLng, 17)
    } else {
      markerRef.current.setLatLng(latLng)
      if (isTracking && !isPaused) {
        mapInstanceRef.current.panTo(latLng, { animate: true, duration: 0.5 })
      }
    }
  }, [leaflet, position, isTracking, isPaused, mapReady])

  // Atualiza percurso
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !mapReady) return

    const L = leaflet
    const polylinePath = path.map(p => [p.lat, p.lng] as [number, number])

    if (polylinePath.length > 1) {
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(polylinePath, {
          color: '#FFD60A',
          weight: 6,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstanceRef.current)
        
        // Adiciona sombra ao percurso
        L.polyline(polylinePath, {
          color: '#000',
          weight: 10,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstanceRef.current).bringToBack()
      } else {
        polylineRef.current.setLatLngs(polylinePath)
      }
    }

    if (polylinePath.length > 0 && !startMarkerRef.current) {
      startMarkerRef.current = L.marker(polylinePath[0], { icon: createStartIcon(L) }).addTo(mapInstanceRef.current)
    }
  }, [leaflet, path, mapReady])

  // Controles do mapa
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()
  const handleCenterOnUser = () => {
    if (position && mapInstanceRef.current) {
      mapInstanceRef.current.setView([position.latitude, position.longitude], 17, { animate: true })
    }
  }
  const toggleMapStyle = () => setMapStyle(s => s === 'street' ? 'satellite' : 'street')

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '320px' }}>
      {/* Borda gaming animada */}
      <div className="absolute inset-0 rounded-xl p-[2px] bg-gradient-to-r from-primary via-accent to-[#3B82F6] animate-pulse z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #FFD60A, #EF4444, #3B82F6, #FFD60A)', backgroundSize: '300% 100%', animation: 'gradient-shift 3s ease infinite' }}>
        <div className="w-full h-full rounded-xl bg-background"></div>
      </div>
      
      {/* Container do mapa */}
      <div className="absolute inset-[3px] rounded-lg overflow-hidden z-20">
        <div 
          ref={mapContainerRef} 
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        />
        
        {/* Overlay superior com gradiente */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
        
        {/* Overlay inferior */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        
        {/* Cantos decorativos */}
        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary pointer-events-none"></div>
        
        {/* Controles do mapa */}
        {mapReady && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-black/80 hover:bg-primary hover:text-black text-white rounded-lg flex items-center justify-center transition-all border border-primary/50 hover:border-primary shadow-lg"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-black/80 hover:bg-primary hover:text-black text-white rounded-lg flex items-center justify-center transition-all border border-primary/50 hover:border-primary shadow-lg"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleCenterOnUser}
              className="w-10 h-10 bg-black/80 hover:bg-[#3B82F6] text-white rounded-lg flex items-center justify-center transition-all border border-[#3B82F6]/50 hover:border-[#3B82F6] shadow-lg"
            >
              <Crosshair className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMapStyle}
              className="w-10 h-10 bg-black/80 hover:bg-accent hover:text-white text-white rounded-lg flex items-center justify-center transition-all border border-accent/50 hover:border-accent shadow-lg"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-30">
          {isTracking && !isPaused && (
            <div className="gaming-card bg-accent/90 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              REC
            </div>
          )}
          {isPaused && (
            <div className="gaming-card bg-[#3B82F6]/90 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              PAUSADO
            </div>
          )}
          {!isTracking && !isPaused && position && (
            <div className="gaming-card bg-primary/90 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              PRONTO
            </div>
          )}
        </div>
        
        {/* Info do estilo de mapa */}
        <div className="absolute top-3 right-14 z-30">
          <div className="bg-black/70 text-white/80 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider">
            {mapStyle === 'street' ? 'Mapa' : 'Satelite'}
          </div>
        </div>
        
        {/* Precisao GPS */}
        {position && (
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/10 z-30">
            <div className={`w-2 h-2 rounded-full ${position.accuracy < 15 ? 'bg-[#22C55E]' : position.accuracy < 30 ? 'bg-primary' : 'bg-accent'}`}></div>
            <span className="text-white/60">GPS</span>
            <span className={position.accuracy < 15 ? 'text-[#22C55E]' : position.accuracy < 30 ? 'text-primary' : 'text-accent'}>
              {Math.round(position.accuracy)}m
            </span>
          </div>
        )}
        
        {/* Velocidade atual no mapa */}
        {position && position.speed !== null && position.speed > 0 && isTracking && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-primary/30 z-30">
            <span className="text-primary">{(position.speed * 3.6).toFixed(1)}</span>
            <span className="text-white/60">km/h</span>
          </div>
        )}
        
        {/* Loading */}
        {!mapReady && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-40">
            <div className="text-center p-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-primary text-lg font-bold tracking-widest">CARREGANDO</div>
              <div className="text-white/40 text-xs mt-1">Iniciando mapa...</div>
            </div>
          </div>
        )}
        
        {/* Aguardando GPS */}
        {mapReady && !position && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
            <div className="text-center p-6">
              <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-[#3B82F6] text-lg font-bold tracking-widest">LOCALIZANDO</div>
              <div className="text-white/40 text-xs mt-1">Aguardando sinal GPS...</div>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS para animacao do gradiente */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
