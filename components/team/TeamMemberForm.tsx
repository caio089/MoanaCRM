'use client'

import { useState } from 'react'
import { TextInput } from '@/components/forms/FormField'
import type { Coordenador, Corretor } from '@/lib/types'
import type { CoordenadorInput, CorretorInput } from '@/lib/services/team'

type CorretorFormProps = {
  initial?: Partial<Corretor> | null
  coordenadores: Coordenador[]
  submitting?: boolean
  error?: string | null
  title?: string
  onSubmit: (values: CorretorInput) => void | Promise<void>
  onCancel: () => void
}

/** Formulário de criar/editar corretor (consultor comercial da equipe). */
export function CorretorForm({
  initial,
  coordenadores,
  submitting = false,
  error,
  title = 'Corretor / consultor',
  onSubmit,
  onCancel,
}: CorretorFormProps) {
  const [values, setValues] = useState<CorretorInput>({
    nome: initial?.nome ?? '',
    email: initial?.email ?? '',
    telefone: initial?.telefone ?? '',
    ativo: initial?.ativo ?? true,
    coordenadorId: initial?.coordenadorId ?? null,
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
      nome,
      email: values.email?.trim() || null,
      telefone: values.telefone?.trim() || null,
      ativo: values.ativo ?? true,
      coordenadorId: values.coordenadorId || null,
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
        placeholder="Ex.: Camila Ferreira"
      />
      <TextInput
        label="E-mail"
        type="email"
        value={values.email || ''}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
        placeholder="opcional"
      />
      <TextInput
        label="Telefone / WhatsApp"
        value={values.telefone || ''}
        onChange={(e) => setValues({ ...values, telefone: e.target.value })}
        placeholder="opcional"
      />

      <label className="block space-y-1.5">
        <span className="text-label-sm text-on-surface-variant">Coordenador</span>
        <select
          className="min-h-11 w-full rounded-xl border border-white/10 bg-surface-high px-3.5 py-2.5 text-on-surface"
          value={values.coordenadorId || ''}
          onChange={(e) =>
            setValues({ ...values, coordenadorId: e.target.value || null })
          }
        >
          <option value="">Sem coordenação</option>
          {coordenadores.map((coordenador) => (
            <option key={coordenador.id} value={coordenador.id}>
              {coordenador.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={values.ativo !== false}
          onChange={(e) => setValues({ ...values, ativo: e.target.checked })}
          className="h-4 w-4"
        />
        Ativo
      </label>

      {error && (
        <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="chip" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

type CoordenadorFormProps = {
  initial?: Partial<Coordenador> | null
  submitting?: boolean
  error?: string | null
  title?: string
  onSubmit: (values: CoordenadorInput) => void | Promise<void>
  onCancel: () => void
}

/** Formulário de criar/editar coordenador. */
export function CoordenadorForm({
  initial,
  submitting = false,
  error,
  title = 'Coordenador',
  onSubmit,
  onCancel,
}: CoordenadorFormProps) {
  const [values, setValues] = useState<CoordenadorInput>({
    nome: initial?.nome ?? '',
    email: initial?.email ?? '',
    telefone: initial?.telefone ?? '',
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
      nome,
      email: values.email?.trim() || null,
      telefone: values.telefone?.trim() || null,
      ativo: values.ativo ?? true,
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
        placeholder="Ex.: André Rocha"
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
      />

      <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={values.ativo !== false}
          onChange={(e) => setValues({ ...values, ativo: e.target.checked })}
          className="h-4 w-4"
        />
        Ativo
      </label>

      {error && (
        <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="chip" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
