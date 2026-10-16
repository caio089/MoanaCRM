import { supabase } from '@/lib/supabase'
import type { CorrespondenteBancario } from '@/lib/types'

export type CorrespondenteInput = {
  nome: string
  banco?: string | null
  contato?: string | null
  email?: string | null
  telefone?: string | null
  ativo?: boolean
}

export type ResolveCorrespondenteOptions = {
  /**
   * Default: false — só cria cadastro quando explicitamente true
   * (e tipicamente com CORRESPONDENTE_AUTO_CREATE / contexto admin).
   */
  createIfMissing?: boolean
}

function normalizeNome(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.length > 0 ? trimmed : null
}

function nomesIguais(a: string, b: string): boolean {
  return a.toLocaleLowerCase('pt-BR') === b.toLocaleLowerCase('pt-BR')
}

function asCorrespondente(row: Record<string, unknown>): CorrespondenteBancario {
  return {
    id: String(row.id),
    nome: String(row.nome),
    banco: (row.banco as string | null) ?? null,
    contato: (row.contato as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    ativo: Boolean(row.ativo),
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

export async function listCorrespondentes(
  onlyActive = true,
): Promise<CorrespondenteBancario[]> {
  try {
    let query = supabase
      .from('correspondentes_bancarios')
      .select('*')
      .order('nome', { ascending: true })

    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asCorrespondente)
  } catch (error) {
    console.error('Erro ao listar correspondentes:', error)
    throw error
  }
}

export async function getCorrespondenteById(
  id: string,
): Promise<CorrespondenteBancario | null> {
  try {
    const { data, error } = await supabase
      .from('correspondentes_bancarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return asCorrespondente(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao buscar correspondente:', error)
    throw error
  }
}

/**
 * Busca case-insensitive por nome.
 * @param onlyActive default true — não vincula a soft-deleted.
 */
export async function findCorrespondenteByNome(
  nome: string,
  onlyActive = true,
): Promise<CorrespondenteBancario | null> {
  const needle = normalizeNome(nome)
  if (!needle) return null

  try {
    const lista = await listCorrespondentes(onlyActive)
    // Preferência: ativo (já filtrado) com match de nome
    return lista.find((item) => nomesIguais(item.nome, needle)) ?? null
  } catch (error) {
    console.error('Erro ao buscar correspondente por nome:', error)
    throw error
  }
}

/**
 * Resolve nome legado → FK (apenas ativos).
 * Nunca reutiliza correspondente inativo.
 * Se não existir ativo e `createIfMissing` (default false), cria cadastro ativo;
 * senão retorna id null e mantém o nome legado.
 */
export async function resolveCorrespondenteId(
  nome: string | null | undefined,
  options: ResolveCorrespondenteOptions = {},
): Promise<{ id: string | null; nome: string | null }> {
  const createIfMissing = options.createIfMissing === true
  const normalized = normalizeNome(nome)
  if (!normalized) return { id: null, nome: null }

  const existing = await findCorrespondenteByNome(normalized, true)
  if (existing) return { id: existing.id, nome: existing.nome }

  if (!createIfMissing) return { id: null, nome: normalized }

  const created = await createCorrespondente({ nome: normalized, ativo: true })
  return { id: created.id, nome: created.nome }
}

export async function createCorrespondente(
  input: CorrespondenteInput,
): Promise<CorrespondenteBancario> {
  try {
    const nome = input.nome?.trim()
    if (!nome) throw new Error('Nome do correspondente é obrigatório')

    const { data, error } = await supabase
      .from('correspondentes_bancarios')
      .insert({
        nome,
        banco: input.banco?.trim() || null,
        contato: input.contato?.trim() || null,
        email: input.email?.trim() || null,
        telefone: input.telefone?.trim() || null,
        ativo: input.ativo ?? true,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao criar correspondente')
    return asCorrespondente(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao criar correspondente:', error)
    throw error
  }
}

export async function updateCorrespondente(
  id: string,
  input: Partial<CorrespondenteInput>,
): Promise<CorrespondenteBancario> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.nome !== undefined) {
      const nome = input.nome.trim()
      if (!nome) throw new Error('Nome do correspondente é obrigatório')
      payload.nome = nome
    }
    if (input.banco !== undefined) payload.banco = input.banco?.trim() || null
    if (input.contato !== undefined) payload.contato = input.contato?.trim() || null
    if (input.email !== undefined) payload.email = input.email?.trim() || null
    if (input.telefone !== undefined) payload.telefone = input.telefone?.trim() || null
    if (input.ativo !== undefined) payload.ativo = input.ativo

    const { data, error } = await supabase
      .from('correspondentes_bancarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar correspondente')
    return asCorrespondente(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao atualizar correspondente:', error)
    throw error
  }
}

/** Soft-delete via flag `ativo`. */
export async function deactivateCorrespondente(
  id: string,
): Promise<CorrespondenteBancario> {
  return updateCorrespondente(id, { ativo: false })
}

/** Soft-delete alias explícito. */
export async function softDeleteCorrespondente(
  id: string,
): Promise<CorrespondenteBancario> {
  return deactivateCorrespondente(id)
}

/** Contagem de leads por correspondente (FK). */
export async function countLeadsByCorrespondente(
  correspondenteId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('correspondente_id', correspondenteId)

    if (error) throw new Error(error.message)
    return count ?? 0
  } catch (error) {
    console.error('Erro ao contar leads do correspondente:', error)
    throw error
  }
}

/** Mapa id → quantidade de leads (uma query). */
export async function countLeadsGroupedByCorrespondente(): Promise<
  Record<string, number>
> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('correspondente_id')
      .not('correspondente_id', 'is', null)

    if (error) throw new Error(error.message)

    const counts: Record<string, number> = {}
    for (const row of (data as Record<string, unknown>[]) || []) {
      const id = String(row.correspondente_id ?? row.correspondenteId ?? '')
      if (!id) continue
      counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  } catch (error) {
    console.error('Erro ao agrupar leads por correspondente:', error)
    throw error
  }
}
