'use client'

import { usePathname } from 'next/navigation'
import { titleFromPath } from './nav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoanaLogo } from '@/components/brand/MoanaLogo'

interface MobileHeaderProps {
  menuOpen: boolean
  onOpenMenu: () => void
}

export function MobileHeader({ menuOpen, onOpenMenu }: MobileHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-surface-lowest/75 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_12px_35px_rgba(0,0,0,.18)] backdrop-blur-2xl lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-on-surface transition hover:border-primary/30 hover:bg-white/[0.08] active:scale-95"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-controls="menu-mobile"
        aria-expanded={menuOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <span className="brand-panel hidden rounded-lg px-2 py-1 sm:block">
        <MoanaLogo
          variant="white"
          width={110}
          height={36}
          className="h-7 w-auto object-contain"
        />
      </span>

      <p className="min-w-0 flex-1 truncate font-display text-xl tracking-[-0.02em] text-on-surface">
        {titleFromPath(pathname)}
      </p>

      <ThemeToggle compact />
    </header>
  )
}
