import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CreatePixPaymentInput {
  orderId: string;
  storeId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerCpf?: string;
}

export interface CreatePixPaymentResult {
  success: boolean;
  providerPaymentId?: string;
  status: string;
  qrCodeBase64?: string;
  pixCopyPaste?: string;
  ticketUrl?: string;
  expiresAt?: string;
  gatewayMetadata?: Record<string, any>;
  error?: string;
}

/**
 * Obtém credencial válida da loja conectada, executando renovação OAuth com Claim/Lease se necessário
 */
export async function getValidStoreToken(
  supabase: SupabaseClient,
  storeId: string
): Promise<{ accessToken: string; providerUserId: string; publicKey?: string } | null> {
  const { data: conn, error: connErr } = await supabase
    .from("store_payment_connections")
    .select("*")
    .eq("store_id", storeId)
    .single();

  if (connErr || !conn || conn.status !== "active") {
    return null;
  }

  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Se o token expira em menos de 1 hora, tenta claim de refresh
  if (expiresAt - now < oneHour) {
    const claimId = crypto.randomUUID();
    const { data: claimData } = await supabase.rpc("acquire_oauth_refresh_claim", {
      p_store_id: storeId,
      p_claim_id: claimId,
      p_lease_seconds: 15,
    });

    if (claimData?.acquired) {
      try {
        const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID") ?? "";
        const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET") ?? "";

        const refreshRes = await fetch("https://api.mercadopago.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: claimData.refresh_token,
          }),
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          await supabase.rpc("finalize_oauth_refresh_claim", {
            p_store_id: storeId,
            p_claim_id: claimId,
            p_access_token: refreshJson.access_token,
            p_refresh_token: refreshJson.refresh_token,
            p_expires_in_seconds: refreshJson.expires_in || 15552000,
          });

          return {
            accessToken: refreshJson.access_token,
            providerUserId: String(refreshJson.user_id || conn.provider_user_id),
            publicKey: refreshJson.public_key || conn.public_key,
          };
        } else {
          console.error("Falha na renovação OAuth do Mercado Pago:", await refreshRes.text());
        }
      } catch (err) {
        console.error("Erro ao renovar token OAuth:", err);
      }
    }
  }

  return {
    accessToken: conn.access_token,
    providerUserId: conn.provider_user_id,
    publicKey: conn.public_key,
  };
}

/**
 * Cria cobrança Pix na API oficial do Mercado Pago com cabeçalho de Idempotência determinístico
 */
export async function createPixPayment(
  accessToken: string,
  input: CreatePixPaymentInput
): Promise<CreatePixPaymentResult> {
  const idempotencyKey = `order_${input.orderId}`;
  
  const payload: Record<string, any> = {
    transaction_amount: Number(input.amount.toFixed(2)),
    description: `Pedido #${input.orderId.substring(0, 8)}`,
    payment_method_id: "pix",
    external_reference: input.orderId,
    payer: {
      email: input.customerEmail,
      first_name: input.customerName.split(" ")[0] || "Cliente",
      last_name: input.customerName.split(" ").slice(1).join(" ") || "Comprador",
    },
  };

  if (input.customerCpf && input.customerCpf.replace(/\D/g, "").length === 11) {
    payload.payer.identification = {
      type: "CPF",
      number: input.customerCpf.replace(/\D/g, ""),
    };
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.id) {
    return {
      success: false,
      status: "failed",
      error: resJson.message || "Erro retornado pelo Mercado Pago ao gerar Pix.",
      gatewayMetadata: resJson,
    };
  }

  const transactionData = resJson.point_of_interaction?.transaction_data;

  return {
    success: true,
    providerPaymentId: String(resJson.id),
    status: resJson.status || "pending",
    qrCodeBase64: transactionData?.qr_code_base64 || "",
    pixCopyPaste: transactionData?.qr_code || "",
    ticketUrl: transactionData?.ticket_url || "",
    expiresAt: resJson.date_of_expiration || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    gatewayMetadata: {
      mp_payment_id: resJson.id,
      mp_status: resJson.status,
      mp_status_detail: resJson.status_detail,
      payment_method_id: resJson.payment_method_id,
      date_created: resJson.date_created,
      date_of_expiration: resJson.date_of_expiration,
    },
  };
}

/**
 * Consulta estado canônico de um pagamento no Mercado Pago
 */
export async function fetchPaymentCanonically(
  accessToken: string,
  paymentId: string | number
): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Erro ao consultar pagamento no Mercado Pago:", err);
    return null;
  }
}

/**
 * Consulta lista de reembolsos de um pagamento no Mercado Pago
 */
export async function fetchPaymentRefunds(
  accessToken: string,
  paymentId: string | number
): Promise<any[] | null> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Erro ao consultar reembolsos no Mercado Pago:", err);
    return null;
  }
}

/**
 * Validação Criptográfica da Assinatura HMAC-SHA256 do Webhook Mercado Pago
 */
export async function verifyWebhookSignature(
  secret: string,
  dataId: string,
  requestId: string,
  xSignatureHeader: string
): Promise<boolean> {
  if (!secret || !xSignatureHeader) {
    return false;
  }

  // x-signature format: ts=1700000000,v1=hashhex...
  const parts = xSignatureHeader.split(",").reduce((acc, part) => {
    const [key, val] = part.trim().split("=");
    if (key && val) acc[key] = val;
    return acc;
  }, {} as Record<string, string>);

  const ts = parts["ts"];
  const hashV1 = parts["v1"];

  if (!ts || !hashV1) {
    return false;
  }

  // Prevenir Replay Attack: Timestamp deve estar dentro de 5 minutos (300s)
  const tsNum = parseInt(ts, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 300) {
    console.warn("Timestamp do webhook expirado ou fora da tolerância de 300s.");
    return false;
  }

  // Manifest conforme documentação oficial: "id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];"
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(manifest);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hexHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hexHash.toLowerCase() === hashV1.toLowerCase();
}

/**
 * Cancela um pagamento pendente na API do Mercado Pago (PUT /v1/payments/:id com status="cancelled")
 */
export async function cancelPaymentOnMercadoPago(
  accessToken: string,
  paymentId: string | number,
  orderId: string
): Promise<{ success: boolean; status?: string; error?: string; metadata?: Record<string, any> }> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `cancel_${orderId}_${paymentId}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    const resJson = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: resJson.message || "Falha ao cancelar pagamento no Mercado Pago.",
        metadata: resJson,
      };
    }

    return {
      success: true,
      status: resJson.status,
      metadata: resJson,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erro de rede ao cancelar pagamento no Mercado Pago.",
    };
  }
}

/**
 * Reembolsa um pagamento aprovado na API do Mercado Pago (POST /v1/payments/:id/refunds)
 */
export async function refundPaymentOnMercadoPago(
  accessToken: string,
  paymentId: string | number,
  orderId: string,
  amount?: number
): Promise<{ success: boolean; refundId?: string | number; status?: string; error?: string; metadata?: Record<string, any> }> {
  try {
    const bodyPayload: Record<string, any> = {};
    if (amount !== undefined && amount > 0) {
      bodyPayload.amount = Number(amount.toFixed(2));
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `refund_${orderId}_${paymentId}`,
      },
      body: Object.keys(bodyPayload).length > 0 ? JSON.stringify(bodyPayload) : undefined,
    });

    const resJson = await response.json();
    if (!response.ok || (resJson.status && resJson.status !== "approved" && resJson.status !== "refunded")) {
      return {
        success: false,
        error: resJson.message || "Falha ao processar estorno no Mercado Pago.",
        metadata: resJson,
      };
    }

    return {
      success: true,
      refundId: resJson.id,
      status: resJson.status || "approved",
      metadata: resJson,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erro de rede ao processar estorno no Mercado Pago.",
    };
  }
}

