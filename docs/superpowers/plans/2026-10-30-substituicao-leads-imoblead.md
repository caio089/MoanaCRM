# Substituição de Leads IMOBLEAD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer backup da base legada de 956 leads, limpar a tabela `leads` no Supabase e importar os 118 registros reais da planilha `IMOBLEAD - MOANA.xlsx`, posicionando 82 leads na Central de Distribuição e 36 na Base Histórica.

**Architecture:** Script TypeScript autônomo executado via `npx tsx` que lê o arquivo Excel com `exceljs`, conecta ao Supabase com `service_role` (ignora RLS), exporta backup em JSON, zera `leads`, normaliza e insere em lote os 118 registros com a classificação acordada no design.

**Tech Stack:** Node.js, TypeScript, `exceljs`, `@supabase/supabase-js`, `dotenv`/`process.loadEnvFile`.

## Global Constraints

- Planilha fonte: `IMOBLEAD - MOANA.xlsx` na raiz do projeto.
- Backup obrigatório prévio em `data/backups/` antes de deletar qualquer dado.
- Total esperado pós-importação: exatamente 118 registros em `leads`.
- Central de Distribuição (`v_leads_central`): exatamente 82 leads (`corretor = null` e `corretor_id = null`).
- Base Histórica: exatamente 36 leads (33 reprovados, 3 realizados) com `corretor = 'Base Histórica'`.

---

### Task 1: Criar Script de Backup e Importação IMOBLEAD

**Files:**
- Create: `scripts/import-imoblead.ts`

**Interfaces:**
- Consumes: `IMOBLEAD - MOANA.xlsx`, `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Produces: `data/backups/leads_backup_pre_imoblead_*.json`, 118 leads inseridos no Supabase.

- [ ] **Step 1: Escrever o script completo `scripts/import-imoblead.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type EtapaFunil = 'lead' | 'analise' | 'aprovado' | 'especulativo' | 'realizado' | 'reprovado' | 'visita'

interface LeadInsert {
  nome: string
  telefone: string | null
  produto: string | null
  criado_em: string
  atualizado_em: string
  etapa: EtapaFunil
  corretor: string | null
  corretor_id: string | null
  origem: string
  tipo_operacao: string
  cidade: string
  observacao: string | null
}

function cleanPhone(raw: unknown): string | null {
  if (!raw) return null
  const cleaned = String(raw).replace(/\D/g, '')
  if (cleaned.length < 8) return null
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned.slice(2)
  }
  return cleaned
}

function cleanText(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null
  const str = String(raw).replace(/\s+/g, ' ').trim()
  return str.length > 0 ? str : null
}

function parseDate(raw: unknown): string {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString()
  }
  if (typeof raw === 'string') {
    const parts = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/)
    if (parts) {
      const [, day, month, year, h = '12', m = '00', s = '00'] = parts
      const d = new Date(Date.UTC(+year, +month - 1, +day, +h, +m, +s))
      if (!isNaN(d.getTime())) return d.toISOString()
    }
  }
  return new Date().toISOString()
}

function mapStatusToEtapa(statusRaw: string | null): { etapa: EtapaFunil; isDistribution: boolean } {
  const norm = (statusRaw ?? '').trim().toLowerCase()
  switch (norm) {
    case 'venda ganha':
      return { etapa: 'realizado', isDistribution: false }
    case 'reprovado':
      return { etapa: 'reprovado', isDistribution: false }
    case 'visita agendada':
      return { etapa: 'visita', isDistribution: true }
    case 'negociação':
    case 'negociacao':
      return { etapa: 'analise', isDistribution: true }
    case 'em atendimento':
    case 'sem atendimento':
    case 'sem interação':
    case 'sem interacao':
    default:
      return { etapa: 'lead', isDistribution: true }
  }
}

async function run() {
  console.log('🚀 Iniciando processo de substituição de leads...')
  const excelPath = path.resolve(process.cwd(), 'IMOBLEAD - MOANA.xlsx')
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Planilha não encontrada em: ${excelPath}`)
  }

  // 1. Backup de segurança
  console.log('📦 Passo 1: Gerando backup dos dados atuais...')
  const { data: existingLeads, error: fetchErr } = await supabase.from('leads').select('*')
  if (fetchErr) throw new Error(`Falha ao ler leads atuais: ${fetchErr.message}`)

  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `leads_backup_pre_imoblead_${timestamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(existingLeads, null, 2), 'utf8')
  console.log(`✅ Backup salvo: ${backupFile} (${existingLeads?.length ?? 0} registros)`)

  // 2. Limpeza da tabela leads
  console.log('🧹 Passo 2: Limpando tabela de leads...')
  const { error: deleteErr } = await supabase.from('leads').delete().neq('id', 'placeholder-safe-delete-all')
  if (deleteErr) throw new Error(`Falha ao limpar tabela leads: ${deleteErr.message}`)
  console.log('✅ Tabela de leads esvaziada.')

  // 3. Leitura e normalização da planilha
  console.log('📖 Passo 3: Lendo e normalizando IMOBLEAD - MOANA.xlsx...')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(excelPath)
  const sheet = wb.getWorksheet('Leads') || wb.worksheets[0]
  if (!sheet) throw new Error('Aba Leads não encontrada no arquivo')

  const leadsToInsert: LeadInsert[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const nome = cleanText(row.getCell(1).value)
    if (!nome) return

    const telefone = cleanPhone(row.getCell(2).value)
    const produto = cleanText(row.getCell(3).value)
    const dataCriacao = parseDate(row.getCell(5).value)
    const statusRaw = cleanText(row.getCell(6).value)
    const notas = cleanText(row.getCell(7).value)

    const { etapa, isDistribution } = mapStatusToEtapa(statusRaw)

    leadsToInsert.push({
      nome,
      telefone,
      produto,
      criado_em: dataCriacao,
      atualizado_em: dataCriacao,
      etapa,
      corretor: isDistribution ? null : 'Base Histórica',
      corretor_id: null,
      origem: 'Imoblead',
      tipo_operacao: 'venda',
      cidade: 'Teresina',
      observacao: notas,
    })
  })

  console.log(`Total de leads processados da planilha: ${leadsToInsert.length}`)

  // 4. Inserção em lote no Supabase
  console.log('💾 Passo 4: Inserindo registros no banco de dados...')
  const BATCH_SIZE = 50
  for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    const batch = leadsToInsert.slice(i, i + BATCH_SIZE)
    const { error: insertErr } = await supabase.from('leads').insert(batch)
    if (insertErr) throw new Error(`Erro ao inserir lote ${i}-${i + batch.length}: ${insertErr.message}`)
  }
  console.log('✅ Todos os registros foram inseridos com sucesso!')

  // 5. Verificação e contagens
  console.log('🔍 Passo 5: Verificação final...')
  const { count: totalCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  const { count: poolCount } = await supabase.from('v_leads_central').select('*', { count: 'exact', head: true })
  const { count: historicCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('corretor', 'Base Histórica')

  console.log('\n=======================================')
  console.log(`📊 Total de leads no banco: ${totalCount} (Esperado: 118)`)
  console.log(`🎯 Leads na Central de Distribuição: ${poolCount} (Esperado: 82)`)
  console.log(`📁 Leads na Base Histórica: ${historicCount} (Esperado: 36)`)
  console.log('=======================================\n')

  if (totalCount === 118 && poolCount === 82 && historicCount === 36) {
    console.log('🎉 SUCESSO: Todos os critérios foram atendidos!')
  } else {
    console.warn('⚠️ Atenção: As contagens divergiram do esperado. Verifique o banco.')
  }
}

run().catch((err) => {
  console.error('❌ Falha na execução:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Executar o script de importação**

Run: `npx tsx scripts/import-imoblead.ts`
Expected: Total = 118, Central = 82, Histórica = 36.

- [ ] **Step 3: Commit do script e dos arquivos gerados**

```bash
git add scripts/import-imoblead.ts docs/superpowers/plans/2026-10-30-substituicao-leads-imoblead.md
git commit -m "feat: add imoblead import script and run migration"
```

---

### Task 2: Validação no Frontend e Rotas do CRM

**Files:**
- Inspect: `app/(dashboard)/admin/distribuicao/page.tsx`
- Inspect: `lib/services/leads-pool.ts`

- [ ] **Step 1: Testar consulta de leads da central via TypeScript**
Rodar verificação via script para garantir que `listPoolLeads` retorna os 82 leads com campos intactos (`nome`, `telefone`, `produto`, `observacao`).

- [ ] **Step 2: Executar lint / build check**
Run: `npm run lint` ou `npx tsc --noEmit` para garantir que nada foi quebrado.
Expected: 0 errors.
