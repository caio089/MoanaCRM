'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatBRLCompact } from '@/lib/formatters'
import { KpiCard } from '@/components/ui/KpiCard'
import { PageHeading } from '@/components/ui/PageHeading'
import type { Lead } from '@/lib/types'

type DirectoryField = 'construtora' | 'corretor' | 'coordenador'

interface EntityDirectoryProps {
  field: DirectoryField
  title: string
  description: string
  singular: string
  eyebrow?: string
  relationField?: 'corretor' | 'cidade'
  relationLabel?: string
}

interface DirectoryItem {
  name: string
  total: number
  active: number
  realized: number
  vgv: number
  relations: number
}

export function EntityDirectory({
  field,
  title,
  description,
  singular,
  eyebrow = 'Inteligência comercial',
  relationField,
  relationLabel = 'Relacionamentos',
}: EntityDirectoryProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id,nome,etapa,vgv,corretor,coordenador,construtora,cidade')
          .order('atualizado_em', { ascending: false })
        if (error) throw error
        setLeads((data || []) as Lead[])
      } catch (error) {
        console.error(`Erro ao carregar ${title.toLowerCase()}:`, error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [title])

  const items = useMemo(() => {
    const grouped = new Map<string, { leads: Lead[]; relations: Set<string> }>()

    leads.forEach((lead) => {
      const name = lead[field]
      if (!name) return
      const current = grouped.get(name) || { leads: [], relations: new Set<string>() }
      current.leads.push(lead)
      if (relationField && lead[relationField]) current.relations.add(String(lead[relationField]))
      grouped.set(name, current)
    })

    const query = search.trim().toLocaleLowerCase('pt-BR')
    return Array.from(grouped.entries())
      .map(([name, entry]): DirectoryItem => ({
        name,
        total: entry.leads.length,
        active: entry.leads.filter((lead) => !['realizado', 'reprovado'].includes(lead.etapa)).length,
        realized: entry.leads.filter((lead) => lead.etapa === 'realizado').length,
        vgv: entry.leads.reduce((sum, lead) => sum + (Number(lead.vgv) || 0), 0),
        relations: entry.relations.size,
      }))
      .filter((item) => !query || item.name.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'))
  }, [field, leads, relationField, search])

  const totalVgv = leads.reduce((sum, lead) => sum + (Number(lead.vgv) || 0), 0)
  const realized = leads.filter((lead) => lead.etapa === 'realizado').length

  return (
    <div className="page-section">
      <PageHeading eyebrow={eyebrow} title={title} description={description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard titulo={title} valor={items.length} accentColor="text-primary" />
        <KpiCard titulo="Leads relacionados" valor={leads.filter((lead) => Boolean(lead[field])).length} accentColor="text-secondary" />
        <KpiCard titulo="Vendas realizadas" valor={realized} accentColor="text-tertiary" />
        <KpiCard titulo="VGV total" valor={totalVgv} tipo="moeda" accentColor="text-primary" />
      </div>

      <div className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/45" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Pesquisar ${title.toLocaleLowerCase('pt-BR')}…`}
          className="min-h-12 w-full pl-10 pr-4 text-label-md"
        />
      </div>

      {loading ? (
        <div className="card animate-pulse py-16 text-center text-on-surface-variant">Carregando informações…</div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center text-on-surface-variant">Nenhum resultado encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.name}
              href={`/leads?${field}=${encodeURIComponent(item.name)}`}
              className="card card-interactive group block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">{singular}</p>
                  <h2 className="mt-1 truncate text-headline-sm text-on-surface transition group-hover:text-primary">{item.name}</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-label-sm font-semibold text-primary">{item.total}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.055] pt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">Em andamento</p>
                  <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">{item.active}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">Realizados</p>
                  <p data-numeric className="mt-1 text-body-md font-semibold text-tertiary">{item.realized}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">VGV</p>
                  <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">{formatBRLCompact(item.vgv)}</p>
                </div>
                {relationField && (
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/55">{relationLabel}</p>
                    <p data-numeric className="mt-1 text-body-md font-semibold text-on-surface">{item.relations}</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-label-sm font-semibold text-primary">Ver leads →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
