-- ============================================================================
-- CORREÇÃO: bootstrap de "criar organização + virar owner" quebrado
--
-- Bug encontrado via teste de UI real (Playwright, fluxo de onboarding) — os
-- testes SQL anteriores não pegaram porque rodavam como superusuário
-- (bypassa RLS) para popular o cenário, nunca exercitando este fluxo como o
-- role `authenticated` de verdade.
--
-- Causa raiz (mais sutil que uma subquery ambígua): o Postgres reavalia a
-- policy de SELECT de uma tabela ao processar o RETURNING de um INSERT
-- (precisa confirmar que a linha nova é "visível" pra quem inseriu). No
-- fluxo original (INSERT em organizations, DEPOIS INSERT em
-- organization_members), no momento do primeiro INSERT com
-- `.insert(...).select()` (que vira `INSERT ... RETURNING *`), o usuário
-- AINDA NÃO é membro da organização — a policy "Members can view their
-- organization" bloqueia o RETURNING, e o INSERT falha com "new row violates
-- row-level security policy", mesmo a policy de INSERT (`WITH CHECK true`)
-- tendo sido satisfeita. Isso quebraria o onboarding real em produção, não
-- só o teste.
--
-- Correção: uma função SECURITY DEFINER que faz os dois inserts
-- atomicamente (mesmo padrão de has_role/is_org_member) — como ela roda com
-- o privilégio do dono da função, não do role `authenticated` que chamou,
-- não sofre a reavaliação de RLS no meio do caminho. Substitui por completo
-- a antiga policy de auto-inserção em organization_members (removida — não
-- é mais necessária nem seria suficiente sozinha).
-- ============================================================================

DROP POLICY "Users can add themselves as owner of a brand new organization" ON "public"."organization_members";

CREATE OR REPLACE FUNCTION "public"."create_organization"("_name" "text") RETURNS "public"."organizations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_org public.organizations;
BEGIN
  INSERT INTO public.organizations (name) VALUES (_name) RETURNING * INTO new_org;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org.id, auth.uid(), 'owner');

  RETURN new_org;
END;
$$;

REVOKE ALL ON FUNCTION "public"."create_organization"("text") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."create_organization"("text") TO "authenticated";
