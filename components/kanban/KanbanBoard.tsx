'use client'

import { useMemo } from 'react'
import { formatBRLCompact } from '@/lib/formatters'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import type { EtapaFunil, KanbanLead } from '@/lib/types'

interface StageConfig {
  id: EtapaFunil
  label: string
  description: string
  dotClass: string
  accentClass: string
  countClass: string
}

export const KANBAN_STAGES: StageConfig[] = [
  {
    id: 'lead',
    label: 'Novos leads',
    description: 'Primeiro contato',
    dotClass: 'bg-secondary',
    accentClass: 'from-secondary/20',
    countClass: 'bg-secondary/15 text-secondary',
  },
  {
    id: 'analise',
    label: 'Em análise',
    description: 'Documentação e perfil',
    dotClass: 'bg-amber-300',
    accentClass: 'from-amber-300/20',
    countClass: 'bg-amber-300/15 text-amber-200',
  },
  {
    id: 'aprovado',
    label: 'Aprovados',
    description: 'Crédito liberado',
    dotClass: 'bg-tertiary',
    accentClass: 'from-tertiary/20',
    countClass: 'bg-tertiary/15 text-tertiary',
  },
  {
    id: 'visita',
    label: 'Visitas',
    description: 'Imóvel em avaliação',
    dotClass: 'bg-sky-300',
    accentClass: 'from-sky-300/20',
    countClass: 'bg-sky-300/15 text-sky-200',
  },
  {
    id: 'especulativo',
    label: 'Especulativos',
    description: 'Oportunidade futura',
    dotClass: 'bg-primary',
    accentClass: 'from-primary/20',
    countClass: 'bg-primary/15 text-primary',
  },
  {
    id: 'realizado',
    label: 'Realizados',
    description: 'Venda concluída',
    dotClass: 'bg-emerald-300',
    accentClass: 'from-emerald-300/20',
    countClass: 'bg-emerald-300/15 text-emerald-200',
  },
  {
    id: 'reprovado',
    label: 'Reprovados',
    description: 'Fora do fluxo ativo',
    dotClass: 'bg-error',
    accentClass: 'from-error/20',
    countClass: 'bg-error/15 text-error',
  },
]

interface KanbanBoardProps {
  leads: KanbanLead[]
  loading: boolean
  onOpenLead: (leadId: string) => void
}

function LeadCard({ lead, onOpen }: { lead: KanbanLead; onOpen: (leadId: string) => void }) {
  return (
    <div className="group w-full rounded-xl border border-white/[0.065] bg-white/[0.025] p-3.5 text-left transition duration-200 hover:border-primary/25 hover:bg-white/[0.045]">
      <button
        type="button"
        onClick={() => onOpen(lead.id)}
        className="w-full text-left focus-visible:outline-none"
        aria-label={`Abrir lead ${lead.nome}`}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-on-surface transition group-hover:text-primary">
              {lead.nome}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-on-surface-variant/70">
              {[lead.cidade, lead.origem].filter(Boolean).join(' · ') || 'Sem localização'}
            </p>
          </div>
          <svg className="mt-0.5 shrink-0 text-on-surface-variant/30 transition group-hover:translate-x-0.5 group-hover:text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/[0.05] pt-3">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/45">Corretor</p>
            <p className="mt-1 truncate text-[10px] text-on-surface-variant">{lead.corretor || 'Não atribuído'}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/45">Potencial</p>
            <p data-numeric className="mt-1 font-display text-sm text-on-surface">{formatBRLCompact(lead.vgv)}</p>
          </div>
        </div>
      </button>

      {lead.telefone ? (
        <div className="mt-2.5 flex justify-end">
          <WhatsAppButton
            telefone={lead.telefone}
            nome={lead.nome}
            variant="icon"
          />
        </div>
      ) : null}
    </div>
  )
}

function KanbanColumn({
  stage,
  leads,
  onOpenLead,
}: {
  stage: StageConfig
  leads: KanbanLead[]
  onOpenLead: (leadId: string) => void
}) {
  return (
    <section
      className="flex max-h-[calc(100dvh-15rem)] min-h-[28rem] w-[min(19rem,86vw)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-surface-lowest/65 backdrop-blur-xl lg:w-[19rem]"
      aria-labelledby={`kanban-${stage.id}`}
    >
      <div className={`border-b border-white/[0.06] bg-gradient-to-r ${stage.accentClass} to-transparent px-4 py-4`}>
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${stage.dotClass} shadow-[0_0_14px_currentColor]`} />
          <h2 id={`kanban-${stage.id}`} className="flex-1 font-sans text-[13px] font-semibold tracking-[-0.01em] text-on-surface">
            {stage.label}
          </h2>
          <span className={`min-w-7 rounded-full px-2 py-1 text-center text-[10px] font-bold ${stage.countClass}`}>
            {leads.length}
          </span>
        </div>
        <p className="ml-[1.125rem] mt-1 text-[10px] text-on-surface-variant/55">{stage.description}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
        {leads.length > 0 ? (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />)
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-5 text-center">
            <span className="mb-2 text-xl text-on-surface-variant/25">◇</span>
            <p className="text-[11px] text-on-surface-variant/55">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function KanbanBoard({ leads, loading, onOpenLead }: KanbanBoardProps) {
  const leadsByStage = useMemo(() => {
    const grouped = Object.fromEntries(
      KANBAN_STAGES.map((stage) => [stage.id, [] as KanbanLead[]]),
    ) as Record<EtapaFunil, KanbanLead[]>

    leads.forEach((lead) => grouped[lead.etapa].push(lead))
    return grouped
  }, [leads])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden" role="status" aria-live="polite">
        <span className="sr-only">Carregando quadro Kanban</span>
        {KANBAN_STAGES.slice(0, 4).map((stage) => (
          <div key={stage.id} className="h-[34rem] w-[min(20rem,86vw)] shrink-0 animate-pulse rounded-[1.35rem] border border-white/[0.05] bg-white/[0.025]" />
        ))}
      </div>
    )
  }

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12"
      aria-label="Quadro Kanban de leads por etapa"
    >
      {KANBAN_STAGES.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          leads={leadsByStage[stage.id]}
          onOpenLead={onOpenLead}
        />
      ))}
    </div>
  )
}
