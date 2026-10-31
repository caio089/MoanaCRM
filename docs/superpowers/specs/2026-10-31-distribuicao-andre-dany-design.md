# Design: Distribuição de Leads para André Matos e Danielly Mendes

**Data**: 31 de Outubro de 2026  
**Status**: Aprovado  
**Objetivo**: Atribuir os 58 leads da planilha `André - Moana.xlsx` para o corretor André Matos e os 58 leads da planilha `Dany - Moana.xlsx` para a corretora Danielly Mendes, duplicando o cliente compartilhado (`Marcos Manlio De Aguiar Aguiar`) para que ambos tenham o registro em suas carteiras, mantendo os 2 registros históricos não atribuídos na Base Histórica.

---

## 1. Contexto

A gestão comercial da Construtora Moana forneceu duas planilhas com a divisão de carteira dos leads:
1. `André - Moana.xlsx` (58 leads)
2. `Dany - Moana.xlsx` (58 leads)

O cruzamento de dados identificou que:
* 57 leads de André e 57 leads de Dany correspondem de forma única e exata (por Nome + Telefone) aos leads já cadastrados no Supabase.
* 1 lead (`Marcos Manlio De Aguiar Aguiar`, Tel: `8632131000`) consta em ambas as planilhas. Conforme decisão da gestão, esse registro será duplicado no banco para que ambos os corretores tenham o cliente em suas carteiras.
* 2 leads (`Gabriel` e `Maria Clara`, Vendas Ganhas anteriores) não constam nas planilhas e permanecerão na `Base Histórica`.

---

## 2. Corretores Alvo

| Nome no Sistema | Email | ID no Supabase |
| :--- | :--- | :--- |
| **André Matos** | `andrecampelomatos@gmail.com` | `cb200a53-8a6d-4fe5-ab4b-da370d059863` |
| **Danielly Mendes** | `daniellymendes166@gmail.com` | `b4ce1bcf-70f4-4f23-baac-3079eadb73a0` |

---

## 3. Regras de Atribuição e Atualização

### 3.1. Planilha do André (`André - Moana.xlsx`)
* Para cada lead na planilha (58 registros):
  * Localiza o lead no Supabase por `(telefone, nome)` ou `telefone`.
  * Se existir: atualiza `corretor = 'André Matos'`, `corretor_id = 'cb200a53-8a6d-4fe5-ab4b-da370d059863'`, e sincroniza notas/etapa se aplicável.
  * Se não existir: cria novo lead atribuído ao André.

### 3.2. Planilha da Dany (`Dany - Moana.xlsx`)
* Para cada lead na planilha (58 registros):
  * Se for o cliente `Marcos Manlio De Aguiar Aguiar`: como o registro original já terá sido atribuído ao André, cria um novo lead específico para a Dany com os mesmos dados, atribuído a `Danielly Mendes`.
  * Para os demais 57 leads: localiza no Supabase e atualiza `corretor = 'Danielly Mendes'`, `corretor_id = 'b4ce1bcf-70f4-4f23-baac-3079eadb73a0'`.
  * Se qualquer outro não existir: cria novo lead atribuído à Dany.

---

## 4. Totais Esperados Pós-Execução

* **Total de leads no banco**: **119** (118 originais + 1 cópia do Marcos para a Dany).
* **Carteira André Matos**: **58 leads** (`corretor = 'André Matos'`).
* **Carteira Danielly Mendes**: **58 leads** (`corretor = 'Danielly Mendes'`).
* **Base Histórica**: **3 leads** (`corretor = 'Base Histórica'` — Gabriel, Maria Clara e eventuais não atribuídos).
* **Central de Distribuição (`v_leads_central`)**: **0 leads pendentes** (todos distribuídos para as carteiras ativas).
