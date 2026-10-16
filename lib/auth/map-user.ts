import type { User } from '@supabase/supabase-js'
import type { AuthUser, UserRole } from '@/lib/auth/types'

const VALID_ROLES = new Set<UserRole>(['admin', 'coordenador', 'corretor'])

/** Aliases legados → papel canônico. */
const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'admin',
  coordenador: 'coordenador',
  supervisor: 'coordenador',
  corretor: 'corretor',
  user: 'corretor',
  consultor: 'corretor',
}

function resolveRole(user: User): UserRole {
  const fromApp = user.app_metadata?.role
  const fromUser = user.user_metadata?.role
  const raw = (typeof fromApp === 'string' ? fromApp : typeof fromUser === 'string' ? fromUser : 'corretor')
    .toLowerCase()
    .trim()

  if (VALID_ROLES.has(raw as UserRole)) return raw as UserRole
  return ROLE_ALIASES[raw] ?? 'corretor'
}

/** Converte User do Auth para AuthUser do app. */
export function mapAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user?.id || !user.email) return null

  const role = resolveRole(user)
  const name =
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    user.email

  return {
    id: user.id,
    email: user.email,
    app_metadata: { role },
    user_metadata: { name, role },
  }
}

export function getUserRole(user: AuthUser | null | undefined): UserRole {
  return user?.app_metadata?.role ?? user?.user_metadata?.role ?? 'corretor'
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin'
}

export function isCoordenadorRole(role: UserRole | null | undefined): boolean {
  return role === 'coordenador'
}

export function isCorretorRole(role: UserRole | null | undefined): boolean {
  return role === 'corretor'
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'coordenador':
      return 'Coordenador'
    case 'corretor':
      return 'Corretor'
    default:
      return 'Usuário'
  }
}
