import { useState } from 'react'
import { createLead } from '@/lib/services/leads'
import { validateLead, normalizeLeadData, type ValidationError } from '@/lib/utils/validation'
import type { Lead } from '@/lib/types'

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string | null; validationErrors: ValidationError[] }

export function useCreateLead() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const submit = async (formData: Record<string, unknown>): Promise<CreateLeadResult> => {
    setLoading(true)
    setError(null)
    setValidationErrors([])

    try {
      const normalized = normalizeLeadData(formData)
      const errors = validateLead(normalized)

      if (errors.length > 0) {
        setValidationErrors(errors)
        const message = errors.map((e) => e.message).join(' · ')
        setError(message)
        return { ok: false, error: message, validationErrors: errors }
      }

      const lead = await createLead(normalized)
      return { ok: true, lead }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar lead'
      setError(message)
      return { ok: false, error: message, validationErrors: [] }
    } finally {
      setLoading(false)
    }
  }

  return {
    submit,
    loading,
    error,
    validationErrors,
  }
}
