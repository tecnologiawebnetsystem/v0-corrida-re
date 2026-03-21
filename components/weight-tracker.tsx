'use client'

import { useState } from 'react'
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react'
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
      year: 'numeric',
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
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Scale className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Peso Atual</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {currentWeight > 0 ? `${currentWeight.toFixed(1)}` : '--'}
              <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {weightDiff < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : weightDiff > 0 ? (
                <TrendingUp className="h-4 w-4 text-accent" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-xs uppercase tracking-wider">Diferença</span>
            </div>
            <div className={`text-3xl font-bold ${
              weightDiff < 0 ? 'text-green-500' : weightDiff > 0 ? 'text-accent' : 'text-foreground'
            }`}>
              {weightDiff !== 0 ? (weightDiff > 0 ? '+' : '') + weightDiff.toFixed(1) : '--'}
              <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peso Inicial */}
      {initialWeight > 0 && (
        <Card className="bg-card border-primary/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Peso Inicial</div>
              <div className="text-xl font-bold text-primary">{initialWeight.toFixed(1)} kg</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Meta</div>
              <div className="text-sm text-muted-foreground">-{Math.abs(weightDiff).toFixed(1)} kg</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adicionar Peso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!canAddWeight() && weights.length > 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            {weights.length === 0 ? 'Registrar Peso Inicial' : 'Registrar Peso'}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
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
                className="bg-input border-border"
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
        <div className="text-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline mr-2" />
          Próximo registro em {daysUntilNextEntry()} dias
        </div>
      )}

      {/* Histórico de Peso */}
      {weights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Peso
          </h3>
          
          {weights.map((entry, index) => {
            const prevWeight = weights[index + 1]?.weight
            const diff = prevWeight ? entry.weight - prevWeight : 0

            return (
              <Card key={entry.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      entry.type === 'initial' ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      <Scale className={`h-4 w-4 ${
                        entry.type === 'initial' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium">{entry.weight.toFixed(1)} kg</div>
                      <div className="text-sm text-muted-foreground">{formatDate(entry.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {diff !== 0 && (
                      <span className={`text-sm font-medium ${
                        diff < 0 ? 'text-green-500' : 'text-accent'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                    {entry.type === 'initial' && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Inicial
                      </span>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum peso registrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Registre seu peso inicial para acompanhar seu progresso
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
