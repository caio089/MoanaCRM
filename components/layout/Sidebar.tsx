'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAdminCheck } from '@/lib/hooks/useAdminCheck'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoanaLogo } from '@/components/brand/MoanaLogo'
import { LogoutButton } from './LogoutButton'

const NAV = [
  {
    href: '/visao',
    label: 'Visão Geral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/admin',
    label: 'Gerenciamento',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/kanban',
    label: 'Kanban',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="5" height="16" rx="1.5" />
        <rect x="10" y="4" width="5" height="10" rx="1.5" />
        <rect x="17" y="4" width="4" height="13" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/analises',
    label: 'Análise',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: '/aprovados',
    label: 'Aprovados',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    href: '/especulativo',
    label: 'Especulativo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    href: '/realizado',
    label: 'Realizado',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    href: '/reprovado',
    label: 'Reprovado',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    href: '/visitas',
    label: 'Visitas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    href: '/construtoras',
    label: 'Construtoras',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" />
      </svg>
    ),
  },
  {
    href: '/equipe',
    label: 'Equipe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="3" /><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M12 9v3M5 14v-2h14v2" />
      </svg>
    ),
  },
  {
    href: '/admin/distribuicao',
    label: 'Distribuir leads',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M21 8l-7.5 7.5L9 11l-6 6" />
      </svg>
    ),
  },
  {
    href: '/admin/corretores',
    label: 'Corretores · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><path d="M19 8v6M16 11h6" />
      </svg>
    ),
  },
  {
    href: '/admin/coordenadores',
    label: 'Coordenadores · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="3" /><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M12 9v3M5 14v-2h14v2" />
      </svg>
    ),
  },
  {
    href: '/admin/correspondentes',
    label: 'Correspondentes · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 4v16" />
      </svg>
    ),
  },
  {
    href: '/admin/bairros',
    label: 'Bairros · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: '/admin/cidades',
    label: 'Cidades · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10z" /><circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/admin/construtoras',
    label: 'Construtoras · Adm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" />
      </svg>
    ),
  },
]

interface SidebarProps {
  onNavigate?: () => void
  onClose?: () => void
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isAdmin, role } = useAdminCheck()

  return (
    <aside className="flex h-full min-h-dvh w-full shrink-0 flex-col overflow-hidden border-r border-white/[0.055] bg-surface-lowest/88 pt-[env(safe-area-inset-top)] shadow-[18px_0_60px_rgba(0,0,0,.16)] backdrop-blur-2xl lg:w-[17.5rem]">
      <div className="relative flex items-center border-b border-white/[0.055] px-5 py-5">
        <div className="brand-panel rounded-2xl px-4 py-2.5">
          <MoanaLogo
            variant="red"
            width={200}
            height={80}
            className="h-[3.35rem] w-auto object-contain"
            priority
          />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl text-on-surface-variant transition hover:text-on-surface lg:hidden"
            aria-label="Fechar menu"
          >
            ×
          </button>
        )}
      </div>

      <div className="px-5 pb-1 pt-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant/55">Workspace</div>
      <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV.filter((item) => !item.href.startsWith('/admin') || isAdmin).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={[
                'group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-[12px] font-medium tracking-[0.025em] transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-primary/[0.14] to-primary/[0.04] text-primary shadow-[inset_0_0_0_1px_rgba(217,189,132,0.16),0_8px_25px_rgba(0,0,0,.12)]'
                  : 'text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface',
              ].join(' ')}
            >
              {active && (
                <span className="absolute bottom-2 left-1.5 top-2 w-0.5 rounded-full bg-primary shadow-[0_0_12px_rgba(217,189,132,.6)]" />
              )}
              <span className={`${active ? 'text-primary' : 'opacity-70 group-hover:opacity-100'} transition`}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/[0.06] bg-surface-lowest/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_32px_rgba(0,0,0,.18)]">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold uppercase text-primary">{user.email?.slice(0, 2)}</span>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.15em] text-on-surface-variant/60">
                {role === 'admin' ? 'Administrador' : role === 'coordenador' ? 'Coordenador' : 'Corretor'}
              </p>
              <p className="truncate text-[11px] text-on-surface-variant">{user.email}</p>
            </div>
          </div>
        )}
        <ThemeToggle />
        <LogoutButton onSuccess={onNavigate} />
        <p className="text-center text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/40">
          Construtora Moana
        </p>
      </div>
    </aside>
  )
}
