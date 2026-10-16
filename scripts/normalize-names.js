#!/usr/bin/env node

/**
 * Script para normalizar nomes duplicados no Supabase
 * Padroniza para Title Case e remove duplicatas
 *
 * Uso: node scripts/normalize-names.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis SUPABASE_* não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para normalizar nome
function normalizeName(name) {
  if (!name) return null;

  // Remove espaços extras
  let normalized = name.trim().replace(/\s+/g, ' ');

  // Converte para Title Case (primeira letra maiúscula, resto minúsculo)
  normalized = normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return normalized;
}

async function normalizeColumn(columnName, tableName = 'leads') {
  console.log(`\n🔄 Normalizando coluna "${columnName}" em "${tableName}"...`);

  try {
    // Obter todos os registros
    const { data: records, error: fetchError } = await supabase
      .from(tableName)
      .select(columnName)
      .not(columnName, 'is', null);

    if (fetchError) {
      console.error(`❌ Erro ao buscar dados: ${fetchError.message}`);
      return;
    }

    // Mapear valores únicos
    const uniqueValues = [...new Set(records.map(r => r[columnName]))];
    console.log(`✅ Encontrados ${uniqueValues.length} valores únicos`);

    // Criar mapa de normalização
    const normalizationMap = {};
    uniqueValues.forEach(value => {
      const normalized = normalizeName(value);
      if (value !== normalized) {
        normalizationMap[value] = normalized;
      }
    });

    if (Object.keys(normalizationMap).length === 0) {
      console.log('✅ Nenhuma normalização necessária');
      return;
    }

    console.log(`\n📝 Mapa de normalização (${Object.keys(normalizationMap).length} mudanças):`);
    Object.entries(normalizationMap).forEach(([old, new_]) => {
      console.log(`  "${old}" → "${new_}"`);
    });

    // Aplicar normalizações
    let updated = 0;
    for (const [oldValue, newValue] of Object.entries(normalizationMap)) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [columnName]: newValue })
        .eq(columnName, oldValue);

      if (updateError) {
        console.error(`❌ Erro ao atualizar "${oldValue}": ${updateError.message}`);
      } else {
        updated++;
        process.stdout.write('.');
      }
    }

    console.log(`\n✅ ${updated}/${Object.keys(normalizationMap).length} valores atualizados`);

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Iniciando normalização de nomes...\n');

  const columnsToNormalize = [
    'corretor',
    'coordenador',
    'construtora',
    'origem',
    'cidade',
    'nome',
  ];

  for (const column of columnsToNormalize) {
    await normalizeColumn(column);
  }

  console.log('\n✅ Normalização concluída!');
  console.log('   Filtros agora exibem nomes padronizados');
}

main();
