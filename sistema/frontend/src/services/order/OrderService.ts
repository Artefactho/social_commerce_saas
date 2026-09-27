import { supabase } from "@/integrations/supabase/client";

export interface OrderCustomerInfo {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address: string;
  zip?: string;
}

export interface CreateOrderRequest {
  storeId: string;
  customer: OrderCustomerInfo;
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  paymentMethod?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  customerId?: string;
  storeSlug?: string;
  totalAmount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment?: {
    method: string;
    status: string;
    providerPaymentId?: string;
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    ticketUrl?: string;
    expiresAt?: string;
  };
}

export async function createSecureOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  // Chamada exclusiva à Edge Function autoritativa 'create-order'
  // O cliente NUNCA tem permissão de calcular totais ou fazer INSERT direto em 'orders'
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke("create-order", {
    body: {
      store_id: req.storeId,
      customer_name: req.customer.name,
      customer_email: req.customer.email,
      customer_phone: req.customer.phone,
      customer_cpf: req.customer.cpf,
      shipping_address: req.customer.address,
      shipping_zip: req.customer.zip,
      items: req.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      coupon_code: req.couponCode,
      payment_method: req.paymentMethod || "pix",
    },
  });

  if (edgeError) {
    let serverMessage = edgeError.message || "Falha ao processar pedido no servidor.";
    if (edgeError.context && typeof edgeError.context.json === "function") {
      try {
        const errJson = await edgeError.context.json();
        if (errJson?.error) {
          serverMessage = errJson.error;
        }
      } catch {
        // Fallback
      }
    }
    throw new Error(serverMessage);
  }

  if (!edgeData || !edgeData.success) {
    throw new Error(edgeData?.error || "Resposta inválida do servidor ao criar pedido.");
  }

  return {
    success: true,
    orderId: edgeData.order_id,
    customerId: edgeData.customer_id,
    storeSlug: edgeData.store_slug,
    totalAmount: edgeData.total_amount,
    subtotal: edgeData.subtotal,
    discount: edgeData.discount,
    shipping: edgeData.shipping,
    payment: edgeData.payment
      ? {
          method: edgeData.payment.method,
          status: edgeData.payment.status,
          providerPaymentId: edgeData.payment.provider_payment_id,
          pixQrCodeBase64: edgeData.payment.pix_qr_code_base64,
          pixCopyPaste: edgeData.payment.pix_copy_paste,
          ticketUrl: edgeData.payment.ticket_url,
          expiresAt: edgeData.payment.expires_at,
        }
      : undefined,
  };
}

export interface CancelOrderRequest {
  orderId: string;
  storeId: string;
  reason?: string;
}

export interface CancelOrderResponse {
  success: boolean;
  orderId: string;
  orderStatus: string;
  message?: string;
}

export async function cancelOrder(req: CancelOrderRequest): Promise<CancelOrderResponse> {
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke("mercadopago-cancel-order", {
    body: {
      order_id: req.orderId,
      store_id: req.storeId,
      reason: req.reason || "Cancelamento solicitado pelo lojista",
    },
  });

  if (edgeError) {
    let serverMessage = edgeError.message || "Erro ao cancelar pedido.";
    if (edgeError.context && typeof edgeError.context.json === "function") {
      try {
        const errJson = await edgeError.context.json();
        if (errJson?.error) serverMessage = errJson.error;
      } catch {
        // Fallback
      }
    }
    throw new Error(serverMessage);
  }

  if (!edgeData || !edgeData.success) {
    throw new Error(edgeData?.error || "Falha ao processar cancelamento do pedido.");
  }

  return {
    success: true,
    orderId: edgeData.order_id,
    orderStatus: edgeData.order_status,
    message: edgeData.message,
  };
}

export interface RefundOrderRequest {
  orderId: string;
  storeId: string;
  reason?: string;
}

export interface RefundOrderResponse {
  success: boolean;
  orderId: string;
  orderStatus: string;
  transactionStatus: string;
  refundId?: string;
  amount?: number;
  message?: string;
}

export async function refundOrder(req: RefundOrderRequest): Promise<RefundOrderResponse> {
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke("mercadopago-refund-order", {
    body: {
      order_id: req.orderId,
      store_id: req.storeId,
      reason: req.reason || "Reembolso solicitado pelo lojista",
    },
  });

  if (edgeError) {
    let serverMessage = edgeError.message || "Erro ao processar estorno do pedido.";
    if (edgeError.context && typeof edgeError.context.json === "function") {
      try {
        const errJson = await edgeError.context.json();
        if (errJson?.error) serverMessage = errJson.error;
      } catch {
        // Fallback
      }
    }
    throw new Error(serverMessage);
  }

  if (!edgeData || !edgeData.success) {
    throw new Error(edgeData?.error || "Falha ao estornar pedido no Mercado Pago.");
  }

  return {
    success: true,
    orderId: edgeData.order_id,
    orderStatus: edgeData.order_status || "cancelled",
    transactionStatus: edgeData.transaction_status || "refunded",
    refundId: edgeData.refund_id,
    amount: edgeData.amount,
    message: edgeData.message,
  };
}

