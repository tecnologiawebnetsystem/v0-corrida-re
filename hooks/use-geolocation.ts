'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GeoPosition } from '@/lib/types'

interface GeolocationState {
  position: GeoPosition | null
  error: string | null
  isTracking: boolean
  isPaused: boolean
  path: { lat: number; lng: number }[]
  totalDistance: number
  currentSpeed: number
  maxSpeed: number
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // raio da Terra em metros
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Obtém a posição atual com alta precisão, ignorando qualquer cache do sistema.
 * Estratégia dupla: primeiro tenta sem timeout longo; se vier posição imprecisa (>200m),
 * tenta novamente para forçar leitura do GPS real do dispositivo.
 */
function fetchFreshPosition(
  onSuccess: (pos: GeolocationPosition) => void,
  onError: (err: GeolocationPositionError) => void
) {
  if (!navigator.geolocation) {
    onError({ code: 2, message: 'Geolocalização não suportada', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
    return
  }

  // Primeira tentativa: sem cache, timeout rápido (5s)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // Se a precisão for muito ruim (>500m = provavelmente cache ou IP), tenta de novo com mais tempo
      if (pos.coords.accuracy > 500) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        )
      } else {
        onSuccess(pos)
      }
    },
    () => {
      // Se a primeira falhou por timeout, tenta com mais tempo
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      )
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0, // Nunca usar cache — força o GPS real
    }
  )
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isTracking: false,
    isPaused: false,
    path: [],
    totalDistance: 0,
    currentSpeed: 0,
    maxSpeed: 0,
  })

  const watchIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef<GeoPosition | null>(null)
  const pausedDistanceRef = useRef<number>(0)
  const pausedPathRef = useRef<{ lat: number; lng: number }[]>([])

  // Obter localização atual (uma vez) — sem cache, forçando GPS real
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização não suportada pelo navegador',
      }))
      return
    }

    fetchFreshPosition(
      (pos) => {
        setState((prev) => ({
          ...prev,
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          },
          error: null,
        }))
      },
      (err) => {
        let errorMsg = 'Erro ao obter localização'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada. Ative nas configurações do navegador.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível. Certifique-se de estar com GPS ativado.'
            break
          case err.TIMEOUT:
            errorMsg = 'Tempo limite excedido. Verifique se o GPS está ativado.'
            break
        }
        setState((prev) => ({ ...prev, error: errorMsg }))
      }
    )
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização não suportada pelo navegador',
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      isTracking: true,
      isPaused: false,
      path: [],
      totalDistance: 0,
      maxSpeed: 0,
      error: null,
    }))
    lastPositionRef.current = null
    pausedDistanceRef.current = 0
    pausedPathRef.current = []

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Ignorar posições com precisão muito ruim durante o rastreamento
        if (pos.coords.accuracy > 100) return

        const newPosition: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        }

        setState((prev) => {
          // Se estiver pausado, só atualiza posição
          if (prev.isPaused) {
            return { ...prev, position: newPosition }
          }

          let distance = 0
          let speedKmh = 0

          if (lastPositionRef.current) {
            distance = calculateDistance(
              lastPositionRef.current.latitude,
              lastPositionRef.current.longitude,
              newPosition.latitude,
              newPosition.longitude
            )

            // Calcula velocidade
            if (newPosition.speed !== null && newPosition.speed >= 0) {
              speedKmh = newPosition.speed * 3.6
            } else {
              const timeDiff =
                (newPosition.timestamp - lastPositionRef.current.timestamp) / 1000
              if (timeDiff > 0) {
                speedKmh = (distance / timeDiff) * 3.6
              }
            }
          }

          // Só adiciona ao path se moveu mais de 3 metros e precisão boa (< 30m)
          const shouldAddToPath =
            (distance >= 3 || !lastPositionRef.current) &&
            newPosition.accuracy < 30

          if (shouldAddToPath) {
            lastPositionRef.current = newPosition
          }

          return {
            ...prev,
            position: newPosition,
            path: shouldAddToPath
              ? [...prev.path, { lat: newPosition.latitude, lng: newPosition.longitude }]
              : prev.path,
            totalDistance: prev.totalDistance + (shouldAddToPath ? distance : 0),
            currentSpeed: speedKmh,
            maxSpeed: Math.max(prev.maxSpeed, speedKmh),
          }
        })
      },
      (err) => {
        let errorMsg = 'Erro ao obter localização'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada. Ative nas configurações do navegador.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível. Verifique se o GPS está ativado.'
            break
          case err.TIMEOUT:
            errorMsg = 'Tempo limite excedido ao rastrear.'
            break
        }
        setState((prev) => ({ ...prev, error: errorMsg }))
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Mais tolerante durante rastreamento contínuo
        maximumAge: 0,  // Nunca usar cache durante corrida
      }
    )
  }, [])

  const pauseTracking = useCallback(() => {
    setState((prev) => {
      pausedDistanceRef.current = prev.totalDistance
      pausedPathRef.current = prev.path
      return { ...prev, isPaused: true, currentSpeed: 0 }
    })
  }, [])

  const resumeTracking = useCallback(() => {
    lastPositionRef.current = null // Reset para não calcular distância do ponto de pausa
    setState((prev) => ({ ...prev, isPaused: false }))
  }, [])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setState((prev) => ({ ...prev, isTracking: false, isPaused: false }))
  }, [])

  const resetTracking = useCallback(() => {
    stopTracking()
    setState({
      position: null,
      error: null,
      isTracking: false,
      isPaused: false,
      path: [],
      totalDistance: 0,
      currentSpeed: 0,
      maxSpeed: 0,
    })
    lastPositionRef.current = null
    pausedDistanceRef.current = 0
    pausedPathRef.current = []
  }, [stopTracking])

  // Obter localização inicial ao montar — sem cache
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    ...state,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
    getCurrentLocation,
  }
}
