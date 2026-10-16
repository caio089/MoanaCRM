import type { ImoleadWebhookPayload, LeadNormalizado } from '@/types/imoblead'
import { resolveCorrespondenteByNomeServer } from '@/lib/services/correspondente-resolve'

export function processarPayload(payload: ImoleadWebhookPayload): LeadNormalizado {
  // Aceita data ausente — usa hora atual como fallback
  const atualizadoEm = payload.data ? new Date(payload.data) : new Date()

  // Loga campos não mapeados para facilitar debug da integração real
  const CAMPOS_CONHECIDOS = new Set([
    'id','data','cliente','etapa','corretor','coordenador','construtora','origem',
    'cidade','zona','modalidade','tipo_renda','comprovacao','tipo_imovel',
    'vgv','valor_avaliacao','valor_fecho','chb','ccv','faturamento_previsto',
    'correspondente','observacao','situacao_reprovado',
  ])
  const extras = Object.keys(payload).filter(k => !CAMPOS_CONHECIDOS.has(k))
  if (extras.length > 0) console.warn('[webhook] Campos extras no payload:', extras)

  return {
    id:                  payload.id,
    nome:                payload.cliente.nome,
    cpf:                 payload.cliente.cpf,
    telefone:            payload.cliente.telefone,
    cidade:              payload.cidade ?? payload.cliente.cidade,
    zona:                payload.zona,
    etapa:               payload.etapa,
    corretor:            payload.corretor,
    coordenador:         payload.coordenador,
    construtora:         payload.construtora,
    origem:              payload.origem,
    modalidade:          payload.modalidade,
    tipoRenda:           payload.tipo_renda,
    comprovacao:         payload.comprovacao,
    tipoImovel:          payload.tipo_imovel,
    vgv:                 payload.vgv,
    valorAvaliacao:      payload.valor_avaliacao,
    valorFecho:          payload.valor_fecho,
    chb:                 payload.chb,
    ccv:                 payload.ccv ?? false,
    faturamentoPrevisto: payload.faturamento_previsto,
    correspondente:      payload.correspondente,
    situacaoReprovado:   payload.situacao_reprovado,
    observacao:          payload.observacao,
    criadoEm:            atualizadoEm,
    atualizadoEm,
  }
}

/**
 * Enriquece o lead normalizado com correspondenteId (lookup only por default).
 * Create só com CORRESPONDENTE_AUTO_CREATE=true. Nunca vincula a inativo.
 */
export async function enrichLeadCorrespondente(
  lead: LeadNormalizado,
): Promise<LeadNormalizado> {
  if (!lead.correspondente) {
    return { ...lead, correspondenteId: lead.correspondenteId ?? null }
  }

  const resolved = await resolveCorrespondenteByNomeServer(lead.correspondente, {
    createIfMissing: false,
  })
  return {
    ...lead,
    correspondente: resolved.correspondente ?? lead.correspondente,
    correspondenteId: resolved.correspondenteId,
  }
}

export function validarPayload(body: unknown): body is ImoleadWebhookPayload {
  if (!body || typeof body !== 'object') return false

  const b = body as Record<string, unknown>

  if (typeof b.id !== 'string' || !b.id) return false
  // data é opcional — fallback para hora atual em processarPayload
  if (b.data !== undefined && typeof b.data !== 'string') return false
  if (!b.cliente || typeof b.cliente !== 'object') return false

  const cliente = b.cliente as Record<string, unknown>
  if (typeof cliente.nome !== 'string' || !cliente.nome) return false

  const etapasValidas = ['lead', 'analise', 'aprovado', 'especulativo', 'realizado', 'reprovado', 'visita']
  if (!etapasValidas.includes(b.etapa as string)) return false

  return true
}
