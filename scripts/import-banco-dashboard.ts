/**
 * Carrega a planilha "Banco de Dados - Dashboard" no staging (linhas brutas de cada aba).
 * A consolidação (1 lead por pessoa) e a importação acontecem no banco:
 *   view   public.v_import_leads_consolidado
 *   função public.importar_leads_staging(lote)
 *
 * Uso:
 *   IMPORT_ADMIN_EMAIL=... IMPORT_ADMIN_PASSWORD=... \
 *   npx tsx scripts/import-banco-dashboard.ts caminho/planilha.xlsx [--importar]
 *
 * Sem --importar só carrega o staging (para conferir antes).
 */
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')

const LOTE = 'banco-dashboard-2025'
const BATCH_SIZE = 500
const MIN_DATE = new Date('2024-01-01')

type Etapa = 'lead' | 'analise' | 'aprovado' | 'especulativo' | 'realizado' | 'reprovado' | 'visita'

const SHEET_ETAPA: Record<string, Etapa> = {
  'LEADS (TODOS)': 'lead',
  ANALISE: 'analise',
  APROVADOS: 'aprovado',
  REPROVADO: 'reprovado',
  ESPECULATIVO: 'especulativo',
  REALIZADO: 'realizado',
  VISITAS: 'visita',
}

/** Cabeçalho normalizado da planilha → coluna do staging */
const HEADER_MAP: Record<string, string> = {
  data: 'data_entrada',
  cliente: 'nome',
  cpf: 'cpf',
  telefone: 'telefone',
  email: 'email',
  cidade: 'cidade',
  zona: 'zona',
  origem: 'origem',
  'origem do lead': 'origem',
  corretor: 'corretor_raw',
  construtora: 'construtora',
  modalidade: 'modalidade',
  'tipo de renda': 'tipo_renda',
  'comprovacao de renda': 'comprovacao',
  tipo: 'tipo_imovel',
  correspondente: 'correspondente',
  observacao: 'observacao',
  vgv: 'vgv',
  avaliacao: 'valor_avaliacao',
  'valor avaliado': 'valor_avaliacao',
  'valor fechado': 'valor_fecho',
  'valor do imovel': 'valor_fecho',
  'ccv assinado': 'ccv',
}

const NUMERIC_COLUMNS = new Set(['vgv', 'valor_avaliacao', 'valor_fecho'])
const PLACEHOLDERS = new Set(['', '.', '-', '--', 'nome', 'telefone', 'n/a'])
const IGNORED_NAMES = new Set(['nome', 'teste'])

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extrai o valor "cru" da célula (fórmulas, rich text, hyperlinks). */
function cellValue(raw: ExcelJS.CellValue): unknown {
  if (raw && typeof raw === 'object' && !(raw instanceof Date)) {
    if ('result' in raw) return raw.result
    if ('richText' in raw) return raw.richText.map((part) => part.text).join('')
    if ('text' in raw) return raw.text
    if ('error' in raw) return null
  }
  return raw
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).replace(/\s+/g, ' ').trim()
  return PLACEHOLDERS.has(text.toLowerCase()) ? null : text
}

function toDate(value: unknown): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null
  // Datas fora do período real da operação são erros de digitação
  if (value < MIN_DATE || value > new Date()) return null
  return value.toISOString().slice(0, 10)
}

function toNumber(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d,.-]/g, '').replace(',', '.'))
  // Valores muito baixos (ex.: "5") não são valores de imóvel
  return Number.isFinite(amount) && amount >= 1000 ? amount : null
}

function parseRow(columns: (string | null)[], row: ExcelJS.Row): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  columns.forEach((column, index) => {
    if (!column || record[column] != null) return
    const value = cellValue(row.getCell(index + 1).value)
    if (column === 'data_entrada') record[column] = toDate(value)
    else if (NUMERIC_COLUMNS.has(column)) record[column] = toNumber(value)
    else if (column === 'ccv') record[column] = toText(value)?.toLowerCase().startsWith('s') ?? null
    else record[column] = toText(value)
  })
  return record
}

async function readStagingRows(filePath: string) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const rows: Record<string, unknown>[] = []

  workbook.eachSheet((sheet) => {
    const etapa = SHEET_ETAPA[sheet.name.trim().toUpperCase()]
    if (!etapa) {
      console.warn(`Aba ignorada: ${sheet.name}`)
      return
    }

    const headerRow = sheet.getRow(1)
    const columns = Array.from({ length: headerRow.cellCount }, (_, i) =>
      HEADER_MAP[normalizeHeader(cellValue(headerRow.getCell(i + 1).value))] ?? null,
    )

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const record = parseRow(columns, row)
      const nome = record.nome as string | null
      if (!nome || IGNORED_NAMES.has(nome.toLowerCase())) return
      rows.push({ ...record, lote: LOTE, aba: sheet.name.trim(), linha: rowNumber, etapa })
    })
  })

  return rows
}

async function main() {
  const filePath = process.argv[2]
  const shouldImport = process.argv.includes('--importar')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.IMPORT_ADMIN_EMAIL
  const password = process.env.IMPORT_ADMIN_PASSWORD

  if (!filePath) throw new Error('Informe o caminho da planilha .xlsx')
  if (!url || !anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes no .env.local')
  if (!email || !password) throw new Error('Defina IMPORT_ADMIN_EMAIL e IMPORT_ADMIN_PASSWORD')

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) throw new Error(`Login admin falhou: ${authError.message}`)

  const rows = await readStagingRows(filePath)
  console.log(`Linhas válidas lidas: ${rows.length}`)

  // Recarrega o lote do zero para o script ser idempotente
  const { error: deleteError } = await supabase.from('leads_import_staging').delete().eq('lote', LOTE)
  if (deleteError) throw new Error(`Falha ao limpar staging: ${deleteError.message}`)

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE)
    const { error } = await supabase.from('leads_import_staging').insert(batch)
    if (error) throw new Error(`Falha no lote ${start}-${start + batch.length}: ${error.message}`)
    console.log(`Staging: ${Math.min(start + BATCH_SIZE, rows.length)}/${rows.length}`)
  }

  if (!shouldImport) {
    console.log('Staging carregado. Rode novamente com --importar para gravar em leads.')
    return
  }

  const { data, error } = await supabase.rpc('importar_leads_staging', { p_lote: LOTE })
  if (error) throw new Error(`Falha na importação: ${error.message}`)
  console.log('Resultado:', JSON.stringify(data, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
