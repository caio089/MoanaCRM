'use client'

import { useEffect, useState } from 'react'
import {
  getUserRole,
  isAdminRole,
  isCoordenadorRole,
  isCorretorRole,
} from '@/lib/auth/map-user'
import type { UserRole } from '@/lib/auth/types'
import { useAuth } from './useAuth'

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCoordenador, setIsCoordenador] = useState(false)
  const [isCorretor, setIsCorretor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>('corretor')

  useEffect(() => {
    if (authLoading) return

    const nextRole = getUserRole(user)
    setRole(nextRole)
    setIsAdmin(isAdminRole(nextRole))
    setIsCoordenador(isCoordenadorRole(nextRole))
    setIsCorretor(isCorretorRole(nextRole))
    setLoading(false)
  }, [user, authLoading])

  return {
    isAdmin,
    isCoordenador,
    isCorretor,
    role,
    loading,
  }
}
