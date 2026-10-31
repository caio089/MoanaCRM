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

const CORRETORES = {
  andre: {
    id: 'cb200a53-8a6d-4fe5-ab4b-da370d059863',
    nome: 'André Matos',
  },
  dany: {
    id: 'b4ce1bcf-70f4-4f23-baac-3079eadb73a0',
    nome: 'Danielly Mendes',
  },
}

type EtapaFunil = 'lead' | 'analise' | 'aprovado' | 'especulativo' | 'realizado' | 'reprovado' | 'visita'

interface LeadDbRow {
  id: string
  nome: string
  telefone: string | null
  criado_em: string
  corretor: string | null
  corretor_id: string | null
  etapa: EtapaFunil
  observacao: string | null
  produto: string | null
}

function generateLeadId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
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

function normalizeKey(str: string | null): string {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
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

function mapStatusToEtapa(statusRaw: string | null): EtapaFunil {
  const norm = normalizeKey(statusRaw)
  switch (norm) {
    case 'venda ganha':
      return 'realizado'
    case 'reprovado':
      return 'reprovado'
    case 'visita agendada':
      return 'visita'
    case 'negociacao':
      return 'analise'
    case 'em atendimento':
    case 'sem atendimento':
    case 'sem interacao':
    default:
      return 'lead'
  }
}

async function run() {
  console.log('🚀 Iniciando processo de distribuição para André Matos e Danielly Mendes...')

  // 1. Backup de segurança
  console.log('📦 Passo 1: Gerando backup dos dados atuais...')
  const { data: currentLeads, error: fetchErr } = await supabase.from('leads').select('*')
  if (fetchErr) throw new Error(`Falha ao ler leads atuais: ${fetchErr.message}`)

  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `leads_backup_pre_distribution_${timestamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(currentLeads, null, 2), 'utf8')
  console.log(`✅ Backup salvo: ${backupFile} (${currentLeads?.length ?? 0} registros)`)

  // 2. Carregar mapa dos leads atuais no DB
  let allDbLeads: LeadDbRow[] = (currentLeads as LeadDbRow[]) ?? []
  const usedLeadIds = new Set<string>()

  // 3. Processar Planilha do André
  console.log('📄 Passo 2: Processando André - Moana.xlsx...')
  const wbAndre = new ExcelJS.Workbook()
  await wbAndre.xlsx.readFile(path.resolve(process.cwd(), 'André - Moana.xlsx'))
  const sheetAndre = wbAndre.getWorksheet('Leads') || wbAndre.worksheets[0]

  let andreUpdated = 0
  let andreCreated = 0

  for (let rowNumber = 2; rowNumber <= sheetAndre.rowCount; rowNumber++) {
    const row = sheetAndre.getRow(rowNumber)
    const nome = cleanText(row.getCell(1).value)
    if (!nome) continue

    const telefone = cleanPhone(row.getCell(2).value)
    const produto = cleanText(row.getCell(3).value)
    const dataCriacao = parseDate(row.getCell(5).value)
    const statusRaw = cleanText(row.getCell(6).value)
    const notas = cleanText(row.getCell(7).value)
    const etapa = mapStatusToEtapa(statusRaw)

    // Tentar localizar match por telefone + nome
    let matchedLead = allDbLeads.find(
      (l) => !usedLeadIds.has(l.id) && cleanPhone(l.telefone) === telefone && normalizeKey(l.nome) === normalizeKey(nome),
    )

    // Se não achou com nome exato, tentar apenas por telefone
    if (!matchedLead && telefone) {
      matchedLead = allDbLeads.find((l) => !usedLeadIds.has(l.id) && cleanPhone(l.telefone) === telefone)
    }

    if (matchedLead) {
      usedLeadIds.add(matchedLead.id)
      const { error: updErr } = await supabase
        .from('leads')
        .update({
          corretor: CORRETORES.andre.nome,
          corretor_id: CORRETORES.andre.id,
          etapa,
          observacao: notas ?? matchedLead.observacao,
          produto: produto ?? matchedLead.produto,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', matchedLead.id)

      if (updErr) throw new Error(`Erro ao atualizar lead do André (${matchedLead.id}): ${updErr.message}`)
      andreUpdated++
    } else {
      // Criar novo lead
      const newId = generateLeadId()
      const { error: insErr } = await supabase.from('leads').insert({
        id: newId,
        nome,
        telefone,
        produto,
        criado_em: dataCriacao,
        atualizado_em: dataCriacao,
        etapa,
        corretor: CORRETORES.andre.nome,
        corretor_id: CORRETORES.andre.id,
        origem: 'Imoblead',
        tipo_operacao: 'venda',
        cidade: 'Teresina',
        observacao: notas,
      })

      if (insErr) throw new Error(`Erro ao inserir lead para o André (${nome}): ${insErr.message}`)
      usedLeadIds.add(newId)
      andreCreated++
    }
  }

  console.log(`✅ André processado: ${andreUpdated} atualizados, ${andreCreated} criados (Total: ${andreUpdated + andreCreated})`)

  // 4. Processar Planilha da Dany
  console.log('📄 Passo 3: Processando Dany - Moana.xlsx...')
  const wbDany = new ExcelJS.Workbook()
  await wbDany.xlsx.readFile(path.resolve(process.cwd(), 'Dany - Moana.xlsx'))
  const sheetDany = wbDany.getWorksheet('Leads') || wbDany.worksheets[0]

  let danyUpdated = 0
  let danyCreated = 0

  for (let rowNumber = 2; rowNumber <= sheetDany.rowCount; rowNumber++) {
    const row = sheetDany.getRow(rowNumber)
    const nome = cleanText(row.getCell(1).value)
    if (!nome) continue

    const telefone = cleanPhone(row.getCell(2).value)
    const produto = cleanText(row.getCell(3).value)
    const dataCriacao = parseDate(row.getCell(5).value)
    const statusRaw = cleanText(row.getCell(6).value)
    const notas = cleanText(row.getCell(7).value)
    const etapa = mapStatusToEtapa(statusRaw)

    // Caso especial: Marcos Manlio De Aguiar Aguiar (duplicar conforme decisão do usuário)
    if (normalizeKey(nome).includes('marcos manlio')) {
      const newId = generateLeadId()
      const { error: insErr } = await supabase.from('leads').insert({
        id: newId,
        nome,
        telefone,
        produto: produto ?? 'URUGUAI V2',
        criado_em: dataCriacao,
        atualizado_em: dataCriacao,
        etapa,
        corretor: CORRETORES.dany.nome,
        corretor_id: CORRETORES.dany.id,
        origem: 'Imoblead',
        tipo_operacao: 'venda',
        cidade: 'Teresina',
        observacao: notas,
      })

      if (insErr) throw new Error(`Erro ao criar cópia de Marcos Manlio para Dany: ${insErr.message}`)
      usedLeadIds.add(newId)
      danyCreated++
      continue
    }

    // Tentar localizar match por telefone + nome
    let matchedLead = allDbLeads.find(
      (l) => !usedLeadIds.has(l.id) && cleanPhone(l.telefone) === telefone && normalizeKey(l.nome) === normalizeKey(nome),
    )

    // Se não achou com nome exato, tentar apenas por telefone
    if (!matchedLead && telefone) {
      matchedLead = allDbLeads.find((l) => !usedLeadIds.has(l.id) && cleanPhone(l.telefone) === telefone)
    }

    if (matchedLead) {
      usedLeadIds.add(matchedLead.id)
      const { error: updErr } = await supabase
        .from('leads')
        .update({
          corretor: CORRETORES.dany.nome,
          corretor_id: CORRETORES.dany.id,
          etapa,
          observacao: notas ?? matchedLead.observacao,
          produto: produto ?? matchedLead.produto,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', matchedLead.id)

      if (updErr) throw new Error(`Erro ao atualizar lead da Dany (${matchedLead.id}): ${updErr.message}`)
      danyUpdated++
    } else {
      // Criar novo lead
      const newId = generateLeadId()
      const { error: insErr } = await supabase.from('leads').insert({
        id: newId,
        nome,
        telefone,
        produto,
        criado_em: dataCriacao,
        atualizado_em: dataCriacao,
        etapa,
        corretor: CORRETORES.dany.nome,
        corretor_id: CORRETORES.dany.id,
        origem: 'Imoblead',
        tipo_operacao: 'venda',
        cidade: 'Teresina',
        observacao: notas,
      })

      if (insErr) throw new Error(`Erro ao inserir lead para Dany (${nome}): ${insErr.message}`)
      usedLeadIds.add(newId)
      danyCreated++
    }
  }

  console.log(`✅ Dany processada: ${danyUpdated} atualizados, ${danyCreated} criados (Total: ${danyUpdated + danyCreated})`)

  // 5. Verificação e Auditoria Final
  console.log('🔍 Passo 4: Verificação final...')
  const { count: totalCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  const { count: andreCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('corretor_id', CORRETORES.andre.id)
  const { count: danyCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('corretor_id', CORRETORES.dany.id)
  const { count: poolCount } = await supabase.from('v_leads_central').select('*', { count: 'exact', head: true })
  const { count: historicCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('corretor', 'Base Histórica')

  console.log('\n=======================================')
  console.log(`📊 Total de leads no banco: ${totalCount} (Esperado: 119)`)
  console.log(`👤 Leads do André Matos: ${andreCount} (Esperado: 58)`)
  console.log(`👤 Leads da Danielly Mendes: ${danyCount} (Esperado: 58)`)
  console.log(`📁 Leads na Base Histórica: ${historicCount} (Esperado: 3)`)
  console.log(`🎯 Leads pendentes na Central: ${poolCount} (Esperado: 0)`)
  console.log('=======================================\n')

  if (totalCount === 119 && andreCount === 58 && danyCount === 58 && historicCount === 3 && poolCount === 0) {
    console.log('🎉 SUCESSO: Todos os leads foram perfeitamente distribuídos conforme acordado!')
  } else {
    console.warn('⚠️ Atenção: Alguma contagem divergiu do esperado.')
  }
}

run().catch((err) => {
  console.error('❌ Falha na execução:', err)
  process.exit(1)
})
