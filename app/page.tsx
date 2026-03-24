'use client'

import { useState, useEffect } from 'react'
import { Activity, History, Scale, BarChart3, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RunTracker } from '@/components/run-tracker'
import { RunHistory } from '@/components/run-history'
import { WeightTracker } from '@/components/weight-tracker'
import { StatsOverview } from '@/components/stats-overview'
import { SettingsDialog } from '@/components/settings-dialog'
import { RunSession, WeightEntry } from '@/lib/types'
import { getRuns, getWeights, getSettings } from '@/lib/store'

export default function HomePage() {
  const [runs, setRuns] = useState<RunSession[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [userName, setUserName] = useState('Corredor')
  const [activeTab, setActiveTab] = useState('run')

  const loadData = () => {
    setRuns(getRuns())
    setWeights(getWeights())
    setUserName(getSettings().name)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRunComplete = () => {
    loadData()
    setTimeout(() => setActiveTab('history'), 500)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background grid-pattern overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary via-accent to-[#3B82F6] p-[2px]">
                  <div className="h-full w-full rounded-xl bg-background flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary via-accent to-[#3B82F6] rounded-xl blur opacity-30"></div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">
                  PULSE <span className="text-primary">RUN</span>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                  Olá, Kleber Gonçalves
                </p>
              </div>
            </div>

            {/* Stats rápidos + Settings */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm mr-2">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Corridas</div>
                  <div className="font-bold text-primary">{runs.length}</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                  <div className="font-bold text-foreground">
                    {(runs.reduce((acc, r) => acc + r.distance, 0) / 1000).toFixed(1)} km
                  </div>
                </div>
              </div>
              <SettingsDialog onSettingsChanged={loadData} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 pb-24 safe-area-bottom">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border p-1 h-14 touch-manipulation">
            <TabsTrigger 
              value="run" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold h-full haptic-feedback active:scale-95 transition-transform"
            >
              <Activity className="h-5 w-5" />
              <span className="hidden sm:inline">Correr</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold h-full haptic-feedback active:scale-95 transition-transform"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold h-full haptic-feedback active:scale-95 transition-transform"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="weight"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold h-full haptic-feedback active:scale-95 transition-transform"
            >
              <Scale className="h-5 w-5" />
              <span className="hidden sm:inline">Peso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-4 mt-4">
            <RunTracker onRunComplete={handleRunComplete} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <RunHistory runs={runs} onRunDeleted={loadData} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
            <StatsOverview runs={runs} weights={weights} />
          </TabsContent>

          <TabsContent value="weight" className="space-y-4 mt-4">
            <WeightTracker weights={weights} onWeightChanged={loadData} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">PULSE RUN</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Calorias: <strong className="text-accent">{runs.reduce((acc, r) => acc + r.calories, 0).toLocaleString()}</strong>
              </span>
              <span className="hidden sm:inline text-muted-foreground">
                Tempo: <strong className="text-foreground">{Math.floor(runs.reduce((acc, r) => acc + r.duration, 0) / 3600)}h {Math.floor((runs.reduce((acc, r) => acc + r.duration, 0) % 3600) / 60)}m</strong>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
