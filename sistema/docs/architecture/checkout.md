# Checkout & Pagamentos — Especificação Oficial

> **Status:** Especificação Oficial  
> **Responsabilidade:** Orquestração do funil de checkout, cálculo e validação segura de valores no servidor, integração com gateways de pagamento intercambiáveis e webhooks.

---

## 1. Fluxo de Execução Seguro

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. FRONTEND CHECKOUT                             │
│  Envia apenas: { items: [{ productId, quantity }], couponCode, shippingZip }│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /functions/v1/create-order
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    2. SUPABASE EDGE FUNCTION / BACKEND                      │
│  • Busca preços reais no banco (public.products)                            │
│  • Valida estoque                                                           │
│  • Valida e aplica desconto do cupom (public.coupons)                       │
│  • Calcula frete oficial                                                    │
│  • Grava pedido com status: 'pending' (public.orders)                       │
│  • Chama PaymentProvider configurado para a loja                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     3. PAYMENT PROVIDER (Intercambiável)                    │
│                 Mercado Pago · Asaas · Stripe · Pagar.me                    │
│  • Retorna: { paymentId, pixQrCode, pixCopyPaste, checkoutUrl }             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     4. WEBHOOK HANDLER (Edge Function)                      │
│  • Recebe notificação de pagamento confirmado do gateway                    │
│  • Atualiza pedido para status: 'paid' no banco                             │
│  • Dispara notificação WhatsApp/E-mail para lojista e comprador             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contrato da Abstração de Pagamentos (`PaymentProvider`)

```typescript
export interface PaymentIntentInput {
  orderId: string;
  storeId: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
  };
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  cardDetails?: {
    token: string;
    installments: number;
  };
}

export interface PaymentIntentResult {
  providerPaymentId: string;
  status: 'pending' | 'approved' | 'rejected';
  pix?: {
    qrCodeBase64: string;
    qrCodeCopyPaste: string;
    expiresAt: string;
  };
  checkoutUrl?: string;
}

export interface IPaymentProvider {
  createPayment(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  handleWebhook(payload: any, signature: string): Promise<{ orderId: string; status: 'paid' | 'failed' }>;
  refundPayment(providerPaymentId: string): Promise<boolean>;
}
```
