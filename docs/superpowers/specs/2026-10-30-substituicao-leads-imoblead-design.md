# Design: Substituição de Dados de Leads pela Planilha IMOBLEAD - MOANA

**Data**: 30 de Outubro de 2026  
**Status**: Aprovado  
**Objetivo**: Substituir com segurança os leads de teste/antigos da tabela `leads` pelos 118 registros reais da planilha `IMOBLEAD - MOANA.xlsx`, direcionando os leads ativos para a Central de Distribuição e arquivando os reprovados e concluídos na base histórica.

---

## 1. Contexto e Motivação

Atualmente, o banco de dados do MoanaCRM possui 956 registros de leads com dados divergentes/antigos gerados em testes e importações legadas. 
A planilha oficial `IMOBLEAD - MOANA.xlsx` na raiz do projeto contém 118 clientes reais captados via Imoblead sem corretor atribuído.

A operação imobiliária da Construtora Moana precisa:
1. Limpar os dados antigos sem perder histórico (gerando backup prévio em JSON).
2. Importar os 118 leads com normalização adequada de etapas, telefones, notas e produtos.
3. Disponibilizar os leads ativos (82 registros) na **Central de Distribuição de Leads** (`/admin/distribuicao`) para a gestão distribuir entre os corretores.
4. Manter os leads reprovados (33 registros) e vendas ganhas (3 registros) vinculados à `Base Histórica`, sem sobrecarregar a fila ativa de distribuição de corretores.

---

## 2. Regras de Negócio e Mapeamento de Dados

### 2.1. Arquivo de Origem
* **Arquivo**: `IMOBLEAD - MOANA.xlsx`
* **Aba**: `Leads` (118 linhas de dados + 1 linha de cabeçalho)
* **Colunas de Origem**: `Nome`, `Telefone`, `Produto`, `Corretor`, `Data criação`, `Status`, `Notas`

### 2.2. Mapeamento de Campos

| Coluna Planilha | Coluna Supabase (`leads`) | Tratamento / Normalização |
| :--- | :--- | :--- |
| `Nome` | `nome` | String limpa (trim, remoção de espaços duplicados). |
| `Telefone` | `telefone` | String numérica sanitizada (apenas dígitos). Se iniciar com `+55`, padroniza DDD + número. |
| `Produto` | `produto` | Ex: `"URUGUAI SHOPPING"` ou null se vazio. |
| `Data criação` | `criado_em`, `atualizado_em` | Convertida de `DD/MM/YYYY HH:mm:ss` para ISO timestamp UTC. |
| `Notas` | `observacao` | Texto completo das notas / requisitos do cliente. |
| *(Constante)* | `origem` | `'Imoblead'` |
| *(Constante)* | `tipo_operacao`| `'venda'` |
| *(Constante)* | `cidade` | `'Teresina'` |

### 2.3. Mapeamento de Status / Etapa do Funil

| Status na Planilha | Ocorrências | `etapa` no CRM | Destino Inicial |
| :--- | :---: | :---: | :--- |
| `Sem Atendimento` | 28 | `lead` | Central de Distribuição |
| `Sem Interação` | 10 | `lead` | Central de Distribuição |
| `Em Atendimento` | 39 | `lead` | Central de Distribuição |
| `Visita Agendada` | 4 | `visita` | Central de Distribuição |
| `Negociação ` | 1 | `analise` | Central de Distribuição |
| `Reprovado` | 33 | `reprovado` | Base Histórica (fora da fila ativa) |
| `Venda Ganha` | 3 | `realizado` | Base Histórica (histórico de vendas) |

### 2.4. Regra de Atribuição e Central de Distribuição

A view SQL `public.v_leads_central` filtra leads onde:
```sql
WHERE corretor_id IS NULL AND coalesce(trim(corretor), '') = '';
```

Portanto:
* **Para os 82 leads ativos**:
  * `corretor = null`
  * `corretor_id = null`
  * Entram automaticamente na visualização da Central de Distribuição (`/admin/distribuicao`).
* **Para os 36 leads arquivados/concluídos** (33 reprovados + 3 vendas ganhas):
  * `corretor = 'Base Histórica'`
  * `corretor_id = null`
  * Não aparecem na Central de Distribuição (não poluem a fila de trabalho), mas permanecem visíveis nos filtros de leads gerais e nas métricas de conversão.

---

## 3. Arquitetura da Execução

### 3.1. Script de Importação (`scripts/import-imoblead.ts`)
1. Carrega as variáveis de ambiente `.env.local`.
2. Conecta ao Supabase usando `SUPABASE_SERVICE_ROLE_KEY` (bypass de RLS para manipulação administrativa).
3. **Passo 1: Backup de Segurança**: Exporta todos os registros atuais da tabela `leads` para `data/backups/leads_backup_pre_imoblead_<timestamp>.json`.
4. **Passo 2: Limpeza da Tabela**: Deleta todos os registros de `leads`.
5. **Passo 3: Leitura e Parse da Planilha**: Lê `IMOBLEAD - MOANA.xlsx` via `exceljs`, normaliza registros e valida dados.
6. **Passo 4: Inserção em Lote**: Insere os 118 registros normalizados na tabela `leads`.
7. **Passo 5: Verificação Automática**: Valida as contagens finais no banco e reporta o resumo.

---

## 4. Plano de Validação e Critérios de Aceite

* [ ] **Backup**: Arquivo de backup salvo e preenchido em `data/backups/`.
* [ ] **Contagem Total**: Exatamente 118 leads na tabela `leads`.
* [ ] **Central de Distribuição**: Exatamente 82 leads disponíveis em `/admin/distribuicao` (`v_leads_central`).
* [ ] **Base Histórica**: Exatamente 36 leads com `corretor = 'Base Histórica'` (33 reprovados, 3 realizados).
* [ ] **Integridade dos Dados**: Nomes, telefones, produtos e observações preenchidos corretamente sem caracteres corrompidos.
