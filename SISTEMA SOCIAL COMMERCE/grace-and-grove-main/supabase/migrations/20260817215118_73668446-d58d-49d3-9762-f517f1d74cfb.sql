GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- Ensure SELECT for owners
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);
