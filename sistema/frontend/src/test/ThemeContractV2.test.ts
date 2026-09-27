import { describe, it, expect } from "vitest";
import { 
  THEME_DEFAULTS, 
  getThemeDefaults, 
  mergeThemeConfig,
  OFFICIAL_THEMES 
} from "@/features/theme/ThemeRegistry";
import { ThemeId, ThemeCustomConfig } from "@/types/theme";

describe("ThemeContractV2 — Fase 1: Contrato, Tokens & Defaults dos 5 Temas", () => {
  const officialIds: ThemeId[] = [
    "base-theme",
    "aura-maison",
    "aurea-joalheria",
    "jo-perfumes",
    "minimal-clean",
  ];

  it("1. Todos os 5 temas oficiais possuem entradas completas em THEME_DEFAULTS", () => {
    officialIds.forEach((id) => {
      const defaults = THEME_DEFAULTS[id];
      expect(defaults).toBeDefined();
      expect(defaults.themeId).toBe(id);

      // Design Tokens de Cores
      expect(defaults.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.accent).toBeDefined();
      expect(defaults.colors.accentPromotion).toBeDefined();
      expect(defaults.colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.textMuted).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.button).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(defaults.colors.buttonText).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Design Tokens de Tipografia
      expect(defaults.typography.fontFamily).toBeTruthy();
      expect(defaults.typography.headingFontFamily).toBeTruthy();
      expect(["normal", "medium", "semibold", "bold", "extrabold"]).toContain(
        defaults.typography.headingWeight
      );

      // Design Tokens de Layout
      expect(["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]).toContain(
        defaults.layout.borderRadius
      );
      expect(["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]).toContain(
        defaults.layout.cardRadius
      );
      expect(["none", "sm", "md", "lg", "xl", "2xl"]).toContain(
        defaults.layout.cardShadow
      );
    });
  });

  it("2. Identifica especificidades visuais reais de cada tema", () => {
    // Áurea Joalheria: Dark onyx, ouro, Cinzel serif
    const aurea = THEME_DEFAULTS["aurea-joalheria"];
    expect(aurea.colors.background).toBe("#050506");
    expect(aurea.colors.primary).toBe("#D4AF37");
    expect(aurea.typography.headingFontFamily).toBe("Cinzel");
    expect(aurea.typography.fontFamily).toBe("Montserrat");

    // Aura Maison: Luxo claro, cream background, stone text
    const aura = THEME_DEFAULTS["aura-maison"];
    expect(aura.colors.background).toBe("#FAF8F5");
    expect(aura.colors.primary).toBe("#1C1917");
    expect(aura.layout.cardRadius).toBe("3xl");

    // Jô Perfumes: Instagram vibrant, rose accent
    const jo = THEME_DEFAULTS["jo-perfumes"];
    expect(jo.colors.primary).toBe("#F43F5E");
    expect(jo.colors.background).toBe("#0D0D0F");

    // Minimal Clean: Pure clean white
    const minimal = THEME_DEFAULTS["minimal-clean"];
    expect(minimal.colors.background).toBe("#FFFFFF");
    expect(minimal.colors.primary).toBe("#18181B");
    expect(minimal.layout.cardShadow).toBe("none");

    // Base Theme: Clássico e robusto
    const base = THEME_DEFAULTS["base-theme"];
    expect(base.colors.background).toBe("#FDFDFD");
    expect(base.colors.primary).toBe("#000000");
  });

  it("3. getThemeDefaults resolve corretamente temas oficiais, aliases legados e fallbacks", () => {
    expect(getThemeDefaults("base-theme").themeId).toBe("base-theme");
    expect(getThemeDefaults("aura-maison").themeId).toBe("aura-maison");
    expect(getThemeDefaults("premium").themeId).toBe("aura-maison");
    expect(getThemeDefaults("minimal").themeId).toBe("minimal-clean");
    expect(getThemeDefaults("desconhecido").themeId).toBe("base-theme");
    expect(getThemeDefaults(null).themeId).toBe("base-theme");
    expect(getThemeDefaults(undefined).themeId).toBe("base-theme");
  });

  it("4. mergeThemeConfig mantém 100% de compatibilidade com payload antigo da V1", () => {
    // Payload antigo armazenado no banco da V1
    const legacyV1Payload = {
      themeId: "base-theme",
      colors: {
        primary: "#8B5CF6",
        accentPromotion: "#EC4899",
      },
    };

    const merged = mergeThemeConfig(legacyV1Payload as any, "base-theme");

    // Deve preservar o override customizado
    expect(merged.colors.primary).toBe("#8B5CF6");
    expect(merged.colors.accentPromotion).toBe("#EC4899");

    // Deve preencher com os defaults todos os tokens novos sem quebrar
    expect(merged.colors.background).toBe("#FDFDFD");
    expect(merged.colors.surface).toBe("#FFFFFF");
    expect(merged.colors.buttonText).toBe("#FFFFFF");
    expect(merged.typography.fontFamily).toBe("Plus Jakarta Sans");
    expect(merged.layout.borderRadius).toBe("full");
    expect(merged.layout.cardRadius).toBe("2xl");
  });

  it("5. mergeThemeConfig suporta overrides parciais de tipografia e layout", () => {
    const customConfig: Partial<ThemeCustomConfig> = {
      themeId: "aura-maison",
      colors: {
        primary: "#112233",
        secondary: "#445566",
        background: "#F0F0F0",
        surface: "#FFFFFF",
        text: "#000000",
        textMuted: "#666666",
        border: "#CCCCCC",
        button: "#112233",
        buttonText: "#FFFFFF",
      },
      typography: {
        fontFamily: "Inter",
        headingFontFamily: "Playfair Display",
        headingWeight: "extrabold",
      },
      layout: {
        borderRadius: "md",
        cardRadius: "lg",
        cardShadow: "sm",
      },
    };

    const merged = mergeThemeConfig(customConfig, "aura-maison");

    expect(merged.typography.fontFamily).toBe("Inter");
    expect(merged.typography.headingFontFamily).toBe("Playfair Display");
    expect(merged.layout.borderRadius).toBe("md");
    expect(merged.layout.cardRadius).toBe("lg");
    expect(merged.colors.primary).toBe("#112233");
  });
});
