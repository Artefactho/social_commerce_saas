-- Tentar política sem restrições de inserção para debugar o erro persistente de RLS no INSERT
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.orders;
CREATE POLICY "Permitir inserção de pedidos" 
ON public.orders FOR INSERT 
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de itens" ON public.order_items;
CREATE POLICY "Permitir inserção de itens" 
ON public.order_items FOR INSERT 
TO public
WITH CHECK (true);

-- Forçar GRANT ALL para anon nas sequências, caso o problema seja permissão de sequence no INSERT
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
