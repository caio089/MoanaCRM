# MoanaCRM

CRM do funil comercial da **Construtora Moana**.

Acompanha leads do primeiro contato até o fechamento: pipeline, kanban, equipe, construtoras, correspondentes bancários e painel administrativo — com autenticação e banco no **Supabase**.

## O que o sistema faz

| Área | O que cobre |
| --- | --- |
| **Visão geral** | Indicadores do funil e volume comercial |
| **Leads** | Cadastro, edição, filtros, busca e exportação Excel |
| **Kanban** | Arrastar leads entre etapas |
| **Funil** | Análise, aprovados, especulativo, realizado, reprovado e visitas |
| **Equipe** | Coordenadores, corretores e hierarquia |
| **Catálogos** | Construtoras, cidades e correspondentes bancários |
| **Admin** | Gestão de equipe, distribuição de leads e cadastros mestres |
| **Webhook** | Ingestão de leads (Imobilead) via RPC no Postgres |

## Funil

```
lead → análise → aprovado → especulativo → realizado
                 ↘ visita
                 ↘ reprovado
```

## Papéis

O papel fica em `auth.users.raw_app_metadata.role` (não em `user_metadata`). O RLS do Postgres usa esse valor.

| Papel | Acesso |
| --- | --- |
| **admin** | Tudo: funil, equipe, catálogos, distribuição de leads |
| **coordenador** | Próprio time e os leads da equipe |
| **corretor** | Próprios leads; cadastro pela tela de login entra neste papel |

## Stack

- **App:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth:** Supabase Auth (`@supabase/ssr`, cookies + JWT)
- **Banco:** Postgres no Supabase (`@supabase/supabase-js`)
- **RLS:** políticas por papel em `app_metadata`
- **Deploy:** Vercel (`vercel.json`)

Não há Prisma nem SQLite no runtime. Schema, funções e políticas ficam em `supabase/migrations/`.

## Pré-requisitos

- Node.js 20+
- npm
- Projeto Supabase com Auth habilitado

## Subir localmente

```bash
git clone https://github.com/caio089/MoanaCRM.git
cd MoanaCRM
npm install
cp .env.example .env.local
```

Preencha `.env.local` e suba o app:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/visao` (protegida); sem sessão você cai em `/login`.

```bash
npm run build    # build de produção
npm run lint     # ESLint
```

## Variáveis de ambiente

Copie `.env.example`. O mínimo para o app:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# alternativa (JWT anon clássica):
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

O client aceita `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **ou** `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Opcional:

| Variável | Uso |
| --- | --- |
| `CORRESPONDENTE_AUTO_CREATE` | Auto-criar correspondente no import (admin + RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Só em scripts locais (`provision-team-logins`). **Nunca** no frontend nem no git |
| `IMOBLEAD_API_TOKEN` | Integração Imobilead, se houver |

Não commite `.env.local` nem `service_role`.

## Banco (Supabase)

Migrations em `supabase/migrations/`. O arquivo único para colar no SQL Editor é `supabase/schema_complete.sql`.

O schema cria tabelas, enums, RLS, índices, RPCs e catálogos (cidades, construtoras, correspondentes). **Não inclui pessoas nem leads.**

### Aplicar o schema

1. Abra o [SQL Editor](https://supabase.com/dashboard/project/dqmxwaoynkfgopmyxcvo/sql) do projeto.
2. Cole `supabase/schema_complete.sql` e execute.
3. Confira no Table Editor: `leads`, `coordenadores`, `corretores`, `cidades`, `construtoras`, `correspondentes_bancarios`.

Ou, na conta dona do projeto:

```bash
npx supabase login
npx supabase link --project-ref dqmxwaoynkfgopmyxcvo
npx supabase db push
```

Detalhes em `supabase/APPLY.md`.

### Primeiro administrador

1. Supabase → **Authentication → Users** → criar usuário.
2. Em `raw_app_metadata` defina:

```json
{ "role": "admin" }
```

3. Confirme o e-mail se o projeto exigir.
4. Entre em `/login`.

Cadastros feitos na própria tela de login entram como **corretor**.

Para provisionar a equipe em lote (service role, só local):

```bash
# Preencha o array TEAM em scripts/provision-team-logins.ts
SUPABASE_SERVICE_ROLE_KEY=... TEAM_DEFAULT_PASSWORD='...' npx tsx scripts/provision-team-logins.ts
```

## Estrutura

```
app/                  rotas (login, dashboard, APIs)
  (dashboard)/        telas autenticadas do CRM
  api/                auth, webhook Imobilead, health
components/           UI (kanban, leads, equipe, admin, marca)
lib/                  auth, Supabase, serviços, hooks
scripts/              importação e provisionamento (CLI)
supabase/
  migrations/         histórico do schema
  schema_complete.sql script único para o SQL Editor
  APPLY.md            como aplicar no projeto destino
public/               logos da Construtora Moana
```

## Deploy (Vercel)

1. Importe o repositório no Vercel.
2. Defina as mesmas variáveis de `.env.example` (Production / Preview).
3. `NEXT_PUBLIC_APP_URL` = URL pública (`https://seu-dominio.com`).
4. No Supabase → Authentication → URL Configuration:
   - Site URL: a URL de produção
   - Redirect URLs: produção + `http://localhost:3000/**`

## Segurança

- RLS ligado nas tabelas do CRM; `anon` não lê dados comerciais.
- Papel de autorização só em `app_metadata`.
- RPCs de webhook são `SECURITY DEFINER` com `search_path` fixo e `EXECUTE` controlado.
- `.env.local` e chaves `service_role` ficam fora do git.

## Licença

Uso interno da Construtora Moana.
