# 🚀 Deploy Checklist - MoanaCRM — Construtora Moana v1.1

**Data**: 26 de Junho de 2026  
**Versão**: 1.1.0  
**Status**: Em Revisão

---

## 📋 Checklist Pré-Deploy

### 1. Code Quality
- [ ] TypeScript compilation sem erros
- [ ] ESLint/prettier sem warnings
- [ ] Não há console.logs em produção
- [ ] Não há dados sensíveis expostos
- [ ] Imports não utilizados removidos

### 2. Build
- [ ] `npm run build` executa sem erros
- [ ] Build size aceitável (< 500kb)
- [ ] Nenhum warning durante build

### 3. Testing
- [ ] Dev server inicia corretamente
- [ ] Todas as 7 páginas carregam
- [ ] Filtros funcionam corretamente
- [ ] Paginação funciona
- [ ] Dados reais carregam do Supabase
- [ ] Cálculos estão corretos (VGV, média, percentuais)

### 4. Data Integrity
- [ ] 2.874 leads importados corretamente
- [ ] Nomes normalizados (sem duplicatas)
- [ ] Sem valores NULL em campos obrigatórios
- [ ] Dados consistentes no Supabase
- [ ] Backup dos dados antes de deploy

### 5. Security
- [ ] Supabase RLS policies habilitadas
- [ ] Credenciais em variáveis de ambiente
- [ ] Sem exposição de secret keys em código
- [ ] NEXT_PUBLIC vars apenas para público
- [ ] SUPABASE_SECRET_KEY apenas no servidor

### 6. Environment Variables
- [ ] `.env.local` configurado corretamente
- [ ] Vercel env vars configuradas (parte 3)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (opcional com RLS)
- [ ] NEXT_PUBLIC_APP_URL (Vercel URL)
- [ ] SUPABASE_SECRET_KEY (servidor apenas)

### 7. Performance
- [ ] Lazy loading de páginas implementado
- [ ] Índices no Supabase criados
- [ ] Queries otimizadas
- [ ] Sem N+1 queries
- [ ] Cache strategy definida

### 8. Documentation
- [ ] README.md atualizado
- [ ] DEPLOY.md criado
- [ ] Instruções de setup claro
- [ ] Troubleshooting documentado
- [ ] Commits descritivos

### 9. Git
- [ ] Todos os commits feitos
- [ ] Branch main limpa
- [ ] Sem conflitos não resolvidos
- [ ] Tags de versão criadas

### 10. Monitoring
- [ ] Sentry/error tracking configurado (opcional)
- [ ] Logs estruturados
- [ ] Alertas para falhas críticas

---

## 🔍 Revisão Técnica Detalhada

### TypeScript e Build

```bash
# ✅ Verificar compilação
npm run build

# ✅ Verificar linting
npm run lint

# ✅ Type checking
npx tsc --noEmit
```

### Database

```sql
-- ✅ Verificar dados
SELECT COUNT(*) FROM leads; -- Deve retornar 2874

-- ✅ Verificar integridade
SELECT COUNT(*) FROM leads WHERE corretor IS NULL; -- Deve ser 0

-- ✅ Verificar RLS
-- Todas as policies devem estar habilitadas
```

### API Integration

```typescript
// ✅ Verificar service functions
- getLeadsWithFilters() ✓
- countLeadsByEtapa() ✓
- getFilterOptions() ✓
- getTopByCorretor() ✓
- getTopByOrigem() ✓
- ... (todos os getTopBy*)
```

### Pages

```
✅ /leads - Full functional
✅ /analises - Full functional
✅ /aprovados - Full functional
✅ /especulativo - Full functional
✅ /realizado - Full functional
✅ /reprovado - Full functional + observacao
✅ /visitas - Full functional
✅ /login - Logo added
✅ Dashboard layout - Logo replacement done
```

---

## 📦 Deployment Steps

### Step 1: Pre-Deployment (Local)
```bash
# 1. Verificar build
npm run build

# 2. Testar localmente
npm run dev
# Acessar http://localhost:3000

# 3. Testar todas as páginas
# - /leads
# - /analises
# - /aprovados
# - /especulativo
# - /realizado
# - /reprovado
# - /visitas

# 4. Testar filtros
# Teste cada combinação de filtros

# 5. Testar dados
# Verifique se números estão corretos
```

### Step 2: Vercel Setup
```bash
# 1. Push para GitHub
git push origin main

# 2. No Vercel:
# - Conectar repositório
# - Configurar environment variables:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   NEXT_PUBLIC_APP_URL (https://seu-domain.vercel.app)
#   SUPABASE_SECRET_KEY (apenas para deploy)
#   IMOBILEAD_API_TOKEN (se houver webhook)

# 3. Aguardar build automático
# 4. Testar em staging/preview
```

### Step 3: Production
```bash
# 1. Verification
# - Acessar URL do Vercel
# - Testar todas as páginas
# - Verificar filtros
# - Confirmar dados reais carregam

# 2. Monitor
# - Check logs no Vercel
# - Verificar console do navegador (F12)
# - Testar em múltiplos navegadores

# 3. Backup
# - Backup do Supabase
# - Screenshots de funcionamento
# - Documentação de issues encontradas
```

---

## 🚨 Problemas Conhecidos e Soluções

### Problema: Timeline ainda com dados mock
**Impacto**: Média (visual, não afeta dados)  
**Status**: ✅ Conhecido e documentado  
**Solução**: Implementar em v1.2

### Problema: Zona (CEP) sem dados
**Impacto**: Baixa (campo opcional)  
**Status**: ✅ Placeholder adicionado  
**Solução**: Implementar quando dados disponíveis

### Problema: Índices não criados
**Impacto**: Média (performance)  
**Status**: ✅ Documentado para após deploy  
**Solução**: Criar índices no Supabase: `data_entrada`, `corretor`, `cidade`, `etapa`

---

## ✅ Critérios de Sucesso

### Build
- ✅ Build completa sem erros
- ✅ Sem warnings críticos
- ✅ Size dentro do esperado

### Functionality
- ✅ Todas as 7 páginas carregam
- ✅ Dados reais exibem do Supabase
- ✅ Filtros funcionam
- ✅ Paginação funciona
- ✅ Cálculos corretos

### Security
- ✅ Nenhuma credencial exposta
- ✅ RLS habilitado
- ✅ CORS configurado
- ✅ Rate limiting em webhook (se houver)

### Performance
- ✅ Página carrega em < 3 segundos
- ✅ Filtros respondem em < 1 segundo
- ✅ Paginação rápida
- ✅ Sem lag em interações

### Data Quality
- ✅ 2.874 leads visíveis
- ✅ Nenhum dado corrompido
- ✅ Nomes normalizados
- ✅ Cálculos precisos

---

## 📝 Versão e Tagging

```bash
# Tag v1.1.0
git tag -a v1.1.0 -m "Release v1.1.0: Dashboard com dados reais, normalização, deploy ready"

# Push tags
git push origin --tags
```

---

## 🔄 Post-Deployment

### Immediate (24h)
- [ ] Monitor Vercel logs
- [ ] Check for errors in browser console
- [ ] Test user workflows
- [ ] Verify all pages loading

### Short-term (1 week)
- [ ] Gather user feedback
- [ ] Fix any critical bugs
- [ ] Optimize performance if needed
- [ ] Create v1.1.1 patch if needed

### Medium-term (2 weeks)
- [ ] Create indices for performance
- [ ] Implement real timeline data
- [ ] Add more analytics
- [ ] Plan v1.2 features

---

## 📞 Support & Documentation

**Documentation files created:**
- ✅ AUDITORIA_DASHBOARD_v1.1.md
- ✅ LIMPEZA_DADOS.md
- ✅ IMPORT_RESULTADO.md
- ✅ IMPORT_GUIA.md
- ✅ RELEASE_v1.1.md
- ✅ SECURITY_AUDIT_v1.1.md
- ✅ DADOS_IMPORT_PLAN.md

**Scripts created:**
- ✅ scripts/import-leads.js
- ✅ scripts/normalize-names.js

**Key contacts:**
- Dashboard: http://localhost:3000 (local) / https://seu-domain.vercel.app (prod)
- Supabase: https://app.supabase.com
- GitHub: https://github.com/MestreZuao/moana-crm

---

**Status**: 🔄 **EM REVISÃO - AGUARDANDO APROVAÇÃO PARA DEPLOY**

Próximo passo: Executar checklist e resolver qualquer issue encontrada.
