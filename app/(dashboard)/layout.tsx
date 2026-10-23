import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { FiltersProvider } from '@/lib/contexts/FiltersContext'
import { OperacaoProvider } from '@/lib/contexts/OperacaoContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <FiltersProvider>
        <OperacaoProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </OperacaoProvider>
      </FiltersProvider>
    </ProtectedRoute>
  )
}
