-- Construtoras extraídas de "PRECOS CONSTRUTORAS.xlsx".
-- A planilha repete RBC e Ramy; o seed consolida nomes únicos.
-- Sem TEMP TABLE: o SQL Editor do Supabase autocommita cada statement,
-- então CREATE TEMP ... ON COMMIT DROP apagava a tabela antes do INSERT.

DO $$
BEGIN
  CREATE TEMP TABLE seed_construtoras_planilha (
    nome text PRIMARY KEY,
    cidade text NOT NULL
  );

  INSERT INTO seed_construtoras_planilha (nome, cidade) VALUES
    ('Construtora Moana', 'Teresina'),
    ('Moreira e Sousa', 'Teresina, Demerval Lobão, Altos'),
    ('Coesa', 'Teresina'),
    ('Ágape', 'Teresina'),
    ('MRV', 'Teresina'),
    ('Canopus', 'Timon, Teresina'),
    ('Logus', 'Teresina'),
    ('Rivello', 'Teresina'),
    ('Semog', 'Timon, Teresina'),
    ('Lima e Santos', 'Teresina, Altos'),
    ('Valdomiro', 'Teresina'),
    ('Domus', 'Teresina'),
    ('RBC', 'Timon'),
    ('Macedo Fortes', 'Teresina'),
    ('Voitto', 'Teresina, Demerval Lobão'),
    ('Home', 'Teresina, Demerval Lobão, Altos'),
    ('Hack Engenharia', 'Teresina, Demerval Lobão, Altos'),
    ('PG', 'Teresina'),
    ('Construville', 'Altos'),
    ('Innovar', 'Altos'),
    ('Lavezzi', 'Teresina'),
    ('JD Construções', 'Teresina'),
    ('Engenhatec', 'Teresina'),
    ('Betacon', 'Teresina'),
    ('Montana', 'Altos, Demerval Lobão'),
    ('AR Construtora', 'Altos, Demerval Lobão'),
    ('Ypê', 'Altos, Teresina'),
    ('Virtude', 'Teresina'),
    ('Consteng', 'Altos, Demerval Lobão'),
    ('KF', 'Timon'),
    ('Rocha', 'Timon'),
    ('M3', 'Timon'),
    ('RS', 'Timon'),
    ('Ramy', 'Timon');

  -- Reativa e atualiza cadastros existentes (acentos/caixa ignorados).
  UPDATE public.construtoras AS c
  SET cidade = s.cidade,
      ativo = true,
      atualizado_em = now()
  FROM seed_construtoras_planilha AS s
  WHERE translate(lower(regexp_replace(btrim(c.nome), '\s+', ' ', 'g')),
                  'áàâãäéèêëíìîïóòôõöúùûüç',
                  'aaaaaeeeeiiiiooooouuuuc') =
        translate(lower(regexp_replace(btrim(s.nome), '\s+', ' ', 'g')),
                  'áàâãäéèêëíìîïóòôõöúùûüç',
                  'aaaaaeeeeiiiiooooouuuuc');

  -- Insere apenas os nomes ainda ausentes (idempotente).
  INSERT INTO public.construtoras (nome, cidade, ativo)
  SELECT s.nome, s.cidade, true
  FROM seed_construtoras_planilha AS s
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.construtoras AS c
    WHERE translate(lower(regexp_replace(btrim(c.nome), '\s+', ' ', 'g')),
                    'áàâãäéèêëíìîïóòôõöúùûüç',
                    'aaaaaeeeeiiiiooooouuuuc') =
          translate(lower(regexp_replace(btrim(s.nome), '\s+', ' ', 'g')),
                    'áàâãäéèêëíìîïóòôõöúùûüç',
                    'aaaaaeeeeiiiiooooouuuuc')
  )
  ON CONFLICT (nome) DO UPDATE SET
    cidade = EXCLUDED.cidade,
    ativo = true,
    atualizado_em = now();
END
$$;
