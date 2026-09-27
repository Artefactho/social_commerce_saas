import { describe, it, expect } from "vitest";
import { DEFAULT_TEMPLATES } from "../pages/Onboarding";

describe("Onboarding & Store Creation Flow Logic", () => {
  it("deve conter exatamente os 5 templates oficiais com identificadores e layout_keys corretos", () => {
    expect(DEFAULT_TEMPLATES).toHaveLength(5);
    
    const layoutKeys = DEFAULT_TEMPLATES.map((t) => t.layout_key);
    expect(layoutKeys).toContain("base-theme");
    expect(layoutKeys).toContain("aura-maison");
    expect(layoutKeys).toContain("aurea-joalheria");
    expect(layoutKeys).toContain("jo-perfumes");
    expect(layoutKeys).toContain("minimal-clean");

    DEFAULT_TEMPLATES.forEach((template) => {
      expect(template.id).toMatch(/^44444444-0000-0000-0000-00000000000[0-4]$/);
      expect(template.name).toBeTruthy();
      expect(template.active).toBe(true);
      expect(template.preview_url).toMatch(/^\/store\/demo-/);
    });
  });

  it("deve mapear corretamente cada layout_key para o themeId do Theme Contract", () => {
    const THEME_ID_BY_LAYOUT_KEY: Record<string, string> = {
      "base-theme": "base-theme",
      "aura-maison": "aura-maison",
      premium: "aura-maison",
      "aurea-joalheria": "aurea-joalheria",
      "jo-perfumes": "jo-perfumes",
      "minimal-clean": "minimal-clean",
      minimal: "minimal-clean",
    };

    DEFAULT_TEMPLATES.forEach((tpl) => {
      const themeId = THEME_ID_BY_LAYOUT_KEY[tpl.layout_key];
      expect(themeId).toBeDefined();
      expect(["base-theme", "aura-maison", "aurea-joalheria", "jo-perfumes", "minimal-clean"]).toContain(themeId);
    });
  });

  it("deve estruturar payload de criação de loja com organization_id e active_template_id", () => {
    const mockUser = { id: "usr-123", email: "lojista@test.com" };
    const mockOrg = { id: "org-456", name: "Minha Marca" };
    const mockFormData = {
      name: "Minha Marca",
      slug: "minha-marca",
      category: "Fashion",
      templateId: "44444444-0000-0000-0000-000000000004", // Base Theme
    };

    const storePayload = {
      owner_id: mockUser.id,
      organization_id: mockOrg.id,
      name: mockFormData.name.trim(),
      slug: mockFormData.slug.trim().toLowerCase(),
      category: mockFormData.category,
      active_template_id: mockFormData.templateId,
    };

    expect(storePayload.owner_id).toBe("usr-123");
    expect(storePayload.organization_id).toBe("org-456");
    expect(storePayload.name).toBe("Minha Marca");
    expect(storePayload.slug).toBe("minha-marca");
    expect(storePayload.active_template_id).toBe("44444444-0000-0000-0000-000000000004");
  });
});
