-- Resetar e simplificar políticas de inserção para garantir que o checkout funcione
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.orders;
CREATE POLICY "Permitir inserção de pedidos" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de itens" ON public.order_items;
CREATE POLICY "Permitir inserção de itens" 
ON public.order_items FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Garantir que as tabelas tenham RLS ativo
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Garantir GRANTs
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
