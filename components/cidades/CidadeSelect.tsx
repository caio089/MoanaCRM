'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/components/forms/FormField'
import { listCidadeNomes } from '@/lib/services/cidades'

type CidadeSelectProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
  /** Se o valor atual não estiver na lista (legado), inclui como opção. */
  includeValueIfMissing?: boolean
}

/** Select de cidades cadastradas (tabela `cidades` no Supabase). */
export function CidadeSelect({
  value,
  onChange,
  label = 'Cidade',
  required = false,
  error,
  disabled,
  includeValueIfMissing = true,
}: CidadeSelectProps) {
  const [nomes, setNomes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await listCidadeNomes(true)
        if (!cancelled) setNomes(list)
      } catch (err) {
        console.error('Erro ao carregar cidades:', err)
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
