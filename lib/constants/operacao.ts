import type { EtapaFunil } from '@/lib/types'
import { ETAPAS, type LeadOption } from '@/lib/constants/lead-options'

export type TipoOperacao = 'venda' | 'aluguel'

export const TIPOS_OPERACAO: LeadOption[] = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
]

export const TIPOS_CONTRATO: LeadOption[] = [
  { value: 'locacao', label: 'Locação' },
  { value: 'compra_venda', label: 'Compra e Venda' },
  { value: 'permuta', label: 'Permuta' },
]

export const TITULARIDADES: LeadOption[] = [
  { value: 'construtora', label: 'Construtora' },
  { value: 'proprio', label: 'Próprio (imóvel do operador)' },
]

export const ORIGENS_CATALOGO: LeadOption[] = [
  { value: 'parceira', label: 'Construtora parceira' },
  { value: 'proprio', label: 'Produto próprio' },
]

/** Mesmas etapas do funil; rótulos mudam conforme a operação. */
const ETAPA_LABEL_ALUGUEL: Record<EtapaFunil, string> = {
  lead: 'Lead',
  analise: 'Análise de documentos',
  aprovado: 'Aprovado (interno)',
  especulativo: 'Especulativo',
  realizado: 'Contrato assinado',
  reprovado: 'Reprovado',
  visita: 'Visita ao imóvel',
}

const ETAPA_DESC_ALUGUEL: Record<EtapaFunil, string> = {
  lead: 'Primeiro contato',
  analise: 'Documentos e comprovante de renda',
  aprovado: 'Decisão da diretoria / sócios',
  especulativo: 'Oportunidade futura',
  realizado: 'Contrato assinado',
  reprovado: 'Fora do fluxo ativo',
  visita: 'Imóvel em avaliação',
}

export function isTipoOperacao(value: unknown): value is TipoOperacao {
  return value === 'venda' || value === 'aluguel'
}

export function etapaLabel(etapa: EtapaFunil, operacao: TipoOperacao = 'venda'): string {
  if (operacao === 'aluguel') return ETAPA_LABEL_ALUGUEL[etapa]
  return ETAPAS.find((item) => item.value === etapa)?.label ?? etapa
}

export function etapasPorOperacao(operacao: TipoOperacao): LeadOption[] {
  return ETAPAS.map((item) => ({
    value: item.value,
    label: etapaLabel(item.value as EtapaFunil, operacao),
  }))
}

export function etapaDescricaoKanban(etapa: EtapaFunil, operacao: TipoOperacao): string {
  if (operacao === 'aluguel') return ETAPA_DESC_ALUGUEL[etapa]
  switch (etapa) {
    case 'lead':
      return 'Primeiro contato'
    case 'analise':
      return 'Documentação e perfil'
    case 'aprovado':
      return 'Crédito liberado'
    case 'visita':
      return 'Imóvel em avaliação'
    case 'especulativo':
      return 'Oportunidade futura'
    case 'realizado':
      return 'Venda concluída'
    case 'reprovado':
      return 'Fora do fluxo ativo'
    default:
      return ''
  }
}
