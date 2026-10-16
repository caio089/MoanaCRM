'use client'

import Link from 'next/link'
import { formatBRLCompact } from '@/lib/formatters'

export type TeamCardMetrics = {
  totalLeads?: number
  vgvTotal?: number
  realizados?: number
  corretoresCount?: number
}

interface TeamCardProps {
  id: string
  nome: string
  role: 'coordenador' | 'corretor'
  selected?: boolean
  metrics?: TeamCardMetrics
  subtitle?: string
  onSelect?: () => void
  /** Link preparado para Wave 4 (detalhe / métricas). */
  detailHref?: string
}

const ROLE_LABEL: Record<TeamCardProps['role'], string> = {
  coordenador: 'Coordenador',
  corretor: 'Corretor',
}

/** Card clicável de membro da equipe com estado ativo/selecionado. */
export function TeamCard({
  id,
  nome,
  role,
  selected = false,
  metrics,
  subtitle,
  onSelect,
  detailHref,
}: TeamCardProps) {
  const interactive = Boolean(onSelect)

  const showRealizados = metrics != null && 'realizados' in metrics
  const hasMetrics =
    typeof metrics?.totalLeads === 'number' ||
    typeof metrics?.vgvTotal === 'number' ||
    typeof metrics?.realizados === 'number' ||
    typeof metrics?.corretoresCount === 'number' ||
    showRealizados

  return (
    <article
      data-id={id}
      className={[
        'card group relative flex flex-col transition-all duration-200',
        interactive ? 'card-interactive cursor-pointer' : '',
        selected
          ? 'border-primary/45 shadow-[0_0_0_1px_rgba(217,189,132,0.28),0_22px_52px_rgba(0,0,0,0.3)] ring-1 ring-primary/30'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!interactive}
        className={[
          'w-full text-left outline-none',
          interactive ? '' : 'cursor-default',
        ].join(' ')}
        aria-pressed={interactive ? selected : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">{ROLE_LABEL[role]}</p>
            <h2
              className={[
                'mt-1 truncate text-headline-sm transition',
                selected ? 'text-primary' : 'text-on-surface group-hover:text-primary',
              ].join(' ')}
            >
              {nome}
            </h2>
            {subtitle && (
              <p className="mt-1 truncate text-body-md text-on-surface-variant">{subtitle}</p>
            )}
          </div>
          {typeof metrics?.totalLeads === 'number' && (
            <span
              className={[
                'shrink-0 rounded-full px-2.5 py-1 text-label-sm font-semibold',
                selected ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary',
              ].join(' ')}
            >
              {metrics.totalLeads}
            </span>
          )}
        </div>

        {hasMetrics && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.055] pt-4">
            {typeof metrics?.corretoresCount === 'number' && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">
                  Corretores
                </p>
                <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">
                  {metrics.corretoresCount}
                </p>
              </div>
            )}
            {showRealizados && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">
                  Realizados
                </p>
                <p data-numeric className="mt-1 text-body-md font-semibold text-tertiary">
                  {typeof metrics?.realizados === 'number' ? metrics.realizados : '—'}
                </p>
              </div>
            )}
            {typeof metrics?.vgvTotal === 'number' && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">
                  VGV
                </p>
                <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">
                  {formatBRLCompact(metrics.vgvTotal)}
                </p>
              </div>
            )}
            {typeof metrics?.totalLeads === 'number' && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">
                  Leads
                </p>
                <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">
                  {metrics.totalLeads}
                </p>
              </div>
            )}
          </div>
        )}

        {interactive && (
          <p className="mt-4 text-label-sm font-semibold text-primary">
            {role === 'coordenador' ? 'Ver corretores →' : 'Abrir equipe →'}
          </p>
        )}
      </button>

      {detailHref && (
        <div className="mt-3 border-t border-white/[0.055] pt-3">
          <Link
            href={detailHref}
            className="inline-flex text-label-sm font-semibold text-on-surface-variant transition hover:text-primary"
            onClick={(event) => event.stopPropagation()}
          >
            Ver métricas →
          </Link>
        </div>
      )}
    </article>
  )
}
