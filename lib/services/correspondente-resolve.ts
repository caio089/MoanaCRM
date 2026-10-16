import { createAnonClient } from '@/lib/supabase/anon'
import { createClient as createServerClient } from '@/lib/supabase/server'

export type ResolveCorrespondenteResult = {
  correspondente: string | null
  correspondenteId: string | null
}

/**
 * Auto-create só com flag explícita.
 * Default: false. Ativar: CORRESPONDENTE_AUTO_CREATE=true (ou 1).
 */
export function shouldAutoCreateCorrespondente(): boolean {
  const flag = process.env.CORRESPONDENTE_AUTO_CREATE
  if (flag == null || flag === '') return false
  return flag === '1' || flag.toLowerCase() === 'true'
}

function normalizeNome(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

type RpcRow = { id: string; nome: string }

/**
 * Resolve nome legado → FK via RPC SECURITY DEFINER (anon).
 * Create (se habilitado) usa sessão autenticada (admin + RLS).
 */
export async function resolveCorrespondenteByNomeServer(
  rawNome: string | null | undefined,
  options?: {
    createIfMissing?: boolean
    cache?: Map<string, { id: string; nome: string }>
  },
): Promise<ResolveCorrespondenteResult> {
  if (!rawNome) return { correspondente: null, correspondenteId: null }
  const nome = normalizeNome(String(rawNome))
  if (!nome) return { correspondente: null, correspondenteId: null }

  const createIfMissing = options?.createIfMissing ?? shouldAutoCreateCorrespondente()
  const key = nome.toLocaleLowerCase('pt-BR')
  const cache = options?.cache

  const cached = cache?.get(key)
  if (cached) {
    return { correspondente: cached.nome, correspondenteId: cached.id }
  }

  const anon = createAnonClient()
  const { data, error } = await anon.rpc('resolve_correspondente_nome', { p_nome: nome })

  if (error) {
    throw new Error(`Falha ao resolver correspondente: ${error.message}`)
  }

  const rows = (Array.isArray(data) ? data : data ? [data] : []) as RpcRow[]
  const found = rows[0]
  if (found?.id) {
    cache?.set(key, { id: found.id, nome: found.nome })
    return { correspondente: found.nome, correspondenteId: found.id }
  }

  if (!createIfMissing) {
    return { correspondente: nome, correspondenteId: null }
  }

  // Insert exige sessão admin (RLS); falha silenciosamente para string legada se não houver permissão.
  try {
    const supabase = await createServerClient()
    const { data: created, error: createError } = await supabase
      .from('correspondentes_bancarios')
      .insert({ nome, ativo: true })
      .select('id, nome')
      .single()

    if (createError || !created) {
      return { correspondente: nome, correspondenteId: null }
    }

    cache?.set(key, { id: created.id, nome: created.nome })
    return { correspondente: created.nome, correspondenteId: created.id }
  } catch {
    return { correspondente: nome, correspondenteId: null }
  }
}
