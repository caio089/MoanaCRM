'use client'

import { useState } from 'react'
import { useAdminCheck } from '@/lib/hooks/useAdminCheck'
import { useToast } from '@/lib/contexts/ToastContext'
import { downloadWorkbook } from '@/lib/export/excel-workbook'
import { buildCrmExportSheets } from '@/lib/export/crm-export'

function exportFileName(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `vida-e-lar-crm-${today}.xlsx`
}

export function ExportExcelButton({ className = 'btn-ghost' }: { className?: string }) {
  const { isAdmin, loading: roleLoading } = useAdminCheck()
  const { addToast } = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      const sheets = await buildCrmExportSheets(isAdmin)
      await downloadWorkbook(exportFileName(), sheets)
      const totalLeads = sheets[0]?.rows.length ?? 0
      addToast(`Excel exportado (${totalLeads} leads${isAdmin ? ' + cadastros' : ''})`, 'success')
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      addToast(error instanceof Error ? error.message : 'Erro ao exportar Excel', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      disabled={exporting || roleLoading}
      className={`${className} disabled:opacity-40`}
    >
      {exporting ? 'Gerando Excel…' : 'Exportar Excel'}
    </button>
  )
}
