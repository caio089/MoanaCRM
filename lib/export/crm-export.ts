'use client'

import { createClient } from '@/lib/supabase/client'
import type { ExcelSheet } from './excel-workbook'

type Row = Record<string, any>

const PAGE_SIZE = 1000

const ETAPA_LABELS: Record<string, string> = {
  lead: 'Lead',
  analise: 'Análise',
  aprovado: 'Aprovado',
  especulativo: 'Especulativo',
  realizado: 'Realizado',
  reprovado: 'Reprovado',
  visita: 'Visita',
}

/**
 * Busca todas as linhas da tabela paginando (o Supabase limita 1000 por request).
 * O RLS do banco garante que cada perfil só recebe o que pode ver.
 */
async function fetchAllRows(table: string, orderBy: string, ascending = true): Promise<Row[]> {
  const client = createClient()
  const rows: Row[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderBy, { ascending })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Falha ao buscar ${table}: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
}

function leadsSheet(leads: Row[]): ExcelSheet<Row> {
  return {
    name: 'Leads',
    rows: leads,
    columns: [
      { header: 'Data de entrada', format: 'datetime', width: 18, value: (r) => r.criado_em },
      { header: 'Nome', width: 32, value: (r) => r.nome },
      { header: 'CPF', format: 'text', width: 16, value: (r) => r.cpf },
      { header: 'Telefone', format: 'text', width: 16, value: (r) => r.telefone },
      { header: 'E-mail', width: 28, value: (r) => r.email },
      { header: 'Etapa', width: 14, value: (r) => ETAPA_LABELS[r.etapa] ?? r.etapa },
      { header: 'Corretor', width: 24, value: (r) => r.corretor },
      { header: 'Coordenador', width: 24, value: (r) => r.coordenador },
      { header: 'Cidade', width: 18, value: (r) => r.cidade },
      { header: 'Bairro', width: 18, value: (r) => r.bairro },
      { header: 'Zona', width: 12, value: (r) => r.zona },
      { header: 'Origem', width: 18, value: (r) => r.origem },
      { header: 'Construtora', width: 22, value: (r) => r.construtora },
      { header: 'Produto', width: 18, value: (r) => r.produto },
      { header: 'Modalidade financiamento', width: 18, value: (r) => r.modalidade },
      { header: 'Modalidade do imóvel', width: 20, value: (r) => r.categoria_imovel },
      { header: 'Tipo de renda', width: 16, value: (r) => r.tipo_renda },
      { header: 'Comprovação', width: 16, value: (r) => r.comprovacao },
      { header: 'Tipo de imóvel', width: 16, value: (r) => r.tipo_imovel },
      { header: 'VGV', format: 'currency', width: 16, value: (r) => r.vgv },
      { header: 'Valor avaliação', format: 'currency', width: 16, value: (r) => r.valor_avaliacao },
      { header: 'Valor fechamento', format: 'currency', width: 16, value: (r) => r.valor_fecho },
      { header: 'CHB', format: 'currency', width: 14, value: (r) => r.chb },
      { header: 'CCV', format: 'boolean', width: 8, value: (r) => r.ccv },
      { header: 'Faturamento previsto', format: 'currency', width: 18, value: (r) => r.faturamento_previsto },
      { header: 'Correspondente', width: 22, value: (r) => r.correspondente },
      { header: 'Situação reprovado', width: 22, value: (r) => r.situacao_reprovado },
      { header: 'Observação', width: 40, value: (r) => r.observacao },
      { header: 'ID Imobilead', format: 'text', width: 16, value: (r) => r.id_imobilead },
      { header: 'Atualizado em', format: 'datetime', width: 18, value: (r) => r.atualizado_em },
      { header: 'ID', format: 'text', width: 24, value: (r) => r.id },
    ],
  }
}

function corretoresSheet(corretores: Row[], coordenadores: Row[]): ExcelSheet<Row> {
  const coordenadorNome = new Map(coordenadores.map((c) => [c.id, c.nome]))
  return {
    name: 'Corretores',
    rows: corretores,
    columns: [
      { header: 'Nome', width: 32, value: (r) => r.nome },
      { header: 'E-mail', width: 32, value: (r) => r.email },
      { header: 'Telefone', format: 'text', width: 16, value: (r) => r.telefone },
      { header: 'Coordenador', width: 24, value: (r) => coordenadorNome.get(r.coordenador_id) ?? '' },
      { header: 'Ativo', format: 'boolean', width: 8, value: (r) => r.ativo },
      { header: 'Tem login', format: 'boolean', width: 10, value: (r) => Boolean(r.user_id) },
      { header: 'Criado em', format: 'datetime', width: 18, value: (r) => r.criado_em },
    ],
  }
}

function coordenadoresSheet(coordenadores: Row[], corretores: Row[]): ExcelSheet<Row> {
  return {
    name: 'Coordenadores',
    rows: coordenadores,
    columns: [
      { header: 'Nome', width: 32, value: (r) => r.nome },
      { header: 'E-mail', width: 32, value: (r) => r.email },
      { header: 'Telefone', format: 'text', width: 16, value: (r) => r.telefone },
      {
        header: 'Qtd. corretores',
        width: 14,
        value: (r) => corretores.filter((c) => c.coordenador_id === r.id).length,
      },
      { header: 'Ativo', format: 'boolean', width: 8, value: (r) => r.ativo },
      { header: 'Criado em', format: 'datetime', width: 18, value: (r) => r.criado_em },
    ],
  }
}

function simpleCatalogSheet(name: string, rows: Row[], extra: ExcelSheet<Row>['columns'] = []): ExcelSheet<Row> {
  return {
    name,
    rows,
    columns: [
      { header: 'Nome', width: 32, value: (r) => r.nome },
      ...extra,
      { header: 'Ativo', format: 'boolean', width: 8, value: (r) => r.ativo },
      { header: 'Criado em', format: 'datetime', width: 18, value: (r) => r.criado_em },
    ],
  }
}

/** Monta as abas do Excel. Admin recebe todos os cadastros; demais perfis só os leads visíveis. */
export async function buildCrmExportSheets(includeCatalogs: boolean): Promise<ExcelSheet<Row>[]> {
  if (!includeCatalogs) {
    const leads = await fetchAllRows('leads', 'criado_em', false)
    return [leadsSheet(leads)]
  }

  const [leads, corretores, coordenadores, cidades, construtoras, correspondentes] = await Promise.all([
    fetchAllRows('leads', 'criado_em', false),
    fetchAllRows('corretores', 'nome'),
    fetchAllRows('coordenadores', 'nome'),
    fetchAllRows('cidades', 'nome'),
    fetchAllRows('construtoras', 'nome'),
    fetchAllRows('correspondentes_bancarios', 'nome'),
  ])

  return [
    leadsSheet(leads),
    corretoresSheet(corretores, coordenadores),
    coordenadoresSheet(coordenadores, corretores),
    simpleCatalogSheet('Cidades', cidades, [{ header: 'UF', width: 6, value: (r) => r.uf }]),
    simpleCatalogSheet('Construtoras', construtoras, [{ header: 'Cidade', width: 20, value: (r) => r.cidade }]),
    simpleCatalogSheet('Correspondentes', correspondentes, [
      { header: 'Banco', width: 20, value: (r) => r.banco },
      { header: 'Contato', width: 20, value: (r) => r.contato },
      { header: 'E-mail', width: 28, value: (r) => r.email },
      { header: 'Telefone', format: 'text', width: 16, value: (r) => r.telefone },
    ]),
  ]
}
