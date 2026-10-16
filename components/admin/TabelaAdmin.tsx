'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'

const ETAPAS = ['lead', 'analise', 'aprovado', 'especulativo', 'realizado', 'reprovado', 'visita']

const CORES_ETAPA: Record<string, string> = {
  lead: 'bg-secondary/15 text-secondary',
  analise: 'bg-amber-400/15 text-amber-200',
  aprovado: 'bg-tertiary/15 text-tertiary',
  especulativo: 'bg-primary/12 text-primary',
  realizado: 'bg-tertiary/20 text-tertiary',
  reprovado: 'bg-error/15 text-error',
  visita: 'bg-sky-400/15 text-sky-200',
}

interface TabelaAdminProps {
  leads: Lead[]
  onEditar: (lead: Lead) => void
  onDeletar: (id: string) => void
  onEtapaChange?: (id: string, novaEtapa: string) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function TabelaAdmin({ leads, onEditar, onDeletar, onEtapaChange, selectedIds = [], onSelectionChange }: TabelaAdminProps) {
  const [mudandoEtapa, setMudandoEtapa] = useState<string | null>(null)

  const toggleSelect = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id]
    onSelectionChange?.(newIds)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(leads.map(l => l.id))
    }
  }

  const handleMudarEtapa = async (id: string, novaEtapa: string) => {
    setMudandoEtapa(id)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa: novaEtapa, atualizado_em: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      onEtapaChange?.(id, novaEtapa)
    } catch (err) {
      console.error('Erro ao mudar etapa:', err)
    } finally {
      setMudandoEtapa(null)
    }
  }

  return (
    <div className="card overflow-hidden p-0 sm:p-0">
      <div className="space-y-3 p-4 md:hidden">
        {leads.map((lead) => (
          <article key={lead.id} className={`rounded-xl border p-4 ${selectedIds.includes(lead.id) ? 'border-primary/40 bg-primary/10' : 'border-outline-variant bg-surface-high/50'}`}>
            <div className="mb-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(lead.id)}
                onChange={() => toggleSelect(lead.id)}
                className="mt-1 h-5 w-5"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-on-surface">{lead.nome}</p>
                <p className="text-label-sm text-on-surface-variant">{lead.telefone || '-'}</p>
                <p className="text-label-sm text-on-surface-variant">{lead.corretor || '-'}</p>
              </div>
              <p className="text-label-sm font-semibold text-on-surface">
                {lead.vgv ? `R$ ${Number(lead.vgv).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '-'}
              </p>
            </div>
            <select
              value={lead.etapa}
              onChange={(e) => handleMudarEtapa(lead.id, e.target.value)}
              disabled={mudandoEtapa === lead.id}
              className={`mb-3 w-full rounded px-3 py-2 text-sm font-medium ${CORES_ETAPA[lead.etapa]}`}
            >
              {ETAPAS.map(etapa => (
                <option key={etapa} value={etapa}>
                  {etapa.charAt(0).toUpperCase() + etapa.slice(1)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => onEditar(lead)} className="min-h-10 flex-1 rounded bg-secondary/12 text-secondary">Editar</button>
              <button onClick={() => onDeletar(lead.id)} className="min-h-10 flex-1 rounded bg-error/12 text-error">Excluir</button>
            </div>
          </article>
        ))}
      </div>

      <div className="table-scroll hidden md:block">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-outline-variant bg-surface-high">
          <tr>
            <th className="text-left p-3">
              <input
                type="checkbox"
                checked={leads.length > 0 && selectedIds.length === leads.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
            </th>
            <th className="text-left p-3 font-semibold text-on-surface">Nome</th>
            <th className="text-left p-3 font-semibold text-on-surface">Telefone</th>
            <th className="text-left p-3 font-semibold text-on-surface">Corretor</th>
            <th className="text-left p-3 font-semibold text-on-surface">Etapa</th>
            <th className="text-left p-3 font-semibold text-on-surface">VGV</th>
            <th className="text-center p-3 font-semibold text-on-surface">Ações</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className={`border-b border-outline-variant transition-colors ${selectedIds.includes(lead.id) ? 'bg-primary/10' : 'hover:bg-surface-high'}`}>
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                  className="w-4 h-4 cursor-pointer"
                />
              </td>
              <td className="p-3 font-medium text-on-surface">{lead.nome}</td>
              <td className="p-3 text-on-surface-variant text-xs">{lead.telefone || '-'}</td>
              <td className="p-3 text-on-surface-variant text-xs">{lead.corretor || '-'}</td>
              <td className="p-3">
                <select
                  value={lead.etapa}
                  onChange={(e) => handleMudarEtapa(lead.id, e.target.value)}
                  disabled={mudandoEtapa === lead.id}
                  className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${CORES_ETAPA[lead.etapa]} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {ETAPAS.map(etapa => (
                    <option key={etapa} value={etapa}>
                      {etapa.charAt(0).toUpperCase() + etapa.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-on-surface font-medium">
                {lead.vgv ? `R$ ${Number(lead.vgv).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '-'}
              </td>
              <td className="p-3 text-center space-x-1.5">
                <button
                  onClick={() => onEditar(lead)}
                  className="px-2.5 py-1 bg-secondary/12 text-secondary rounded text-xs font-medium hover:bg-secondary/20 transition-colors"
                  title="Editar informações completas"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDeletar(lead.id)}
                  className="px-2.5 py-1 bg-error/12 text-error rounded text-xs font-medium hover:bg-error/20 transition-colors"
                  title="Deletar lead"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {leads.length === 0 && (
        <div className="p-8 text-center text-on-surface-variant">
          Nenhum lead encontrado. Clique em &quot;Novo Lead&quot; para adicionar.
        </div>
      )}
    </div>
  )
}
