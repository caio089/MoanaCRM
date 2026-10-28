'use client'

import { useState, useEffect } from 'react'
import { useEditLead } from '@/lib/hooks/useEditLead'
import { useToast } from '@/lib/contexts/ToastContext'
import { getFilterOptions } from '@/lib/services/leads'
import { TextInput, Select, TextArea, Checkbox } from '@/components/forms/FormField'
import { CorrespondenteSelect } from '@/components/correspondentes/CorrespondenteSelect'
import { CidadeSelect } from '@/components/cidades/CidadeSelect'
import { ConstrutoraSelect } from '@/components/construtoras/ConstrutoraSelect'
import { BairroSelect } from '@/components/bairros/BairroSelect'
import { OperacaoToggle } from '@/components/ui/OperacaoToggle'
import { resolveCorrespondenteId } from '@/lib/services/correspondentes'
import { ORIGENS } from '@/lib/constants/origens'
import {
  CATEGORIAS_IMOVEL,
  COMPROVACOES,
  MODALIDADES,
  TIPOS_IMOVEL,
  TIPOS_RENDA,
  ZONAS,
} from '@/lib/constants/lead-options'
import {
  TIPOS_CONTRATO,
  TITULARIDADES,
  etapasPorOperacao,
  type TipoOperacao,
} from '@/lib/constants/operacao'
import { calcularVga } from '@/lib/utils/vga'
import {
  findOptionLabel,
  isTeamUuid,
  toSelectOptions,
} from '@/lib/utils/filter-options'
import type { Lead } from '@/lib/types'

const TABS = [
  { id: 'personal', label: 'Dados Pessoais' },
  { id: 'location', label: 'Localização' },
  { id: 'property', label: 'Imóvel' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'process', label: 'Processo' },
  { id: 'observations', label: 'Observações' },
]

interface EditLeadModalProps {
  isOpen: boolean
  leadId: string
  onClose: () => void
  onSuccess?: (lead: Lead) => void
}

export function EditLeadModal({
  isOpen,
  leadId,
  onClose,
  onSuccess,
}: EditLeadModalProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const [showPreview, setShowPreview] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [filterOptions, setFilterOptions] = useState({
    corretores: [] as Array<string | { value: string; label: string; coordenadorId?: string | null }>,
    coordenadores: [] as Array<string | { value: string; label: string }>,
    construtoras: [] as string[],
    cidades: [] as string[],
    origens: [] as string[],
  })

  const { lead, loading, updating, error, validationErrors, submit } = useEditLead(leadId)
  const { addToast } = useToast()

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
    tipoOperacao: 'venda' as TipoOperacao,
    tipoContrato: '',
    valorLocacaoMensal: '',
    titularidade: '',
    prazoContratoMeses: '12',
    bairroId: '',
  })

  // Carregar dados do lead; backfill FK se só houver string legada
  useEffect(() => {
    if (!lead) return

    let cancelled = false

    const base = {
      nome: lead.nome || '',
      cpf: lead.cpf || '',
      telefone: lead.telefone || '',
      cidade: lead.cidade || '',
      zona: lead.zona || '',
      tipoImovel: lead.tipoImovel || '',
      categoriaImovel: lead.categoriaImovel || '',
      valorAvaliacao: lead.valorAvaliacao?.toString() || '',
      valorFecho: lead.valorFecho?.toString() || '',
      chb: lead.chb?.toString() || '',
      vgv: lead.vgv?.toString() || '',
      modalidade: lead.modalidade || '',
      tipoRenda: lead.tipoRenda || '',
      comprovacao: lead.comprovacao || '',
      faturamentoPrevisto: lead.faturamentoPrevisto?.toString() || '',
      etapa: lead.etapa || 'lead',
      origem: lead.origem || '',
      produto: lead.produto || '',
      bairro: lead.bairro || '',
      corretor: lead.corretor || '',
      corretorId: lead.corretorId || '',
      coordenador: lead.coordenador || '',
      coordenadorId: lead.coordenadorId || '',
      construtora: lead.construtora || '',
      correspondente: lead.correspondente || '',
      correspondenteId: lead.correspondenteId || '',
      observacao: lead.observacao || '',
      situacaoReprovado: lead.situacaoReprovado || '',
      ccv: lead.ccv || false,
      tipoOperacao: (lead.tipoOperacao === 'aluguel' ? 'aluguel' : 'venda') as TipoOperacao,
      tipoContrato: lead.tipoContrato || '',
      valorLocacaoMensal: lead.valorLocacaoMensal?.toString() || '',
      titularidade: lead.titularidade || '',
      prazoContratoMeses: lead.prazoContratoMeses?.toString() || '12',
      bairroId: lead.bairroId || '',
    }

    setFormData(base)

    // Legacy: correspondenteId null + string preenchida → resolver ativo para o select
    if (!lead.correspondenteId && lead.correspondente) {
      void (async () => {
        try {
          const resolved = await resolveCorrespondenteId(lead.correspondente, {
            createIfMissing: false,
          })
          if (cancelled || !resolved.id) return
          setFormData((prev) => ({
            ...prev,
            correspondenteId: resolved.id!,
            correspondente: resolved.nome || prev.correspondente,
          }))
        } catch (err) {
          console.error('Erro ao resolver correspondente legado:', err)
        }
      })()
    }

    return () => {
      cancelled = true
    }
  }, [lead])

  // Carregar opções
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await getFilterOptions()
        setFilterOptions(options)
      } catch (err) {
        console.error('Erro ao carregar opções:', err)
      }
    }

    loadOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (showPreview) {
      let payload = formData
      if (!formData.correspondenteId && formData.correspondente) {
        try {
          const resolved = await resolveCorrespondenteId(formData.correspondente, {
            createIfMissing: false,
          })
          if (resolved.id) {
            payload = {
              ...formData,
              correspondenteId: resolved.id,
              correspondente: resolved.nome || formData.correspondente,
            }
            setFormData(payload)
          }
        } catch (err) {
          console.error('Erro ao backfill correspondente no save:', err)
        }
      }

      const result = await submit(payload)
      if (result.ok) {
        addToast('Lead atualizado com sucesso!', 'success')
        setSuccessMessage('Lead atualizado com sucesso!')
        setShowPreview(false)
        setTimeout(() => {
          onSuccess?.(result.lead)
          onClose()
        }, 1200)
        return
      }

      setShowPreview(false)
      addToast(result.error || 'Revise os campos e tente novamente', 'error')
    } else {
      setShowPreview(true)
    }
  }

  const getError = (field: string) => {
    return validationErrors.find((e) => e.field === field)?.message
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-6">Carregando...</div>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-6 text-center">
          <div className="text-success text-headline-sm mb-2">✅ {successMessage}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface-low sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/8 bg-surface-low/90 p-4 backdrop-blur-xl sm:p-6">
          <h2 className="text-headline-sm sm:text-headline-md text-on-surface">Editar Lead</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 overflow-y-auto page-section">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-outline-variant overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-label-md border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <OperacaoToggle
              required
              value={formData.tipoOperacao}
              onChange={(tipoOperacao) => setFormData({ ...formData, tipoOperacao })}
            />

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
                  error={getError('cpf')}
                />
                <TextInput
                  label="Telefone"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
                  onChange={(cidade) => setFormData({ ...formData, cidade, bairro: '', bairroId: '' })}
                  error={getError('cidade')}
                />
                <BairroSelect
                  cidadeNome={formData.cidade}
                  value={formData.bairro}
                  bairroId={formData.bairroId}
                  onChange={(bairro, bairroId) => setFormData({ ...formData, bairro, bairroId })}
                />
                <TextInput
                  label="Bairro (se não estiver no cadastro)"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value, bairroId: '' })}
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
                  label="Valor de Fechamento"
                  type="number"
                  value={formData.valorFecho}
                  onChange={(e) => setFormData({ ...formData, valorFecho: e.target.value })}
                />
                <TextInput
                  label="CHB/Área"
                  type="number"
                  value={formData.chb}
                  onChange={(e) => setFormData({ ...formData, chb: e.target.value })}
                />
                {formData.tipoOperacao === 'aluguel' && (
                  <>
                    <Select
                      label="Tipo de contrato"
                      value={formData.tipoContrato}
                      onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                      options={TIPOS_CONTRATO}
                    />
                    <TextInput
                      label="Valor de Avaliação"
                      type="number"
                      value={formData.valorAvaliacao}
                      onChange={(e) => setFormData({ ...formData, valorAvaliacao: e.target.value })}
                    />
                    <Select
                      label="Titularidade do imóvel"
                      value={formData.titularidade}
                      onChange={(e) => setFormData({ ...formData, titularidade: e.target.value })}
                      options={TITULARIDADES}
                    />
                  </>
                )}
              </div>
            )}

            {/* Financeiro */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                {formData.tipoOperacao === 'aluguel' ? (
                  <>
                    <TextInput
                      label="Valor de locação mensal"
                      type="number"
                      value={formData.valorLocacaoMensal}
                      onChange={(e) => setFormData({ ...formData, valorLocacaoMensal: e.target.value })}
                    />
                    <TextInput
                      label="Prazo do contrato (meses)"
                      type="number"
                      value={formData.prazoContratoMeses}
                      onChange={(e) => setFormData({ ...formData, prazoContratoMeses: e.target.value })}
                    />
                    {(() => {
                      const vga = calcularVga({
                        valorAvaliacao: Number(formData.valorAvaliacao) || 0,
                        valorLocacaoMensal: Number(formData.valorLocacaoMensal) || 0,
                        prazoContratoMeses: Number(formData.prazoContratoMeses) || 12,
                      })
                      return (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">VGA</p>
                          <p className="mt-1 font-display text-2xl text-on-surface">
                            R$ {vga.receitaProjetada.toLocaleString('pt-BR')}
                          </p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            Receita projetada ({vga.prazoMeses} meses)
                            {vga.rentabilidadeBruta != null
                              ? ` · rentabilidade bruta ${vga.rentabilidadeBruta.toFixed(1)}%`
                              : ''}
                          </p>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <TextInput
                    label="VGV"
                    type="number"
                    value={formData.vgv}
                    onChange={(e) => setFormData({ ...formData, vgv: e.target.value })}
                  />
                )}
                <Select
                  label={formData.tipoOperacao === 'aluguel' ? 'Modalidade' : 'Modalidade de Financiamento'}
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
                  onChange={(e) =>
                    setFormData({ ...formData, faturamentoPrevisto: e.target.value })
                  }
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
                  options={etapasPorOperacao(formData.tipoOperacao)}
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
                  includeInactiveId={lead?.correspondenteId}
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
                    onChange={(e) =>
                      setFormData({ ...formData, situacaoReprovado: e.target.value })
                    }
                  />
                )}
                <Checkbox
                  label="CCV Assinado"
                  checked={formData.ccv}
                  onChange={(e) => setFormData({ ...formData, ccv: e.target.checked })}
                />
              </div>
            )}

            {/* Erros */}
            {error && (
              <div className="p-4 bg-error/20 rounded text-error text-label-sm">{error}</div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 disabled:opacity-40"
                disabled={updating}
              >
                {showPreview ? (updating ? 'Salvando…' : 'Atualizar') : 'Visualizar'}
              </button>
            </div>
          </form>

          {/* Preview */}
          {showPreview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-surface rounded-lg p-6 max-w-md">
                <h3 className="text-headline-sm text-on-surface mb-4">Revisar Alterações</h3>

                <div className="space-y-3 text-label-md mb-6 max-h-[40vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-on-surface-variant text-label-sm">Nome</div>
                      <div className="text-on-surface">{formData.nome}</div>
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
                    disabled={updating}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
                    className="btn-primary flex-1 disabled:opacity-40"
                    disabled={updating}
                  >
                    {updating ? 'Salvando…' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
