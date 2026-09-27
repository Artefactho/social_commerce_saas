import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSecureOrder, CreateOrderRequest } from "@/services/order/OrderService";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase Client para testes unitários de interface e contrato
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

describe("Fase 4.1: Commerce Hardening — Contratos, RPC Transacional e Customer Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-CH01 [Transação Única & Customer]: Retorna pedido e customer_id resolvidos na transação", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-uuid-999",
        customer_id: "cust-uuid-456",
        subtotal: 100.0,
        discount: 10.0,
        shipping: 15.0,
        total_amount: 105.0,
        payment: { method: "pix", status: "pending", pix_qr_code: "pix-code" },
      },
      error: null,
    });

    const request: CreateOrderRequest = {
      storeId: "store-uuid-1",
      customer: {
        name: "Maria Silva",
        email: "maria@teste.com",
        phone: "11988887777",
        address: "Rua das Flores, 100",
        zip: "01001-000",
      },
      items: [{ productId: "prod-físico-1", quantity: 1 }],
      couponCode: "DESC10",
      paymentMethod: "pix",
    };

    const res = await createSecureOrder(request);

    expect(res.success).toBe(true);
    expect(res.orderId).toBe("order-uuid-999");
    expect(res.customerId).toBe("cust-uuid-456");
    expect(res.totalAmount).toBe(105.0);
  });

  it("REQ-CH02 [Erro do Servidor]: Rejeita pedido quando o PostgreSQL emite exceção de estoque insuficiente", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Estoque insuficiente para o produto "Vestido de Seda". Disponível: 1, Solicitado: 3.',
        context: {
          json: async () => ({
            error: 'Estoque insuficiente para o produto "Vestido de Seda". Disponível: 1, Solicitado: 3.',
          }),
        },
      },
    });

    const request: CreateOrderRequest = {
      storeId: "store-uuid-1",
      customer: {
        name: "Carlos Comprador",
        email: "carlos@teste.com",
        address: "Av Central, 50",
      },
      items: [{ productId: "prod-vestido", quantity: 3 }],
    };

    await expect(createSecureOrder(request)).rejects.toThrow(
      'Estoque insuficiente para o produto "Vestido de Seda". Disponível: 1, Solicitado: 3.'
    );
  });

  it("REQ-CH03 [Proteção de Frontend]: OrderService NUNCA realiza chamadas de INSERT direto no banco", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-123",
        total_amount: 50.0,
      },
      error: null,
    });

    await createSecureOrder({
      storeId: "store-1",
      customer: { name: "Test", email: "test@test.com", address: "Rua 1" },
      items: [{ productId: "prod-1", quantity: 1 }],
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });
});
