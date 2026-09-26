-- ============================================================================
-- BASELINE SCHEMA — SaaS Social Commerce
--
-- Squash das 28 migrations originais (17-19/08/2026, herdadas do código
-- Lovable) numa única baseline limpa e documentada, conforme ADR-0002
-- (docs/adr/0002-multi-tenancy.md). ~15 das 28 migrations originais eram
-- histórico de tentativa-e-erro habilitando/desabilitando RLS em
-- orders/order_items e criando policies quase idênticas repetidas (algumas
-- com sufixo "v3", em português e inglês misturados) — consolidadas aqui em
-- UMA policy por ação/tabela, preservando exatamente o mesmo conjunto de
-- permissões efetivas validado localmente (ver docs/historico/ para o
-- histórico original preservado).
--
-- Validado localmente via `supabase start` + `supabase db dump` antes deste
-- arquivo ser escrito — nunca aplicado a nenhum projeto Supabase real.
--
-- ATENÇÃO — escopo deste arquivo: reproduz fielmente o estado ATUAL do
-- código reaproveitado (stores/products/orders/plans/templates/
-- store_templates/user_roles + bucket de storage `products`). As tabelas
-- novas descritas em ARQUITETURA_TECNICA.md seção 4 (organizations,
-- organization_members, categories, customers, e o campo product_type em
-- products) NÃO estão nesta baseline — são trabalho real da Fase 1 do
-- ROADMAP_DE_EXECUCAO.md e devem entrar como uma migration incremental
-- separada, não misturadas a este squash.
--
-- NOTA DE ASSIMETRIA CONHECIDA (não corrigida aqui, ver Fase 1): a policy de
-- SELECT de `orders` inclui um override para admin
-- (has_role(auth.uid(),'admin')); a policy de SELECT equivalente de
-- `order_items` NÃO tem esse override hoje (assim era no schema original).
-- Vale alinhar isso deliberadamente na Fase 1, não foi silenciosamente
-- "corrigido" neste squash para não mudar o comportamento validado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tipos
-- ----------------------------------------------------------------------------

CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'user'
);

CREATE TYPE "public"."store_category" AS ENUM (
    'Fashion',
    'Beauty',
    'Food',
    'Electronics',
    'Personal',
    'Other'
);

-- ----------------------------------------------------------------------------
-- Tabelas (ordem segura para Foreign Keys)
-- ----------------------------------------------------------------------------

CREATE TABLE "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "preview_url" "text",
    "layout_key" "text" NOT NULL,
    "marketplace_price" numeric(12,2) DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."templates" ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."templates" ADD CONSTRAINT "templates_layout_key_key" UNIQUE ("layout_key");

CREATE TABLE "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "included_template_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE ONLY "public"."plans" ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."plans" ADD CONSTRAINT "plans_included_template_id_fkey" FOREIGN KEY ("included_template_id") REFERENCES "public"."templates"("id");

CREATE TABLE "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "category" "public"."store_category" DEFAULT 'Other'::"public"."store_category" NOT NULL,
    "logo_url" "text",
    "banner_url" "text",
    "primary_color" "text" DEFAULT '#6366f1'::"text",
    "secondary_color" "text" DEFAULT '#f8fafc'::"text",
    "custom_domain" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "active_template_id" "uuid",
    "shipping_fee" numeric(12,2) DEFAULT 0.00,
    "plan_id" "uuid",
    "trial_ends_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    CONSTRAINT "stores_shipping_fee_check" CHECK (("shipping_fee" >= (0)::numeric))
);
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_custom_domain_key" UNIQUE ("custom_domain");
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_active_template_id_fkey" FOREIGN KEY ("active_template_id") REFERENCES "public"."templates"("id");
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");

CREATE TABLE "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(12,2) NOT NULL,
    "promotional_price" numeric(12,2),
    "image_url" "text",
    "category" "text",
    "stock_quantity" integer DEFAULT 0,
    "sku" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_promotional_price_check" CHECK (("promotional_price" >= (0)::numeric))
);
ALTER TABLE ONLY "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

CREATE TABLE "public"."store_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "acquired_via" "text" DEFAULT 'onboarding'::"text",
    "acquired_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."store_templates" ADD CONSTRAINT "store_templates_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."store_templates" ADD CONSTRAINT "store_templates_store_id_template_id_key" UNIQUE ("store_id", "template_id");
ALTER TABLE ONLY "public"."store_templates" ADD CONSTRAINT "store_templates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."store_templates" ADD CONSTRAINT "store_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;

CREATE TABLE "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_email" "text" NOT NULL,
    "customer_phone" "text",
    "total_amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "shipping_address" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

CREATE TABLE "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "unit_price" numeric(12,2) NOT NULL,
    "product_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;

CREATE TABLE "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role" NOT NULL
);
ALTER TABLE ONLY "public"."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");
ALTER TABLE ONLY "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- Funções (definida aqui, depois de user_roles existir, para não depender de
-- check_function_bodies=false)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security — isolamento multi-tenant (ADR-0002)
-- ----------------------------------------------------------------------------

ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."store_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;

-- templates: leitura pública dos temas ativos; sem INSERT/UPDATE/DELETE via
-- policy (gerenciado só via service_role, ex: painel admin futuro)
CREATE POLICY "Templates are viewable by everyone" ON "public"."templates"
    FOR SELECT TO "authenticated", "anon" USING (("active" = true));

-- plans: leitura pública; sem mutação via policy (mesmo motivo acima)
CREATE POLICY "Allow public read access for plans" ON "public"."plans"
    FOR SELECT USING (true);

-- stores: leitura pública de todas as lojas (vitrine); dono gerencia a própria
CREATE POLICY "Public can view stores" ON "public"."stores"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "Users can manage their own stores" ON "public"."stores"
    TO "authenticated"
    USING (("auth"."uid"() = "owner_id"))
    WITH CHECK (("auth"."uid"() = "owner_id"));

-- products: leitura pública só de produtos ativos; dono gerencia os da própria loja
CREATE POLICY "Public can view products" ON "public"."products"
    FOR SELECT TO "authenticated", "anon" USING (("status" = 'Ativo'::"text"));
CREATE POLICY "Store owners can manage their products" ON "public"."products"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" WHERE "stores"."id" = "products"."store_id" AND "stores"."owner_id" = "auth"."uid"()))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" WHERE "stores"."id" = "products"."store_id" AND "stores"."owner_id" = "auth"."uid"()));

-- store_templates: leitura pública; dono gerencia os da própria loja
CREATE POLICY "Public can view store templates" ON "public"."store_templates"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "Store owners can manage their acquired templates" ON "public"."store_templates"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" WHERE "stores"."id" = "store_templates"."store_id" AND "stores"."owner_id" = "auth"."uid"()))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" WHERE "stores"."id" = "store_templates"."store_id" AND "stores"."owner_id" = "auth"."uid"()));

-- orders: qualquer um pode criar (checkout de convidado); dono ou admin do
-- SaaS pode ler. Consolida 12 policies duplicadas/quase-duplicadas do
-- histórico original (algumas só em português, outras só em inglês, uma
-- "v3") na versão mais completa (a única que já incluía o override de admin).
CREATE POLICY "Anyone can create an order" ON "public"."orders"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "Owners can view their orders" ON "public"."orders"
    FOR SELECT TO "authenticated"
    USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "store_id" IN (SELECT "stores"."id" FROM "public"."stores" WHERE "stores"."owner_id" = "auth"."uid"()));

-- order_items: mesma lógica de orders, mas SEM o override de admin (assim já
-- era no schema original — ver nota de assimetria no topo do arquivo).
-- Consolida 10 policies duplicadas do histórico original.
CREATE POLICY "Anyone can create order items" ON "public"."order_items"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "Owners can view their order items" ON "public"."order_items"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."orders" JOIN "public"."stores" ON "stores"."id" = "orders"."store_id"
        WHERE "orders"."id" = "order_items"."order_id" AND "stores"."owner_id" = "auth"."uid"()
    ));

-- user_roles: cada usuário só lê sua própria role; só admin gerencia roles
CREATE POLICY "Users can view their own roles" ON "public"."user_roles"
    FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Admins can insert roles" ON "public"."user_roles"
    FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));
CREATE POLICY "Admins can update roles" ON "public"."user_roles"
    FOR UPDATE TO "authenticated"
    USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"))
    WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));
CREATE POLICY "Admins can delete roles" ON "public"."user_roles"
    FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));

-- ----------------------------------------------------------------------------
-- Grants (necessários para o PostgREST expor as tabelas via API)
-- ----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

REVOKE ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role", "authenticated";

GRANT ALL ON TABLE "public"."templates" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."plans" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."stores" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."products" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."store_templates" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."orders" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."order_items" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."user_roles" TO "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

-- ----------------------------------------------------------------------------
-- Storage — bucket `products` + isolamento por pasta {store_id}/... (ADR-0004)
--
-- O bucket original nunca foi criado via migration (foi manual, no
-- dashboard) — criado aqui explicitamente para que este projeto seja
-- reproduzível do zero, sem passo manual.
-- ----------------------------------------------------------------------------

INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('products', 'products', false)
ON CONFLICT ("id") DO NOTHING;

CREATE POLICY "Public can view product images" ON "storage"."objects"
    FOR SELECT USING (
        "bucket_id" = 'products'
        AND (storage.foldername("name"))[1] IN (SELECT "id"::"text" FROM "public"."stores")
    );

CREATE POLICY "Users can upload product images to their store folder" ON "storage"."objects"
    FOR INSERT TO "authenticated"
    WITH CHECK (
        "bucket_id" = 'products'
        AND (storage.foldername("name"))[1] IN (SELECT "id"::"text" FROM "public"."stores" WHERE "owner_id" = "auth"."uid"())
    );

CREATE POLICY "Users can manage their own product images" ON "storage"."objects"
    TO "authenticated"
    USING (
        "bucket_id" = 'products'
        AND (storage.foldername("name"))[1] IN (SELECT "id"::"text" FROM "public"."stores" WHERE "owner_id" = "auth"."uid"())
    )
    WITH CHECK (
        "bucket_id" = 'products'
        AND (storage.foldername("name"))[1] IN (SELECT "id"::"text" FROM "public"."stores" WHERE "owner_id" = "auth"."uid"())
    );
