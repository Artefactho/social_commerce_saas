-- 1. Create templates table
create table public.templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    thumbnail_url text,
    preview_url text,
    layout_key text not null unique,
    marketplace_price numeric(12,2) default 0,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create store_templates table (relation)
create table public.store_templates (
    id uuid primary key default gen_random_uuid(),
    store_id uuid references public.stores(id) on delete cascade not null,
    template_id uuid references public.templates(id) on delete cascade not null,
    acquired_via text default 'onboarding',
    acquired_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(store_id, template_id)
);

-- 3. Add active_template_id to stores
alter table public.stores 
add column active_template_id uuid references public.templates(id);

-- 4. GRANTS
grant select on public.templates to anon, authenticated;
grant all on public.templates to service_role;

grant select, insert, update on public.store_templates to authenticated;
grant all on public.store_templates to service_role;
grant select on public.store_templates to anon;

-- 5. RLS
alter table public.templates enable row level security;
alter table public.store_templates enable row level security;

-- Policies for Templates
create policy "Templates are viewable by everyone"
on public.templates for select
to anon, authenticated
using (active = true);

-- Policies for Store Templates
create policy "Store owners can manage their acquired templates"
on public.store_templates
for all
to authenticated
using (
    exists (
        select 1 from public.stores
        where stores.id = store_templates.store_id
        and stores.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.stores
        where stores.id = store_templates.store_id
        and stores.owner_id = auth.uid()
    )
);

create policy "Public can view store templates"
on public.store_templates for select
to anon, authenticated
using (true);

-- 6. Insert default templates
insert into public.templates (name, description, layout_key, thumbnail_url, preview_url)
values 
('Minimal', 'Focado na simplicidade, elegância e clareza. Ideal para marcas premium que deixam o produto falar por si.', 'minimal', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80'),
('Bold', 'Design vibrante com tipografia forte e cores marcantes. Perfeito para marcas urbanas e dinâmicas.', 'bold', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80'),
('Premium', 'Experiência luxuosa com animações suaves e foco total na apresentação da marca e storytelling.', 'premium', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&q=80');
