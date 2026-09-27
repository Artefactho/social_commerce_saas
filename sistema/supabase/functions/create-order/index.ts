import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getValidStoreToken,
  createPixPayment,
} from "../_shared/mercadopago.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface CreateOrderPayload {
  store_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  shipping_address: string;
  shipping_zip?: string;
  items: OrderItemInput[];
  coupon_code?: string;
  payment_method?: string;
}

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

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
      return new Response(
        JSON.stringify({ error: "Configuração de servidor incompleta para processamento de pedidos." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: CreateOrderPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Payload JSON inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      store_id,
      customer_name,
      customer_email,
      customer_cpf,
      items,
      payment_method = "pix",
    } = body;

    // 1. Validação prévia de campos obrigatórios
    if (!store_id || typeof store_id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID da loja (store_id) é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer_name || !customer_name.trim()) {
      return new Response(
        JSON.stringify({ error: "Nome do cliente é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer_email || !customer_email.trim() || !customer_email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "E-mail do cliente é inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "O carrinho de compras não pode estar vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Executar a Transação ACID Única no PostgreSQL via RPC 'process_order_atomic'
    const { data: orderResult, error: rpcError } = await supabase.rpc("process_order_atomic", {
      p_order_payload: body,
    });

    if (rpcError) {
      console.warn("Transação de pedido rejeitada no PostgreSQL:", rpcError.message);
      return new Response(
        JSON.stringify({ error: rpcError.message || "Falha ao processar pedido no banco de dados." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!orderResult || !orderResult.success) {
      return new Response(
        JSON.stringify({ error: orderResult?.error || "Erro desconhecido ao processar pedido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = orderResult.order_id;
    const totalAmount = Number(orderResult.total_amount);

    // 3. Processamento de Pagamento Real via Mercado Pago Pix
    let paymentData: Record<string, any> = {
      method: payment_method,
      status: "pending",
    };

    if (payment_method === "pix") {
      const claimId = crypto.randomUUID();

      // 3.1 Adquirir Claim de Pagamento no Banco (Lease de 20s)
      const { data: claimResult } = await supabase.rpc("acquire_payment_claim", {
        p_order_id: orderId,
        p_store_id: store_id,
        p_amount: totalAmount,
        p_claim_id: claimId,
        p_lease_seconds: 20,
      });

      if (claimResult?.acquired) {
        // Obteve o lease: chama Mercado Pago
        const storeAuth = await getValidStoreToken(supabase, store_id);

        if (!storeAuth?.accessToken) {
          await supabase.rpc("fail_payment_claim", {
            p_order_id: orderId,
            p_claim_id: claimId,
            p_error_message: "Loja não possui conta Mercado Pago conectada ou ativa.",
          });

          return new Response(
            JSON.stringify({
              error: "Esta loja ainda não conectou uma conta do Mercado Pago para receber pagamentos via Pix.",
              order_id: orderId,
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const mpResult = await createPixPayment(storeAuth.accessToken, {
          orderId,
          storeId: store_id,
          amount: totalAmount,
          customerName: customer_name,
          customerEmail: customer_email,
          customerCpf: customer_cpf,
        });

        if (!mpResult.success) {
          await supabase.rpc("fail_payment_claim", {
            p_order_id: orderId,
            p_claim_id: claimId,
            p_error_message: mpResult.error || "Falha na criação de cobrança no Mercado Pago.",
          });

          return new Response(
            JSON.stringify({
              error: mpResult.error || "Erro ao gerar cobrança Pix no Mercado Pago.",
              order_id: orderId,
            }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 3.2 Finalizar Claim com Guarda CAS (Ownership check)
        const { data: finalTx } = await supabase.rpc("finalize_payment_claim", {
          p_order_id: orderId,
          p_claim_id: claimId,
          p_provider_payment_id: mpResult.providerPaymentId,
          p_qr_code_base64: mpResult.qrCodeBase64,
          p_pix_copy_paste: mpResult.pixCopyPaste,
          p_ticket_url: mpResult.ticketUrl,
          p_expires_at: mpResult.expiresAt,
          p_gateway_metadata: mpResult.gatewayMetadata || {},
        });

        paymentData = {
          method: "pix",
          status: finalTx?.status || "pending",
          provider_payment_id: finalTx?.provider_payment_id || mpResult.providerPaymentId,
          pix_qr_code_base64: finalTx?.qr_code_base64 || mpResult.qrCodeBase64,
          pix_copy_paste: finalTx?.pix_copy_paste || mpResult.pixCopyPaste,
          ticket_url: finalTx?.ticket_url || mpResult.ticketUrl,
          expires_at: finalTx?.expires_at || mpResult.expiresAt,
        };
      } else {
        // Concorrência: outra requisição já adquiriu ou já gerou
        let txData = claimResult;
        if (txData?.status === "initializing") {
          // Aguarda até 3 segundos pela conclusão do processo concorrente
          for (let i = 0; i < 6; i++) {
            await new Promise((r) => setTimeout(r, 500));
            const { data: currentTx } = await supabase
              .from("payment_transactions")
              .select("*")
              .eq("order_id", orderId)
              .single();

            if (currentTx && currentTx.status !== "initializing") {
              txData = currentTx;
              break;
            }
          }
        }

        paymentData = {
          method: "pix",
          status: txData?.status || "pending",
          provider_payment_id: txData?.provider_payment_id,
          pix_qr_code_base64: txData?.qr_code_base64,
          pix_copy_paste: txData?.pix_copy_paste,
          ticket_url: txData?.ticket_url,
          expires_at: txData?.expires_at,
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        customer_id: orderResult.customer_id,
        store_slug: orderResult.store_slug,
        subtotal: Number(orderResult.subtotal),
        discount: Number(orderResult.discount),
        shipping: Number(orderResult.shipping),
        total_amount: totalAmount,
        payment: paymentData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro não tratado no create-order:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao processar pedido no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
