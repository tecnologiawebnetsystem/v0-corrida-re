'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Zap, RefreshCw, Bell, BellOff } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAContextType {
  isInstalled: boolean
  isStandalone: boolean
  canInstall: boolean
  isOnline: boolean
  notificationPermission: NotificationPermission | null
  installApp: () => Promise<void>
  requestNotificationPermission: () => Promise<void>
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isStandalone: false,
  canInstall: false,
  isOnline: true,
  notificationPermission: null,
  installApp: async () => {},
  requestNotificationPermission: async () => {},
})

export function usePWA() {
  return useContext(PWAContext)
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    // Verificar permissão de notificação existente
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Check if running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
      setIsInstalled(isStandaloneMode)
    }
    checkStandalone()

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = () => checkStandalone()
    mediaQuery.addEventListener('change', handleChange)

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    // Registrar Service Worker e monitorar atualizações
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Checar se já há um worker esperando (atualização pendente)
          if (registration.waiting) {
            setWaitingWorker(registration.waiting)
            setShowUpdateBanner(true)
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker)
                  setShowUpdateBanner(true)

                  // Notificação push de atualização (se permitida)
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('PULSE RUN - Atualização disponivel', {
                      body: 'Uma nova versao do app esta disponivel. Clique para atualizar.',
                      icon: '/icon-192.jpg',
                      badge: '/icon-192.jpg',
                      tag: 'app-update',
                    })
                  }
                }
              })
            }
          })

          // Escutar mensagem do SW para recarregar
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })
        })
        .catch(() => {
          // SW registration failed silently
        })
    }

    // iOS sem prompt de instalação
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isStandaloneNow =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    if (isIOS && isSafari && !isStandaloneNow) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowIOSInstructions(true), 5000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } catch {
      // Install failed
    }
  }

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdateBanner(false)
  }

  const dismissUpdateBanner = () => {
    setShowUpdateBanner(false)
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        new Notification('PULSE RUN', {
          body: 'Notificacoes ativadas! Voce sera avisado sobre atualizacoes.',
          icon: '/icon-192.jpg',
          badge: '/icon-192.jpg',
          tag: 'notifications-enabled',
        })
      }
    } catch {
      // Notifications not supported
    }
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const dismissIOSInstructions = () => {
    setShowIOSInstructions(false)
    localStorage.setItem('pwa-ios-dismissed', 'true')
  }

  const isStandaloneMode =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true)

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isStandalone: isStandaloneMode,
        canInstall: !!deferredPrompt,
        isOnline,
        notificationPermission,
        installApp,
        requestNotificationPermission,
      }}
    >
      {children}

      {/* Banner de Atualização Disponivel */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-card border border-primary/50 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm">Nova versao disponivel!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PULSE RUN foi atualizado. Clique em Atualizar para aplicar.
                </p>
              </div>
              <button
                onClick={dismissUpdateBanner}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={applyUpdate}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Atualizar agora
              </Button>
              <Button
                variant="outline"
                onClick={dismissUpdateBanner}
                className="flex-1 h-9 text-sm"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Instalacao Android/Chrome */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Instalar PULSE RUN</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Adicione a tela inicial para acesso rapido e uso offline
                </p>
              </div>
              <button
                onClick={dismissBanner}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={installApp}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar
              </Button>
              <Button variant="outline" onClick={dismissBanner} className="flex-1">
                Depois
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instrucoes de instalacao iOS */}
      {showIOSInstructions && !isStandaloneMode && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-card border-t border-primary/30 rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300">
            <button
              onClick={dismissIOSInstructions}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">Instalar PULSE RUN</h3>
                <p className="text-sm text-muted-foreground">Adicione a tela inicial</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  1
                </div>
                <p className="text-foreground">
                  Toque no icone de <strong>Compartilhar</strong> na barra inferior
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  2
                </div>
                <p className="text-foreground">
                  Role para baixo e toque em <strong>Adicionar a Tela de Inicio</strong>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  3
                </div>
                <p className="text-foreground">
                  Toque em <strong>Adicionar</strong> para confirmar
                </p>
              </div>
            </div>

            <Button
              onClick={dismissIOSInstructions}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}

      {/* Indicador Offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-accent text-accent-foreground py-2 px-4 text-center text-sm font-medium animate-in slide-in-from-top duration-300">
          Voce esta offline. Algumas funcionalidades podem estar limitadas.
        </div>
      )}
    </PWAContext.Provider>
  )
}

// Componente auxiliar para botao de notificacoes (pode ser usado em configuracoes)
export function NotificationToggle() {
  const { notificationPermission, requestNotificationPermission } = usePWA()

  if (!('Notification' in window)) return null
  if (notificationPermission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="h-4 w-4 text-primary" />
        <span>Notificacoes ativadas</span>
      </div>
    )
  }
  if (notificationPermission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Notificacoes bloqueadas no navegador</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestNotificationPermission}
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      Ativar notificacoes
    </Button>
  )
}
