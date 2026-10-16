'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateLead } from '@/lib/hooks/useCreateLead'
import { useToast } from '@/lib/contexts/ToastContext'
import { getFilterOptions } from '@/lib/services/leads'
import { TextInput, Select, TextArea, Checkbox } from '@/components/forms/FormField'
import { CorrespondenteSelect } from '@/components/correspondentes/CorrespondenteSelect'
import { CidadeSelect } from '@/components/cidades/CidadeSelect'
import { ConstrutoraSelect } from '@/components/construtoras/ConstrutoraSelect'
import { ORIGENS } from '@/lib/constants/origens'
import {
  CATEGORIAS_IMOVEL,
  COMPROVACOES,
  ETAPAS,
  MODALIDADES,
  TIPOS_IMOVEL,
  TIPOS_RENDA,
  ZONAS,
} from '@/lib/constants/lead-options'
import {
  findOptionLabel,
  isTeamUuid,
  toSelectOptions,
} from '@/lib/utils/filter-options'

const TABS = [
  { id: 'personal', label: 'Dados Pessoais' },
  { id: 'location', label: 'Localização' },
  { id: 'property', label: 'Imóvel' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'process', label: 'Processo' },
  { id: 'observations', label: 'Observações' },
]

interface CreateLeadFormProps {
  onSuccess?: () => void
}

export function CreateLeadForm({ onSuccess }: CreateLeadFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [filterOptions, setFilterOptions] = useState({
    corretores: [] as Array<string | { value: string; label: string; coordenadorId?: string | null }>,
    coordenadores: [] as Array<string | { value: string; label: string }>,
    construtoras: [] as string[],
    cidades: [] as string[],
    origens: [] as string[],
  })

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    cidade: '',
    zona: '',
    tipoImovel: '',
    categoriaImovel: '',
    valorAvaliacao: '',
    valorFecho: '',
    chb: '',
    vgv: '',
    modalidade: '',
    tipoRenda: '',
    comprovacao: '',
    faturamentoPrevisto: '',
    etapa: 'lead',
    origem: '',
    produto: '',
    bairro: '',
    corretor: '',
    corretorId: '',
    coordenador: '',
    coordenadorId: '',
    construtora: '',
    correspondente: '',
    correspondenteId: '',
    observacao: '',
    situacaoReprovado: '',
    ccv: false,
  })

  const { submit, loading: submitting, error, validationErrors } = useCreateLead()

  // Carregar opções de filtro
  useEffect(() => {
    const load = async () => {
      try {
        const options = await getFilterOptions()
        setFilterOptions(options)
      } catch (err) {
        console.error('Erro ao carregar opções:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (showPreview) {
      const result = await submit(formData)
      if (result.ok) {
        addToast('Lead criado com sucesso!', 'success')
        setSuccessMessage('Lead criado com sucesso!')
        setShowPreview(false)
        setTimeout(() => {
          onSuccess?.()
          router.push(`/leads`)
        }, 1500)
        return
      }

      setShowPreview(false)
      addToast(result.error || 'Revise os campos obrigatórios', 'error')
      const firstField = result.validationErrors[0]?.field
      if (firstField === 'nome' || firstField === 'cpf' || firstField === 'telefone') {
        setActiveTab('personal')
      } else if (firstField === 'cidade') {
        setActiveTab('location')
      } else if (firstField === 'corretor' || firstField === 'origem' || firstField === 'etapa') {
        setActiveTab('process')
      }
    } else {
      setShowPreview(true)
    }
  }

  const getError = (field: string) => {
    return validationErrors.find((e) => e.field === field)?.message
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (successMessage) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="text-success text-headline-sm mb-4">✅ {successMessage}</div>
        <p className="text-on-surface-variant">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-3 text-label-md transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <TextInput
              label="Nome"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              error={getError('telefone')}
            />
          </div>
        )}

        {/* Localização */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            <CidadeSelect
              label="Cidade"
              required
              value={formData.cidade}
              onChange={(cidade) => setFormData({ ...formData, cidade })}
              error={getError('cidade')}
            />
            <TextInput
              label="Bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Ex.: Dirceu"
            />
            <Select
              label="Zona"
              value={formData.zona}
              onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
              options={ZONAS}
            />
          </div>
        )}

        {/* Imóvel */}
        {activeTab === 'property' && (
          <div className="space-y-4">
            <TextInput
              label="Produto / empreendimento"
              value={formData.produto}
              onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
              placeholder="Ex.: Mio Dirceu"
            />
            <Select
              label="Modalidade do Imóvel"
              value={formData.categoriaImovel}
              onChange={(e) => setFormData({ ...formData, categoriaImovel: e.target.value })}
              options={CATEGORIAS_IMOVEL}
            />
            <Select
              label="Tipo de Imóvel"
              value={formData.tipoImovel}
              onChange={(e) => setFormData({ ...formData, tipoImovel: e.target.value })}
              options={TIPOS_IMOVEL}
            />
            <TextInput
              label="Valor de Avaliação"
              type="number"
              value={formData.valorAvaliacao}
              onChange={(e) => setFormData({ ...formData, valorAvaliacao: e.target.value })}
              placeholder="R$ 0,00"
            />
            <TextInput
              label="Valor de Fechamento"
              type="number"
              value={formData.valorFecho}
              onChange={(e) => setFormData({ ...formData, valorFecho: e.target.value })}
              placeholder="R$ 0,00"
            />
            <TextInput
              label="CHB/Área"
              type="number"
              value={formData.chb}
              onChange={(e) => setFormData({ ...formData, chb: e.target.value })}
              placeholder="m²"
            />
          </div>
        )}

        {/* Financeiro */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <TextInput
              label="VGV"
              type="number"
              value={formData.vgv}
              onChange={(e) => setFormData({ ...formData, vgv: e.target.value })}
              placeholder="R$ 0,00"
            />
            <Select
              label="Modalidade de Financiamento"
              value={formData.modalidade}
              onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
              options={MODALIDADES}
            />
            <Select
              label="Tipo de Renda"
              value={formData.tipoRenda}
              onChange={(e) => setFormData({ ...formData, tipoRenda: e.target.value })}
              options={TIPOS_RENDA}
            />
            <Select
              label="Comprovação de Renda"
              value={formData.comprovacao}
              onChange={(e) => setFormData({ ...formData, comprovacao: e.target.value })}
              options={COMPROVACOES}
            />
            <TextInput
              label="Faturamento Previsto"
              type="number"
              value={formData.faturamentoPrevisto}
              onChange={(e) => setFormData({ ...formData, faturamentoPrevisto: e.target.value })}
              placeholder="R$ 0,00"
            />
          </div>
        )}

        {/* Processo */}
        {activeTab === 'process' && (
          <div className="space-y-4">
            <Select
              label="Etapa"
              required
              value={formData.etapa}
              onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
              options={ETAPAS}
              error={getError('etapa')}
            />
            <Select
              label="Origem"
              required
              value={formData.origem}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              options={[...ORIGENS]}
              error={getError('origem')}
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
                  corretor: findOptionLabel(filterOptions.corretores, value),
                })
              }}
              options={toSelectOptions(filterOptions.corretores)}
              error={getError('corretor')}
            />
            <Select
              label="Coordenador"
              value={formData.coordenadorId || formData.coordenador}
              onChange={(e) => {
                const value = e.target.value
                setFormData({
                  ...formData,
                  coordenadorId: isTeamUuid(value) ? value : '',
                  coordenador: findOptionLabel(filterOptions.coordenadores, value),
                })
              }}
              options={toSelectOptions(filterOptions.coordenadores)}
            />
            <ConstrutoraSelect
              value={formData.construtora}
              onChange={(construtora) => setFormData({ ...formData, construtora })}
            />
            <CorrespondenteSelect
              value={formData.correspondenteId || null}
              onChange={(id, nome) =>
                setFormData({
                  ...formData,
                  correspondenteId: id || '',
                  correspondente: nome || '',
                })
              }
            />
          </div>
        )}

        {/* Observações */}
        {activeTab === 'observations' && (
          <div className="space-y-4">
            <TextArea
              label="Observações"
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Adicione observações sobre o lead..."
            />
            {formData.etapa === 'reprovado' && (
              <TextInput
                label="Motivo da Reprovação"
                value={formData.situacaoReprovado}
                onChange={(e) => setFormData({ ...formData, situacaoReprovado: e.target.value })}
                placeholder="Por que o lead foi reprovado?"
              />
            )}
            <Checkbox
              label="CCV Assinado"
              checked={formData.ccv}
              onChange={(e) => setFormData({ ...formData, ccv: e.target.checked })}
            />
          </div>
        )}

        {/* Erros Gerais */}
        {error && (
          <div className="p-4 bg-error/20 rounded text-error text-label-sm">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {showPreview ? (submitting ? 'Criando…' : 'Criar Lead') : 'Visualizar'}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-surface-low p-5 sm:rounded-2xl sm:p-6">
            <h3 className="text-headline-sm text-on-surface mb-4">Revisar Dados</h3>

            <div className="space-y-3 text-label-md mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-on-surface-variant text-label-sm">Nome</div>
                  <div className="text-on-surface">{formData.nome}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-label-sm">CPF</div>
                  <div className="text-on-surface">{formData.cpf}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-label-sm">Corretor</div>
                  <div className="text-on-surface">{formData.corretor}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-label-sm">Etapa</div>
                  <div className="text-on-surface capitalize">{formData.etapa}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-label-sm">Cidade</div>
                  <div className="text-on-surface">{formData.cidade}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-label-sm">VGV</div>
                  <div className="text-on-surface">R$ {formData.vgv || '0'}</div>
                </div>
              </div>
              {formData.observacao && (
                <div>
                  <div className="text-on-surface-variant text-label-sm">Observações</div>
                  <div className="text-on-surface">{formData.observacao}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn-ghost flex-1"
                disabled={submitting}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
                className="btn-primary flex-1 disabled:opacity-40"
                disabled={submitting}
              >
                {submitting ? 'Criando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
