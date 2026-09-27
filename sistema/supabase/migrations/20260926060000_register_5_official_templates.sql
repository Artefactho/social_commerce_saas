-- ============================================================================
-- MIGRATION: Registro dos 5 Temas Oficiais + Tabela store_sections (Section Engine)
-- ============================================================================

-- 1. Inserir ou atualizar os 5 templates oficiais na tabela templates
INSERT INTO public.templates (id, name, layout_key, active, description, thumbnail_url, preview_url)
VALUES
  (
    '44444444-0000-0000-0000-000000000004',
    'Base Theme',
    'base-theme',
    true,
    'Tema clássico e multi-propósito completo com sliders, banners informativos, instafeed e vídeo.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
    '/store/demo-base-theme'
  ),
  (
    '44444444-0000-0000-0000-000000000001',
    'Aura Maison',
    'aura-maison',
    true,
    'Tema oficial de luxo, com catálogo sofisticado, drawer de carrinho e favoritos adaptados aos seus produtos.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
    '/store/demo-aura-maison'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    'Áurea Joalheria',
    'aurea-joalheria',
    true,
    'Tema em tons de ônix e dourado com tipografia serifada de alta conversão.',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
    '/store/demo-aurea-joalheria'
  ),
  (
    '44444444-0000-0000-0000-000000000000',
    'Jô Perfumes & Cosméticos',
    'jo-perfumes',
    true,
    'Tema estilo Instagram Shop com Stories em destaque, Bio de perfil verificada, Hero Carousel e Bottom Nav mobile.',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80',
    '/store/demo-jo-perfumes'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    'Minimal Clean',
    'minimal-clean',
    true,
    'Design moderno e minimalista com foco total na apresentação dos produtos.',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    '/store/demo-minimal-clean'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  layout_key = EXCLUDED.layout_key,
  active = EXCLUDED.active,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  preview_url = EXCLUDED.preview_url;

-- Alias para retrocompatibilidade do layout_key 'premium' apontando para Aura Maison
-- e 'minimal' apontando para Minimal Clean se necessário
UPDATE public.templates SET layout_key = 'aura-maison' WHERE layout_key = 'premium';
UPDATE public.templates SET layout_key = 'minimal-clean' WHERE layout_key = 'minimal';

-- ----------------------------------------------------------------------------
-- 2. Tabela store_sections para suportar o Section Engine
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.store_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_sections_store_id ON public.store_sections(store_id);
CREATE INDEX IF NOT EXISTS idx_store_sections_position ON public.store_sections(store_id, position);

-- Habilitar RLS
ALTER TABLE public.store_sections ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para store_sections (Idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_sections' AND policyname = 'Public read for store_sections'
  ) THEN
    CREATE POLICY "Public read for store_sections"
    ON public.store_sections
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_sections' AND policyname = 'Store members can manage store_sections'
  ) THEN
    CREATE POLICY "Store members can manage store_sections"
    ON public.store_sections
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores s
        JOIN public.organization_members om ON om.organization_id = s.organization_id
        WHERE s.id = store_sections.store_id
        AND om.user_id = auth.uid()
      )
    );
  END IF;
END $$;
