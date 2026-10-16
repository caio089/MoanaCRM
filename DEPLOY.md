# 🚀 Guia de Deploy - Vercel

## Pré-requisitos
- Conta no Vercel (vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Projeto pushado para o repositório

## Passo 1: Preparar Repositório Git

```bash
# Verificar status do git
git status

# Se houver mudanças não commitadas:
git add -A
git commit -m "Prepare for Vercel deployment"

# Fazer push para remote (GitHub/GitLab)
git push origin main
# ou
git push origin master
```

## Passo 2: Configurar Variáveis de Ambiente no Vercel

No painel do Vercel, vá para **Settings → Environment Variables** e adicione:

### Variáveis Obrigatórias (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL = "seu-url-supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "sua-chave-anon"
NEXT_PUBLIC_APP_URL = "https://seu-dominio.com"
```

### Variáveis Opcionais
```
IMOBLEAD_API_TOKEN = "seu-token-api"
```

## Passo 3: Deploy no Vercel

### Opção A: Dashboard Vercel (Recomendado)
1. Acesse https://vercel.com/dashboard
2. Clique em "Add New" → "Project"
3. Selecione seu repositório
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

### Opção B: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## Passo 4: Verificar Deploy

- Acessar a URL fornecida pelo Vercel
- Verificar logs em **Deployments → Runtime Logs**
- Testar funcionalidades principais

## Troubleshooting

### Erro: "Build failed"
- Verificar logs no painel Vercel
- Executar localmente: `npm run build`
- Verificar variáveis de ambiente

### Erro: "NEXT_PUBLIC_SUPABASE_URL not found"
- Adicionar em Environment Variables do Vercel
- Redeploy após adicionar variáveis

### Banco de dados não conecta
- Verificar URL e chaves do Supabase
- Verificar permissões de acesso
- Testar conexão localmente

## Monitoramento

- **Logs**: Vercel Dashboard → Deployments → Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Alertas**: Configurar notificações no Vercel

## Rollback

Se houver problemas após deploy:

1. Vercel Dashboard → Deployments
2. Clique no deployment anterior
3. Clique em "Redeploy"

## Próximos Passos

- [ ] Configurar domínio customizado
- [ ] Habilitar HTTPS automático
- [ ] Configurar alertas de erro
- [ ] Fazer backup do banco de dados
- [ ] Configurar CI/CD automático

---

**Dúvidas?** Consulte a [documentação do Vercel](https://vercel.com/docs)
