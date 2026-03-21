'use client'

import { RunSession, WeightEntry, UserSettings } from './types'

const RUNS_KEY = 'nitro_run_sessions'
const WEIGHTS_KEY = 'nitro_run_weights'
const SETTINGS_KEY = 'nitro_run_settings'

// Configurações do usuário
export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return { name: 'Corredor', weeklyGoalKm: 20, weight: 70 }
  const data = localStorage.getItem(SETTINGS_KEY)
  return data ? JSON.parse(data) : { name: 'Corredor', weeklyGoalKm: 20, weight: 70 }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }
}

// Corridas
export function saveRun(run: RunSession): void {
  const runs = getRuns()
  runs.unshift(run)
  if (typeof window !== 'undefined') {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs))
  }
}

export function getRuns(): RunSession[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(RUNS_KEY)
  return data ? JSON.parse(data) : []
}

export function deleteRun(id: string): void {
  const runs = getRuns().filter(r => r.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs))
  }
}

// Calcula km desta semana
export function getWeeklyDistance(): number {
  const runs = getRuns()
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Domingo
  startOfWeek.setHours(0, 0, 0, 0)

  return runs
    .filter(run => new Date(run.date) >= startOfWeek)
    .reduce((total, run) => total + run.distance, 0)
}

// Peso
export function saveWeight(entry: WeightEntry): void {
  const weights = getWeights()
  weights.unshift(entry)
  if (typeof window !== 'undefined') {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights))
  }
}

export function getWeights(): WeightEntry[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(WEIGHTS_KEY)
  return data ? JSON.parse(data) : []
}

export function deleteWeight(id: string): void {
  const weights = getWeights().filter(w => w.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights))
  }
}

export function calculateCalories(
  weightKg: number,
  durationMinutes: number,
  speedKmh: number
): number {
  // MET (Metabolic Equivalent of Task) baseado na velocidade
  let met = 6 // caminhada rápida
  if (speedKmh >= 8) met = 8.3  // corrida leve
  if (speedKmh >= 10) met = 9.8 // corrida moderada
  if (speedKmh >= 12) met = 11.0 // corrida rápida
  if (speedKmh >= 14) met = 12.8 // corrida muito rápida
  if (speedKmh >= 16) met = 14.5 // sprint

  // Fórmula: Calorias = MET × peso(kg) × tempo(horas)
  const hours = durationMinutes / 60
  return Math.round(met * weightKg * hours)
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

export function formatPace(kmh: number): string {
  if (kmh <= 0) return '--:--'
  const minPerKm = 60 / kmh
  const mins = Math.floor(minPerKm)
  const secs = Math.round((minPerKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')} /km`
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Feedback sonoro
export function playSound(type: 'start' | 'pause' | 'stop' | 'resume'): void {
  if (typeof window === 'undefined') return
  
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // Configurações baseadas no tipo
  switch (type) {
    case 'start':
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
      oscillator.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.1) // D6
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      break
    case 'pause':
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime) // E5
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      break
    case 'resume':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      break
    case 'stop':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(392, audioContext.currentTime + 0.15) // G4
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
      break
  }
  
  // Vibração se disponível
  if ('vibrate' in navigator) {
    navigator.vibrate(type === 'start' ? [100, 50, 100] : type === 'stop' ? [200] : [50])
  }
}
