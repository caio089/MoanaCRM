import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { FiltersProvider } from '@/lib/contexts/FiltersContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <FiltersProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </FiltersProvider>
    </ProtectedRoute>
  )
}
