import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import type {
  Coordenador,
  CoordenadorComCorretores,
  Corretor,
  TeamHierarchy,
} from '@/lib/types'

export type CoordenadorInput = {
  nome: string
  email?: string | null
  telefone?: string | null
  ativo?: boolean
}

export type CorretorInput = {
  nome: string
  email?: string | null
  telefone?: string | null
  ativo?: boolean
  coordenadorId?: string | null
}

type TeamReadScope = {
  isAdmin: boolean
  coordenadorId: string | null
}

/**
 * Descobre o escopo da sessão para também filtrar a consulta no cliente.
 * A RLS continua sendo a barreira de segurança; se as RPCs ainda não estiverem
 * disponíveis durante um deploy, a consulta cai no comportamento protegido pela RLS.
 */
async function getTeamReadScope(): Promise<TeamReadScope> {
  const client = createClient()
  const [adminResult, coordenadorResult] = await Promise.all([
    client.rpc('is_app_admin'),
    client.rpc('current_coordenador_id'),
  ])

  if (adminResult.error || coordenadorResult.error) {
    console.warn(
      'Escopo explícito da equipe indisponível; usando somente a proteção RLS.',
      adminResult.error ?? coordenadorResult.error,
    )
    return { isAdmin: false, coordenadorId: null }
  }

  return {
    isAdmin: adminResult.data === true,
    coordenadorId:
      typeof coordenadorResult.data === 'string' ? coordenadorResult.data : null,
  }
}

function asCoordenador(row: Record<string, unknown>): Coordenador {
  return {
    id: String(row.id),
    nome: String(row.nome),
    email: (row.email as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    ativo: Boolean(row.ativo),
    userId: (row.userId ?? row.user_id ?? null) as string | null,
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

function asCorretor(row: Record<string, unknown>): Corretor {
  return {
    id: String(row.id),
    nome: String(row.nome),
    email: (row.email as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    ativo: Boolean(row.ativo),
    coordenadorId: (row.coordenadorId ?? row.coordenador_id ?? null) as string | null,
    userId: (row.userId ?? row.user_id ?? null) as string | null,
    criadoEm: (row.criadoEm ?? row.criado_em) as string | Date,
    atualizadoEm: (row.atualizadoEm ?? row.atualizado_em) as string | Date,
  }
}

/** Hierarquia real a partir do cadastro (não inferida de leads). */
export async function getTeamHierarchy(onlyActive = true): Promise<TeamHierarchy> {
  try {
    const client = createClient()
    const scope = await getTeamReadScope()
    let coordQuery = client.from('coordenadores').select('*').order('nome', { ascending: true })
    let corrQuery = client.from('corretores').select('*').order('nome', { ascending: true })

    // O coordenador pede apenas o próprio cadastro e os membros vinculados.
    // Isso melhora o plano da consulta e evita depender de filtragem posterior na UI.
    if (!scope.isAdmin && scope.coordenadorId) {
      coordQuery = coordQuery.eq('id', scope.coordenadorId)
      corrQuery = corrQuery.eq('coordenador_id', scope.coordenadorId)
    }

    if (onlyActive) {
      coordQuery = coordQuery.eq('ativo', true)
      corrQuery = corrQuery.eq('ativo', true)
    }

    const [coordResult, corrResult] = await Promise.all([coordQuery, corrQuery])

    if (coordResult.error) throw new Error(coordResult.error.message)
    if (corrResult.error) throw new Error(corrResult.error.message)

    const coordenadores = ((coordResult.data as Record<string, unknown>[]) || []).map(asCoordenador)
    const corretores = ((corrResult.data as Record<string, unknown>[]) || []).map(asCorretor)

    const byCoord = new Map<string, Corretor[]>()
    for (const corretor of corretores) {
      if (!corretor.coordenadorId) continue
      const list = byCoord.get(corretor.coordenadorId) ?? []
      list.push(corretor)
      byCoord.set(corretor.coordenadorId, list)
    }

    return coordenadores.map(
      (coordenador): CoordenadorComCorretores => ({
        ...coordenador,
        corretores: byCoord.get(coordenador.id) ?? [],
      }),
    )
  } catch (error) {
    console.error('Erro ao carregar hierarquia da equipe:', error)
    throw error
  }
}

export async function listCoordenadores(onlyActive = true): Promise<Coordenador[]> {
  try {
    let query = supabase.from('coordenadores').select('*').order('nome', { ascending: true })
    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asCoordenador)
  } catch (error) {
    console.error('Erro ao listar coordenadores:', error)
    throw error
  }
}

export async function getCoordenadorById(id: string): Promise<Coordenador | null> {
  try {
    const { data, error } = await supabase
      .from('coordenadores')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return asCoordenador(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao buscar coordenador:', error)
    throw error
  }
}

export async function createCoordenador(input: CoordenadorInput): Promise<Coordenador> {
  try {
    const nome = input.nome?.trim()
    if (!nome) throw new Error('Nome do coordenador é obrigatório')

    const { data, error } = await supabase
      .from('coordenadores')
      .insert({
        nome,
        email: input.email?.trim() || null,
        telefone: input.telefone?.trim() || null,
        ativo: input.ativo ?? true,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao criar coordenador')
    return asCoordenador(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao criar coordenador:', error)
    throw error
  }
}

export async function updateCoordenador(
  id: string,
  input: Partial<CoordenadorInput>,
): Promise<Coordenador> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.nome !== undefined) {
      const nome = input.nome.trim()
      if (!nome) throw new Error('Nome do coordenador é obrigatório')
      payload.nome = nome
    }
    if (input.email !== undefined) payload.email = input.email?.trim() || null
    if (input.telefone !== undefined) payload.telefone = input.telefone?.trim() || null
    if (input.ativo !== undefined) payload.ativo = input.ativo

    const { data, error } = await supabase
      .from('coordenadores')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar coordenador')
    return asCoordenador(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao atualizar coordenador:', error)
    throw error
  }
}

export async function listCorretores(onlyActive = true): Promise<Corretor[]> {
  try {
    let query = supabase.from('corretores').select('*').order('nome', { ascending: true })
    if (onlyActive) query = query.eq('ativo', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data as Record<string, unknown>[]) || []).map(asCorretor)
  } catch (error) {
    console.error('Erro ao listar corretores:', error)
    throw error
  }
}

export async function getCorretorById(id: string): Promise<Corretor | null> {
  try {
    const { data, error } = await supabase
      .from('corretores')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return asCorretor(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao buscar corretor:', error)
    throw error
  }
}

export async function createCorretor(input: CorretorInput): Promise<Corretor> {
  try {
    const nome = input.nome?.trim()
    if (!nome) throw new Error('Nome do corretor é obrigatório')

    const { data, error } = await supabase
      .from('corretores')
      .insert({
        nome,
        email: input.email?.trim() || null,
        telefone: input.telefone?.trim() || null,
        ativo: input.ativo ?? true,
        coordenador_id: input.coordenadorId ?? null,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao criar corretor')
    return asCorretor(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao criar corretor:', error)
    throw error
  }
}

export async function updateCorretor(
  id: string,
  input: Partial<CorretorInput>,
): Promise<Corretor> {
  try {
    const payload: Record<string, unknown> = {}
    if (input.nome !== undefined) {
      const nome = input.nome.trim()
      if (!nome) throw new Error('Nome do corretor é obrigatório')
      payload.nome = nome
    }
    if (input.email !== undefined) payload.email = input.email?.trim() || null
    if (input.telefone !== undefined) payload.telefone = input.telefone?.trim() || null
    if (input.ativo !== undefined) payload.ativo = input.ativo
    if (input.coordenadorId !== undefined) payload.coordenador_id = input.coordenadorId

    const { data, error } = await supabase
      .from('corretores')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar corretor')
    return asCorretor(data as Record<string, unknown>)
  } catch (error) {
    console.error('Erro ao atualizar corretor:', error)
    throw error
  }
}

/** Soft-delete: marca ativo = false */
export async function deactivateCoordenador(id: string): Promise<Coordenador> {
  return setCoordenadorAtivo(id, false)
}

/** Soft-delete: marca ativo = false */
export async function deactivateCorretor(id: string): Promise<Corretor> {
  return setCorretorAtivo(id, false)
}

/** Reativa coordenador (admin). */
export async function activateCoordenador(id: string): Promise<Coordenador> {
  return setCoordenadorAtivo(id, true)
}

/** Reativa corretor/consultor (admin). */
export async function activateCorretor(id: string): Promise<Corretor> {
  return setCorretorAtivo(id, true)
}

async function setCoordenadorAtivo(id: string, ativo: boolean): Promise<Coordenador> {
  try {
    const client = createClient()
    const { error: rpcError } = await client.rpc('admin_set_equipe_ativo', {
      p_tipo: 'coordenador',
      p_id: id,
      p_ativo: ativo,
    })
    if (rpcError) throw new Error(rpcError.message)

    const updated = await getCoordenadorById(id)
    if (!updated) throw new Error('Coordenador não encontrado após atualização')
    return updated
  } catch (error) {
    console.error('Erro ao alterar status do coordenador:', error)
    // Fallback: update direto (caso a RPC ainda não exista no ambiente)
    try {
      return await updateCoordenador(id, { ativo })
    } catch {
      if (error instanceof Error) throw error
      throw new Error('Falha ao alterar status do coordenador')
    }
  }
}

async function setCorretorAtivo(id: string, ativo: boolean): Promise<Corretor> {
  try {
    const client = createClient()
    const { error: rpcError } = await client.rpc('admin_set_equipe_ativo', {
      p_tipo: 'corretor',
      p_id: id,
      p_ativo: ativo,
    })
    if (rpcError) throw new Error(rpcError.message)

    const updated = await getCorretorById(id)
    if (!updated) throw new Error('Corretor não encontrado após atualização')
    return updated
  } catch (error) {
    console.error('Erro ao alterar status do corretor:', error)
    try {
      return await updateCorretor(id, { ativo })
    } catch {
      if (error instanceof Error) throw error
      throw new Error('Falha ao alterar status do corretor')
    }
  }
}

/**
 * Corretores sem coordenação válida no cadastro.
 * Inclui quem está com coordenadorId null, coordenador inexistente
 * ou (quando onlyActive) coordenador inativo — para não sumirem da hierarquia.
 */
export async function listOrphanCorretores(onlyActive = true): Promise<Corretor[]> {
  try {
    const [corretores, coordenadores] = await Promise.all([
      listCorretores(onlyActive),
      listCoordenadores(onlyActive),
    ])

    const validCoordIds = new Set(coordenadores.map((coordenador) => coordenador.id))

    return corretores.filter((corretor) => {
      if (!corretor.coordenadorId) return true
      return !validCoordIds.has(corretor.coordenadorId)
    })
  } catch (error) {
    console.error('Erro ao listar corretores sem coordenação:', error)
    throw error
  }
}
