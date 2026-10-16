'use client'

import { useEffect, useState } from 'react'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PageHeading } from '@/components/ui/PageHeading'
import { getLeadsWithFilters, getFilterOptions, getTopByCorretor, getTopByConstrutora, getTopByCoordenador, getTopByCidade } from '@/lib/services/leads'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function AprovadosPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [totalVGV, setTotalVGV] = useState(0)
  const [topCorretores, setTopCorretores] = useState<any[]>([])
  const [topConstrutoras, setTopConstrutoras] = useState<any[]>([])
  const [topCoordenadores, setTopCoordenadores] = useState<any[]>([])
  const [topCidades, setTopCidades] = useState<any[]>([])
  const [topZonas, setTopZonas] = useState<any[]>([])

  const [filters, setFilters] = useState({
    etapa: 'aprovado' as any,
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

        const [corretores, construtoras, coordenadores, cidades] = await Promise.all([
          getTopByCorretor('aprovado', filters),
          getTopByConstrutora('aprovado', filters),
          getTopByCoordenador('aprovado', filters),
          getTopByCidade('aprovado', filters),
        ])

        setTopCorretores(corretores)
        setTopConstrutoras(construtoras)
        setTopCoordenadores(coordenadores)
        setTopCidades(cidades)
        setTopZonas([]) // TODO: Implement getTopByZona if needed
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
        title="Aprovados"
        description="Clientes com crédito aprovado e valor de avaliação."
      />

      <FilterBar filters={filters} onFilterChange={(f: any) => { setFilters({ ...f, etapa: 'aprovado' }); setCurrentPage(1) }} filterOptions={filterOptions} />

      <MetricsRow
        metrics={[
          { label: 'Quantidade', value: totalLeads },
          { label: 'Valor de Avaliação', value: totalVGV, format: 'currency' },
        ]}
      />

      <TimelineChart data={[{ name: 'jan/25', value: 8 }, { name: 'fev/25', value: 12 }, { name: 'mar/25', value: 10 }, { name: 'abr/25', value: 18 }, { name: 'mai/25', value: 15 }, { name: 'jun/26', value: 20 }]} title="Quantidade | Mês" height={300} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnalysisCard title="Quantidade | Corretor" data={topCorretores.length > 0 ? topCorretores : []} />
        <AnalysisCard title="Quantidade | Construtora" data={topConstrutoras.length > 0 ? topConstrutoras : []} />
        <AnalysisCard title="Quantidade | CEP" data={[]} />
        <AnalysisCard title="Quantidade | Coordenador" data={topCoordenadores.length > 0 ? topCoordenadores : []} />
        <AnalysisCard title="Quantidade | Cidade" data={topCidades.length > 0 ? topCidades : []} />
        <AnalysisCard title="Quantidade | Zona" data={topZonas.length > 0 ? topZonas : []} />
      </div>

      <div>
        <h2 className="section-title">Clientes aprovados</h2>
        <LeadsTable leads={leads} columns={[{ key: 'data_entrada', label: 'Data' }, { key: 'nome', label: 'Cliente' }, { key: 'cpf', label: 'CPF' }, { key: 'telefone', label: 'Telefone' }, { key: 'cidade', label: 'Cidade' }, { key: 'construtora', label: 'Construtora' }, { key: 'corretor', label: 'Corretor' }]} isLoading={loading} totalItems={totalLeads} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>
    </div>
  )
}
