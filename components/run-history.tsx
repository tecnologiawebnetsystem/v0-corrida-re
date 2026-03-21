'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Zap, Flame, Trash2, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RunSession } from '@/lib/types'
import { deleteRun, formatDuration, formatDistance, formatSpeed, formatPace } from '@/lib/store'

interface RunHistoryProps {
  runs: RunSession[]
  onRunDeleted: () => void
}

export function RunHistory({ runs, onRunDeleted }: RunHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteRun(id)
    onRunDeleted()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  // Calcula estatísticas
  const totalDistance = runs.reduce((acc, run) => acc + run.distance, 0)
  const totalTime = runs.reduce((acc, run) => acc + run.duration, 0)
  const totalCalories = runs.reduce((acc, run) => acc + run.calories, 0)
  const bestRun = runs.length > 0 
    ? runs.reduce((best, run) => run.distance > best.distance ? run : best, runs[0])
    : null

  if (runs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhuma corrida registrada</p>
            <p className="text-sm mt-2">Comece sua primeira corrida agora!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
            <div className="text-lg font-bold text-primary">{runs.length}</div>
            <div className="text-xs text-muted-foreground">corridas</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Distância</div>
            <div className="text-lg font-bold text-foreground">{(totalDistance / 1000).toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">km total</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Calorias</div>
            <div className="text-lg font-bold text-accent">{totalCalories.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </CardContent>
        </Card>
      </div>

      {/* Melhor Corrida */}
      {bestRun && (
        <Card className="bg-card border-primary/30 border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Trophy className="h-4 w-4" />
              Melhor Corrida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{formatDistance(bestRun.distance)}</div>
                <div className="text-sm text-muted-foreground">{formatDate(bestRun.date)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium">{formatDuration(bestRun.duration)}</div>
                <div className="text-sm text-muted-foreground">{formatPace(bestRun.avgSpeed)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Corridas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico de Corridas
        </h3>
        
        {runs.map((run) => (
          <Card 
            key={run.id} 
            className="bg-card border-border overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Header clicável */}
              <button
                onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="font-medium">{formatDate(run.date)}</div>
                    <div className="text-sm text-muted-foreground">{run.startTime.slice(0, 5)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatDistance(run.distance)}</div>
                    <div className="text-sm text-muted-foreground">{formatDuration(run.duration)}</div>
                  </div>
                  {expandedId === run.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandedId === run.id && (
                <div className="border-t border-border p-4 space-y-4 bg-secondary/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Duração</div>
                        <div className="font-medium">{formatDuration(run.duration)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Distância</div>
                        <div className="font-medium">{formatDistance(run.distance)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Vel. Média</div>
                        <div className="font-medium">{formatSpeed(run.avgSpeed)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-accent" />
                      <div>
                        <div className="text-xs text-muted-foreground">Calorias</div>
                        <div className="font-medium text-accent">{run.calories} kcal</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Pace: {formatPace(run.avgSpeed)} | Max: {formatSpeed(run.maxSpeed)}
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Corrida</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta corrida? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(run.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
