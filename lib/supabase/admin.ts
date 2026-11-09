import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com privilégios de Service Role (apenas server-side).
 * Retorna null se SUPABASE_SERVICE_ROLE_KEY não estiver definida no ambiente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceKey) {
    return null
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
