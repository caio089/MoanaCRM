/**
 * Validação de dados de leads
 */

import type { Lead, TipoContrato, TipoOperacao, TitularidadeImovel } from '@/lib/types'

export interface ValidationError {
  field: string
  message: string
}

export function validateCPF(cpf?: string | null): boolean {
  if (!cpf) return true
  const trimmed = String(cpf).trim()
  if (!trimmed) return true
  const cleaned = trimmed.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  return true
}

export function validatePhone(phone?: string | null): boolean {
  if (!phone) return false
  const str = String(phone).trim()
  if (!str) return false
  // Aceita formatos internacionais e nacionais (+, espaços, hífens, parênteses, pontos)
  if (!/^[\d\s+\-().]{7,30}$/.test(str)) return false
  const digits = str.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 20
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateLead(
  data: any,
  opts?: { mode?: 'create' | 'update' },
): ValidationError[] {
  const mode = opts?.mode ?? 'create'
  const errors: ValidationError[] = []

  if (!data.nome || !data.nome.trim()) {
    errors.push({ field: 'nome', message: 'Nome é obrigatório' })
  }

  // CPF é opcional; se preenchido, deve ser válido
  const rawCpf = data.cpf != null ? String(data.cpf).trim() : ''
  if (rawCpf) {
    if (!validateCPF(rawCpf)) {
      errors.push({ field: 'cpf', message: 'CPF inválido (deve conter 11 dígitos)' })
    }
  }

  // Telefone é obrigatório (caracteres em aberto para aceitar números internacionais)
  const rawTelefone = data.telefone != null ? String(data.telefone).trim() : ''
  if (mode === 'create' || data.telefone !== undefined) {
    if (!rawTelefone || !validatePhone(rawTelefone)) {
      errors.push({ field: 'telefone', message: 'Telefone é obrigatório e deve ser válido' })
    }
  }

  if (mode === 'create') {
    if (!data.cidade || !data.cidade.trim()) {
      errors.push({ field: 'cidade', message: 'Cidade é obrigatória' })
    }

    if (!data.origem || !data.origem.trim()) {
      errors.push({ field: 'origem', message: 'Origem é obrigatória' })
    }

    if (data.tipoOperacao !== 'venda' && data.tipoOperacao !== 'aluguel') {
      errors.push({ field: 'tipoOperacao', message: 'Tipo de operação é obrigatório' })
    }
  }

  if (!data.etapa) {
    errors.push({ field: 'etapa', message: 'Etapa é obrigatória' })
  }

  return errors
}

export function normalizeLeadData(data: any): Partial<Lead> {
  const toNumber = (value: unknown): number | null => {
    if (value === '' || value == null) return null
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }

  const formatTelefone = (tel: unknown): string | null => {
    if (tel == null) return null
    const str = String(tel).trim()
    return str || null
  }

  const formatCpf = (cpf: unknown): string | null => {
    if (cpf == null) return null
    const cleaned = String(cpf).replace(/\D/g, '')
    return cleaned || null
  }

  return {
    nome: data.nome?.trim() || null,
    cpf: formatCpf(data.cpf),
    telefone: formatTelefone(data.telefone),
    dataOrigem: data.dataOrigem || data.data_origem || null,
    cidade: data.cidade?.trim() || null,
    zona: data.zona?.trim() || null,
    corretor: data.corretor?.trim() || null,
    corretorId: data.corretorId || null,
    coordenador: data.coordenador?.trim() || null,
    coordenadorId: data.coordenadorId || null,
    construtora: data.construtora?.trim() || null,
    origem: data.origem?.trim() || null,
    produto: data.produto?.trim() || null,
    bairro: data.bairro?.trim() || null,
    etapa: data.etapa || 'lead',
    observacao: data.observacao?.trim() || null,
    correspondente: data.correspondente?.trim() || null,
    correspondenteId: data.correspondenteId || null,
    modalidade: data.modalidade?.trim() || null,
    tipoRenda: data.tipoRenda?.trim() || null,
    comprovacao: data.comprovacao?.trim() || null,
    tipoImovel: data.tipoImovel?.trim() || null,
    categoriaImovel: data.categoriaImovel?.trim() || null,
    vgv: toNumber(data.vgv),
    valorAvaliacao: toNumber(data.valorAvaliacao),
    valorFecho: toNumber(data.valorFecho),
    chb: toNumber(data.chb),
    faturamentoPrevisto: toNumber(data.faturamentoPrevisto),
    situacaoReprovado: data.situacaoReprovado?.trim() || null,
    ccv: Boolean(data.ccv),
    tipoOperacao: (data.tipoOperacao === 'aluguel' ? 'aluguel' : 'venda') as TipoOperacao,
    tipoContrato: (data.tipoContrato?.trim() || null) as TipoContrato | null,
    valorLocacaoMensal: toNumber(data.valorLocacaoMensal),
    titularidade: (data.titularidade?.trim() || null) as TitularidadeImovel | null,
    prazoContratoMeses: toNumber(data.prazoContratoMeses) ?? 12,
    bairroId: data.bairroId || null,
  }
}
