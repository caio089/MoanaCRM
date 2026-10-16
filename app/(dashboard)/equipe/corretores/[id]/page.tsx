'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@/components/ui/PageHeading'
import { TeamBreadcrumb } from '@/components/team/TeamBreadcrumb'
import { TeamMetricsPanel } from '@/components/team/TeamMetricsPanel'
import { SpeculativeMetricsBlock } from '@/components/team/SpeculativeMetricsBlock'
import { PERIODO_LABEL, PERIODOS, parsePeriodo, type PeriodoFiltro } from '@/lib/periodo'
import { getMetricsByCorretor } from '@/lib/services/metrics'
import { getCoordenadorById, getCorretorById } from '@/lib/services/team'
import type { Coordenador, Corretor, EntidadeMetrics } from '@/lib/types'

/** Detalhe de métricas do corretor (KPIs + especulativo no escopo individual). */
export default function CorretorDetalhePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const id = params.id
  const periodo = parsePeriodo(searchParams.get('periodo'))

  const [corretor, setCorretor] = useState<Corretor | null>(null)
  const [coordenador, setCoordenador] = useState<Coordenador | null>(null)
  const [metrics, setMetrics] = useState<EntidadeMetrics | null>(null)
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

        const [entity, entityMetrics] = await Promise.all([
          getCorretorById(id),
          getMetricsByCorretor(id, periodo),
        ])

        if (cancelled) return

        if (!entity || !entityMetrics) {
          setCorretor(null)
          setCoordenador(null)
          setMetrics(null)
          setError('Corretor não encontrado.')
          return
        }

        setCorretor(entity)
        setMetrics(entityMetrics)

        if (entity.coordenadorId) {
          const coord = await getCoordenadorById(entity.coordenadorId)
          if (!cancelled) setCoordenador(coord)
        } else if (!cancelled) {
          setCoordenador(null)
        }
      } catch (err) {
        console.error('Erro ao carregar detalhe do corretor:', err)
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

  const breadcrumbItems = [
    { label: 'Equipe', onClick: () => router.push('/equipe') },
    ...(coordenador
      ? [
          {
            label: coordenador.nome,
            onClick: () =>
              router.push(`/equipe/coordenadores/${coordenador.id}?periodo=${periodo}`),
          },
        ]
      : []),
    { label: corretor?.nome ?? 'Corretor' },
  ]

  return (
    <div className="page-section">
      <PageHeading
        eyebrow="Equipe"
        title={corretor?.nome ?? 'Detalhe do corretor'}
        description={
          coordenador
            ? `Métricas individuais no período. Coordenação: ${coordenador.nome}.`
            : 'Métricas individuais no período selecionado.'
        }
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

      <TeamBreadcrumb items={breadcrumbItems} />

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
          <TeamMetricsPanel role="corretor" metrics={metrics} />

          <SpeculativeMetricsBlock
            quantidade={metrics.especulativo.quantidade}
            vgv={metrics.especulativo.vgv}
          />
        </div>
      )}
    </div>
  )
}
