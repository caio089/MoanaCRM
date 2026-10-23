'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { PageHeading } from '@/components/ui/PageHeading'
import { Select, TextInput } from '@/components/forms/FormField'
import {
  createBairro,
  deactivateBairro,
  listBairros,
  updateBairro,
  type BairroInput,
} from '@/lib/services/bairros'
import { listCidades } from '@/lib/services/cidades'
import type { Bairro, Cidade } from '@/lib/types'

type ModalMode = 'create' | 'edit' | null

function BairroForm({
  initial,
  cidades,
  submitting,
  error,
  title,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Bairro> | null
  cidades: Cidade[]
  submitting?: boolean
  error?: string | null
  title: string
  onSubmit: (values: BairroInput) => void | Promise<void>
  onCancel: () => void
}) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [cidadeId, setCidadeId] = useState(initial?.cidadeId ?? cidades[0]?.id ?? '')
  const [ativo, setAtivo] = useState(initial?.ativo ?? true)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!nome.trim()) {
      setFieldError('Nome é obrigatório')
      return
    }
    if (!cidadeId) {
      setFieldError('Cidade é obrigatória')
      return
    }
    setFieldError(null)
    await onSubmit({ nome: nome.trim(), cidadeId, ativo })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-headline-sm text-on-surface">{title}</h3>
      <Select
        label="Cidade"
        required
        value={cidadeId}
        onChange={(e) => setCidadeId(e.target.value)}
        options={cidades.map((cidade) => ({ value: cidade.id, label: `${cidade.nome} (${cidade.uf})` }))}
      />
      <TextInput
        label="Bairro"
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={fieldError || undefined}
        placeholder="Ex.: Dirceu"
      />
      <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4"
        />
        Ativo
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

export default function BairrosAdminPage() {
  const [items, setItems] = useState<Bairro[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<Bairro | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const cidadeNome = useCallback((id: string) => {
    return cidades.find((cidade) => cidade.id === id)?.nome ?? 'Cidade'
  }, [cidades])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setActionError(null)
      const [bairros, cidadesList] = await Promise.all([listBairros(undefined, false), listCidades(false)])
      setItems(bairros)
      setCidades(cidadesList)
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
    if (!q) return items
    return items.filter((item) => {
      return item.nome.toLowerCase().includes(q) || cidadeNome(item.cidadeId).toLowerCase().includes(q)
    })
  }, [items, search, cidadeNome])

  const handleSubmit = async (values: BairroInput) => {
    try {
      setSubmitting(true)
      setError(null)
      if (modal === 'edit' && editing) {
        await updateBairro(editing.id, values)
      } else {
        await createBairro(values)
      }
      setModal(null)
      setEditing(null)
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
          title="Bairros"
          description="Cadastre bairros vinculados a uma cidade. O lead de interesse usa este catálogo."
          actions={(
            <button type="button" className="btn-primary" onClick={() => { setEditing(null); setError(null); setModal('create') }}>
              Novo bairro
            </button>
          )}
        />

        <div className="card">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bairro ou cidade…"
            className="min-h-11 w-full px-3.5 py-2.5"
            aria-label="Buscar bairros"
          />
        </div>

        {actionError && (
          <p className="rounded-xl bg-error/15 px-3 py-2 text-label-sm text-error">{actionError}</p>
        )}

        {loading ? (
          <p className="text-on-surface-variant">Carregando bairros…</p>
        ) : filtered.length === 0 ? (
          <div className="card">
            <p className="text-body-md text-on-surface-variant">Nenhum bairro cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[480px] text-left text-label-md">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Bairro</th>
                  <th className="px-4 py-3 font-medium">Cidade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-on-surface">{item.nome}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{cidadeNome(item.cidadeId)}</td>
                    <td className="px-4 py-3">{item.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className="chip" onClick={() => { setEditing(item); setError(null); setModal('edit') }}>
                          Editar
                        </button>
                        {item.ativo ? (
                          <button
                            type="button"
                            className="chip text-error"
                            onClick={async () => {
                              if (!window.confirm(`Desativar “${item.nome}”?`)) return
                              await deactivateBairro(item.id)
                              await load()
                            }}
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="chip"
                            onClick={async () => {
                              await updateBairro(item.id, { ativo: true })
                              await load()
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
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className="card w-full max-w-lg">
              <BairroForm
                initial={editing}
                cidades={cidades}
                submitting={submitting}
                error={error}
                title={modal === 'edit' ? 'Editar bairro' : 'Novo bairro'}
                onSubmit={handleSubmit}
                onCancel={() => { setModal(null); setEditing(null); setError(null) }}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedAdminRoute>
  )
}
