import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PublicStore from "@/pages/PublicStore";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase Client
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/logo.png" } }),
        })),
      },
    },
  };
});

describe("PublicStore — R7 Adversarial Audit: Full ThemeCustomConfig Propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-R7.1: Aplica configuração completa (colors, typography, layout, social) gravada no banco", async () => {
    const mockStoreData = {
      id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
      name: "KLEIDICÚ R7 STORE",
      slug: "kleidicu-r7",
      logo_url: null,
      banner_url: null,
      templates: { layout_key: "base-theme" },
    };

    const mockSavedConfig = {
      themeId: "base-theme",
      colors: {
        primary: "#ff0055",
        secondary: "#112233",
        background: "#0a0a0a",
        surface: "#1a1a1a",
        text: "#ffffff",
        textMuted: "#888888",
        border: "#333333",
        accent: "#ff0055",
        accentPromotion: "#ff0055",
        button: "#ff0055",
        buttonText: "#ffffff",
      },
      typography: {
        fontFamily: "Inter",
        headingFontFamily: "Playfair Display",
        headingWeight: "bold",
      },
      layout: {
        borderRadius: "full" as const,
        cardRadius: "3xl" as const,
        cardShadow: "lg" as const,
      },
      social: {
        instagram: "https://instagram.com/kleidicu",
        whatsapp: "5511999999999",
      },
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStoreData, error: null }),
            }),
          }),
        };
      }
      if (table === "store_theme_configs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { config: mockSavedConfig },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: "cat-1", name: "Destaques", slug: "destaques" }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "store_sections") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "sec-1", store_id: mockStoreData.id, section_type: "hero_slider", enabled: true, position: 10, settings: {} },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { id: "prod-1", name: "Bolsa de Luxo", price: 599.9, status: "Ativo", category: "Destaques" },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/store/kleidicu-r7"]}>
        <Routes>
          <Route path="/store/:slug" element={<PublicStore />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector(".storefront-theme-root")).toBeInTheDocument();
    });

    const rootElement = container.querySelector(".storefront-theme-root") as HTMLElement;
    expect(rootElement).toBeInTheDocument();

    // 1. Prova de Cores Personalizadas
    expect(rootElement.style.getPropertyValue("--theme-primary")).toBe("#ff0055");
    expect(rootElement.style.getPropertyValue("--theme-background")).toBe("#0a0a0a");

    // 2. Prova de Tipografia Personalizada (Playfair Display)
    expect(rootElement.style.getPropertyValue("--theme-font-heading")).toContain("Playfair Display");

    // 3. Prova de Layout / Radius Personalizado (borderRadius: "full" -> 9999px)
    expect(rootElement.style.getPropertyValue("--theme-radius")).toBe("9999px");
    expect(rootElement.style.getPropertyValue("--theme-card-shadow")).toContain("0 10px 15px -3px");
  });

  it("REQ-R7.2: Retrocompatibilidade com configuração V1 incompleta (preenche defaults sem erro)", async () => {
    const mockStoreData = {
      id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
      name: "KLEIDICÚ V1 LEGACY",
      slug: "kleidicu-v1",
      logo_url: null,
      banner_url: null,
      templates: { layout_key: "base-theme" },
    };

    // Objeto V1 sem typography e sem layout
    const mockV1Config = {
      themeId: "base-theme",
      colors: {
        primary: "#46ee3a",
        accentPromotion: "#4f4043",
      },
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockStoreData, error: null }),
            }),
          }),
        };
      }
      if (table === "store_theme_configs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { config: mockV1Config },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "store_sections") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/store/kleidicu-v1"]}>
        <Routes>
          <Route path="/store/:slug" element={<PublicStore />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector(".storefront-theme-root")).toBeInTheDocument();
    });

    const rootElement = container.querySelector(".storefront-theme-root") as HTMLElement;
    expect(rootElement).toBeInTheDocument();

    // Cor V1 primária preservada
    expect(rootElement.style.getPropertyValue("--theme-primary")).toBe("#46ee3a");
    expect(rootElement.style.getPropertyValue("--theme-accent-promotion")).toBe("#4f4043");

    // Tipografia e Layout completados com os defaults do base-theme
    expect(rootElement.style.getPropertyValue("--theme-font-heading")).toContain("Plus Jakarta Sans");
    expect(rootElement.style.getPropertyValue("--theme-radius")).toBe("9999px");
  });
});
