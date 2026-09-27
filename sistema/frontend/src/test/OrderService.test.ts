import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSecureOrder, CreateOrderRequest } from "@/services/order/OrderService";
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

describe("OrderService Security & Server Authority Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-01: Checkout chama a Edge Function 'create-order' com os parâmetros autoritativos", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "order-uuid-123",
        total_amount: 250.0,
        subtotal: 230.0,
        discount: 0,
        shipping: 20.0,
        payment: {
          method: "pix",
          status: "pending",
          provider_payment_id: "12345678",
          pix_qr_code_base64: "data:image/png;base64,sample",
          pix_copy_paste: "00020126580014br.gov.bcb.pix...",
          expires_at: "2026-09-27T12:00:00Z",
        },
      },
      error: null,
    });

    const request: CreateOrderRequest = {
      storeId: "store-uuid-abc",
      customer: {
        name: "Comprador Visitante",
        email: "visitante@teste.com",
        phone: "11999999999",
        address: "Rua do Comércio, 123",
        zip: "01001-000",
      },
      items: [{ productId: "prod-1", quantity: 2 }],
      couponCode: "PROMO10",
      paymentMethod: "pix",
    };

    const res = await createSecureOrder(request);

    // 1. Validar chamada da Edge Function
    expect(supabase.functions.invoke).toHaveBeenCalledWith("create-order", {
      body: {
        store_id: "store-uuid-abc",
        customer_name: "Comprador Visitante",
        customer_email: "visitante@teste.com",
        customer_phone: "11999999999",
        customer_cpf: undefined,
        shipping_address: "Rua do Comércio, 123",
        shipping_zip: "01001-000",
        items: [{ product_id: "prod-1", quantity: 2 }],
        coupon_code: "PROMO10",
        payment_method: "pix",
      },
    });

    // 2. Validar que o payload NÃO contém campos de total ou preço arbitrário do cliente
    const invokeCallBody = (supabase.functions.invoke as any).mock.calls[0][1].body;
    expect(invokeCallBody.total_amount).toBeUndefined();
    expect(invokeCallBody.subtotal).toBeUndefined();
    expect(invokeCallBody.price).toBeUndefined();
    expect(invokeCallBody.items[0].price).toBeUndefined();

    // 3. Validar retorno com dados reais do Pix
    expect(res.success).toBe(true);
    expect(res.orderId).toBe("order-uuid-123");
    expect(res.totalAmount).toBe(250.0);
    expect(res.payment?.pixQrCodeBase64).toBe("data:image/png;base64,sample");
    expect(res.payment?.pixCopyPaste).toBe("00020126580014br.gov.bcb.pix...");
    expect(res.payment?.providerPaymentId).toBe("12345678");
  });

  it("REQ-06: Falha da Edge Function NUNCA realiza INSERT direto no banco via browser", async () => {
    // Simular falha da Edge Function (ex: erro 400 ou 500)
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: {
        message: "O produto não está disponível para venda no momento.",
        context: {
          json: async () => ({ error: "O produto não está disponível para venda no momento." }),
        },
      },
    });

    const request: CreateOrderRequest = {
      storeId: "store-123",
      customer: {
        name: "Visitante",
        email: "visitante@test.com",
        address: "Rua 1",
      },
      items: [{ productId: "prod-inativo", quantity: 1 }],
    };

    // Deve lançar erro e NUNCA chamar supabase.from("orders").insert
    await expect(createSecureOrder(request)).rejects.toThrow(
      "O produto não está disponível para venda no momento."
    );

    // Comprovar que o fallback inseguro foi eliminado
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("REQ-07: Resposta de erro do servidor ao validar loja ou produto é repassada com segurança", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { error: "Loja não encontrada ou inativa." },
      error: null,
    });

    const request: CreateOrderRequest = {
      storeId: "store-fake",
      customer: {
        name: "Visitante",
        email: "visitante@test.com",
        address: "Rua 1",
      },
      items: [{ productId: "prod-1", quantity: 1 }],
    };

    await expect(createSecureOrder(request)).rejects.toThrow("Loja não encontrada ou inativa.");
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
