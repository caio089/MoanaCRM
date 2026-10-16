'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/contexts/ToastContext'

interface LogoutButtonProps {
  variant?: 'compact' | 'sidebar'
  onSuccess?: () => void
}

export function LogoutButton({ variant = 'sidebar', onSuccess }: LogoutButtonProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      onSuccess?.()
      router.replace('/login')
      router.refresh()
    } catch {
      addToast('Não foi possível sair. Tente novamente.', 'error')
      setIsLoggingOut(false)
    }
  }

  const icon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  )

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-on-surface-variant transition hover:border-error/25 hover:bg-error/10 hover:text-error active:scale-95 disabled:cursor-wait disabled:opacity-60"
        aria-label={isLoggingOut ? 'Saindo da conta' : 'Sair da conta'}
        title={isLoggingOut ? 'Saindo…' : 'Sair'}
      >
        {isLoggingOut ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        ) : (
          icon
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-label-md text-on-surface-variant transition hover:border-error/20 hover:bg-error/10 hover:text-error disabled:cursor-wait disabled:opacity-60"
    >
      {isLoggingOut ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        icon
      )}
      <span>{isLoggingOut ? 'Saindo…' : 'Sair da conta'}</span>
    </button>
  )
}
