import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email ?? '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'Service role não configurada no servidor' },
        { status: 503 },
      )
    }

    // Busca usuário pelo e-mail
    let page = 1
    let targetUser: { id: string; email_confirmed_at?: string | null } | null = null

    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
      if (error) throw error
      const batch = data?.users || []
      const found = batch.find((u) => u.email?.toLowerCase() === email)
      if (found) {
        targetUser = { id: found.id, email_confirmed_at: found.email_confirmed_at }
        break
      }
      if (batch.length < 100) break
      page += 1
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (!targetUser.email_confirmed_at) {
      const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
        email_confirm: true,
      })
      if (updateError) throw updateError
    }

    // Garante vínculo na tabela corretores caso exista registro com esse e-mail
    await admin
      .from('corretores')
      .update({ user_id: targetUser.id })
      .ilike('email', email)

    return NextResponse.json({ success: true, confirmed: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar e-mail'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
