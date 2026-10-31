import { useState, useEffect } from 'react'
import { getLeadById, updateLead } from '@/lib/services/leads'
import { validateLead, normalizeLeadData, type ValidationError } from '@/lib/utils/validation'
import type { Lead } from '@/lib/types'

export type EditLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string | null; validationErrors: ValidationError[] }

export function useEditLead(leadId: string, initialLead?: Lead | null) {
  const [lead, setLead] = useState<Lead | null>(initialLead ?? null)
  const [loading, setLoading] = useState(!initialLead)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  useEffect(() => {
    // Na lista e na ficha o lead já está em memória. Usá-lo evita uma requisição
    // extra antes de abrir o formulário; o salvamento continua validado no banco.
    if (initialLead?.id === leadId) {
      setLead(initialLead)
      setLoading(false)
      setError(null)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const data = await getLeadById(leadId)
        setLead(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar lead'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (leadId) void load()
  }, [leadId, initialLead])

  const submit = async (formData: Record<string, unknown>): Promise<EditLeadResult> => {
    setUpdating(true)
    setError(null)
    setValidationErrors([])

    try {
      const normalized = normalizeLeadData(formData)
      const errors = validateLead(normalized, { mode: 'update' })

      if (errors.length > 0) {
        setValidationErrors(errors)
        const message = errors.map((e) => e.message).join(' · ')
        setError(message)
        return { ok: false, error: message, validationErrors: errors }
      }

      const updated = await updateLead(leadId, normalized)
      setLead(updated)
      return { ok: true, lead: updated }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar lead'
      setError(message)
      return { ok: false, error: message, validationErrors: [] }
    } finally {
      setUpdating(false)
    }
  }

  return {
    lead,
    loading,
    updating,
    error,
    validationErrors,
    submit,
  }
}
