'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { PageHeading } from '@/components/ui/PageHeading'
import { useToast } from '@/lib/contexts/ToastContext'
import { listCorretores } from '@/lib/services/team'
import {
  distribuirLeads,
  listPoolLeads,
  POOL_PAGE_SIZE,
  type PoolLead,
} from '@/lib/services/leads-pool'
import type { Corretor } from '@/lib/types'

const ETAPA_LABEL: Record<string, string> = {
  lead: 'Lead',
  analise: 'Análise',
  aprovado: 'Aprovado',
  especulativo: 'Especulativo',
  realizado: 'Realizado',
  reprovado: 'Reprovado',
  visita: 'Visita',
}

export default function DistribuicaoPage() {
  const { addToast } = useToast()
  const [leads, setLeads] = useState<PoolLead[]>([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(POOL_PAGE_SIZE)
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [origemFilter, setOrigemFilter] = useState<'Central 2026' | 'todas'>('todas')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [corretorId, setCorretorId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [pool, team] = await Promise.all([
        listPoolLeads({
          search,
          origem: origemFilter === 'todas' ? null : origemFilter,
          limit,
        }),
        listCorretores(true),
      ])
      setLeads(pool.leads)
      setTotal(pool.total)
      setCorretores(team.filter((c) => c.ativo))
      setSelectedIds((prev) => prev.filter((id) => pool.leads.some((l) => l.id === id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o pool')
    } finally {
      setLoading(false)
    }
  }, [search, origemFilter, limit])

  useEffect(() => {
    const t = setTimeout(() => {
      void load()
    }, 200)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    setLimit(POOL_PAGE_SIZE)
  }, [search, origemFilter])

  const allSelected = leads.length > 0 && selectedIds.length === leads.length

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : leads.map((l) => l.id))
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const selectedCorretor = useMemo(
    () => corretores.find((c) => c.id === corretorId) ?? null,
    [corretores, corretorId],
  )

  const handleDistribuir = async () => {
    if (selectedIds.length === 0) {
      addToast('Selecione ao menos um lead', 'error')
      return
    }
    if (!corretorId) {
      addToast('Escolha o corretor de destino', 'error')
      return
    }
    if (
      !confirm(
        `Distribuir ${selectedIds.length} lead(s) para ${selectedCorretor?.nome ?? 'o corretor'}?`,
      )
    ) {
      return
    }

    try {
      setSubmitting(true)
      const distributed = await distribuirLeads(selectedIds, corretorId)
      addToast(`${distributed} lead(s) distribuído(s) com sucesso`, 'success')
      if (distributed < selectedIds.length) {
        addToast(`${selectedIds.length - distributed} lead(s) não foram encontrados`, 'error')
      }
      setSelectedIds([])
      await load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao distribuir', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="page-section">
        <PageHeading
          title="Distribuir leads"
          description="Base exclusiva dos administradores. Atribua clientes do pool aos corretores quando quiser."
          actions={
            <Link href="/admin" className="btn-ghost">
              ← Gerenciamento
            </Link>
          }
        />

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-label-xs text-on-surface-variant">Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, telefone, CPF, cidade ou consultor anterior…"
              className="w-full px-4 py-2.5"
            />
          </label>
          <label className="space-y-1.5 sm:w-48">
            <span className="text-label-xs text-on-surface-variant">Origem</span>
            <select
              value={origemFilter}
              onChange={(e) =>
                setOrigemFilter(e.target.value as 'Central 2026' | 'todas')
              }
              className="w-full px-4 py-2.5"
            >
              <option value="todas">Toda a central</option>
              <option value="Central 2026">Central 2026</option>
            </select>
          </label>
        </div>

        {selectedIds.length > 0 && (
          <div className="card space-y-3 border border-primary/20 bg-primary/5">
            <p className="text-label-sm font-medium text-on-surface">
              {selectedIds.length} lead(s) selecionado(s)
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-1.5">
                <span className="text-label-xs text-on-surface-variant">
                  Atribuir ao corretor
                </span>
                <select
                  value={corretorId}
                  onChange={(e) => setCorretorId(e.target.value)}
                  className="w-full px-4 py-2.5"
                >
                  <option value="">Selecione…</option>
                  {corretores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleDistribuir()}
                disabled={submitting || !corretorId}
                className="btn-primary disabled:opacity-40"
              >
                {submitting ? 'Distribuindo…' : 'Distribuir'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-body-md text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-on-surface-variant">Carregando pool…</p>
        ) : leads.length === 0 ? (
          <div className="card">
            <p className="text-body-md text-on-surface-variant">
              Nenhum lead disponível no pool
              {origemFilter !== 'todas' ? ` com origem “${origemFilter}”` : ''}.
            </p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left text-body-md">
              <thead>
                <tr className="border-b border-white/[0.06] text-label-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Construtora</th>
                  <th className="px-4 py-3">Consultor anterior</th>
                  <th className="px-4 py-3">Origem</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const checked = selectedIds.includes(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(lead.id)}
                          aria-label={`Selecionar ${lead.nome}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{lead.nome}</p>
                        <p className="text-label-xs text-on-surface-variant">
                          {[lead.telefone, lead.cpf].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {lead.cidade || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-label-xs">
                          {ETAPA_LABEL[lead.etapa] ?? lead.etapa}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {lead.construtora || '—'}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {lead.corretorOrigem || '—'}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {lead.origem || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
              <p className="text-label-xs text-on-surface-variant">
                Mostrando {leads.length} de {total} lead(s) na central
              </p>
              {leads.length < total && (
                <button
                  type="button"
                  onClick={() => setLimit((current) => current + POOL_PAGE_SIZE)}
                  className="btn-ghost"
                >
                  Carregar mais
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedAdminRoute>
  )
}
