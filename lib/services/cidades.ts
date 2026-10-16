import { supabase } from '@/lib/supabase'
import type { Cidade } from '@/lib/types'

export type CidadeInput = {
  nome: string
  uf?: string | null
  ativo?: boolean
}

function asCidade(row: Record<string, unknown>): Cidade {
  return {
    id: String(row.id),
    nome: String(row.nome),
    uf: String(row.uf ?? 'PI'),
    ativo: Boolean(row.ativo),
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

export async function listCidades(onlyActive = true): Promise<Cidade[]> {
  try {
    let query = supabase.from('cidades').select('*').order('nome', { ascending: true })
    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asCidade)
  } catch (error) {
    console.error('Erro ao listar cidades:', error)
    throw error
  }
}

/** Nomes ativos para selects de lead / filtros. */
export async function listCidadeNomes(onlyActive = true): Promise<string[]> {
  const list = await listCidades(onlyActive)
  return list.map((c) => c.nome)
}

export async function createCidade(input: CidadeInput): Promise<Cidade> {
  try {
    const nome = input.nome?.trim()
    if (!nome) throw new Error('Nome da cidade é obrigatório')

    const uf = (input.uf?.trim() || 'PI').toUpperCase()

    const { data, error } = await supabase
      .from('cidades')
      .insert({
        nome,
        uf,
        ativo: input.ativo ?? true,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao criar cidade')
    return asCidade(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao criar cidade:', error)
    throw error
  }
}

export async function updateCidade(
  id: string,
  input: Partial<CidadeInput>,
): Promise<Cidade> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.nome !== undefined) {
      const nome = input.nome.trim()
      if (!nome) throw new Error('Nome da cidade é obrigatório')
      payload.nome = nome
    }
    if (input.uf !== undefined) payload.uf = (input.uf?.trim() || 'PI').toUpperCase()
    if (input.ativo !== undefined) payload.ativo = input.ativo

    const { data, error } = await supabase
      .from('cidades')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar cidade')
    return asCidade(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error)
    throw error
  }
}

export async function deactivateCidade(id: string): Promise<Cidade> {
  return updateCidade(id, { ativo: false })
}
