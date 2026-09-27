import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Checkout from "@/pages/Checkout";
import { resolveThemeComponent } from "@/features/theme/ThemeRegistry";
import { StoreInfo, StorefrontThemeProps } from "@/types/theme";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/logo.png" } }),
        })),
      },
      functions: {
        invoke: vi.fn(),
      },
    },
  };
});

// Mock Zustand Cart Hook
vi.mock("@/hooks/useCart", () => {
  return {
    useCart: vi.fn(),
  };
});

describe("WhatsApp Checkout & Storefront Decoupled DOM Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCart as any).mockReturnValue({
      items: [],
      getItemCount: () => 0,
      addItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      getSubtotal: () => 0,
      storeSlug: "loja-teste",
      clearCart: vi.fn(),
    });
  });

  it("1. Checkout with WhatsApp Configured: Displays 'Finalizar ou Tirar Dúvidas no WhatsApp' button", async () => {
    (useCart as any).mockReturnValue({
      items: [
        {
          product: {
            id: "prod-1",
            name: "Perfume Exclusivo",
            price: 250.0,
            product_type: "physical",
            images: ["https://example.com/p1.jpg"],
          },
          quantity: 2,
        },
      ],
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      getSubtotal: () => 500.0,
      storeSlug: "loja-com-whatsapp",
      clearCart: vi.fn(),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "store-123",
                  name: "Loja VIP Cosméticos",
                  slug: "loja-com-whatsapp",
                  shipping_fee: 20.0,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "store_theme_configs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  config: {
                    social: {
                      whatsapp: "11988887777",
                      whatsappMessage: "Olá!",
                    },
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      };
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // Wait for store details and theme config to load
    await waitFor(() => {
      const whatsappBtn = document.getElementById("whatsapp-checkout-support-btn");
      expect(whatsappBtn).toBeInTheDocument();
      expect(whatsappBtn?.getAttribute("href")).toContain("https://wa.me/5511988887777");
      expect(whatsappBtn?.getAttribute("href")).toContain("Loja%20VIP%20Cosm%C3%A9ticos");
      expect(whatsappBtn?.getAttribute("href")).toContain("Perfume%20Exclusivo");
    });
  });

  it("2. Checkout WITHOUT WhatsApp Configured: Does NOT render WhatsApp button and keeps checkout functioning", async () => {
    (useCart as any).mockReturnValue({
      items: [
        {
          product: {
            id: "prod-2",
            name: "Curso Online",
            price: 99.0,
            product_type: "digital",
            images: ["https://example.com/p2.jpg"],
          },
          quantity: 1,
        },
      ],
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      getSubtotal: () => 99.0,
      storeSlug: "loja-sem-whatsapp",
      clearCart: vi.fn(),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "store-456",
                  name: "Loja Sem WhatsApp",
                  slug: "loja-sem-whatsapp",
                  shipping_fee: 0,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "store_theme_configs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  config: {
                    social: {
                      whatsapp: "",
                    },
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      };
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    // Ensure checkout renders standard elements without crashing
    expect(screen.getByText("Seu Carrinho")).toBeInTheDocument();
    expect(screen.getByText("IR PARA ENTREGA")).toBeInTheDocument();

    await waitFor(() => {
      const whatsappBtn = document.getElementById("whatsapp-checkout-support-btn");
      expect(whatsappBtn).not.toBeInTheDocument();
    });
  });

  it("3. Theme Deserialization & Independence: Resolving different themes maintains store.whatsapp contract", () => {
    const storeWithWhatsApp: StoreInfo = {
      id: "store-789",
      name: "Streetwear Brasil",
      slug: "streetwear-brasil",
      logo_url: null,
      banner_url: null,
      whatsapp: "5511999990000",
    };

    const storeWithoutWhatsApp: StoreInfo = {
      id: "store-000",
      name: "Minimal Shop",
      slug: "minimal-shop",
      logo_url: null,
      banner_url: null,
      whatsapp: null,
    };

    const themes = ["base-theme", "aura-maison", "aurea-joalheria", "jo-perfumes", "minimal-clean"];

    themes.forEach((themeKey) => {
      const Component = resolveThemeComponent(themeKey);
      expect(Component).toBeDefined();

      // Render theme with WhatsApp
      const { unmount: unmountA } = render(
        <MemoryRouter>
          <Component
            store={storeWithWhatsApp}
            categories={[]}
            products={[]}
          />
        </MemoryRouter>
      );
      unmountA();

      // Render theme without WhatsApp (graceful fallback check)
      const { unmount: unmountB } = render(
        <MemoryRouter>
          <Component
            store={storeWithoutWhatsApp}
            categories={[]}
            products={[]}
          />
        </MemoryRouter>
      );
      unmountB();
    });
  });
});
