'use client'

import { useState } from 'react'
import { TextInput } from '@/components/forms/FormField'
import type { CorrespondenteBancario } from '@/lib/types'
import type { CorrespondenteInput } from '@/lib/services/correspondentes'

export type CorrespondenteFormValues = CorrespondenteInput

interface CorrespondenteFormProps {
  initial?: Partial<CorrespondenteBancario> | null
  submitting?: boolean
  error?: string | null
  onSubmit: (values: CorrespondenteFormValues) => void | Promise<void>
  onCancel: () => void
  /** Título do formulário (criar vs editar). */
  title?: string
}

const EMPTY: CorrespondenteFormValues = {
  nome: '',
  banco: '',
  contato: '',
  email: '',
  telefone: '',
  ativo: true,
}

/** Formulário de criar/editar correspondente bancário. */
export function CorrespondenteForm({
  initial,
  submitting = false,
  error,
  onSubmit,
  onCancel,
  title = 'Correspondente bancário',
}: CorrespondenteFormProps) {
  const [values, setValues] = useState<CorrespondenteFormValues>({
    nome: initial?.nome ?? EMPTY.nome,
    banco: initial?.banco ?? EMPTY.banco,
    contato: initial?.contato ?? EMPTY.contato,
    email: initial?.email ?? EMPTY.email,
    telefone: initial?.telefone ?? EMPTY.telefone,
    ativo: initial?.ativo ?? true,
  })
  const [fieldError, setFieldError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nome = values.nome?.trim()
    if (!nome) {
      setFieldError('Nome é obrigatório')
      return
    }
    setFieldError(null)
    await onSubmit({
      ...values,
      nome,
      banco: values.banco?.trim() || null,
      contato: values.contato?.trim() || null,
      email: values.email?.trim() || null,
      telefone: values.telefone?.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-headline-sm text-on-surface">{title}</h3>

      <TextInput
        label="Nome"
        required
        value={values.nome || ''}
        onChange={(e) => setValues({ ...values, nome: e.target.value })}
        error={fieldError || undefined}
        placeholder="Nome do correspondente"
      />
      <TextInput
        label="Banco"
        value={values.banco || ''}
        onChange={(e) => setValues({ ...values, banco: e.target.value })}
        placeholder="Instituição / bandeira"
      />
      <TextInput
        label="Contato"
        value={values.contato || ''}
        onChange={(e) => setValues({ ...values, contato: e.target.value })}
        placeholder="Nome do contato"
      />
      <TextInput
        label="E-mail"
        type="email"
        value={values.email || ''}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
      />
      <TextInput
        label="Telefone"
        value={values.telefone || ''}
        onChange={(e) => setValues({ ...values, telefone: e.target.value })}
        placeholder="(00) 00000-0000"
      />

      <label className="flex items-center gap-2 text-label-md text-on-surface">
        <input
          type="checkbox"
          checked={Boolean(values.ativo)}
          onChange={(e) => setValues({ ...values, ativo: e.target.checked })}
          className="h-4 w-4"
        />
        Ativo
      </label>

      {error && (
        <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1" disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
