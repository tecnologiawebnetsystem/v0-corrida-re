'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Play, Square, RotateCcw, MapPin, Zap, Flame, Gauge, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGeolocation } from '@/hooks/use-geolocation'
import { 
  saveRun, 
  getWeights, 
  calculateCalories, 
  formatDuration, 
  formatDistance, 
  formatSpeed,
  formatPace,
  generateId 
} from '@/lib/store'
import { RunSession } from '@/lib/types'

// Lazy load do mapa para melhor performance
const RunMap = lazy(() => import('./run-map').then(mod => ({ default: mod.RunMap })))

interface RunTrackerProps {
  onRunComplete: (run: RunSession) => void
}

export function RunTracker({ onRunComplete }: RunTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [userWeight, setUserWeight] = useState(70)
  const [showMap, setShowMap] = useState(false)

  const {
    position,
    error,
    isTracking,
    path,
    totalDistance,
    currentSpeed,
    maxSpeed,
    startTracking,
    stopTracking,
    resetTracking,
  } = useGeolocation()

  // Carrega peso do usuário
  useEffect(() => {
    const weights = getWeights()
    if (weights.length > 0) {
      setUserWeight(weights[0].weight)
    }
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning])

  // Mostra o mapa quando começa a rastrear
  useEffect(() => {
    if (isTracking) {
      setShowMap(true)
    }
  }, [isTracking])

  const avgSpeed = elapsedTime > 0 
    ? (totalDistance / 1000) / (elapsedTime / 3600) 
    : 0

  const calories = calculateCalories(userWeight, elapsedTime / 60, avgSpeed)

  const handleStart = useCallback(() => {
    setIsRunning(true)
    setStartTime(new Date())
    setElapsedTime(0)
    startTracking()
  }, [startTracking])

  const handleStop = useCallback(() => {
    setIsRunning(false)
    stopTracking()

    if (startTime && elapsedTime > 0) {
      const run: RunSession = {
        id: generateId(),
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().split(' ')[0],
        endTime: new Date().toTimeString().split(' ')[0],
        duration: elapsedTime,
        distance: totalDistance,
        avgSpeed,
        maxSpeed,
        calories,
        path,
      }
      
      saveRun(run)
      onRunComplete(run)
    }
  }, [startTime, elapsedTime, totalDistance, avgSpeed, maxSpeed, calories, path, stopTracking, onRunComplete])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setElapsedTime(0)
    setStartTime(null)
    setShowMap(false)
    resetTracking()
  }, [resetTracking])

  return (
    <div className="space-y-6">
      {/* Header com logo */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2">
          <Navigation className="h-6 w-6 text-primary" />
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Rastreamento GPS</span>
        </div>
      </div>

      {/* Mapa */}
      {showMap && (
        <Suspense fallback={
          <div className="w-full h-[300px] md:h-[400px] rounded-lg bg-card border-2 border-primary flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-muted-foreground text-sm">Carregando mapa...</div>
            </div>
          </div>
        }>
          <RunMap 
            position={position} 
            path={path} 
            isTracking={isTracking} 
          />
        </Suspense>
      )}

      {/* Timer Principal */}
      <Card className="bg-card border-2 border-primary/50 glow-yellow">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="text-5xl md:text-7xl font-mono font-bold text-primary tracking-wider">
            {formatDuration(elapsedTime)}
          </div>
          <div className="text-muted-foreground mt-2 uppercase tracking-widest text-xs">
            Tempo de Corrida
          </div>
        </CardContent>
      </Card>

      {/* Status GPS */}
      {error && (
        <div className="bg-accent/20 border border-accent text-accent-foreground px-4 py-3 rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      {isTracking && position && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary animate-pulse" />
          <span>GPS Ativo - Precisão: <span className="text-primary font-mono">{Math.round(position.accuracy)}m</span></span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card className="bg-card border-border stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">Distância</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              {formatDistance(totalDistance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">Velocidade</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              {formatSpeed(currentSpeed)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">Vel. Média</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              {formatSpeed(avgSpeed)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {formatPace(avgSpeed)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border stats-card border-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-wider">Calorias</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-accent">
              {calories}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              kcal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Velocidade Máxima */}
      <Card className="bg-card border-border gaming-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm uppercase tracking-wider">Velocidade Máxima</span>
            </div>
            <div className="text-xl font-bold font-mono text-primary">
              {formatSpeed(maxSpeed)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Controle */}
      <div className="flex justify-center gap-4 pt-2">
        {!isRunning ? (
          <>
            <Button
              size="lg"
              onClick={handleStart}
              className="h-20 w-20 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 glow-yellow text-lg font-bold"
            >
              <Play className="h-10 w-10" fill="currentColor" />
            </Button>
            {elapsedTime > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="h-16 w-16 rounded-full border-2 border-muted-foreground hover:border-primary"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}
          </>
        ) : (
          <Button
            size="lg"
            onClick={handleStop}
            className="h-20 w-20 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 glow-red"
          >
            <Square className="h-10 w-10" fill="currentColor" />
          </Button>
        )}
      </div>

      {/* Instrução */}
      <p className="text-center text-sm text-muted-foreground">
        {!isRunning 
          ? 'Pressione PLAY para iniciar sua corrida' 
          : 'Pressione STOP para finalizar e salvar'}
      </p>
    </div>
  )
}
