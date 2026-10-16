'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCheck } from '@/lib/hooks/useAdminCheck'

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAdmin, loading } = useAdminCheck()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/visao')
    }
  }, [isAdmin, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-on-surface">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
