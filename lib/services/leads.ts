import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { toSnakeCase } from '@/lib/query/columns'
import type { KanbanLead, Lead } from '@/lib/types'

export interface LeadsFilters {
  search?: string
  corretor?: string
  coordenador?: string
  construtora?: string
  cidade?: string
  dataInicio?: string
  dataFim?: string
  etapa?: string
  situacao?: string
  origem?: string
  tipoOperacao?: string
}

interface PaginationOptions {
  page: number
  limit: number
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/** Aplica filtro de coordenador (id do cadastro ou nome legado). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCoordenadorFilter(query: any, value: string) {
  if (isUuid(value)) {
    return query.or(`coordenador_id.eq.${value},coordenador.eq.${value}`)
  }
  return query.eq('coordenador', value)
}

/** Aplica filtro de corretor (id do cadastro ou nome legado). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCorretorFilter(query: any, value: string) {
  if (isUuid(value)) {
    return query.or(`corretor_id.eq.${value},corretor.eq.${value}`)
  }
  return query.eq('corretor', value)
}

type GroupField =
  | 'mes'
  | 'etapa'
  | 'corretor'
  | 'coordenador'
  | 'origem'
  | 'cidade'
  | 'construtora'
  | 'tipo_renda'
  | 'comprovacao'
  | 'modalidade'
  | 'tipo_imovel'
  | 'produto'
  | 'bairro'
  | 'situacao_reprovado'

type GroupRow = { label: string; total: number; vgv: number }

/** Agrega leads no banco (RPC `leads_group_count`), respeitando RLS e os filtros da tela. */
async function groupLeads(field: GroupField, filters?: LeadsFilters, etapa?: string): Promise<GroupRow[]> {
  const payload: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...filters, etapa: etapa ?? filters?.etapa })) {
    if (typeof value === 'string' && value.trim()) payload[key] = value.trim()
  }

  const { data, error } = await createClient().rpc('leads_group_count', {
    p_field: field,
    p_filters: payload,
  })
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<{ label: string; total: number | string; vgv: number | string }>).map((row) => ({
    label: row.label,
    total: Number(row.total) || 0,
    vgv: Number(row.vgv) || 0,
  }))
}

function toRecord(rows: GroupRow[], metric: 'total' | 'vgv'): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.label, row[metric]]))
}

function topN(rows: GroupRow[], metric: 'total' | 'vgv', limit = 5) {
  return [...rows]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit)
    .map((row) => ({ label: row.label, value: row[metric] }))
}

export async function getKanbanLeads(): Promise<KanbanLead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, nome, cidade, etapa, corretor, origem, vgv, telefone, tipo_operacao')
      .order('atualizado_em', { ascending: false })

    if (error) throw error
    return (data || []) as KanbanLead[]
  } catch (error) {
    console.error('Erro ao carregar o Kanban:', error)
    throw error
  }
}

export async function getLeadsWithFilters(
  filters: LeadsFilters,
  pagination: PaginationOptions
) {
  try {
    let query = supabase.from('leads').select('*', { count: 'exact' })

    // Aplicar filtros
    if (filters.search?.trim()) {
      const search = filters.search.trim()
      query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%,id.ilike.%${search}%`)
    }
    if (filters.corretor) query = applyCorretorFilter(query, filters.corretor)
    if (filters.coordenador) query = applyCoordenadorFilter(query, filters.coordenador)
    if (filters.construtora)
      query = query.eq('construtora', filters.construtora)
    if (filters.cidade) query = query.eq('cidade', filters.cidade)
    if (filters.etapa) query = query.eq('etapa', filters.etapa)
    if (filters.situacao)
      query = query.eq('situacao_reprovado', filters.situacao)
    if (filters.origem) query = query.eq('origem', filters.origem)
    if (filters.tipoOperacao) query = query.eq('tipo_operacao', filters.tipoOperacao)

    // Filtro por data
    if (filters.dataInicio)
      query = query.gte('criado_em', `${filters.dataInicio}T00:00:00.000Z`)
    if (filters.dataFim) query = query.lte('criado_em', `${filters.dataFim}T23:59:59.999Z`)

    // Ordenação e paginação
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1

    const { data, error, count } = await query
      .order('criado_em', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      leads: (data || []) as Lead[],
      total: count || 0,
    }
  } catch (error) {
    console.error('Erro ao buscar leads:', error)
    throw error
  }
}

// Contar leads por etapa (a etapa da tela não restringe: queremos todas as etapas)
export async function countLeadsByEtapa(filters?: LeadsFilters) {
  try {
    return toRecord(await groupLeads('etapa', { ...filters, etapa: undefined }), 'total')
  } catch (error) {
    console.error('Erro ao contar leads por etapa:', error)
    throw error
  }
}

// Somar VGV por etapa
export async function sumVGVByEtapa(filters?: LeadsFilters) {
  try {
    return toRecord(await groupLeads('etapa', { ...filters, etapa: undefined }), 'vgv')
  } catch (error) {
    console.error('Erro ao somar VGV por etapa:', error)
    throw error
  }
}

// Contar por Corretor
export async function countByCorretor(etapa?: string, filters?: LeadsFilters) {
  try {
    return toRecord(await groupLeads('corretor', filters, etapa), 'total')
  } catch (error) {
    console.error('Erro ao contar por corretor:', error)
    throw error
  }
}

// Obter Top N por categoria
async function getTopByField(field: GroupField, etapa?: string, filters?: LeadsFilters, limit: number = 5) {
  try {
    return topN(await groupLeads(field, filters, etapa), 'total', limit)
  } catch (error) {
    console.error(`Erro ao buscar top por ${field}:`, error)
    return []
  }
}

export async function getTopByCorretor(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('corretor', etapa, filters)
}

export async function getTopByOrigem(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('origem', etapa, filters)
}

export async function getTopByCidade(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('cidade', etapa, filters)
}

export async function getTopByCoordenador(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('coordenador', etapa, filters)
}

export async function getTopByConstrutora(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('construtora', etapa, filters)
}

export async function getTopByTipoRenda(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('tipo_renda', etapa, filters)
}

export async function getTopByComprovacao(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('comprovacao', etapa, filters)
}

export async function getTopByModalidade(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('modalidade', etapa, filters)
}

export async function getTopByTipo(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('tipo_imovel', etapa, filters)
}

export async function getTopByProduto(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('produto', etapa, filters)
}

export async function getTopByBairro(etapa?: string, filters?: LeadsFilters) {
  return getTopByField('bairro', etapa, filters)
}

export async function getTopByVGVCorretor(etapa?: string, filters?: LeadsFilters) {
  try {
    return topN(await groupLeads('corretor', filters, etapa), 'vgv')
  } catch (error) {
    console.error('Erro ao buscar top VGV por corretor:', error)
    return []
  }
}

export async function getTopByVGVCoordenador(etapa?: string, filters?: LeadsFilters) {
  try {
    return topN(await groupLeads('coordenador', filters, etapa), 'vgv')
  } catch (error) {
    console.error('Erro ao buscar top VGV por coordenador:', error)
    return []
  }
}

/**
 * Timeline mensal real a partir dos leads (criado_em), opcionalmente filtrada por etapa.
 * Retorna os últimos `months` meses (inclusive meses sem leads).
 */
export async function getTimelineByEtapa(
  etapa?: string,
  filters?: LeadsFilters,
  months = 6,
): Promise<Array<{ name: string; value: number }>> {
  try {
    const counts = toRecord(await groupLeads('mes', filters, etapa), 'total')
    const now = new Date()
    const result: Array<{ name: string; value: number }> = []

    for (let i = months - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        .replace('.', '')
        .replace(' de ', '/')
      result.push({ name: label, value: counts[key] || 0 })
    }

    return result
  } catch (error) {
    console.error('Erro ao montar timeline por etapa:', error)
    return []
  }
}

/** Valores distintos de um campo nos leads (agrupado no banco), em ordem alfabética. */
async function distinctLeadValues(field: GroupField): Promise<string[]> {
  try {
    const rows = await groupLeads(field)
    return rows.map((row) => row.label).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  } catch {
    return []
  }
}

// Obter opções de filtro — prioriza cadastro (coordenadores/corretores), não só leads
export async function getFilterOptions() {
  try {
    const { listCidadeNomes } = await import('@/lib/services/cidades')
    const { listConstrutoraNomes } = await import('@/lib/services/construtoras')
    const { ORIGEM_VALUES } = await import('@/lib/constants/origens')

    const [
      coordsRes,
      corrsRes,
      construtorasCadastro,
      construtorasLeads,
      cidadesCadastro,
      cidadesLeads,
      origensLeads,
      leadsCorretores,
      leadsCoordenadores,
    ] = await Promise.all([
      supabase
        .from('coordenadores')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .order('nome', { ascending: true }),
      supabase
        .from('corretores')
        .select('id, nome, ativo, coordenador_id')
        .eq('ativo', true)
        .order('nome', { ascending: true }),
      listConstrutoraNomes(true).catch(() => [] as string[]),
      distinctLeadValues('construtora'),
      listCidadeNomes(true).catch(() => [] as string[]),
      distinctLeadValues('cidade'),
      distinctLeadValues('origem'),
      distinctLeadValues('corretor'),
      distinctLeadValues('coordenador'),
    ])

    if (coordsRes.error) {
      console.error('Filtros: falha ao ler coordenadores', coordsRes.error.message)
    }
    if (corrsRes.error) {
      console.error('Filtros: falha ao ler corretores', corrsRes.error.message)
    }

    const teamCoords = ((coordsRes.data as Record<string, unknown>[]) || []).map((row) => ({
      value: String(row.id),
      label: String(row.nome),
    }))

    const teamCorrs = ((corrsRes.data as Record<string, unknown>[]) || []).map((row) => ({
      value: String(row.id),
      label: String(row.nome),
      coordenadorId: (row.coordenador_id ?? row.coordenadorId ?? null) as string | null,
    }))

    const coordNamesFromTeam = teamCoords.map((c) => c.label)
    const corrNamesFromTeam = teamCorrs.map((c) => c.label)

    const legacyCoords = leadsCoordenadores.filter(
      (nome) =>
        !coordNamesFromTeam.some(
          (n) => n.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
        ),
    )
    const legacyCorrs = leadsCorretores.filter(
      (nome) =>
        !corrNamesFromTeam.some(
          (n) => n.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
        ),
    )

    const coordenadores = [
      ...teamCoords,
      ...legacyCoords.map((nome) => ({ value: nome, label: nome })),
    ]

    const corretores = [
      ...teamCorrs,
      ...legacyCorrs.map((nome) => ({
        value: nome,
        label: nome,
        coordenadorId: null as string | null,
      })),
    ]

    const cidades = Array.from(
      new Set([...(cidadesCadastro || []), ...cidadesLeads]),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    const construtoras = Array.from(
      new Set([...(construtorasCadastro || []), ...construtorasLeads]),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    const origens = Array.from(
      new Set([...ORIGEM_VALUES, ...origensLeads]),
    )

    return {
      corretores,
      coordenadores,
      construtoras,
      cidades,
      origens,
    }
  } catch (error) {
    console.error('Erro ao buscar opções de filtro:', error)
    const { ORIGEM_VALUES } = await import('@/lib/constants/origens')
    return {
      corretores: [] as Array<{ value: string; label: string; coordenadorId?: string | null }>,
      coordenadores: [] as Array<{ value: string; label: string }>,
      construtoras: [] as string[],
      cidades: [] as string[],
      origens: [...ORIGEM_VALUES],
    }
  }
}

function mapToDbRow(data: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      row[toSnakeCase(key)] = value
    }
  }
  // Se corretor/corretor_id não foram definidos, garante null para aparecer na mesa de distribuição
  if (!row.corretor_id && !row.corretor) {
    row.corretor_id = null
    row.corretor = null
    row.coordenador_id = null
    row.coordenador = null
  }
  return row
}

// Criar novo lead
export async function createLead(leadData: Partial<Lead>): Promise<Lead> {
  try {
    const id = leadData.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const now = new Date().toISOString()

    const rawPayload = {
      ...leadData,
      id,
      etapa: leadData.etapa || 'lead',
      tipoOperacao: leadData.tipoOperacao || 'venda',
      criadoEm: leadData.criadoEm ?? now,
      atualizadoEm: leadData.atualizadoEm ?? now,
    }

    const dbPayload = mapToDbRow(rawPayload as Record<string, unknown>)

    const { data, error } = await supabase
      .from('leads')
      .insert([dbPayload])
      .select()
      .single()

    if (error) {
      // Insert pode ter gravado, mas o RETURNING falha se RLS de SELECT filtrar a row
      const msg = error.message || ''
      if (/0 rows|PGRST116|Cannot coerce/i.test(msg)) {
        return rawPayload as Lead
      }
      throw new Error(msg || 'Falha ao criar lead')
    }
    if (!data) return rawPayload as Lead
    return data as Lead
  } catch (error) {
    console.error('Erro ao criar lead:', error)
    if (error instanceof Error) throw error
    throw new Error('Erro ao criar lead')
  }
}

// Atualizar lead existente
export async function updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
  try {
    const rawPayload = {
      ...leadData,
      atualizadoEm: new Date().toISOString(),
    }

    const dbPayload = mapToDbRow(rawPayload as Record<string, unknown>)

    const { data, error } = await supabase
      .from('leads')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      const msg = error.message || ''
      if (/0 rows|PGRST116|Cannot coerce/i.test(msg)) {
        return { ...rawPayload, id } as Lead
      }
      throw new Error(msg || 'Falha ao atualizar lead')
    }
    if (!data) return { ...rawPayload, id } as Lead
    return data as Lead
  } catch (error) {
    console.error('Erro ao atualizar lead:', error)
    if (error instanceof Error) throw error
    throw new Error('Erro ao atualizar lead')
  }
}

// Obter um lead por ID
export async function getLeadById(id: string): Promise<Lead> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Lead
  } catch (error) {
    console.error('Erro ao buscar lead:', error)
    throw error
  }
}

// Deletar lead por ID
export async function deleteLead(id: string): Promise<void> {
  if (!id) throw new Error('ID do lead é obrigatório')

  try {
    const { data, error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) throw new Error(error.message || 'Falha ao deletar lead')

    const rows = Array.isArray(data) ? data : data ? [data] : []
    if (rows.length === 0) {
      throw new Error('Lead não encontrado ou sem permissão para excluir')
    }
  } catch (error) {
    console.error('Erro ao deletar lead:', error)
    if (error instanceof Error) throw error
    throw new Error('Erro ao deletar lead')
  }
}
