-- 1. Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. GRANTs essenciais
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Políticas ultra-simples para teste
DROP POLICY IF EXISTS "Permitir tudo para orders" ON public.orders;
CREATE POLICY "Permitir tudo para orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para items" ON public.order_items;
CREATE POLICY "Permitir tudo para items" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);
