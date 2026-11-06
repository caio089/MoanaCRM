-- Migration: 20261106120000_add_em_atendimento_to_etapa_funil.sql
-- Adiciona a opção 'em_atendimento' ao enum public.etapa_funil logo após 'lead'

ALTER TYPE public.etapa_funil ADD VALUE IF NOT EXISTS 'em_atendimento' AFTER 'lead';

