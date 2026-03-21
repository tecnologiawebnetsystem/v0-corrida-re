'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Target, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getSettings, saveSettings } from '@/lib/store'
import { UserSettings } from '@/lib/types'

interface SettingsDialogProps {
  onSettingsChanged: () => void
}

export function SettingsDialog({ onSettingsChanged }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Corredor',
    weeklyGoalKm: 20,
    weight: 70,
  })

  useEffect(() => {
    if (open) {
      setSettings(getSettings())
    }
  }, [open])

  const handleSave = () => {
    saveSettings(settings)
    setOpen(false)
    onSettingsChanged()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome
            </Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Seu nome"
              className="bg-input border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weeklyGoal" className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              Meta Semanal (km)
            </Label>
            <Input
              id="weeklyGoal"
              type="number"
              min="1"
              max="500"
              value={settings.weeklyGoalKm}
              onChange={(e) => setSettings({ ...settings, weeklyGoalKm: parseInt(e.target.value) || 20 })}
              className="bg-input border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Peso (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={settings.weight}
              onChange={(e) => setSettings({ ...settings, weight: parseFloat(e.target.value) || 70 })}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">Usado para calcular calorias</p>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-border">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
