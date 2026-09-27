import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidStoreToken, cancelPaymentOnMercadoPago } from "../_shared/mercadopago.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // 1. Validar autenticação do lojista
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { order_id, store_id, reason } = body;

    if (!order_id || !store_id) {
      return new Response(
        JSON.stringify({ error: "order_id e store_id são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Executar Cancelamento Atômico no Banco (com checagem de propriedade da loja)
    const { data: cancelResult, error: cancelErr } = await supabase.rpc("cancel_order_atomic", {
      p_order_id: order_id,
      p_store_id: store_id,
      p_user_id: user.id,
      p_reason: reason || "Cancelado pelo lojista via painel",
    });

    if (cancelErr || !cancelResult?.success) {
      const errMsg = cancelResult?.error || cancelErr?.message || "Erro ao cancelar pedido.";
      const statusCode = errMsg.includes("Não autorizado") ? 403 : errMsg.includes("não encontrado") ? 404 : 400;
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Se havia um pagamento pendente no Mercado Pago, cancela no gateway de forma idempotente
    if (cancelResult.provider_payment_id) {
      const tokenData = await getValidStoreToken(supabase, store_id);
      if (tokenData?.accessToken) {
        await cancelPaymentOnMercadoPago(
          tokenData.accessToken,
          cancelResult.provider_payment_id,
          order_id
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: cancelResult.order_id,
        order_status: cancelResult.order_status,
        already_cancelled: cancelResult.already_cancelled || false,
        message: "Pedido cancelado com sucesso.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao processar cancelamento." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
