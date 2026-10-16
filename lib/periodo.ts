/** Períodos de filtro alinhados ao dashboard (ex.: /visao). */
export type PeriodoFiltro = '7d' | '30d' | '90d' | 'todos'

export const PERIODOS: PeriodoFiltro[] = ['7d', '30d', '90d', 'todos']

export const PERIODO_LABEL: Record<PeriodoFiltro, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  todos: 'Todos',
}

export function parsePeriodo(value: string | null | undefined): PeriodoFiltro {
  if (value === '7d' || value === '30d' || value === '90d' || value === 'todos') {
    return value
  }
  return '30d'
}

/** Dias do período, ou null para “todos”. */
export function periodoToDays(periodo: PeriodoFiltro): number | null {
  if (periodo === 'todos') return null
  if (periodo === '7d') return 7
  if (periodo === '90d') return 90
  return 30
}

/** Data limite inferior (ISO) com base em `atualizadoEm` / `criadoEm`. */
export function periodoCutoffIso(periodo: PeriodoFiltro, now = new Date()): string | null {
  const days = periodoToDays(periodo)
  if (days == null) return null
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return cutoff.toISOString()
}
