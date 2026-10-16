// Tipos de domínio do CRM (Postgres / Supabase)

export type EtapaFunil =
  | 'lead'
  | 'analise'
  | 'aprovado'
  | 'especulativo'
  | 'realizado'
  | 'reprovado'
  | 'visita'

export interface Lead extends Record<string, unknown> {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  zona: string | null
  etapa: EtapaFunil
  /** String legada — mantida por 1 release */
  corretor: string | null
  /** String legada — mantida por 1 release */
  coordenador: string | null
  construtora: string | null
  origem: string | null
  /** Empreendimento / produto visitado (ex.: Mio Dirceu) */
  produto: string | null
  /** Bairro da visita (ex.: Dirceu) */
  bairro: string | null
  modalidade: string | null
  tipoRenda: string | null
  comprovacao: string | null
  tipoImovel: string | null
  /** Modalidade do imóvel: novo, usado, aquisição e construção, empreendimento */
  categoriaImovel: string | null
  vgv: number | null
  valorAvaliacao: number | null
  valorFecho: number | null
  chb: number | null
  ccv: boolean
  faturamentoPrevisto: number | null
  /** String legada — mantida por 1 release */
  correspondente: string | null
  situacaoReprovado: string | null
  observacao: string | null
  idImobilead: string | null
  criadoEm: string | Date
  atualizadoEm: string | Date
  /** FK tipada (nullable) */
  coordenadorId?: string | null
  /** FK tipada (nullable) */
  corretorId?: string | null
  /** FK tipada (nullable) */
  correspondenteId?: string | null
}

export type KanbanLead = Pick<
  Lead,
  'id' | 'nome' | 'cidade' | 'etapa' | 'corretor' | 'origem' | 'vgv' | 'telefone'
>

export interface HistoricoEtapa {
  id: number
  leadId: string
  etapaAnterior: EtapaFunil | null
  etapaNova: EtapaFunil
  data: string | Date
}

export interface WebhookLog {
  id: number
  payload: Record<string, unknown>
  processado: boolean
  erro: string | null
  recebidoEm: string | Date
}

/** Cadastro de coordenador de vendas */
export interface Coordenador {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  ativo: boolean
  /** Vínculo com auth.users — login do coordenador */
  userId?: string | null
  criadoEm: string | Date
  atualizadoEm: string | Date
}

/** Cadastro de corretor vinculado a um coordenador */
export interface Corretor {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  ativo: boolean
  coordenadorId: string | null
  /** Vínculo com auth.users — preenchido no self-signup */
  userId: string | null
  criadoEm: string | Date
  atualizadoEm: string | Date
}

/** Correspondente bancário (cadastro admin) */
export interface CorrespondenteBancario {
  id: string
  nome: string
  banco: string | null
  contato: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
  criadoEm: string | Date
  atualizadoEm: string | Date
}

export interface Cidade {
  id: string
  nome: string
  uf: string
  ativo: boolean
  criadoEm: string | Date
  atualizadoEm: string | Date
}

export interface Construtora {
  id: string
  nome: string
  cidade: string | null
  ativo: boolean
  criadoEm: string | Date
  atualizadoEm: string | Date
}

/** Nó da hierarquia: coordenador com seus corretores cadastrados */
export interface CoordenadorComCorretores extends Coordenador {
  corretores: Corretor[]
}

export type TeamHierarchy = CoordenadorComCorretores[]

/** Contagens por etapa do funil (status = etapa) */
export type ContagemPorEtapa = Partial<Record<EtapaFunil, number>> & {
  total: number
}

/** Métricas agregadas por entidade de equipe */
export interface EntidadeMetrics {
  id: string
  nome: string
  totalLeads: number
  porEtapa: ContagemPorEtapa
  especulativo: {
    quantidade: number
    vgv: number
  }
  vgvTotal: number
  vgvRealizado: number
  vgvAprovado: number
}
