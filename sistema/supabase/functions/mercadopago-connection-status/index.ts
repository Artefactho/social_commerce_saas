import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação obrigatório." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""));
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const storeId = url.searchParams.get("store_id");

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "store_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar se o usuário tem acesso à loja
    const { data: store } = await supabase
      .from("stores")
      .select("id, owner_id, organization_id")
      .eq("id", storeId)
      .single();

    if (!store) {
      return new Response(
        JSON.stringify({ error: "Loja não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (store.owner_id !== user.id) {
      const { data: isMember } = await supabase.rpc("is_org_member", {
        _organization_id: store.organization_id,
        _user_id: user.id,
      });

      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Acesso negado." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: conn } = await supabase
      .from("store_payment_connections")
      .select("provider, status, provider_user_id, public_key, updated_at")
      .eq("store_id", storeId)
      .maybeSingle();

    if (!conn || conn.status !== "active") {
      return new Response(
        JSON.stringify({
          connected: false,
          provider: "mercadopago",
          status: "inactive",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        connected: true,
        provider: conn.provider,
        status: conn.status,
        provider_user_id: conn.provider_user_id,
        public_key: conn.public_key,
        updated_at: conn.updated_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao consultar status da conexão." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
