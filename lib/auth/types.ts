/** Papéis comerciais do CRM Construtora Moana. */
export type UserRole = 'admin' | 'coordenador' | 'corretor'

export type AuthUser = {
  id: string
  email: string
  /** Preferir role aqui (definido no Auth Admin; não editável pelo usuário). */
  app_metadata?: {
    role?: UserRole
  }
  user_metadata: {
    name: string
    role: UserRole
  }
}
