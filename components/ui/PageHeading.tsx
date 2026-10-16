import type { ReactNode } from 'react'

interface PageHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeading({
  eyebrow = 'Construtora Moana',
  title,
  description,
  actions,
}: PageHeadingProps) {
  return (
    <div className="page-toolbar border-b border-white/[0.055] pb-6 sm:pb-8">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-balance text-[2.15rem] font-medium leading-[.98] tracking-[-0.045em] text-on-surface sm:text-[2.9rem] lg:text-[3.55rem]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}
