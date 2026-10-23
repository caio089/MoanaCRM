'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/components/forms/FormField'
import { listConstrutoras } from '@/lib/services/construtoras'
import type { Construtora } from '@/lib/types'

type ConstrutoraSelectProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
  includeValueIfMissing?: boolean
}

/** Select de construtoras / produtos próprios cadastrados. */
export function ConstrutoraSelect({
  value,
  onChange,
  label = 'Construtora / produto',
  required = false,
  error,
  disabled,
  includeValueIfMissing = true,
}: ConstrutoraSelectProps) {
  const [items, setItems] = useState<Construtora[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await listConstrutoras(true)
        if (!cancelled) setItems(list)
      } catch (err) {
        console.error('Erro ao carregar construtoras:', err)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const options = items.map((item) => ({
    value: item.nome,
    label: `${item.origemCatalogo === 'proprio' ? 'Próprio' : 'Parceira'} · ${item.nome}`,
  }))

  if (
    includeValueIfMissing &&
    value &&
    !options.some((item) => item.value.toLowerCase() === value.toLowerCase())
  ) {
    options.unshift({ value, label: value })
  }

  return (
    <Select
      label={label}
      required={required}
      value={value}
      disabled={disabled || loading}
      error={error}
      onChange={(e) => onChange(e.target.value)}
      options={options}
    />
  )
}
