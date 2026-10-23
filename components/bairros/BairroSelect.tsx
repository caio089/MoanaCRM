'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/components/forms/FormField'
import { findCidadeIdByNome } from '@/lib/services/cidades'
import { listBairros } from '@/lib/services/bairros'
import type { Bairro } from '@/lib/types'

type BairroSelectProps = {
  cidadeNome: string
  value: string
  bairroId?: string
  onChange: (bairro: string, bairroId: string) => void
  disabled?: boolean
}

export function BairroSelect({
  cidadeNome,
  value,
  bairroId,
  onChange,
  disabled,
}: BairroSelectProps) {
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cidadeNome.trim()) {
        setBairros([])
        return
      }
      try {
        setLoading(true)
        const cidadeId = await findCidadeIdByNome(cidadeNome)
        const list = cidadeId ? await listBairros(cidadeId, true) : []
        if (!cancelled) setBairros(list)
      } catch (error) {
        console.error('Erro ao carregar bairros:', error)
        if (!cancelled) setBairros([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cidadeNome])

  const options = bairros.map((bairro) => ({ value: bairro.id, label: bairro.nome }))
  if (value && !options.some((item) => item.label === value || item.value === bairroId)) {
    options.unshift({ value: bairroId || value, label: value })
  }

  return (
    <Select
      label="Bairro"
      value={bairroId || ''}
      disabled={disabled || loading || !cidadeNome}
      onChange={(event) => {
        const id = event.target.value
        const match = bairros.find((bairro) => bairro.id === id)
        onChange(match?.nome ?? value, id)
      }}
      options={options}
    />
  )
}
