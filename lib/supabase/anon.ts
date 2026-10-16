import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/supabase/env'

/**
 * Client anon sem cookies — webhooks / RPCs SECURITY DEFINER.
 * Não carrega sessão do usuário.
 */
export function createAnonClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
