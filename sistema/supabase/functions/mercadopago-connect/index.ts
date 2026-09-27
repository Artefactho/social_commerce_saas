import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID") ?? "";
    const redirectUri = Deno.env.get("MERCADOPAGO_REDIRECT_URI") ?? "";

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "MERCADOPAGO_CLIENT_ID ou MERCADOPAGO_REDIRECT_URI não configurados." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado. Token de autenticação obrigatório." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""));
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let storeId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      storeId = body.store_id;
    } else {
      const url = new URL(req.url);
      storeId = url.searchParams.get("store_id");
    }

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "store_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar se o usuário autenticado é dono/membro da loja
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, owner_id, organization_id")
      .eq("id", storeId)
      .single();

    if (storeErr || !store) {
      return new Response(
        JSON.stringify({ error: "Loja não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (store.owner_id !== user.id) {
      // Verificar se é membro da organização
      const { data: isMember } = await supabase.rpc("is_org_member", {
        _organization_id: store.organization_id,
        _user_id: user.id,
      });

      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Sem permissão para gerenciar integrações desta loja." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Gerar state seguro de 128-bit
    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    await supabase.from("mercadopago_oauth_states").insert({
      state,
      store_id: storeId,
      user_id: user.id,
      expires_at: expiresAt,
      used: false,
    });

    const authorizationUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Response(
      JSON.stringify({
        url: authorizationUrl,
        state,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao iniciar conexão com Mercado Pago." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
