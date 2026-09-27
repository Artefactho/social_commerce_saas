/**
 * WhatsApp Utility & URL Generator for Multi-Tenant Social Commerce.
 *
 * Implements strict sanitization, normalization, and context-rich message formatting
 * adhering to E.164 and WhatsApp wa.me specifications without leaking sensitive tenant data.
 */

export interface CartItemSummary {
  name: string;
  quantity: number;
  price: number;
  product_type?: 'physical' | 'digital';
}

export interface BuildCartWhatsAppMessageParams {
  storeName: string;
  items: CartItemSummary[];
  subtotal: number;
  shipping?: number;
  discount?: number;
  couponCode?: string;
}

export interface BuildOrderWhatsAppMessageParams {
  storeName: string;
  orderId: string;
  totalAmount: number;
  paymentMethod?: string;
}

/**
 * Sanitizes and normalizes phone numbers for WhatsApp wa.me links.
 * 
 * Rules:
 * - Strips all non-digit characters.
 * - Standard Brazilian phones have 10 digits (fixed/old) or 11 digits (mobile with DDD).
 *   If length is 10 or 11 and does not start with '55', prepends Brazil country code '55'.
 * - If length is 12 or 13 and starts with '55', keeps as is.
 * - Minimum valid length is 10 digits; maximum valid length is 15 digits (E.164).
 * - If invalid or empty, returns null to trigger safe graceful fallback.
 */
export function formatWhatsAppNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;

  const trimmed = phone.trim();
  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  // Brazilian DDD + Number (10 or 11 digits) without country code and without '+'
  if (!hasPlusPrefix && (digits.length === 10 || digits.length === 11)) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Generates a valid wa.me URL for the specified phone number and optional message.
 * Returns null if the phone number cannot be formatted safely.
 */
export function buildWhatsAppLink(options: {
  phone?: string | null;
  message?: string | null;
}): string | null {
  const formattedPhone = formatWhatsAppNumber(options.phone);
  if (!formattedPhone) return null;

  const trimmedMessage = options.message?.trim();
  if (trimmedMessage) {
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(trimmedMessage)}`;
  }

  return `https://wa.me/${formattedPhone}`;
}

/**
 * Constructs a structured WhatsApp message for cart / pre-order inquiry.
 */
export function buildCartWhatsAppMessage(params: BuildCartWhatsAppMessageParams): string {
  const { storeName, items, subtotal, shipping = 0, discount = 0, couponCode } = params;

  const itemsList = items
    .map((item) => `• ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2).replace('.', ',')})`)
    .join('\n');

  const total = Math.max(subtotal + shipping - discount, 0);

  let message = `Olá! Gostaria de tirar uma dúvida sobre meu pedido na loja *${storeName.trim()}*:\n\n`;
  message += `*Itens do Carrinho:*\n${itemsList}\n\n`;
  message += `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;

  if (shipping > 0) {
    message += `Frete: R$ ${shipping.toFixed(2).replace('.', ',')}\n`;
  }

  if (discount > 0 && couponCode) {
    message += `Cupom (${couponCode.trim()}): -R$ ${discount.toFixed(2).replace('.', ',')}\n`;
  }

  message += `*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;

  return message;
}

/**
 * Constructs a structured WhatsApp message for an existing order / payment follow-up.
 */
export function buildOrderWhatsAppMessage(params: BuildOrderWhatsAppMessageParams): string {
  const { storeName, orderId, totalAmount, paymentMethod = 'pix' } = params;
  const shortOrderId = orderId.length > 8 ? orderId.substring(0, 8) : orderId;
  const methodLabel = paymentMethod.toLowerCase() === 'pix' ? 'Pix' : 'Cartão de Crédito';

  return `Olá! Gostaria de acompanhar o meu pedido *#${shortOrderId}* na loja *${storeName.trim()}*.\n` +
    `Total: R$ ${totalAmount.toFixed(2).replace('.', ',')} (${methodLabel})\n` +
    `Poderiam me informar o status?`;
}
