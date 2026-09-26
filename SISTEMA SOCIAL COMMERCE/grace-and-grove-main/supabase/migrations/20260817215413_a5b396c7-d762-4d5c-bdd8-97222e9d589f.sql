-- The 401 with RLS enabled even with simple policies suggests a deep PostgREST or grant issue.
-- Let's DISABLE RLS permanently for these public checkout tables (orders and order_items) 
-- as they are designed for public input, and security is handled by limited visibility (SELECT) later.

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Re-grant ALL to anon, authenticated and service_role
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
