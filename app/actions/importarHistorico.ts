'use server'

import { getRequestUser } from '@/lib/auth/session'
import { getUserRole } from '@/lib/auth/map-user'
import { createClient } from '@/lib/supabase/server'
import {
  resolveCorrespondenteByNomeServer,
  shouldAutoCreateCorrespondente,
} from '@/lib/services/correspondente-resolve'
import type { EtapaFunil } from '@/lib/types'
import { toSnakeCase } from '@/lib/query/columns'

const ETAPAS_VALIDAS = new Set([
  'lead',
  'analise',
  'aprovado',
  'especulativo',
  'realizado',
  'reprovado',
  'visita',
])

const ETAPA_MAPA: Record<string, string> = {
  leads: 'lead',
  análise: 'analise',
  analises: 'analise',
  aprovados: 'aprovado',
  especulativos: 'especulativo',
  realizados: 'realizado',
  reprovados: 'reprovado',
  visitas: 'visita',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeadRow = Record<string, any>

function parseDecimal(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseDate(v: unknown): string | null {
  if (v == null || v === '') return null
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function parseBool(v: unknown): boolean {
  if (v == null) return false
  const s = String(v).toLowerCase()
  return s === 'true' || s === '1' || s === 'sim' || s === 'yes'
}

function toDbPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    out[toSnakeCase(key)] = value
  }
  return out
}

export async function importarHistorico(
  rows: LeadRow[],
): Promise<{
  inseridos: number
  atualizados: number
  erros: { linha: number; motivo: string }[]
  total: number
}> {
  console.log(`[IMPORT] Iniciando importação via Supabase`)
  console.log(`[IMPORT] Quantidade: ${rows?.length || 0}`)

  if (!Array.isArray(rows) || rows.length === 0) {
    return { inseridos: 0, atualizados: 0, erros: [], total: 0 }
  }

  const user = await getRequestUser()
  if (!user) {
    return {
      inseridos: 0,
      atualizados: 0,
      erros: [{ linha: 0, motivo: 'Sessão expirada. Faça login novamente.' }],
      total: rows.length,
    }
  }

  const supabase = await createClient()
  let inseridos = 0
  let atualizados = 0
  const erros: { linha: number; motivo: string }[] = []
  const correspondenteCache = new Map<string, { id: string; nome: string }>()

  const isAdmin = getUserRole(user) === 'admin'
  const createCorrespondenteIfMissing = isAdmin && shouldAutoCreateCorrespondente()

  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const lote = rows.slice(i, i + BATCH)

    for (let idx = 0; idx < lote.length; idx++) {
      const row = lote[idx]
      const linha = i + idx + 1

      const rowNorm: LeadRow = {}
      for (const [key, value] of Object.entries(row)) {
        rowNorm[key.toLowerCase()] = value
      }

      let id = String(rowNorm.id ?? rowNorm['lead id'] ?? '').trim()
      const nome = String(rowNorm.nome ?? rowNorm.cliente ?? '').trim()
      let etapa = String(rowNorm.etapa ?? '').trim().toLowerCase()

      if (!id || id === 'lead-s/cpf' || id === 'lead-S/CPF') {
        id = `lead-${Date.now()}-${i + idx}`
      }

      if (!nome) {
        erros.push({ linha, motivo: 'nome ausente' })
        continue
      }

      etapa = ETAPA_MAPA[etapa] || etapa

      if (!ETAPAS_VALIDAS.has(etapa)) {
        erros.push({ linha, motivo: `etapa inválida: ${etapa}` })
        continue
      }

      const atualizadoEm =
        parseDate(row.atualizado_em ?? row.atualizadoEm) ?? new Date().toISOString()
      const criadoEm = parseDate(row.criado_em ?? row.criadoEm) ?? atualizadoEm

      try {
        const parcRaw = rowNorm.correspondente ? String(rowNorm.correspondente) : null
        const { correspondente, correspondenteId } = await resolveCorrespondenteByNomeServer(
          parcRaw,
          {
            cache: correspondenteCache,
            createIfMissing: createCorrespondenteIfMissing,
          },
        )

        const data = toDbPayload({
          id,
          nome,
          cpf: rowNorm.cpf ? String(rowNorm.cpf) : null,
          telefone: rowNorm.telefone ? String(rowNorm.telefone) : null,
          cidade: rowNorm.cidade ? String(rowNorm.cidade) : null,
          zona: rowNorm.zona ? String(rowNorm.zona) : null,
          etapa: etapa as EtapaFunil,
          corretor: rowNorm.corretor ? String(rowNorm.corretor) : null,
          coordenador: rowNorm.coordenador ? String(rowNorm.coordenador) : null,
          construtora: rowNorm.construtora ? String(rowNorm.construtora) : null,
          origem:
            rowNorm.origem || rowNorm['origem do lead'] || rowNorm['origemdolead']
              ? String(rowNorm.origem || rowNorm['origem do lead'] || rowNorm['origemdolead'])
              : null,
          modalidade: rowNorm.modalidade ? String(rowNorm.modalidade) : null,
          tipoRenda:
            rowNorm.tipo_renda || rowNorm['tipo de renda']
              ? String(rowNorm.tipo_renda || rowNorm['tipo de renda'])
              : null,
          comprovacao:
            rowNorm.comprovacao || rowNorm['comprovacao de renda']
              ? String(rowNorm.comprovacao || rowNorm['comprovacao de renda'])
              : null,
          tipoImovel:
            rowNorm.tipo_imovel || rowNorm.tipo
              ? String(rowNorm.tipo_imovel || rowNorm.tipo)
              : null,
          vgv: parseDecimal(rowNorm.vgv),
          valorAvaliacao: parseDecimal(rowNorm.valor_avaliacao || rowNorm['valor avaliado']),
          valorFecho: parseDecimal(rowNorm.valor_fecho || rowNorm['valor fechado']),
          chb: parseDecimal(rowNorm.chb),
          ccv: parseBool(rowNorm.ccv || rowNorm['ccv assinado']),
          faturamentoPrevisto: parseDecimal(rowNorm.faturamento_previsto),
          correspondente,
          correspondenteId,
          situacaoReprovado: rowNorm.situacao_reprovado
            ? String(rowNorm.situacao_reprovado)
            : null,
          observacao: rowNorm.observacao ? String(rowNorm.observacao) : null,
          criadoEm,
          atualizadoEm,
        })

        const { data: existing, error: findError } = await supabase
          .from('leads')
          .select('id')
          .eq('id', id)
          .maybeSingle()

        if (findError) throw findError

        if (existing) {
          const updateData = { ...data }
          delete updateData.id
          const { error } = await supabase.from('leads').update(updateData).eq('id', id)
          if (error) throw error
          atualizados++
        } else {
          const { error } = await supabase.from('leads').insert(data)
          if (error) throw error
          inseridos++
        }
      } catch (err) {
        console.error(
          `[IMPORT] Erro na linha ${linha}:`,
          err instanceof Error ? err.message : String(err),
        )
        erros.push({
          linha,
          motivo: err instanceof Error ? err.message : 'Erro desconhecido',
        })
      }
    }
  }

  console.log(
    `[IMPORT] Finalizado: ${inseridos} inseridos, ${atualizados} atualizados, ${erros.length} erros`,
  )

  return { inseridos, atualizados, erros, total: rows.length }
}
