# Data de Origem, Telefone Internacional e CPF Opcional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o campo "Data de origem" (data do primeiro contato), tornar telefone obrigatório com caracteres livres para números internacionais (+31, etc.), tornar CPF opcional nos formulários e validações, e corrigir a exibição de campos snake_case ("Não informado") na tela de detalhes do lead.

**Architecture:** 
1. Atualizar schema/tipos (`public.leads` com coluna `data_origem date`, interface `Lead` com `dataOrigem`/`data_origem`).
2. Corrigir mapeamento bidirecional em `dualCaseRow` para converter automaticamente `snake_case` do Postgres para `camelCase` (resolvendo `criadoEm`, `atualizadoEm`, `tipoRenda`, etc.).
3. Ajustar validações (`validateCPF`, `validatePhone`, `validateLead`, `normalizeLeadData`) e utilitário WhatsApp para suportar formato internacional.
4. Atualizar os formulários de criação/edição (`QuickAddLeadModal`, `CreateLeadForm`, `EditLeadModal`, `ModalNovoLead`, `AdminClient`) e a página de detalhes do cliente (`clientes/[id]/page.tsx`).

**Tech Stack:** Next.js 14, React 18, TypeScript, Supabase (@supabase/supabase-js), Tailwind CSS.

## Global Constraints
- Do NOT use mock data anywhere; always use real DB data.
- Telefone must remain mandatory (`obrigatório`), but with open characters for international support (e.g. +31 6 12345678).
- CPF must be optional (`opcional`).
- Follow established code style, clean architecture, and TypeScript strict checks.

---

### Task 1: Migration SQL e Atualização de Tipos

**Files:**
- Create: `supabase/migrations/20261105190000_add_data_origem_to_leads.sql`
- Modify: `supabase/schema_complete.sql`
- Modify: `lib/types.ts`
- Modify: `lib/query/columns.ts`

**Interfaces:**
- Produces: `Lead.dataOrigem?: string | Date | null`, `Lead.data_origem?: string | Date | null`
- Produces: `CAMEL_TO_SNAKE.dataOrigem = 'data_origem'`
- Produces: `dualCaseRow` bidirecional (suporta snake->camel e camel->snake)

- [x] **Step 1: Criar migration SQL `20261105190000_add_data_origem_to_leads.sql`**
- [x] **Step 2: Atualizar `supabase/schema_complete.sql`**
- [x] **Step 3: Atualizar `lib/types.ts`**
- [x] **Step 4: Atualizar `lib/query/columns.ts`**
- [x] **Step 5: Testar `dualCaseRow` com script de verificação**

---

### Task 2: Validações, Normalização e WhatsApp Internacional

**Files:**
- Modify: `lib/utils/validation.ts`
- Modify: `lib/utils/whatsapp.ts`
- Create: `scripts/test-validation.ts`

**Interfaces:**
- Produces: `validateCPF(cpf: string | null | undefined): boolean` (verdadeiro se vazio; se preenchido, valida 11 dígitos)
- Produces: `validatePhone(phone: string): boolean` (obrigatório, aceita `+`, espaços, traços, 7 a 20 dígitos)
- Produces: `toWhatsAppNumber(phone: string): string | null` (preserva DDI internacional se começar com `+` ou outro DDI)
- Produces: `normalizeLeadData(data: any): Partial<Lead>` (preserva `+` e formatação internacional de telefone, inclui `dataOrigem`)

- [x] **Step 1: Escrever teste de validação e WhatsApp em `scripts/test-validation.ts`**
- [x] **Step 2: Atualizar `lib/utils/validation.ts`**
- [x] **Step 3: Atualizar `lib/utils/whatsapp.ts`**
- [x] **Step 4: Executar testes com `npx tsx scripts/test-validation.ts`**

---

### Task 3: Integração no Serviço de Leads (`lib/services/leads.ts`)

**Files:**
- Modify: `lib/services/leads.ts`

**Interfaces:**
- Consumes: `dualCaseRow` de `lib/query/columns.ts`
- Produces: `getLeadById`, `getLeadsWithFilters` retornando leads com propriedades dual-case (`criadoEm`, `dataOrigem`, `tipoRenda`, etc.).
- Produces: `createLead` e `updateLead` com tratamento resiliente caso `data_origem` ainda não exista no schema remoto do Supabase.

- [x] **Step 1: Aplicar `dualCaseRow` em `getLeadById` e `getLeadsWithFilters`**
- [x] **Step 2: Adicionar fallback resiliente em `createLead` e `updateLead`**
- [x] **Step 3: Verificar build / tipos com `npx tsc --noEmit`**

---

### Task 4: Formulários de Criação e Edição de Leads

**Files:**
- Modify: `components/leads/QuickAddLeadModal.tsx`
- Modify: `components/leads/CreateLeadForm.tsx`
- Modify: `components/leads/EditLeadModal.tsx`
- Modify: `components/admin/ModalNovoLead.tsx`
- Modify: `components/admin/AdminClient.tsx`

**Interfaces:**
- Consumes: `dataOrigem` no estado do formulário
- Produces: Campo "Data de origem (primeiro contato)" do tipo date
- Produces: Campo CPF sem marcação de obrigatório e placeholder indicando "(opcional)"
- Produces: Campo Telefone obrigatório com placeholder informativo internacional ("Ex: +55 (86) 98888-8888 ou +31 6 12345678")

- [x] **Step 1: Atualizar `QuickAddLeadModal.tsx`**
- [x] **Step 2: Atualizar `CreateLeadForm.tsx`**
- [x] **Step 3: Atualizar `EditLeadModal.tsx`**
- [x] **Step 4: Atualizar `ModalNovoLead.tsx` e `AdminClient.tsx`**
- [x] **Step 5: Verificar build com `npx tsc --noEmit`**

---

### Task 5: Tela de Detalhes do Cliente (`app/(dashboard)/clientes/[id]/page.tsx`)

**Files:**
- Modify: `app/(dashboard)/clientes/[id]/page.tsx`

**Interfaces:**
- Consumes: `lead.dataOrigem` ou `lead.data_origem`
- Produces: Exibição formatada de "Data de origem"
- Produces: Exibição correta de `Criado em`, `Atualizado em`, `Tipo de renda`, `Comprovação`, etc. (sem exibir "Não informado" indevidamente)

- [x] **Step 1: Atualizar função `formatDate` e adicionar `formatDateOnly`**
- [x] **Step 2: Adicionar InfoItem "Data de origem"**
- [x] **Step 3: Verificar renderização e ausência de erros**

---

### Task 6: Verificação Completa e Envio para o GitHub

**Files:**
- Test: `npx tsc --noEmit`
- Test: `npm run lint`

- [x] **Step 1: Executar `npx tsc --noEmit`**
- [x] **Step 2: Executar `npm run lint`**
- [x] **Step 3: Limpar arquivos de script temporários**
- [ ] **Step 4: Realizar commit das alterações**
- [ ] **Step 5: Enviar alterações para o GitHub com `git push origin main`**
