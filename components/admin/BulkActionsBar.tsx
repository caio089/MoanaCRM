'use client'

import { supabase } from '@/lib/supabase'

const ETAPAS = ['lead', 'analise', 'aprovado', 'especulativo', 'realizado', 'reprovado', 'visita']

interface BulkActionsBarProps {
  selectedIds: string[]
  onSuccess: () => void
}

export function BulkActionsBar({ selectedIds, onSuccess }: BulkActionsBarProps) {
  if (selectedIds.length === 0) return null

  const handleMoveToEtapa = async (etapa: string) => {
    if (!confirm(`Mover ${selectedIds.length} lead(s) para "${etapa}"?`)) return

    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa, atualizado_em: new Date().toISOString() })
        .in('id', selectedIds)

      if (error) throw error
      onSuccess()
    } catch (err) {
      console.error('Erro ao mover leads:', err)
      alert('Erro ao mover leads')
    }
  }

  return (
    <div className="card space-y-3 border border-primary/20 bg-primary/5">
      <p className="text-label-sm font-medium text-on-surface">
        {selectedIds.length} lead(s) selecionado(s)
      </p>
      <div className="flex flex-wrap gap-2">
          {ETAPAS.map(etapa => (
            <button
              key={etapa}
              onClick={() => handleMoveToEtapa(etapa)}
              className="px-3 py-1.5 bg-primary/20 text-primary rounded text-label-xs font-medium hover:bg-primary/30 transition-colors"
            >
              → {etapa.charAt(0).toUpperCase() + etapa.slice(1)}
            </button>
          ))}
        </div>
    </div>
  )
}
