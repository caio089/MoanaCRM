-- Remove catálogos inventados (demo CE + Banco Inter) e semeia cidades reais dos leads.

DELETE FROM public.cidades;

DELETE FROM public.correspondentes_bancarios
WHERE lower(btrim(nome)) = 'banco inter';

INSERT INTO public.cidades (nome, uf, ativo) VALUES
  ('Teresina', 'PI', true),
  ('Altos', 'PI', true),
  ('Demerval Lobão', 'PI', true),
  ('Timon', 'MA', true)
ON CONFLICT (nome, uf) DO UPDATE SET
  ativo = true,
  atualizado_em = now();

ALTER TABLE public.cidades ALTER COLUMN uf SET DEFAULT 'PI';
