import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/types'

export type PoolLead = Pick<
  Lead,
  | 'id'
  | 'nome'
  | 'cpf'
  | 'telefone'
  | 'cidade'
  | 'etapa'
  | 'construtora'
  | 'produto'
  | 'origem'
  | 'observacao'
  | 'criadoEm'
  | 'atualizadoEm'
> & {
  /** Consultor que constava na planilha de origem (ex-equipe ou não cadastrado) */
  corretorOrigem: string | null
}

export const POOL_PAGE_SIZE = 500

const POOL_COLUMNS =
  'id, nome, cpf, telefone, cidade, etapa, construtora, produto, origem, observacao, corretor_origem, criado_em, atualizado_em'

function asPoolLead(row: Record<string, unknown>): PoolLead {
  return {
    id: String(row.id),
    nome: String(row.nome ?? ''),
    cpf: (row.cpf as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    cidade: (row.cidade as string | null) ?? null,
    etapa: row.etapa as PoolLead['etapa'],
    construtora: (row.construtora as string | null) ?? null,
    produto: (row.produto as string | null) ?? null,
    origem: (row.origem as string | null) ?? null,
    observacao: (row.observacao as string | null) ?? null,
    corretorOrigem: (row.corretor_origem as string | null) ?? null,
    criadoEm: row.criado_em as string,
    atualizadoEm: row.atualizado_em as string,
  }
}

/** Remove caracteres que quebram a sintaxe do filtro `or` do PostgREST. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\]/g, ' ').trim()
}

/** Leads da central (view `v_leads_central`, admin-only via RLS), paginados no banco. */
export async function listPoolLeads(opts?: {
  search?: string
  origem?: string | null
  limit?: number
}): Promise<{ leads: PoolLead[]; total: number }> {
  const client = createClient()
  let query = client
    .from('v_leads_central')
    .select(POOL_COLUMNS, { count: 'exact' })
    .order('atualizado_em', { ascending: false })
    .limit(opts?.limit ?? POOL_PAGE_SIZE)

  if (opts?.origem) {
    query = query.eq('origem', opts.origem)
  }

  const search = sanitizeSearch(opts?.search ?? '')
  if (search) {
    const pattern = `%${search}%`
    query = query.or(
      `nome.ilike.${pattern},telefone.ilike.${pattern},cpf.ilike.${pattern},cidade.ilike.${pattern},corretor_origem.ilike.${pattern}`,
    )
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    leads: ((data ?? []) as Record<string, unknown>[]).map(asPoolLead),
    total: count ?? 0,
  }
}

/** Distribui vários leads para o mesmo corretor numa única chamada (admin). */
export async function distribuirLeads(leadIds: string[], corretorId: string): Promise<number> {
  if (leadIds.length === 0) return 0

  const client = createClient()
  const { data, error } = await client.rpc('admin_distribuir_leads', {
    p_lead_ids: leadIds,
    p_corretor_id: corretorId,
  })
  if (error) throw new Error(error.message)
  return Number(data ?? 0)
}
