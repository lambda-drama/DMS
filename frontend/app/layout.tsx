import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { APP_SHORT_NAME, APP_TITLE } from '@/lib/branding'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: `${APP_TITLE} - Dealer Management System`,
  description: 'Enterprise automotive workshop management for Suweys Motors — appointments, inspections, job cards, and vehicle delivery',
  keywords: ['DMS', 'dealer management', 'automotive', 'workshop', 'job card', 'vehicle service', 'Suweys Motors'],
  authors: [{ name: APP_SHORT_NAME }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F3D5E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              classNames: {
                toast: 'font-sans',
              },
            }}
          />
        </ThemeProvider>
        {process.env.VERCEL === '1' ? <Analytics /> : null}
      </body>
    </html>
  )
}
