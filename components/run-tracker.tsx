'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Play, Square, RotateCcw, MapPin, Zap, Flame, Gauge, Timer, Pause, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useGeolocation } from '@/hooks/use-geolocation'
import { 
  saveRun, 
  getSettings,
  getWeeklyDistance,
  calculateCalories, 
  formatDuration, 
  formatDistance, 
  formatSpeed,
  formatPace,
  generateId,
  playSound,
} from '@/lib/store'
import { RunSession } from '@/lib/types'

// Lazy load do mapa
const RunMap = lazy(() => import('./run-map').then(mod => ({ default: mod.RunMap })))

interface RunTrackerProps {
  onRunComplete: (run: RunSession) => void
}

export function RunTracker({ onRunComplete }: RunTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [pausedTime, setPausedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [userWeight, setUserWeight] = useState(70)
  const [weeklyGoal, setWeeklyGoal] = useState(20)
  const [weeklyDistance, setWeeklyDistance] = useState(0)

  const {
    position,
    error,
    isTracking,
    isPaused,
    path,
    totalDistance,
    currentSpeed,
    maxSpeed,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
  } = useGeolocation()

  // Carrega configurações
  useEffect(() => {
    const settings = getSettings()
    setUserWeight(settings.weight)
    setWeeklyGoal(settings.weeklyGoalKm)
    setWeeklyDistance(getWeeklyDistance())
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, isPaused])

  const avgSpeed = elapsedTime > 0 
    ? (totalDistance / 1000) / (elapsedTime / 3600) 
    : 0

  const calories = calculateCalories(userWeight, elapsedTime / 60, avgSpeed)
  
  // Progresso semanal
  const weeklyProgress = Math.min(100, ((weeklyDistance + totalDistance) / 1000 / weeklyGoal) * 100)

  const handleStart = useCallback(() => {
    setIsRunning(true)
    setStartTime(new Date())
    setElapsedTime(0)
    setPausedTime(0)
    startTracking()
    playSound('start')
  }, [startTracking])

  const handlePause = useCallback(() => {
    pauseTracking()
    setPausedTime(elapsedTime)
    playSound('pause')
  }, [pauseTracking, elapsedTime])

  const handleResume = useCallback(() => {
    resumeTracking()
    playSound('resume')
  }, [resumeTracking])

  const handleStop = useCallback(() => {
    setIsRunning(false)
    stopTracking()
    playSound('stop')

    if (startTime && elapsedTime > 10) { // Mínimo 10 segundos para salvar
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
    setPausedTime(0)
    setStartTime(null)
    resetTracking()
  }, [resetTracking])

  return (
    <div className="space-y-4">
      {/* Meta Semanal */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-muted-foreground uppercase tracking-wider text-xs">Meta Semanal</span>
            </div>
            <span className="text-sm font-bold">
              <span className="text-primary">{((weeklyDistance + totalDistance) / 1000).toFixed(1)}</span>
              <span className="text-muted-foreground"> / {weeklyGoal} km</span>
            </span>
          </div>
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#3B82F6] via-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${weeklyProgress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-muted-foreground">{weeklyProgress.toFixed(0)}% completo</span>
          </div>
        </CardContent>
      </Card>

      {/* Mapa - Sempre visível */}
      <Suspense fallback={
        <div className="w-full h-[280px] md:h-[350px] rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div className="text-muted-foreground text-sm">Carregando mapa...</div>
          </div>
        </div>
      }>
        <RunMap 
          position={position} 
          path={path} 
          isTracking={isTracking}
          isPaused={isPaused}
        />
      </Suspense>

      {/* Timer Principal */}
      <Card className={`bg-card border-2 ${isRunning && !isPaused ? 'border-primary glow-yellow' : isPaused ? 'border-[#3B82F6] glow-blue' : 'border-border'} transition-all duration-300`}>
        <CardContent className="p-6 text-center">
          <div className={`text-5xl md:text-7xl font-mono font-black tracking-wider transition-colors ${isRunning && !isPaused ? 'text-primary neon-text' : isPaused ? 'text-[#3B82F6]' : 'text-foreground'}`}>
            {formatDuration(elapsedTime)}
          </div>
          <div className="text-muted-foreground mt-2 uppercase tracking-[0.2em] text-xs">
            {isPaused ? 'PAUSADO' : isRunning ? 'CORRENDO' : 'TEMPO DE CORRIDA'}
          </div>
        </CardContent>
      </Card>

      {/* Status GPS */}
      {error && (
        <div className="bg-accent/20 border border-accent text-accent-foreground px-4 py-3 rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid - 2x3 */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {/* Distância */}
        <Card className="bg-card border-border stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Distância</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground">
              {formatDistance(totalDistance)}
            </div>
          </CardContent>
        </Card>

        {/* Velocidade Atual */}
        <Card className="bg-card border-border stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Gauge className="h-3 w-3 md:h-4 md:w-4 text-[#3B82F6]" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Velocidade</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-[#3B82F6]">
              {formatSpeed(currentSpeed)}
            </div>
          </CardContent>
        </Card>

        {/* Pace */}
        <Card className="bg-card border-border stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Timer className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Pace</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground">
              {formatPace(avgSpeed)}
            </div>
          </CardContent>
        </Card>

        {/* Vel. Média */}
        <Card className="bg-card border-border stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Zap className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Média</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground">
              {formatSpeed(avgSpeed)}
            </div>
          </CardContent>
        </Card>

        {/* Vel. Máxima */}
        <Card className="bg-card border-border stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Zap className="h-3 w-3 md:h-4 md:w-4 text-accent" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Máxima</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-accent">
              {formatSpeed(maxSpeed)}
            </div>
          </CardContent>
        </Card>

        {/* Calorias */}
        <Card className="bg-card border-accent/30 stats-card col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Flame className="h-3 w-3 md:h-4 md:w-4 text-accent" />
              <span className="text-[10px] md:text-xs uppercase tracking-wider">Calorias</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-accent">
              {calories}
              <span className="text-xs font-normal text-muted-foreground ml-1">kcal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Controle */}
      <div className="flex justify-center items-center gap-4 pt-2">
        {!isRunning ? (
          <>
            <Button
              size="lg"
              onClick={handleStart}
              className="h-20 w-20 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 glow-yellow btn-gaming text-lg font-bold"
            >
              <Play className="h-10 w-10" fill="currentColor" />
            </Button>
            {elapsedTime > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="h-14 w-14 rounded-full border-2 border-muted-foreground hover:border-primary"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Botão de Pausa/Continuar */}
            {!isPaused ? (
              <Button
                size="lg"
                onClick={handlePause}
                className="h-16 w-16 rounded-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 glow-blue"
              >
                <Pause className="h-8 w-8" fill="currentColor" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleResume}
                className="h-16 w-16 rounded-full bg-[#22C55E] text-white hover:bg-[#22C55E]/90"
              >
                <Play className="h-8 w-8" fill="currentColor" />
              </Button>
            )}
            
            {/* Botão de Parar */}
            <Button
              size="lg"
              onClick={handleStop}
              className="h-20 w-20 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 glow-red btn-gaming"
            >
              <Square className="h-10 w-10" fill="currentColor" />
            </Button>
          </>
        )}
      </div>

      {/* Instrução */}
      <p className="text-center text-sm text-muted-foreground">
        {!isRunning 
          ? 'Pressione PLAY para iniciar sua corrida' 
          : isPaused
          ? 'Pressione PLAY para continuar ou STOP para finalizar'
          : 'PAUSE para pausar ou STOP para finalizar'}
      </p>
    </div>
  )
}
