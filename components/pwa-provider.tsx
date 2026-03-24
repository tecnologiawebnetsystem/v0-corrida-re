'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Zap } from 'lucide-react'

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
  installApp: () => Promise<void>
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isStandalone: false,
  canInstall: false,
  isOnline: true,
  installApp: async () => {},
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

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode)
      setIsInstalled(isStandaloneMode)
    }
    checkStandalone()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = () => checkStandalone()
    mediaQuery.addEventListener('change', handleChange)

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000)
      }
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('Nova versão disponível! Deseja atualizar?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch(() => {
          // SW registration failed
        })
    }

    // Check if iOS device without install prompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    if (isIOS && isSafari && !isStandaloneMode) {
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

  const dismissBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const dismissIOSInstructions = () => {
    setShowIOSInstructions(false)
    localStorage.setItem('pwa-ios-dismissed', 'true')
  }

  const isStandaloneMode = typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true)

  return (
    <PWAContext.Provider 
      value={{ 
        isInstalled, 
        isStandalone: isStandaloneMode, 
        canInstall: !!deferredPrompt,
        isOnline,
        installApp 
      }}
    >
      {children}
      
      {/* Install Banner for Android/Chrome */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-lg glow-yellow">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-accent to-[#3B82F6] p-[2px] shrink-0">
                <div className="h-full w-full rounded-xl bg-card flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Instalar Proofy One</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Adicione à tela inicial para acesso rápido e funcionar offline
                </p>
              </div>
              <button 
                onClick={dismissBanner}
                className="text-muted-foreground hover:text-foreground"
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
              <Button 
                variant="outline" 
                onClick={dismissBanner}
                className="flex-1"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {showIOSInstructions && !isStandaloneMode && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-card border-t border-primary/30 rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300">
            <button 
              onClick={dismissIOSInstructions}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-[#3B82F6] p-[2px]">
                <div className="h-full w-full rounded-2xl bg-card flex items-center justify-center">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">Instalar Proofy One</h3>
                <p className="text-sm text-muted-foreground">Adicione à tela inicial</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <p className="text-foreground">
                  Toque no ícone de <strong>Compartilhar</strong> na barra inferior
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <p className="text-foreground">
                  Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-accent text-accent-foreground py-2 px-4 text-center text-sm font-medium animate-in slide-in-from-top duration-300">
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </div>
      )}
    </PWAContext.Provider>
  )
}
