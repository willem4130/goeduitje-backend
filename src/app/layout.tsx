import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Goeduitje - Admin Dashboard',
  description: 'Beheer workshop aanvragen en activiteiten voor Goeduitje',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Providers>
          <div className="flex h-screen">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
