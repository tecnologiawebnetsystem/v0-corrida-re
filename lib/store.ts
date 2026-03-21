'use client'

import { RunSession, WeightEntry } from './types'

const RUNS_KEY = 'project_run_sessions'
const WEIGHTS_KEY = 'project_run_weights'

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
