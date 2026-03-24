'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Target, Scale, Bell, BellOff, BellRing } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { getSettings, saveSettings } from '@/lib/store'
import { UserSettings } from '@/lib/types'
import { usePWA } from '@/components/pwa-provider'

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
  const { notificationPermission, requestNotificationPermission } = usePWA()

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

          <Separator className="my-2" />

          {/* Notificações */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notificações
            </Label>

            {!('Notification' in (typeof window !== 'undefined' ? window : {})) ? (
              <p className="text-xs text-muted-foreground">
                Notificações não suportadas neste navegador.
              </p>
            ) : notificationPermission === 'granted' ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                <BellRing className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações ativadas</p>
                  <p className="text-xs text-muted-foreground">
                    Você será avisado sobre novas atualizações do app.
                  </p>
                </div>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
                <BellOff className="h-4 w-4 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações bloqueadas</p>
                  <p className="text-xs text-muted-foreground">
                    Ative manualmente nas configurações do navegador/sistema.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Receba um aviso quando uma atualização do PULSE RUN estiver disponível.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 hover:border-primary hover:bg-primary/10"
                  onClick={requestNotificationPermission}
                >
                  <Bell className="h-4 w-4 mr-2 text-primary" />
                  Ativar notificações
                </Button>
              </div>
            )}
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
