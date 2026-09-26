-- ============================================================================
-- ORGANIZATIONS + RBAC POR LOJA
--
-- Implementa a hierarquia User → Organization → N Stores descrita em
-- VISAO_E_MODELO_DE_NEGOCIO.md seção 3 e ARQUITETURA_TECNICA.md seção 4.
-- Migration incremental SOBRE a baseline squashada (20260913000000) —
-- deliberadamente separada dela, conforme a nota de escopo no topo daquele
-- arquivo.
--
-- Fase 1 do ROADMAP_DE_EXECUCAO.md. Validado localmente (supabase db reset +
-- bateria de isolamento estendida) antes de qualquer aplicação em projeto
-- Supabase real — nunca aplicado automaticamente à nuvem.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Papel do usuário dentro de uma organização (RBAC por loja/organização)
-- ----------------------------------------------------------------------------

CREATE TYPE "public"."organization_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'staff'
);

CREATE TABLE "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."organizations" ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

CREATE TABLE "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."organization_role" DEFAULT 'staff'::"public"."organization_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_org_user_key" UNIQUE ("organization_id", "user_id");
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- stores ganha organization_id — backfill automático para não quebrar
-- lojas já existentes (cria 1 organização por owner_id distinto, com esse
-- owner como 'owner' da organização)
-- ----------------------------------------------------------------------------

ALTER TABLE "public"."stores" ADD COLUMN "organization_id" "uuid";

DO $$
DECLARE
  r RECORD;
  new_org_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT owner_id FROM public.stores WHERE organization_id IS NULL LOOP
    INSERT INTO public.organizations (name)
    VALUES ('Organização de ' || r.owner_id)
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, r.owner_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    UPDATE public.stores SET organization_id = new_org_id WHERE owner_id = r.owner_id AND organization_id IS NULL;
  END LOOP;
END $$;

ALTER TABLE "public"."stores" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE ONLY "public"."stores" ADD CONSTRAINT "stores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER — evitam recursão de RLS ao consultar
-- organization_members de dentro de outras policies, mesmo padrão de
-- has_role/user_roles já usado na baseline)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."is_org_member"("_organization_id" "uuid", "_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id and user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION "public"."has_org_role_at_least"("_organization_id" "uuid", "_user_id" "uuid", "_min_role" "public"."organization_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _organization_id
      and user_id = _user_id
      and case role
            when 'owner' then 4
            when 'admin' then 3
            when 'manager' then 2
            when 'staff' then 1
          end
          >=
          case _min_role
            when 'owner' then 4
            when 'admin' then 3
            when 'manager' then 2
            when 'staff' then 1
          end
  )
$$;

-- ----------------------------------------------------------------------------
-- RLS — organizations / organization_members
-- ----------------------------------------------------------------------------

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization" ON "public"."organizations"
    FOR SELECT TO "authenticated"
    USING ("public"."is_org_member"("id", "auth"."uid"()));

CREATE POLICY "Owners and admins can update their organization" ON "public"."organizations"
    FOR UPDATE TO "authenticated"
    USING ("public"."has_org_role_at_least"("id", "auth"."uid"(), 'admin'))
    WITH CHECK ("public"."has_org_role_at_least"("id", "auth"."uid"(), 'admin'));

CREATE POLICY "Authenticated users can create an organization" ON "public"."organizations"
    FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Members can view their organization roster" ON "public"."organization_members"
    FOR SELECT TO "authenticated"
    USING ("public"."is_org_member"("organization_id", "auth"."uid"()));

CREATE POLICY "Owners and admins can manage organization members" ON "public"."organization_members"
    FOR ALL TO "authenticated"
    USING ("public"."has_org_role_at_least"("organization_id", "auth"."uid"(), 'admin'))
    WITH CHECK ("public"."has_org_role_at_least"("organization_id", "auth"."uid"(), 'admin'));

-- Um usuário pode se auto-inserir como 'owner' só ao criar a própria
-- organização pela primeira vez (onboarding) — nunca se promover numa
-- organização já existente de outra pessoa.
CREATE POLICY "Users can add themselves as owner of a brand new organization" ON "public"."organization_members"
    FOR INSERT TO "authenticated"
    WITH CHECK (
        "user_id" = "auth"."uid"()
        AND "role" = 'owner'
        AND NOT EXISTS (SELECT 1 FROM "public"."organization_members" WHERE "organization_id" = "organization_members"."organization_id")
    );

-- ----------------------------------------------------------------------------
-- Atualiza policies de stores/products/store_templates/orders/order_items
-- para RBAC por organização, no lugar do antigo owner_id isolado.
-- `owner_id` é preservado na tabela (referência histórica de quem criou),
-- mas deixa de ser a base do controle de acesso.
-- ----------------------------------------------------------------------------

DROP POLICY "Users can manage their own stores" ON "public"."stores";

CREATE POLICY "Org members can update their stores" ON "public"."stores"
    FOR UPDATE TO "authenticated"
    USING ("public"."is_org_member"("organization_id", "auth"."uid"()))
    WITH CHECK ("public"."is_org_member"("organization_id", "auth"."uid"()));

CREATE POLICY "Org members can create stores for their organization" ON "public"."stores"
    FOR INSERT TO "authenticated"
    WITH CHECK ("public"."is_org_member"("organization_id", "auth"."uid"()));

-- Excluir uma loja é destrutivo — reservado a owner/admin (RBAC básico
-- exigido desde a Fase 1, ver CLAUDE.md regras inegociáveis)
CREATE POLICY "Org owners and admins can delete their stores" ON "public"."stores"
    FOR DELETE TO "authenticated"
    USING ("public"."has_org_role_at_least"("organization_id", "auth"."uid"(), 'admin'));

DROP POLICY "Store owners can manage their products" ON "public"."products";
CREATE POLICY "Org members can manage their store's products" ON "public"."products"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "products"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "products"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

DROP POLICY "Store owners can manage their acquired templates" ON "public"."store_templates";
CREATE POLICY "Org members can manage their store's acquired templates" ON "public"."store_templates"
    TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "store_templates"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "store_templates"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

DROP POLICY "Owners can view their orders" ON "public"."orders";
CREATE POLICY "Org members or admin can view their store's orders" ON "public"."orders"
    FOR SELECT TO "authenticated"
    USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "orders"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"()))
    );

DROP POLICY "Owners can view their order items" ON "public"."order_items";
CREATE POLICY "Org members can view their store's order items" ON "public"."order_items"
    FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1 FROM "public"."orders" o JOIN "public"."stores" s ON s."id" = o."store_id"
        WHERE o."id" = "order_items"."order_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())
    ));

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

GRANT ALL ON TABLE "public"."organizations" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."organization_members" TO "anon", "authenticated", "service_role";
REVOKE ALL ON FUNCTION "public"."is_org_member"("uuid", "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_org_member"("uuid", "uuid") TO "service_role", "authenticated";
REVOKE ALL ON FUNCTION "public"."has_org_role_at_least"("uuid", "uuid", "public"."organization_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_org_role_at_least"("uuid", "uuid", "public"."organization_role") TO "service_role", "authenticated";
