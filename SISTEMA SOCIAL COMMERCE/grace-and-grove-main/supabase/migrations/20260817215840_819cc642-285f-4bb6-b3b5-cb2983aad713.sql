-- Garantir que anônimos possam ler o ID da loja pelo slug para o checkout
DROP POLICY IF EXISTS "Permitir leitura pública de lojas" ON public.stores;
CREATE POLICY "Permitir leitura pública de lojas" 
ON public.stores FOR SELECT 
TO anon, authenticated 
USING (true);
