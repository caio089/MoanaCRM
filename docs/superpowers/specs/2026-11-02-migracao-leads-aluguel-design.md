# Especificação de Design: Migração de Leads para Aluguel

**Data:** 02/11/2026  
**Status:** Aprovado  

## 1. Visão Geral
Atualmente, a base de dados do MoanaCRM possui 120 leads cadastrados, sendo 119 com `tipo_operacao = 'venda'` e 1 com `tipo_operacao = 'aluguel'`. O objetivo deste projeto é converter todos os leads com status de operação `'venda'` para `'aluguel'`, garantindo backup prévio, e ajustar os scripts de automação (`import-imoblead.ts` e `distribute-andre-dany.ts`) para que novos processamentos adotem `'aluguel'` como padrão.

## 2. Requisitos e Restrições
- **Backup de Segurança:** Antes de qualquer alteração no banco de dados, gerar um snapshot em JSON com todos os 120 leads atuais em `data/backups/`.
- **Integridade dos Dados:** Preservar todos os outros campos dos leads (nomes, telefones, etapas, corretores atribuídos, histórico, etc.). Apenas `tipo_operacao` deve ser atualizado.
- **Consistência de Scripts:** Atualizar `scripts/import-imoblead.ts` e `scripts/distribute-andre-dany.ts` para que utilizem `tipo_operacao: 'aluguel'`.
- **Validação Pós-Execução:** Confirmar que no banco de dados existem 120 leads com `tipo_operacao = 'aluguel'` e 0 com `tipo_operacao = 'venda'`.

## 3. Arquitetura e Componentes

### 3.1 Script de Migração: `scripts/update-leads-to-aluguel.ts`
- Inicializa cliente Supabase usando as credenciais administrativas em `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`).
- **Passo 1:** Executa `select('*')` na tabela `leads` e salva o JSON em `data/backups/leads_backup_pre_aluguel_<timestamp>.json`.
- **Passo 2:** Executa `update({ tipo_operacao: 'aluguel' }).eq('tipo_operacao', 'venda')` na tabela `leads`.
- **Passo 3:** Executa consulta de contagem para certificar que todos os 120 leads estão como `'aluguel'`.

### 3.2 Atualização de Scripts Existentes
1. **`scripts/import-imoblead.ts`**:
   - Substituir `tipo_operacao: 'venda'` por `tipo_operacao: 'aluguel'`.
2. **`scripts/distribute-andre-dany.ts`**:
   - Substituir todas as ocorrências de `tipo_operacao: 'venda'` por `tipo_operacao: 'aluguel'`.

## 4. Plano de Teste e Validação
1. Executar `npx tsx scripts/update-leads-to-aluguel.ts`.
2. Verificar se o arquivo de backup foi criado com os 120 registros intactos.
3. Consultar a tabela `leads` no Supabase e validar as contagens por `tipo_operacao`.
4. Executar verificação estática/linting ou checagem de tipos com `npx tsc --noEmit` para garantir que nenhum script quebrou tipagem.

