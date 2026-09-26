-- Allow authenticated users to upload products images to their own folder
CREATE POLICY "Users can upload product images to their store folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to update/delete their own product images
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

-- Allow public to read product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');