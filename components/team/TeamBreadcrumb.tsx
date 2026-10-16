'use client'

export type BreadcrumbItem = {
  label: string
  onClick?: () => void
}

interface TeamBreadcrumbProps {
  items: BreadcrumbItem[]
}

/** Navegação entre níveis da visão de equipe. */
export function TeamBreadcrumb({ items }: TeamBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Níveis da equipe" className="flex flex-wrap items-center gap-2 text-label-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 && (
              <span className="text-on-surface-variant/40" aria-hidden="true">
                /
              </span>
            )}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="rounded-lg px-1.5 py-1 font-semibold text-primary transition hover:bg-primary/10"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={
                  isLast
                    ? 'px-1.5 py-1 font-semibold text-on-surface'
                    : 'px-1.5 py-1 text-on-surface-variant'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
