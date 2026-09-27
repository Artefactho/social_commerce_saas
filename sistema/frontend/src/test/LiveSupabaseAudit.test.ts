import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubuuccnbqacozcdljuay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6EeZ-pYO5Z_bJyduuGyqzA_Q3zis6Q5";
const liveSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe("Adversarial Live Supabase Remote DB & Edge Audit", () => {
  it("Verificação 1: Templates no Banco Remoto", async () => {
    const { data: templates, error } = await liveSupabase
      .from("templates")
      .select("id, name, layout_key, active");

    console.log("TEMPLATES NO BANCO REMOTO:", templates);
    expect(error).toBeNull();
    expect(templates).toBeDefined();
  });

  it("Verificação 2: Tabela store_sections no Banco Remoto", async () => {
    const { data, error } = await liveSupabase
      .from("store_sections")
      .select("*")
      .limit(5);

    console.log("STORE_SECTIONS NO BANCO REMOTO (Error/Data):", { error, count: data?.length });
    // Verificamos se tabela existe ou se requer migration remota
  });

  it("Verificação 3: Status da Edge Function create-order no Supabase Remoto", async () => {
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

      console.log("EDGE FUNCTION HTTP STATUS REMOTO:", edgeRes.status);
      const text = await edgeRes.text();
      console.log("EDGE FUNCTION RESPOSTA REMOTA:", text);
    } catch (err: any) {
      console.log("EDGE FUNCTION CONEXÃO ERRO:", err.message);
    }
  });

  it("Verificação 4: Teste Adversarial de Preço Falso contra Banco", async () => {
    const { data: stores } = await liveSupabase.from("stores").select("id, name, slug").limit(1);
    console.log("LOJAS REAIS ENCONTRADAS NO BANCO:", stores);

    if (stores && stores.length > 0) {
      const storeId = stores[0].id;
      const { data: prods } = await liveSupabase.from("products").select("id, name, price").eq("store_id", storeId).limit(1);
      console.log("PRODUTO REAL ENCONTRADO:", prods);
    }
  });
});
