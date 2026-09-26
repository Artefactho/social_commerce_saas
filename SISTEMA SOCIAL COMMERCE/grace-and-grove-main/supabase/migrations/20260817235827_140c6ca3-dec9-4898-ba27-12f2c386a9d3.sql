DO $$ 
BEGIN
    -- 1. Create plans table if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans') THEN
        CREATE TABLE public.plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            price NUMERIC NOT NULL,
            included_template_id UUID REFERENCES public.templates(id),
            created_at TIMESTAMPTZ DEFAULT now()
        );

        GRANT SELECT ON public.plans TO authenticated;
        GRANT SELECT ON public.plans TO anon;
        GRANT ALL ON public.plans TO service_role;

        ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Allow public read access for plans" ON public.plans
            FOR SELECT USING (true);
    END IF;

    -- 2. Update stores table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'plan_id') THEN
        ALTER TABLE public.stores 
        ADD COLUMN plan_id UUID REFERENCES public.plans(id),
        ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');
    END IF;

    -- 3. Seed plans linking to existing templates
    DELETE FROM public.plans; -- Clear to ensure fresh seed
    
    INSERT INTO public.plans (name, price, included_template_id)
    SELECT 'START', 49.00, id FROM public.templates WHERE name = 'Minimal' LIMIT 1;
    
    INSERT INTO public.plans (name, price, included_template_id)
    SELECT 'PRO', 99.00, id FROM public.templates WHERE name = 'Bold' LIMIT 1;
    
    INSERT INTO public.plans (name, price, included_template_id)
    SELECT 'MASTER', 199.00, id FROM public.templates WHERE name = 'Premium' LIMIT 1;

END $$;