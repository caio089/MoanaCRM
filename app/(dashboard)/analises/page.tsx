'use client'

import { useEffect, useState } from 'react'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PageHeading } from '@/components/ui/PageHeading'
import { getLeadsWithFilters, getFilterOptions, getTopByTipoRenda, getTopByComprovacao, getTopByCorretor, getTopByConstrutora, getTopByOrigem, getTopByCoordenador } from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function AnalisesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [topTipoRenda, setTopTipoRenda] = useState<any[]>([])
  const [topComprovacao, setTopComprovacao] = useState<any[]>([])
  const [topCorretores, setTopCorretores] = useState<any[]>([])
  const [topConstrutoras, setTopConstrutoras] = useState<any[]>([])
  const [topOrigens, setTopOrigens] = useState<any[]>([])
  const [topCoordenadores, setTopCoordenadores] = useState<any[]>([])

  const [filters, setFilters] = useState({
    etapa: 'analise' as any,
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

        const [tipoRenda, comprovacao, corretores, construtoras, origens, coordenadores] = await Promise.all([
          getTopByTipoRenda('analise', filters),
          getTopByComprovacao('analise', filters),
          getTopByCorretor('analise', filters),
          getTopByConstrutora('analise', filters),
          getTopByOrigem('analise', filters),
          getTopByCoordenador('analise', filters),
        ])

        setTopTipoRenda(tipoRenda)
        setTopComprovacao(comprovacao)
        setTopCorretores(corretores)
        setTopConstrutoras(construtoras)
        setTopOrigens(origens)
        setTopCoordenadores(coordenadores)
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
        title="Análises"
        description="Leads em análise de crédito, renda e documentação."
      />

      <FilterBar filters={filters} onFilterChange={(f: any) => { setFilters({ ...f, etapa: 'analise' }); setCurrentPage(1) }} filterOptions={filterOptions} />

      <MetricsRow metrics={[{ label: 'Quantidade', value: totalLeads }]} />

      <TimelineChart data={[
        { name: 'jan/25', value: 12 },
        { name: 'fev/25', value: 19 },
        { name: 'mar/25', value: 15 },
        { name: 'abr/25', value: 25 },
        { name: 'mai/25', value: 22 },
        { name: 'jun/26', value: 30 },
      ]} title="Quantidade | Mês" height={300} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalysisCard title="Quantidade | Tipo de Renda" data={topTipoRenda.length > 0 ? topTipoRenda : []} />
        <AnalysisCard title="Quantidade | Comprovação" data={topComprovacao.length > 0 ? topComprovacao : []} />
        <AnalysisCard title="Quantidade | Corretor" data={topCorretores.length > 0 ? topCorretores : []} />
        <AnalysisCard title="Quantidade | Construtora" data={topConstrutoras.length > 0 ? topConstrutoras : []} />
        <AnalysisCard title="Quantidade | Origem" data={topOrigens.length > 0 ? topOrigens : []} />
        <AnalysisCard title="Quantidade | Coordenador" data={topCoordenadores.length > 0 ? topCoordenadores : []} />
      </div>

      <div>
        <h2 className="section-title">Clientes em análise</h2>
        <LeadsTable leads={leads} columns={[{ key: 'data_entrada', label: 'Data' }, { key: 'nome', label: 'Cliente' }, { key: 'cpf', label: 'CPF' }, { key: 'telefone', label: 'Telefone' }, { key: 'cidade', label: 'Cidade' }, { key: 'construtora', label: 'Construtora' }]} isLoading={loading} totalItems={totalLeads} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
