'use client'

import { useTheme } from '@/lib/contexts/ThemeContext'

interface ThemeToggleProps {
  compact?: boolean
  className?: string
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] text-on-surface-variant transition hover:border-primary/30 hover:bg-white/[0.07] hover:text-on-surface active:scale-95',
        compact ? 'h-11 w-11 shrink-0' : 'w-full px-3 py-2.5 text-label-md',
        className,
      ].join(' ')}
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === 'dark' ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
      {!compact && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
    </button>
  )
}
