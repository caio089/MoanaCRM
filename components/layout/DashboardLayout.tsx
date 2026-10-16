'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="flex min-h-dvh bg-transparent">
      <a
        href="#conteudo-principal"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-primary px-4 py-2 text-label-md font-semibold text-on-primary transition focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <div className="sticky top-0 hidden h-dvh lg:flex lg:w-[17.5rem] lg:shrink-0">
        <Sidebar />
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            className="mobile-drawer-enter fixed inset-y-0 left-0 z-50 w-[min(21rem,90vw)] lg:hidden"
          >
            <Sidebar onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
        <main id="conteudo-principal" tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
