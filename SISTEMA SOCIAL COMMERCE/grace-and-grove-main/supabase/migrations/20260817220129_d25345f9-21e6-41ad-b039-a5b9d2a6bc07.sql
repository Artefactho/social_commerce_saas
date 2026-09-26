-- Resolução Definitiva para Inserção Anônima com RLS Ativo
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anon cannot select orders" ON public.orders;
DROP POLICY IF EXISTS "Owners can select their orders" ON public.orders;
DROP POLICY IF EXISTS "Owners can select their order items" ON public.order_items;

-- 1. Política de Inserção (Sem WITH CHECK restritivo para evitar bugs de visibilidade pós-insert no PostgREST)
CREATE POLICY "Enable insert for everyone" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable insert for items everyone" ON public.order_items FOR INSERT TO public WITH CHECK (true);

-- 2. Política de Leitura (RIGOROSA: Apenas donos e service_role)
-- Se não houver política de SELECT para anon, ele retorna vazio por padrão (comportamento RLS)
CREATE POLICY "Enable read for owners only" 
ON public.orders FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = orders.store_id 
        AND stores.owner_id = auth.uid()
    )
);

CREATE POLICY "Enable read for items owners only" 
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

-- 3. Grant final
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
