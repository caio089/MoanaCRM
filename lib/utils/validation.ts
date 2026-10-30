/**
 * Validação de dados de leads
 */

import type { Lead, TipoContrato, TipoOperacao, TitularidadeImovel } from '@/lib/types'

export interface ValidationError {
  field: string
  message: string
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  return true
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
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

  const cpf = data.cpf ? String(data.cpf).replace(/\D/g, '') : ''
  if (mode === 'create' || cpf) {
    if (!cpf || !validateCPF(cpf)) {
      errors.push({ field: 'cpf', message: 'CPF inválido' })
    }
  }

  const telefone = data.telefone ? String(data.telefone).replace(/\D/g, '') : ''
  if (mode === 'create' || telefone) {
    if (!telefone || !validatePhone(telefone)) {
      errors.push({ field: 'telefone', message: 'Telefone inválido' })
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

  return {
    nome: data.nome?.trim() || null,
    cpf: data.cpf?.replace(/\D/g, '') || null,
    telefone: data.telefone?.replace(/\D/g, '') || null,
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
