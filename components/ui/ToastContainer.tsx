'use client'

import { useToast } from '@/lib/contexts/ToastContext'

const STYLES: Record<string, string> = {
  success: 'border-tertiary/25 bg-[#122018] text-tertiary',
  error: 'border-error/25 bg-[#2a1516] text-error',
  warning: 'border-primary/25 bg-[#24180e] text-primary',
  info: 'border-secondary/25 bg-[#171326] text-secondary',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[9999] space-y-3 px-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ${STYLES[toast.type] || STYLES.info}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="text-sm opacity-80">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '!'}
            {toast.type === 'info' && 'i'}
          </span>
          <span className="flex-1 text-label-md text-on-surface">{toast.message}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeToast(toast.id)
            }}
            className="text-lg leading-none text-on-surface-variant hover:text-on-surface"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
