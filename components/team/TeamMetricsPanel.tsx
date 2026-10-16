'use client'

import Link from 'next/link'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { MetricsRow } from '@/components/dashboard/MetricsRow'
import { KpiCard } from '@/components/ui/KpiCard'
import { calcTaxas } from '@/lib/services/metrics'
import type { EntidadeMetrics, EtapaFunil } from '@/lib/types'

const ETAPA_LABEL: Record<EtapaFunil, string> = {
  lead: 'Lead',
  analise: 'Análise',
  aprovado: 'Aprovado',
  especulativo: 'Especulativo',
  realizado: 'Realizado',
  reprovado: 'Reprovado',
  visita: 'Visita',
}

const ETAPA_ORDER: EtapaFunil[] = [
  'lead',
  'analise',
  'aprovado',
  'especulativo',
  'realizado',
  'reprovado',
  'visita',
]

export type TeamTopItem = {
  id?: string
  label: string
  value: number
  href?: string
}

interface TeamMetricsPanelProps {
  metrics: EntidadeMetrics
  /** Top corretores (apenas painel de coordenador). */
  topCorretores?: TeamTopItem[]
  role: 'coordenador' | 'corretor'
}

/** Painel reutilizável de KPIs, funil e VGV para coordenador/corretor. */
export function TeamMetricsPanel({ metrics, topCorretores, role }: TeamMetricsPanelProps) {
  const { taxaAprovacao, taxaRealizacao } = calcTaxas(metrics)

  const porEtapaData = ETAPA_ORDER.map((etapa) => ({
    label: ETAPA_LABEL[etapa],
    value: metrics.porEtapa[etapa] ?? 0,
  })).filter((item) => item.value > 0)

  return (
    <section className="space-y-6" aria-label={`Métricas do ${role}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard titulo="Total de leads" valor={metrics.totalLeads} accentColor="text-primary" />
        <KpiCard
          titulo="VGV total"
          valor={metrics.vgvTotal}
          tipo="moeda"
          accentColor="text-secondary"
        />
        <KpiCard
          titulo="Taxa de aprovação"
          valor={taxaAprovacao}
          tipo="percentual"
          accentColor="text-tertiary"
        />
        <KpiCard
          titulo="Taxa de realização"
          valor={taxaRealizacao}
          tipo="percentual"
          accentColor="text-primary"
        />
      </div>

      <MetricsRow
        metrics={[
          { label: 'VGV aprovado', value: metrics.vgvAprovado, format: 'currency' },
          { label: 'VGV realizado', value: metrics.vgvRealizado, format: 'currency' },
          {
            label: 'Realizados',
            value: metrics.porEtapa.realizado ?? 0,
          },
          {
            label: 'Em análise',
            value: metrics.porEtapa.analise ?? 0,
          },
        ]}
      />

      <div
        className={`grid grid-cols-1 gap-4 ${
          topCorretores && topCorretores.length > 0 ? 'xl:grid-cols-2' : ''
        }`}
      >
        <AnalysisCard
          title="Quantidade | Etapa"
          data={
            porEtapaData.length > 0
              ? porEtapaData
              : [{ label: 'Sem leads no período', value: 0 }]
          }
        />

        {topCorretores && topCorretores.length > 0 && (
          <div className="card card-interactive">
            <h3 className="mb-5 text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
              Quantidade | Corretores
            </h3>
            <div className="space-y-4">
              {topCorretores.slice(0, 5).map((item) => {
                const max = Math.max(...topCorretores.map((row) => Number(row.value) || 0), 1)
                const content = (
                  <>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="max-w-[68%] truncate text-label-md text-on-surface">
                        {item.label}
                      </span>
                      <span className="font-display text-lg leading-none text-primary">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.055]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/45 via-primary/75 to-primary shadow-[0_0_10px_rgba(217,189,132,.18)]"
                        style={{
                          width: `${Math.min((Number(item.value) / max) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )

                if (item.href) {
                  return (
                    <Link
                      key={item.id ?? item.label}
                      href={item.href}
                      className="block rounded-lg transition hover:bg-white/[0.03]"
                    >
                      {content}
                    </Link>
                  )
                }

                return <div key={item.id ?? item.label}>{content}</div>
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
