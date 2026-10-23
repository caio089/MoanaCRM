import { useMemo } from 'react'
import { useFilters } from '@/lib/contexts/FiltersContext'
import { useOperacao } from '@/lib/contexts/OperacaoContext'
import type { Lead } from '@/lib/types'

export function useFilteredLeads(leads: Lead[]) {
  const { filters } = useFilters()
  const { tipoOperacao } = useOperacao()

  return useMemo(() => {
    return leads.filter(lead => {
      if ((lead.tipoOperacao ?? 'venda') !== tipoOperacao) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          lead.nome.toLowerCase().includes(searchLower) ||
          (lead.cpf?.includes(filters.search) || false) ||
          (lead.telefone?.includes(filters.search) || false)
        if (!matchesSearch) return false
      }

      if (filters.etapa && lead.etapa !== filters.etapa) {
        return false
      }

      if (filters.corretor && lead.corretor !== filters.corretor) {
        return false
      }

      if (filters.cidade && lead.cidade !== filters.cidade) {
        return false
      }

      return true
    })
  }, [leads, filters, tipoOperacao])
}
