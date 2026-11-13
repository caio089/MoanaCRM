import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapAuthUser } from '@/lib/auth/map-user'

/**
 * Proxy opcional — preferir `supabase.auth.signInWithPassword` no client.
 * Mantido para compatibilidade com chamadas legadas a /api/auth/login.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    const supabase = await createClient()
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error && error.message.toLowerCase().includes('email not confirmed')) {
      const admin = createAdminClient()
      if (admin) {
        const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
        const target = users?.users?.find((u) => u.email?.toLowerCase() === email)
        if (target) {
          await admin.auth.admin.updateUserById(target.id, { email_confirm: true })
          const retry = await supabase.auth.signInWithPassword({ email, password })
          data = retry.data
          error = retry.error
        }
      }
    }

    if (error || !data.user) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    const user = mapAuthUser(data.user)
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autenticar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
