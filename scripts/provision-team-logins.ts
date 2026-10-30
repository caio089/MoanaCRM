/**
 * Provisiona logins da equipe no Auth (cria ou atualiza papel).
 *
 * Uso (com senha temporária compartilhada):
 *   SUPABASE_SERVICE_ROLE_KEY=... TEAM_DEFAULT_PASSWORD='...' npx tsx scripts/provision-team-logins.ts
 *
 * Uso (convite por e-mail — precisa SMTP no projeto):
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/provision-team-logins.ts
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

type TeamRole = 'admin' | 'coordenador' | 'corretor'

type TeamMember = {
  email: string
  name: string
  role: TeamRole
}

/** Carrega variáveis do .env.local caso não estejam no process.env */
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const idx = trimmed.indexOf('=')
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim()
        let val = trimmed.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    })
  }
}

/** Equipe da Construtora Moana */
const TEAM: TeamMember[] = [
  { email: 'andrecampelomatos@gmail.com', name: 'André Matos', role: 'admin' },
  { email: 'rodrigocostathe@gmail.com', name: 'Rodrigo Sampaio', role: 'admin' },
  { email: 'daniellymendes166@gmail.com', name: 'Danielly Mendes', role: 'corretor' },
  { email: 'vincistrategy@gmail.com', name: 'Vinci', role: 'corretor' },
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
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const defaultPassword = process.env.TEAM_DEFAULT_PASSWORD || 'Moana@2026!'

  if (!url || !serviceKey) {
    console.error('ERRO: Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env.local')
    process.exit(1)
  }

  if (TEAM.length === 0) {
    console.error('Preencha o array TEAM em scripts/provision-team-logins.ts com a equipe.')
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
          password: defaultPassword,
          app_metadata: { ...existing.app_metadata, role: member.role },
          user_metadata: {
            ...existing.user_metadata,
            name: member.name,
            role: member.role,
          },
        })
        if (error) throw error
        console.log(`✓ atualizado ${email} → ${member.role} (senha definida para ${defaultPassword})`)
      } else {
        const { error } = await admin.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
          app_metadata: { role: member.role },
          user_metadata: { name: member.name, role: member.role },
        })
        if (error) throw error
        console.log(`✓ criado ${email} → ${member.role} (senha: ${defaultPassword})`)
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

    // Atualiza corretores se existir cadastro com esse e-mail
    const { error: errCorretor } = await admin
      .from('corretores')
      .update({ user_id: u.id })
      .ilike('email', u.email)
    if (errCorretor) console.warn(`link corretor ${u.email}:`, errCorretor.message)

    // Atualiza coordenadores se existir cadastro com esse e-mail
    const { error: errCoord } = await admin
      .from('coordenadores')
      .update({ user_id: u.id })
      .ilike('email', u.email)
    if (errCoord) console.warn(`link coord ${u.email}:`, errCoord.message)
  }

  console.log(`\nConcluído com sucesso: ${ok} processados, ${fail} falhas`)
  console.log(`Senha padrão aplicada: ${defaultPassword}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
