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
    try {
      const { data, error } = await supabase.functions.invoke(`mercadopago-connection-status?store_id=${encodeURIComponent(storeId)}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!error && data) {
        return {
          connected: data.connected ?? false,
          provider: data.provider || "mercadopago",
          status: data.status || "inactive",
          providerUserId: data.provider_user_id,
          publicKey: data.public_key,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback abaixo
    }

    // Fallback seguro via RLS no banco de dados (leitura não-sensível da conexão)
    try {
      const { data: conn } = await supabase
        .from("store_payment_connections")
        .select("provider, status, provider_user_id, public_key, updated_at")
        .eq("store_id", storeId)
        .maybeSingle();

      if (conn && conn.status === "active") {
        return {
          connected: true,
          provider: conn.provider || "mercadopago",
          status: conn.status as any,
          providerUserId: conn.provider_user_id || undefined,
          publicKey: conn.public_key || undefined,
          updatedAt: conn.updated_at,
        };
      }
    } catch {
      // Fallback final
    }

    return {
      connected: false,
      provider: "mercadopago",
      status: "inactive",
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
