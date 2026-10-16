'use client'

import { useEffect, useMemo, useState } from 'react'
import { Select } from '@/components/forms/FormField'
import {
  getCorrespondenteById,
  listCorrespondentes,
} from '@/lib/services/correspondentes'
import type { CorrespondenteBancario } from '@/lib/types'

interface CorrespondenteSelectProps {
  /** ID do correspondente selecionado (FK). */
  value?: string | null
  /**
   * Chamado com o id e o nome canônico (para sincronizar string legada).
   * `null` quando o usuário limpa a seleção.
   */
  onChange: (correspondenteId: string | null, nome: string | null) => void
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
  /**
   * Inclui este id mesmo se inativo (lead histórico),
   * para o select não ficar vazio ao editar.
   */
  includeInactiveId?: string | null
}

/** Ex.: "Alpha - Paula"; marca inativos para leads históricos. */
function formatCorrespondenteLabel(item: CorrespondenteBancario): string {
  const base = item.contato ? `${item.nome} - ${item.contato}` : item.nome
  return item.ativo ? base : `${base} (inativo)`
}

/** Select de correspondentes ativos para formulários de lead. */
export function CorrespondenteSelect({
  value,
  onChange,
  label = 'Correspondente',
  error,
  required = false,
  disabled = false,
  includeInactiveId,
}: CorrespondenteSelectProps) {
  const [options, setOptions] = useState<CorrespondenteBancario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const ativos = await listCorrespondentes(true)
        if (cancelled) return

        let list = ativos
        const selectedId = value || includeInactiveId
        const jaIncluido = selectedId
          ? ativos.some((item) => item.id === selectedId)
          : true

        // Lead histórico com correspondente inativo: mantém opção só para exibir/editar
        if (selectedId && !jaIncluido) {
          const extra = await getCorrespondenteById(selectedId)
          if (extra && !cancelled) {
            list = [...ativos, extra].sort((a, b) =>
              a.nome.localeCompare(b.nome, 'pt-BR'),
            )
          }
        }

        if (!cancelled) setOptions(list)
      } catch (err) {
        console.error('Erro ao carregar correspondentes:', err)
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [value, includeInactiveId])

  const selectOptions = useMemo(
    () =>
      options.map((item) => ({
        value: item.id,
        label: formatCorrespondenteLabel(item),
      })),
    [options],
  )

  return (
    <Select
      label={label}
      required={required}
      error={error}
      disabled={disabled || loading}
      value={value || ''}
      options={selectOptions}
      onChange={(event) => {
        const id = event.target.value || null
        if (!id) {
          onChange(null, null)
          return
        }
        const found = options.find((item) => item.id === id)
        onChange(id, found?.nome ?? null)
      }}
    />
  )
}
