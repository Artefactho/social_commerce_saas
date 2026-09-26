DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
FOR SELECT TO anon, authenticated
USING (status = 'Ativo');