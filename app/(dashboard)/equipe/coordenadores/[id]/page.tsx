'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@/components/ui/PageHeading'
import { TeamBreadcrumb } from '@/components/team/TeamBreadcrumb'
import { TeamMetricsPanel } from '@/components/team/TeamMetricsPanel'
import { SpeculativeMetricsBlock } from '@/components/team/SpeculativeMetricsBlock'
import { PERIODO_LABEL, PERIODOS, parsePeriodo, type PeriodoFiltro } from '@/lib/periodo'
import {
  getCoordenadorDashboard,
  type TopEntidadeItem,
} from '@/lib/services/metrics'
import { getCoordenadorById } from '@/lib/services/team'
import type { Coordenador, EntidadeMetrics } from '@/lib/types'

/** Detalhe de métricas do coordenador (KPIs + especulativo + top corretores). */
export default function CoordenadorDetalhePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const id = params.id
  const periodo = parsePeriodo(searchParams.get('periodo'))

  const [coord, setCoord] = useState<Coordenador | null>(null)
  const [metrics, setMetrics] = useState<EntidadeMetrics | null>(null)
  const [topCorretores, setTopCorretores] = useState<TopEntidadeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setPeriodo = useCallback(
    (next: PeriodoFiltro) => {
      const qs = new URLSearchParams(searchParams.toString())
      qs.set('periodo', next)
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Uma única varredura de leads para métricas + top da equipe.
        const [entity, dashboard] = await Promise.all([
          getCoordenadorById(id),
          getCoordenadorDashboard(id, periodo, 0),
        ])

        if (cancelled) return

        if (!entity || !dashboard.metrics) {
          setCoord(null)
          setMetrics(null)
          setTopCorretores([])
          setError('Coordenador não encontrado.')
          return
        }

        setCoord(entity)
        setMetrics(dashboard.metrics)
        setTopCorretores(dashboard.topCorretores)
      } catch (err) {
        console.error('Erro ao carregar detalhe do coordenador:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar métricas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, periodo])

  return (
    <div className="page-section">
      <PageHeading
        eyebrow="Equipe"
        title={coord?.nome ?? 'Detalhe do coordenador'}
        description="KPIs do funil, VGV e especulativo agregados pelos leads da equipe subordinada."
        actions={
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                className={`chip ${periodo === p ? 'chip-active' : ''}`}
              >
                {PERIODO_LABEL[p]}
              </button>
            ))}
            <Link href="/equipe" className="btn-ghost">
              ← Equipe
            </Link>
          </div>
        }
      />

      <TeamBreadcrumb
        items={[
          { label: 'Equipe', onClick: () => router.push('/equipe') },
          { label: coord?.nome ?? 'Coordenador' },
        ]}
      />

      {loading ? (
        <div className="card animate-pulse py-16 text-center text-on-surface-variant">
          Carregando métricas…
        </div>
      ) : error || !metrics ? (
        <div className="card space-y-4 py-12 text-center">
          <p className="text-error">{error ?? 'Sem dados.'}</p>
          <Link href="/equipe" className="btn-primary inline-flex">
            ← Voltar para equipe
          </Link>
        </div>
      ) : (
        <div className="animate-fade-up space-y-8">
          <TeamMetricsPanel
            role="coordenador"
            metrics={metrics}
            topCorretores={topCorretores.slice(0, 5).map((item) => ({
              id: item.id,
              label: item.label,
              value: item.value,
              href: `/equipe/corretores/${item.id}?periodo=${periodo}`,
            }))}
          />

          <SpeculativeMetricsBlock
            quantidade={metrics.especulativo.quantidade}
            vgv={metrics.especulativo.vgv}
            top={topCorretores
              .filter((item) => item.especulativoVgv > 0 || item.especulativoQtd > 0)
              .map((item) => ({ label: item.label, value: item.especulativoVgv }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)}
            topTitle="VGV especulativo | Corretores"
            topVariant="currency"
          />
        </div>
      )}
    </div>
  )
}
