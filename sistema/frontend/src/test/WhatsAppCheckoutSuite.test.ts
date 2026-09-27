import { describe, it, expect } from "vitest";
import {
  formatWhatsAppNumber,
  buildWhatsAppLink,
  buildCartWhatsAppMessage,
  buildOrderWhatsAppMessage,
} from "@/utils/whatsapp";

describe("WhatsApp Module & Multi-Tenant Checkout Security Suite", () => {
  // 1. Número formatado corretamente
  describe("1. formatWhatsAppNumber Normalization & Validation", () => {
    it("normalizes 11-digit Brazilian mobile numbers with DDD by prepending country code 55", () => {
      expect(formatWhatsAppNumber("11987654321")).toBe("5511987654321");
      expect(formatWhatsAppNumber("(11) 98765-4321")).toBe("5511987654321");
      expect(formatWhatsAppNumber("11 98765-4321")).toBe("5511987654321");
    });

    it("normalizes 10-digit Brazilian landline numbers with DDD by prepending 55", () => {
      expect(formatWhatsAppNumber("1133334444")).toBe("551133334444");
      expect(formatWhatsAppNumber("(11) 3333-4444")).toBe("551133334444");
    });

    it("keeps already prefixed Brazilian country code numbers", () => {
      expect(formatWhatsAppNumber("5511987654321")).toBe("5511987654321");
      expect(formatWhatsAppNumber("+55 (11) 98765-4321")).toBe("5511987654321");
      expect(formatWhatsAppNumber("+55 11 98765-4321")).toBe("5511987654321");
    });

    it("supports international numbers within E.164 limits (10 to 15 digits)", () => {
      expect(formatWhatsAppNumber("+1 202 555 0123")).toBe("12025550123");
      expect(formatWhatsAppNumber("+44 20 7946 0958")).toBe("442079460958");
    });

    it("returns null for invalid, incomplete, or empty numbers", () => {
      expect(formatWhatsAppNumber("")).toBeNull();
      expect(formatWhatsAppNumber(null)).toBeNull();
      expect(formatWhatsAppNumber(undefined)).toBeNull();
      expect(formatWhatsAppNumber("   ")).toBeNull();
      expect(formatWhatsAppNumber("123")).toBeNull();
      expect(formatWhatsAppNumber("123456789")).toBeNull(); // Less than 10 digits
      expect(formatWhatsAppNumber("abcdefghijk")).toBeNull();
      expect(formatWhatsAppNumber("!@#$%^&*()")).toBeNull();
      expect(formatWhatsAppNumber("55119999999999999999999")).toBeNull(); // > 15 digits
    });
  });

  // 2. buildWhatsAppLink URL Generation
  describe("2. buildWhatsAppLink URL Generation & Encoding", () => {
    it("generates wa.me link with only phone when no message is provided", () => {
      const link = buildWhatsAppLink({ phone: "(11) 98765-4321" });
      expect(link).toBe("https://wa.me/5511987654321");
    });

    it("generates wa.me link with encoded text query parameter", () => {
      const link = buildWhatsAppLink({
        phone: "5511987654321",
        message: "Olá! Quero tirar uma dúvida.",
      });
      expect(link).toBe("https://wa.me/5511987654321?text=Ol%C3%A1!%20Quero%20tirar%20uma%20d%C3%BAvida.");
    });

    it("returns null if phone number is invalid or not configured", () => {
      expect(buildWhatsAppLink({ phone: null, message: "Teste" })).toBeNull();
      expect(buildWhatsAppLink({ phone: "", message: "Teste" })).toBeNull();
      expect(buildWhatsAppLink({ phone: "invalid", message: "Teste" })).toBeNull();
    });

    it("properly encodes multiline messages, symbols, and line breaks", () => {
      const link = buildWhatsAppLink({
        phone: "11987654321",
        message: "Linha 1\nLinha 2 & Símbolos: R$ 100,00",
      });
      expect(link).toBe("https://wa.me/5511987654321?text=Linha%201%0ALinha%202%20%26%20S%C3%ADmbolos%3A%20R%24%20100%2C00");
    });
  });

  // 3. buildCartWhatsAppMessage Context Contract
  describe("3. buildCartWhatsAppMessage Context & Contract", () => {
    it("generates structured cart summary following social commerce spec", () => {
      const message = buildCartWhatsAppMessage({
        storeName: "Aura Maison",
        items: [
          { name: "Vestido Midi Seda", quantity: 1, price: 1290.0 },
          { name: "Bolsa Couro Legítimo", quantity: 2, price: 890.0 },
        ],
        subtotal: 3070.0,
        shipping: 25.0,
        discount: 100.0,
        couponCode: "PROMO100",
      });

      expect(message).toContain("Aura Maison");
      expect(message).toContain("1x Vestido Midi Seda (R$ 1290,00)");
      expect(message).toContain("2x Bolsa Couro Legítimo (R$ 890,00)");
      expect(message).toContain("Subtotal: R$ 3070,00");
      expect(message).toContain("Frete: R$ 25,00");
      expect(message).toContain("Cupom (PROMO100): -R$ 100,00");
      expect(message).toContain("Total: R$ 2995,00");
    });

    it("omits shipping line when shipping is 0 (digital goods / free shipping)", () => {
      const message = buildCartWhatsAppMessage({
        storeName: "Digital Store",
        items: [{ name: "E-book Growth", quantity: 1, price: 49.9, product_type: "digital" }],
        subtotal: 49.9,
        shipping: 0,
      });

      expect(message).not.toContain("Frete:");
      expect(message).toContain("Total: R$ 49,90");
    });

    it("omits coupon line when no discount is applied", () => {
      const message = buildCartWhatsAppMessage({
        storeName: "Tech Store",
        items: [{ name: "Mouse Sem Fio", quantity: 1, price: 99.0 }],
        subtotal: 99.0,
        shipping: 15.0,
      });

      expect(message).not.toContain("Cupom");
      expect(message).toContain("Frete: R$ 15,00");
      expect(message).toContain("Total: R$ 114,00");
    });
  });

  // 4. buildOrderWhatsAppMessage Context Contract
  describe("4. buildOrderWhatsAppMessage Context & Contract", () => {
    it("generates order tracking message with order ID prefix and payment method", () => {
      const message = buildOrderWhatsAppMessage({
        storeName: "Jo Perfumes",
        orderId: "e9a8b7c6-1234-5678-90ab-cdef12345678",
        totalAmount: 189.9,
        paymentMethod: "pix",
      });

      expect(message).toContain("Jo Perfumes");
      expect(message).toContain("#e9a8b7c6");
      expect(message).toContain("Total: R$ 189,90");
      expect(message).toContain("Pix");
      expect(message).toContain("status");
    });

    it("handles short order IDs gracefully", () => {
      const message = buildOrderWhatsAppMessage({
        storeName: "Aurea Joalheria",
        orderId: "AM-10492",
        totalAmount: 2500.0,
        paymentMethod: "credit_card",
      });

      expect(message).toContain("#AM-10492");
      expect(message).toContain("Cartão de Crédito");
      expect(message).toContain("R$ 2500,00");
    });
  });

  // 5. Multi-Tenant Isolation & Zero Leakage
  describe("5. Multi-Tenant Isolation & Zero Secret Exposure", () => {
    it("guarantees strict store separation between Tenant A and Tenant B", () => {
      const storeA = {
        name: "Tenant A Store",
        whatsapp: "5511999990001",
      };
      const storeB = {
        name: "Tenant B Store",
        whatsapp: "5521999990002",
      };
      const storeCWithoutWhatsApp = {
        name: "Tenant C Store",
        whatsapp: null,
      };

      const linkA = buildWhatsAppLink({
        phone: storeA.whatsapp,
        message: buildCartWhatsAppMessage({
          storeName: storeA.name,
          items: [{ name: "Item A", quantity: 1, price: 100 }],
          subtotal: 100,
        }),
      });

      const linkB = buildWhatsAppLink({
        phone: storeB.whatsapp,
        message: buildCartWhatsAppMessage({
          storeName: storeB.name,
          items: [{ name: "Item B", quantity: 1, price: 200 }],
          subtotal: 200,
        }),
      });

      const linkC = buildWhatsAppLink({
        phone: storeCWithoutWhatsApp.whatsapp,
        message: "Any message",
      });

      expect(linkA).toContain("5511999990001");
      expect(linkA).not.toContain("5521999990002");
      expect(linkA).toContain("Tenant%20A%20Store");

      expect(linkB).toContain("5521999990002");
      expect(linkB).not.toContain("5511999990001");
      expect(linkB).toContain("Tenant%20B%20Store");

      expect(linkC).toBeNull();
    });

    it("guarantees that no internal tokens, API keys, or sensitive customer passwords are in the message", () => {
      const message = buildOrderWhatsAppMessage({
        storeName: "Secure Store",
        orderId: "12345678-uuid",
        totalAmount: 150.0,
        paymentMethod: "pix",
      });

      expect(message).not.toContain("token");
      expect(message).not.toContain("secret");
      expect(message).not.toContain("mp_access_token");
      expect(message).not.toContain("password");
      expect(message).not.toContain("cpf");
    });
  });
});
