# MoanaCRM — Construtora Moana

CRM do funil comercial da **Construtora Moana**, conectado ao **Supabase** (Postgres + Auth).

Arquitetura, telas e módulos (pipeline, leads, kanban, equipe, construtoras) seguem o CRM de referência, com rebranding completo.

## Como subir

```bash
npm install
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Schema e RPCs ficam em `supabase/migrations/`. Não há SQLite/Prisma no runtime.

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-jwt-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Não commite `.env.local` nem chaves secretas (`service_role`).

## Acesso

Crie o primeiro usuário no **Supabase Auth** (Dashboard → Authentication → Users) e defina `app_metadata.role = "admin"` para o administrador. Cadastros pela tela de login entram como corretor.

## Stack

- **Auth**: Supabase Auth (JWT + cookies via `@supabase/ssr`)
- **DB**: Postgres no Supabase, acesso via `@supabase/supabase-js`
- **RLS**: políticas por role em `app_metadata` (nunca `user_metadata`)
- **Webhooks**: RPCs `SECURITY DEFINER` (`ingest_webhook_log`, `upsert_lead_from_webhook`, …)

## Schema no Supabase

As migrations em `supabase/migrations/` recriam tabelas, enums, RLS, índices, funções e seeds de catálogo (cidades, construtoras, correspondentes). **Não incluem dados de pessoas/leads.**

Para aplicar no projeto destino (`dqmxwaoynkfgopmyxcvo`), use o SQL Editor do Dashboard ou a CLI autenticada na org correta.
