'use client'

import { useEffect, useId, useMemo, useState } from 'react'

/** Opção de select: string legada ou valor tipado (ex.: id da equipe). */
export type FilterOption =
  | string
  | {
      value: string
      label: string
      /** Quando presente, permite cascata coord → corretor */
      coordenadorId?: string | null
    }

export type FilterBarFilters = {
  search?: string
  corretor?: string
  coordenador?: string
  construtora?: string
  cidade?: string
  dataInicio?: string
  dataFim?: string
  situacao?: string
  origem?: string
  etapa?: string
}

interface FilterBarProps {
  filters: FilterBarFilters
  onFilterChange: (filters: FilterBarFilters) => void
  filterOptions?: {
    corretores?: FilterOption[]
    coordenadores?: FilterOption[]
    construtoras?: FilterOption[]
    cidades?: FilterOption[]
    situacoes?: FilterOption[]
    origens?: FilterOption[]
    /** Etapas do funil (status) — ex.: Visão Geral */
    etapas?: FilterOption[]
  }
  /** Oculta a busca textual (páginas de agregação). */
  hideSearch?: boolean
  /** Oculta o seletor de intervalo de datas. */
  hideDatePicker?: boolean
  /**
   * Valores aplicados ao clicar em “Limpar filtros”.
   * Default: objeto vazio (comportamento das páginas de funil).
   */
  clearDefaults?: FilterBarFilters
  /** Força exibir “Limpar” (ex.: período via chips fora do FilterBar). */
  forceShowClear?: boolean
}

const FIELD = 'min-h-11 px-3.5 py-2.5 text-label-md'

function optionValue(opt: FilterOption): string {
  return typeof opt === 'string' ? opt : opt.value
}

function optionLabel(opt: FilterOption): string {
  return typeof opt === 'string' ? opt : opt.label
}

function optionCoordId(opt: FilterOption): string | null | undefined {
  return typeof opt === 'string' ? undefined : opt.coordenadorId
}

export function FilterBar({
  filters,
  onFilterChange,
  filterOptions = {},
  hideSearch = false,
  hideDatePicker = false,
  clearDefaults,
  forceShowClear = false,
}: FilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const mobileFiltersId = useId()

  const handleFilterChange = (key: keyof FilterBarFilters, value: string) => {
    const next: FilterBarFilters = {
      ...filters,
      [key]: value || undefined,
    }

    // Cascata: trocar coordenador invalida o corretor selecionado
    if (key === 'coordenador') {
      next.corretor = undefined
    }

    onFilterChange(next)
  }

  const corretoresVisiveis = useMemo(() => {
    const list = filterOptions.corretores || []
    if (!filters.coordenador) return list

    return list.filter((opt) => {
      const coordId = optionCoordId(opt)
      // String legada sem vínculo: mantém (páginas de funil)
      if (coordId === undefined) return true
      return coordId === filters.coordenador
    })
  }, [filterOptions.corretores, filters.coordenador])

  // Deep link / URL compartilhada: ?coordenador= e ?corretor= incompatíveis
  // deixam o select vazio mas o filtro AND continua ativo. Limpa o corretor
  // inválido do estado (e da URL, se o pai sincronizar via onFilterChange).
  useEffect(() => {
    if (!filters.corretor) return
    // Aguarda opções carregarem para não limpar prematuramente
    if (!filterOptions.corretores?.length) return

    const valido = corretoresVisiveis.some(
      (opt) => optionValue(opt) === filters.corretor,
    )
    if (valido) return

    onFilterChange({ ...filters, corretor: undefined })
    // Intencionalmente não depende de `filters`/`onFilterChange` por inteiro:
    // após limpar, filters.corretor fica undefined e o efeito encerra cedo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.corretor, filters.coordenador, corretoresVisiveis, filterOptions.corretores])

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'etapa' && !filterOptions.etapas) return false
    return Boolean(value)
  })
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search' || !value) return false
    if (key === 'etapa' && !filterOptions.etapas) return false
    return true
  }).length
  const hasFilterControls = Object.values(filterOptions).some(
    (options) => Boolean(options?.length),
  ) || !hideDatePicker

  return (
    <div className="mb-4 space-y-3 sm:mb-6">
      {!hideSearch && (
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
            value={filters.search || ''}
            onChange={(event) => handleFilterChange('search', event.target.value)}
            placeholder="Pesquisar por cliente, CPF, telefone, e-mail ou ID…"
            className="min-h-12 w-full pl-10 pr-4 text-label-md"
            aria-label="Pesquisar leads"
          />
        </div>
      )}

      {hasFilterControls ? (
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 text-label-md font-semibold text-on-surface sm:hidden"
          aria-expanded={mobileFiltersOpen}
          aria-controls={mobileFiltersId}
        >
          <span className="flex items-center gap-2">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-on-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </span>
          <svg className={`transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      ) : null}

      <div
        id={mobileFiltersId}
        className={`filter-row ${mobileFiltersOpen ? 'grid' : 'hidden'} sm:flex`}
      >
        {filterOptions.coordenadores && (
          <select
            value={filters.coordenador || ''}
            onChange={(e) => handleFilterChange('coordenador', e.target.value)}
            className={FIELD}
            aria-label="Filtrar por coordenador"
          >
            <option value="">Coordenador</option>
            {filterOptions.coordenadores.map((c) => (
              <option key={optionValue(c)} value={optionValue(c)}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.corretores && (
          <select
            value={filters.corretor || ''}
            onChange={(e) => handleFilterChange('corretor', e.target.value)}
            className={FIELD}
            aria-label="Filtrar por corretor"
          >
            <option value="">Corretor</option>
            {corretoresVisiveis.map((c) => (
              <option key={optionValue(c)} value={optionValue(c)}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.etapas && (
          <select
            value={filters.etapa || ''}
            onChange={(e) => handleFilterChange('etapa', e.target.value)}
            className={FIELD}
            aria-label="Filtrar por etapa"
          >
            <option value="">Etapa</option>
            {filterOptions.etapas.map((e) => (
              <option key={optionValue(e)} value={optionValue(e)}>
                {optionLabel(e)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.construtoras && (
          <select
            value={filters.construtora || ''}
            onChange={(e) => handleFilterChange('construtora', e.target.value)}
            className={FIELD}
          >
            <option value="">Construtora</option>
            {filterOptions.construtoras.map((c) => (
              <option key={optionValue(c)} value={optionValue(c)}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.cidades && (
          <select
            value={filters.cidade || ''}
            onChange={(e) => handleFilterChange('cidade', e.target.value)}
            className={FIELD}
          >
            <option value="">Cidade</option>
            {filterOptions.cidades.map((c) => (
              <option key={optionValue(c)} value={optionValue(c)}>
                {optionLabel(c)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.situacoes && (
          <select
            value={filters.situacao || ''}
            onChange={(e) => handleFilterChange('situacao', e.target.value)}
            className={FIELD}
          >
            <option value="">Situação</option>
            {filterOptions.situacoes.map((s) => (
              <option key={optionValue(s)} value={optionValue(s)}>
                {optionLabel(s)}
              </option>
            ))}
          </select>
        )}

        {filterOptions.origens && (
          <select
            value={filters.origem || ''}
            onChange={(e) => handleFilterChange('origem', e.target.value)}
            className={FIELD}
          >
            <option value="">Origem</option>
            {filterOptions.origens.map((o) => (
              <option key={optionValue(o)} value={optionValue(o)}>
                {optionLabel(o)}
              </option>
            ))}
          </select>
        )}

        {!hideDatePicker && (
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="chip w-full sm:w-auto"
            >
              Selecionar período
            </button>
            {showDatePicker && (
              <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-white/10 bg-surface-low p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:left-auto sm:right-0 sm:w-72">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
                      Data início
                    </label>
                    <input
                      type="date"
                      value={filters.dataInicio || ''}
                      onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                      className="w-full px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
                      Data fim
                    </label>
                    <input
                      type="date"
                      value={filters.dataFim || ''}
                      onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                      className="w-full px-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="btn-primary w-full"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(hasActiveFilters || forceShowClear) && (
          <button
            type="button"
            onClick={() => onFilterChange(clearDefaults ? { ...clearDefaults } : {})}
            className="chip w-full sm:w-auto"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
