import fs from 'fs'
import path from 'path'
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

async function run() {
  console.log('🚀 Iniciando migração de leads: venda -> aluguel...')

  // 1. Backup de segurança
  console.log('📦 Passo 1: Gerando backup dos leads atuais...')
  const { data: currentLeads, error: fetchErr } = await supabase.from('leads').select('*')
  if (fetchErr) throw new Error(`Falha ao buscar leads: ${fetchErr.message}`)

  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `leads_backup_pre_aluguel_${timestamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(currentLeads, null, 2), 'utf8')
  console.log(`✅ Backup salvo: ${backupFile} (${currentLeads?.length ?? 0} registros)`)

  // 2. Atualizar tipo_operacao para aluguel
  console.log('🔄 Passo 2: Atualizando tipo_operacao para "aluguel"...')
  const { data: updated, error: updateErr } = await supabase
    .from('leads')
    .update({ tipo_operacao: 'aluguel' })
    .eq('tipo_operacao', 'venda')
    .select('id')

  if (updateErr) throw new Error(`Falha na atualização: ${updateErr.message}`)
  console.log(`✅ Registros atualizados nesta execução: ${updated?.length ?? 0}`)

  // 3. Validação final
  console.log('🔍 Passo 3: Verificando contagens no banco de dados...')
  const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  const { count: aluguelCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_operacao', 'aluguel')
  const { count: vendaCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_operacao', 'venda')

  console.log('\n=======================================')
  console.log(`📊 Total de leads no banco: ${totalLeads} (Esperado: 120)`)
  console.log(`🏠 Leads com tipo_operacao = 'aluguel': ${aluguelCount} (Esperado: 120)`)
  console.log(`🏷️ Leads com tipo_operacao = 'venda': ${vendaCount} (Esperado: 0)`)
  console.log('=======================================\n')

  if (totalLeads === 120 && aluguelCount === 120 && vendaCount === 0) {
    console.log('🎉 SUCESSO: Todos os leads foram migrados para aluguel!')
  } else {
    throw new Error('⚠️ Divergência detectada nas contagens pós-migração!')
  }
}

run().catch((err) => {
  console.error('❌ Falha na migração:', err)
  process.exit(1)
})
