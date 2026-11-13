import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '').trim() || process.env.TEAM_DEFAULT_PASSWORD || 'Moana@2026!'
    const nome = String(body?.nome ?? '').trim()
    const role = String(body?.role ?? 'corretor').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'Service role não configurada no servidor' },
        { status: 503 },
      )
    }

    // Busca usuário existente pelo e-mail
    let page = 1
    let existingUser: { id: string } | null = null

    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
      if (error) throw error
      const batch = data?.users || []
      const found = batch.find((u) => u.email?.toLowerCase() === email)
      if (found) {
        existingUser = { id: found.id }
        break
      }
      if (batch.length < 100) break
      page += 1
    }

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: { name: nome || email, role },
      })
      if (updateError) throw updateError
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: { name: nome || email, role },
      })
      if (createError) throw createError
      userId = newUser.user.id
    }

    // Vincula na tabela correspondente da equipe
    if (role === 'coordenador') {
      await admin
        .from('coordenadores')
        .update({ user_id: userId, ativo: true })
        .ilike('email', email)
    } else {
      const { data: corretor } = await admin
        .from('corretores')
        .select('id')
        .ilike('email', email)
        .limit(1)

      if (corretor && corretor.length > 0) {
        await admin
          .from('corretores')
          .update({ user_id: userId, ativo: true })
          .ilike('email', email)
      } else {
        await admin
          .from('corretores')
          .insert({
            nome: nome || email.split('@')[0],
            email,
            user_id: userId,
            ativo: true,
          })
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar usuário'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
