'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { PageHeading } from '@/components/ui/PageHeading'
import { CorrespondenteForm } from '@/components/correspondentes/CorrespondenteForm'
import {
  countLeadsGroupedByCorrespondente,
  createCorrespondente,
  deactivateCorrespondente,
  listCorrespondentes,
  updateCorrespondente,
  type CorrespondenteInput,
} from '@/lib/services/correspondentes'
import type { CorrespondenteBancario } from '@/lib/types'

type ModalMode = 'create' | 'edit' | null

export default function CorrespondentesAdminPage() {
  const [items, setItems] = useState<CorrespondenteBancario[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<CorrespondenteBancario | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setActionError(null)
      const [list, counts] = await Promise.all([
        listCorrespondentes(false),
        countLeadsGroupedByCorrespondente(),
      ])
      setItems(list)
      setLeadCounts(counts)
    } catch (err) {
      console.error(err)
      setActionError(
        err instanceof Error ? err.message : 'Falha ao carregar correspondentes',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR')
    return items.filter((item) => {
      if (!showInactive && !item.ativo) return false
      if (!q) return true
      return (
        item.nome.toLocaleLowerCase('pt-BR').includes(q) ||
        (item.banco?.toLocaleLowerCase('pt-BR').includes(q) ?? false) ||
        (item.contato?.toLocaleLowerCase('pt-BR').includes(q) ?? false)
      )
    })
  }, [items, search, showInactive])

  const openCreate = () => {
    setEditing(null)
    setError(null)
    setModal('create')
  }

  const openEdit = (item: CorrespondenteBancario) => {
    setEditing(item)
    setError(null)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setError(null)
  }

  const handleSubmit = async (values: CorrespondenteInput) => {
    try {
      setSubmitting(true)
      setError(null)
      if (modal === 'edit' && editing) {
        await updateCorrespondente(editing.id, values)
      } else {
        await createCorrespondente(values)
      }
      closeModal()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (item: CorrespondenteBancario) => {
    if (!item.ativo) return
    const ok = window.confirm(
      `Desativar “${item.nome}”? Leads históricos mantêm a referência.`,
    )
    if (!ok) return

    try {
      setActionError(null)
      await deactivateCorrespondente(item.id)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao desativar')
    }
  }

  const handleReactivate = async (item: CorrespondenteBancario) => {
    try {
      setActionError(null)
      await updateCorrespondente(item.id, { ativo: true })
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao reativar')
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="page-section">
        <PageHeading
          title="Correspondentes bancários"
          description="Cadastro usado em leads (FK + nome legado). Soft-delete via status ativo."
          actions={(
            <button type="button" className="btn-primary" onClick={openCreate}>
              Novo correspondente
            </button>
          )}
        />

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, banco ou contato…"
            className="min-h-11 w-full flex-1 px-3.5 py-2.5"
            aria-label="Buscar correspondentes"
          />
          <label className="flex shrink-0 items-center gap-2 text-label-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inativos
          </label>
        </div>

        {actionError && (
          <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="text-on-surface-variant">Carregando correspondentes…</p>
        ) : filtered.length === 0 ? (
          <div className="card">
            <p className="text-body-md text-on-surface-variant">
              Nenhum correspondente encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[640px] text-left text-label-md">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{item.nome}</p>
                      {(item.contato || item.email) && (
                        <p className="mt-0.5 text-label-sm text-on-surface-variant">
                          {[item.contato, item.email].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {item.banco || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-label-sm ${
                          item.ativo
                            ? 'border-tertiary/30 text-tertiary'
                            : 'border-white/10 text-on-surface-variant'
                        }`}
                      >
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary" data-numeric>
                      {leadCounts[item.id] ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="chip"
                          onClick={() => openEdit(item)}
                        >
                          Editar
                        </button>
                        {item.ativo ? (
                          <button
                            type="button"
                            className="chip"
                            onClick={() => handleDeactivate(item)}
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chip"
                            onClick={() => handleReactivate(item)}
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
          <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
            <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-surface-low p-5 sm:rounded-2xl sm:p-6">
              <CorrespondenteForm
                key={editing?.id ?? 'new'}
                initial={editing}
                title={modal === 'edit' ? 'Editar correspondente' : 'Novo correspondente'}
                submitting={submitting}
                error={error}
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
