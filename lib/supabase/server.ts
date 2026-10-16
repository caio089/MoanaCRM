import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'

/**
 * Client server com cookies do Next.js.
 * Usar em Server Components, Route Handlers e Server Actions.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll pode falhar em Server Components (somente leitura).
        }
      },
    },
  })
}
