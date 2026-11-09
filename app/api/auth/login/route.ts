import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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
