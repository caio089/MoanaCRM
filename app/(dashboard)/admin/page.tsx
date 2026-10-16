'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useFilters } from '@/lib/contexts/FiltersContext'
import { ProtectedAdminRoute } from '@/components/layout/ProtectedAdminRoute'
import { AdminClient } from '@/components/admin/AdminClient'
import { PageHeading } from '@/components/ui/PageHeading'
import { ExportExcelButton } from '@/components/export/ExportExcelButton'
import type { Lead } from '@/lib/types'

const ITEMS_PER_PAGE = 50

export default function AdminPage() {
  const { filters } = useFilters()
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery])

  async function loadLeads() {
    try {
      setLoading(true)
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase.from('leads').select('*', { count: 'exact' })

      if (searchQuery.trim()) {
        query = query.or(`nome.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%,telefone.ilike.%${searchQuery}%`)
      }

      const { data, error, count } = await query
        .order('atualizado_em', { ascending: false })
        .range(from, to)

      if (error) throw error

      setLeads(data || [])
      setTotalLeads(count || 0)
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalLeads / ITEMS_PER_PAGE)

  if (loading && leads.length === 0) {
    return (
      <div className="page-section">
        <p className="text-on-surface-variant">Carregando leads…</p>
      </div>
    )
  }

  return (
    <ProtectedAdminRoute>
      <div className="page-section">
      <PageHeading
        title="Gerenciamento"
        description={`${totalLeads} leads no total${filters.search ? ` · Busca: “${filters.search}”` : ''}${filters.etapa ? ` · Etapa: ${filters.etapa}` : ''}${filters.corretor ? ` · Corretor: ${filters.corretor}` : ''}`}
        actions={<ExportExcelButton className="btn-primary" />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/distribuicao" className="card card-interactive group block">
          <p className="eyebrow">Pool admin</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Distribuir leads</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Base Central 2026 e demais leads sem corretor — atribua aos consultores.</p>
        </Link>
        <Link href="/equipe" className="card card-interactive group block">
          <p className="eyebrow">Hierarquia</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Equipe</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Navegue coordenadores e corretores vinculados no cadastro.</p>
        </Link>
        <Link href="/admin/corretores" className="card card-interactive group block">
          <p className="eyebrow">Equipe comercial</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Corretores</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Lista plana dos corretores do cadastro com vínculo de coordenação.</p>
        </Link>
        <Link href="/admin/coordenadores" className="card card-interactive group block">
          <p className="eyebrow">Gestão</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Coordenadores</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Hierarquia interativa a partir do cadastro de coordenadores.</p>
        </Link>
        <Link href="/admin/correspondentes" className="card card-interactive group block">
          <p className="eyebrow">Financeiro</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Correspondentes</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Cadastro bancário vinculado aos leads (FK + nome legado).</p>
        </Link>
        <Link href="/admin/cidades" className="card card-interactive group block">
          <p className="eyebrow">Localização</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Cidades</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Cadastro usado no formulário de leads e filtros.</p>
        </Link>
        <Link href="/admin/construtoras" className="card card-interactive group block">
          <p className="eyebrow">Empreendimentos</p>
          <h2 className="mt-1 text-headline-sm text-on-surface transition group-hover:text-primary">Construtoras</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Cadastro usado em leads, visitas e filtros.</p>
        </Link>
      </div>

      {/* Barra de busca */}
      <div className="card">
        <input
          type="text"
          placeholder="Buscar por nome, ID ou telefone..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-4 py-2.5"
        />
      </div>

      <AdminClient
        initialLeads={leads}
        onLeadsChange={(next) => {
          setTotalLeads((prev) => Math.max(0, prev + (next.length - leads.length)))
          setLeads(next)
        }}
      />

      {/* Paginação */}
      {totalPages > 1 && (
      <div className="card flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-ghost disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-label-sm text-on-surface-variant">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-ghost disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
      </div>
    </ProtectedAdminRoute>
  )
}
