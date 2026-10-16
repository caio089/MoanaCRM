-- Modalidade do imóvel (novo, usado, aquisição e construção, empreendimento),
-- separada da modalidade de financiamento (MCMV, SBPE, direto, financiamento).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS categoria_imovel text;

-- Valores antigos de imóvel que estavam gravados em `modalidade`
UPDATE public.leads
SET categoria_imovel = 'empreendimento', modalidade = NULL
WHERE upper(modalidade) = 'EMPREENDIMENTO';

UPDATE public.leads
SET tipo_imovel = coalesce(tipo_imovel, 'casa'), modalidade = NULL
WHERE upper(modalidade) = 'CASA';

-- Padroniza zona/tipo para os valores usados nos formulários
UPDATE public.leads SET zona = lower(zona) WHERE zona IS NOT NULL AND zona <> lower(zona);
UPDATE public.leads SET tipo_imovel = lower(tipo_imovel)
WHERE tipo_imovel IS NOT NULL AND tipo_imovel <> lower(tipo_imovel);

-- Catálogo de correspondentes (somente nomes de empresas, sem contatos pessoais).
INSERT INTO public.correspondentes_bancarios (nome, ativo)
SELECT v.nome, true
FROM (VALUES
  ('Alpha'),
  ('The Cred'),
  ('ZM'),
  ('CredCaixa'),
  ('DLS'),
  ('Líder'),
  ('ALSTHE'),
  ('ALSALTOS'),
  ('R2'),
  ('REPASSE'),
  ('TOPCRED'),
  ('PREMIER'),
  ('CLEIAROCHA'),
  ('MARYNA'),
  ('DAVIDSOLUÇÕES'),
  ('ASCORRESPONDENTE')
) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.correspondentes_bancarios c WHERE lower(c.nome) = lower(v.nome)
);
