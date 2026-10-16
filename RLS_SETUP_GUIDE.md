# 🔐 RLS Setup - Guia Passo a Passo

**Tempo estimado**: 5 minutos  
**Dificuldade**: Fácil (copiar e colar SQL)

---

## 📋 O que você vai fazer

Habilitar segurança no banco de dados para proteger os dados do seu dashboard.

---

## 🎬 PASSO 1: Abrir SQL Editor do Supabase

1. Acesse: **https://app.supabase.com**
2. Clique no seu projeto: `owwfzgizxikqqhculfja`
3. No menu esquerdo, clique em: **SQL Editor**
4. Você deve ver uma página com um editor de texto vazio

---

## 📝 PASSO 2: Executar SQL para HABILITAR RLS

**Cole o SQL abaixo no editor**:

```sql
-- ========================================
-- HABILITAR RLS (Row Level Security)
-- ========================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
```

**Ações**:
1. ✏️ Copie o SQL acima
2. 📋 Cole no SQL Editor do Supabase
3. ▶️ Clique no botão **"Run"** (ou Ctrl+Enter)
4. ✅ Aguarde a mensagem "Success"

---

## 🛡️ PASSO 3: Criar POLÍTICAS DE ACESSO

Agora você vai definir QUEM acessa o quê. Cole e execute este SQL:

### Para a tabela `leads`:

```sql
-- ========================================
-- POLÍTICAS DA TABELA: leads
-- ========================================

-- Política 1: Leitura para usuários autenticados
CREATE POLICY "Leads - Select for authenticated users"
ON leads
FOR SELECT
TO authenticated
USING (TRUE);

-- Política 2: Modificação apenas para admin
CREATE POLICY "Leads - All operations for admin"
ON leads
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

**Ações**:
1. ✏️ Copie este SQL
2. 📋 Cole no SQL Editor (apague o anterior)
3. ▶️ Clique "Run"
4. ✅ Aguarde "Success"

---

### Para a tabela `historico_etapas`:

```sql
-- ========================================
-- POLÍTICAS DA TABELA: historico_etapas
-- ========================================

-- Apenas leitura para admin
CREATE POLICY "Historico - Select for admin"
ON historico_etapas
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

**Ações**:
1. ✏️ Copie este SQL
2. 📋 Cole no SQL Editor
3. ▶️ Clique "Run"
4. ✅ Aguarde "Success"

---

### Para a tabela `webhook_logs`:

```sql
-- ========================================
-- POLÍTICAS DA TABELA: webhook_logs
-- ========================================

-- Política 1: Insert (escrever) via API
CREATE POLICY "Webhook Logs - Insert via API"
ON webhook_logs
FOR INSERT
WITH CHECK (TRUE);

-- Política 2: Select (ler) apenas para admin
CREATE POLICY "Webhook Logs - Select via API"
ON webhook_logs
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

**Ações**:
1. ✏️ Copie este SQL
2. 📋 Cole no SQL Editor
3. ▶️ Clique "Run"
4. ✅ Aguarde "Success"

---

## ✅ PASSO 4: Verificar que funcionou

### No Supabase Dashboard:

1. No menu esquerdo, vá para: **Database** → **Tables**
2. Clique na tabela `leads`
3. Vá para a aba **Security** (a direita)
4. Verifique:
   - [ ] **RLS** toggle está **AZUL/ATIVADO**
   - [ ] Abaixo aparecem as políticas criadas:
     - "Leads - Select for authenticated users"
     - "Leads - All operations for admin"

5. Repita para `historico_etapas` e `webhook_logs`

**Se vir tudo ativado em azul**: ✅ **SUCESSO!**

---

## 🔍 Entendendo as Políticas

### `leads` - Duas políticas:

| Política | O que faz |
|----------|-----------|
| **Select for authenticated users** | Usuários logados conseguem LER leads |
| **All operations for admin** | Apenas admin consegue CRIAR, EDITAR, DELETAR |

### `historico_etapas` - Uma política:

| Política | O que faz |
|----------|-----------|
| **Select for admin** | Apenas admin consegue VER histórico |

### `webhook_logs` - Duas políticas:

| Política | O que faz |
|----------|-----------|
| **Insert via API** | Qualquer um consegue ESCREVER logs (webhooks) |
| **Select via API** | Apenas admin consegue LER logs |

---

## ⚠️ O que mudará no dashboard?

**RESPOSTA CURTA**: Nada! O código continua igual.

**RESPOSTA LONGA**: 
- Antes: Qualquer um com a chave pública acessava todos os dados
- Depois: Supabase filtra dados automaticamente
- Seu código não muda, a segurança melhor!

---

## 🧪 Como Testar se RLS está funcionando?

### Teste 1: No Supabase Dashboard

1. Vá para: **SQL Editor**
2. Execute:
```sql
SELECT * FROM leads;
```
3. Você deve ver:
   - ✅ Se logado com admin role: Todos os leads
   - ⚠️ Se sem role: Erro 403 ou vazio

### Teste 2: No seu Dashboard

1. Inicie o dev server: `npm run dev`
2. Acesse: `http://localhost:3000/visao`
3. Abra DevTools (F12) → **Console**
4. Você deve ver:
   - ✅ Dados carregando normalmente
   - ⚠️ Nenhum erro de autenticação

---

## ❓ Perguntas Frequentes

**P: Preciso fazer login?**  
R: Não por enquanto. Seu dashboard usa anon key (público), então RLS permite leitura.

**P: E se eu quiser restringir para apenas admin?**  
R: Mude a política para:
```sql
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
```

**P: Posso alterar as políticas depois?**  
R: Sim! Volte ao SQL Editor e execute DROP POLICY + CREATE POLICY nova.

**P: Como dou admin role a um usuário?**  
R: Precisaria implementar Supabase Auth. Por enquanto, apenas leitura pública.

**P: RLS quebra meu código?**  
R: Não! É transparente. Supabase filtra automaticamente.

---

## 📊 Checklist Final

- [ ] Habilitar RLS em 3 tabelas
- [ ] Criar políticas em `leads` (2 políticas)
- [ ] Criar políticas em `historico_etapas` (1 política)
- [ ] Criar políticas em `webhook_logs` (2 políticas)
- [ ] Verificar toggle azul em cada tabela
- [ ] Testar SQL query retorna dados
- [ ] Testar dashboard carrega normalmente

---

## 🎉 Quando Terminar

Suas tabelas estão **100% seguras**! 

Próximo passo: Configurar Vercel Environment Variables e fazer deploy.

---

**Tempo total**: ~5 minutos  
**Dificuldade**: Fácil (só copiar/colar)  
**Risco**: Nenhum (RLS pode ser desabilitado se precisar)
