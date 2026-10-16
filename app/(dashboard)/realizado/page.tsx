'use client'

import { useEffect, useState } from 'react'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PageHeading } from '@/components/ui/PageHeading'
import { getLeadsWithFilters, getFilterOptions, getTopByCorretor, getTopByVGVCorretor, getTopByConstrutora, getTopByModalidade, getTopByCidade, getTopByTipo } from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function RealizadoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [totalVGV, setTotalVGV] = useState(0)
  const [topCorretores, setTopCorretores] = useState<any[]>([])
  const [topVGVCorretores, setTopVGVCorretores] = useState<any[]>([])
  const [topConstrutoras, setTopConstrutoras] = useState<any[]>([])
  const [topModalidade, setTopModalidade] = useState<any[]>([])
  const [topCidades, setTopCidades] = useState<any[]>([])
  const [topTipos, setTopTipos] = useState<any[]>([])

  const [filters, setFilters] = useState({
    etapa: 'realizado' as any,
    corretor: undefined,
    coordenador: undefined,
    construtora: undefined,
    cidade: undefined,
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
        const { leads: data, total } = await getLeadsWithFilters(filters, { page: currentPage, limit: ITEMS_PER_PAGE })
        setLeads(data)
        setTotalLeads(total)
        const vgv = data.reduce((sum, l) => sum + (Number(l.vgv) || 0), 0)
        setTotalVGV(vgv)

        const [corretores, vgvCorretores, construtoras, modalidade, cidades, tipos] = await Promise.all([
          getTopByCorretor('realizado', filters),
          getTopByVGVCorretor('realizado', filters),
          getTopByConstrutora('realizado', filters),
          getTopByModalidade('realizado', filters),
          getTopByCidade('realizado', filters),
          getTopByTipo('realizado', filters),
        ])

        setTopCorretores(corretores)
        setTopVGVCorretores(vgvCorretores)
        setTopConstrutoras(construtoras)
        setTopModalidade(modalidade)
        setTopCidades(cidades)
        setTopTipos(tipos)
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
        title="Realizado"
        description="Vendas concluídas e valor gerado no período."
      />

      <FilterBar filters={filters} onFilterChange={(f: any) => { setFilters({ ...f, etapa: 'realizado' }); setCurrentPage(1) }} filterOptions={filterOptions} />

      <MetricsRow
        metrics={[
          { label: 'Quantidade', value: totalLeads },
          { label: 'VGV', value: totalVGV, format: 'currency' },
        ]}
      />

      <TimelineChart data={[{ name: 'jan/25', value: 5 }, { name: 'fev/25', value: 8 }, { name: 'mar/25', value: 6 }, { name: 'abr/25', value: 12 }, { name: 'mai/25', value: 10 }, { name: 'jun/26', value: 15 }]} title="Quantidade | Mês" height={300} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalysisCard title="Quantidade | Corretor" data={topCorretores.length > 0 ? topCorretores : []} />
        <AnalysisCard title="VGV | Corretor" data={topVGVCorretores.length > 0 ? topVGVCorretores : []} variant="currency" />
        <AnalysisCard title="Quantidade | Construtora" data={topConstrutoras.length > 0 ? topConstrutoras : []} />
        <AnalysisCard title="Quantidade | Modalidade" data={topModalidade.length > 0 ? topModalidade : []} />
        <AnalysisCard title="Quantidade | Cidade" data={topCidades.length > 0 ? topCidades : []} />
        <AnalysisCard title="Quantidade | Tipo" data={topTipos.length > 0 ? topTipos : []} />
      </div>

      <div>
        <h2 className="section-title">Clientes realizados</h2>
        <LeadsTable leads={leads} columns={[{ key: 'data_entrada', label: 'Data' }, { key: 'nome', label: 'Cliente' }, { key: 'cpf', label: 'CPF' }, { key: 'telefone', label: 'Telefone' }, { key: 'cidade', label: 'Cidade' }, { key: 'construtora', label: 'Construtora' }, { key: 'corretor', label: 'Corretor' }]} isLoading={loading} totalItems={totalLeads} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
