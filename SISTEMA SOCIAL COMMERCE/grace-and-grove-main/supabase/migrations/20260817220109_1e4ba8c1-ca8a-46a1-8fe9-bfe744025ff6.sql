-- 1. Garantir RLS ativo
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas de teste ultra-permissivas
DROP POLICY IF EXISTS "Permitir tudo para orders" ON public.orders;
DROP POLICY IF EXISTS "Permitir tudo para items" ON public.order_items;

-- 3. Configurar Política de INSERÇÃO (Pública para Checkout)
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Public can insert order items" 
ON public.order_items FOR INSERT 
TO public 
WITH CHECK (true);

-- 4. Configurar Política de LEITURA (Restrita a Donos)
-- Anônimos não conseguem ler (SELECT USING false)
CREATE POLICY "Anon cannot select orders" 
ON public.orders FOR SELECT 
TO anon 
USING (false);

-- Donos autenticados podem ler apenas pedidos de suas lojas
CREATE POLICY "Owners can select their orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = orders.store_id 
        AND stores.owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can select their order items" 
ON public.order_items FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        JOIN public.stores ON stores.id = orders.store_id
        WHERE orders.id = order_items.order_id
        AND stores.owner_id = auth.uid()
    )
);

-- 5. Garantir privilégios
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
