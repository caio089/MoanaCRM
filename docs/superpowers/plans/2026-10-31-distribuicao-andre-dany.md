# Distribuição de Leads para André e Dany Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Distribuir com precisão os 58 leads da planilha `André - Moana.xlsx` para o corretor André Matos e os 58 leads da planilha `Dany - Moana.xlsx` para a corretora Danielly Mendes, duplicando o cliente compartilhado (`Marcos Manlio De Aguiar Aguiar`).

**Architecture:** Script TypeScript autônomo executado via `npx tsx` que lê ambas as planilhas, conecta ao Supabase via `service_role`, faz backup preventivo, mapeia os registros no banco por telefone e nome, atualiza os dados existentes e insere novos registros quando necessário.

**Tech Stack:** Node.js, TypeScript, `exceljs`, `@supabase/supabase-js`.

## Global Constraints

- Planilhas fontes: `André - Moana.xlsx` e `Dany - Moana.xlsx` na raiz do projeto.
- Backup obrigatório prévio em `data/backups/` antes de qualquer mutação.
- IDs dos corretores no Supabase:
  - André Matos: `cb200a53-8a6d-4fe5-ab4b-da370d059863`
  - Danielly Mendes: `b4ce1bcf-70f4-4f23-baac-3079eadb73a0`
- Contagem final esperada: 119 leads (58 André, 58 Dany, 3 Base Histórica, 0 na Central de Distribuição).

---

### Task 1: Criar Script de Distribuição e Executar

**Files:**
- Create: `scripts/distribute-andre-dany.ts`

**Interfaces:**
- Consumes: `André - Moana.xlsx`, `Dany - Moana.xlsx`, `.env.local`.
- Produces: `data/backups/leads_backup_pre_distribution_*.json`, 119 leads atualizados/inseridos no Supabase.

- [ ] **Step 1: Escrever o script completo `scripts/distribute-andre-dany.ts`**
- [ ] **Step 2: Executar o script de distribuição via `npx tsx`**
- [ ] **Step 3: Commit do script**

---

### Task 2: Auditoria e Validação de Integridade

- [ ] **Step 1: Verificar contagens e carteiras de André e Dany no banco**
- [ ] **Step 2: Rodar lint e typecheck**
