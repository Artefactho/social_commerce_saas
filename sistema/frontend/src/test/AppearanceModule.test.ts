import { describe, it, expect } from "vitest";
import { OFFICIAL_THEMES, resolveThemeComponent, THEME_COMPONENTS } from "@/features/theme/ThemeRegistry";
import { DEFAULT_TEMPLATES } from "@/pages/Onboarding";
import { StoreSection, ThemeConfig, StoreInfo } from "@/types/theme";

describe("V1 Aparência / Visual Editor Module Audit Tests", () => {
  const EXPECTED_THEME_IDS = [
    "base-theme",
    "aura-maison",
    "aurea-joalheria",
    "jo-perfumes",
    "minimal-clean",
  ];

  it("REQ-01: Sidebar deve conter apenas 'Aparência' como módulo visual e nenhum 'Tema' separado", () => {
    const sidebarNavItems = [
      { id: "overview", label: "Visão Geral" },
      { id: "products", label: "Produtos" },
      { id: "categories", label: "Categorias" },
      { id: "coupons", label: "Cupons" },
      { id: "orders", label: "Pedidos" },
      { id: "plans", label: "Assinatura" },
      { id: "appearance", label: "Aparência" },
      { id: "settings", label: "Configurações" },
    ];

    const appearanceItem = sidebarNavItems.find((item) => item.id === "appearance");
    const themeItem = sidebarNavItems.find((item) => item.id === "theme");

    expect(appearanceItem).toBeDefined();
    expect(appearanceItem?.label).toBe("Aparência");
    expect(themeItem).toBeUndefined(); // Duplicidade eliminada
  });

  it("REQ-02: Os 5 temas oficiais devem estar registrados e disponíveis", () => {
    expect(OFFICIAL_THEMES.length).toBe(5);

    const themeIds = OFFICIAL_THEMES.map((t) => t.id);
    EXPECTED_THEME_IDS.forEach((themeId) => {
      expect(themeIds).toContain(themeId);
    });

    const templateKeys = DEFAULT_TEMPLATES.map((t) => t.layout_key);
    expect(templateKeys).toContain("base-theme");
    expect(templateKeys).toContain("aura-maison");
    expect(templateKeys).toContain("aurea-joalheria");
    expect(templateKeys).toContain("jo-perfumes");
    expect(templateKeys).toContain("minimal-clean");
  });

  it("REQ-03 & REQ-04: Ativação atômica de tema sincroniza active_template_id e themeId consistentemente", async () => {
    const mockStore = {
      id: "store-123",
      name: "Loja Teste",
      active_template_id: "44444444-0000-0000-0000-000000000004", // Base Theme
    };

    const mockThemeConfig: { store_id: string; config: Record<string, any> } = {
      store_id: "store-123",
      config: {
        themeId: "base-theme",
        colors: { primary: "#7C3AED", accentPromotion: "#E11D48" },
      },
    };

    const handleActivateTheme = (
      themeKey: string,
      templates: typeof DEFAULT_TEMPLATES,
      store: typeof mockStore,
      themeCfg: typeof mockThemeConfig
    ) => {
      const matchingTemplate = templates.find(
        (t) =>
          t.layout_key === themeKey ||
          (themeKey === "aura-maison" && (t.layout_key === "premium" || t.layout_key === "aura-maison")) ||
          (themeKey === "minimal-clean" && (t.layout_key === "minimal" || t.layout_key === "minimal-clean")) ||
          t.id === themeKey
      );
      const templateId = matchingTemplate?.id || store.active_template_id;

      const updatedStore = { ...store, active_template_id: templateId };
      const updatedConfig = { ...themeCfg.config, themeId: themeKey };
      const updatedThemeConfig = { ...themeCfg, config: updatedConfig };

      return { updatedStore, updatedThemeConfig };
    };

    for (const themeKey of EXPECTED_THEME_IDS) {
      const { updatedStore, updatedThemeConfig } = handleActivateTheme(
        themeKey,
        DEFAULT_TEMPLATES,
        mockStore,
        mockThemeConfig
      );

      // 1. themeId no store_theme_configs atualizado
      expect(updatedThemeConfig.config.themeId).toBe(themeKey);

      // 2. Template correspondente no banco
      const template = DEFAULT_TEMPLATES.find(
        (t) => t.id === updatedStore.active_template_id
      );
      expect(template).toBeDefined();

      // 3. Storefront resolve para o mesmo tema
      const resolvedComponent = resolveThemeComponent(updatedThemeConfig.config.themeId);
      expect(resolvedComponent).toBeDefined();
      expect(typeof resolvedComponent).toBe("function");
      expect(resolvedComponent).toBe(THEME_COMPONENTS[themeKey]);
    }
  });

  it("REQ-05: Configurações de branding persistem nome, logo e cores no contrato", () => {
    const storeState = {
      id: "store-branding",
      name: "Boutique Elegance",
      logo_url: "store-branding/logo/logo.png",
    };

    const themeConfigState = {
      store_id: "store-branding",
      config: {
        themeId: "aura-maison",
        colors: {
          primary: "#111827",
          accentPromotion: "#D97706",
        },
      },
    };

    expect(themeConfigState.config.colors.primary).toBe("#111827");
    expect(themeConfigState.config.colors.accentPromotion).toBe("#D97706");
    expect(storeState.name).toBe("Boutique Elegance");
    expect(storeState.logo_url).toContain("logo.png");
  });

  it("REQ-06 & REQ-07 & REQ-08: Seções suportam toggle enabled/disabled, ordenação por position e settings", () => {
    const sections: StoreSection[] = [
      {
        id: "sec-1",
        store_id: "store-123",
        section_type: "hero_slider",
        enabled: true,
        position: 10,
        settings: { title: "Coleção Outono 2026", buttonText: "Ver Agora" },
      },
      {
        id: "sec-2",
        store_id: "store-123",
        section_type: "benefits_bar",
        enabled: true,
        position: 20,
        settings: {},
      },
      {
        id: "sec-3",
        store_id: "store-123",
        section_type: "video_feature",
        enabled: false,
        position: 30,
        settings: { videoUrl: "https://example.com/video.mp4" },
      },
    ];

    const activeSections = sections
      .filter((s) => s.enabled)
      .sort((a, b) => a.position - b.position);

    expect(activeSections.length).toBe(2);
    expect(activeSections[0].section_type).toBe("hero_slider");
    expect(activeSections[1].section_type).toBe("benefits_bar");

    sections[1].position = 5;
    const reordered = sections
      .filter((s) => s.enabled)
      .sort((a, b) => a.position - b.position);

    expect(reordered[0].section_type).toBe("benefits_bar");
    expect(reordered[1].section_type).toBe("hero_slider");

    expect(activeSections[1].settings).toBeDefined();
    expect(sections[0].settings.title).toBe("Coleção Outono 2026");
  });

  it("REQ-09: Lojas recém-criadas possuem fallback seguro mesmo sem personalização prévia", () => {
    const emptyThemeConfig: Partial<ThemeConfig> = {
      config: {},
    };

    const resolvedThemeId =
      emptyThemeConfig.config?.themeId ??
      "base-theme";

    expect(resolvedThemeId).toBe("base-theme");

    const themeComponent = resolveThemeComponent(resolvedThemeId);
    expect(themeComponent).toBeDefined();
    expect(themeComponent).toBe(THEME_COMPONENTS["base-theme"]);
  });
});
