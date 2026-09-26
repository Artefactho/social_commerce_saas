-- ============================================================================
-- STORE CONFIGURATION (ThemeConfig por loja)
--
-- Implementa a terceira camada da separação Commerce Core × Theme ×
-- Store Configuration exigida desde a Fase 1 (ARQUITETURA_TECNICA.md seção 4,
-- skills/theme-contract.md seção 3). Guarda, por loja, a config visual (branding,
-- cores, tipografia, header, hero, catálogo, footer) como dado — nunca
-- hardcoded no código do tema.
--
-- Migration incremental sobre a baseline + organizations/RBAC. Validada
-- localmente antes de qualquer aplicação em projeto Supabase real.
-- ============================================================================

CREATE TABLE "public"."store_theme_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    -- Estrutura conceitual em skills/theme-contract.md seção 3 (ThemeConfig).
    -- Só armazena o que o lojista personalizou; campos ausentes usam o
    -- fallback gracioso do tema (skills/theme-contract.md seção 10) — o banco não
    -- precisa conhecer o schema completo do ThemeConfig.
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);
ALTER TABLE ONLY "public"."store_theme_configs" ADD CONSTRAINT "store_theme_configs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."store_theme_configs" ADD CONSTRAINT "store_theme_configs_store_id_key" UNIQUE ("store_id");
ALTER TABLE ONLY "public"."store_theme_configs" ADD CONSTRAINT "store_theme_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

-- Toda loja precisa ter exatamente 1 Store Configuration (mesmo vazia,
-- usando só fallbacks) — garantido aqui, não deixado como responsabilidade
-- do frontend lembrar de criar.
CREATE OR REPLACE FUNCTION "public"."create_default_store_theme_config"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.store_theme_configs (store_id) VALUES (NEW.id)
  ON CONFLICT (store_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_create_default_store_theme_config"
    AFTER INSERT ON "public"."stores"
    FOR EACH ROW EXECUTE FUNCTION "public"."create_default_store_theme_config"();

-- Backfill defensivo: qualquer loja já existente sem config ganha uma vazia
INSERT INTO "public"."store_theme_configs" ("store_id")
SELECT "id" FROM "public"."stores"
ON CONFLICT ("store_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- RLS — leitura pública (o tema precisa renderizar pra visitante anônimo da
-- vitrine), escrita restrita a membros da organização dona da loja
-- ----------------------------------------------------------------------------

ALTER TABLE "public"."store_theme_configs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view store theme config" ON "public"."store_theme_configs"
    FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Org members can update their store's theme config" ON "public"."store_theme_configs"
    FOR UPDATE TO "authenticated"
    USING (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "store_theme_configs"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())))
    WITH CHECK (EXISTS (SELECT 1 FROM "public"."stores" s WHERE s."id" = "store_theme_configs"."store_id" AND "public"."is_org_member"(s."organization_id", "auth"."uid"())));

-- INSERT/DELETE não têm policy própria de propósito: a linha é criada só
-- pelo trigger (SECURITY DEFINER, ignora RLS) e removida só em cascata
-- quando a loja é excluída (FK ON DELETE CASCADE, também ignora RLS) —
-- nenhum usuário deve criar/excluir Store Configuration manualmente.

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

GRANT ALL ON TABLE "public"."store_theme_configs" TO "anon", "authenticated", "service_role";
REVOKE ALL ON FUNCTION "public"."create_default_store_theme_config"() FROM PUBLIC;
