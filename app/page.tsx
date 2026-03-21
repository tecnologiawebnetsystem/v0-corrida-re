'use client'

import { useState, useEffect } from 'react'
import { Activity, History, Scale, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RunTracker } from '@/components/run-tracker'
import { RunHistory } from '@/components/run-history'
import { WeightTracker } from '@/components/weight-tracker'
import { RunSession, WeightEntry } from '@/lib/types'
import { getRuns, getWeights } from '@/lib/store'

export default function HomePage() {
  const [runs, setRuns] = useState<RunSession[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [activeTab, setActiveTab] = useState('run')

  const loadData = () => {
    setRuns(getRuns())
    setWeights(getWeights())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRunComplete = (run: RunSession) => {
    loadData()
    setTimeout(() => setActiveTab('history'), 500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center glow-yellow">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  PROJECT<span className="text-primary">_RUN</span>
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Rastreador de Corrida
                </p>
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Corridas</div>
                <div className="font-bold text-primary">{runs.length}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Distância Total</div>
                <div className="font-bold text-foreground">
                  {(runs.reduce((acc, r) => acc + r.distance, 0) / 1000).toFixed(1)} km
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1">
            <TabsTrigger 
              value="run" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Correr</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger 
              value="weight"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            >
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Peso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-6">
            <RunTracker onRunComplete={handleRunComplete} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <RunHistory runs={runs} onRunDeleted={loadData} />
          </TabsContent>

          <TabsContent value="weight" className="space-y-6">
            <WeightTracker weights={weights} onWeightChanged={loadData} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>Calorias Totais: <strong className="text-accent">{runs.reduce((acc, r) => acc + r.calories, 0).toLocaleString()} kcal</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Tempo Total: <strong className="text-foreground">{Math.floor(runs.reduce((acc, r) => acc + r.duration, 0) / 3600)}h {Math.floor((runs.reduce((acc, r) => acc + r.duration, 0) % 3600) / 60)}min</strong></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
