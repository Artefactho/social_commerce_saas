import { describe, it, expect } from "vitest";
import { OFFICIAL_THEMES, resolveThemeComponent, THEME_COMPONENTS } from "@/features/theme/ThemeRegistry";

describe("ThemeRegistry", () => {
  it("should contain exactly 5 official themes in catalog", () => {
    expect(OFFICIAL_THEMES).toHaveLength(5);
    const themeIds = OFFICIAL_THEMES.map((t) => t.id);
    expect(themeIds).toContain("base-theme");
    expect(themeIds).toContain("aura-maison");
    expect(themeIds).toContain("aurea-joalheria");
    expect(themeIds).toContain("jo-perfumes");
    expect(themeIds).toContain("minimal-clean");
  });

  it("should resolve components for all 5 themes without throwing", () => {
    expect(resolveThemeComponent("base-theme")).toBeDefined();
    expect(resolveThemeComponent("aura-maison")).toBeDefined();
    expect(resolveThemeComponent("aurea-joalheria")).toBeDefined();
    expect(resolveThemeComponent("jo-perfumes")).toBeDefined();
    expect(resolveThemeComponent("minimal-clean")).toBeDefined();
  });

  it("should support legacy aliases (premium, minimal)", () => {
    expect(resolveThemeComponent("premium")).toBe(THEME_COMPONENTS["aura-maison"]);
    expect(resolveThemeComponent("minimal")).toBe(THEME_COMPONENTS["minimal-clean"]);
  });

  it("should fallback safely to BaseThemeStorefront for unknown or null theme IDs", () => {
    expect(resolveThemeComponent("tema-inexistente")).toBe(THEME_COMPONENTS["base-theme"]);
    expect(resolveThemeComponent(null)).toBe(THEME_COMPONENTS["base-theme"]);
    expect(resolveThemeComponent(undefined)).toBe(THEME_COMPONENTS["base-theme"]);
  });
});
