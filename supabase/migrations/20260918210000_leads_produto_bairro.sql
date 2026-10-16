-- Campos de visita: produto (empreendimento) e bairro
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS produto text,
  ADD COLUMN IF NOT EXISTS bairro text;

CREATE INDEX IF NOT EXISTS idx_leads_produto ON public.leads (produto);
CREATE INDEX IF NOT EXISTS idx_leads_bairro ON public.leads (bairro);
