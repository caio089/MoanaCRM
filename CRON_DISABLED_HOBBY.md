# ⏸️ CRON Job - Desabilitado para Conta Hobby

**Data**: 26 de Junho de 2026  
**Motivo**: Vercel Hobby accounts limitam cron jobs a 1 por dia  
**Status**: ✅ Desabilitado (Dashboard funciona normalmente)

---

## 📋 O Que Foi Feito

### Desabilitação
- ❌ Removida configuração de cron de `vercel.json`
- ❌ Comentada variável `CRON_SECRET` em `.env.local`
- ✅ Dashboard funciona normalmente
- ✅ Sem limite de cron jobs

### O Que Não Funciona Agora
```
❌ Sincronização automática com ImobileLead
   (Webhook ativo, mas sem cron)
```

### Como Funciona Agora
```
✅ Dashboard normal
✅ Importação manual de dados
✅ Webhook do ImobileLead ativo (POST manual)
✅ Sem custos adicionais
```

---

## 🔄 Como Reativar (Quando Fazer Upgrade)

Se fizer upgrade para **Vercel Pro** ($20/mês):

### 1. Ativar CRON_SECRET em .env.local
```bash
# Em .env.local:
CRON_SECRET="seu-secret-aleatorio-aqui"

# Gerar valor seguro:
openssl rand -hex 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Restaurar vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-imobilead",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 3. Configurar no Vercel
```
Settings → Environment Variables
Adicionar: CRON_SECRET = seu-valor-aleatorio
```

### 4. Deploy
```bash
git add .env.local vercel.json
git commit -m "Enable cron jobs for Pro plan"
git push origin main
```

---

## 📊 Tabela: Hobby vs Pro

| Recurso | Hobby | Pro |
|---------|-------|-----|
| Cron Jobs | 1 por dia | Ilimitado |
| Custo | Grátis | $20/mês |
| Sincronização automática | ❌ | ✅ |
| Webhook manual | ✅ | ✅ |
| Dashboard | ✅ | ✅ |

---

## 📚 Documentação do Cron

**Arquivo**: `app/api/cron/sync-imobilead/route.ts`

**Função**: Sincronizar dados do ImobileLead para o Supabase

**Schedule**: `0 * * * *` (A cada hora)

**Segurança**: Bearer token via CRON_SECRET

**Vercel Docs**: https://vercel.com/docs/cron-jobs

---

## ✅ Status Atual

```
✅ Cron desabilitado
✅ Dashboard funciona (Hobby account)
✅ Sem erros de deploy
✅ Pronto para upgrade futuro
```

---

## 🚀 Próximo Passo

Fazer deploy no Vercel **SEM** adicionar CRON_SECRET nas variáveis de ambiente.

**Vercel Environment Variables** (Não adicione CRON_SECRET):
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_APP_URL
✅ SUPABASE_SECRET_KEY
✅ IMOBILEAD_API_TOKEN
❌ CRON_SECRET (Deixe desabilitado por enquanto)
```

---

**Quando quiser sincronização automática, faça upgrade para Pro e reative conforme instruções acima.**
