'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilteredLeads } from '@/lib/hooks/useFilteredLeads'
import { useToast } from '@/lib/contexts/ToastContext'
import type { Lead } from '@/lib/types'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { TabelaAdmin } from './TabelaAdmin'
import { ModalNovoLead } from './ModalNovoLead'
import { BulkActionsBar } from './BulkActionsBar'

interface AdminClientProps {
  initialLeads: Lead[]
  onLeadsChange?: (leads: Lead[]) => void
}

export function AdminClient({ initialLeads, onLeadsChange }: AdminClientProps) {
  const { addToast } = useToast()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const filteredLeads = useFilteredLeads(leads)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editando, setEditando] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  const handleAdicionar = async (dados: Record<string, unknown>) => {
    try {
      const novoId = `lead_${Date.now()}`
      const agora = new Date()
      const cpf =
        typeof dados.cpf === 'string' && dados.cpf
          ? dados.cpf.replace(/\D/g, '')
          : null

      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            id: novoId,
            nome: dados.nome,
            cpf,
            telefone: dados.telefone || null,
            cidade: dados.cidade || null,
            zona: dados.zona || null,
            etapa: dados.etapa || 'lead',
            corretor: dados.corretor || null,
            corretor_id: null,
            coordenador: dados.coordenador || null,
            coordenador_id: null,
            construtora: dados.construtora || null,
            origem: dados.origem || null,
            vgv: dados.vgv ? parseFloat(String(dados.vgv)) : null,
            tipo_operacao: dados.tipoOperacao || 'venda',
            criado_em: agora.toISOString(),
            atualizado_em: agora.toISOString(),
          },
        ])
        .select()

      if (error) throw error

      const created = Array.isArray(data) ? data[0] : data
      const lead = (created as Lead | null) ?? ({
        id: novoId,
        nome: String(dados.nome),
        etapa: (dados.etapa as Lead['etapa']) || 'lead',
      } as Lead)

      const novoLeads = [lead, ...leads]
      setLeads(novoLeads)
      onLeadsChange?.(novoLeads)
      setOpenModal(false)
      addToast('Lead adicionado com sucesso!', 'success')
    } catch (err) {
      console.error('Erro:', err)
      addToast(
        err instanceof Error ? err.message : 'Erro ao adicionar lead',
        'error',
      )
    }
  }

  const handleEditar = async (id: string, dados: Record<string, unknown>) => {
    try {
      const agora = new Date()

      const { data, error } = await supabase
        .from('leads')
        .update({
          nome: dados.nome,
          cpf: dados.cpf || null,
          telefone: dados.telefone || null,
          cidade: dados.cidade || null,
          zona: dados.zona || null,
          etapa: dados.etapa || 'lead',
          corretor: dados.corretor || null,
          coordenador: dados.coordenador || null,
          construtora: dados.construtora || null,
          origem: dados.origem || null,
          vgv: dados.vgv ? parseFloat(String(dados.vgv)) : null,
          tipo_operacao: dados.tipoOperacao || 'venda',
          atualizado_em: agora.toISOString(),
        })
        .eq('id', id)
        .select()

      if (error) throw error

      if (data && data[0]) {
        const novoLeads = leads.map(l => l.id === id ? data[0] : l)
        setLeads(novoLeads)
        onLeadsChange?.(novoLeads)
        setEditando(null)
        addToast('Lead atualizado com sucesso!', 'success')
      }
    } catch (err) {
      console.error('Erro:', err)
      addToast('Erro ao atualizar lead', 'error')
    }
  }

  const handleDeletar = (id: string) => {
    const lead = leads.find((l) => l.id === id) || null
    setDeleteTarget(lead)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deleteTarget.id)
        .select('id')

      if (error) throw error
      const rows = Array.isArray(data) ? data : data ? [data] : []
      if (rows.length === 0) {
        throw new Error('Lead não encontrado ou sem permissão para excluir')
      }

      const novoLeads = leads.filter((l) => l.id !== deleteTarget.id)
      setLeads(novoLeads)
      onLeadsChange?.(novoLeads)
      setDeleteTarget(null)
      addToast('Lead excluído com sucesso!', 'success')
    } catch (err) {
      console.error('Erro:', err)
      addToast(err instanceof Error ? err.message : 'Erro ao deletar lead', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditando(null)
              setOpenModal(true)
            }}
            className="btn-primary"
          >
            Novo lead
          </button>
        </div>

        <BulkActionsBar
          selectedIds={selectedIds}
          onSuccess={() => {
            setSelectedIds([])
            addToast('Leads movidos com sucesso!', 'success')
            // Recarregar dados aqui se necessário
          }}
        />

        <TabelaAdmin
          leads={filteredLeads}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEditar={(lead) => {
            setEditando(lead)
            setOpenModal(true)
          }}
          onDeletar={handleDeletar}
          onEtapaChange={(id, novaEtapa) => {
            const leadAtualizado = leads.find(l => l.id === id)
            if (leadAtualizado) {
              const novoLeads = leads.map(l =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                l.id === id ? { ...l, etapa: novaEtapa as any } : l
              )
              setLeads(novoLeads)
              onLeadsChange?.(novoLeads)
              addToast('Etapa alterada com sucesso!', 'success')
            }
          }}
        />

        {openModal && (
          <ModalNovoLead
            lead={editando}
            onSave={editando ? (dados) => handleEditar(editando.id, dados) : handleAdicionar}
            onClose={() => {
              setOpenModal(false)
              setEditando(null)
            }}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            itemName={deleteTarget.nome}
            confirming={deleting}
            onCancel={() => !deleting && setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    </>
  )
}
