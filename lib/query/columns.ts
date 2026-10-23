const CAMEL_TO_SNAKE: Record<string, string> = {
  tipoRenda: 'tipo_renda',
  tipoImovel: 'tipo_imovel',
  categoriaImovel: 'categoria_imovel',
  valorAvaliacao: 'valor_avaliacao',
  valorFecho: 'valor_fecho',
  faturamentoPrevisto: 'faturamento_previsto',
  situacaoReprovado: 'situacao_reprovado',
  criadoEm: 'criado_em',
  atualizadoEm: 'atualizado_em',
  idImobilead: 'id_imobilead',
  leadId: 'lead_id',
  etapaAnterior: 'etapa_anterior',
  etapaNova: 'etapa_nova',
  recebidoEm: 'recebido_em',
  passwordHash: 'password_hash',
  createdAt: 'created_at',
  coordenadorId: 'coordenador_id',
  corretorId: 'corretor_id',
  correspondenteId: 'correspondente_id',
  userId: 'user_id',
  tipoOperacao: 'tipo_operacao',
  tipoContrato: 'tipo_contrato',
  valorLocacaoMensal: 'valor_locacao_mensal',
  titularidade: 'titularidade',
  prazoContratoMeses: 'prazo_contrato_meses',
  bairroId: 'bairro_id',
  cidadeId: 'cidade_id',
  origemCatalogo: 'origem_catalogo',
}

const SNAKE_TO_CAMEL = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([camel, snake]) => [snake, camel]),
)

const ALIASES: Record<string, string> = {
  data_entrada: 'criadoEm',
  dataEntrada: 'criadoEm',
  etapa_funil: 'etapa',
  valor_imovel: 'vgv',
  tipo: 'tipoImovel',
  user_id: 'id',
}

const KNOWN_LEAD_FIELDS = new Set([
  'id',
  'nome',
  'cpf',
  'telefone',
  'email',
  'cidade',
  'zona',
  'etapa',
  'corretor',
  'coordenador',
  'construtora',
  'origem',
  'produto',
  'bairro',
  'modalidade',
  'tipoRenda',
  'comprovacao',
  'tipoImovel',
  'categoriaImovel',
  'vgv',
  'valorAvaliacao',
  'valorFecho',
  'chb',
  'ccv',
  'faturamentoPrevisto',
  'correspondente',
  'situacaoReprovado',
  'observacao',
  'idImobilead',
  'criadoEm',
  'atualizadoEm',
  'coordenadorId',
  'corretorId',
  'correspondenteId',
  'tipoOperacao',
  'tipoContrato',
  'valorLocacaoMensal',
  'titularidade',
  'prazoContratoMeses',
  'bairroId',
])

/** Campos permitidos em inserts/updates de equipe / correspondentes */
const KNOWN_TEAM_FIELDS = new Set([
  'id',
  'nome',
  'email',
  'telefone',
  'ativo',
  'coordenadorId',
  'userId',
  'banco',
  'contato',
  'criadoEm',
  'atualizadoEm',
])

/** Campos de historico_etapas (nunca inclui dados de users) */
const KNOWN_HISTORICO_FIELDS = new Set([
  'id',
  'leadId',
  'etapaAnterior',
  'etapaNova',
  'data',
])

/** Campos de webhook_logs */
const KNOWN_WEBHOOK_FIELDS = new Set([
  'id',
  'payload',
  'processado',
  'erro',
  'recebidoEm',
])

/**
 * Campos sensíveis de autenticação/privilégio — NUNCA graváveis via /api/db,
 * independentemente da tabela.
 */
const DENIED_WRITE_FIELDS = new Set([
  'role',
  'passwordHash',
  'password_hash',
  'name', // User.name — leads/equipe usam `nome`
  'createdAt',
  'created_at',
])

const TEAM_TABLES = new Set([
  'coordenadores',
  'corretores',
  'correspondentes_bancarios',
  'correspondentes',
  'cidades',
  'construtoras',
  'bairros',
])

const KNOWN_CATALOG_FIELDS = new Set([
  'id',
  'nome',
  'uf',
  'cidade',
  'cidadeId',
  'origemCatalogo',
  'ativo',
  'criadoEm',
  'atualizadoEm',
])

const USER_TABLES = new Set(['users', 'admin_users'])

export function isUserTable(table: string): boolean {
  return USER_TABLES.has(table)
}

export function isTeamTable(table: string): boolean {
  return TEAM_TABLES.has(table)
}

export function toPrismaField(column: string): string {
  if (ALIASES[column]) return ALIASES[column]
  if (SNAKE_TO_CAMEL[column]) return SNAKE_TO_CAMEL[column]
  return column
}

export function toSnakeCase(field: string): string {
  return CAMEL_TO_SNAKE[field] ?? field
}

export function isKnownLeadField(field: string): boolean {
  return KNOWN_LEAD_FIELDS.has(field)
}

/**
 * Valida se um campo pode ser escrito via executor genérico, escopado por tabela.
 * Campos sensíveis de users (role, passwordHash, name, …) são sempre negados.
 */
export function isKnownWritableField(field: string, table: string): boolean {
  if (DENIED_WRITE_FIELDS.has(field)) {
    return false
  }

  // users: nenhuma escrita via /api/db (bloqueio reforçado no executor)
  if (USER_TABLES.has(table)) {
    return false
  }

  if (table === 'leads') {
    return KNOWN_LEAD_FIELDS.has(field)
  }

  if (TEAM_TABLES.has(table)) {
    if (table === 'cidades' || table === 'construtoras' || table === 'bairros') {
      return KNOWN_CATALOG_FIELDS.has(field)
    }
    return KNOWN_TEAM_FIELDS.has(field)
  }

  if (table === 'historico_etapas') {
    return KNOWN_HISTORICO_FIELDS.has(field)
  }

  if (table === 'webhook_logs') {
    return KNOWN_WEBHOOK_FIELDS.has(field)
  }

  return false
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  if (value instanceof Date) return value.toISOString()
  return value
}

const OUTPUT_ALIASES: Record<string, string[]> = {
  tipoImovel: ['tipo'],
  criadoEm: ['data_entrada', 'dataEntrada'],
  etapa: ['etapa_funil'],
  vgv: ['valor_imovel'],
  idImobilead: ['id_imobilead'],
  coordenadorId: ['coordenador_id'],
  corretorId: ['corretor_id'],
  correspondenteId: ['correspondente_id'],
}

export function dualCaseRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, raw] of Object.entries(row)) {
    const value = serializeValue(raw)
    result[key] = value
    const snake = toSnakeCase(key)
    if (snake !== key) result[snake] = value
    for (const alias of OUTPUT_ALIASES[key] ?? []) {
      result[alias] = value
    }
  }

  return result
}
