'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, MapPin, Flame, Clock, TrendingUp, Zap } from 'lucide-react'
import { RunSession, WeightEntry } from '@/lib/types'
import { formatDuration, formatDistance } from '@/lib/store'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface StatsOverviewProps {
  runs: RunSession[]
  weights: WeightEntry[]
}

export function StatsOverview({ runs, weights }: StatsOverviewProps) {
  // Calcula estatísticas
  const stats = useMemo(() => {
    const totalDistance = runs.reduce((acc, r) => acc + r.distance, 0)
    const totalTime = runs.reduce((acc, r) => acc + r.duration, 0)
    const totalCalories = runs.reduce((acc, r) => acc + r.calories, 0)
    const avgSpeed = runs.length > 0 
      ? runs.reduce((acc, r) => acc + r.avgSpeed, 0) / runs.length 
      : 0
    
    return {
      totalRuns: runs.length,
      totalDistance,
      totalTime,
      totalCalories,
      avgSpeed,
    }
  }, [runs])

  // Dados para o gráfico de corridas (últimas 10)
  const runChartData = useMemo(() => {
    return runs
      .slice(0, 10)
      .reverse()
      .map((run, index) => ({
        name: `#${index + 1}`,
        distancia: +(run.distance / 1000).toFixed(2),
        calorias: run.calories,
      }))
  }, [runs])

  // Dados para o gráfico de peso
  const weightChartData = useMemo(() => {
    return weights
      .slice(0, 10)
      .reverse()
      .map((w) => ({
        date: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        peso: w.weight,
      }))
  }, [weights])

  if (runs.length === 0 && weights.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="bg-card border-primary/30 gaming-border">
          <CardContent className="p-3 md:p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl md:text-3xl font-black text-primary">{stats.totalRuns}</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">Corridas</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4 text-center">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-[#3B82F6]" />
            <div className="text-2xl md:text-3xl font-black text-[#3B82F6]">{(stats.totalDistance / 1000).toFixed(1)}</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">KM Total</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-foreground" />
            <div className="text-lg md:text-xl font-bold">{Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">Tempo Total</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-accent/30">
          <CardContent className="p-3 md:p-4 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-accent" />
            <div className="text-2xl md:text-3xl font-black text-accent">{stats.totalCalories.toLocaleString()}</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">Calorias</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {runs.length >= 2 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground uppercase tracking-wider">Evolução de Corridas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[150px] md:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runChartData}>
                  <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD60A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFD60A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#525252" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#525252" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}km`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0D0D0D', 
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} km`, 'Distância']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distancia" 
                    stroke="#FFD60A" 
                    strokeWidth={2}
                    fill="url(#colorDistance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {weights.length >= 2 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#22C55E]" />
              <span className="text-muted-foreground uppercase tracking-wider">Evolução de Peso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[150px] md:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#525252" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#525252" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(value) => `${value}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0D0D0D', 
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} kg`, 'Peso']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#22C55E" 
                    strokeWidth={2}
                    dot={{ fill: '#22C55E', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#22C55E' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
