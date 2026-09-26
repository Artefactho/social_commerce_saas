-- ============================================================================
-- FASE 3 — COMMERCE CORE: categorias estruturadas, product_type, clientes
--
-- ARQUITETURA_TECNICA.md seção 4 já mapeava essas 3 peças como "novo,
-- não existe no schema atual". `product_type` é a mais crítica: é a base da
-- regra inegociável #2 do CLAUDE.md (frete condicional por tipo de produto).
--
-- Escopo desta migration: schema + RLS. A UI de gestão de categorias
-- (CRUD completo no dashboard) e o vínculo cliente↔pedido continuam como
-- trabalho de frontend em aberto (ver PROGRESS.md) — não construídos aqui
-- para não expandir escopo além do que a Fase 3 pede como fundação de dados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- product_type — regra inegociável #2 (frete condicional)
-- ----------------------------------------------------------------------------

CREATE TYPE "public"."product_type" AS ENUM (
    'physical',
    'digital'
);

ALTER TABLE "public"."products" ADD COLUMN "product_type" "public"."product_type" DEFAULT 'physical'::"public"."product_type" NOT NULL;

-- ----------------------------------------------------------------------------
-- categories — categoria estruturada por loja (hoje products.category é
-- string solta, sem FK; mantida como está para não quebrar o formulário de
-- produto existente — a tabela nova é a base para a UI de gestão de
-- categorias que ainda será construída)
-- ----------------------------------------------------------------------------

CREATE TABLE "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_store_id_slug_key" UNIQUE ("store_id", "slug");
ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON "public"."categories"
    FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Org members can manage their store's categories" ON "public"."categories"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "categories"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "categories"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

GRANT ALL ON TABLE "public"."categories" TO "anon", "authenticated", "service_role";

-- ----------------------------------------------------------------------------
-- customers — cadastro de cliente de verdade (hoje orders só guarda
-- customer_name/email/phone inline, tipo "guest"). orders.customer_id é
-- opcional/nullable: o checkout guest continua funcionando sem mudanças
-- imediatas; vincular pedido↔cliente é trabalho de frontend em aberto.
-- ----------------------------------------------------------------------------

CREATE TABLE "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_store_id_email_key" UNIQUE ("store_id", "email");
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

ALTER TABLE "public"."orders" ADD COLUMN "customer_id" "uuid";
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;

ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

-- Diferente de categories/products, clientes são dado de negócio privado do
-- lojista (PII) -- NÃO tem leitura pública. anon/authenticated podem
-- inserir (necessário pro checkout de convidado criar o cadastro), mas só
-- membros da organização podem LER a própria lista de clientes.
--
-- ARMADILHA PRA QUEM FOR LIGAR ISSO NO CHECKOUT DEPOIS: o Postgres reavalia
-- a policy de SELECT ao processar o RETURNING de um INSERT (mesmo bug do
-- create_organization(), ver migration 20260913030000). Como anon não tem
-- policy de SELECT aqui, um `supabase.from('customers').insert(...).select()`
-- como guest FALHA. Ao criar o cliente no checkout como anon, use só
-- `.insert(...)` sem `.select()` (ou uma função SECURITY DEFINER, se
-- precisar do ID de volta).
CREATE POLICY "Anyone can create a customer record" ON "public"."customers"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "Org members can view their store's customers" ON "public"."customers"
    FOR SELECT TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "customers"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

CREATE POLICY "Org members can update their store's customers" ON "public"."customers"
    FOR UPDATE TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "customers"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "customers"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

GRANT ALL ON TABLE "public"."customers" TO "anon", "authenticated", "service_role";
