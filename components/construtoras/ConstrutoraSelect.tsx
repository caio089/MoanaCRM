'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/components/forms/FormField'
import { listConstrutoraNomes } from '@/lib/services/construtoras'

type ConstrutoraSelectProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
  includeValueIfMissing?: boolean
}

/** Select de construtoras cadastradas (tabela `construtoras` no Supabase). */
export function ConstrutoraSelect({
  value,
  onChange,
  label = 'Construtora',
  required = false,
  error,
  disabled,
  includeValueIfMissing = true,
}: ConstrutoraSelectProps) {
  const [nomes, setNomes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await listConstrutoraNomes(true)
        if (!cancelled) setNomes(list)
      } catch (err) {
        console.error('Erro ao carregar construtoras:', err)
        if (!cancelled) setNomes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const options = [...nomes]
  if (
    includeValueIfMissing &&
    value &&
    !options.some((n) => n.toLowerCase() === value.toLowerCase())
  ) {
    options.unshift(value)
  }

  return (
    <Select
      label={label}
      required={required}
      value={value}
      disabled={disabled || loading}
      error={error}
      onChange={(e) => onChange(e.target.value)}
      options={options.map((nome) => ({ value: nome, label: nome }))}
    />
  )
}
