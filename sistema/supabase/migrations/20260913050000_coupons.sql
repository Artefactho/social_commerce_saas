-- ============================================================================
-- FASE 3 — COMMERCE CORE: cupons/descontos
--
-- Último item pendente do critério de aceite da Fase 3
-- (ROADMAP_DE_EXECUCAO.md): "Cupom aplicado apenas dentro da loja em que foi
-- criado; um cupom da Loja A não é aceito na Loja B" — garantido pela
-- própria consulta ser sempre escopada por store_id (e reforçado por RLS).
-- ============================================================================

CREATE TYPE "public"."discount_type" AS ENUM (
    'percentage',
    'fixed'
);

CREATE TABLE "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "discount_type" "public"."discount_type" DEFAULT 'percentage'::"public"."discount_type" NOT NULL,
    "discount_value" numeric(12,2) NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "coupons_discount_value_check" CHECK (("discount_value" >= (0)::numeric))
);
ALTER TABLE ONLY "public"."coupons" ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."coupons" ADD CONSTRAINT "coupons_store_id_code_key" UNIQUE ("store_id", "code");
ALTER TABLE ONLY "public"."coupons" ADD CONSTRAINT "coupons_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;

-- Leitura pública só de cupons ativos (necessário pro checkout validar um
-- código digitado pelo cliente, mesmo sem login) — mesmo modelo de
-- visibilidade já usado em "Public can view products" (status = 'Ativo').
CREATE POLICY "Public can view active coupons" ON "public"."coupons"
    FOR SELECT TO "authenticated", "anon" USING (("active" = true));

CREATE POLICY "Org members can manage their store's coupons" ON "public"."coupons"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "coupons"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "coupons"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

GRANT ALL ON TABLE "public"."coupons" TO "anon", "authenticated", "service_role";
