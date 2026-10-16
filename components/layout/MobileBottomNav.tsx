'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  {
    href: '/visao',
    label: 'Visão',
    icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" /></>,
  },
  {
    href: '/novo-lead',
    label: 'Novo',
    prominent: true,
    icon: <><path d="M12 5v14M5 12h14" /></>,
  },
  {
    href: '/kanban',
    label: 'Funil',
    icon: <><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="8" rx="1" /></>,
  },
  {
    href: '/equipe',
    label: 'Equipe',
    icon: <><circle cx="12" cy="7" r="3" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="M12 10v3M5 14h14" /></>,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Atalhos principais"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.09] bg-surface-lowest/90 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_38px_rgba(0,0,0,.12)] backdrop-blur-2xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group flex min-h-[3.55rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[0.625rem] font-semibold transition active:scale-95',
                active ? 'text-primary' : 'text-on-surface-variant',
              ].join(' ')}
            >
              <span
                className={[
                  'relative flex h-8 w-11 items-center justify-center rounded-full transition',
                  item.prominent
                    ? 'bg-primary text-on-primary shadow-[0_8px_20px_rgb(var(--primary-rgb)/.24)]'
                    : active
                      ? 'bg-primary/12 text-primary'
                      : 'group-hover:bg-white/[0.05]',
                ].join(' ')}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
