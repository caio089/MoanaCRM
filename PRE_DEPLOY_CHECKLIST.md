# ✅ Checklist Pré-Deploy - GitHub + Vercel

**Status**: 🟢 Pronto para Deploy
**Data**: 2026-06-25
**Versão**: 1.0.0 (3 Fases + Melhorias + Segurança)

---

## 📋 ANTES DE FAZER PUSH PARA GITHUB

### Segurança
- [x] Não há API keys hardcoded no código
- [x] Não há tokens em comentários
- [x] `.env.local` está em `.gitignore`
- [x] Secrets não estão expostos
- [x] Headers HTTP de segurança adicionados

### Código
- [x] Build compila sem erros: `npm run build`
- [x] Sem avisos críticos no lint
- [x] Sem console.log em produção
- [x] Sem TODO comments pendentes

### Git
- [x] Todos os commits estão logados
- [x] Sem arquivos não trackados importantes
- [x] Git status limpo: `git status`

### Documentação
- [x] DEPLOY.md completo
- [x] README_DEPLOYMENT.md com instruções
- [x] SECURITY.md com análise completa
- [x] SUPABASE_SETUP.md com instruções RLS
- [x] .env.example documentado

---

## 🚀 PUSH PARA GITHUB

### 1️⃣ Criar Repositório (Se Não Existir)

**GitHub.com**:
```bash
# 1. Criar novo repositório
# - Nome: moana-crm
# - Descrição: Dashboard de gestão de funil comercial
# - Privado: SIM (recomendado)
# - License: MIT ou Proprietário
```

### 2️⃣ Configurar Git Remote

```bash
# Verificar remote atual
git remote -v

# Se não existir, adicionar:
git remote add origin https://github.com/seu-usuario/moana-crm.git

# Se já existir, atualizar:
git remote set-url origin https://github.com/seu-usuario/moana-crm.git
```

### 3️⃣ Push para GitHub

```bash
# Fazer push da branch main
git push -u origin main

# Ou se usar master:
git push -u origin master
```

### 4️⃣ Verificar no GitHub

- [ ] Repositório criado
- [ ] Todos os commits visíveis
- [ ] Branch main/master é padrão
- [ ] Arquivos aparecendo corretamente

---

## 🔐 CONFIGURAÇÃO SUPABASE (CRÍTICO)

### 1️⃣ Verificar Credenciais

```bash
# No Supabase Dashboard:
# 1. Projeto → Settings → API
# 2. Copiar:
#    - Project URL
#    - Anon Key (public)
# 3. NUNCA expor: Service Key (privado)
```

### 2️⃣ Habilitar RLS (Row Level Security)

```bash
# Supabase Dashboard → Authentication → Policies
# 1. Habilitar RLS para: leads, historico_etapas, webhook_logs
# 2. Adicionar políticas (ver SUPABASE_SETUP.md)
# 3. Testar que anon key tem acesso limitado
```

### 3️⃣ Configurar Webhook (Opcional)

```bash
# Se usar Imoblead:
# 1. Supabase → Database → Webhooks
# 2. Create webhook:
#    - Endpoint: https://seu-dominio.com/api/webhook/imoblead
#    - Headers: Authorization: Bearer {token}
#    - Events: Insert/Update on leads
```

---

## ⚙️ CONFIGURAÇÃO VERCEL

### 1️⃣ Conectar GitHub ao Vercel

```bash
# Vercel.com:
# 1. Dashboard → Add New → Project
# 2. Selecionar repositório GitHub
# 3. Autorizar Vercel em GitHub
```

### 2️⃣ Configurar Environment Variables

**No painel Vercel** → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = "https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
NEXT_PUBLIC_APP_URL = "https://seu-dominio.com"
IMOBLEAD_API_TOKEN = "seu-token-aqui" (opcional)
```

**Cuidados**:
- [ ] NEXT_PUBLIC_* pode ser visto no cliente (ok)
- [ ] Nunca expor SUPABASE_SERVICE_KEY
- [ ] Tokens privados em Environment Variables privadas

### 3️⃣ Configurar Build Settings

```
Framework: Next.js
Build Command: npm run build (já está em package.json)
Output Directory: .next
Node Version: 18.x ou 20.x (recomendado)
```

### 4️⃣ Deploy

```bash
# Opção A: Automático
# - Push para main/master no GitHub
# - Vercel faz deploy automaticamente

# Opção B: Manual (não recomendado)
# vercel --prod
```

---

## 🧪 TESTES PÓS-DEPLOYMENT

### 1️⃣ Verificar URL

- [ ] Acessar https://seu-projeto.vercel.app
- [ ] Página carrega sem erros
- [ ] Sem console errors no DevTools

### 2️⃣ Testar Funcionalidades Principais

- [ ] Dashboard Executivo carrega dados
- [ ] Gráficos renderizam corretamente
- [ ] Busca global funciona
- [ ] Filtros respondem
- [ ] Admin carrega tabela
- [ ] Ações inline funcionam

### 3️⃣ Verificar Segurança

```bash
# No DevTools → Network → Headers
# Verificar response headers:
- X-Content-Type-Options: nosniff ✅
- X-Frame-Options: DENY ✅
- X-XSS-Protection: 1; mode=block ✅
- Referrer-Policy: strict-origin-when-cross-origin ✅
```

### 4️⃣ Verificar Logs

- [ ] Vercel Dashboard → Deployments → Logs
- [ ] Nenhum erro crítico
- [ ] Conexão Supabase OK

---

## 🔗 CONFIGURAÇÃO DE DOMÍNIO (OPCIONAL)

### Adicionar Domínio Customizado

```bash
# Vercel Dashboard:
# 1. Project Settings → Domains
# 2. Adicionar seu domínio
# 3. Apontar DNS:
#    - CNAME: cname.vercel-dns.com
#    - ou use Vercel Nameservers
```

**Certificado HTTPS**: Automático ✅

---

## 📞 TROUBLESHOOTING

### Erro: "Build failed"
```bash
# 1. Verificar logs em Vercel
# 2. Rodar localmente: npm run build
# 3. Verificar variáveis de ambiente
```

### Erro: "SUPABASE_URL not found"
```bash
# 1. Verificar Environment Variables em Vercel
# 2. Certificar que NEXT_PUBLIC_* é público
# 3. Redeploy após adicionar variáveis
```

### Erro: "Conexão Supabase recusada"
```bash
# 1. Verificar URL do Supabase
# 2. Verificar anon key
# 3. Verificar RLS policies
```

### Dados não carregam
```bash
# 1. Abrir DevTools → Network
# 2. Verificar requisição para Supabase
# 3. Status 403 = problema RLS
# 4. Status 500 = problema servidor
```

---

## 📊 MONITORAMENTO EM PRODUÇÃO

### Verificação Diária
- [ ] Acessar dashboard (funciona?)
- [ ] Verificar logs de erro (Vercel)
- [ ] Verificar webhooks (se aplicável)

### Semanal
- [ ] Revisar performance (Vercel Analytics)
- [ ] Verificar uso de banco de dados (Supabase)
- [ ] Backup dos dados (Supabase automático)

### Mensal
- [ ] Revisar audit logs
- [ ] Verificar atualizações de dependências
- [ ] Testar processos críticos

---

## 🔄 REDEPLOY (Se Necessário)

### Fast Redeploy
```bash
# 1. Fazer mudança local
# 2. git add && git commit && git push
# 3. Vercel faz deploy automaticamente
```

### Rollback
```bash
# 1. Vercel Dashboard → Deployments
# 2. Clique em deployment anterior
# 3. Clique em "Redeploy"
```

---

## 📝 COMMITS FINAIS

Antes de push, revisar commits:
```bash
git log --oneline | head -10
```

Esperado:
```
fdfedc9 Análise de Segurança + Hardening
a1f87bd Organizar para deploy: Documentação + Vercel config
d9fe932 Melhorias: Filtros expandidos + Ações em massa
f8d1ca4 Fase 3: Admin Simplificado com ações inline
e6d475e Fase 2: Busca Global + Filtros Simples na Sidebar
```

---

## ✨ FINAL CHECKLIST

- [x] Código seguro (sem secrets)
- [x] Build passa sem erros
- [x] Documentação completa
- [x] Headers de segurança
- [x] Git limpo e commitado
- [ ] **NOVO**: Push para GitHub
- [ ] **NOVO**: Deploy no Vercel
- [ ] **NOVO**: Variáveis de ambiente configuradas
- [ ] **NOVO**: Supabase RLS habilitado
- [ ] **NOVO**: Teste de funcionalidades

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Revisar este checklist
2. ✅ Fazer push para GitHub
3. ✅ Conectar Vercel ao GitHub
4. ✅ Configurar Environment Variables
5. ✅ Fazer primeiro deploy
6. ✅ Testar funcionalidades
7. ✅ Configurar domínio (opcional)
8. ✅ Monitorar logs

---

**Status**: 🟢 **PRONTO PARA DEPLOYMENT**

Você está autorizado para fazer push e deploy!
