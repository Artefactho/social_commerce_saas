import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ubuuccnbqacozcdljuay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6EeZ-pYO5Z_bJyduuGyqzA_Q3zis6Q5";
const liveSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe("Adversarial Live Edge Function Security Tests", () => {
  it("REQ-01: Visitante público sem login alcança create-order sem erro 401", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({}),
    });

    const body = await res.json();
    console.log("REQ-01 (Sem Auth) Status:", res.status, "Body:", body);
    expect(res.status).toBe(400); // 400 Bad Request por payload vazio, NUNCA 401 Unauthorized
    expect(body.error).toBeDefined();
  });

  it("REQ-04: Cliente não consegue comprar produto com UUID inexistente", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        store_id: "00000000-0000-0000-0000-000000000000",
        customer_name: "Hacker Test",
        customer_email: "hacker@test.com",
        shipping_address: "Rua Hacker, 0",
        items: [{ product_id: "99999999-9999-9999-9999-999999999999", quantity: 1 }],
      }),
    });

    const body = await res.json();
    console.log("REQ-04 (Produto/Loja Inexistente) Status:", res.status, "Body:", body);
    expect([400, 404]).toContain(res.status); // Loja/produto inválido rejeitado com 400/404
    expect(body.error).toBeDefined();
  });

  it("REQ-08: Validação de corpo vazio ou ausência de dados obrigatórios retorna 400", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        store_id: "00000000-0000-0000-0000-000000000000",
      }),
    });

    const body = await res.json();
    console.log("REQ-08 (Payload Incompleto) Status:", res.status, "Body:", body);
    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });
});
