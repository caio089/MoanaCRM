'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { PageHeading } from '@/components/ui/PageHeading'
import { OperacaoToggle } from '@/components/ui/OperacaoToggle'
import { FilterBar, type FilterBarFilters } from '@/components/dashboard/FilterBar'
import { etapasPorOperacao } from '@/lib/constants/operacao'
import { useOperacao } from '@/lib/contexts/OperacaoContext'
import { getKanbanLeads, getFilterOptions } from '@/lib/services/leads'
import { useToast } from '@/lib/contexts/ToastContext'
import type { KanbanLead } from '@/lib/types'

const EditLeadModal = dynamic(
  () => import('@/components/leads/EditLeadModal').then((module) => module.EditLeadModal),
  { ssr: false },
)

export default function KanbanPage() {
  const { tipoOperacao, setTipoOperacao } = useOperacao()
  const { addToast } = useToast()
  const [leads, setLeads] = useState<KanbanLead[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    corretores?: Array<string | { value: string; label: string; coordenadorId?: string | null }>
    coordenadores?: Array<string | { value: string; label: string }>
    cidades?: Array<string | { value: string; label: string }>
    etapas?: Array<string | { value: string; label: string }>
  }>({})
  const [filters, setFilters] = useState<FilterBarFilters>({})

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true)
      const [kanban, options] = await Promise.all([getKanbanLeads(), getFilterOptions()])
      setLeads(kanban)
      setFilterOptions({
        corretores: options.corretores,
        coordenadores: options.coordenadores,
        cidades: options.cidades,
        etapas: etapasPorOperacao(tipoOperacao),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar o Kanban.'
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, tipoOperacao])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const { filteredLeads, activeLeads } = useMemo(() => {
    const query = (filters.search || '').trim().toLocaleLowerCase('pt-BR')
    let active = 0

    const corretorLabel = (() => {
      if (!filters.corretor) return null
      const opt = (filterOptions.corretores || []).find((item) =>
        typeof item === 'string' ? item === filters.corretor : item.value === filters.corretor,
      )
      if (!opt) return filters.corretor
      return typeof opt === 'string' ? opt : opt.label
    })()

    const filtered = leads.filter((lead) => {
      if ((lead.tipoOperacao ?? 'venda') !== tipoOperacao) return false
      if (corretorLabel && lead.corretor !== corretorLabel) return false
      if (filters.etapa && lead.etapa !== filters.etapa) return false
      if (filters.cidade && lead.cidade !== filters.cidade) return false

      const matches =
        !query ||
        [lead.nome, lead.cidade, lead.corretor, lead.origem]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(query))

      if (matches && lead.etapa !== 'realizado' && lead.etapa !== 'reprovado') active += 1
      return matches
    })

    return { filteredLeads: filtered, activeLeads: active }
  }, [filterOptions.corretores, filters, leads, tipoOperacao])

  return (
    <div className="page-section max-w-none">
      <PageHeading
        eyebrow="Pipeline comercial"
        title="Kanban de oportunidades"
        description="Acompanhe cada lead no processo comercial e abra um cartão para atualizar seus dados ou sua etapa."
        actions={(
          <Link href="/novo-lead" className="btn-primary">
            Novo lead
          </Link>
        )}
      />

      <div className="card">
        <OperacaoToggle value={tipoOperacao} onChange={setTipoOperacao} />
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        filterOptions={filterOptions}
        hideDatePicker
      />

      <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/[0.065] bg-white/[0.022] px-4 py-3 sm:px-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant/55">
          Deslize horizontalmente para navegar pelas etapas
        </p>
        <div className="flex gap-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/50">Visíveis</p>
            <p data-numeric className="mt-1 font-display text-2xl text-on-surface">{filteredLeads.length}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/50">Em andamento</p>
            <p data-numeric className="mt-1 font-display text-2xl text-primary">{activeLeads}</p>
          </div>
        </div>
      </div>

      <KanbanBoard
        leads={filteredLeads}
        loading={loading}
        onOpenLead={setEditingLeadId}
        operacao={tipoOperacao}
      />

      {editingLeadId && (
        <EditLeadModal
          isOpen
          leadId={editingLeadId}
          onClose={() => setEditingLeadId(null)}
          onSuccess={() => {
            setEditingLeadId(null)
            loadLeads()
          }}
        />
      )}
    </div>
  )
}
