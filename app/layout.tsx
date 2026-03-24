import type { Metadata, Viewport } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWAProvider } from '@/components/pwa-provider'
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
  description: 'Acompanhe suas corridas com GPS em tempo real, monitore seu progresso e alcance seus objetivos fitness',
  generator: 'v0.app',
  manifest: '/manifest.json',
  applicationName: 'PULSE RUN',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PULSE RUN',
    startupImage: [
      {
        url: '/icon-512.jpg',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icon-512.jpg',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icon-512.jpg',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icon-512.jpg',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icon-512.jpg',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'PULSE RUN',
    title: 'PULSE RUN - Rastreador de Corrida',
    description: 'Acompanhe suas corridas com GPS em tempo real, monitore seu progresso e alcance seus objetivos fitness',
    images: [{ url: '/icon-512.jpg', width: 512, height: 512, alt: 'PULSE RUN' }],
  },
  twitter: {
    card: 'summary',
    title: 'PULSE RUN - Rastreador de Corrida',
    description: 'Acompanhe suas corridas com GPS em tempo real',
    images: ['/icon-512.jpg'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#050505',
    'msapplication-TileImage': '/icon-512.jpg',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
    { media: '(prefers-color-scheme: light)', color: '#FFD60A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PULSE RUN" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${orbitron.variable} ${rajdhani.variable} font-sans antialiased overflow-x-hidden`}>
        <PWAProvider>
          {children}
        </PWAProvider>
        <Analytics />
      </body>
    </html>
  )
}
