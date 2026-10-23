# Como aplicar o schema no Supabase da Construtora Moana

Projeto destino: `dqmxwaoynkfgopmyxcvo`  
URL: https://dqmxwaoynkfgopmyxcvo.supabase.co

O MCP deste workspace só tem permissão na org **CRM vidaelar** (projeto `rkwohnonwhlhnsuzzvud`). Tentativas em `dqmxwaoynkfgopmyxcvo` (`get_project`, `execute_sql`, `apply_migration`) falham com **permission denied**. As migrations **não foram aplicadas** automaticamente. Não aplicar no projeto Vidaelar.

## Opção recomendada (SQL Editor)

1. Abra o [SQL Editor](https://supabase.com/dashboard/project/dqmxwaoynkfgopmyxcvo/sql).
2. Cole o conteúdo **atualizado** de `schema_complete.sql` e execute (o arquivo anterior quebrava no seed de construtoras por causa de `TEMP TABLE ... ON COMMIT DROP`).
3. Se o erro `seed_construtoras_planilha` já aconteceu: rode o arquivo de novo inteiro. O script é idempotente no começo (`CREATE TABLE IF NOT EXISTS`).
4. Confira em Table Editor: `leads`, `coordenadores`, `corretores`, `cidades`, `bairros`, `construtoras`, `correspondentes_bancarios` (vazias de pessoas).

## Se o schema base já foi aplicado

Não rode `schema_complete.sql` de novo só por causa do Módulo 2. Cole e execute **apenas** `supabase/migrations/20261022120000_modulo2_aluguel.sql` no SQL Editor. O script é idempotente (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`).

Depois confira:
- coluna `leads.tipo_operacao` (default `venda`)
- tabela `bairros`
- coluna `construtoras.origem_catalogo`

## Opção CLI (na conta dona do projeto)

```bash
npx supabase login
npx supabase link --project-ref dqmxwaoynkfgopmyxcvo
npx supabase db push
```

## Depois do schema

1. Authentication → Users → criar o admin.
2. Em `raw_app_meta_data` defina `{ "role": "admin" }`.
3. Confirme e-mail se o projeto exigir.
4. Entre em http://localhost:3001/login (ou :3000 se a porta estiver livre).
