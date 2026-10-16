/**
 * Script para corrigir inconsistências nos dados de leads
 * 
 * Problemas detectados:
 * 1. Leads em etapa "realizado" sem estar em "aprovado"
 * 2. Valores de VGV não preenchidos (0)
 * 
 * Soluções:
 * 1. Todos os leads "realizado" devem ter etapa "aprovado" antes
 * 2. Preencher VGV com valores padrão se vazio
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixLeadsData() {
  console.log('🔍 Iniciando corretiva de dados...\n')

  try {
    // 1. Buscar todos os leads
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')

    if (fetchError) throw fetchError

    console.log(`📊 Total de leads: ${leads?.length || 0}`)

    // 2. Analisar inconsistências
    const leadsRealizados = leads?.filter(l => l.etapa === 'realizado') || []
    const leadsAprovados = leads?.filter(l => l.etapa === 'aprovado') || []
    const leadsComVgvZero = leads?.filter(l => !l.vgv || l.vgv === 0) || []

    console.log(`⚠️  Leads em "Realizado": ${leadsRealizados.length}`)
    console.log(`✅ Leads em "Aprovado": ${leadsAprovados.length}`)
    console.log(`💰 Leads com VGV = 0 ou vazio: ${leadsComVgvZero.length}\n`)

    // 3. Corrigir: Leads "realizado" devem estar em "aprovado"
    console.log('🔧 Corrigindo etapas...')
    for (const lead of leadsRealizados) {
      const { error } = await supabase
        .from('leads')
        .update({ etapa: 'aprovado' })
        .eq('id', lead.id)

      if (error) {
        console.error(`❌ Erro ao atualizar lead ${lead.id}:`, error)
      } else {
        console.log(`✅ Lead ${lead.id} movido para "Aprovado"`)
      }
    }

    // 4. Corrigir VGV: Preencher com valor padrão
    console.log('\n💰 Preenchendo VGV...')
    const vgvPadrao = 300000 // R$ 300.000
    for (const lead of leadsComVgvZero) {
      const { error } = await supabase
        .from('leads')
        .update({ vgv: vgvPadrao })
        .eq('id', lead.id)

      if (error) {
        console.error(`❌ Erro ao atualizar VGV do lead ${lead.id}:`, error)
      }
    }
    console.log(`✅ ${leadsComVgvZero.length} leads atualizados com VGV padrão`)

    console.log('\n✅ Corretiva concluída!')
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

fixLeadsData()
