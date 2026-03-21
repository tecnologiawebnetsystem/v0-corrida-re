'use client'

import { Instagram, Facebook, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RunSession } from '@/lib/types'
import { formatDistance, formatDuration, getSettings } from '@/lib/store'

interface ShareButtonsProps {
  run: RunSession
}

export function ShareButtons({ run }: ShareButtonsProps) {
  const settings = getSettings()
  
  const shareText = `${settings.name} correu ${formatDistance(run.distance)} em ${formatDuration(run.duration)}! ${run.calories} calorias queimadas. #NitroRun #Corrida #Running`
  
  const shareToInstagram = () => {
    // Instagram não tem API de compartilhamento direto, mas podemos copiar o texto
    navigator.clipboard.writeText(shareText)
    alert('Texto copiado! Abra o Instagram e cole na sua story ou post.')
  }
  
  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(shareText)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400')
  }
  
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Corrida - NITRO RUN',
          text: shareText,
          url: window.location.href,
        })
      } catch {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Texto copiado para área de transferência!')
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Compartilhar:</span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={shareToInstagram}
        className="h-8 w-8 rounded-full share-btn share-btn-instagram hover:opacity-80"
        title="Compartilhar no Instagram"
      >
        <Instagram className="h-4 w-4 text-white" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={shareToFacebook}
        className="h-8 w-8 rounded-full share-btn share-btn-facebook hover:opacity-80"
        title="Compartilhar no Facebook"
      >
        <Facebook className="h-4 w-4 text-white" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={shareNative}
        className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80"
        title="Mais opções"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
