'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeading } from '@/components/ui/PageHeading'
import { KpiCard } from '@/components/ui/KpiCard'
import { TeamBreadcrumb } from '@/components/team/TeamBreadcrumb'
import { TeamCard } from '@/components/team/TeamCard'
import { useTeamNavigation } from '@/lib/hooks/useTeamNavigation'
import { useAdminCheck } from '@/lib/hooks/useAdminCheck'
import {
  getTeamHierarchy,
  listOrphanCorretores,
} from '@/lib/services/team'
import {
  getAllCoordenadorMetrics,
  getAllCorretorMetrics,
} from '@/lib/services/metrics'
import { parsePeriodo, type PeriodoFiltro } from '@/lib/periodo'
import type {
  CoordenadorComCorretores,
  Corretor,
  EntidadeMetrics,
} from '@/lib/types'

export type TeamHierarchyFocus = 'coordenadores' | 'corretores'

/** Mesmo default de `/equipe/.../[id]` via `parsePeriodo` (sem query → 30d). */
const PERIODO_CARDS: PeriodoFiltro = parsePeriodo(undefined)

function detailHref(path: string, periodo: PeriodoFiltro = PERIODO_CARDS): string {
  return `${path}?periodo=${periodo}`
}

interface TeamHierarchyViewProps {
  title?: string
  description?: string
  eyebrow?: string
  /**
   * `coordenadores` inicia no nível 1 (padrão).
   * `corretores` inicia listando todos os corretores do cadastro (útil em /admin/corretores).
   */
  initialFocus?: TeamHierarchyFocus
}

function metricsMap(list: EntidadeMetrics[]): Map<string, EntidadeMetrics> {
  return new Map(list.map((item) => [item.id, item]))
}

/** Visão interativa da hierarquia comercial: coordenadores → corretores. */
export function TeamHierarchyView({
  title = 'Equipe',
  description = 'Navegue pelos coordenadores e veja os corretores vinculados no cadastro.',
  eyebrow = 'Hierarquia comercial',
  initialFocus = 'coordenadores',
}: TeamHierarchyViewProps) {
  const { isCoordenador, loading: roleLoading } = useAdminCheck()
  const {
    level,
    selectedCoordenadorId,
    selectCoordenador,
    goToCoordenadores,
  } = useTeamNavigation('coordenadores')

  const [hierarchy, setHierarchy] = useState<CoordenadorComCorretores[]>([])
  const [orphans, setOrphans] = useState<Corretor[]>([])
  const [coordMetrics, setCoordMetrics] = useState<Map<string, EntidadeMetrics>>(new Map())
  const [corrMetrics, setCorrMetrics] = useState<Map<string, EntidadeMetrics>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  /** Lista plana de todos os corretores (focus inicial em /admin/corretores). */
  const [flatCorretores, setFlatCorretores] = useState(initialFocus === 'corretores')
  const didOpenCoordinatorTeam = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [team, orphanList] = await Promise.all([
          getTeamHierarchy(true),
          listOrphanCorretores(true),
        ])

        if (cancelled) return
        setHierarchy(team)
        setOrphans(orphanList)

        // Métricas são opcionais — falha não bloqueia a hierarquia.
        // Período alinhado ao detalhe (default 30d).
        try {
          const [mCoord, mCorr] = await Promise.all([
            getAllCoordenadorMetrics(PERIODO_CARDS),
            getAllCorretorMetrics(PERIODO_CARDS),
          ])
          if (!cancelled) {
            setCoordMetrics(metricsMap(mCoord))
            setCorrMetrics(metricsMap(mCorr))
          }
        } catch (metricsError) {
          console.warn('Métricas da equipe indisponíveis:', metricsError)
        }
      } catch (err) {
        console.error('Erro ao carregar equipe:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar a equipe')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Coordenadores entram diretamente na própria equipe. A RLS e o filtro do
  // serviço garantem que o único coordenador disponível seja o da sessão.
  useEffect(() => {
    if (
      roleLoading ||
      loading ||
      error ||
      !isCoordenador ||
      didOpenCoordinatorTeam.current ||
      hierarchy.length !== 1
    ) {
      return
    }

    didOpenCoordinatorTeam.current = true
    selectCoordenador(hierarchy[0].id)
  }, [error, hierarchy, isCoordenador, loading, roleLoading, selectCoordenador])

  const selectedCoordenador = useMemo(
    () => hierarchy.find((item) => item.id === selectedCoordenadorId) ?? null,
    [hierarchy, selectedCoordenadorId],
  )

  const allCorretores = useMemo(() => {
    const linked = hierarchy.flatMap((coord) =>
      coord.corretores.map((corretor) => ({
        ...corretor,
        coordenadorNome: coord.nome,
      })),
    )
    const orphanRows = orphans.map((corretor) => ({
      ...corretor,
      coordenadorNome: 'Sem coordenação',
    }))
    return [...linked, ...orphanRows].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    )
  }, [hierarchy, orphans])

  const query = search.trim().toLocaleLowerCase('pt-BR')

  const filteredCoordenadores = useMemo(() => {
    if (!query) return hierarchy
    return hierarchy.filter(
      (coord) =>
        coord.nome.toLocaleLowerCase('pt-BR').includes(query) ||
        coord.corretores.some((c) => c.nome.toLocaleLowerCase('pt-BR').includes(query)),
    )
  }, [hierarchy, query])

  const filteredTeamCorretores = useMemo(() => {
    const list = selectedCoordenador?.corretores ?? []
    if (!query) return list
    return list.filter((c) => c.nome.toLocaleLowerCase('pt-BR').includes(query))
  }, [selectedCoordenador, query])

  const filteredFlatCorretores = useMemo(() => {
    if (!query) return allCorretores
    return allCorretores.filter(
      (c) =>
        c.nome.toLocaleLowerCase('pt-BR').includes(query) ||
        c.coordenadorNome.toLocaleLowerCase('pt-BR').includes(query),
    )
  }, [allCorretores, query])

  const filteredOrphans = useMemo(() => {
    if (!query) return orphans
    return orphans.filter((c) => c.nome.toLocaleLowerCase('pt-BR').includes(query))
  }, [orphans, query])

  const totalCorretores = hierarchy.reduce((sum, c) => sum + c.corretores.length, 0) + orphans.length

  /** Leads dos coordenadores ativos + corretores sem coordenação válida (órfãos). */
  const totalLeadsEquipe = useMemo(() => {
    const fromCoordenadores = Array.from(coordMetrics.values()).reduce(
      (sum, m) => sum + m.totalLeads,
      0,
    )
    const fromOrphans = orphans.reduce(
      (sum, corretor) => sum + (corrMetrics.get(corretor.id)?.totalLeads ?? 0),
      0,
    )
    return fromCoordenadores + fromOrphans
  }, [coordMetrics, corrMetrics, orphans])

  function handleSelectCoordenador(id: string) {
    setFlatCorretores(false)
    setSearch('')
    selectCoordenador(id)
  }

  function handleBackToCoordenadores() {
    setFlatCorretores(false)
    setSearch('')
    goToCoordenadores()
  }

  function handleShowAllCorretores() {
    setFlatCorretores(true)
    setSearch('')
    goToCoordenadores()
  }

  const showingCorretoresLevel = !flatCorretores && level === 'corretores' && selectedCoordenador
  const showingFlatCorretores = flatCorretores
  const showingCoordenadores = !showingCorretoresLevel && !showingFlatCorretores

  const searchAriaLabel =
    showingCorretoresLevel || showingFlatCorretores
      ? 'Pesquisar corretores'
      : 'Pesquisar coordenadores'
  const breadcrumbItems = showingCorretoresLevel
    ? [
        { label: 'Coordenadores', onClick: handleBackToCoordenadores },
        { label: selectedCoordenador.nome },
      ]
    : showingFlatCorretores
      ? [
          { label: 'Coordenadores', onClick: handleBackToCoordenadores },
          { label: 'Todos os corretores' },
        ]
      : [{ label: 'Coordenadores' }]

  return (
    <div className="page-section">
      <PageHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            {!showingCoordenadores && (
              <button type="button" onClick={handleBackToCoordenadores} className="btn-ghost">
                ← Coordenadores
              </button>
            )}
            {!isCoordenador && !showingFlatCorretores && (
              <button type="button" onClick={handleShowAllCorretores} className="btn-ghost">
                Todos os corretores
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard titulo="Coordenadores" valor={hierarchy.length} accentColor="text-primary" />
        <KpiCard titulo="Corretores" valor={totalCorretores} accentColor="text-secondary" />
        <KpiCard titulo="Sem coordenação" valor={orphans.length} accentColor="text-tertiary" />
        <KpiCard
          titulo="Leads (equipe)"
          valor={totalLeadsEquipe}
          accentColor="text-primary"
        />
      </div>

      <TeamBreadcrumb items={breadcrumbItems} />

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/45"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            showingCorretoresLevel
              ? 'Pesquisar corretores…'
              : showingFlatCorretores
                ? 'Pesquisar corretores…'
                : 'Pesquisar coordenadores…'
          }
          aria-label={searchAriaLabel}
          className="min-h-12 w-full pl-10 pr-4 text-label-md"
        />
      </div>

      {loading ? (
        <div className="card animate-pulse py-16 text-center text-on-surface-variant">
          Carregando equipe…
        </div>
      ) : error ? (
        <div className="card py-12 text-center text-error">{error}</div>
      ) : (
        <div
          key={
            showingCorretoresLevel
              ? `corr-${selectedCoordenador.id}`
              : showingFlatCorretores
                ? 'flat'
                : 'coords'
          }
          className="animate-fade-up space-y-8"
        >
          {showingCoordenadores && (
            <>
              {filteredCoordenadores.length === 0 ? (
                <div className="card py-12 text-center text-on-surface-variant">
                  Nenhum coordenador encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCoordenadores.map((coord) => {
                    const metrics = coordMetrics.get(coord.id)
                    return (
                      <TeamCard
                        key={coord.id}
                        id={coord.id}
                        nome={coord.nome}
                        role="coordenador"
                        selected={selectedCoordenadorId === coord.id}
                        onSelect={() => handleSelectCoordenador(coord.id)}
                        detailHref={detailHref(`/equipe/coordenadores/${coord.id}`)}
                        metrics={{
                          totalLeads: metrics?.totalLeads,
                          vgvTotal: metrics?.vgvTotal,
                          realizados: metrics?.porEtapa.realizado,
                          corretoresCount: coord.corretores.length,
                        }}
                      />
                    )
                  })}
                </div>
              )}

              {filteredOrphans.length > 0 && (
                <section aria-labelledby="sem-coordenacao-heading" className="space-y-4">
                  <div>
                    <h2
                      id="sem-coordenacao-heading"
                      className="section-title mb-1"
                    >
                      Sem coordenação
                    </h2>
                    <p className="text-body-md text-on-surface-variant">
                      Corretores ativos sem coordenador válido (sem vínculo, inativo ou inexistente).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredOrphans.map((corretor) => {
                      const metrics = corrMetrics.get(corretor.id)
                      return (
                        <TeamCard
                          key={corretor.id}
                          id={corretor.id}
                          nome={corretor.nome}
                          role="corretor"
                          subtitle="Sem coordenação"
                          detailHref={detailHref(`/equipe/corretores/${corretor.id}`)}
                          metrics={{
                            totalLeads: metrics?.totalLeads,
                            vgvTotal: metrics?.vgvTotal,
                            realizados: metrics?.porEtapa.realizado,
                          }}
                        />
                      )
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {showingCorretoresLevel && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TeamCard
                  id={selectedCoordenador.id}
                  nome={selectedCoordenador.nome}
                  role="coordenador"
                  selected
                  subtitle={`${selectedCoordenador.corretores.length} ${
                    selectedCoordenador.corretores.length === 1 ? 'corretor' : 'corretores'
                  } vinculados`}
                  detailHref={detailHref(`/equipe/coordenadores/${selectedCoordenador.id}`)}
                  metrics={{
                    totalLeads: coordMetrics.get(selectedCoordenador.id)?.totalLeads,
                    vgvTotal: coordMetrics.get(selectedCoordenador.id)?.vgvTotal,
                    realizados:
                      coordMetrics.get(selectedCoordenador.id)?.porEtapa.realizado,
                    corretoresCount: selectedCoordenador.corretores.length,
                  }}
                />
              </div>

              <div>
                <h2 className="section-title mb-1">Corretores da equipe</h2>
                <p className="mb-4 text-body-md text-on-surface-variant">
                  Vinculados no cadastro a {selectedCoordenador.nome}.
                </p>

                {filteredTeamCorretores.length === 0 ? (
                  <div className="card py-12 text-center text-on-surface-variant">
                    Nenhum corretor vinculado a este coordenador.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTeamCorretores.map((corretor) => {
                      const metrics = corrMetrics.get(corretor.id)
                      return (
                        <TeamCard
                          key={corretor.id}
                          id={corretor.id}
                          nome={corretor.nome}
                          role="corretor"
                          detailHref={detailHref(`/equipe/corretores/${corretor.id}`)}
                          metrics={{
                            totalLeads: metrics?.totalLeads,
                            vgvTotal: metrics?.vgvTotal,
                            realizados: metrics?.porEtapa.realizado,
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {showingFlatCorretores && (
            <>
              {filteredFlatCorretores.length === 0 ? (
                <div className="card py-12 text-center text-on-surface-variant">
                  Nenhum corretor encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredFlatCorretores.map((corretor) => {
                    const metrics = corrMetrics.get(corretor.id)
                    return (
                      <TeamCard
                        key={corretor.id}
                        id={corretor.id}
                        nome={corretor.nome}
                        role="corretor"
                        subtitle={corretor.coordenadorNome}
                        detailHref={detailHref(`/equipe/corretores/${corretor.id}`)}
                        metrics={{
                          totalLeads: metrics?.totalLeads,
                          vgvTotal: metrics?.vgvTotal,
                          realizados: metrics?.porEtapa.realizado,
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
