#!/usr/bin/env node

/**
 * Script para importar dados de leads do CSV para Supabase
 * Uso: node scripts/import-leads.js [arquivo.csv] [--preview] [--clear]
 *
 * Flags:
 * --preview : Mostra 10 primeiros registros sem importar
 * --clear   : Delete existing records before import
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Simple UUID v4 generator
function generateUUID() {
  return crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CSV_FILE = process.argv[2] || 'data/leads_consolidated.csv';
const PREVIEW_MODE = process.argv.includes('--preview');
const CLEAR_MODE = process.argv.includes('--clear');
const BATCH_SIZE = 1000;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis SUPABASE_* não configuradas');
  console.error('   Configure em .env.local (SUPABASE_SECRET_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============= FUNÇÕES DE LIMPEZA =============

function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 ? cleaned : null;
}

function cleanCPF(cpf) {
  if (!cpf || cpf === 'S/CPF' || cpf === '?') return null;
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11 ? cleaned : null;
}

function cleanDate(date) {
  if (!date) return null;
  // Converter DD/MM/YYYY para YYYY-MM-DD
  const [day, month, year] = date.split('/');
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
}

function normalizeEtapa(etapa) {
  if (!etapa) return 'lead';
  const map = {
    'LEADS': 'lead',
    'ANÁLISE': 'analise',
    'ANÁLISES': 'analise',
    'ANALISE': 'analise',
    'APROVADO': 'aprovado',
    'APROVADOS': 'aprovado',
    'ESPECULATIVO': 'especulativo',
    'REALIZADO': 'realizado',
    'REPROVADO': 'reprovado',
    'REPROVADOS': 'reprovado',
    'VISITA': 'visita',
    'VISITAS': 'visita',
  };
  return map[etapa.toUpperCase()] || 'lead';
}

function cleanNumeric(value) {
  if (!value || value === '') return null;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? null : num;
}

function cleanName(name) {
  if (!name || name === '?' || name === 'sem nome' || name === 'sem contato') return null;
  return name.trim() || null;
}

function cleanEmail(email) {
  if (!email) return null;
  const cleaned = email.trim();
  return cleaned.includes('@') ? cleaned : null;
}

// ============= PROCESSAR REGISTRO =============

function processRecord(record, index) {
  try {
    const cleanedName = cleanName(record['Cliente']);
    const processed = {
      id: generateUUID(), // Generate unique UUID for each record
      nome: cleanedName || `Lead ${index}`, // Generate name if empty
      cpf: cleanCPF(record['CPF']),
      telefone: cleanPhone(record['Telefone']),
      cidade: record['Cidade']?.trim() || null,
      construtora: record['Construtora']?.trim() || null,
      corretor: record['Corretor']?.trim() || null,
      coordenador: record['Coordenador']?.trim() || null,
      etapa: normalizeEtapa(record['Etapa']),
      origem: record['Origem']?.trim() || null,
      vgv: cleanNumeric(record['VGV']),
      observacao: record['Observação']?.trim() || null,
    };

    // Validações
    if (!processed.corretor) throw new Error('Corretor é obrigatório');

    return { success: true, data: processed };
  } catch (error) {
    return { success: false, error: error.message, record };
  }
}

// ============= LEITURA DO CSV =============

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let headers = null;
    let lineNum = 0;

    rl.on('line', (line) => {
      lineNum++;

      // Pular linhas vazias
      if (!line.trim()) return;

      // Remover BOM se existir (primeira linha)
      if (lineNum === 1 && line.charCodeAt(0) === 0xFEFF) {
        line = line.slice(1);
      }

      // Parse CSV simples (sem library)
      const fields = parseCSVLine(line);

      if (!headers) {
        headers = fields;
        return;
      }

      if (lineNum > 2) {
        const record = {};
        headers.forEach((header, i) => {
          record[header] = fields[i] || '';
        });
        records.push(record);
      }
    });

    rl.on('error', reject);
    rl.on('close', () => resolve(records));
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && (nextChar === '"' || nextChar === ',' || !nextChar)) {
      if (nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = false;
      }
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// ============= IMPORTAÇÃO =============

async function importLeads() {
  try {
    console.log('🚀 Iniciando importação de leads...\n');

    // Ler CSV
    console.log(`📖 Lendo arquivo: ${CSV_FILE}`);
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`Arquivo não encontrado: ${CSV_FILE}`);
    }

    const records = await readCSV(CSV_FILE);
    console.log(`✅ ${records.length} registros lidos\n`);

    // Processar registros
    console.log('🔧 Processando e limpando dados...');
    const processed = records.map((record, i) => processRecord(record, i));

    const valid = processed.filter(p => p.success);
    const invalid = processed.filter(p => !p.success);

    console.log(`✅ ${valid.length} registros válidos`);
    console.log(`⚠️  ${invalid.length} registros com erro\n`);

    if (invalid.length > 0) {
      console.log('Primeiros 5 erros:');
      invalid.slice(0, 5).forEach(err => {
        console.log(`  - ID: ${err.record['Lead ID']} | Erro: ${err.error}`);
      });
      console.log('');
    }

    // Preview mode
    if (PREVIEW_MODE) {
      console.log('📋 PREVIEW MODE - Primeiros 10 registros:\n');
      valid.slice(0, 10).forEach((item, i) => {
        console.log(`${i + 1}. ${item.data.id_imobilead} | ${item.data.nome} | ${item.data.corretor}`);
      });
      console.log('\nUse sem --preview para importar todos os dados');
      return;
    }

    // Confirmar importação
    if (valid.length === 0) {
      console.error('❌ Nenhum registro válido para importar');
      process.exit(1);
    }

    // Limpar dados existentes se flag --clear
    if (CLEAR_MODE) {
      console.log('\n🗑️  Limpando registros existentes...');
      try {
        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .neq('id', 'null'); // Delete all where id is not null

        if (deleteError) {
          console.log(`⚠️  Aviso ao limpar: ${deleteError.message}`);
        } else {
          console.log('✅ Registros antigos removidos');
        }
      } catch (error) {
        console.log(`⚠️  Erro ao limpar (continuando): ${error.message}`);
      }
    }

    console.log(`\n⏳ Importando ${valid.length} registros para Supabase...`);
    console.log(`   (Em lotes de ${BATCH_SIZE})\n`);

    let imported = 0;
    let errors = 0;

    // Importar em lotes
    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      const batch = valid.slice(i, i + BATCH_SIZE).map(p => p.data);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(valid.length / BATCH_SIZE);

      try {
        process.stdout.write(`   Lote ${batchNum}/${totalBatches}... `);

        const { error } = await supabase
          .from('leads')
          .insert(batch);

        if (error) {
          console.log(`❌ ${error.message}`);
          errors += batch.length;
        } else {
          console.log(`✅`);
          imported += batch.length;
        }
      } catch (error) {
        console.log(`❌ ${error.message}`);
        errors += batch.length;
      }
    }

    console.log(`\n✅ Importação concluída!`);
    console.log(`   Importados: ${imported} registros`);
    console.log(`   Erros: ${errors} registros`);
    console.log(`   Taxa de sucesso: ${((imported / valid.length) * 100).toFixed(1)}%\n`);

    console.log('🎉 Dados disponíveis no dashboard em http://localhost:3000/leads');

  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
    process.exit(1);
  }
}

// Executar
importLeads();
