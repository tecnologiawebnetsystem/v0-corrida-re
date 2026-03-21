'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface Position {
  lat: number
  lng: number
  accuracy: number
  speed: number | null
  timestamp: number
}

interface GeolocationState {
  position: Position | null
  error: string | null
  isTracking: boolean
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
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isTracking: false,
    path: [],
    totalDistance: 0,
    currentSpeed: 0,
    maxSpeed: 0,
  })

  const watchIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef<Position | null>(null)

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
      path: [],
      totalDistance: 0,
      maxSpeed: 0,
      error: null,
    }))
    lastPositionRef.current = null

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        }

        let distance = 0
        let speedKmh = 0

        if (lastPositionRef.current) {
          distance = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            newPosition.lat,
            newPosition.lng
          )

          // Calcula velocidade se não disponível do GPS
          if (newPosition.speed !== null && newPosition.speed >= 0) {
            speedKmh = newPosition.speed * 3.6 // m/s para km/h
          } else {
            const timeDiff =
              (newPosition.timestamp - lastPositionRef.current.timestamp) / 1000
            if (timeDiff > 0) {
              speedKmh = (distance / timeDiff) * 3.6
            }
          }
        }

        // Só adiciona ao path se moveu mais de 5 metros (filtro de ruído)
        const shouldAddToPath = distance >= 5 || !lastPositionRef.current

        setState((prev) => ({
          ...prev,
          position: newPosition,
          path: shouldAddToPath
            ? [...prev.path, { lat: newPosition.lat, lng: newPosition.lng }]
            : prev.path,
          totalDistance: prev.totalDistance + (shouldAddToPath ? distance : 0),
          currentSpeed: speedKmh,
          maxSpeed: Math.max(prev.maxSpeed, speedKmh),
        }))

        if (shouldAddToPath) {
          lastPositionRef.current = newPosition
        }
      },
      (err) => {
        let errorMsg = 'Erro ao obter localização'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada'
            break
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível'
            break
          case err.TIMEOUT:
            errorMsg = 'Tempo limite excedido'
            break
        }
        setState((prev) => ({ ...prev, error: errorMsg }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setState((prev) => ({ ...prev, isTracking: false }))
  }, [])

  const resetTracking = useCallback(() => {
    stopTracking()
    setState({
      position: null,
      error: null,
      isTracking: false,
      path: [],
      totalDistance: 0,
      currentSpeed: 0,
      maxSpeed: 0,
    })
    lastPositionRef.current = null
  }, [stopTracking])

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
    stopTracking,
    resetTracking,
  }
}
