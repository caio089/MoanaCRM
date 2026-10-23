import { supabase } from '@/lib/supabase'
import type { Construtora, OrigemCatalogo } from '@/lib/types'

export type ConstrutoraInput = {
  nome: string
  cidade?: string | null
  ativo?: boolean
  origemCatalogo?: OrigemCatalogo
}

function asConstrutora(row: Record<string, unknown>): Construtora {
  const origem = row.origemCatalogo ?? row.origem_catalogo
  return {
    id: String(row.id),
    nome: String(row.nome),
    cidade: (row.cidade as string | null) ?? null,
    ativo: Boolean(row.ativo),
    origemCatalogo: origem === 'proprio' ? 'proprio' : 'parceira',
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

export async function listConstrutoras(onlyActive = true): Promise<Construtora[]> {
  try {
    let query = supabase.from('construtoras').select('*').order('nome', { ascending: true })
    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asConstrutora)
  } catch (error) {
    console.error('Erro ao listar construtoras:', error)
    throw error
  }
}

/** Nomes ativos para selects de lead / filtros. */
export async function listConstrutoraNomes(onlyActive = true): Promise<string[]> {
  const list = await listConstrutoras(onlyActive)
  return list.map((c) => c.nome)
}

export async function createConstrutora(input: ConstrutoraInput): Promise<Construtora> {
  try {
    const nome = input.nome?.trim()
    if (!nome) throw new Error('Nome da construtora é obrigatório')

    const { data, error } = await supabase
      .from('construtoras')
      .insert({
        nome,
        cidade: input.cidade?.trim() || null,
        ativo: input.ativo ?? true,
        origemCatalogo: input.origemCatalogo === 'proprio' ? 'proprio' : 'parceira',
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao criar construtora')
    return asConstrutora(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao criar construtora:', error)
    throw error
  }
}

export async function updateConstrutora(
  id: string,
  input: Partial<ConstrutoraInput>,
): Promise<Construtora> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.nome !== undefined) {
      const nome = input.nome.trim()
      if (!nome) throw new Error('Nome da construtora é obrigatório')
      payload.nome = nome
    }
    if (input.cidade !== undefined) payload.cidade = input.cidade?.trim() || null
    if (input.ativo !== undefined) payload.ativo = input.ativo
    if (input.origemCatalogo !== undefined) {
      payload.origemCatalogo = input.origemCatalogo === 'proprio' ? 'proprio' : 'parceira'
    }

    const { data, error } = await supabase
      .from('construtoras')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar construtora')
    return asConstrutora(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao atualizar construtora:', error)
    throw error
  }
}

export async function deactivateConstrutora(id: string): Promise<Construtora> {
  return updateConstrutora(id, { ativo: false })
}
