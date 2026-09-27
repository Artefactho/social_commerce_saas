import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifyWebhookSignature,
  fetchPaymentCanonically,
} from "../_shared/mercadopago.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Utilize POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const bodyText = await req.text();
    let bodyJson: Record<string, any> = {};
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      // Body pode ser vazio em alguns pings
    }

    // Identificar Payment ID do evento
    const paymentId =
      bodyJson?.data?.id ||
      bodyJson?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    const eventType = bodyJson?.type || bodyJson?.action || url.searchParams.get("type");

    if (!paymentId) {
      // Evento de teste / ping de conexão do Mercado Pago
      return new Response(JSON.stringify({ status: "ignored_no_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validação Criptográfica da Assinatura HMAC (se webhookSecret estiver configurado)
    const xSignature = req.headers.get("x-signature") || "";
    const xRequestId = req.headers.get("x-request-id") || "";

    if (webhookSecret && xSignature) {
      const isValid = await verifyWebhookSignature(webhookSecret, String(paymentId), xRequestId, xSignature);
      if (!isValid) {
        console.warn("Assinatura do Webhook inválida ou timestamp expirado:", { xSignature, paymentId });
        return new Response(JSON.stringify({ error: "Assinatura HMAC inválida." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Localizar transação / pedido pelo provider_payment_id ou buscar pelo paymentId
    // Buscar se já temos uma transação local ou descobrir qual store_id usar
    let storeId: string | null = null;
    let orderId: string | null = null;

    const { data: existingTx } = await supabase
      .from("payment_transactions")
      .select("order_id, store_id, status")
      .eq("provider_payment_id", String(paymentId))
      .maybeSingle();

    if (existingTx) {
      storeId = existingTx.store_id;
      orderId = existingTx.order_id;
    }

    // Se não encontrou pelo provider_payment_id, obter conexão ativa de qualquer loja para consulta canônica
    // (ou obter o access_token da store vinculada)
    let accessToken: string | null = null;
    if (storeId) {
      const { data: conn } = await supabase
        .from("store_payment_connections")
        .select("access_token")
        .eq("store_id", storeId)
        .single();
      accessToken = conn?.access_token || null;
    }

    // Se ainda não temos token da loja específica, buscar token mestre ou da primeira conexão ativa
    if (!accessToken) {
      const { data: anyConn } = await supabase
        .from("store_payment_connections")
        .select("access_token")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      accessToken = anyConn?.access_token || null;
    }

    if (!accessToken) {
      console.error("Nenhuma credencial ativa encontrada para consultar o pagamento:", paymentId);
      return new Response(JSON.stringify({ error: "Credencial não disponível." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. CONSULTA CANÔNICA NO MERCADO PAGO
    const canonicalPayment = await fetchPaymentCanonically(accessToken, paymentId);

    if (!canonicalPayment || !canonicalPayment.id) {
      console.warn("Pagamento não encontrado na API do Mercado Pago:", paymentId);
      return new Response(JSON.stringify({ error: "Pagamento inexistente no gateway." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef = canonicalPayment.external_reference; // order_id
    const collectorId = String(canonicalPayment.collector_id);
    const mpStatus = canonicalPayment.status;
    const transactionAmount = Number(canonicalPayment.transaction_amount);

    if (!externalRef) {
      console.warn("Pagamento não possui external_reference vinculado:", paymentId);
      return new Response(JSON.stringify({ status: "ignored_no_external_ref" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Validar se o pedido existe e pertence à loja do collector_id
    const { data: storeConn } = await supabase
      .from("store_payment_connections")
      .select("store_id")
      .eq("provider_user_id", collectorId)
      .maybeSingle();

    if (!storeConn) {
      console.warn("Collector ID não pertence a nenhuma loja cadastrada:", collectorId);
      return new Response(JSON.stringify({ error: "Loja não identificada." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedStoreId = storeConn.store_id;

    // 5. TRANSIÇÃO ATÔMICA NO BANCO SE O STATUS FOR APPROVED
    if (mpStatus === "approved") {
      const { data: confirmResult, error: confirmErr } = await supabase.rpc(
        "confirm_payment_webhook_atomic",
        {
          p_order_id: externalRef,
          p_store_id: resolvedStoreId,
          p_provider_payment_id: String(paymentId),
          p_paid_amount: transactionAmount,
          p_gateway_metadata: {
            mp_payment_id: canonicalPayment.id,
            mp_status: canonicalPayment.status,
            mp_status_detail: canonicalPayment.status_detail,
            payment_method_id: canonicalPayment.payment_method_id,
            date_approved: canonicalPayment.date_approved,
          },
        }
      );

      if (confirmErr || !confirmResult?.success) {
        console.error("Erro na confirmação atômica do webhook:", confirmErr || confirmResult?.error);
        return new Response(
          JSON.stringify({ error: confirmErr?.message || confirmResult?.error || "Falha na confirmação." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Atualizar metadados para outros estados sem regredir approved
      await supabase
        .from("payment_transactions")
        .update({
          provider_payment_id: String(paymentId),
          status: mpStatus === "rejected" ? "rejected" : mpStatus === "cancelled" ? "cancelled" : "pending",
          gateway_metadata: {
            mp_payment_id: canonicalPayment.id,
            mp_status: canonicalPayment.status,
            mp_status_detail: canonicalPayment.status_detail,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", externalRef)
        .neq("status", "approved");
    }

    return new Response(
      JSON.stringify({ success: true, payment_id: paymentId, status: mpStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erro não tratado no mercadopago-webhook:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno no processamento do webhook." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
