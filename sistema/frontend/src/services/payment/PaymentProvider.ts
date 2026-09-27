import { supabase } from "@/integrations/supabase/client";

export interface PaymentIntentInput {
  orderId: string;
  storeId: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
  };
  paymentMethod: "pix" | "credit_card" | "boleto";
}

export interface PaymentIntentResult {
  providerPaymentId?: string;
  status: "initializing" | "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded" | "failed";
  pix?: {
    qrCodeBase64?: string;
    qrCodeCopyPaste?: string;
    ticketUrl?: string;
    expiresAt?: string;
  };
  checkoutUrl?: string;
  error?: string;
}

export interface StorePaymentConnectionStatus {
  connected: boolean;
  provider: string;
  status: "active" | "inactive" | "revoked" | "expired";
  providerUserId?: string;
  publicKey?: string;
  updatedAt?: string;
}

export interface IPaymentService {
  name: string;
  checkOrderStatus(orderId: string): Promise<{ orderId: string; status: string; isPaid: boolean; paidAt?: string }>;
  getStoreConnectionStatus(storeId: string): Promise<StorePaymentConnectionStatus>;
  connectMercadoPago(storeId: string): Promise<{ url: string; state: string }>;
}

export class MercadoPagoRealPaymentService implements IPaymentService {
  name = "MercadoPago";

  async checkOrderStatus(orderId: string): Promise<{ orderId: string; status: string; isPaid: boolean; paidAt?: string }> {
    const { data, error } = await supabase.functions.invoke("check-order-status", {
      headers: { "Content-Type": "application/json" },
      body: {}, // GET parameter handled via query string or function invocation
    });

    if (error || !data) {
      // Fallback via consulta segura no banco
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      return {
        orderId,
        status: orderData?.status || "pending",
        isPaid: orderData?.status === "paid",
      };
    }

    return {
      orderId: data.order_id,
      status: data.order_status,
      isPaid: data.is_paid,
      paidAt: data.paid_at,
    };
  }

  async getStoreConnectionStatus(storeId: string): Promise<StorePaymentConnectionStatus> {
    const { data, error } = await supabase.functions.invoke("mercadopago-connection-status", {
      headers: { "Content-Type": "application/json" },
    });

    if (error || !data) {
      return {
        connected: false,
        provider: "mercadopago",
        status: "inactive",
      };
    }

    return {
      connected: data.connected,
      provider: data.provider,
      status: data.status,
      providerUserId: data.provider_user_id,
      publicKey: data.public_key,
      updatedAt: data.updated_at,
    };
  }

  async connectMercadoPago(storeId: string): Promise<{ url: string; state: string }> {
    const { data, error } = await supabase.functions.invoke("mercadopago-connect", {
      body: { store_id: storeId },
    });

    if (error || !data || !data.url) {
      throw new Error(data?.error || error?.message || "Falha ao iniciar conexão com Mercado Pago.");
    }

    return {
      url: data.url,
      state: data.state,
    };
  }
}

export const activePaymentService: IPaymentService = new MercadoPagoRealPaymentService();
