-- 1. Add shipping_fee to stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) DEFAULT 0.00 CHECK (shipping_fee >= 0);

-- 2. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    product_name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update Orders Table Grants & RLS
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- 4. Grants & RLS for order_items
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies for orders
DROP POLICY IF EXISTS "Anyone can create an order" ON public.orders;
CREATE POLICY "Anyone can create an order" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can view their own store orders" ON public.orders;
CREATE POLICY "Store owners can view their own store orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (
    exists (
        select 1 from public.stores
        where stores.id = orders.store_id
        and stores.owner_id = auth.uid()
    )
);

-- 6. Policies for order_items
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" 
ON public.order_items FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can view their own store order items" ON public.order_items;
CREATE POLICY "Store owners can view their own store order items" 
ON public.order_items FOR SELECT 
TO authenticated 
USING (
    exists (
        select 1 from public.orders
        join public.stores on stores.id = orders.store_id
        where orders.id = order_items.order_id
        and stores.owner_id = auth.uid()
    )
);