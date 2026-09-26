-- Re-enable RLS now that we know the issue was PostgREST/Grants
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Simple policies that don't depend on complex session state for creation
DROP POLICY IF EXISTS "Public can create orders v2" ON public.orders;
CREATE POLICY "Public can create orders v3"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can create order items v2" ON public.order_items;
CREATE POLICY "Public can create order items v3"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure owners can still see their orders
DROP POLICY IF EXISTS "Owners can view their orders" ON public.orders;
CREATE POLICY "Owners can view their orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can view their order items" ON public.order_items;
CREATE POLICY "Owners can view their order items"
ON public.order_items FOR SELECT
TO authenticated
USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())));
