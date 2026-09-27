import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { resolveThemeComponent } from "@/features/theme/ThemeRegistry";
import { StoreInfo, StoreSection, ThemeProduct } from "@/types/theme";

// Dados reais da loja KLEIDICÚ
const realStoreInfo: StoreInfo = {
  id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
  name: "KLEIDICÚ",
  slug: "kleidicú",
  logo_url: "0746a11e-0bfd-4f33-82cd-7c07393ee663/logo/cfqmv0j5zvq.png",
  banner_url: null,
  whatsapp: null,
  instagram: null,
};

const realSections: StoreSection[] = [
  {
    id: "ae6b2ffb-ca6d-4e9c-9b6b-ca098908d993",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "hero_slider",
    enabled: true,
    position: 10,
    settings: {
      title: "Destaques & Ofertas",
      subtitle: "Coleção Exclusiva",
      buttonText: "Ver Produtos",
    },
  },
  {
    id: "3b6938ab-d7d0-413b-9854-e9ba5e3a97bf",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "benefits_bar",
    enabled: true,
    position: 20,
    settings: {},
  },
  {
    id: "01bc5ea3-82bd-4eef-b604-5eb2f06a8c82",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "video_feature",
    enabled: true,
    position: 30,
    settings: {
      title: "Conheça Nossos Produtos",
      subtitle: "Vídeo em Alta Definição",
      description: "Assista aos detalhes e conheça nossa qualidade.",
    },
  },
  {
    id: "eee861e3-f947-485d-be94-50b49c121eb8",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "social_feed",
    enabled: true,
    position: 40,
    settings: {
      title: "Siga no Instagram",
      subtitle: "Comunidade Oficial",
    },
  },
  {
    id: "b16a7cfb-9a9b-4c96-a5c1-d7dd70db85a8",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "whatsapp_cta",
    enabled: true,
    position: 50,
    settings: {},
  },
  {
    id: "585bacc4-8462-4072-aa6b-56049498409c",
    store_id: "0746a11e-0bfd-4f33-82cd-7c07393ee663",
    section_type: "newsletter",
    enabled: true,
    position: 60,
    settings: {
      badge: "Newsletter",
      title: "Receba Novidades Exclusivas",
    },
  },
];

const mockProducts: ThemeProduct[] = [
  {
    id: "prod-1",
    name: "Vestido Seda Pura",
    slug: "vestido-seda-pura",
    price: 349.90,
    description: "Vestido elegante confeccionado em seda natural.",
    images: ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80"],
    product_type: "physical",
  },
];

describe("Storefront DOM Verification — 5 Temas Oficiais & Seções da Loja Real", () => {
  it("Tema 1: Base Theme renderiza loja real KLEIDICÚ com todas as seções configuradas", () => {
    const Component = resolveThemeComponent("base-theme");
    render(
      <MemoryRouter>
        <Component
          store={realStoreInfo}
          categories={[]}
          products={mockProducts}
          sections={realSections}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("KLEIDICÚ").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestido Seda Pura")).toBeDefined();
    expect(screen.getByText("Destaques & Ofertas")).toBeDefined();
    expect(screen.getByText("Conheça Nossos Produtos")).toBeDefined();
    expect(screen.getAllByText("Siga no Instagram").length).toBeGreaterThan(0);
    expect(screen.getByText("Receba Novidades Exclusivas")).toBeDefined();
  });

  it("Tema 2: Aura Maison renderiza storefront de luxo com catálogo e branding", () => {
    const Component = resolveThemeComponent("aura-maison");
    render(
      <MemoryRouter>
        <Component
          store={realStoreInfo}
          categories={[]}
          products={mockProducts}
          sections={realSections}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("KLEIDICÚ").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestido Seda Pura")).toBeDefined();
    expect(screen.getByPlaceholderText("Buscar no catálogo...")).toBeDefined();
  });

  it("Tema 3: Áurea Joalheria renderiza storefront de joalheria de alto luxo", () => {
    const Component = resolveThemeComponent("aurea-joalheria");
    render(
      <MemoryRouter>
        <Component
          store={realStoreInfo}
          categories={[]}
          products={mockProducts}
          sections={realSections}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("KLEIDICÚ").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestido Seda Pura")).toBeDefined();
  });

  it("Tema 4: Jô Perfumes & Cosméticos renderiza storefront estilo Instagram Shop", () => {
    const Component = resolveThemeComponent("jo-perfumes");
    render(
      <MemoryRouter>
        <Component
          store={realStoreInfo}
          categories={[]}
          products={mockProducts}
          sections={realSections}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("KLEIDICÚ").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestido Seda Pura")).toBeDefined();
  });

  it("Tema 5: Minimal Clean renderiza storefront nórdico moderno", () => {
    const Component = resolveThemeComponent("minimal-clean");
    render(
      <MemoryRouter>
        <Component
          store={realStoreInfo}
          categories={[]}
          products={mockProducts}
          sections={realSections}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("KLEIDICÚ").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestido Seda Pura")).toBeDefined();
  });
});
