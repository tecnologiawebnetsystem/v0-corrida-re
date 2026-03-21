'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, RotateCcw, MapPin, Zap, Timer, Flame, Gauge } from 'lucide-react'
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

interface RunTrackerProps {
  onRunComplete: (run: RunSession) => void
}

export function RunTracker({ onRunComplete }: RunTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [userWeight, setUserWeight] = useState(70)

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
    resetTracking()
  }, [resetTracking])

  return (
    <div className="space-y-6">
      {/* Timer Principal */}
      <Card className="bg-card border-border glow-yellow">
        <CardContent className="p-8 text-center">
          <div className="text-6xl md:text-8xl font-mono font-bold text-primary tracking-wider">
            {formatDuration(elapsedTime)}
          </div>
          <div className="text-muted-foreground mt-2 uppercase tracking-widest text-sm">
            Tempo de Corrida
          </div>
        </CardContent>
      </Card>

      {/* Status GPS */}
      {error && (
        <div className="bg-accent/20 border border-accent text-accent-foreground px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {isTracking && position && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>GPS Ativo - Precisão: {Math.round(position.accuracy)}m</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Distância</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {formatDistance(totalDistance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Velocidade</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {formatSpeed(currentSpeed)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Vel. Média</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {formatSpeed(avgSpeed)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPace(avgSpeed)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-wider">Calorias</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-accent">
              {calories}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              kcal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Velocidade Máxima */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm uppercase tracking-wider">Velocidade Máxima</span>
            </div>
            <div className="text-xl font-bold text-primary">
              {formatSpeed(maxSpeed)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Controle */}
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <>
            <Button
              size="lg"
              onClick={handleStart}
              className="h-16 w-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 glow-yellow"
            >
              <Play className="h-8 w-8" />
            </Button>
            {elapsedTime > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="h-16 w-16 rounded-full border-muted-foreground"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}
          </>
        ) : (
          <Button
            size="lg"
            onClick={handleStop}
            className="h-16 w-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 glow-red"
          >
            <Square className="h-8 w-8" />
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
