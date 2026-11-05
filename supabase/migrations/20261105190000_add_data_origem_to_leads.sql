-- Migration: 20261105190000_add_data_origem_to_leads.sql
-- Adiciona a coluna data_origem na tabela public.leads para registrar a data do primeiro contato do lead.

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS data_origem date;

COMMENT ON COLUMN public.leads.data_origem IS 'Data do primeiro contato do lead (Data de origem)';
