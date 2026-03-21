export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
  speed: number | null
  timestamp: number
}

export interface RunSession {
  id: string
  date: string
  startTime: string
  endTime: string
  duration: number // em segundos
  distance: number // em metros
  avgSpeed: number // km/h
  maxSpeed: number // km/h
  calories: number
  path: { lat: number; lng: number }[]
}

export interface WeightEntry {
  id: string
  date: string
  weight: number // em kg
  type: 'initial' | 'progress'
}

export interface WeeklyGoal {
  targetKm: number
  startDate: string // início da semana
}

export interface UserSettings {
  name: string
  weeklyGoalKm: number
  weight: number
}

export interface RunnerStats {
  totalRuns: number
  totalDistance: number
  totalTime: number
  totalCalories: number
  avgSpeed: number
  bestDistance: number
  bestTime: number
}
