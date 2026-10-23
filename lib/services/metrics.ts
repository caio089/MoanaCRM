import { periodoCutoffIso, type PeriodoFiltro } from '@/lib/periodo'
import { supabase } from '@/lib/supabase'
import type { ContagemPorEtapa, EntidadeMetrics, EtapaFunil, TipoOperacao } from '@/lib/types'
import { calcularVga } from '@/lib/utils/vga'

const ETAPAS: EtapaFunil[] = [
  'lead',
  'analise',
  'aprovado',
  'especulativo',
  'realizado',
  'reprovado',
  'visita',
]

export type TopEntidadeItem = {
  id: string
  label: string
  value: number
  vgv: number
  especulativoQtd: number
  especulativoVgv: number
}

type LeadMetricRow = {
  id: string
  etapa: EtapaFunil
  vgv: number | null
  nome?: string | null
  construtora?: string | null
  criadoEm?: string | Date | null
  atualizadoEm?: string | Date | null
  coordenadorId?: string | null
  corretorId?: string | null
  coordenador?: string | null
  corretor?: string | null
  tipoOperacao?: TipoOperacao | null
  valorLocacaoMensal?: number | null
  prazoContratoMeses?: number | null
  valorAvaliacao?: number | null
}

/** Filtros da Visão Geral (AND lógico). IDs preferenciais + fallback string. */
export type DashboardFilters = {
  periodo?: PeriodoFiltro
  /** ID do cadastro de coordenadores (URL `?coordenador=`) */
  coordenadorId?: string
  /** ID do cadastro de corretores (URL `?corretor=`) */
  corretorId?: string
  etapa?: EtapaFunil
  tipoOperacao?: TipoOperacao
}

export type DashboardRecentLead = {
  id: string
  nome: string
  etapa: EtapaFunil
  corretor: string | null
  construtora: string | null
  atualizadoEm: string | Date | null
}

export type DashboardSummary = {
  totalLeads: number
  totalAprovados: number
  totalRealizados: number
  taxaAprovacao: number
  taxaRealizacao: number
  vgvTotal: number
  vgvRealizado: number
  variacao: number
  leadsSemCorretor: number
  totalConstrutoras: number
  principalConstrutora: string | null
  participacaoPrincipalConstrutora: number
  porEtapa: ContagemPorEtapa
  topCorretores: Array<{ name: string; leads: number }>
  topCoordenadores: Array<{ name: string; value: number }>
  topConstrutoras: Array<{ name: string; value: number }>
  clientesRecentes: DashboardRecentLead[]
  totalVisitas: number
  taxaConversaoVisitas: number
  taxaConversaoLeads: number
  vgaTotal: number
  vgaRealizado: number
}

type TeamMember = { id: string; nome: string }

function emptyPorEtapa(): ContagemPorEtapa {
  const base: ContagemPorEtapa = { total: 0 }
  for (const etapa of ETAPAS) {
    base[etapa] = 0
  }
  return base
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeEntityKey(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function aggregateMetrics(
  id: string,
  nome: string,
  rows: LeadMetricRow[],
): EntidadeMetrics {
  const porEtapa = emptyPorEtapa()
  let vgvTotal = 0
  let vgvRealizado = 0
  let vgvAprovado = 0
  let especulativoQtd = 0
  let especulativoVgv = 0

  for (const row of rows) {
    porEtapa.total += 1
    porEtapa[row.etapa] = (porEtapa[row.etapa] ?? 0) + 1

    const vgv = toNumber(row.vgv)
    vgvTotal += vgv

    if (row.etapa === 'realizado') vgvRealizado += vgv
    if (row.etapa === 'aprovado') vgvAprovado += vgv
    if (row.etapa === 'especulativo') {
      especulativoQtd += 1
      especulativoVgv += vgv
    }
  }

  return {
    id,
    nome,
    totalLeads: porEtapa.total,
    porEtapa,
    especulativo: {
      quantidade: especulativoQtd,
      vgv: especulativoVgv,
    },
    vgvTotal,
    vgvRealizado,
    vgvAprovado,
  }
}

function leadDate(row: LeadMetricRow): Date | null {
  const raw = row.atualizadoEm ?? row.criadoEm
  if (!raw) return null
  const date = new Date(String(raw))
  return Number.isNaN(date.getTime()) ? null : date
}

function filterByPeriodo(rows: LeadMetricRow[], periodo?: PeriodoFiltro): LeadMetricRow[] {
  if (!periodo || periodo === 'todos') return rows
  const cutoffIso = periodoCutoffIso(periodo)
  if (!cutoffIso) return rows
  const cutoff = new Date(cutoffIso)
  return rows.filter((row) => {
    const date = leadDate(row)
    return date ? date >= cutoff : false
  })
}

async function fetchLeadMetricRows(): Promise<LeadMetricRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(
      'id, nome, etapa, vgv, construtora, criado_em, atualizado_em, coordenador_id, corretor_id, coordenador, corretor, tipo_operacao, valor_locacao_mensal, prazo_contrato_meses, valor_avaliacao',
    )

  if (error) throw new Error(error.message)

  return ((data as Record<string, unknown>[]) || []).map((row) => ({
    id: String(row.id),
    nome: (row.nome as string | null) ?? null,
    etapa: row.etapa as EtapaFunil,
    vgv: row.vgv === null || row.vgv === undefined ? null : toNumber(row.vgv),
    construtora: (row.construtora as string | null) ?? null,
    criadoEm: (row.criadoEm ?? row.criado_em ?? null) as string | Date | null,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em ?? null) as string | Date | null,
    coordenadorId: (row.coordenadorId ?? row.coordenador_id ?? null) as string | null,
    corretorId: (row.corretorId ?? row.corretor_id ?? null) as string | null,
    coordenador: (row.coordenador as string | null) ?? null,
    corretor: (row.corretor as string | null) ?? null,
    tipoOperacao: row.tipoOperacao === 'aluguel' || row.tipo_operacao === 'aluguel' ? 'aluguel' : 'venda',
    valorLocacaoMensal: toNumber(row.valorLocacaoMensal ?? row.valor_locacao_mensal),
    prazoContratoMeses: toNumber(row.prazoContratoMeses ?? row.prazo_contrato_meses),
    valorAvaliacao: toNumber(row.valorAvaliacao ?? row.valor_avaliacao),
  }))
}

function filterPreviousPeriod(
  rows: LeadMetricRow[],
  periodo: PeriodoFiltro,
): LeadMetricRow[] {
  if (!periodo || periodo === 'todos') return []
  const days = periodo === '7d' ? 7 : periodo === '90d' ? 90 : 30
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() - days)
  const start = new Date(end)
  start.setDate(start.getDate() - days)

  return rows.filter((row) => {
    const date = leadDate(row)
    if (!date) return false
    return date >= start && date < end
  })
}

function rankByCount(
  counts: Map<string, { label: string; value: number }>,
  limit = 5,
  includeZero = false,
): Array<{ name: string; value: number }> {
  return Array.from(counts.values())
    .filter((item) => includeZero || item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item) => ({ name: item.label, value: item.value }))
}

/**
 * Agregação da Visão Geral com filtros AND (período, coordenador, corretor, etapa).
 * Preferência por FK; fallback string legada; coordenador inclui equipe vinculada.
 */
export async function getDashboardSummary(
  filters: DashboardFilters = {},
): Promise<DashboardSummary> {
  try {
    const periodo = filters.periodo ?? '30d'
    const [leads, coordsRes, corrRes] = await Promise.all([
      fetchLeadMetricRows(),
      supabase.from('coordenadores').select('id, nome').eq('ativo', true),
      supabase.from('corretores').select('id, nome, coordenador_id').eq('ativo', true),
    ])

    if (coordsRes.error) throw new Error(coordsRes.error.message)
    if (corrRes.error) throw new Error(corrRes.error.message)

    const coordById = new Map<string, string>()
    for (const row of (coordsRes.data as Record<string, unknown>[]) || []) {
      coordById.set(String(row.id), String(row.nome))
    }

    const corrById = new Map<string, { nome: string; coordenadorId: string | null }>()
    const teamByCoord = new Map<string, TeamMember[]>()
    for (const row of (corrRes.data as Record<string, unknown>[]) || []) {
      const id = String(row.id)
      const nome = String(row.nome)
      const coordenadorId = (row.coordenador_id ?? row.coordenadorId ?? null) as string | null
      corrById.set(id, { nome, coordenadorId })
      if (coordenadorId) {
        const list = teamByCoord.get(coordenadorId) ?? []
        list.push({ id, nome })
        teamByCoord.set(coordenadorId, list)
      }
    }

    const resolveCorretorLabel = (lead: LeadMetricRow): string | null => {
      if (lead.corretorId && corrById.has(lead.corretorId)) {
        return corrById.get(lead.corretorId)!.nome
      }
      return lead.corretor || null
    }

    const resolveCoordenadorLabel = (lead: LeadMetricRow): string | null => {
      if (lead.coordenadorId && coordById.has(lead.coordenadorId)) {
        return coordById.get(lead.coordenadorId)!
      }
      if (lead.corretorId) {
        const corr = corrById.get(lead.corretorId)
        if (corr?.coordenadorId && coordById.has(corr.coordenadorId)) {
          return coordById.get(corr.coordenadorId)!
        }
      }
      return lead.coordenador || null
    }

    let scoped = filterByPeriodo(leads, periodo)

    if (filters.coordenadorId) {
      const nome = coordById.get(filters.coordenadorId) ?? ''
      const team = teamByCoord.get(filters.coordenadorId) ?? []
      scoped = scoped.filter((lead) =>
        matchesCoordenadorEquipe(lead, filters.coordenadorId!, nome, team),
      )
    }

    if (filters.corretorId) {
      const nome = corrById.get(filters.corretorId)?.nome ?? ''
      scoped = scoped.filter((lead) =>
        matchesCorretor(lead, filters.corretorId!, nome),
      )
    }

    if (filters.etapa) {
      scoped = scoped.filter((lead) => lead.etapa === filters.etapa)
    }

    if (filters.tipoOperacao) {
      scoped = scoped.filter((lead) => (lead.tipoOperacao ?? 'venda') === filters.tipoOperacao)
    }

    const porEtapa = emptyPorEtapa()
    let vgvTotal = 0
    let vgvRealizado = 0
    let vgaTotal = 0
    let vgaRealizado = 0
    let leadsSemCorretor = 0
    const porCorretor = new Map<string, { label: string; value: number }>()
    const porCoordenador = new Map<string, { label: string; value: number }>()
    const porConstrutora = new Map<string, { label: string; value: number }>()

    // A Visao Geral deve exibir todo coordenador ativo, mesmo sem leads no periodo.
    coordById.forEach((nome, id) => {
      porCoordenador.set(id, { label: nome, value: 0 })
    })

    for (const lead of scoped) {
      porEtapa.total += 1
      porEtapa[lead.etapa] = (porEtapa[lead.etapa] ?? 0) + 1

      const vgv = toNumber(lead.vgv)
      vgvTotal += vgv
      if (lead.etapa === 'realizado') vgvRealizado += vgv

      if ((lead.tipoOperacao ?? 'venda') === 'aluguel') {
        const vga = calcularVga({
          valorAvaliacao: toNumber(lead.valorAvaliacao),
          valorLocacaoMensal: toNumber(lead.valorLocacaoMensal),
          prazoContratoMeses: toNumber(lead.prazoContratoMeses) || 12,
        }).receitaProjetada
        vgaTotal += vga
        if (lead.etapa === 'realizado') vgaRealizado += vga
      }

      const corrLabel = resolveCorretorLabel(lead)
      if (!corrLabel && !lead.corretorId) {
        leadsSemCorretor += 1
      } else {
        const key = lead.corretorId || corrLabel || 'sem'
        const label = corrLabel || 'Sem nome'
        const prev = porCorretor.get(key) ?? { label, value: 0 }
        prev.value += 1
        porCorretor.set(key, prev)
      }

      const coordLabel = resolveCoordenadorLabel(lead)
      if (coordLabel || lead.coordenadorId) {
        const key = lead.coordenadorId || coordLabel || 'sem'
        const label = coordLabel || 'Sem nome'
        const prev = porCoordenador.get(key) ?? { label, value: 0 }
        prev.value += 1
        porCoordenador.set(key, prev)
      }

      if (lead.construtora) {
        const label = lead.construtora.trim()
        const key = normalizeEntityKey(label)
        if (!key) continue
        const prev = porConstrutora.get(key) ?? {
          label,
          value: 0,
        }
        prev.value += 1
        porConstrutora.set(key, prev)
      }
    }

    const totalLeads = porEtapa.total
    const totalAprovados = porEtapa.aprovado ?? 0
    const totalRealizados = porEtapa.realizado ?? 0
    const totalVisitas = porEtapa.visita ?? 0
    const topConstrutoras = rankByCount(porConstrutora)
    const principalConstrutora = topConstrutoras[0] ?? null
    const leadsComConstrutora = Array.from(porConstrutora.values()).reduce(
      (total, item) => total + item.value,
      0,
    )

    // Variação vs período imediatamente anterior (mesmo escopo de entidade/etapa)
    let previous = filterPreviousPeriod(leads, periodo)
    if (filters.coordenadorId) {
      const nome = coordById.get(filters.coordenadorId) ?? ''
      const team = teamByCoord.get(filters.coordenadorId) ?? []
      previous = previous.filter((lead) =>
        matchesCoordenadorEquipe(lead, filters.coordenadorId!, nome, team),
      )
    }
    if (filters.corretorId) {
      const nome = corrById.get(filters.corretorId)?.nome ?? ''
      previous = previous.filter((lead) =>
        matchesCorretor(lead, filters.corretorId!, nome),
      )
    }
    if (filters.etapa) {
      previous = previous.filter((lead) => lead.etapa === filters.etapa)
    }
    if (filters.tipoOperacao) {
      previous = previous.filter((lead) => (lead.tipoOperacao ?? 'venda') === filters.tipoOperacao)
    }
    const totalAnterior = previous.length
    const variacao =
      totalAnterior > 0 ? ((totalLeads - totalAnterior) / totalAnterior) * 100 : 0

    const clientesRecentes = [...scoped]
      .sort((a, b) => {
        const da = leadDate(a)?.getTime() ?? 0
        const db = leadDate(b)?.getTime() ?? 0
        return db - da
      })
      .slice(0, 6)
      .map(
        (lead): DashboardRecentLead => ({
          id: lead.id,
          nome: lead.nome || 'Sem nome',
          etapa: lead.etapa,
          corretor: resolveCorretorLabel(lead),
          construtora: lead.construtora ?? null,
          atualizadoEm: lead.atualizadoEm ?? null,
        }),
      )

    return {
      totalLeads,
      totalAprovados,
      totalRealizados,
      taxaAprovacao: totalLeads > 0 ? (totalAprovados / totalLeads) * 100 : 0,
      taxaRealizacao: totalLeads > 0 ? (totalRealizados / totalLeads) * 100 : 0,
      vgvTotal,
      vgvRealizado,
      variacao,
      leadsSemCorretor,
      totalConstrutoras: porConstrutora.size,
      principalConstrutora: principalConstrutora?.name ?? null,
      participacaoPrincipalConstrutora:
        principalConstrutora && leadsComConstrutora > 0
          ? (principalConstrutora.value / leadsComConstrutora) * 100
          : 0,
      porEtapa,
      topCorretores: rankByCount(porCorretor).map((item) => ({
        name: item.name,
        leads: item.value,
      })),
      topCoordenadores: rankByCount(
        porCoordenador,
        Number.POSITIVE_INFINITY,
        true,
      ),
      topConstrutoras,
      clientesRecentes,
      totalVisitas,
      taxaConversaoVisitas: totalVisitas > 0 ? (totalRealizados / totalVisitas) * 100 : 0,
      taxaConversaoLeads: totalLeads > 0 ? (totalRealizados / totalLeads) * 100 : 0,
      vgaTotal,
      vgaRealizado,
    }
  } catch (error) {
    console.error('Erro ao calcular resumo do dashboard:', error)
    throw error
  }
}

/** Match direto por FK do coordenador, com fallback string legada. */
function matchesCoordenador(
  lead: LeadMetricRow,
  coordenadorId: string,
  nome: string,
): boolean {
  return (
    lead.coordenadorId === coordenadorId ||
    (!lead.coordenadorId && lead.coordenador === nome)
  )
}

function matchesCorretor(lead: LeadMetricRow, corretorId: string, nome: string): boolean {
  return lead.corretorId === corretorId || (!lead.corretorId && lead.corretor === nome)
}

/**
 * Lead pertence ao coordenador se:
 * - `coordenador_id` / string legada aponta para ele, OU
 * - o corretor do lead está vinculado no cadastro (`corretores.coordenadorId`),
 *   mesmo quando `coordenador_id` do lead é null.
 */
function matchesCoordenadorEquipe(
  lead: LeadMetricRow,
  coordenadorId: string,
  nome: string,
  team: TeamMember[],
): boolean {
  if (matchesCoordenador(lead, coordenadorId, nome)) return true

  if (team.length === 0) return false

  const teamIds = new Set(team.map((m) => m.id))
  const teamNames = new Set(team.map((m) => m.nome))

  if (lead.corretorId && teamIds.has(lead.corretorId)) return true
  if (!lead.corretorId && lead.corretor && teamNames.has(lead.corretor)) return true

  return false
}

async function fetchTeamByCoordenador(coordenadorId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('corretores')
    .select('id, nome')
    .eq('coordenador_id', coordenadorId)
    .eq('ativo', true)
    .order('nome')

  if (error) throw new Error(error.message)

  return ((data as Record<string, unknown>[]) || []).map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
  }))
}

function rankCorretoresFromRows(
  team: TeamMember[],
  scopedLeads: LeadMetricRow[],
  limit = 5,
): TopEntidadeItem[] {
  const ranked = team
    .map((corretor) => {
      const rows = scopedLeads.filter((lead) =>
        matchesCorretor(lead, corretor.id, corretor.nome),
      )
      const especulativoRows = rows.filter((row) => row.etapa === 'especulativo')
      const vgv = rows.reduce((sum, row) => sum + toNumber(row.vgv), 0)
      return {
        id: corretor.id,
        label: corretor.nome,
        value: rows.length,
        vgv,
        especulativoQtd: especulativoRows.length,
        especulativoVgv: especulativoRows.reduce((sum, row) => sum + toNumber(row.vgv), 0),
      }
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || b.vgv - a.vgv)

  return typeof limit === 'number' && limit > 0 ? ranked.slice(0, limit) : ranked
}

/**
 * Métricas de um coordenador (FK/string + leads dos corretores vinculados no cadastro).
 * `rows` opcional evita nova varredura de leads na mesma página.
 */
export async function getMetricsByCoordenador(
  coordenadorId: string,
  periodo: PeriodoFiltro = 'todos',
  rows?: LeadMetricRow[],
): Promise<EntidadeMetrics | null> {
  try {
    const [{ data: coord, error: coordError }, team, leads] = await Promise.all([
      supabase.from('coordenadores').select('id, nome').eq('id', coordenadorId).single(),
      fetchTeamByCoordenador(coordenadorId),
      rows ? Promise.resolve(rows) : fetchLeadMetricRows(),
    ])

    if (coordError || !coord) return null

    const nome = String((coord as Record<string, unknown>).nome)
    const filtered = filterByPeriodo(leads, periodo).filter((lead) =>
      matchesCoordenadorEquipe(lead, coordenadorId, nome, team),
    )

    return aggregateMetrics(coordenadorId, nome, filtered)
  } catch (error) {
    console.error('Erro ao calcular métricas do coordenador:', error)
    throw error
  }
}

/**
 * Métricas de um corretor (preferência por FK; fallback string legada).
 */
export async function getMetricsByCorretor(
  corretorId: string,
  periodo: PeriodoFiltro = 'todos',
): Promise<EntidadeMetrics | null> {
  try {
    const [{ data: corretor, error: corretorError }, leads] = await Promise.all([
      supabase.from('corretores').select('id, nome').eq('id', corretorId).single(),
      fetchLeadMetricRows(),
    ])

    if (corretorError || !corretor) return null

    const nome = String((corretor as Record<string, unknown>).nome)
    const filtered = filterByPeriodo(leads, periodo).filter((lead) =>
      matchesCorretor(lead, corretorId, nome),
    )

    return aggregateMetrics(corretorId, nome, filtered)
  } catch (error) {
    console.error('Erro ao calcular métricas do corretor:', error)
    throw error
  }
}

/**
 * Top corretores subordinados a um coordenador (por quantidade de leads no período).
 * Retorna a equipe completa com métricas; o consumidor aplica o limite/ranking desejado.
 * `rows` opcional evita nova varredura de leads na mesma página.
 */
export async function getTopCorretoresByCoordenador(
  coordenadorId: string,
  periodo: PeriodoFiltro = 'todos',
  limit = 5,
  rows?: LeadMetricRow[],
): Promise<TopEntidadeItem[]> {
  try {
    const [{ data: coord, error: coordError }, team, leads] = await Promise.all([
      supabase.from('coordenadores').select('id, nome').eq('id', coordenadorId).single(),
      fetchTeamByCoordenador(coordenadorId),
      rows ? Promise.resolve(rows) : fetchLeadMetricRows(),
    ])

    if (coordError || !coord) return []

    const coordNome = String((coord as Record<string, unknown>).nome)
    const scopedLeads = filterByPeriodo(leads, periodo).filter((lead) =>
      matchesCoordenadorEquipe(lead, coordenadorId, coordNome, team),
    )

    return rankCorretoresFromRows(team, scopedLeads, limit)
  } catch (error) {
    console.error('Erro ao calcular top corretores do coordenador:', error)
    throw error
  }
}

/**
 * Dashboard do coordenador com uma única varredura de leads
 * (métricas + ranking da equipe).
 */
export async function getCoordenadorDashboard(
  coordenadorId: string,
  periodo: PeriodoFiltro = 'todos',
  topLimit = 5,
): Promise<{ metrics: EntidadeMetrics | null; topCorretores: TopEntidadeItem[] }> {
  try {
    const [{ data: coord, error: coordError }, team, leads] = await Promise.all([
      supabase.from('coordenadores').select('id, nome').eq('id', coordenadorId).single(),
      fetchTeamByCoordenador(coordenadorId),
      fetchLeadMetricRows(),
    ])

    if (coordError || !coord) {
      return { metrics: null, topCorretores: [] }
    }

    const nome = String((coord as Record<string, unknown>).nome)
    const scopedLeads = filterByPeriodo(leads, periodo).filter((lead) =>
      matchesCoordenadorEquipe(lead, coordenadorId, nome, team),
    )

    return {
      metrics: aggregateMetrics(coordenadorId, nome, scopedLeads),
      topCorretores: rankCorretoresFromRows(team, scopedLeads, topLimit),
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard do coordenador:', error)
    throw error
  }
}

/** Métricas de todos os coordenadores ativos (inclui leads da equipe vinculada). */
export async function getAllCoordenadorMetrics(
  periodo: PeriodoFiltro = 'todos',
): Promise<EntidadeMetrics[]> {
  try {
    const [{ data: coords, error }, { data: corretores, error: corrError }, leads] =
      await Promise.all([
        supabase.from('coordenadores').select('id, nome').eq('ativo', true).order('nome'),
        supabase
          .from('corretores')
          .select('id, nome, coordenador_id')
          .eq('ativo', true),
        fetchLeadMetricRows(),
      ])

    if (error) throw new Error(error.message)
    if (corrError) throw new Error(corrError.message)

    const teamByCoord = new Map<string, TeamMember[]>()
    for (const row of (corretores as Record<string, unknown>[]) || []) {
      const coordId = (row.coordenador_id ?? row.coordenadorId) as string | null
      if (!coordId) continue
      const list = teamByCoord.get(coordId) ?? []
      list.push({ id: String(row.id), nome: String(row.nome) })
      teamByCoord.set(coordId, list)
    }

    const scoped = filterByPeriodo(leads, periodo)

    return ((coords as Record<string, unknown>[]) || []).map((coord) => {
      const id = String(coord.id)
      const nome = String(coord.nome)
      const team = teamByCoord.get(id) ?? []
      const rows = scoped.filter((lead) =>
        matchesCoordenadorEquipe(lead, id, nome, team),
      )
      return aggregateMetrics(id, nome, rows)
    })
  } catch (error) {
    console.error('Erro ao calcular métricas dos coordenadores:', error)
    throw error
  }
}

/** Métricas de todos os corretores ativos. */
export async function getAllCorretorMetrics(
  periodo: PeriodoFiltro = 'todos',
): Promise<EntidadeMetrics[]> {
  try {
    const [{ data: corretores, error }, leads] = await Promise.all([
      supabase.from('corretores').select('id, nome').eq('ativo', true).order('nome'),
      fetchLeadMetricRows(),
    ])

    if (error) throw new Error(error.message)

    const scoped = filterByPeriodo(leads, periodo)

    return ((corretores as Record<string, unknown>[]) || []).map((corretor) => {
      const id = String(corretor.id)
      const nome = String(corretor.nome)
      const rows = scoped.filter((lead) => matchesCorretor(lead, id, nome))
      return aggregateMetrics(id, nome, rows)
    })
  } catch (error) {
    console.error('Erro ao calcular métricas dos corretores:', error)
    throw error
  }
}

/**
 * Taxas alinhadas a `/visao`:
 * - aprovação = apenas etapa `aprovado` / total
 * - realização = etapa `realizado` / total
 */
export function calcTaxas(metrics: EntidadeMetrics): {
  taxaAprovacao: number
  taxaRealizacao: number
} {
  const total = metrics.totalLeads || 0
  const aprovados = metrics.porEtapa.aprovado ?? 0
  const realizados = metrics.porEtapa.realizado ?? 0

  return {
    taxaAprovacao: total > 0 ? (aprovados / total) * 100 : 0,
    taxaRealizacao: total > 0 ? (realizados / total) * 100 : 0,
  }
}
