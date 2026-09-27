import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { buildThemeCssVariables } from "@/features/theme/themeTokens";
import { 
  getThemeDefaults, 
  mergeThemeConfig, 
  OFFICIAL_THEMES,
  resolveThemeComponent 
} from "@/features/theme/ThemeRegistry";
import { ThemeCustomConfig } from "@/types/theme";

describe("ThemeTokenInjection — Fase 2: Injeção & Consumo Real de CSS Variables no Storefront", () => {
  const sampleStore = {
    id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    name: "KLEIDICÚ",
    slug: "kleidicú",
    logo_url: "0746a11e-0bfd-4f33-82cd-7c07393ee663/logo/cfqmv0j5zvq.png",
    banner_url: null,
  };

  const sampleProducts = [
    {
      id: "p1",
      name: "Vestido Midi Floral",
      slug: "vestido-midi-floral",
      collection: "Vestidos",
      price: 199.9,
      description: "Vestido elegante com tecido leve",
      images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80"],
      product_type: "physical" as const,
    },
  ];

  const sampleCategories = [
    { id: "c1", name: "Vestidos", slug: "vestidos" },
  ];

  it("1. buildThemeCssVariables gera o catálogo completo de variáveis CSS a partir do ThemeCustomConfig", () => {
    const baseConfig = getThemeDefaults("base-theme");
    const vars = buildThemeCssVariables(baseConfig);

    expect(vars["--theme-primary"]).toBe("#000000");
    expect(vars["--theme-secondary"]).toBe("#111111");
    expect(vars["--theme-accent"]).toBe("#F59E0B");
    expect(vars["--theme-accent-promotion"]).toBe("#F59E0B");
    expect(vars["--theme-background"]).toBe("#FDFDFD");
    expect(vars["--theme-surface"]).toBe("#FFFFFF");
    expect(vars["--theme-text"]).toBe("#222222");
    expect(vars["--theme-text-muted"]).toBe("#6B7280");
    expect(vars["--theme-border"]).toBe("#E5E7EB");
    expect(vars["--theme-button"]).toBe("#000000");
    expect(vars["--theme-button-text"]).toBe("#FFFFFF");

    expect(vars["--theme-radius"]).toBe("9999px"); // full
    expect(vars["--theme-card-radius"]).toBe("1rem"); // 2xl
    expect(vars["--theme-card-shadow"]).toBe("0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"); // md

    expect(vars["--theme-font-body"]).toContain("Plus Jakarta Sans");
    expect(vars["--theme-heading-weight"]).toBe("800"); // extrabold
  });

  it("2. Mapeia tokens de cada um dos 5 temas em CSS Variables específicas de sua identidade", () => {
    // Áurea Joalheria
    const aureaVars = buildThemeCssVariables(getThemeDefaults("aurea-joalheria"));
    expect(aureaVars["--theme-background"]).toBe("#050506");
    expect(aureaVars["--theme-primary"]).toBe("#D4AF37");
    expect(aureaVars["--theme-radius"]).toBe("0.125rem"); // sm
    expect(aureaVars["--theme-font-heading"]).toContain("Cinzel");

    // Aura Maison
    const auraVars = buildThemeCssVariables(getThemeDefaults("aura-maison"));
    expect(auraVars["--theme-background"]).toBe("#FAF8F5");
    expect(auraVars["--theme-card-radius"]).toBe("1.5rem"); // 3xl

    // Jô Perfumes
    const joVars = buildThemeCssVariables(getThemeDefaults("jo-perfumes"));
    expect(joVars["--theme-primary"]).toBe("#F43F5E");
    expect(joVars["--theme-background"]).toBe("#0D0D0F");

    // Minimal Clean
    const minVars = buildThemeCssVariables(getThemeDefaults("minimal-clean"));
    expect(minVars["--theme-background"]).toBe("#FFFFFF");
    expect(minVars["--theme-card-shadow"]).toBe("none");
  });

  it("3. Injeção real no DOM: CSS Variables são aplicadas no wrapper root e propagadas para os 5 temas", () => {
    OFFICIAL_THEMES.forEach((meta) => {
      const customConfig = getThemeDefaults(meta.id);
      const cssVars = buildThemeCssVariables(customConfig);
      const Component = resolveThemeComponent(meta.id);

      const { container } = render(
        <BrowserRouter>
          <div 
            className="storefront-theme-root"
            style={cssVars as React.CSSProperties}
            data-testid={`root-${meta.id}`}
          >
            <Component
              store={sampleStore}
              categories={sampleCategories}
              products={sampleProducts}
              colors={customConfig.colors}
              customConfig={customConfig}
            />
          </div>
        </BrowserRouter>
      );

      const rootEl = screen.getByTestId(`root-${meta.id}`);
      expect(rootEl).toBeInTheDocument();
      // Valida que o estilo do elemento raiz contém as variáveis CSS injetadas
      expect(rootEl.style.getPropertyValue("--theme-primary")).toBe(customConfig.colors.primary);
      expect(rootEl.style.getPropertyValue("--theme-background")).toBe(customConfig.colors.background);
    });
  });

  it("4. Teste Adversarial: Customização arbitrária substitui CSS Variables no DOM sem quebrar o layout", () => {
    const adversarialConfig: Partial<ThemeCustomConfig> = {
      themeId: "base-theme",
      colors: {
        primary: "#FF0055",
        secondary: "#220033",
        background: "#0A0A10",
        surface: "#1A1A24",
        text: "#EEEEFF",
        textMuted: "#8888AA",
        border: "#FF0055",
        button: "#FF0055",
        buttonText: "#FFFFFF",
      },
      typography: {
        fontFamily: "Roboto",
        headingFontFamily: "Montserrat",
        headingWeight: "bold",
      },
      layout: {
        borderRadius: "md",
        cardRadius: "lg",
        cardShadow: "sm",
      },
    };

    const merged = mergeThemeConfig(adversarialConfig, "base-theme");
    const cssVars = buildThemeCssVariables(merged);
    const Component = resolveThemeComponent("base-theme");

    render(
      <BrowserRouter>
        <div 
          className="storefront-theme-root"
          style={cssVars as React.CSSProperties}
          data-testid="adversarial-root"
        >
          <Component
            store={sampleStore}
            categories={sampleCategories}
            products={sampleProducts}
            colors={merged.colors}
            customConfig={merged}
          />
        </div>
      </BrowserRouter>
    );

    const rootEl = screen.getByTestId("adversarial-root");
    expect(rootEl.style.getPropertyValue("--theme-primary")).toBe("#FF0055");
    expect(rootEl.style.getPropertyValue("--theme-background")).toBe("#0A0A10");
    expect(rootEl.style.getPropertyValue("--theme-text")).toBe("#EEEEFF");
    expect(rootEl.style.getPropertyValue("--theme-radius")).toBe("0.375rem"); // md
    expect(rootEl.style.getPropertyValue("--theme-card-radius")).toBe("0.5rem"); // lg
    expect(rootEl.style.getPropertyValue("--theme-font-body")).toContain("Roboto");
  });

  it("5. Teste de Retrocompatibilidade V1: Payload legado apenas com cores parciais gera CSS Variables completas", () => {
    const legacyV1 = {
      themeId: "aura-maison",
      colors: {
        primary: "#9333EA",
        accentPromotion: "#F43F5E",
      },
    };

    const merged = mergeThemeConfig(legacyV1 as any, "aura-maison");
    const cssVars = buildThemeCssVariables(merged);

    expect(cssVars["--theme-primary"]).toBe("#9333EA");
    expect(cssVars["--theme-accent-promotion"]).toBe("#F43F5E");
    // Defaults do Aura Maison preservados para o resto
    expect(cssVars["--theme-background"]).toBe("#FAF8F5");
    expect(cssVars["--theme-card-radius"]).toBe("1.5rem"); // 3xl
  });
});
