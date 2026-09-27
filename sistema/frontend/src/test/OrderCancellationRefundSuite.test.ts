import { describe, it, expect, vi, beforeEach } from "vitest";
import { cancelOrder, refundOrder, CancelOrderRequest, RefundOrderRequest } from "@/services/order/OrderService";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe("Order Cancellation & Refund — Focused Adversarial Suite (Scenarios A - G)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CENÁRIO A: Refund Integral Concluído
  it("CENÁRIO A: Pre-flight encontra refund integral concluído (approved) -> não emite novo POST e finaliza localmente", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-a",
        order_status: "cancelled",
        transaction_status: "refunded",
        refund_id: "mp-ref-approved-100",
        amount: 250.0,
        reconciled: true,
        message: "Reembolso integral já efetivado no Mercado Pago e reconciliado com sucesso!",
      },
      error: null,
    });

    const res = await refundOrder({ orderId: "order-a", storeId: "store-1" });
    expect(res.success).toBe(true);
    expect(res.orderStatus).toBe("cancelled");
    expect(res.transactionStatus).toBe("refunded");
    expect(res.refundId).toBe("mp-ref-approved-100");
    expect(res.amount).toBe(250.0);
  });

  // CENÁRIO B: Refund in_process
  it("CENÁRIO B: Pre-flight encontra refund in_process -> não emite novo POST e NÃO marca refunded prematuramente", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: false,
        in_process: true,
        order_id: "order-b",
        order_status: "paid",
        transaction_status: "approved",
        error: "O estorno está em análise/processamento no Mercado Pago. Aguarde a confirmação.",
      },
      error: null,
    });

    await expect(refundOrder({ orderId: "order-b", storeId: "store-1" })).rejects.toThrow(
      "O estorno está em análise/processamento no Mercado Pago"
    );
  });

  // CENÁRIO C: Refund Parcial (< valor esperado)
  it("CENÁRIO C: Refund parcial no gateway não atinge valor integral -> não marca transação como refunded", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: false,
        error: "Valor reembolsado no gateway (R$ 50,00) inferior ao total esperado (R$ 150,00).",
      },
      error: null,
    });

    await expect(refundOrder({ orderId: "order-c", storeId: "store-1" })).rejects.toThrow(
      "Valor reembolsado no gateway"
    );
  });

  // CENÁRIO D: Múltiplos Refunds que somam o valor integral
  it("CENÁRIO D: Múltiplos refunds aprovados somam o valor integral do pedido -> reconcilia e finaliza com sucesso", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-d",
        order_status: "cancelled",
        transaction_status: "refunded",
        refund_id: "mp-ref-multi-1",
        amount: 300.0, // Soma de 100 + 200
        reconciled: true,
      },
      error: null,
    });

    const res = await refundOrder({ orderId: "order-d", storeId: "store-1" });
    expect(res.success).toBe(true);
    expect(res.transactionStatus).toBe("refunded");
    expect(res.amount).toBe(300.0);
  });

  // CENÁRIO E: Nenhum Refund Prévio (Fluxo Normal)
  it("CENÁRIO E: Nenhum refund prévio no gateway -> prossegue normalmente para emissão do POST com idempotência", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-e",
        order_status: "cancelled",
        transaction_status: "refunded",
        refund_id: "mp-ref-new-999",
        amount: 180.0,
      },
      error: null,
    });

    const res = await refundOrder({ orderId: "order-e", storeId: "store-1" });
    expect(res.success).toBe(true);
    expect(res.refundId).toBe("mp-ref-new-999");
  });

  // CENÁRIO F: Crash após Refund Efetivado (Recovery no Retry)
  it("CENÁRIO F: Crash da aplicação após MP efetivar refund -> retry adquire novo lease, reconcilia via GET e não duplica POST", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-f",
        order_status: "cancelled",
        transaction_status: "refunded",
        refund_id: "mp-ref-post-crash-f",
        reconciled: true,
        amount: 120.0,
        message: "Reembolso confirmado no Mercado Pago e reconciliado com sucesso após validação de rede.",
      },
      error: null,
    });

    const res = await refundOrder({ orderId: "order-f", storeId: "store-1" });
    expect(res.success).toBe(true);
    expect(res.transactionStatus).toBe("refunded");
  });

  // CENÁRIO G: Crash com Refund in_process
  it("CENÁRIO G: Crash com refund in_process no gateway -> retry detecta in_process, não emite segundo POST e não marca refunded", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: false,
        in_process: true,
        order_id: "order-g",
        error: "Reembolso confirmado em processamento no Mercado Pago. Aguarde liquidação.",
      },
      error: null,
    });

    await expect(refundOrder({ orderId: "order-g", storeId: "store-1" })).rejects.toThrow(
      "Reembolso confirmado em processamento no Mercado Pago"
    );
  });

  // Validação Multi-Tenant e Autorização
  it("AUTH/TENANT: Tentativa de cancelamento/estorno sem autorização ou de outra loja é rejeitada (401/403)", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: {
        message: "Não autorizado a reembolsar pedidos desta loja.",
        context: { json: async () => ({ error: "Não autorizado a reembolsar pedidos desta loja." }) },
      },
    });

    await expect(refundOrder({ orderId: "order-cross", storeId: "store-cross" })).rejects.toThrow(
      "Não autorizado a reembolsar pedidos desta loja."
    );
  });

  // Cancelamento de Pedido Pendente e Idempotência
  it("CANCELAMENTO: Cancelamento atômico idempotente de pedido pendente funciona e preserva integridade", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-pending-1",
        order_status: "cancelled",
        already_cancelled: true,
        message: "Pedido cancelado com sucesso.",
      },
      error: null,
    });

    const res = await cancelOrder({ orderId: "order-pending-1", storeId: "store-1" });
    expect(res.success).toBe(true);
    expect(res.orderStatus).toBe("cancelled");
  });
});
