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
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)

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
    setEditingLeadId(null)
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
        const { leads: data, total } = await getLeadsWithFilters(filters, {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        })

        setLeads(data)
        setTotalLeads(total)

        const counts = await countLeadsByEtapa(filters)
        setTotalCount(
          Object.values(counts).reduce((a: any, b: any) => a + b, 0)
        )

        const [corretores, origens, cidades] = await Promise.all([
          getTopByCorretor(undefined, filters),
          getTopByOrigem(undefined, filters),
          getTopByCidade(undefined, filters),
        ])

        setTopCorretores(corretores)
        setTopOrigens(origens)
        setTopCidades(cidades)

        const mockTimeline = [
          { name: 'jan/25', value: 45 },
          { name: 'fev/25', value: 52 },
          { name: 'mar/25', value: 48 },
          { name: 'abr/25', value: 61 },
          { name: 'mai/25', value: 55 },
          { name: 'jun/26', value: 67 },
        ]
        setTimelineData(mockTimeline)
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

  const mockCorretores = [
    { label: 'Equipe Norte', value: 345 },
    { label: 'Equipe Sul', value: 287 },
    { label: 'Equipe Centro', value: 256 },
    { label: 'Construtora Moana', value: 189 },
    { label: 'Equipe Leste', value: 145 },
  ]

  const mockOrigens = [
    { label: 'Whatsapp', value: 545 },
    { label: 'Site', value: 536 },
    { label: 'Google Ads', value: 523 },
    { label: 'Facebook Ads', value: 510 },
    { label: 'Portal Imóvel Web', value: 487 },
  ]

  const mockCidades = [
    { label: 'Campo Maior', value: 387 },
    { label: 'Picos', value: 379 },
    { label: 'Altos', value: 369 },
    { label: 'União', value: 368 },
    { label: 'Teresina', value: 364 },
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
        <AnalysisCard title="Quantidade | Corretor" data={topCorretores.length > 0 ? topCorretores : mockCorretores} />
        <AnalysisCard title="Quantidade | Origem" data={topOrigens.length > 0 ? topOrigens : mockOrigens} />
        <AnalysisCard title="Quantidade | Cidade" data={topCidades.length > 0 ? topCidades : mockCidades} />
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
          onEdit={(lead) => setEditingLeadId(lead.id || null)}
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
      {editingLeadId && (
        <EditLeadModal
          isOpen={true}
          leadId={editingLeadId}
          onClose={() => setEditingLeadId(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
