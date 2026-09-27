import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { resolveThemeComponent, THEME_COMPONENTS } from "@/features/theme/ThemeRegistry";

const SUPABASE_URL = "https://ubuuccnbqacozcdljuay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6EeZ-pYO5Z_bJyduuGyqzA_Q3zis6Q5";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe("Auditoria Real da Loja no Supabase e Storefront", () => {
  it("Auditoria 1: Identificação da Loja Real no Supabase", async () => {
    const { data: stores, error: storeErr } = await supabase
      .from("stores")
      .select("id, name, slug, active_template_id, owner_id, plan_id, logo_url, banner_url, created_at");

    expect(storeErr).toBeNull();
    expect(stores).toBeDefined();
    expect(stores!.length).toBeGreaterThan(0);

    const store = stores![0];
    console.log("=== DADOS DA LOJA REAL ===");
    console.log("ID:", store.id);
    console.log("Nome:", store.name);
    console.log("Slug:", store.slug);
    console.log("Owner ID:", store.owner_id);
    console.log("Plan ID:", store.plan_id);
    console.log("Active Template ID:", store.active_template_id);
    console.log("Logo URL:", store.logo_url);
    console.log("Banner URL:", store.banner_url);
    console.log("Created At:", store.created_at);

    // 2. Buscar Templates no Banco
    const { data: templates, error: tmplErr } = await supabase
      .from("templates")
      .select("id, name, layout_key, active, description");

    expect(tmplErr).toBeNull();
    expect(templates).toHaveLength(5);
    console.log("=== 5 TEMPLATES OFICIAIS REGISTRADOS ===");
    templates?.forEach(t => console.log(`- ${t.name} (layout_key: ${t.layout_key}, ID: ${t.id}, active: ${t.active})`));

    // 3. Buscar Theme Config da Loja Real
    const { data: themeConfigs, error: cfgErr } = await supabase
      .from("store_theme_configs")
      .select("*")
      .eq("store_id", store.id);

    console.log("=== STORE THEME CONFIGS ===", themeConfigs);

    // 4. Buscar Seções da Loja Real
    const { data: sections, error: secErr } = await supabase
      .from("store_sections")
      .select("*")
      .eq("store_id", store.id)
      .order("position", { ascending: true });

    console.log("=== STORE SECTIONS ===", sections);

    // 5. Validar Consistência
    const activeTemplate = templates?.find(t => t.id === store.active_template_id);
    const configThemeId = themeConfigs?.[0]?.config?.themeId;
    console.log("=== CONSISTÊNCIA DE TEMA ===");
    console.log("Template Ativo:", activeTemplate?.name, `(${activeTemplate?.layout_key})`);
    console.log("Config Theme ID:", configThemeId);

    // 6. Validar Resolução no ThemeRegistry
    const resolvedComponent = resolveThemeComponent(configThemeId || activeTemplate?.layout_key);
    expect(resolvedComponent).toBeDefined();
    console.log("Componente Storefront Resolvido com Sucesso!");
  });

  it("Auditoria 2: Teste de Isolamento RLS Anônimo contra a Loja Real", async () => {
    const { data: stores } = await supabase.from("stores").select("id").limit(1);
    const storeId = stores![0].id;

    // Tentativa anônima de UPDATE em stores
    const { data: updateData, error: updateError } = await supabase
      .from("stores")
      .update({ name: "Nome Hackeado" })
      .eq("id", storeId)
      .select();

    // RLS deve bloquear a mutação sem auth
    expect(updateData).toHaveLength(0);

    // Tentativa anônima de UPDATE em store_theme_configs
    const { data: cfgData, error: cfgError } = await supabase
      .from("store_theme_configs")
      .update({ config: { themeId: "hacked" } })
      .eq("store_id", storeId)
      .select();

    expect(cfgData).toHaveLength(0);

    // Tentativa anônima de UPDATE em store_sections
    const { data: secData, error: secError } = await supabase
      .from("store_sections")
      .update({ enabled: false })
      .eq("store_id", storeId)
      .select();

    expect(secData).toHaveLength(0);
    console.log("Isolamento RLS comprovado: Nenhuma mutação anônima permitida em stores, store_theme_configs ou store_sections!");
  });
});
