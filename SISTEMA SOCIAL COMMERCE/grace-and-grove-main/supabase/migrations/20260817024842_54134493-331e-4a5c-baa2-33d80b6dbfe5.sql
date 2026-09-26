-- Enums for store categories
create type public.store_category as enum ('Fashion', 'Beauty', 'Food', 'Electronics', 'Personal', 'Other');
create type public.app_role as enum ('admin', 'user');

-- Stores table
create table public.stores (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    slug text unique not null,
    category public.store_category not null default 'Other',
    logo_url text,
    banner_url text,
    primary_color text default '#6366f1',
    secondary_color text default '#f8fafc',
    custom_domain text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table public.products (
    id uuid primary key default gen_random_uuid(),
    store_id uuid references public.stores(id) on delete cascade not null,
    name text not null,
    description text,
    price numeric(12,2) not null check (price >= 0),
    promotional_price numeric(12,2) check (promotional_price >= 0),
    image_url text,
    category text,
    stock_quantity integer default 0,
    sku text,
    status text default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table
create table public.orders (
    id uuid primary key default gen_random_uuid(),
    store_id uuid references public.stores(id) on delete cascade not null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text,
    total_amount numeric(12,2) not null,
    status text default 'pending',
    payment_method text,
    shipping_address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User roles
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null default 'user',
    unique (user_id, role)
);

-- Security Definer Function for role check
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- GRANTS
grant select, insert, update, delete on public.stores to authenticated;
grant all on public.stores to service_role;
grant select on public.stores to anon; -- For public storefront

grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
grant select on public.products to anon; -- For public storefront

grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- RLS
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.user_roles enable row level security;

-- Policies for Stores
create policy "Users can manage their own stores"
on public.stores
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Public can view stores"
on public.stores
for select
to anon, authenticated
using (true);

-- Policies for Products
create policy "Store owners can manage their products"
on public.products
for all
to authenticated
using (
    exists (
        select 1 from public.stores
        where stores.id = products.store_id
        and stores.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.stores
        where stores.id = products.store_id
        and stores.owner_id = auth.uid()
    )
);

create policy "Public can view products"
on public.products
for select
to anon, authenticated
using (status = 'active');

-- Policies for Orders
create policy "Store owners can view their orders"
on public.orders
for select
to authenticated
using (
    exists (
        select 1 from public.stores
        where stores.id = orders.store_id
        and stores.owner_id = auth.uid()
    )
);

-- Policies for User Roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);
