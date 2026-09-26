-- Re-grant on tables
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;

-- Try to grant on all sequences in public schema if they exist
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Re-apply policies
DROP POLICY IF EXISTS "Public can create orders v2" ON public.orders;
CREATE POLICY "Public can create orders v2"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can create order items v2" ON public.order_items;
CREATE POLICY "Public can create order items v2"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);
