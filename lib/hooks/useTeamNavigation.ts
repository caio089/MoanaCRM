'use client'

import { useCallback, useState } from 'react'

export type TeamLevel = 'coordenadores' | 'corretores'

export type TeamNavigationState = {
  level: TeamLevel
  selectedCoordenadorId: string | null
  selectCoordenador: (id: string) => void
  goToCoordenadores: () => void
  reset: () => void
}

/**
 * Navegação em níveis da hierarquia comercial (coordenadores → corretores).
 */
export function useTeamNavigation(
  initialLevel: TeamLevel = 'coordenadores',
): TeamNavigationState {
  const [level, setLevel] = useState<TeamLevel>(initialLevel)
  const [selectedCoordenadorId, setSelectedCoordenadorId] = useState<string | null>(null)

  const selectCoordenador = useCallback((id: string) => {
    setSelectedCoordenadorId(id)
    setLevel('corretores')
  }, [])

  const goToCoordenadores = useCallback(() => {
    setSelectedCoordenadorId(null)
    setLevel('coordenadores')
  }, [])

  const reset = useCallback(() => {
    setSelectedCoordenadorId(null)
    setLevel(initialLevel)
  }, [initialLevel])

  return {
    level,
    selectedCoordenadorId,
    selectCoordenador,
    goToCoordenadores,
    reset,
  }
}
