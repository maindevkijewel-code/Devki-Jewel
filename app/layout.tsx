import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth-provider'
import { GuidedAssistant } from '@/components/guided-assistant'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Devki Jewels | Premium Online Jewellery Shopping',
  description: 'Shop from a wide range of beautifully crafted jewellery designs. Browse gold, diamond, solitaire, gemstone jewellery for men, women & kids. Free shipping.',
}

export const viewport: Viewport = {
  themeColor: '#522D6D',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} bg-white`}>
      <body className="font-sans antialiased max-md:pb-[60px]">
        <AuthProvider>
          {children}
        </AuthProvider>
        <MobileBottomNav />
        <GuidedAssistant />
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
