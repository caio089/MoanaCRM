'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { PageHeading } from '@/components/ui/PageHeading'
import { CorretorForm } from '@/components/team/TeamMemberForm'
import {
  activateCorretor,
  createCorretor,
  deactivateCorretor,
  listCoordenadores,
  listCorretores,
  updateCorretor,
  type CorretorInput,
} from '@/lib/services/team'
import type { Coordenador, Corretor } from '@/lib/types'

type ModalMode = 'create' | 'edit' | null

export default function CorretoresAdminPage() {
  const [items, setItems] = useState<Corretor[]>([])
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<Corretor | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setActionError(null)
      const [corretores, coords] = await Promise.all([
        listCorretores(false),
        listCoordenadores(false),
      ])
      setItems(corretores)
      setCoordenadores(coords)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const coordName = useMemo(() => {
    const map = new Map(coordenadores.map((c) => [c.id, c.nome]))
    return (id: string | null) => (id ? map.get(id) || 'Coordenação inativa/removida' : 'Sem coordenação')
  }, [coordenadores])

  const coordenadoresParaForm = useMemo(
    () =>
      coordenadores.filter(
        (c) => c.ativo || (editing?.coordenadorId != null && c.id === editing.coordenadorId),
      ),
    [coordenadores, editing],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!showInactive && !item.ativo) return false
      if (!q) return true
      return (
        item.nome.toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.telefone || '').includes(q) ||
        coordName(item.coordenadorId).toLowerCase().includes(q)
      )
    })
  }, [items, search, showInactive, coordName])

  const toggleAtivo = async (item: Corretor) => {
    const next = !item.ativo
    const label = next ? 'ativar' : 'desativar'
    if (!window.confirm(`Deseja ${label} “${item.nome}”?`)) return
    try {
      setTogglingId(item.id)
      setActionError(null)
      if (next) await activateCorretor(item.id)
      else await deactivateCorretor(item.id)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Falha ao ${label}`)
    } finally {
      setTogglingId(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setError(null)
    setModal('create')
  }

  const openEdit = (item: Corretor) => {
    setEditing(item)
    setError(null)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setError(null)
  }

  const handleSubmit = async (values: CorretorInput) => {
    try {
      setSubmitting(true)
      setError(null)
      if (modal === 'edit' && editing) {
        await updateCorretor(editing.id, values)
      } else {
        await createCorretor(values)
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
          title="Corretores / consultores"
          description="Cadastro da equipe comercial. Só administrador pode criar ou editar."
          actions={(
            <div className="flex flex-wrap gap-2">
              <Link href="/equipe" className="chip">Ver hierarquia</Link>
              <button type="button" className="btn-primary" onClick={openCreate}>
                Novo corretor
              </button>
            </div>
          )}
        />

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou coordenador…"
            className="min-h-11 w-full flex-1 px-3.5 py-2.5"
            aria-label="Buscar corretores"
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
          <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{actionError}</p>
        )}

        {loading ? (
          <p className="text-on-surface-variant">Carregando corretores…</p>
        ) : filtered.length === 0 ? (
          <div className="card">
            <p className="text-body-md text-on-surface-variant">Nenhum corretor encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[640px] text-left text-label-md">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Coordenador</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{item.nome}</p>
                      <p className="mt-0.5 text-label-sm text-on-surface-variant">
                        {[item.telefone, item.email].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {coordName(item.coordenadorId)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={item.ativo ? 'text-primary' : 'text-on-surface-variant'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className="chip" onClick={() => openEdit(item)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className={item.ativo ? 'chip text-error' : 'chip text-primary'}
                          disabled={togglingId === item.id}
                          onClick={() => toggleAtivo(item)}
                        >
                          {togglingId === item.id
                            ? 'Salvando…'
                            : item.ativo
                              ? 'Desativar'
                              : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className="card w-full max-w-lg">
              <CorretorForm
                initial={editing}
                coordenadores={coordenadoresParaForm}
                submitting={submitting}
                error={error}
                title={modal === 'edit' ? 'Editar corretor' : 'Novo corretor / consultor'}
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
