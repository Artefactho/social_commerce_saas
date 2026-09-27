import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubuuccnbqacozcdljuay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6EeZ-pYO5Z_bJyduuGyqzA_Q3zis6Q5";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=== INICIANDO AUDITORIA DA LOJA REAL NO SUPABASE REMOTO ===");

  // 1. Identificar loja real
  const { data: stores, error: storeErr } = await supabase
    .from("stores")
    .select("id, name, slug, active_template_id, owner_id, plan_id, logo_url, banner_url, created_at");

  console.log("\n1. LOJAS REAIS:", JSON.stringify(stores, null, 2));

  if (!stores || stores.length === 0) {
    console.error("Nenhuma loja encontrada no banco remoto!");
    return;
  }

  const store = stores[0];

  // 2. Templates no banco
  const { data: templates, error: tmplErr } = await supabase
    .from("templates")
    .select("id, name, layout_key, active, description");

  console.log("\n2. TEMPLATES OFICIAIS NO BANCO:", JSON.stringify(templates, null, 2));

  // 3. Theme Config da loja
  const { data: themeConfigs, error: cfgErr } = await supabase
    .from("store_theme_configs")
    .select("*")
    .eq("store_id", store.id);

  console.log("\n3. STORE THEME CONFIGS:", JSON.stringify(themeConfigs, null, 2));

  // 4. Seções da loja
  const { data: sections, error: secErr } = await supabase
    .from("store_sections")
    .select("*")
    .eq("store_id", store.id)
    .order("position", { ascending: true });

  console.log("\n4. STORE SECTIONS:", JSON.stringify(sections, null, 2));

  // 5. Comparação active_template_id vs config.themeId
  const activeTemplate = templates?.find(t => t.id === store.active_template_id);
  const configThemeId = themeConfigs?.[0]?.config?.themeId;

  console.log("\n5. CONSISTÊNCIA DE TEMA:");
  console.log("  - stores.active_template_id:", store.active_template_id);
  console.log("  - template correspondente:", activeTemplate ? `${activeTemplate.name} (${activeTemplate.layout_key})` : "NÃO ENCONTRADO");
  console.log("  - store_theme_configs.config.themeId:", configThemeId);
  console.log("  - São consistentes?", activeTemplate?.layout_key === configThemeId || (activeTemplate?.layout_key === "premium" && configThemeId === "aura-maison") || (activeTemplate?.layout_key === "minimal" && configThemeId === "minimal-clean"));

  // 6. Teste de isolamento RLS (tentativa de ler/escrever anonimamente sem ser dono)
  console.log("\n6. TESTE DE ISOLAMENTO / RLS ANÔNIMO:");
  const { data: updateRes, error: updateErr } = await supabase
    .from("stores")
    .update({ name: "Nome Adulterado Hacked" })
    .eq("id", store.id)
    .select();

  console.log("  - Tentativa de update anônimo em stores:", { data: updateRes, error: updateErr?.message });

  const { data: cfgUpdateRes, error: cfgUpdateErr } = await supabase
    .from("store_theme_configs")
    .update({ config: { themeId: "hacked-theme" } })
    .eq("store_id", store.id)
    .select();

  console.log("  - Tentativa de update anônimo em store_theme_configs:", { data: cfgUpdateRes, error: cfgUpdateErr?.message });
}

runAudit();
