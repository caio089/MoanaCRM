'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FilterBar, type FilterBarFilters, type FilterOption } from '@/components/dashboard/FilterBar'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageHeading } from '@/components/ui/PageHeading'
import { parsePeriodo, PERIODO_LABEL, type PeriodoFiltro } from '@/lib/periodo'
import {
  getDashboardSummary,
  type DashboardSummary,
} from '@/lib/services/metrics'
import { getTeamHierarchy } from '@/lib/services/team'
import type { EtapaFunil } from '@/lib/types'

const LABELS: Record<EtapaFunil, string> = {
  lead: 'Lead',
  analise: 'Análise',
  aprovado: 'Aprovado',
  especulativo: 'Especulativo',
  realizado: 'Realizado',
  reprovado: 'Reprovado',
  visita: 'Visita',
}

const ETAPAS_OPCOES: FilterOption[] = (
  Object.entries(LABELS) as Array<[EtapaFunil, string]>
).map(([value, label]) => ({ value, label }))

const CORES: Record<EtapaFunil, string> = {
  lead: '#B8A6D9',
  analise: '#D9BD84',
  aprovado: '#91C9AA',
  especulativo: '#CDA36D',
  realizado: '#79AEB6',
  reprovado: '#D58F8C',
  visita: '#8EABC9',
}

const DEFAULT_PERIODO: PeriodoFiltro = '30d'

const EMPTY_SUMMARY: DashboardSummary = {
  totalLeads: 0,
  totalAprovados: 0,
  totalRealizados: 0,
  taxaAprovacao: 0,
  taxaRealizacao: 0,
  vgvTotal: 0,
  vgvRealizado: 0,
  variacao: 0,
  leadsSemCorretor: 0,
  totalConstrutoras: 0,
  principalConstrutora: null,
  participacaoPrincipalConstrutora: 0,
  porEtapa: { total: 0 },
  topCorretores: [],
  topCoordenadores: [],
  topConstrutoras: [],
  clientesRecentes: [],
}

function parseEtapa(value: string | null): EtapaFunil | undefined {
  if (!value) return undefined
  return value in LABELS ? (value as EtapaFunil) : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props
  return (
    <text x={x} y={y} textAnchor="middle" fill="rgb(var(--on-surface-variant-rgb))" fontSize={10}>
      {payload.value}
    </text>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props
  return (
    <text x={x} y={y} textAnchor="end" fill="rgb(var(--on-surface-variant-rgb))" fontSize={11}>
      {payload.value}
    </text>
  )
}

export default function VisaoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const periodo = parsePeriodo(searchParams.get('periodo'))
  const coordenadorId = searchParams.get('coordenador') || undefined
  const corretorId = searchParams.get('corretor') || undefined
  const etapa = parseEtapa(searchParams.get('etapa'))

  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [coordOptions, setCoordOptions] = useState<FilterOption[]>([])
  const [corrOptions, setCorrOptions] = useState<FilterOption[]>([])

  const syncUrl = useCallback(
    (next: {
      periodo?: PeriodoFiltro
      coordenador?: string
      corretor?: string
      etapa?: string
    }) => {
      const params = new URLSearchParams()
      const p = next.periodo ?? DEFAULT_PERIODO
      if (p !== DEFAULT_PERIODO) params.set('periodo', p)
      if (next.coordenador) params.set('coordenador', next.coordenador)
      if (next.corretor) params.set('corretor', next.corretor)
      if (next.etapa) params.set('etapa', next.etapa)

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const barFilters: FilterBarFilters = useMemo(
    () => ({
      coordenador: coordenadorId,
      corretor: corretorId,
      etapa,
    }),
    [coordenadorId, corretorId, etapa],
  )

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      try {
        const hierarchy = await getTeamHierarchy(true)
        if (cancelled) return

        setCoordOptions(
          hierarchy.map((c) => ({ value: c.id, label: c.nome })),
        )
        setCorrOptions(
          hierarchy.flatMap((c) =>
            c.corretores.map((corr) => ({
              value: corr.id,
              label: corr.nome,
              coordenadorId: c.id,
            })),
          ),
        )

        // Deep link: coordenador + corretor incompatíveis → remove corretor da URL
        if (coordenadorId && corretorId) {
          const coord = hierarchy.find((c) => c.id === coordenadorId)
          const pertencente = coord?.corretores.some((c) => c.id === corretorId)
          if (!pertencente) {
            syncUrl({
              periodo,
              coordenador: coordenadorId,
              etapa,
            })
          }
        }
      } catch (err) {
        console.error('Erro ao carregar opções de equipe:', err)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
    // Só na montagem + ao voltar para a aba (cadastro novo de equipe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function reloadTeam() {
      void getTeamHierarchy(true)
        .then((hierarchy) => {
          setCoordOptions(hierarchy.map((c) => ({ value: c.id, label: c.nome })))
          setCorrOptions(
            hierarchy.flatMap((c) =>
              c.corretores.map((corr) => ({
                value: corr.id,
                label: corr.nome,
                coordenadorId: c.id,
              })),
            ),
          )
        })
        .catch((err) => console.error('Erro ao recarregar equipe:', err))
    }

    const onFocus = () => reloadTeam()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      try {
        setLoading(true)
        const data = await getDashboardSummary({
          periodo,
          coordenadorId,
          corretorId,
          etapa,
        })
        if (!cancelled) setSummary(data)
      } catch (err) {
        console.error('Erro ao carregar visão geral:', err)
        if (!cancelled) setSummary(EMPTY_SUMMARY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSummary()
    return () => {
      cancelled = true
    }
  }, [periodo, coordenadorId, corretorId, etapa])

  const handleFilterChange = (filters: FilterBarFilters) => {
    // Limpar (clearDefaults / {}) → padrão 30d sem entidade
    const hasEntity =
      Boolean(filters.coordenador) ||
      Boolean(filters.corretor) ||
      Boolean(filters.etapa)

    if (!hasEntity && !filters.search && Object.keys(filters).length === 0) {
      syncUrl({ periodo: DEFAULT_PERIODO })
      return
    }

    syncUrl({
      periodo,
      coordenador: filters.coordenador,
      corretor: filters.corretor,
      etapa: filters.etapa,
    })
  }

  const handlePeriodo = (p: PeriodoFiltro) => {
    syncUrl({
      periodo: p,
      coordenador: coordenadorId,
      corretor: corretorId,
      etapa,
    })
  }

  const handleExportar = () => {
    const coordLabel =
      coordOptions.find(
        (o) => (typeof o === 'string' ? o : o.value) === coordenadorId,
      )
    const corrLabel =
      corrOptions.find(
        (o) => (typeof o === 'string' ? o : o.value) === corretorId,
      )

    const csv = [
      ['Métrica', 'Valor'],
      ['Período', PERIODO_LABEL[periodo]],
      [
        'Coordenador',
        coordLabel
          ? typeof coordLabel === 'string'
            ? coordLabel
            : coordLabel.label
          : 'Todos',
      ],
      [
        'Corretor',
        corrLabel
          ? typeof corrLabel === 'string'
            ? corrLabel
            : corrLabel.label
          : 'Todos',
      ],
      ['Etapa', etapa ? LABELS[etapa] : 'Todas'],
      ['Total de Leads', summary.totalLeads],
      ['Aprovados', summary.totalAprovados],
      ['Realizados', summary.totalRealizados],
      ['Taxa Aprovação', `${summary.taxaAprovacao.toFixed(1)}%`],
      ['Taxa Realização', `${summary.taxaRealizacao.toFixed(1)}%`],
      ['VGV Total', `R$ ${summary.vgvTotal.toLocaleString('pt-BR')}`],
      ['VGV Realizado', `R$ ${summary.vgvRealizado.toLocaleString('pt-BR')}`],
      ['Leads sem corretor', summary.leadsSemCorretor],
      ['Construtoras no período', summary.totalConstrutoras],
      ['Principal construtora', summary.principalConstrutora ?? 'Não informada'],
      [
        'Participação da principal construtora',
        `${summary.participacaoPrincipalConstrutora.toFixed(1)}%`,
      ],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const {
    totalLeads,
    totalAprovados,
    totalRealizados,
    taxaAprovacao,
    taxaRealizacao,
    vgvTotal,
    vgvRealizado,
    variacao,
    leadsSemCorretor,
    totalConstrutoras,
    principalConstrutora,
    participacaoPrincipalConstrutora,
    porEtapa,
    topCorretores,
    topCoordenadores,
    topConstrutoras,
    clientesRecentes,
  } = summary

  const funil = (Object.entries(LABELS) as Array<[EtapaFunil, string]>).map(
    ([key, label]) => ({
      name: label,
      value: porEtapa[key] || 0,
      fill: CORES[key],
    }),
  )

  if (loading) {
    return (
      <div className="page-section">
        <p className="text-on-surface-variant">Carregando panorama comercial…</p>
      </div>
    )
  }

  return (
    <div className="page-section">
      <PageHeading
        title="Dashboard executivo"
        description="Panorama do funil, corretores e valor gerado no período."
        actions={(
          <>
            {(['7d', '30d', '90d', 'todos'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodo(p)}
                className={`chip ${periodo === p ? 'chip-active' : ''}`}
              >
                {PERIODO_LABEL[p]}
              </button>
            ))}
            <button type="button" onClick={handleExportar} className="chip">
              Exportar
            </button>
          </>
        )}
      />

      <FilterBar
        filters={barFilters}
        onFilterChange={handleFilterChange}
        hideSearch
        hideDatePicker
        clearDefaults={{}}
        forceShowClear={periodo !== DEFAULT_PERIODO}
        filterOptions={{
          coordenadores: coordOptions,
          corretores: corrOptions,
          etapas: ETAPAS_OPCOES,
        }}
      />

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard titulo="Total de Leads" valor={totalLeads} accentColor="text-primary" />
        <KpiCard titulo="Aprovados" valor={totalAprovados} accentColor="text-tertiary" />
        <KpiCard titulo="Realizados" valor={totalRealizados} accentColor="text-primary" />
        <KpiCard
          titulo="Construtoras no período"
          valor={totalConstrutoras}
          subtitulo={
            principalConstrutora
              ? `Líder: ${principalConstrutora} · ${participacaoPrincipalConstrutora.toFixed(1)}% dos leads informados`
              : 'Nenhuma construtora informada'
          }
          accentColor="text-secondary"
        />
        <KpiCard
          titulo="Variação"
          valor={Math.abs(variacao)}
          tipo="percentual"
          accentColor={variacao >= 0 ? 'text-tertiary' : 'text-error'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
              Coordenadores
            </p>
            <Link href="/admin/coordenadores" className="text-label-sm font-semibold text-primary">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2.5">
            {topCoordenadores.length ? (
              topCoordenadores.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="text-label-sm text-on-surface-variant/55">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-label-md text-on-surface">
                    {item.name}
                  </span>
                  <span data-numeric className="text-label-md font-semibold text-primary">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-body-md text-on-surface-variant">
                Sem coordenadores no período.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
              Construtoras
            </p>
            <Link href="/construtoras" className="text-label-sm font-semibold text-primary">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2.5">
            {topConstrutoras.length ? (
              topConstrutoras.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="text-label-sm text-on-surface-variant/55">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-label-md text-on-surface">
                    {item.name}
                  </span>
                  <span data-numeric className="text-label-md font-semibold text-primary">
                    {item.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-body-md text-on-surface-variant">
                Sem construtoras no período.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
            Atenção comercial
          </p>
          <p data-numeric className="mt-5 font-display text-5xl text-error">
            {leadsSemCorretor}
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            leads sem corretor responsável no período selecionado.
          </p>
          <Link href="/leads" className="mt-5 inline-flex text-label-md font-semibold text-primary">
            Abrir carteira →
          </Link>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card card-interactive min-w-0">
          <p className="mb-5 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
            Funil de vendas
          </p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funil} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 6"
                  stroke="rgba(245,241,232,0.055)"
                />
                <XAxis dataKey="name" stroke="transparent" tick={<CustomXAxisTick />} interval={0} />
                <YAxis stroke="transparent" tick={<CustomYAxisTick />} width={28} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--surface-container-rgb))',
                    border: '1px solid rgba(217,189,132,0.16)',
                    borderRadius: 14,
                    color: 'rgb(var(--on-surface-rgb))',
                    boxShadow: '0 18px 45px rgba(0,0,0,.35)',
                  }}
                  cursor={{ fill: 'rgba(217,189,132,0.06)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {funil.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-interactive min-w-0">
          <p className="mb-5 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
            Top 5 corretores
          </p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCorretores}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 6"
                  stroke="rgba(245,241,232,0.055)"
                />
                <XAxis type="number" stroke="transparent" tick={<CustomXAxisTick />} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="transparent"
                  width={88}
                  tick={<CustomYAxisTick />}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--surface-container-rgb))',
                    border: '1px solid rgba(184,166,217,0.16)',
                    borderRadius: 14,
                    color: 'rgb(var(--on-surface-rgb))',
                    boxShadow: '0 18px 45px rgba(0,0,0,.35)',
                  }}
                  cursor={{ fill: 'rgba(184,166,217,0.06)' }}
                />
                <Bar dataKey="leads" fill="#B8A6D9" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPIs Detalhados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Taxa de Aprovação"
          valor={taxaAprovacao}
          tipo="percentual"
          accentColor="text-tertiary"
        />
        <KpiCard
          titulo="Taxa de Realização"
          valor={taxaRealizacao}
          tipo="percentual"
          accentColor="text-tertiary"
        />
        <KpiCard titulo="VGV Total" valor={vgvTotal} tipo="moeda" accentColor="text-secondary" />
        <KpiCard
          titulo="VGV Realizado"
          valor={vgvRealizado}
          tipo="moeda"
          accentColor="text-primary"
        />
      </div>

      {/* Distribuição por Etapa */}
      <div className="card card-interactive">
        <p className="mb-5 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
          Distribuição por etapa
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {(Object.entries(LABELS) as Array<[EtapaFunil, string]>).map(([key, label]) => (
            <div
              key={key}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.022] px-3 py-5 text-center transition hover:border-primary/15 hover:bg-primary/[0.035]"
            >
              <p className="text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                {label}
              </p>
              <p className="mt-2 font-display text-3xl text-on-surface">{porEtapa[key] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Movimentações</p>
            <h2 className="text-headline-sm text-on-surface">Clientes atualizados recentemente</h2>
          </div>
          <Link href="/leads" className="text-label-md font-semibold text-primary">
            Ver carteira
          </Link>
        </div>
        <div className="divide-y divide-white/[0.055]">
          {clientesRecentes.map((lead) => (
            <Link
              key={lead.id}
              href={`/clientes/${encodeURIComponent(lead.id)}`}
              className="flex items-center gap-3 py-3.5 transition hover:bg-white/[0.02] sm:px-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-sm font-bold uppercase text-primary">
                {lead.nome.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-semibold text-on-surface">{lead.nome}</p>
                <p className="truncate text-label-sm text-on-surface-variant">
                  {[lead.corretor, lead.construtora].filter(Boolean).join(' · ') ||
                    'Sem responsável'}
                </p>
              </div>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-label-sm text-on-surface-variant">
                {LABELS[lead.etapa]}
              </span>
            </Link>
          ))}
          {!clientesRecentes.length && (
            <p className="py-4 text-body-md text-on-surface-variant">
              Nenhum cliente no recorte atual.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
