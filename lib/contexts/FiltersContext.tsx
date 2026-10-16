'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Filters {
  search: string
  corretor: string
  cidade: string
  etapa: string
}

interface FiltersContextType {
  filters: Filters
  setSearch: (value: string) => void
  setCorretor: (value: string) => void
  setCidade: (value: string) => void
  setEtapa: (value: string) => void
  clearFilters: () => void
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    corretor: '',
    cidade: '',
    etapa: '',
  })

  const setSearch = (value: string) =>
    setFilters(prev => ({ ...prev, search: value }))

  const setCorretor = (value: string) =>
    setFilters(prev => ({ ...prev, corretor: value }))

  const setCidade = (value: string) =>
    setFilters(prev => ({ ...prev, cidade: value }))

  const setEtapa = (value: string) =>
    setFilters(prev => ({ ...prev, etapa: value }))

  const clearFilters = () =>
    setFilters({ search: '', corretor: '', cidade: '', etapa: '' })

  return (
    <FiltersContext.Provider
      value={{ filters, setSearch, setCorretor, setCidade, setEtapa, clearFilters }}
    >
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider')
  }
  return context
}
