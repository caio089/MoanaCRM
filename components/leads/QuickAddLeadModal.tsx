'use client'

import { useEffect, useState } from 'react'
import { useCreateLead } from '@/lib/hooks/useCreateLead'
import { useToast } from '@/lib/contexts/ToastContext'
import { TextInput, Select, TextArea } from '@/components/forms/FormField'
import { CidadeSelect } from '@/components/cidades/CidadeSelect'
import { ORIGENS } from '@/lib/constants/origens'
import {
  findOptionLabel,
  isTeamUuid,
  toSelectOptions,
  type TeamFilterOption,
} from '@/lib/utils/filter-options'
import type { Lead } from '@/lib/types'

interface QuickAddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (lead: Lead) => void
  corretores: TeamFilterOption[]
  /** Mantido por compat; cidades vêm do cadastro via CidadeSelect */
  cidades?: string[]
}

export function QuickAddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  corretores,
}: QuickAddLeadModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cidade: '',
    corretor: '',
    corretorId: '',
    etapa: 'lead',
    origem: '',
    observacao: '',
  })

  const { submit, loading, error, validationErrors } = useCreateLead()
  const { addToast } = useToast()

  useEffect(() => {
    if (!isOpen) return
    // Se só existe 1 corretor na lista, pré-seleciona
    const opts = toSelectOptions(corretores)
    if (opts.length === 1 && !formData.corretorId && !formData.corretor) {
      const only = opts[0]
      setFormData((prev) => ({
        ...prev,
        corretorId: isTeamUuid(only.value) ? only.value : '',
        corretor: only.label,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, corretores])

  const getError = (field: string) =>
    validationErrors.find((e) => e.field === field)?.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await submit(formData)

    if (result.ok) {
      addToast('Lead criado com sucesso!', 'success')
      onSuccess?.(result.lead)
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        cidade: '',
        corretor: '',
        corretorId: '',
        etapa: 'lead',
        origem: '',
        observacao: '',
      })
      onClose()
      return
    }

    addToast(result.error || 'Revise os campos obrigatórios', 'error')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-surface-low p-5 sm:max-w-md sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm text-on-surface">Novo Lead Rápido</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/20 rounded text-error text-label-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Nome"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome completo"
            error={getError('nome')}
          />

          <TextInput
            label="CPF"
            required
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
            error={getError('cpf')}
          />

          <TextInput
            label="Telefone"
            required
            value={formData.telefone}
            onChange={(e) =>
              setFormData({ ...formData, telefone: e.target.value })
            }
            placeholder="(00) 00000-0000"
            error={getError('telefone')}
          />

          <CidadeSelect
            value={formData.cidade}
            onChange={(cidade) => setFormData({ ...formData, cidade })}
            required
            error={getError('cidade')}
          />

          <Select
            label="Corretor"
            required
            value={formData.corretorId || formData.corretor}
            onChange={(e) => {
              const value = e.target.value
              setFormData({
                ...formData,
                corretorId: isTeamUuid(value) ? value : '',
                corretor: findOptionLabel(corretores, value),
              })
            }}
            options={toSelectOptions(corretores)}
            error={getError('corretor')}
          />

          {toSelectOptions(corretores).length === 0 && (
            <p className="text-label-sm text-error">
              Nenhum corretor disponível. Peça ao admin para ativar a equipe.
            </p>
          )}

          <Select
            label="Etapa"
            value={formData.etapa}
            onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
            options={[
              { value: 'lead', label: 'Lead' },
              { value: 'analise', label: 'Análise' },
              { value: 'aprovado', label: 'Aprovado' },
              { value: 'especulativo', label: 'Especulativo' },
              { value: 'realizado', label: 'Realizado' },
              { value: 'reprovado', label: 'Reprovado' },
              { value: 'visita', label: 'Visita' },
            ]}
          />

          <Select
            label="Origem"
            required
            value={formData.origem}
            onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
            options={[...ORIGENS]}
            error={getError('origem')}
          />

          <TextArea
            label="Observações"
            value={formData.observacao}
            onChange={(e) =>
              setFormData({ ...formData, observacao: e.target.value })
            }
            placeholder="Observações opcionais..."
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
