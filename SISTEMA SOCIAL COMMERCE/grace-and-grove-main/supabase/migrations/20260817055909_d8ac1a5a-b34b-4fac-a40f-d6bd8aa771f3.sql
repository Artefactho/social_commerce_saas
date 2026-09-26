-- 1. Remover políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Users can upload product images to their store folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- 2. Criar Políticas Multi-tenant

-- INSERT: Apenas lojista no próprio store_id
CREATE POLICY "Users can upload product images to their store folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- UPDATE/DELETE/ALL: Apenas lojista no próprio store_id
CREATE POLICY "Users can manage their own product images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- SELECT: Acesso público
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');
