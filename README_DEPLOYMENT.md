# MoanaCRM — Construtora Moana - Deployment Guide

## 📋 Conteúdo do Projeto

### Fases Implementadas
- **Fase 1**: Dashboard Executivo com análise de período e gráficos
- **Fase 2**: Busca Global + Filtros Simples na Sidebar
- **Fase 3**: Admin Simplificado com ações inline
- **Melhorias**: Filtros expandidos (Corretor, Cidade) + Ações em Massa

### Estrutura Técnica
- **Next.js 14** com App Router
- **Supabase** para banco de dados PostgreSQL
- **Recharts** para visualizações
- **Tailwind CSS** com Material Design 3 tokens
- **React Context** para estado global de filtros

## 🚀 Deploy Rápido (Vercel)

### 1. Preparar Repositório
```bash
# Adicionar e commitar todas as mudanças
git add -A
git commit -m "Prepare for deployment"

# Push para GitHub/GitLab
git push origin main
```

### 2. Conectar no Vercel
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Selecione seu repositório
4. **Variáveis de Ambiente** (IMPORTANTE):
   - `NEXT_PUBLIC_SUPABASE_URL` = URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Chave anon do Supabase
   - `NEXT_PUBLIC_APP_URL` = URL público (ex: https://seu-dominio.com)
   - `IMOBLEAD_API_TOKEN` = Token API (se usar integrações)

5. Clique em **Deploy**

### 3. Verificar Deploy
- Dashboard Vercel mostrará a URL de produção
- Acessar em https://seu-projeto.vercel.app
- Testar funcionalidades principais

## 📦 Estrutura de Arquivos

```
app/
  ├── (dashboard)/
  │   ├── layout.tsx (FiltersProvider wrapper)
  │   ├── visao/page.tsx (Dashboard Executivo)
  │   ├── leads/page.tsx (Listagem de Leads)
  │   ├── admin/page.tsx (Gerenciamento)
  │   └── ... (outras páginas de etapas)
  └── layout.tsx (Root layout)

components/
  ├── layout/
  │   ├── Sidebar.tsx
  │   ├── SidebarWrapper.tsx
  │   ├── SidebarFilters.tsx
  │   └── DashboardLayout.tsx
  ├── admin/
  │   ├── TabelaAdmin.tsx
  │   ├── BulkActionsBar.tsx
  │   ├── AdminClient.tsx
  │   └── ...
  └── ui/
      ├── KpiCard.tsx
      ├── TabelaEtapas.tsx
      └── ...

lib/
  ├── contexts/FiltersContext.tsx
  ├── hooks/
  │   ├── useFilteredLeads.ts
  │   └── useFilterOptions.ts
  └── supabase.ts
```

## 🔧 Variáveis de Ambiente

### Obrigatórias
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anon Supabase

### Recomendadas
- `NEXT_PUBLIC_APP_URL` - URL pública (para emails, webhooks, etc)

### Opcionais
- `IMOBLEAD_API_TOKEN` - Para integração com Imoblead

## 🧪 Testar Localmente

```bash
# Instalar dependências
npm install

# Configurar .env.local
cp .env.example .env.local
# Editar .env.local com suas variáveis Supabase

# Rodar em desenvolvimento
npm run dev

# Buildar para produção
npm run build
npm start
```

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verificar logs em Vercel Dashboard |
| Supabase connection error | Verificar URL e chaves em Environment Variables |
| Dados não carregam | Verificar permissões do Supabase RLS |
| Gráficos brancos | Verificar console do navegador para erros |

## 📊 Funcionalidades Principais

### Dashboard Executivo (`/visao`)
- Período dinâmico (7d, 30d, 90d, Todos)
- Gráficos de Funil e Top Corretores
- KPIs com variação de período
- Export para CSV

### Busca e Filtros
- Busca por nome, CPF, telefone
- Filtros de Etapa, Corretor, Cidade
- Sincronizado globalmente via Context

### Admin (`/admin`)
- Tabela simplificada com ações inline
- Dropdown para mudar etapa direto
- Ações em massa com checkboxes
- Confirmação antes de ação

## 🔐 Segurança

- Variáveis sensíveis em Environment Variables (não em .env.local)
- `.env.local` está em .gitignore
- Supabase RLS configurado (se necessário)
- Validação no backend para webhooks

## 📈 Monitoramento em Produção

1. **Logs**: Vercel Dashboard → Deployments → Logs
2. **Analytics**: Vercel Dashboard → Analytics
3. **Alertas**: Configurar notificações
4. **Health Check**: Acessar `/api/health` se implementado

## 🔄 CI/CD Automático

Vercel faz deploy automático quando:
- Push para branch main
- Pull request criado (preview deploy)
- Manual redeploy via dashboard

## 📝 Commits para Deploy

```bash
# Formato recomendado
git commit -m "Fase X: Descrição da mudança

- Mudança 1
- Mudança 2

Co-Authored-By: Claude Haiku <noreply@anthropic.com>"
```

## 🔗 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## 📞 Suporte

Em caso de dúvidas sobre:
- **Vercel**: Consulte a documentação oficial
- **Supabase**: Verificar painel de administração
- **Código**: Verificar comentários e commits

---

**Última atualização**: 2026-06-25
**Versão**: 1.0.0 (3 Fases + Melhorias)
