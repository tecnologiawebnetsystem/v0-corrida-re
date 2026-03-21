'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Zap, Flame, Trash2, ChevronDown, ChevronUp, Trophy, Timer } from 'lucide-react'
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
import { ShareButtons } from './share-buttons'

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

  // Melhor corrida (por distância)
  const bestRun = runs.length > 0 
    ? runs.reduce((best, run) => run.distance > best.distance ? run : best, runs[0])
    : null

  if (runs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30 text-primary" />
            <p className="text-lg font-semibold">Nenhuma corrida registrada</p>
            <p className="text-sm mt-2">Comece sua primeira corrida agora!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Melhor Corrida */}
      {bestRun && (
        <Card className="bg-card border-2 border-primary/50 gaming-border overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              <span className="uppercase tracking-wider">Melhor Corrida</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-black text-primary neon-text">{formatDistance(bestRun.distance)}</div>
                <div className="text-sm text-muted-foreground">{formatDate(bestRun.date)}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{formatDuration(bestRun.duration)}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                  <Timer className="h-3 w-3" />
                  {formatPace(bestRun.avgSpeed)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <ShareButtons run={bestRun} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Corridas */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground px-1">
          Histórico de Corridas
        </h3>
        
        {runs.map((run) => (
          <Card 
            key={run.id} 
            className={`bg-card border-border overflow-hidden transition-all ${run.id === bestRun?.id ? 'ring-1 ring-primary/30' : ''}`}
          >
            <CardContent className="p-0">
              {/* Header clicável */}
              <button
                onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${run.id === bestRun?.id ? 'bg-primary/20' : 'bg-secondary'}`}>
                    <MapPin className={`h-4 w-4 ${run.id === bestRun?.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{formatDate(run.date)}</div>
                    <div className="text-xs text-muted-foreground">{run.startTime.slice(0, 5)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatDistance(run.distance)}</div>
                    <div className="text-xs text-muted-foreground">{formatDuration(run.duration)}</div>
                  </div>
                  {expandedId === run.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandedId === run.id && (
                <div className="border-t border-border p-3 md:p-4 space-y-3 bg-secondary/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">Duração</div>
                        <div className="font-medium text-sm">{formatDuration(run.duration)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">Pace</div>
                        <div className="font-medium text-sm">{formatPace(run.avgSpeed)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#3B82F6]" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">Vel. Média</div>
                        <div className="font-medium text-sm text-[#3B82F6]">{formatSpeed(run.avgSpeed)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-accent" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">Calorias</div>
                        <div className="font-medium text-sm text-accent">{run.calories} kcal</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <ShareButtons run={run} />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Excluir</span>
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
