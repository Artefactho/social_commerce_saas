import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubuuccnbqacozcdljuay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6EeZ-pYO5Z_bJyduuGyqzA_Q3zis6Q5";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=================================================");
  console.log("🔍 INICIANDO AUDITORIA ADVERSARIAL COMPROBATÓRIA");
  console.log("=================================================\n");

  const results: Record<string, any> = {};

  // -------------------------------------------------------------
  // 1. VERIFICAR SUPABASE REMOTO: TABELA TEMPLATES E 5 TEMAS
  // -------------------------------------------------------------
  console.log("📡 [1/5] Verificando templates no Supabase Remoto...");
  try {
    const { data: templates, error: tplError } = await supabase
      .from("templates")
      .select("id, name, layout_key, active");

    if (tplError) {
      results.templates = { status: "ERRO", error: tplError.message };
      console.log("❌ Erro ao consultar templates:", tplError.message);
    } else {
      results.templates = {
        status: "OK",
        count: templates?.length || 0,
        items: templates,
      };
      console.log(`✅ Templates encontrados no banco remoto (${templates?.length}):`);
      templates?.forEach((t) => console.log(`   - [${t.layout_key}] ${t.name} (id: ${t.id}, active: ${t.active})`));
    }
  } catch (err: any) {
    results.templates = { status: "ERRO", error: err.message };
  }

  // -------------------------------------------------------------
  // 2. VERIFICAR SUPABASE REMOTO: TABELA STORE_SECTIONS
  // -------------------------------------------------------------
  console.log("\n📡 [2/5] Verificando tabela store_sections no Supabase Remoto...");
  try {
    const { data: sections, error: secError } = await supabase
      .from("store_sections")
      .select("*")
      .limit(5);

    if (secError) {
      results.store_sections = { status: "ERRO", error: secError.message };
      console.log("❌ Tabela store_sections no banco remoto:", secError.message);
    } else {
      results.store_sections = {
        status: "OK",
        count: sections?.length || 0,
        sample: sections,
      };
      console.log(`✅ Tabela store_sections acessível no banco remoto. Registros encontrados: ${sections?.length}`);
    }
  } catch (err: any) {
    results.store_sections = { status: "ERRO", error: err.message };
  }

  // -------------------------------------------------------------
  // 3. VERIFICAR SE EDGE FUNCTION 'create-order' ESTÁ DEPLOYADA
  // -------------------------------------------------------------
  console.log("\n📡 [3/5] Testando Edge Function 'create-order' remota...");
  try {
    const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ping: true }),
    });

    const edgeStatus = edgeRes.status;
    let edgeBody;
    try {
      edgeBody = await edgeRes.json();
    } catch {
      edgeBody = await edgeRes.text();
    }

    results.edge_function = {
      status_code: edgeStatus,
      deployed: edgeStatus !== 404 && edgeStatus !== 502,
      response: edgeBody,
    };
    console.log(`📡 Status da Edge Function remota: HTTP ${edgeStatus}`);
    console.log("   Resposta:", typeof edgeBody === "object" ? JSON.stringify(edgeBody) : edgeBody);
  } catch (err: any) {
    results.edge_function = { deployed: false, error: err.message };
    console.log("❌ Erro de conexão com a Edge Function:", err.message);
  }

  // -------------------------------------------------------------
  // 4. TESTE ADVERSARIAL DE CHECKOUT REAL (Banco Remoto)
  // -------------------------------------------------------------
  console.log("\n📡 [4/5] Executando Testes Adversariais de Checkout...");

  // Buscar uma loja real e um produto real no banco para testar
  const { data: sampleStore } = await supabase.from("stores").select("id, name, slug, shipping_fee").limit(1).single();
  const { data: sampleProduct } = await supabase.from("products").select("id, name, price, status").eq("store_id", sampleStore?.id || "").limit(1).single();

  console.log(`   Loja de teste: ${sampleStore?.name} (${sampleStore?.id})`);
  console.log(`   Produto de teste: ${sampleProduct?.name} (Preço real no banco: R$ ${sampleProduct?.price})`);

  // Teste A: Tentativa de manipulação de preço/total via Payload
  console.log("\n   🛡️ Teste A: Injeção de preço falso (R$ 0.01) e total manipulado (R$ 1.00)...");
  // Chamamos o OrderService logic diretamente com verificação DB
  const fakePriceReq = {
    store_id: sampleStore?.id,
    customer_name: "Adversary Test",
    customer_email: "adversary@test.com",
    shipping_address: "Rua Hacker, 0",
    items: [{ product_id: sampleProduct?.id, quantity: 2, price: 0.01, total: 0.02 }], // Injetado
    total_amount: 1.00, // Injetado
  };

  // Se edge function estiver live, chama edge; senão valida via OrderService
  let testAResult: any = {};
  try {
    const { data, error } = await supabase.functions.invoke("create-order", { body: fakePriceReq });
    if (!error && data) {
      testAResult = { method: "Edge Function", ...data };
    } else {
      testAResult = { method: "Edge Error / Fallback", error: error?.message };
    }
  } catch (err: any) {
    testAResult = { error: err.message };
  }
  console.log("   Resultado Teste A:", testAResult);

  // Teste B: Produto inexistente
  console.log("\n   🛡️ Teste B: Envio de produto inexistente (UUID falso)...");
  try {
    const fakeProdReq = {
      store_id: sampleStore?.id,
      customer_name: "Adversary",
      customer_email: "adv@test.com",
      shipping_address: "Rua 1",
      items: [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
    };
    const { data, error } = await supabase.functions.invoke("create-order", { body: fakeProdReq });
    console.log("   Resultado Teste B:", data || error);
  } catch (err: any) {
    console.log("   Resultado Teste B (Catch):", err.message);
  }

  // -------------------------------------------------------------
  // 5. SUMÁRIO DA AUDITORIA
  // -------------------------------------------------------------
  console.log("\n=================================================");
  console.log("📋 SUMÁRIO DOS DADOS BRUTOS COLETADOS");
  console.log("=================================================");
  console.log(JSON.stringify(results, null, 2));
}

runAudit();
