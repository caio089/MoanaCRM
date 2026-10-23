'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { PageHeading } from '@/components/ui/PageHeading'
import { Select, TextInput } from '@/components/forms/FormField'
import { ORIGENS_CATALOGO } from '@/lib/constants/operacao'
import {
  createConstrutora,
  deactivateConstrutora,
  listConstrutoras,
  updateConstrutora,
  type ConstrutoraInput,
} from '@/lib/services/construtoras'
import type { Construtora } from '@/lib/types'

type ModalMode = 'create' | 'edit' | null

function ConstrutoraForm({
  initial,
  submitting,
  error,
  title,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Construtora> | null
  submitting?: boolean
  error?: string | null
  title: string
  onSubmit: (values: ConstrutoraInput) => void | Promise<void>
  onCancel: () => void
}) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [cidade, setCidade] = useState(initial?.cidade ?? '')
  const [origemCatalogo, setOrigemCatalogo] = useState(initial?.origemCatalogo ?? 'parceira')
  const [ativo, setAtivo] = useState(initial?.ativo ?? true)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!nome.trim()) {
      setFieldError('Nome é obrigatório')
      return
    }
    setFieldError(null)
    await onSubmit({
      nome: nome.trim(),
      cidade: cidade.trim() || null,
      ativo,
      origemCatalogo: origemCatalogo === 'proprio' ? 'proprio' : 'parceira',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-headline-sm text-on-surface">{title}</h3>
      <TextInput
        label="Construtora"
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={fieldError || undefined}
        placeholder="Ex.: Rivello"
      />
      <TextInput
        label="Cidade (opcional)"
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        placeholder="Ex.: Teresina"
      />
      <Select
        label="Origem do catálogo"
        value={origemCatalogo}
        onChange={(e) => setOrigemCatalogo(e.target.value as 'parceira' | 'proprio')}
        options={ORIGENS_CATALOGO}
      />
      <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4"
        />
        Ativa
      </label>
      {error && (
        <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
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

export default function ConstrutorasAdminPage() {
  const [items, setItems] = useState<Construtora[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<Construtora | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setActionError(null)
      setItems(await listConstrutoras(false))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!showInactive && !item.ativo) return false
      if (!q) return true
      return (
        item.nome.toLowerCase().includes(q) ||
        (item.cidade || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, showInactive])

  const openCreate = () => {
    setEditing(null)
    setError(null)
    setModal('create')
  }

  const openEdit = (item: Construtora) => {
    setEditing(item)
    setError(null)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setError(null)
  }

  const handleSubmit = async (values: ConstrutoraInput) => {
    try {
      setSubmitting(true)
      setError(null)
      if (modal === 'edit' && editing) {
        await updateConstrutora(editing.id, values)
      } else {
        await createConstrutora(values)
      }
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="page-section">
        <PageHeading
          title="Construtoras"
          description="Cadastre as construtoras usadas nos leads e em Visitas. Só admin pode editar."
          actions={(
            <button type="button" className="btn-primary" onClick={openCreate}>
              Nova construtora
            </button>
          )}
        />

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar construtora ou cidade…"
            className="min-h-11 w-full flex-1 px-3.5 py-2.5"
            aria-label="Buscar construtoras"
          />
          <label className="flex shrink-0 items-center gap-2 text-label-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inativas
          </label>
        </div>

        {actionError && (
          <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{actionError}</p>
        )}

        {loading ? (
          <p className="text-on-surface-variant">Carregando construtoras…</p>
        ) : filtered.length === 0 ? (
          <div className="card">
            <p className="text-body-md text-on-surface-variant">Nenhuma construtora cadastrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[480px] text-left text-label-md">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Construtora</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Cidade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-on-surface">{item.nome}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {item.origemCatalogo === 'proprio' ? 'Produto próprio' : 'Parceira'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.cidade || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={item.ativo ? 'text-primary' : 'text-on-surface-variant'}>
                        {item.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className="chip" onClick={() => openEdit(item)}>
                          Editar
                        </button>
                        {item.ativo ? (
                          <button
                            type="button"
                            className="chip text-error"
                            onClick={async () => {
                              if (!window.confirm(`Desativar “${item.nome}”?`)) return
                              try {
                                await deactivateConstrutora(item.id)
                                await load()
                              } catch (err) {
                                setActionError(err instanceof Error ? err.message : 'Falha')
                              }
                            }}
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chip"
                            onClick={async () => {
                              try {
                                await updateConstrutora(item.id, { ativo: true })
                                await load()
                              } catch (err) {
                                setActionError(err instanceof Error ? err.message : 'Falha')
                              }
                            }}
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
            <div className="card w-full max-w-md p-6">
              <ConstrutoraForm
                initial={editing}
                submitting={submitting}
                error={error}
                title={modal === 'edit' ? 'Editar construtora' : 'Nova construtora'}
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedAdminRoute>
  )
}
