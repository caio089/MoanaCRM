import { NextRequest, NextResponse } from 'next/server'
import { processImobiLeadWebhook } from '@/lib/services/imobilead'
import { createAnonClient } from '@/lib/supabase/anon'

const ETAPA_ENUM = new Set([
  'lead',
  'analise',
  'aprovado',
  'especulativo',
  'realizado',
  'reprovado',
  'visita',
])

function toEtapaEnum(raw: string | undefined | null): string {
  if (!raw) return 'lead'
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const map: Record<string, string> = {
    lead: 'lead',
    leads: 'lead',
    novo: 'lead',
    analise: 'analise',
    'em_analise': 'analise',
    aprovado: 'aprovado',
    qualificado: 'aprovado',
    especulativo: 'especulativo',
    realizado: 'realizado',
    reprovado: 'reprovado',
    descartado: 'reprovado',
    visita: 'visita',
  }

  const etapa = map[normalized] ?? normalized
  return ETAPA_ENUM.has(etapa) ? etapa : 'lead'
}

export async function POST(request: NextRequest) {
  const supabase = createAnonClient()
  let rawPayload: unknown

  try {
    rawPayload = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  try {
    const data = rawPayload as Record<string, unknown>

    if (!data?.id) {
      await supabase.rpc('ingest_webhook_log', {
        p_payload: rawPayload,
        p_erro: 'ID do lead é obrigatório',
      })
      return NextResponse.json({ error: 'ID do lead é obrigatório' }, { status: 400 })
    }

    const mappedLead = await processImobiLeadWebhook(data as Parameters<typeof processImobiLeadWebhook>[0])

    const correspondenteNome =
      typeof data.correspondente === 'string' ? data.correspondente.trim() : null
    const corretorNome =
      typeof data.corretor === 'string' ? data.corretor : null
    const coordenadorNome =
      typeof data.coordenador === 'string' ? data.coordenador : null

    const [{ data: corrRows }, { data: equipeRows }] = await Promise.all([
      correspondenteNome
        ? supabase.rpc('resolve_correspondente_nome', { p_nome: correspondenteNome })
        : Promise.resolve({ data: null }),
      supabase.rpc('resolve_equipe_por_nome', {
        p_corretor: corretorNome,
        p_coordenador: coordenadorNome,
      }),
    ])

    const corr = Array.isArray(corrRows) ? corrRows[0] : corrRows
    const equipe = Array.isArray(equipeRows) ? equipeRows[0] : equipeRows

    const leadId = String(data.id)
    const etapa = toEtapaEnum(mappedLead.etapa_funil)

    const pLead = {
      id: leadId,
      id_imobilead: mappedLead.id_imobilead ?? leadId,
      nome: mappedLead.nome || 'Sem nome',
      telefone: mappedLead.telefone || null,
      email: mappedLead.email || null,
      etapa,
      vgv: mappedLead.valor_imovel ?? null,
      corretor: corretorNome,
      coordenador: coordenadorNome,
      correspondente: corr?.nome ?? correspondenteNome,
      correspondente_id: corr?.id ?? null,
      corretor_id: equipe?.corretor_id ?? null,
      coordenador_id: equipe?.coordenador_id ?? null,
      atualizado_em: new Date().toISOString(),
      criado_em: new Date().toISOString(),
    }

    const { data: upsertedId, error: upsertError } = await supabase.rpc(
      'upsert_lead_from_webhook',
      { p_lead: pLead },
    )

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    await supabase.rpc('ingest_webhook_log', {
      p_payload: rawPayload,
      p_erro: null,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Lead sincronizado',
        data: { id: upsertedId ?? leadId },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Erro no webhook ImobileLead:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'

    try {
      await supabase.rpc('ingest_webhook_log', {
        p_payload: rawPayload,
        p_erro: message,
      })
    } catch {
      // logging best-effort
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar webhook',
        details: message,
      },
      { status: 500 },
    )
  }
}
