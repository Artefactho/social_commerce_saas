import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionRenderer } from "@/features/sections/SectionRenderer";
import { StoreSection, StoreInfo } from "@/types/theme";

const dummyStore: StoreInfo = {
  id: "store-1",
  name: "Loja Teste",
  slug: "loja-teste",
  logo_url: null,
  banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  whatsapp: "5511999999999",
};

describe("P1 — Section Engine Functional Tests", () => {
  it("deve renderizar apenas as seções com enabled=true", () => {
    const sections: StoreSection[] = [
      {
        id: "sec-1",
        store_id: "store-1",
        section_type: "hero_slider",
        enabled: true,
        position: 10,
        settings: { title: "Hero Banner Ativo" },
      },
      {
        id: "sec-2",
        store_id: "store-1",
        section_type: "video_feature",
        enabled: false, // Desabilitada
        position: 20,
        settings: { title: "Vídeo Oculto" },
      },
      {
        id: "sec-3",
        store_id: "store-1",
        section_type: "benefits_bar",
        enabled: true,
        position: 30,
        settings: {},
      },
    ];

    const { container } = render(
      <SectionRenderer
        sections={sections}
        store={dummyStore}
        categories={[]}
        products={[]}
      />
    );

    // Hero e Benefits devem estar no DOM
    expect(screen.getByText("Hero Banner Ativo")).toBeDefined();
    expect(screen.getByText("Frete Seguro")).toBeDefined();

    // Vídeo Oculto NÃO pode aparecer no DOM
    expect(screen.queryByText("Vídeo Oculto")).toBeNull();
  });

  it("deve respeitar estritamente a ordenação por position no DOM", () => {
    const sections: StoreSection[] = [
      {
        id: "sec-social",
        store_id: "store-1",
        section_type: "social_feed",
        enabled: true,
        position: 50, // Deve vir DEPOIS
        settings: { title: "Instagram da Loja" },
      },
      {
        id: "sec-newsletter",
        store_id: "store-1",
        section_type: "newsletter",
        enabled: true,
        position: 10, // Deve vir ANTES
        settings: { title: "Assine a Newsletter" },
      },
    ];

    const { container } = render(
      <SectionRenderer
        sections={sections}
        store={dummyStore}
        categories={[]}
        products={[]}
      />
    );

    const renderedDivs = container.querySelectorAll("[data-section-type]");
    expect(renderedDivs.length).toBe(2);
    // Primeiro elemento renderizado deve ser a newsletter (position 10)
    expect(renderedDivs[0].getAttribute("data-section-type")).toBe("newsletter");
    // Segundo elemento renderizado deve ser o social feed (position 50)
    expect(renderedDivs[1].getAttribute("data-section-type")).toBe("social_feed");
  });
});
