/**
 * Provisiona logins da equipe no Auth (cria ou atualiza papel).
 *
 * Uso (com senha temporária compartilhada):
 *   SUPABASE_SERVICE_ROLE_KEY=... TEAM_DEFAULT_PASSWORD='...' npx tsx scripts/provision-team-logins.ts
 *
 * Uso (convite por e-mail — precisa SMTP no projeto):
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/provision-team-logins.ts
 */
import { createClient } from '@supabase/supabase-js'

type TeamRole = 'admin' | 'coordenador' | 'corretor'

type TeamMember = {
  email: string
  name: string
  role: TeamRole
}

/** Preencha com a equipe da Construtora Moana. Não versionar dados pessoais de outras empresas. */
const TEAM: TeamMember[] = [
  // { email: 'admin@moana.local', name: 'Administração', role: 'admin' },
]

async function listAllUsers(
  admin: ReturnType<typeof createClient>,
): Promise<Array<{ id: string; email?: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown> }>> {
  const users: Array<{
    id: string
    email?: string
    app_metadata: Record<string, unknown>
    user_metadata: Record<string, unknown>
  }> = []
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const batch = data?.users || []
    users.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email,
        app_metadata: (u.app_metadata || {}) as Record<string, unknown>,
        user_metadata: (u.user_metadata || {}) as Record<string, unknown>,
      })),
    )
    if (batch.length < 200) break
    page += 1
  }
  return users
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const defaultPassword = process.env.TEAM_DEFAULT_PASSWORD

  if (!url || !serviceKey) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (TEAM.length === 0) {
    console.error('Preencha o array TEAM em scripts/provision-team-logins.ts com a equipe da Construtora Moana.')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let ok = 0
  let fail = 0

  for (const member of TEAM) {
    const email = member.email.toLowerCase()
    try {
      const listed = await listAllUsers(admin)
      const existing = listed.find((u) => u.email?.toLowerCase() === email)

      if (existing) {
        const { error } = await admin.auth.admin.updateUserById(existing.id, {
          app_metadata: { ...existing.app_metadata, role: member.role },
          user_metadata: {
            ...existing.user_metadata,
            name: member.name,
            role: member.role,
          },
        })
        if (error) throw error
        console.log(`✓ atualizado ${email} → ${member.role}`)
      } else if (defaultPassword) {
        const { error } = await admin.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
          app_metadata: { role: member.role },
          user_metadata: { name: member.name, role: member.role },
        })
        if (error) throw error
        console.log(`✓ criado ${email} → ${member.role}`)
      } else {
        const { error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { name: member.name, role: member.role },
        })
        if (error) throw error

        const again = await listAllUsers(admin)
        const invited = again.find((u) => u.email?.toLowerCase() === email)
        if (invited) {
          await admin.auth.admin.updateUserById(invited.id, {
            app_metadata: { ...invited.app_metadata, role: member.role },
            user_metadata: { name: member.name, role: member.role },
          })
        }
        console.log(`✓ convite ${email} → ${member.role}`)
      }
      ok += 1
    } catch (err) {
      fail += 1
      console.error(`✗ ${email}:`, err instanceof Error ? err.message : err)
    }
  }

  // Religa user_id nas tabelas da equipe pelo e-mail
  const users = await listAllUsers(admin)
  for (const u of users) {
    if (!u.email) continue
    const role = String(u.app_metadata?.role || '')
    if (role === 'coordenador' || role === 'supervisor') {
      const { error } = await admin
        .from('coordenadores')
        .update({ user_id: u.id })
        .ilike('email', u.email)
      if (error) console.warn(`link coord ${u.email}:`, error.message)
    } else if (role === 'corretor' || role === 'user') {
      const { error } = await admin
        .from('corretores')
        .update({ user_id: u.id })
        .ilike('email', u.email)
      if (error) console.warn(`link corretor ${u.email}:`, error.message)
    }
  }

  console.log(`\nConcluído: ${ok} ok, ${fail} falhas`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
