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
  getTopByCorretor,
  getTopByOrigem,
  getTopByVGVCorretor,
  getTopByVGVCoordenador,
  getTopByConstrutora,
  getTopByCoordenador,
  getTimelineByEtapa,
} from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function EspeculativoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<Record<string, unknown>>({})
  const [totalVGV, setTotalVGV] = useState(0)
  const [timelineData, setTimelineData] = useState<Array<{ name: string; value: number }>>([])
  const [topCorretores, setTopCorretores] = useState<Array<{ label: string; value: number }>>([])
  const [topVGVCorretores, setTopVGVCorretores] = useState<Array<{ label: string; value: number }>>([])
  const [topConstrutoras, setTopConstrutoras] = useState<Array<{ label: string; value: number }>>([])
  const [topOrigens, setTopOrigens] = useState<Array<{ label: string; value: number }>>([])
  const [topCoordenadores, setTopCoordenadores] = useState<Array<{ label: string; value: number }>>([])
  const [topVGVCoordenadores, setTopVGVCoordenadores] = useState<
    Array<{ label: string; value: number }>
  >([])

  const [filters, setFilters] = useState({
    etapa: 'especulativo' as const,
    corretor: undefined as string | undefined,
    coordenador: undefined as string | undefined,
    construtora: undefined as string | undefined,
    cidade: undefined as string | undefined,
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
        const vgv = data.reduce((sum, l) => sum + (Number(l.vgv) || 0), 0)
        setTotalVGV(vgv)

        const [
          corretores,
          vgvCorretores,
          construtoras,
          origens,
          coordenadores,
          vgvCoordenadores,
          timeline,
        ] = await Promise.all([
          getTopByCorretor('especulativo', filters),
          getTopByVGVCorretor('especulativo', filters),
          getTopByConstrutora('especulativo', filters),
          getTopByOrigem('especulativo', filters),
          getTopByCoordenador('especulativo', filters),
          getTopByVGVCoordenador('especulativo', filters),
          getTimelineByEtapa('especulativo', filters),
        ])

        setTopCorretores(corretores)
        setTopVGVCorretores(vgvCorretores)
        setTopConstrutoras(construtoras)
        setTopOrigens(origens)
        setTopCoordenadores(coordenadores)
        setTopVGVCoordenadores(vgvCoordenadores)
        setTimelineData(timeline)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [filters, currentPage])

  return (
    <div className="page-section">
      <PageHeading
        title="Especulativo"
        description="Propostas em andamento e VGV em carteira."
      />

      <FilterBar
        filters={filters}
        onFilterChange={(f) => {
          setFilters({
            etapa: 'especulativo',
            corretor: f.corretor,
            coordenador: f.coordenador,
            construtora: f.construtora,
            cidade: f.cidade,
          })
          setCurrentPage(1)
        }}
        filterOptions={filterOptions}
      />

      <MetricsRow
        metrics={[
          { label: 'Quantidade', value: totalLeads },
          { label: 'VGV', value: totalVGV, format: 'currency' },
          {
            label: 'Média VGV',
            value: totalLeads > 0 ? totalVGV / totalLeads : 0,
            format: 'currency',
          },
          { label: 'Faturamento Previsto', value: totalVGV * 0.04, format: 'currency' },
        ]}
      />

      <TimelineChart data={timelineData} title="Quantidade | Mês" height={300} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalysisCard
          title="Quantidade | Corretor"
          data={topCorretores.length > 0 ? topCorretores : []}
        />
        <AnalysisCard
          title="VGV | Corretor"
          data={topVGVCorretores.length > 0 ? topVGVCorretores : []}
          variant="currency"
        />
        <AnalysisCard
          title="Quantidade | Construtora"
          data={topConstrutoras.length > 0 ? topConstrutoras : []}
        />
        <AnalysisCard
          title="Quantidade | Origem"
          data={topOrigens.length > 0 ? topOrigens : []}
        />
        <AnalysisCard
          title="Quantidade | Coordenador"
          data={topCoordenadores.length > 0 ? topCoordenadores : []}
        />
        <AnalysisCard
          title="VGV | Coordenador"
          data={topVGVCoordenadores.length > 0 ? topVGVCoordenadores : []}
          variant="currency"
        />
      </div>

      <div>
        <h2 className="section-title">Clientes em especulativo</h2>
        <LeadsTable
          leads={leads}
          columns={[
            { key: 'data_entrada', label: 'Data' },
            { key: 'nome', label: 'Cliente' },
            { key: 'cpf', label: 'CPF' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'cidade', label: 'Cidade' },
            { key: 'origem', label: 'Origem' },
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
