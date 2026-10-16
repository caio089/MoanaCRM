# 🔐 Configuração de Segurança Supabase

## RLS (Row Level Security) - CRÍTICO PARA PRODUÇÃO

### 1. Habilitar RLS

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Authentication** → **Policies**
4. Ative **RLS** para cada tabela:
   - [ ] `leads`
   - [ ] `historico_etapas`
   - [ ] `webhook_logs`
   - [ ] `coordenadores`
   - [ ] `corretores`
   - [ ] `correspondentes_bancarios`
   - [ ] `users`

> Migration SQL completa (greenfield): `supabase/migrations/20260917140000_crm_equipe_hierarchy.sql`

### 2. Políticas de Acesso

#### Tabela: `leads`

```sql
-- Política 1: Leitura apenas para usuários autenticados (admin)
CREATE POLICY "Leads - Select for authenticated users"
ON leads
FOR SELECT
TO authenticated
USING (TRUE);

-- Política 2: Insert/Update/Delete apenas para admin
CREATE POLICY "Leads - All operations for admin"
ON leads
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

#### Tabela: `webhook_logs`

```sql
-- Somente servidor pode escrever (via service key)
CREATE POLICY "Webhook Logs - Insert via API"
ON webhook_logs
FOR INSERT
WITH CHECK (TRUE);

-- Somente servidor pode ler
CREATE POLICY "Webhook Logs - Select via API"
ON webhook_logs
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

#### Tabela: `historico_etapas`

```sql
-- Apenas leitura para admin
CREATE POLICY "Historico - Select for admin"
ON historico_etapas
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

#### Tabelas de equipe (Wave 2)

```sql
-- Leitura autenticada; escrita só admin (via is_app_admin())
-- Ver migration: supabase/migrations/20260917140000_crm_equipe_hierarchy.sql

-- coordenadores / corretores / correspondentes_bancarios
-- SELECT TO authenticated USING (true)
-- ALL TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin())
```

**Colunas FK em `leads` (nullable):**
- `coordenador_id` → `coordenadores(id)`
- `corretor_id` → `corretores(id)`
- `correspondente_id` → `correspondentes_bancarios(id)`

Strings legadas (`coordenador`, `corretor`, `correspondente`) permanecem por 1 release.

### 3. Roles e Usuários

#### Criar Role Admin (Opcional)

```sql
-- No Supabase SQL Editor, executar:
DO $$
BEGIN
  CREATE ROLE admin;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Role admin já existe';
END
$$;

GRANT USAGE ON SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
```

---

## Configuração de Aplicação

### 1. Variáveis de Ambiente

```env
# .env.local (Desenvolvimento)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Vercel Environment Variables (Produção)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

⚠️ **NUNCA expor `SUPABASE_SERVICE_KEY` em cliente ou GitHub**

### 2. Configuração de Webhooks

No painel Supabase, configure webhooks para notificações:

**Endpoint**: `https://seu-dominio.com/api/webhook/imoblead`

**Headers**:
```
Authorization: Bearer {IMOBLEAD_API_TOKEN}
Content-Type: application/json
```

**Eventos**:
- [ ] Insert on `leads`
- [ ] Update on `leads`

---

## Boas Práticas

### ✅ DO's (Fazer)
- ✅ Usar anon key em cliente
- ✅ Usar service key apenas no servidor
- ✅ Habilitar RLS em todas as tabelas
- ✅ Revisar policies antes de produção
- ✅ Testar RLS localmente

### ❌ DON'Ts (Não Fazer)
- ❌ Expor service key em código
- ❌ Desabilitar RLS em produção
- ❌ Usar policies muito permissivas
- ❌ Salvar tokens em localStorage
- ❌ Fazer queries sem autenticação

---

## Teste de RLS

### 1. Teste Local

```typescript
// Testar com anon key (deve falhar para dados sensíveis)
const { data, error } = await supabase
  .from('webhook_logs')
  .select('*')

// Deve retornar erro: 403 - row level security violation
```

### 2. Teste em Produção

1. Abrir DevTools → Network
2. Verificar requisições para `/rest/v1/leads`
3. Status deve ser 200 para leitura
4. Status deve ser 403 para operações não autorizadas

---

## Monitoramento

### Verificar Policies Ativas

```sql
-- SQL Editor do Supabase
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Logs de RLS Violation

1. Vá para **Logs** → **API Requests**
2. Filtrar por `status: 403`
3. Verificar `error_message` para detalhes

---

## Troubleshooting

### Problema: "Row level security violation"
**Solução**: Verificar se role do usuário tem permissão na policy

### Problema: "Anon key não consegue acessar"
**Solução**: Adicionar policy `USING (TRUE)` para anon ou autenticação

### Problema: "Service key também dá erro"
**Solução**: Verificar se schema.public está grants corretos

---

## Checklist de Segurança Supabase

- [ ] RLS habilitado em todas as tabelas
- [ ] Policies configuradas por tabela
- [ ] Anon key com permissões mínimas
- [ ] Service key **nunca** exposto
- [ ] Webhooks com token Bearer
- [ ] Rate limiting habilitado
- [ ] Backups automáticos ativados
- [ ] Logs auditados regularmente

---

## Links Úteis

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Policies](https://supabase.com/docs/guides/auth/row-level-security/policies)
- [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html)

---

**Status**: ⚠️ CRÍTICO - Implementar antes de produção
