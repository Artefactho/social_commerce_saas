import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidStoreToken, refundPaymentOnMercadoPago } from "../_shared/mercadopago.ts";

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
    const { order_id, store_id } = body;

    if (!order_id || !store_id) {
      return new Response(
        JSON.stringify({ error: "order_id e store_id são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const claimId = crypto.randomUUID();

    // 2. Adquirir Claim/Lease de Reembolso Atômico (previne concorrência e race condition)
    const { data: claimData, error: claimErr } = await supabase.rpc("acquire_refund_claim", {
      p_order_id: order_id,
      p_store_id: store_id,
      p_user_id: user.id,
      p_claim_id: claimId,
      p_lease_seconds: 30,
    });

    if (claimErr) {
      return new Response(
        JSON.stringify({ error: claimErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Idempotência: Se já foi estornado
    if (claimData?.already_refunded) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "refunded",
          already_refunded: true,
          amount: claimData.amount,
          message: "Este pagamento já foi reembolsado anteriormente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!claimData?.acquired) {
      const errMsg = claimData?.error || "Não foi possível adquirir posse do reembolso.";
      const statusCode = claimData?.is_locked ? 409 : errMsg.includes("Não autorizado") ? 403 : 400;
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Obter credencial do lojista no Mercado Pago
    const tokenData = await getValidStoreToken(supabase, store_id);
    if (!tokenData?.accessToken) {
      await supabase.rpc("fail_refund_claim", {
        p_order_id: order_id,
        p_claim_id: claimId,
        p_error_message: "Loja sem credencial ativa do Mercado Pago.",
      });

      return new Response(
        JSON.stringify({ error: "Loja não possui conexão ativa com o Mercado Pago para realizar o reembolso." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerPaymentId = claimData.provider_payment_id;
    const expectedAmount = Number(claimData.amount);

    // 5. Helper para avaliar lista canônica de reembolsos do Mercado Pago
    const evaluateGatewayRefunds = (paymentObj: Record<string, any> | null, refundsArr: any[] | null) => {
      const list: any[] = refundsArr && Array.isArray(refundsArr) && refundsArr.length > 0
        ? refundsArr
        : (paymentObj?.refunds && Array.isArray(paymentObj.refunds) ? paymentObj.refunds : []);

      const approved = list.filter((r: any) => r.status === "approved");
      const inProcess = list.filter((r: any) => r.status === "in_process");
      
      const totalApproved = approved.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const totalInProcess = inProcess.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      
      const isPaymentFullyRefunded = paymentObj?.status === "refunded" || (totalApproved >= expectedAmount - 0.01);
      const hasPendingInProcess = totalInProcess > 0 || (totalApproved + totalInProcess >= expectedAmount - 0.01 && !isPaymentFullyRefunded);

      return {
        list,
        approved,
        inProcess,
        totalApproved,
        totalInProcess,
        isFullyApproved: isPaymentFullyRefunded,
        isInProcess: hasPendingInProcess,
        primaryRefundId: approved[0]?.id || inProcess[0]?.id || null,
      };
    };

    // 6. ETAPA PRE-FLIGHT RECONCILIATION:
    // Consulta o estado canônico do pagamento e lista de reembolsos no Mercado Pago antes de tentar criar novo reembolso
    const mpPayment = await fetchPaymentCanonically(tokenData.accessToken, providerPaymentId);
    const preFlightRefunds = await fetchPaymentRefunds(tokenData.accessToken, providerPaymentId);
    const preRecon = evaluateGatewayRefunds(mpPayment, preFlightRefunds);

    if (preRecon.isFullyApproved) {
      // Reembolso integral aprovado e concluído no gateway em tentativa anterior!
      const refundId = String(preRecon.primaryRefundId || `ref_${order_id}`);
      await supabase.rpc("finalize_refund_claim", {
        p_order_id: order_id,
        p_claim_id: claimId,
        p_refund_id: refundId,
        p_gateway_metadata: {
          reconciled_pre_flight: true,
          mp_status: mpPayment?.status,
          total_refunded: preRecon.totalApproved,
          approved_refunds: preRecon.approved,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order_id,
          order_status: "cancelled",
          transaction_status: "refunded",
          refund_id: refundId,
          amount: preRecon.totalApproved || claimData.amount,
          reconciled: true,
          message: "Reembolso integral já efetivado no Mercado Pago e reconciliado com sucesso!",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (preRecon.isInProcess) {
      // Reembolso está em processamento assíncrono no Mercado Pago (in_process)
      // NÃO emite segundo POST e NÃO marca 'refunded' prematuramente
      await supabase.rpc("fail_refund_claim", {
        p_order_id: order_id,
        p_claim_id: claimId,
        p_error_message: "Reembolso em processamento no Mercado Pago (in_process).",
      });

      return new Response(
        JSON.stringify({
          success: false,
          in_process: true,
          order_id: order_id,
          order_status: "paid",
          transaction_status: "approved",
          message: "O estorno está em análise/processamento no Mercado Pago. Aguarde a confirmação.",
        }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Executar chamada à API oficial de Reembolso do Mercado Pago com Idempotency Key determinística
    const refundRes = await refundPaymentOnMercadoPago(
      tokenData.accessToken,
      providerPaymentId,
      order_id,
      claimData.amount
    );

    // 8. Tratar resultado do Gateway
    if (refundRes.success) {
      if (refundRes.status === "approved" || refundRes.status === "refunded") {
        // 8.1 Finalização Atômica com CAS no Postgres para status concluído
        await supabase.rpc("finalize_refund_claim", {
          p_order_id: order_id,
          p_claim_id: claimId,
          p_refund_id: String(refundRes.refundId || `ref_${order_id}`),
          p_gateway_metadata: refundRes.metadata || {},
        });

        return new Response(
          JSON.stringify({
            success: true,
            order_id: order_id,
            order_status: "cancelled",
            transaction_status: "refunded",
            refund_id: refundRes.refundId,
            amount: claimData.amount,
            message: "Reembolso processado com sucesso!",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (refundRes.status === "in_process") {
        // Status in_process retornado pelo POST imediato
        await supabase.rpc("fail_refund_claim", {
          p_order_id: order_id,
          p_claim_id: claimId,
          p_error_message: "Reembolso iniciado e em processamento no Mercado Pago.",
        });

        return new Response(
          JSON.stringify({
            success: false,
            in_process: true,
            order_id: order_id,
            message: "Estorno recebido pelo Mercado Pago e em processamento bancário.",
          }),
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 9. ETAPA POST-FAILURE RECONCILIATION:
    // Em caso de falha de rede, timeout ou erro 4xx/5xx, consultar o gateway novamente
    const postMpPayment = await fetchPaymentCanonically(tokenData.accessToken, providerPaymentId);
    const postFlightRefunds = await fetchPaymentRefunds(tokenData.accessToken, providerPaymentId);
    const postRecon = evaluateGatewayRefunds(postMpPayment, postFlightRefunds);

    if (postRecon.isFullyApproved) {
      // O POST foi efetivado e concluído no gateway antes da perda de conexão!
      const refundId = String(postRecon.primaryRefundId || `ref_${order_id}`);
      await supabase.rpc("finalize_refund_claim", {
        p_order_id: order_id,
        p_claim_id: claimId,
        p_refund_id: refundId,
        p_gateway_metadata: {
          reconciled_post_failure: true,
          mp_status: postMpPayment?.status,
          total_refunded: postRecon.totalApproved,
          approved_refunds: postRecon.approved,
          original_error: refundRes.error,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order_id,
          order_status: "cancelled",
          transaction_status: "refunded",
          refund_id: refundId,
          amount: postRecon.totalApproved || claimData.amount,
          reconciled: true,
          message: "Reembolso confirmado no Mercado Pago e reconciliado com sucesso após validação de rede.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (postRecon.isInProcess) {
      // O POST gerou estorno in_process antes da perda de resposta
      await supabase.rpc("fail_refund_claim", {
        p_order_id: order_id,
        p_claim_id: claimId,
        p_error_message: "Reembolso detectado em processamento no Mercado Pago após validação.",
      });

      return new Response(
        JSON.stringify({
          success: false,
          in_process: true,
          order_id: order_id,
          message: "Reembolso confirmado em processamento no Mercado Pago. Aguarde liquidação.",
        }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Se e somente se o gateway confirmar que o pagamento NÃO foi reembolsado, libera o lease
    await supabase.rpc("fail_refund_claim", {
      p_order_id: order_id,
      p_claim_id: claimId,
      p_error_message: refundRes.error || "Falha desconhecida no gateway de reembolso.",
    });

    return new Response(
      JSON.stringify({ error: refundRes.error || "Erro retornado pelo Mercado Pago ao estornar pagamento." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao processar reembolso." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
