'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useToast } from '@/lib/contexts/ToastContext'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PageHeading } from '@/components/ui/PageHeading'
import { OperacaoToggle } from '@/components/ui/OperacaoToggle'
import { useOperacao } from '@/lib/contexts/OperacaoContext'
import { ExportExcelButton } from '@/components/export/ExportExcelButton'
import {
  getLeadsWithFilters,
  countLeadsByEtapa,
  getFilterOptions,
  getTopByCorretor,
  getTopByOrigem,
  getTopByCidade,
  getTimelineByEtapa,
  deleteLead,
} from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const QuickAddLeadModal = dynamic(
  () => import('@/components/leads/QuickAddLeadModal').then((module) => module.QuickAddLeadModal),
  { ssr: false },
)
const EditLeadModal = dynamic(
  () => import('@/components/leads/EditLeadModal').then((module) => module.EditLeadModal),
  { ssr: false },
)

const ITEMS_PER_PAGE = 50

export default function LeadsPage() {
  const { tipoOperacao, setTipoOperacao } = useOperacao()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [topCorretores, setTopCorretores] = useState<any[]>([])
  const [topOrigens, setTopOrigens] = useState<any[]>([])
  const [topCidades, setTopCidades] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || undefined,
    corretor: searchParams.get('corretor') || undefined,
    coordenador: searchParams.get('coordenador') || undefined,
    construtora: searchParams.get('construtora') || undefined,
    cidade: searchParams.get('cidade') || undefined,
    origem: searchParams.get('origem') || undefined,
    dataInicio: searchParams.get('dataInicio') || undefined,
    dataFim: searchParams.get('dataFim') || undefined,
    tipoOperacao,
  })

  const refreshLeads = async () => {
    const [{ leads: data, total }, counts] = await Promise.all([
      getLeadsWithFilters(filters, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
      countLeadsByEtapa(filters),
    ])
    setLeads(data)
    setTotalLeads(total)
    setTotalCount(Object.values(counts).reduce((a: number, b: number) => a + b, 0))
  }

  const handleAddSuccess = () => {
    setShowAddModal(false)
    void refreshLeads()
  }

  const handleEditSuccess = () => {
    setEditingLead(null)
    void refreshLeads()
  }

  const handleDelete = async (lead: Lead) => {
    try {
      await deleteLead(lead.id || '')
      addToast(`Lead ${lead.nome} excluído com sucesso!`, 'success')
      // Atualiza lista e quantidade na hora
      setLeads((prev) => prev.filter((l) => l.id !== lead.id))
      setTotalLeads((n) => Math.max(0, n - 1))
      setTotalCount((n) => Math.max(0, n - 1))
      void refreshLeads()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar lead'
      addToast(message, 'error')
      console.error('Erro ao deletar lead:', error)
      throw error
    }
  }

  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipoOperacao }))
    setCurrentPage(1)
  }, [tipoOperacao])

  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await getFilterOptions()
      setFilterOptions(options)
    }
    loadFilterOptions()

    const onFocus = () => {
      void loadFilterOptions()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true)
        // A tabela, os indicadores e os gráficos não devem esperar uns pelos
        // outros. Antes estas chamadas eram encadeadas, atrasando a lista após
        // criar ou editar um lead.
        const [listResult, counts, corretores, origens, cidades, timeline] = await Promise.all([
          getLeadsWithFilters(filters, {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          }),
          countLeadsByEtapa(filters),
          getTopByCorretor(undefined, filters),
          getTopByOrigem(undefined, filters),
          getTopByCidade(undefined, filters),
          getTimelineByEtapa(undefined, filters),
        ])

        setLeads(listResult.leads)
        setTotalLeads(listResult.total)
        setTotalCount(
          Object.values(counts).reduce((a: any, b: any) => a + b, 0)
        )

        setTopCorretores(corretores)
        setTopOrigens(origens)
        setTopCidades(cidades)
        setTimelineData(timeline)
      } catch (error) {
        console.error('Erro ao carregar leads:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeads()
  }, [filters, currentPage])

  const columns = [
    { key: 'data_entrada', label: 'Data' },
    { key: 'nome', label: 'Cliente' },
    { key: 'cpf', label: 'CPF' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'origem', label: 'Origem' },
  ]

  return (
    <div className="page-section">
      <PageHeading
        title="Leads"
        description="Base comercial, origem e volume de entradas no funil."
        actions={(
          <>
            <ExportExcelButton />
            <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary">
              Novo lead
            </button>
          </>
        )}
      />

      <div className="card">
        <OperacaoToggle value={tipoOperacao} onChange={setTipoOperacao} />
      </div>

      <FilterBar filters={filters} onFilterChange={(f: any) => { setFilters({ ...f, tipoOperacao }); setCurrentPage(1) }} filterOptions={filterOptions} />

      <MetricsRow
        metrics={[
          { label: 'Quantidade', value: totalCount },
        ]}
      />

      <TimelineChart data={timelineData} title="Quantidade | Mês" height={300} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalysisCard title="Quantidade | Corretor" data={topCorretores} />
        <AnalysisCard title="Quantidade | Origem" data={topOrigens} />
        <AnalysisCard title="Quantidade | Cidade" data={topCidades} />
      </div>

      <div>
        <h2 className="section-title">Clientes</h2>
        <LeadsTable
          leads={leads}
          columns={columns}
          isLoading={loading}
          totalItems={totalLeads}
          currentPage={currentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          onEdit={setEditingLead}
          onDelete={handleDelete}
        />
      </div>

      {/* Quick Add Modal */}
      <QuickAddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        corretores={filterOptions.corretores || []}
        cidades={filterOptions.cidades || []}
      />

      {/* Edit Modal */}
      {editingLead && (
        <EditLeadModal
          isOpen={true}
          leadId={editingLead.id || ''}
          initialLead={editingLead}
          onClose={() => setEditingLead(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
