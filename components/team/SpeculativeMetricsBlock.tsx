'use client'

import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { MetricsRow } from '@/components/dashboard/MetricsRow'

const FATURAMENTO_RATE = 0.04

export type SpeculativeTopItem = {
  label: string
  value: number
}

interface SpeculativeMetricsBlockProps {
  quantidade: number
  vgv: number
  /** Se omitido, usa 4% do VGV (padrão comercial do dashboard). */
  faturamentoPrevisto?: number
  /** Top opcional (ex.: corretores no especulativo do coordenador). */
  top?: SpeculativeTopItem[]
  topTitle?: string
  topVariant?: 'quantity' | 'currency'
  title?: string
}

/** Bloco de métricas especulativas reutilizável (qtd, VGV, faturamento, top). */
export function SpeculativeMetricsBlock({
  quantidade,
  vgv,
  faturamentoPrevisto,
  top,
  topTitle = 'Top | Especulativo',
  topVariant = 'quantity',
  title = 'Especulativo',
}: SpeculativeMetricsBlockProps) {
  const previsto =
    typeof faturamentoPrevisto === 'number' ? faturamentoPrevisto : vgv * FATURAMENTO_RATE
  const media = quantidade > 0 ? vgv / quantidade : 0

  return (
    <section className="space-y-4" aria-labelledby="especulativo-heading">
      <div>
        <h2 id="especulativo-heading" className="section-title mb-1">
          {title}
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Propostas em carteira e faturamento previsto no escopo selecionado.
        </p>
      </div>

      <MetricsRow
        metrics={[
          { label: 'Quantidade', value: quantidade },
          { label: 'VGV', value: vgv, format: 'currency' },
          { label: 'Média VGV', value: media, format: 'currency' },
          { label: 'Faturamento previsto', value: previsto, format: 'currency' },
        ]}
      />

      {top && top.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnalysisCard title={topTitle} data={top} variant={topVariant} />
        </div>
      )}
    </section>
  )
}
