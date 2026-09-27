import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { VisualStoreEditor } from "@/features/theme/VisualStoreEditor";
import { supabase } from "@/integrations/supabase/client";
import { getThemeDefaults } from "@/features/theme/ThemeRegistry";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => {
  const updateStoreMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  const updateThemeMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "stores") {
          return { update: updateStoreMock };
        }
        if (table === "store_theme_configs") {
          return { update: updateThemeMock };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/logo.png" } }),
          upload: vi.fn().mockResolvedValue({ data: { path: "logo.png" }, error: null }),
        })),
      },
    },
  };
});

describe("VisualStoreEditor — V2 Visual Customizer & Live Preview", () => {
  const mockStore = {
    id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    name: "KLEIDICÚ",
    slug: "kleidicú",
    logo_url: "0746a11e-0bfd-4f33-82cd-7c07393ee663/logo/cfqmv0j5zvq.png",
    banner_url: null,
    templates: { layout_key: "base-theme" },
  };

  const mockThemeConfig = {
    id: "cfg-123",
    store_id: mockStore.id,
    config: getThemeDefaults("base-theme"),
  };

  const mockSections = [
    { id: "s1", store_id: mockStore.id, section_type: "hero_slider" as const, enabled: true, position: 10, settings: {} },
    { id: "s2", store_id: mockStore.id, section_type: "benefits_bar" as const, enabled: true, position: 20, settings: {} },
  ];

  const mockProducts = [
    {
      id: "p1",
      name: "Vestido Floral Luxo",
      slug: "vestido-floral-luxo",
      collection: "Vestidos",
      price: 299.9,
      description: "Vestido elegante",
      images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80"],
      product_type: "physical" as const,
    },
  ];

  const mockCategories = [{ id: "c1", name: "Vestidos", slug: "vestidos" }];

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it("1. Renderiza o painel de categorias e o Live Preview simultaneamente", () => {
    render(
      <BrowserRouter>
        <VisualStoreEditor
          store={mockStore}
          themeConfig={mockThemeConfig}
          storeSections={mockSections}
          products={mockProducts}
          categories={mockCategories}
        />
      </BrowserRouter>
    );

    // Categorias de controles
    expect(screen.getByText("Identidade")).toBeInTheDocument();
    expect(screen.getByText("Cores")).toBeInTheDocument();
    expect(screen.getByText("Tipografia")).toBeInTheDocument();
    expect(screen.getByText("Estilos")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();

    // Live Preview
    expect(screen.getByText("Live Preview em Tempo Real")).toBeInTheDocument();
    expect(screen.getByTestId("preview-desktop-root")).toBeInTheDocument();
  });

  it("2. Alterna visualização do Live Preview entre Desktop e Mobile (375px)", () => {
    render(
      <BrowserRouter>
        <VisualStoreEditor
          store={mockStore}
          themeConfig={mockThemeConfig}
          storeSections={mockSections}
          products={mockProducts}
          categories={mockCategories}
        />
      </BrowserRouter>
    );

    // Inicia em Desktop
    expect(screen.getByTestId("preview-desktop-root")).toBeInTheDocument();

    // Clica para alternar para Mobile
    const mobileBtn = screen.getByTitle("Visualização Mobile (375px)");
    fireEvent.click(mobileBtn);

    expect(screen.getByTestId("preview-mobile-root")).toBeInTheDocument();
    expect(screen.queryByTestId("preview-desktop-root")).not.toBeInTheDocument();
  });

  it("3. Estado Local: Alteração de cor atualiza preview instantaneamente sem chamar o Supabase", () => {
    render(
      <BrowserRouter>
        <VisualStoreEditor
          store={mockStore}
          themeConfig={mockThemeConfig}
          storeSections={mockSections}
          products={mockProducts}
          categories={mockCategories}
        />
      </BrowserRouter>
    );

    // Navega para aba Cores
    const coresTab = screen.getByText("Cores");
    fireEvent.click(coresTab);

    // Localiza input de cor primária
    const hexInput = screen.getAllByRole("textbox")[0]; // Input de cor primária
    fireEvent.change(hexInput, { target: { value: "#334455" } });

    // Status deve mudar para não salvo
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();

    // Supabase NÃO deve ter sido chamado ainda
    expect(supabase.from).not.toHaveBeenCalled();

    // Preview no DOM reflete a cor primária alterada no estado local
    const previewRoot = screen.getByTestId("preview-desktop-root");
    expect(previewRoot.style.getPropertyValue("--theme-primary")).toBe("#334455");
  });

  it("4. Restaurar Padrão: Restaura o estado local para os defaults do tema atual", () => {
    render(
      <BrowserRouter>
        <VisualStoreEditor
          store={mockStore}
          themeConfig={mockThemeConfig}
          storeSections={mockSections}
          products={mockProducts}
          categories={mockCategories}
        />
      </BrowserRouter>
    );

    // Altera nome da loja no estado local
    const nameInput = screen.getByPlaceholderText("Ex: Minha Boutique Exclusiva");
    fireEvent.change(nameInput, { target: { value: "Nome Temporário" } });

    // Clica no botão Restaurar Padrão
    const resetBtn = screen.getByText("Restaurar Padrão");
    fireEvent.click(resetBtn);

    expect(window.confirm).toHaveBeenCalled();
    const previewRoot = screen.getByTestId("preview-desktop-root");
    expect(previewRoot.style.getPropertyValue("--theme-primary")).toBe("#000000"); // Default do base-theme
  });

  it("5. Salvar Alterações: Persiste a customização em lote no Supabase", async () => {
    const onSaveMock = vi.fn();

    render(
      <BrowserRouter>
        <VisualStoreEditor
          store={mockStore}
          themeConfig={mockThemeConfig}
          storeSections={mockSections}
          products={mockProducts}
          categories={mockCategories}
          onSaveSuccess={onSaveMock}
        />
      </BrowserRouter>
    );

    // Faz uma alteração
    const nameInput = screen.getByPlaceholderText("Ex: Minha Boutique Exclusiva");
    fireEvent.change(nameInput, { target: { value: "KLEIDICÚ OFICIAL" } });

    const saveBtn = screen.getByText("Salvar Alterações");
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("stores");
      expect(supabase.from).toHaveBeenCalledWith("store_theme_configs");
      expect(onSaveMock).toHaveBeenCalled();
    });
  });
});
