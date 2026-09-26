-- 1. Reativar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Garantir privilégios
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- 3. Políticas para a tabela 'orders'
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.orders;
CREATE POLICY "Permitir inserção de pedidos" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Donos podem ler seus pedidos" ON public.orders;
CREATE POLICY "Donos podem ler seus pedidos" 
ON public.orders FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = orders.store_id 
        AND stores.owner_id = auth.uid()
    )
);

-- 4. Políticas para a tabela 'order_items'
DROP POLICY IF EXISTS "Permitir inserção de itens" ON public.order_items;
CREATE POLICY "Permitir inserção de itens" 
ON public.order_items FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Donos podem ler itens de seus pedidos" ON public.order_items;
CREATE POLICY "Donos podem ler itens de seus pedidos" 
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
