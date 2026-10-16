import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/newsreader'
import './globals.css'
import { ToastProvider } from '@/lib/contexts/ToastContext'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ToastContainer } from '@/components/ui/ToastContainer'

export const metadata: Metadata = {
  title: 'Construtora Moana | CRM',
  description: 'CRM de gestão do funil comercial da Construtora Moana',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080a0d',
}

const themeInitializer = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem('moanacrm-theme-v1');
      var theme = storedTheme === 'light' ? 'light' : 'dark';
      var root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
    }
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark h-full" suppressHydrationWarning>
      <body className="min-h-dvh">
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
