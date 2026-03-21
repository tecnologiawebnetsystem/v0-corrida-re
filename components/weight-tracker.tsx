'use client'

import { useState } from 'react'
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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
import { WeightEntry } from '@/lib/types'
import { saveWeight, deleteWeight, generateId } from '@/lib/store'

interface WeightTrackerProps {
  weights: WeightEntry[]
  onWeightChanged: () => void
}

export function WeightTracker({ weights, onWeightChanged }: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) return

    const entry: WeightEntry = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      weight,
      type: weights.length === 0 ? 'initial' : 'progress',
    }

    saveWeight(entry)
    setNewWeight('')
    setDialogOpen(false)
    onWeightChanged()
  }

  const handleDelete = (id: string) => {
    deleteWeight(id)
    onWeightChanged()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Calcula diferença de peso
  const initialWeight = weights.length > 0 
    ? weights.find(w => w.type === 'initial')?.weight || weights[weights.length - 1].weight
    : 0
  const currentWeight = weights.length > 0 ? weights[0].weight : 0
  const weightDiff = currentWeight - initialWeight

  // Verifica se pode adicionar peso (a cada 15 dias)
  const lastEntry = weights[0]
  const canAddWeight = () => {
    if (!lastEntry) return true
    const lastDate = new Date(lastEntry.date)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 15
  }

  const daysUntilNextEntry = () => {
    if (!lastEntry) return 0
    const lastDate = new Date(lastEntry.date)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, 15 - diffDays)
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Scale className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-xs uppercase tracking-wider">Peso Atual</span>
            </div>
            <div className="text-3xl font-black text-[#3B82F6]">
              {currentWeight > 0 ? `${currentWeight.toFixed(1)}` : '--'}
              <span className="text-base font-normal text-muted-foreground ml-1">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {weightDiff < 0 ? (
                <TrendingDown className="h-4 w-4 text-[#22C55E]" />
              ) : weightDiff > 0 ? (
                <TrendingUp className="h-4 w-4 text-accent" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-xs uppercase tracking-wider">Diferença</span>
            </div>
            <div className={`text-3xl font-black ${
              weightDiff < 0 ? 'text-[#22C55E]' : weightDiff > 0 ? 'text-accent' : 'text-foreground'
            }`}>
              {weightDiff !== 0 ? (weightDiff > 0 ? '+' : '') + weightDiff.toFixed(1) : '--'}
              <span className="text-base font-normal text-muted-foreground ml-1">kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peso Inicial */}
      {initialWeight > 0 && (
        <Card className="bg-card border-primary/30 gaming-border">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Peso Inicial</div>
              <div className="text-2xl font-black text-primary">{initialWeight.toFixed(1)} kg</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                <Target className="h-3 w-3" />
                Progresso
              </div>
              <div className={`text-lg font-bold ${weightDiff < 0 ? 'text-[#22C55E]' : weightDiff > 0 ? 'text-accent' : 'text-foreground'}`}>
                {weightDiff < 0 ? '' : '+'}{weightDiff.toFixed(1)} kg
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adicionar Peso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-yellow btn-gaming h-12 font-bold"
            disabled={!canAddWeight() && weights.length > 0}
          >
            <Plus className="h-5 w-5 mr-2" />
            {weights.length === 0 ? 'Registrar Peso Inicial' : 'Registrar Peso'}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {weights.length === 0 ? 'Peso Inicial' : 'Novo Registro de Peso'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="bg-input border-border text-lg h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-border">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleAddWeight}
              className="bg-primary text-primary-foreground"
              disabled={!newWeight || parseFloat(newWeight) <= 0}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aviso próximo registro */}
      {!canAddWeight() && weights.length > 0 && (
        <div className="text-center text-sm text-muted-foreground bg-secondary/50 rounded-lg py-3 px-4">
          <Calendar className="h-4 w-4 inline mr-2 text-primary" />
          Próximo registro em <span className="font-bold text-primary">{daysUntilNextEntry()} dias</span>
        </div>
      )}

      {/* Histórico de Peso */}
      {weights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground px-1">
            Histórico de Peso
          </h3>
          
          {weights.map((entry, index) => {
            const prevWeight = weights[index + 1]?.weight
            const diff = prevWeight ? entry.weight - prevWeight : 0

            return (
              <Card key={entry.id} className="bg-card border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      entry.type === 'initial' ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      <Scale className={`h-4 w-4 ${
                        entry.type === 'initial' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <div className="font-bold">{entry.weight.toFixed(1)} kg</div>
                      <div className="text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {diff !== 0 && (
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        diff < 0 ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-accent/20 text-accent'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                    {entry.type === 'initial' && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded uppercase tracking-wider font-bold">
                        Inicial
                      </span>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro de peso?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(entry.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {weights.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Scale className="h-16 w-16 mx-auto mb-4 text-primary opacity-30" />
            <p className="text-lg font-semibold">Nenhum peso registrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Registre seu peso inicial para acompanhar seu progresso
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
