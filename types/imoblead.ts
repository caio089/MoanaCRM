export type EtapaFunil =
  | 'lead'
  | 'analise'
  | 'aprovado'
  | 'especulativo'
  | 'realizado'
  | 'reprovado'
  | 'visita'

export interface ImoleadWebhookPayload {
  id: string
  data?: string
  cliente: {
    nome: string
    cpf?: string
    telefone?: string
    cidade?: string
  }
  etapa: EtapaFunil
  corretor?: string
  coordenador?: string
  construtora?: string
  origem?: string
  cidade?: string
  zona?: string
  modalidade?: string
  tipo_renda?: string
  comprovacao?: string
  tipo_imovel?: string
  vgv?: number
  valor_avaliacao?: number
  valor_fecho?: number
  chb?: number
  ccv?: boolean
  faturamento_previsto?: number
  correspondente?: string
  observacao?: string
  situacao_reprovado?: string
}

export interface LeadNormalizado {
  id: string
  nome: string
  cpf?: string
  telefone?: string
  cidade?: string
  zona?: string
  etapa: EtapaFunil
  corretor?: string
  coordenador?: string
  construtora?: string
  origem?: string
  modalidade?: string
  tipoRenda?: string
  comprovacao?: string
  tipoImovel?: string
  vgv?: number
  valorAvaliacao?: number
  valorFecho?: number
  chb?: number
  ccv: boolean
  faturamentoPrevisto?: number
  correspondente?: string
  /** FK resolvida (lookup por nome / create-if-missing) */
  correspondenteId?: string | null
  situacaoReprovado?: string
  observacao?: string
  criadoEm: Date
  atualizadoEm: Date
}
