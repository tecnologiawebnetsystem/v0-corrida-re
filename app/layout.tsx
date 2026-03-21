import type { Metadata, Viewport } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900']
})

const rajdhani = Rajdhani({ 
  subsets: ["latin"],
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'PULSE RUN - Rastreador de Corrida',
  description: 'Acompanhe suas corridas com GPS em tempo real, monitore seu progresso e alcance seus objetivos',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PULSE RUN',
  },
  icons: {
    icon: '/icon-512.jpg',
    apple: '/icon-192.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFD60A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
