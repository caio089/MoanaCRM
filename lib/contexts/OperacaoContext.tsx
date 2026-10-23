'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isTipoOperacao, type TipoOperacao } from '@/lib/constants/operacao'

const STORAGE_KEY = 'moanacrm-operacao-v1'

type OperacaoContextValue = {
  tipoOperacao: TipoOperacao
  setTipoOperacao: (value: TipoOperacao) => void
}

const OperacaoContext = createContext<OperacaoContextValue | undefined>(undefined)

export function OperacaoProvider({ children }: { children: ReactNode }) {
  const [tipoOperacao, setTipoOperacaoState] = useState<TipoOperacao>('venda')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isTipoOperacao(stored)) setTipoOperacaoState(stored)
    } catch {
      // storage indisponível
    }
  }, [])

  const setTipoOperacao = (value: TipoOperacao) => {
    setTipoOperacaoState(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // storage indisponível
    }
  }

  return (
    <OperacaoContext.Provider value={{ tipoOperacao, setTipoOperacao }}>
      {children}
    </OperacaoContext.Provider>
  )
}

export function useOperacao() {
  const context = useContext(OperacaoContext)
  if (!context) {
    throw new Error('useOperacao deve ser usado dentro de OperacaoProvider')
  }
  return context
}
