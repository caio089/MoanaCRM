# 📋 Plano: Criar e Editar Leads - v1.2

**Data**: 26 de Junho de 2026  
**Escopo**: 3 funcionalidades de CRUD para leads  
**Tempo Estimado**: 12-16 horas  
**Prioridade**: v1.2 (após deploy v1.1)

---

## 🎯 Funcionalidades

### 1️⃣ Página `/novo-lead` (Criar Lead Completo)
**Tempo**: 4-5 horas  
**Complexidade**: 🟡 Média-Alta

#### O que será:
- Página acessível em `/novo-lead`
- Formulário com **29 campos** organizados em abas
- Validação completa
- Preview de dados antes de salvar
- Sucesso/erro feedback

#### Campos por Aba:

**Aba 1: Dados Pessoais** (Obrigatório)
```
nome*              (texto)
cpf*               (mask: XXX.XXX.XXX-XX)
telefone*          (mask: (XX) XXXXX-XXXX)
email              (email)
```

**Aba 2: Localização**
```
cidade*            (select - autocompletar)
zona               (select)
```

**Aba 3: Imóvel**
```
tipoImovel         (select: Apartamento, Casa, Terreno, Comercial, etc)
valorAvaliacao     (currency: R$ 0,00)
valorFecho         (currency: R$ 0,00)
chb                (number: quilometragem/área)
```

**Aba 4: Financeiro**
```
vgv                (currency: R$ 0,00)
modalidade         (select: MCMV, FGTS, Direto, etc)
tipoRenda          (select: CLT, PJ, Informal, etc)
comprovacao        (select: Contracheque, Declaração, Recibo, etc)
faturamentoPrevisto (currency: R$ 0,00)
```

**Aba 5: Processo**
```
etapa*             (select: lead, analise, aprovado, especulativo, realizado, reprovado, visita)
origem*            (select: WhatsApp, Site, Google Ads, Facebook Ads, etc)
corretor*          (select - autocomplete)
coordenador        (select - autocomplete)
construtora        (select - autocomplete)
correspondente     (text)
```

**Aba 6: Observações**
```
observacao         (textarea: 500 caracteres)
situacaoReprovado  (text - visível apenas se etapa=reprovado)
ccv                (checkbox: CCV assinado?)
```

#### Componentes Necessários:
```typescript
// Form Hook
useCreateLeadForm()

// Components
CreateLeadForm          (Main form)
LeadFormTabs           (Tab navigation)
LeadFormSection        (Field group)
LeadFormPreview        (Preview antes de salvar)
LeadFormSuccess        (Sucesso/Erro)

// Validação
validateLead()
normalizeLeadData()
```

#### Fluxo:
```
1. Usuário acessa /novo-lead
2. Preenche formulário com abas
3. Clica "Preview"
4. Vê resumo dos dados
5. Clica "Criar Lead"
6. Salva no Supabase
7. Sucesso com link para /leads
```

---

### 2️⃣ Modal de Criação Rápida (Quick Add)
**Tempo**: 2-3 horas  
**Complexidade**: 🟢 Baixa-Média

#### O que será:
- Botão "➕ Novo Lead" no header (visível em todas as páginas)
- Modal popup com campos essenciais
- Salva rápido e fecha
- Campos:

```
Essenciais (obrigatório):
- nome*
- cpf*
- telefone*
- cidade*
- corretor*
- etapa*

Opcionais:
- observacao (textarea pequena)
```

#### Componentes:
```typescript
// Modal
QuickAddLeadModal      (Modal container)
QuickAddLeadForm       (Form compacto)

// Hook
useQuickAddLead()
```

#### Fluxo:
```
1. Clica "➕ Novo Lead" no header
2. Abre modal
3. Preenche 6 campos essenciais
4. Clica "Adicionar"
5. Salva e fecha automático
6. Toast: "Lead criado com sucesso"
```

---

### 3️⃣ Modal de Edição (Edit Mode)
**Tempo**: 4-5 horas  
**Complexidade**: 🟡 Média-Alta

#### O que será:
- Botão "✏️ Editar" em cada linha da tabela
- Modal com **29 campos** (mesmo da página de criação)
- Carrega dados do lead atual
- Salva e atualiza em tempo real
- Histórico de mudanças (opcional)

#### Componentes:
```typescript
// Modal
EditLeadModal          (Modal container)
EditLeadForm           (Form com dados carregados)
EditLeadPreview        (Preview antes de salvar)
EditHistoryTimeline    (Timeline de mudanças - opcional)

// Hook
useEditLead()
```

#### Fluxo:
```
1. Clica ✏️ em uma linha da tabela
2. Abre modal com dados preenchidos
3. Pode editar qualquer campo
4. Clica "Atualizar"
5. Salva no Supabase
6. Atualiza tabela
7. Toast: "Lead atualizado"
```

#### Campos Editáveis:
- ✅ Todos os 29 campos
- ✅ Incluindo observações (textarea grande)
- ✅ Etapa (com histórico de transições)
- ✅ Status de reprovação

---

## 🛠️ Implementação Técnica

### Backend (Supabase)

#### Funções Necessárias (lib/services/leads.ts)
```typescript
// Create
createLead(leadData: Partial<Lead>): Promise<Lead>
createLeadBatch(leads: Partial<Lead>[]): Promise<Lead[]>

// Update
updateLead(id: string, data: Partial<Lead>): Promise<Lead>
updateLeadEtapa(id: string, etapa: EtapaFunil): Promise<void>

// Get (para edit modal)
getLeadById(id: string): Promise<Lead>

// Validações
validateLeadFields(data: Partial<Lead>): ValidationError[]
normalizeLeadData(data: any): Lead

// Histórico (opcional)
getLeadHistory(id: string): Promise<HistoricoEtapa[]>
recordEtapaChange(leadId: string, novaEtapa: EtapaFunil): Promise<void>
```

### Frontend (Components)

```
components/leads/
├── CreateLeadForm/
│   ├── CreateLeadForm.tsx       (Container)
│   ├── LeadFormTabs.tsx         (Tab navigation)
│   ├── LeadFormSection.tsx      (Field group)
│   ├── LeadFormPreview.tsx      (Preview)
│   ├── fields/
│   │   ├── PersonalFields.tsx
│   │   ├── LocationFields.tsx
│   │   ├── PropertyFields.tsx
│   │   ├── FinancialFields.tsx
│   │   ├── ProcessFields.tsx
│   │   └── ObservationFields.tsx
│   └── hooks/
│       └── useCreateLeadForm.ts
│
├── QuickAddLeadModal/
│   ├── QuickAddLeadModal.tsx
│   ├── QuickAddLeadForm.tsx
│   └── hooks/
│       └── useQuickAddLead.ts
│
├── EditLeadModal/
│   ├── EditLeadModal.tsx
│   ├── EditLeadForm.tsx
│   ├── EditLeadPreview.tsx
│   ├── EditHistoryTimeline.tsx  (opcional)
│   └── hooks/
│       └── useEditLead.ts
│
├── LeadTable/
│   ├── LeadTable.tsx            (Com botão editar)
│   └── LeadTableRow.tsx         (Com actions)
│
└── shared/
    ├── FormField.tsx             (Input reutilizável)
    ├── SelectField.tsx           (Select com autocomplete)
    ├── CurrencyField.tsx         (Currency mask)
    ├── MaskField.tsx             (Phone, CPF mask)
    └── ValidationError.tsx       (Error display)
```

### Pages

```
app/(dashboard)/
├── novo-lead/
│   └── page.tsx                 (Página de criação completa)
│
└── leads/
    └── page.tsx                 (Atualizar com modal de edição)
```

---

## 📊 Estimativa de Horas

| Tarefa | Horas | Notas |
|--------|-------|-------|
| **1. Página /novo-lead** | 4-5h | Maior complexidade (29 campos) |
| **2. Modal Quick Add** | 2-3h | Simplificado |
| **3. Modal Edit** | 4-5h | Carrega dados + atualiza |
| **Shared Components** | 1-2h | Form fields reutilizáveis |
| **Backend Services** | 1-2h | Create, Update, Validate |
| **Testing & Fixes** | 1-2h | Testes manuais |
| **Documentation** | 1h | Docs + guia de uso |
| **TOTAL** | **14-18h** | Mais realista: 16h |

---

## 🎯 Fase de Implementação

### Fase 1: Setup (1h)
- [ ] Criar componentes estrutura
- [ ] Criar hooks customizados
- [ ] Setup de validação

### Fase 2: Quick Add Modal (2-3h)
- [ ] Implementar modal compacto
- [ ] Integrar com Supabase
- [ ] Testar criação

### Fase 3: Página /novo-lead (4-5h)
- [ ] Criar formulário com abas
- [ ] Implementar preview
- [ ] Testar todos os campos

### Fase 4: Edit Modal (4-5h)
- [ ] Carregar dados do lead
- [ ] Edição de campos
- [ ] Atualizar em tempo real
- [ ] Editar observações

### Fase 5: Polish & Testing (2-3h)
- [ ] Validação completa
- [ ] Error handling
- [ ] UX improvements
- [ ] Documentação

---

## 📦 Dependências Adicionais

```json
{
  "react-hook-form": "^7.51.0",          // Form state management
  "zod": "^3.22.0",                      // Schema validation
  "@radix-ui/tabs": "^1.0.0",            // Tabs component
  "react-currency-input-field": "^3.6.0" // Currency input
}
```

---

## ✅ Critérios de Sucesso

### Página /novo-lead
- [x] Todos os 29 campos acessíveis
- [x] Validação funcionando
- [x] Preview antes de salvar
- [x] Salva no Supabase corretamente
- [x] Redirecionamento após sucesso

### Modal Quick Add
- [x] 6 campos essenciais
- [x] Abre/fecha rápido
- [x] Salva sem refresh
- [x] Toast de confirmação

### Modal Edit
- [x] Carrega dados do lead
- [x] Edita qualquer campo
- [x] Observações editáveis
- [x] Atualiza tabela em tempo real
- [x] Histórico de mudanças (opcional)

### Geral
- [x] TypeScript strict mode
- [x] Sem ESLint warnings
- [x] Mobile responsivo
- [x] Acessibilidade OK

---

## 🚀 Quando Implementar?

### Opção A: Depois do Deploy v1.1 (Recomendado)
```
1. Deploy v1.1 no Vercel (hoje)
2. Testar por 1 semana
3. Implementar v1.2 com estas 3 funcionalidades (próxima semana)
4. Deploy v1.2 com CRUD completo
```

**Vantagem**: v1.1 estável em produção + tempo para refinar v1.2

### Opção B: Implementar Agora (Antes de Deploy)
```
1. Implementar CRUD (16 horas - ~2 dias)
2. Testar e revisar (2 horas)
3. Deploy v1.2 com CRUD completo
```

**Desvantagem**: Atrasa o deploy inicial

---

## 📝 Próximos Passos

1. **Decidir**: Opção A (depois) ou Opção B (agora)?
2. **Se Opção A**: Deploy v1.1 hoje → v1.2 com CRUD próxima semana
3. **Se Opção B**: Começar implementação agora

---

**Status**: 📋 Plano pronto - Aguardando confirmação

Qual opção você prefere?
