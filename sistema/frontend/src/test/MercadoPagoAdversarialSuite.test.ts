import { describe, it, expect, beforeEach } from "vitest";

// ============================================================================
// SIMULADOR MATEMÁTICO E ADVERSARIAL DE BANCO, LEASE E MERCADO PAGO
// ============================================================================

interface PaymentTxRow {
  id: string;
  order_id: string;
  store_id: string;
  provider: string;
  amount: number;
  status: "initializing" | "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded" | "failed";
  provider_payment_id?: string;
  qr_code_base64?: string;
  pix_copy_paste?: string;
  ticket_url?: string;
  idempotency_key: string;
  claim_id?: string | null;
  claim_expires_at?: number | null; // timestamp ms
  expires_at?: string;
  paid_at?: string;
  gateway_metadata?: Record<string, any>;
}

interface StoreConnectionRow {
  store_id: string;
  provider_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms
  refresh_claim_id?: string | null;
  refresh_lease_until?: number | null;
  status: "active" | "revoked";
}

interface OrderRow {
  id: string;
  store_id: string;
  total_amount: number;
  status: "pending" | "paid" | "cancelled";
}

// Implementação fiel das RPCs PostgreSQL em memória para teste determinístico
class PostgresCommerceMock {
  orders = new Map<string, OrderRow>();
  transactions = new Map<string, PaymentTxRow>();
  storeConnections = new Map<string, StoreConnectionRow>();
  oauthStates = new Map<string, { state: string; store_id: string; used: boolean; expires_at: number }>();

  currentTime = 1000000;

  // RPC: acquire_payment_claim
  acquirePaymentClaim(orderId: string, storeId: string, amount: number, claimId: string, leaseSeconds = 20) {
    const key = `${orderId}_mercadopago`;
    const leaseUntil = this.currentTime + leaseSeconds * 1000;
    const existing = this.transactions.get(key);

    if (!existing) {
      const newTx: PaymentTxRow = {
        id: `tx_${orderId}`,
        order_id: orderId,
        store_id: storeId,
        provider: "mercadopago",
        amount,
        status: "initializing",
        idempotency_key: `order_${orderId}`,
        claim_id: claimId,
        claim_expires_at: leaseUntil,
      };
      this.transactions.set(key, newTx);
      return { acquired: true, tx: newTx };
    }

    // Se existente: só assume se for initializing/failed e lease expirado
    const isExpired = !existing.claim_expires_at || existing.claim_expires_at < this.currentTime;
    const canTakeover = (existing.status === "initializing" || existing.status === "failed") && isExpired;

    if (canTakeover) {
      existing.claim_id = claimId;
      existing.claim_expires_at = leaseUntil;
      existing.status = "initializing";
      return { acquired: true, tx: existing };
    }

    return { acquired: false, tx: existing };
  }

  // RPC: finalize_payment_claim (CAS com guarda de claim_id)
  finalizePaymentClaim(
    orderId: string,
    claimId: string,
    paymentId: string,
    qrCodeBase64: string,
    pixCopyPaste: string,
    ticketUrl: string,
    expiresAt: string,
    metadata = {}
  ) {
    const key = `${orderId}_mercadopago`;
    const tx = this.transactions.get(key);
    if (!tx) return { success: false, was_owner: false };

    // GUARDA DE OWNERSHIP: Só comita se o claim ainda for desta requisição
    if (tx.claim_id === claimId) {
      tx.provider_payment_id = paymentId;
      tx.qr_code_base64 = qrCodeBase64;
      tx.pix_copy_paste = pixCopyPaste;
      tx.ticket_url = ticketUrl;
      tx.expires_at = expiresAt;
      tx.gateway_metadata = metadata;
      tx.status = tx.status === "approved" || tx.status === "paid" ? tx.status : "pending";
      tx.claim_id = null;
      tx.claim_expires_at = null;
      return { success: true, was_owner: true, tx };
    }

    // Se perdeu o lease: NÃO altera claim_id, NÃO altera status, retorna estado canônico consolidado
    return { success: true, was_owner: false, tx };
  }

  // RPC: confirm_payment_webhook_atomic
  confirmPaymentWebhookAtomic(
    orderId: string,
    storeId: string,
    providerPaymentId: string,
    paidAmount: number,
    metadata = {}
  ) {
    const order = this.orders.get(orderId);
    if (!order) return { success: false, error: "Pedido não encontrado." };
    if (order.store_id !== storeId) return { success: false, error: "Pedido pertence a outra loja." };
    if (order.total_amount !== paidAmount) return { success: false, error: "Valor pago divergente do total do pedido." };

    const key = `${orderId}_mercadopago`;
    let tx = this.transactions.get(key);
    if (!tx) {
      tx = {
        id: `tx_${orderId}`,
        order_id: orderId,
        store_id: storeId,
        provider: "mercadopago",
        amount: paidAmount,
        status: "approved",
        idempotency_key: `order_${orderId}`,
        provider_payment_id: providerPaymentId,
        paid_at: new Date(this.currentTime).toISOString(),
        gateway_metadata: metadata,
        claim_id: null,
        claim_expires_at: null,
      };
      this.transactions.set(key, tx);
    } else {
      tx.provider_payment_id = providerPaymentId;
      tx.status = "approved";
      tx.paid_at = new Date(this.currentTime).toISOString();
      tx.gateway_metadata = metadata;
      tx.claim_id = null;
      tx.claim_expires_at = null;
    }

    if (order.status === "pending") {
      order.status = "paid";
    }

    return { success: true, order_status: order.status, tx_status: "approved" };
  }

  // RPC: acquire_oauth_refresh_claim
  acquireOAuthRefreshClaim(storeId: string, claimId: string, leaseSeconds = 15) {
    const conn = this.storeConnections.get(storeId);
    if (!conn) return { acquired: false };

    const isExpired = !conn.refresh_lease_until || conn.refresh_lease_until < this.currentTime;
    if (isExpired) {
      conn.refresh_claim_id = claimId;
      conn.refresh_lease_until = this.currentTime + leaseSeconds * 1000;
      return { acquired: true, refresh_token: conn.refresh_token };
    }

    return { acquired: false, access_token: conn.access_token };
  }

  // RPC: finalize_oauth_refresh_claim (CAS)
  finalizeOAuthRefreshClaim(storeId: string, claimId: string, newAccess: string, newRefresh: string, expiresInSec: number) {
    const conn = this.storeConnections.get(storeId);
    if (!conn) return { success: false };

    if (conn.refresh_claim_id === claimId) {
      conn.access_token = newAccess;
      conn.refresh_token = newRefresh;
      conn.expires_at = this.currentTime + expiresInSec * 1000;
      conn.refresh_claim_id = null;
      conn.refresh_lease_until = null;
      return { success: true };
    }

    return { success: false };
  }
}

// Simulador da API do Mercado Pago com Idempotência Estrita
class MercadoPagoGatewayMock {
  paymentsByIdempotency = new Map<string, any>();
  paymentsById = new Map<string, any>();
  callCount = 0;

  createPayment(idempotencyKey: string, payload: any) {
    this.callCount++;
    if (this.paymentsByIdempotency.has(idempotencyKey)) {
      return { status: 200, data: this.paymentsByIdempotency.get(idempotencyKey) };
    }

    const payment = {
      id: `mp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: "pending",
      status_detail: "waiting_transfer",
      transaction_amount: payload.transaction_amount,
      external_reference: payload.external_reference,
      collector_id: "collector_store_1",
      point_of_interaction: {
        transaction_data: {
          qr_code_base64: "base64_sample_real",
          qr_code: `00020126580014br.gov.bcb.pix0136${payload.external_reference}`,
          ticket_url: `https://mercadopago.com/ticket/${payload.external_reference}`,
        },
      },
      date_of_expiration: new Date(Date.now() + 1800000).toISOString(),
    };

    this.paymentsByIdempotency.set(idempotencyKey, payment);
    this.paymentsById.set(payment.id, payment);

    return { status: 201, data: payment };
  }
}

// ============================================================================
// BATERIA DE TESTES ADVERSARIAIS OBRIGATÓRIOS DA FASE 5 (MP-01 a MP-30)
// ============================================================================

describe("Fase 5: Suíte Adversarial Mercado Pago Pix & Claim/Lease Engine", () => {
  let db: PostgresCommerceMock;
  let mp: MercadoPagoGatewayMock;

  beforeEach(() => {
    db = new PostgresCommerceMock();
    mp = new MercadoPagoGatewayMock();

    // Setup de Loja e Pedido base
    db.orders.set("order-100", {
      id: "order-100",
      store_id: "store-1",
      total_amount: 150.0,
      status: "pending",
    });

    db.storeConnections.set("store-1", {
      store_id: "store-1",
      provider_user_id: "collector_store_1",
      access_token: "APP_USR_VALID_TOKEN",
      refresh_token: "TG_REFRESH_TOKEN",
      expires_at: db.currentTime + 86400000,
      status: "active",
    });
  });

  it("MP-01 a MP-07 [Criação e Concorrência]: 2 requisições simultâneas para o mesmo pedido geram exatamente 1 Pix e ambas recebem os mesmos dados", () => {
    const claimA = "claim-uuid-A";
    const claimB = "claim-uuid-B";

    // 1. Request A adquire claim
    const resA = db.acquirePaymentClaim("order-100", "store-1", 150.0, claimA, 20);
    expect(resA.acquired).toBe(true);

    // 2. Request B tenta adquirir claim concorrentemente
    const resB = db.acquirePaymentClaim("order-100", "store-1", 150.0, claimB, 20);
    expect(resB.acquired).toBe(false); // B não adquire lease enquanto A está ativo

    // 3. Request A chama Mercado Pago com Idempotency Key
    const mpResA = mp.createPayment("order_order-100", {
      transaction_amount: 150.0,
      external_reference: "order-100",
    });
    expect(mpResA.status).toBe(201);
    expect(mp.callCount).toBe(1);

    // 4. Request A finaliza claim
    const finA = db.finalizePaymentClaim(
      "order-100",
      claimA,
      mpResA.data.id,
      mpResA.data.point_of_interaction.transaction_data.qr_code_base64,
      mpResA.data.point_of_interaction.transaction_data.qr_code,
      mpResA.data.point_of_interaction.transaction_data.ticket_url,
      mpResA.data.date_of_expiration
    );
    expect(finA.was_owner).toBe(true);
    expect(finA.tx?.status).toBe("pending");

    // 5. Request B que estava em polling agora lê o resultado consolidado
    const canonicalTx = db.transactions.get("order-100_mercadopago");
    expect(canonicalTx?.status).toBe("pending");
    expect(canonicalTx?.pix_copy_paste).toBe(finA.tx?.pix_copy_paste);
    expect(canonicalTx?.provider_payment_id).toBe(mpResA.data.id);
  });

  it("MP-21 a MP-23 [Lease Timeout, Takeover de B e Proteção CAS]: Processo A perde lease no meio do HTTP; B assume lease; A acorda depois e NÃO pode sobrescrever nem liberar claim de B", () => {
    const claimA = "claim-uuid-A";
    const claimB = "claim-uuid-B";

    // 1. Request A adquire lease (TTL = 20s)
    db.acquirePaymentClaim("order-100", "store-1", 150.0, claimA, 20);

    // 2. A requisição HTTP de A trava no gateway. O tempo avança 25 segundos (Lease expira)
    db.currentTime += 25000;

    // 3. Request B chega e assume o claim expirado
    const resB = db.acquirePaymentClaim("order-100", "store-1", 150.0, claimB, 20);
    expect(resB.acquired).toBe(true);
    expect(resB.tx?.claim_id).toBe(claimB);

    // 4. Request B chama MP com Idempotency Key
    const mpResB = mp.createPayment("order_order-100", {
      transaction_amount: 150.0,
      external_reference: "order-100",
    });

    // 5. Request B finaliza com sucesso
    const finB = db.finalizePaymentClaim(
      "order-100",
      claimB,
      mpResB.data.id,
      "qr_b",
      "copy_b",
      "ticket_b",
      "exp_b"
    );
    expect(finB.was_owner).toBe(true);

    // 6. Request A FINALMENTE acorda e tenta finalizar usando seu claimA expirado
    const finA = db.finalizePaymentClaim(
      "order-100",
      claimA, // claimA já foi revogado
      "id_velho_de_a",
      "qr_velho_de_a",
      "copy_velho_de_a",
      "ticket_velho_de_a",
      "exp_velho_de_a"
    );

    // CAS RECUSA MUTAR: A perdeu a posse
    expect(finA.was_owner).toBe(false);

    // Estado do banco PERMANECE INTACTO com o resultado de B
    const finalTx = db.transactions.get("order-100_mercadopago");
    expect(finalTx?.provider_payment_id).toBe(mpResB.data.id);
    expect(finalTx?.pix_copy_paste).toBe("copy_b");
  });

  it("MP-24 [Race Condition POST x Webhook]: Webhook approved chega antes da resposta do POST; POST tardio NÃO regride approved para pending", () => {
    const claimA = "claim-uuid-A";
    db.acquirePaymentClaim("order-100", "store-1", 150.0, claimA, 20);

    // 1. Webhook chega instantaneamente e aprova o pedido antes do POST finalizar
    const webhookRes = db.confirmPaymentWebhookAtomic(
      "order-100",
      "store-1",
      "mp_pay_999",
      150.0
    );
    expect(webhookRes.success).toBe(true);
    expect(webhookRes.order_status).toBe("paid");

    // 2. POST chega atrasado e tenta gravar 'pending'
    const postFinalize = db.finalizePaymentClaim(
      "order-100",
      claimA,
      "mp_pay_999",
      "qr_code_base64",
      "pix_copy_paste",
      "ticket_url",
      "expires_at"
    );

    // STATUS PERMANECE APPROVED E PAID (Não regrediu para pending!)
    expect(postFinalize.tx?.status).toBe("approved");
    expect(db.orders.get("order-100")?.status).toBe("paid");
  });

  it("MP-25 [Webhook Replay Idempotency]: Reprocessar o mesmo webhook 20 vezes não duplica confirmações nem causa erros", () => {
    for (let i = 0; i < 20; i++) {
      const res = db.confirmPaymentWebhookAtomic(
        "order-100",
        "store-1",
        "mp_pay_123",
        150.0
      );
      expect(res.success).toBe(true);
      expect(res.order_status).toBe("paid");
    }

    expect(db.orders.get("order-100")?.status).toBe("paid");
    expect(db.transactions.get("order-100_mercadopago")?.status).toBe("approved");
  });

  it("MP-28 e MP-29 [Tenant e Pedido Adversarial no Webhook]: Webhook de outra loja ou outro pedido é rejeitado", () => {
    // Tentativa 1: Webhook com store_id diferente (Store B tentando aprovar pedido da Store A)
    const resWrongStore = db.confirmPaymentWebhookAtomic(
      "order-100",
      "store-invalida-B",
      "mp_pay_999",
      150.0
    );
    expect(resWrongStore.success).toBe(false);
    expect(resWrongStore.error).toBe("Pedido pertence a outra loja.");
    expect(db.orders.get("order-100")?.status).toBe("pending");

    // Tentativa 2: Webhook com pedido inexistente
    const resNotFound = db.confirmPaymentWebhookAtomic(
      "order-fake-inexistente",
      "store-1",
      "mp_pay_999",
      150.0
    );
    expect(resNotFound.success).toBe(false);
    expect(resNotFound.error).toBe("Pedido não encontrado.");
  });

  it("MP-12 [Auditoria Financeira no Webhook]: Webhook com valor divergente (adulteração) não aprova o pedido", () => {
    // Pedido no banco é R$ 150.00; atacante envia webhook confirmando R$ 10.00
    const resFraud = db.confirmPaymentWebhookAtomic(
      "order-100",
      "store-1",
      "mp_pay_999",
      10.0 // Valor divergente
    );

    expect(resFraud.success).toBe(false);
    expect(resFraud.error).toBe("Valor pago divergente do total do pedido.");
    // Pedido continua estritamente pending!
    expect(db.orders.get("order-100")?.status).toBe("pending");
  });

  it("MP-26 e MP-27 [Refresh Concorrente com Lease e CAS]: Múltiplas requisições simultâneas disparam exatamente 1 refresh OAuth", () => {
    const claim1 = "claim-refresh-1";
    const claim2 = "claim-refresh-2";

    // 1. Checkout 1 adquire claim de refresh
    const r1 = db.acquireOAuthRefreshClaim("store-1", claim1, 15);
    expect(r1.acquired).toBe(true);

    // 2. Checkout 2 tenta adquirir claim no mesmo instante
    const r2 = db.acquireOAuthRefreshClaim("store-1", claim2, 15);
    expect(r2.acquired).toBe(false); // Checkout 2 aguarda e lê o token atual

    // 3. Checkout 1 finaliza o refresh com novos tokens
    const finRefresh = db.finalizeOAuthRefreshClaim(
      "store-1",
      claim1,
      "APP_USR_NEW_TOKEN",
      "TG_NEW_REFRESH",
      15552000
    );
    expect(finRefresh.success).toBe(true);

    const updatedConn = db.storeConnections.get("store-1");
    expect(updatedConn?.access_token).toBe("APP_USR_NEW_TOKEN");
    expect(updatedConn?.refresh_token).toBe("TG_NEW_REFRESH");
    expect(updatedConn?.refresh_claim_id).toBeNull();
  });
});
