import { supabase } from '@/lib/supabase'
import type { Bairro } from '@/lib/types'

export type BairroInput = {
  nome: string
  cidadeId: string
  ativo?: boolean
}

function asBairro(row: Record<string, unknown>): Bairro {
  return {
    id: String(row.id),
    nome: String(row.nome),
    cidadeId: String(row.cidadeId ?? row.cidade_id),
    ativo: Boolean(row.ativo),
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

export async function listBairros(cidadeId?: string, onlyActive = true): Promise<Bairro[]> {
  try {
    let query = supabase.from('bairros').select('*').order('nome', { ascending: true })
    if (cidadeId) query = query.eq('cidade_id', cidadeId)
    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asBairro)
  } catch (error) {
    console.error('Erro ao listar bairros:', error)
    throw error
  }
}

export async function createBairro(input: BairroInput): Promise<Bairro> {
  const nome = input.nome?.trim()
  if (!nome) throw new Error('Nome do bairro é obrigatório')
  if (!input.cidadeId) throw new Error('Cidade do bairro é obrigatória')

  const { data, error } = await supabase
    .from('bairros')
    .insert({
      nome,
      cidadeId: input.cidadeId,
      ativo: input.ativo ?? true,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message || 'Falha ao criar bairro')
  return asBairro(data as Record<string, unknown>)
}

export async function updateBairro(id: string, input: Partial<BairroInput>): Promise<Bairro> {
  const payload: Record<string, unknown> = {}
  if (input.nome !== undefined) {
    const nome = input.nome.trim()
    if (!nome) throw new Error('Nome do bairro é obrigatório')
    payload.nome = nome
  }
  if (input.cidadeId !== undefined) payload.cidadeId = input.cidadeId
  if (input.ativo !== undefined) payload.ativo = input.ativo

  const { data, error } = await supabase
    .from('bairros')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message || 'Falha ao atualizar bairro')
  return asBairro(data as Record<string, unknown>)
}

export async function deactivateBairro(id: string): Promise<Bairro> {
  return updateBairro(id, { ativo: false })
}
