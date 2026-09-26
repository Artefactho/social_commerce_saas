-- Teste de isolamento local, descartável — roda só contra o Postgres local
-- (ou, sob aviso explícito ao dono do produto, contra um projeto Supabase
-- real vazio para revalidação), nunca sem antes ter sido validado localmente.
-- Baseado no cenário de SEED_DATA.md (Tenant A / Tenant B), já incluindo
-- organizations/organization_members (migration 20260913010000) e
-- categories/customers/product_type (migration 20260913040000).
--
-- Ordem importa: os testes destrutivos (que excluem a Loja A) ficam por
-- último, depois de todos os testes que dependem de A e B ainda existirem.

BEGIN;

-- Usuários de teste (inseridos direto em auth.users, só para simular sessões
-- autenticadas neste teste — nunca fazer isso num projeto com dado real)
INSERT INTO auth.users (id, email, encrypted_password, instance_id, aud, role)
VALUES
  ('faaaaaaa-1111-1111-1111-111111111111', 'owner.a.isoltest@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('faaaaaaa-2222-2222-2222-222222222222', 'owner.b.isoltest@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('faaaaaaa-3333-3333-3333-333333333333', 'admin.isoltest@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('faaaaaaa-4444-1111-1111-111111111111', 'staff.a.isoltest@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

INSERT INTO public.user_roles (user_id, role) VALUES ('faaaaaaa-3333-3333-3333-333333333333', 'admin');

-- Organizações e membros
INSERT INTO public.organizations (id, name) VALUES
  ('faaaaaaa-5555-0000-0000-000000000001', 'Org A'),
  ('faaaaaaa-6666-0000-0000-000000000001', 'Org B');

INSERT INTO public.organization_members (organization_id, user_id, role) VALUES
  ('faaaaaaa-5555-0000-0000-000000000001', 'faaaaaaa-1111-1111-1111-111111111111', 'owner'),
  ('faaaaaaa-5555-0000-0000-000000000001', 'faaaaaaa-4444-1111-1111-111111111111', 'staff'),
  ('faaaaaaa-6666-0000-0000-000000000001', 'faaaaaaa-2222-2222-2222-222222222222', 'owner');

-- Lojas
INSERT INTO public.stores (id, owner_id, organization_id, name, slug) VALUES
  ('faaaaaaa-a000-0000-0000-000000000001', 'faaaaaaa-1111-1111-1111-111111111111', 'faaaaaaa-5555-0000-0000-000000000001', 'Loja A', 'loja-a-isoltest'),
  ('faaaaaaa-b000-0000-0000-000000000001', 'faaaaaaa-2222-2222-2222-222222222222', 'faaaaaaa-6666-0000-0000-000000000001', 'Loja B', 'loja-b-isoltest');

-- Produtos (1 ativo e 1 rascunho em cada loja, pra testar o filtro de status)
INSERT INTO public.products (store_id, name, price, status) VALUES
  ('faaaaaaa-a000-0000-0000-000000000001', 'Perfume X (ativo)', 100, 'Ativo'),
  ('faaaaaaa-a000-0000-0000-000000000001', 'Perfume X (rascunho)', 100, 'Rascunho'),
  ('faaaaaaa-b000-0000-0000-000000000001', 'Camiseta Y (ativo)', 50, 'Ativo');

-- Pedidos
INSERT INTO public.orders (store_id, customer_name, customer_email, total_amount) VALUES
  ('faaaaaaa-a000-0000-0000-000000000001', 'Cliente A', 'cliente.a.isoltest@teste.com', 100),
  ('faaaaaaa-b000-0000-0000-000000000001', 'Cliente B', 'cliente.b.isoltest@teste.com', 50);

-- Categorias (Fase 3)
INSERT INTO public.categories (id, store_id, name, slug) VALUES
  ('faaaaaaa-c000-0000-0000-000000000001', 'faaaaaaa-a000-0000-0000-000000000001', 'Perfumes', 'perfumes-isoltest'),
  ('faaaaaaa-c000-0000-0000-000000000002', 'faaaaaaa-b000-0000-0000-000000000001', 'Roupas', 'roupas-isoltest');

-- Cupons (Fase 3)
INSERT INTO public.coupons (id, store_id, code, discount_type, discount_value) VALUES
  ('faaaaaaa-d000-0000-0000-000000000001', 'faaaaaaa-a000-0000-0000-000000000001', 'BEMVINDA10-ISOLTEST', 'percentage', 10),
  ('faaaaaaa-d000-0000-0000-000000000002', 'faaaaaaa-b000-0000-0000-000000000001', 'PROMOB-ISOLTEST', 'fixed', 15);

-- ============================================================================
-- TESTE 1: anon só vê produtos ativos (de qualquer loja, é vitrine pública)
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.products
    WHERE store_id IN ('faaaaaaa-a000-0000-0000-000000000001', 'faaaaaaa-b000-0000-0000-000000000001');
  IF cnt <> 2 THEN RAISE EXCEPTION 'TESTE 1 FALHOU: anon deveria ver 2 produtos ativos (A+B) deste teste, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 1 OK: anon ve exatamente % produtos ativos deste teste', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 2: Tenant A (authenticated) NUNCA ve pedidos do Tenant B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.orders WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  IF cnt <> 0 THEN RAISE EXCEPTION 'TESTE 2 FALHOU (ISOLAMENTO QUEBRADO): Tenant A viu % pedido(s) do Tenant B', cnt; END IF;
  RAISE NOTICE 'TESTE 2 OK: Tenant A nao ve nenhum pedido do Tenant B (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 3: Tenant A NUNCA ve order_items do Tenant B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  IF cnt <> 0 THEN RAISE EXCEPTION 'TESTE 3 FALHOU (ISOLAMENTO QUEBRADO): Tenant A viu % item(ns) de pedido do Tenant B', cnt; END IF;
  RAISE NOTICE 'TESTE 3 OK: Tenant A nao ve order_items do Tenant B (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 4 (IDOR): Tenant A NUNCA consegue editar a loja do Tenant B pelo ID direto
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.stores SET name = 'HACKED' WHERE id = 'faaaaaaa-b000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 4 FALHOU (IDOR): Tenant A conseguiu editar % linha(s) da Loja B', affected; END IF;
  RAISE NOTICE 'TESTE 4 OK: UPDATE de Tenant A na Loja B afetou % linhas', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 5: Admin do SaaS VE pedidos de ambos os tenants (comportamento esperado)
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-3333-3333-3333-333333333333","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.orders
    WHERE store_id IN ('faaaaaaa-a000-0000-0000-000000000001', 'faaaaaaa-b000-0000-0000-000000000001');
  IF cnt <> 2 THEN RAISE EXCEPTION 'TESTE 5 FALHOU: admin deveria ver 2 pedidos (A+B) deste teste, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 5 OK: admin ve os % pedidos de ambos os tenants (deste teste)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 6: Tenant B (dono real) CONSEGUE ver seu proprio pedido normalmente
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-2222-2222-2222-222222222222","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.orders WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  IF cnt <> 1 THEN RAISE EXCEPTION 'TESTE 6 FALHOU: Tenant B deveria ver 1 pedido proprio, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 6 OK: Tenant B ve seu proprio pedido (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 7 (RBAC): staff da Org A CONSEGUE editar produto da propria loja
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.products SET name = 'Perfume X (editado por staff)'
    WHERE store_id = 'faaaaaaa-a000-0000-0000-000000000001' AND status = 'Ativo';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'TESTE 7 FALHOU: staff da Org A deveria editar 1 produto proprio, afetou %', affected; END IF;
  RAISE NOTICE 'TESTE 7 OK: staff da Org A edita produto da propria loja (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 8 (RBAC + isolamento cruzado): staff da Org A NUNCA ve/edita produto da Org B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.products SET name = 'HACKED' WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 8 FALHOU (ISOLAMENTO QUEBRADO): staff da Org A editou % produto(s) da Org B', affected; END IF;
  RAISE NOTICE 'TESTE 8 OK: staff da Org A nao edita produtos da Org B (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 9 (Store Configuration): anon consegue ler o ThemeConfig de
-- qualquer loja (precisa renderizar a vitrine pública)
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.store_theme_configs
    WHERE store_id IN ('faaaaaaa-a000-0000-0000-000000000001', 'faaaaaaa-b000-0000-0000-000000000001');
  IF cnt <> 2 THEN RAISE EXCEPTION 'TESTE 9 FALHOU: anon deveria ver 2 store_theme_configs (criadas pelo trigger), viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 9 OK: anon le o ThemeConfig de ambas as lojas (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 10 (RBAC + isolamento cruzado): staff da Org A NUNCA edita o
-- ThemeConfig da Loja B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.store_theme_configs SET config = '{"themeId":"hacked"}'::jsonb
    WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 10 FALHOU (ISOLAMENTO QUEBRADO): staff da Org A editou % ThemeConfig(s) da Loja B', affected; END IF;
  RAISE NOTICE 'TESTE 10 OK: staff da Org A nao edita o ThemeConfig da Loja B (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 11 (Fase 3 - categories): anon le categorias de qualquer loja
-- (vitrine publica precisa filtrar produtos por categoria)
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.categories
    WHERE id IN ('faaaaaaa-c000-0000-0000-000000000001', 'faaaaaaa-c000-0000-0000-000000000002');
  IF cnt <> 2 THEN RAISE EXCEPTION 'TESTE 11 FALHOU: anon deveria ver 2 categorias, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 11 OK: anon le categorias de ambas as lojas (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 12 (Fase 3 - categories, isolamento cruzado): staff da Org A NUNCA
-- edita categoria da Loja B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.categories SET name = 'HACKED' WHERE id = 'faaaaaaa-c000-0000-0000-000000000002';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 12 FALHOU (ISOLAMENTO QUEBRADO): staff da Org A editou % categoria(s) da Loja B', affected; END IF;
  RAISE NOTICE 'TESTE 12 OK: staff da Org A nao edita categoria da Loja B (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 13 (Fase 3 - customers, privacidade): anon consegue CRIAR um
-- cliente (checkout de convidado), mas NAO consegue LER a lista de clientes
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  -- SEM RETURNING de propósito: anon pode INSERIR (WITH CHECK true) mas não
  -- pode LER (sem policy de SELECT pra anon) -- um INSERT com RETURNING
  -- reavaliaria a policy de SELECT sobre a linha nova e falharia, pelo
  -- mesmo motivo do bug de create_organization() (ver migration
  -- 20260913030000). Qualquer código de checkout que crie um customer como
  -- convidado deve seguir essa mesma regra: nunca encadear .select() depois
  -- de inserir um customer como anon.
  INSERT INTO public.customers (store_id, name, email)
    VALUES ('faaaaaaa-b000-0000-0000-000000000001', 'Cliente Anonimo', 'anonimo.isoltest@teste.com');

  SELECT count(*) INTO cnt FROM public.customers;
  IF cnt <> 0 THEN RAISE EXCEPTION 'TESTE 13 FALHOU (PRIVACIDADE QUEBRADA): anon conseguiu LER % cliente(s)', cnt; END IF;
  RAISE NOTICE 'TESTE 13 OK: anon cria cliente (checkout de convidado) mas nao consegue ler a lista (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 14 (Fase 3 - customers, isolamento cruzado): owner da Org B le seus
-- proprios clientes, mas staff da Org A NUNCA le clientes da Loja B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-2222-2222-2222-222222222222","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.customers WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  IF cnt <> 1 THEN RAISE EXCEPTION 'TESTE 14a FALHOU: owner da Loja B deveria ver 1 cliente proprio, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 14a OK: owner da Loja B ve seu proprio cliente (%)', cnt;
END $$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.customers WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001';
  IF cnt <> 0 THEN RAISE EXCEPTION 'TESTE 14b FALHOU (ISOLAMENTO QUEBRADO): staff da Org A viu % cliente(s) da Loja B', cnt; END IF;
  RAISE NOTICE 'TESTE 14b OK: staff da Org A nao ve clientes da Loja B (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 15 (Fase 3 - coupons): anon le cupons ativos de qualquer loja
-- (checkout precisa validar um codigo digitado mesmo sem login)
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.coupons
    WHERE id IN ('faaaaaaa-d000-0000-0000-000000000001', 'faaaaaaa-d000-0000-0000-000000000002');
  IF cnt <> 2 THEN RAISE EXCEPTION 'TESTE 15 FALHOU: anon deveria ver 2 cupons ativos, viu %', cnt; END IF;
  RAISE NOTICE 'TESTE 15 OK: anon le cupons ativos de ambas as lojas (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 16 (Fase 3 - coupons, escopo por loja): um cupom da Loja A NUNCA e
-- "encontrado" numa consulta escopada pra Loja B (mesmo o codigo sendo
-- teoricamente legivel via RLS) -- e assim que o checkout deve validar
-- cupom: sempre filtrando por store_id + code juntos.
-- ============================================================================
SET LOCAL ROLE anon;
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.coupons
    WHERE store_id = 'faaaaaaa-b000-0000-0000-000000000001' AND code = 'BEMVINDA10-ISOLTEST';
  IF cnt <> 0 THEN RAISE EXCEPTION 'TESTE 16 FALHOU: cupom da Loja A foi encontrado numa consulta escopada pra Loja B (% linha(s))', cnt; END IF;
  RAISE NOTICE 'TESTE 16 OK: cupom da Loja A nao e encontrado numa consulta escopada pra Loja B (%)', cnt;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 17 (Fase 3 - coupons, RBAC + isolamento cruzado): staff da Org A
-- NUNCA edita cupom da Loja B
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  UPDATE public.coupons SET discount_value = 999 WHERE id = 'faaaaaaa-d000-0000-0000-000000000002';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 17 FALHOU (ISOLAMENTO QUEBRADO): staff da Org A editou % cupom(ns) da Loja B', affected; END IF;
  RAISE NOTICE 'TESTE 17 OK: staff da Org A nao edita cupom da Loja B (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 18 (RBAC): staff NUNCA consegue excluir a loja (so owner/admin podem)
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-4444-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  DELETE FROM public.stores WHERE id = 'faaaaaaa-a000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'TESTE 18 FALHOU (RBAC QUEBRADO): staff conseguiu excluir a propria loja (% linha(s))', affected; END IF;
  RAISE NOTICE 'TESTE 18 OK: staff nao consegue excluir a loja (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 19 (RBAC, DESTRUTIVO DE PROPOSITO): owner da Org A CONSEGUE excluir a
-- propria loja -- por ultimo entre os testes que dependem de A/B, ja que
-- remove a Loja A e, em cascata, seus produtos/categorias/store_theme_config
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE affected int;
BEGIN
  DELETE FROM public.stores WHERE id = 'faaaaaaa-a000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'TESTE 19 FALHOU: owner deveria conseguir excluir a propria loja, afetou %', affected; END IF;
  RAISE NOTICE 'TESTE 19 OK: owner exclui a propria loja (%)', affected;
END $$;
RESET ROLE;

-- ============================================================================
-- TESTE 20 (regressão): um usuário AUTENTICADO DE VERDADE (não superusuário)
-- consegue criar sua própria organização + virar owner via
-- create_organization(), mesmo com outras organizations/organization_members
-- já existindo no banco. Isso exercita o fluxo de bootstrap real (mesmo
-- caminho usado pelo onboarding do frontend) como o role `authenticated` de
-- fato -- os testes anteriores inseriam esses dados direto como
-- superusuario (setup), nunca testando esse fluxo de verdade. Foi assim que
-- o bug do RETURNING-antes-de-virar-membro foi encontrado.
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"faaaaaaa-1111-1111-1111-111111111111","role":"authenticated"}';
DO $$
DECLARE new_org public.organizations;
DECLARE affected int;
BEGIN
  SELECT * INTO new_org FROM public.create_organization('Org C (criada via authenticated)');

  SELECT count(*) INTO affected FROM public.organization_members WHERE organization_id = new_org.id;
  IF affected <> 1 THEN RAISE EXCEPTION 'TESTE 20 FALHOU (REGRESSAO): create_organization() nao deixou o usuario como membro'; END IF;
  RAISE NOTICE 'TESTE 20 OK: usuario autenticado cria organizacao via create_organization() e vira owner, mesmo com outras orgs ja existentes';
END $$;
RESET ROLE;

ROLLBACK; -- descarta todos os dados de teste, nao deixa residuo no banco
