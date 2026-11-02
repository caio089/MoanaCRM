# Migração de Leads para Aluguel - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todos os leads existentes de `venda` para `aluguel` no Supabase com backup prévio de segurança e atualizar os scripts de importação e distribuição para utilizarem `aluguel` por padrão.

**Architecture:** Script TypeScript utilitário com `supabase-js` autenticado via Service Role Key para leitura prévia (gerando snapshot JSON em `data/backups/`), atualização em massa (`tipo_operacao = 'aluguel'`) e validação de contagens. Ajuste fino estático nos scripts `scripts/import-imoblead.ts` e `scripts/distribute-andre-dany.ts`.

**Tech Stack:** TypeScript, Node.js (`tsx`), Supabase JS Client (`@supabase/supabase-js`), Git.

## Global Constraints

- Todos os 120 leads atuais devem ser preservados integralmente, modificando apenas o campo `tipo_operacao`.
- Um backup completo dos registros deve ser gravado em `data/backups/leads_backup_pre_aluguel_<timestamp>.json` antes de qualquer alteração no banco.
- Scripts atualizados devem passar sem erros em `npx tsc --noEmit`.

---

### Task 1: Criar e Executar Script de Migração com Backup

**Files:**
- Create: `scripts/update-leads-to-aluguel.ts`

**Interfaces:**
- Consumes: Tabela `leads` no Supabase (`id`, `tipo_operacao`, etc.).
- Produces: Arquivo de backup em `data/backups/` e atualização dos registros no Supabase para `tipo_operacao = 'aluguel'`.

- [x] **Step 1: Criar o script de migração e validação**

Criar `scripts/update-leads-to-aluguel.ts`:

```typescript
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
```

- [x] **Step 2: Executar o script de migração**

Run: `npx tsx scripts/update-leads-to-aluguel.ts`  
Expected: `🎉 SUCESSO: Todos os leads foram migrados para aluguel!` com 120 aluguel e 0 venda.

- [x] **Step 3: Commit do script de migração**

```bash
git add scripts/update-leads-to-aluguel.ts
git commit -m "feat: add lead migration script to aluguel and execute migration"
```

---

### Task 2: Atualizar Scripts de Automação para Usar 'aluguel'

**Files:**
- Modify: `scripts/import-imoblead.ts`
- Modify: `scripts/distribute-andre-dany.ts`

**Interfaces:**
- Consumes: Tipos e chamadas de insert/update nos scripts de automação.
- Produces: Scripts configurados com `tipo_operacao: 'aluguel'`.

- [x] **Step 1: Atualizar `scripts/import-imoblead.ts`**

Substituir na montagem do lead (`leadsToInsert.push`):
```typescript
      origem: 'Imoblead',
      tipo_operacao: 'aluguel',
      cidade: 'Teresina',
```

- [x] **Step 2: Atualizar `scripts/distribute-andre-dany.ts`**

Localizar todas as atribuições `tipo_operacao: 'venda'` em `scripts/distribute-andre-dany.ts` e alterar para `tipo_operacao: 'aluguel'`.

- [x] **Step 3: Checar tipagem TypeScript de todo o projeto**

Run: `npx tsc --noEmit`  
Expected: Código 0 (sem erros de compilação/tipagem).

- [x] **Step 4: Commit e Push das alterações dos scripts**

```bash
git add scripts/import-imoblead.ts scripts/distribute-andre-dany.ts
git commit -m "feat: default lead operation type to aluguel in import and distribution scripts"
git push origin main
```

