'use client'

import { useEffect, useState } from 'react'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PageHeading } from '@/components/ui/PageHeading'
import {
  getLeadsWithFilters,
  getFilterOptions,
  getTopByCidade,
  getTopByConstrutora,
  getTopByProduto,
  getTopByBairro,
  getTimelineByEtapa,
} from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function VisitasPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [timelineData, setTimelineData] = useState<Array<{ name: string; value: number }>>([])
  const [topCidades, setTopCidades] = useState<any[]>([])
  const [topConstrutoras, setTopConstrutoras] = useState<any[]>([])
  const [topProdutos, setTopProdutos] = useState<any[]>([])
  const [topBairros, setTopBairros] = useState<any[]>([])

  const [filters, setFilters] = useState<{
    etapa: 'visita'
    corretor?: string
    coordenador?: string
    construtora?: string
    cidade?: string
    search?: string
    dataInicio?: string
    dataFim?: string
    origem?: string
  }>({
    etapa: 'visita',
  })

  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await getFilterOptions()
      setFilterOptions(options)
    }
    loadFilterOptions()
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

        const [cidades, construtoras, produtos, bairros, timeline] = await Promise.all([
          getTopByCidade('visita', filters),
          getTopByConstrutora('visita', filters),
          getTopByProduto('visita', filters),
          getTopByBairro('visita', filters),
          getTimelineByEtapa('visita', filters),
        ])

        setTopCidades(cidades)
        setTopConstrutoras(construtoras)
        setTopProdutos(produtos)
        setTopBairros(bairros)
        setTimelineData(timeline)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [filters, currentPage])

  const cidadesUnicas = new Set(leads.map((l) => l.cidade).filter(Boolean)).size
  const produtosUnicos = new Set(leads.map((l) => l.produto).filter(Boolean)).size

  return (
    <div className="page-section">
      <PageHeading
        title="Visitas"
        description="Agendamentos por cidade, construtora, produto e bairro — sem valor financeiro."
      />

      <FilterBar
        filters={filters}
        onFilterChange={(f) => {
          setFilters({ ...f, etapa: 'visita' })
          setCurrentPage(1)
        }}
        filterOptions={filterOptions}
      />

      <MetricsRow
        metrics={[
          { label: 'Visitas', value: totalLeads },
          { label: 'Cidades', value: cidadesUnicas },
          { label: 'Produtos', value: produtosUnicos },
        ]}
      />

      <TimelineChart
        data={timelineData.length > 0 ? timelineData : []}
        title="Quantidade | Mês"
        height={300}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalysisCard title="Quantidade | Cidade" data={topCidades} />
        <AnalysisCard title="Quantidade | Construtora" data={topConstrutoras} />
        <AnalysisCard title="Quantidade | Produto" data={topProdutos} />
        <AnalysisCard title="Quantidade | Bairro" data={topBairros} />
      </div>

      <div>
        <h2 className="section-title">Visitas agendadas</h2>
        <LeadsTable
          leads={leads}
          columns={[
            { key: 'data_entrada', label: 'Data' },
            { key: 'nome', label: 'Cliente' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'produto', label: 'Produto' },
            { key: 'construtora', label: 'Construtora' },
            { key: 'bairro', label: 'Bairro' },
            { key: 'cidade', label: 'Cidade' },
            { key: 'corretor', label: 'Corretor' },
          ]}
          isLoading={loading}
          totalItems={totalLeads}
          currentPage={currentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
