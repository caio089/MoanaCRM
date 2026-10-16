import { createClient } from '@/lib/supabase/server'
import { mapAuthUser } from '@/lib/auth/map-user'
import type { AuthUser } from '@/lib/auth/types'

/**
 * Usuário autenticado na request atual (sessão Supabase via cookies).
 * Substitui o cookie HMAC legado.
 */
export async function getRequestUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return mapAuthUser(user)
  } catch {
    return null
  }
}
