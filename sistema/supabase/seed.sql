-- Seed local de desenvolvimento — cenário padrão descrito em docs/SEED_DATA.md
-- (Tenant A / Tenant B), adaptado ao schema atual (baseline squashada em
-- migrations/20260913000000_baseline_schema.sql). Roda automaticamente em
-- `supabase db reset`. NUNCA rodar isso contra um projeto Supabase real.

INSERT INTO auth.users (id, email, encrypted_password, instance_id, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner.a@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'owner.b@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'admin@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('44444444-1111-1111-1111-111111111111', 'staff.a@teste.com', 'x', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'admin')
ON CONFLICT DO NOTHING;

-- description/thumbnail_url/preview_url preenchidos (antes ficavam NULL,
-- quebrando a thumbnail e o botao de preview no onboarding — passo 3
-- "Visual"). thumbnail_url usa uma imagem de estoque so pra demonstracao
-- local; preview_url aponta pra loja-a (seed abaixo), que ja roda o tema
-- Aura Maison de verdade.
INSERT INTO public.templates (id, name, layout_key, active, description, thumbnail_url, preview_url)
VALUES (
  '44444444-0000-0000-0000-000000000001',
  'Aura Maison',
  'premium',
  true,
  'Tema oficial de luxo, com catálogo, carrinho e favoritos adaptados aos seus produtos.',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
  '/store/loja-a'
)
ON CONFLICT (layout_key) DO UPDATE SET
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  preview_url = EXCLUDED.preview_url;

-- Segundo tema real (2026-09-17): Aurea Joalheria — mesmo padrão do Theme
-- Contract do Aura Maison, ver skills/theme-contract.md secao 13.
-- thumbnail_url: screenshot real da loja de teste (techgadgets-brasil)
-- rodando esse tema, upload feito no bucket "products" em
-- templates/<id>/thumbnail.png (service_role, fora do padrao {store_id}/...
-- porque nao pertence a nenhuma loja) e resolvido aqui como signed URL de
-- 1 ano (mesmo padrao de product.image_url/store.logo_url). ASSUMPTION
-- (baixo impacto): essa URL so funciona se o objeto ainda existir no
-- storage local — um `supabase db reset` recria as tabelas (incluindo
-- storage.objects) mas nao reenvia o arquivo sozinho, entao apos um reset
-- e preciso refazer o upload (o onboarding ja trata thumbnail_url quebrado/
-- ausente de forma graciosa, entao isso nunca derruba a tela, so volta a
-- mostrar o placeholder). preview_url aponta pra techgadgets-brasil (seed
-- abaixo) — loja de nicho deliberadamente diferente (eletrônicos), agora
-- formalizada como fixture permanente do seed, rodando esse tema de verdade
-- (mesmo padrão do Aura Maison apontar pra loja-a).
INSERT INTO public.templates (id, name, layout_key, active, description, thumbnail_url, preview_url)
VALUES (
  '44444444-0000-0000-0000-000000000002',
  'Aurea Joalheria',
  'aurea-joalheria',
  true,
  'Tema em tons de ônix e dourado, com tipografia serifada — catálogo, carrinho e favoritos adaptados aos seus produtos.',
  'http://127.0.0.1:54321/storage/v1/object/sign/products/templates/44444444-0000-0000-0000-000000000002/thumbnail.png?token=eyJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0cy90ZW1wbGF0ZXMvNDQ0NDQ0NDQtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAyL3RodW1ibmFpbC5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg5NjI3MjQ3LCJleHAiOjE4MjExNjMyNDd9.iGxMhfGnZVqfbcIp0ShCZdNiumrqmi3LAI6SWgXwTfk',
  '/store/techgadgets-brasil'
)
ON CONFLICT (layout_key) DO UPDATE SET
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  preview_url = EXCLUDED.preview_url;

-- Planos (nomes oficiais: VISAO_E_MODELO_DE_NEGOCIO.md secao 4 — BASICO/PRO/
-- MASTER). A tabela plans esta vazia hoje tanto local quanto no projeto
-- Supabase real (nenhuma migration insere dado nela) — isto e so seed de
-- demonstracao local para a pagina /planos ter conteudo real para validar.
-- NUNCA aplicado ao projeto real (seed.sql so roda via `supabase db reset`).
INSERT INTO public.plans (id, name, price) VALUES
  ('77777777-0000-0000-0000-000000000001', 'BÁSICO', 49.00),
  ('77777777-0000-0000-0000-000000000002', 'PRO', 99.00),
  ('77777777-0000-0000-0000-000000000003', 'MASTER', 199.00)
ON CONFLICT (id) DO NOTHING;

-- Organizações e membros (Tenant A tem 1 owner + 1 staff, Tenant B só o owner)
INSERT INTO public.organizations (id, name) VALUES
  ('55555555-0000-0000-0000-000000000001', 'Aura Maison Teste'),
  ('66666666-0000-0000-0000-000000000001', 'Loja Genérica Teste')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role) VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('55555555-0000-0000-0000-000000000001', '44444444-1111-1111-1111-111111111111', 'staff'),
  ('66666666-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO public.stores (id, owner_id, organization_id, name, slug, active_template_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', 'Loja A', 'loja-a', '44444444-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '66666666-0000-0000-0000-000000000001', 'Loja B', 'loja-b', '44444444-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- Loja de preview do tema Aurea Joalheria (2026-09-17) — nicho
-- deliberadamente diferente (eletrônicos), mesmo owner/organização de
-- "Loja B" (reaproveitado, não é membro novo). Não faz parte do cenário de
-- isolamento Tenant A/B de SEED_DATA.md (esse continua sendo só loja-a/
-- loja-b) — é só a fixture usada pelo botão "Ver Preview" do template no
-- onboarding, mesmo papel que loja-a cumpre para o Aura Maison.
INSERT INTO public.stores (id, owner_id, organization_id, name, slug, active_template_id) VALUES
  ('cccccccc-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '66666666-0000-0000-0000-000000000001', 'TechGadgets Brasil', 'techgadgets-brasil', '44444444-0000-0000-0000-000000000002')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, store_id, name, slug, sort_order) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Eletrônicos', 'eletronicos', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (store_id, name, price, status, category, product_type, description) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Perfume X', 189.90, 'Ativo', 'Perfumes', 'physical', NULL),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Camiseta Y', 79.90, 'Ativo', 'Roupas', 'physical', NULL),
  ('cccccccc-0000-0000-0000-000000000001', 'Fone Bluetooth XPro', 249.90, 'Ativo', 'Eletrônicos', 'physical', 'Fone de ouvido sem fio com cancelamento de ruído.'),
  ('cccccccc-0000-0000-0000-000000000001', 'Carregador Turbo 65W', 129.90, 'Ativo', 'Eletrônicos', 'physical', 'Carregador rápido USB-C compatível com notebooks e celulares.');

-- A linha de store_theme_configs já existe (criada pelo trigger ao inserir a
-- loja acima) — aqui só ativamos o Theme Contract Aurea Joalheria de verdade
-- (mesmo papel do UPDATE da Loja A logo abaixo, para o Aura Maison).
UPDATE public.store_theme_configs SET config = '{"themeId": "aurea-joalheria"}'::jsonb
WHERE store_id = 'cccccccc-0000-0000-0000-000000000001';

INSERT INTO public.orders (store_id, customer_name, customer_email, total_amount, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Cliente A', 'cliente.a@teste.com', 189.90, 'paid'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Cliente B', 'cliente.b@teste.com', 79.90, 'pending');

-- A linha de store_theme_configs já existe (criada pelo trigger ao inserir a
-- loja acima) — aqui só preenchemos com a identidade visual real da Loja A
-- (paleta Aura Maison, skills/theme-contract.md seção 3).
UPDATE public.store_theme_configs SET config = '{
  "themeId": "aura-maison",
  "themeVersion": "1.0.0",
  "colors": {
    "primary": "#D4AF37",
    "primaryText": "#1C1917",
    "backgroundCanvas": "#FAF8F5",
    "surfaceCard": "#FFFFFF",
    "textPrimary": "#1C1917",
    "textMuted": "#78716C",
    "borderSubtle": "#EAE2D3",
    "accentPromotion": "#E11D48"
  },
  "typography": {
    "fontFamilyHeading": "Playfair Display, serif",
    "fontFamilyBody": "Plus Jakarta Sans, sans-serif",
    "headingScale": "normal"
  }
}'::jsonb
WHERE store_id = 'aaaaaaaa-0000-0000-0000-000000000001';
