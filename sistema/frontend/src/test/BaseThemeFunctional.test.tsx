import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BaseThemeStorefront } from "@/features/theme/base-theme/BaseThemeStorefront";
import { ThemeProduct, ThemeCategory, StoreInfo } from "@/types/theme";
import { useCart } from "@/hooks/useCart";

const dummyStore: StoreInfo = {
  id: "store-base",
  name: "Urban Style Base",
  slug: "demo-base-theme",
  logo_url: null,
  banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  whatsapp: "5511999999999",
  instagram: "@urbanstyle",
};

const dummyCategories: ThemeCategory[] = [
  { id: "c1", name: "Lançamentos", slug: "lancamentos" },
  { id: "c2", name: "Calçados", slug: "calcados" },
];

const dummyProducts: ThemeProduct[] = [
  {
    id: "prod-1",
    name: "Jaqueta Corta Vento Urban Tech",
    slug: "jaqueta-corta-vento",
    collection: "Lançamentos",
    price: 289.90,
    description: "Impermeável, leve e respirável.",
    images: ["https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80"],
    product_type: "physical",
  },
];

describe("P2 — Base Theme Functional Component Tests", () => {
  beforeEach(() => {
    useCart.getState().clearCart();
  });

  it("deve abrir o QuickShop ao clicar em 'Espiar' e permitir adicionar à sacola", () => {
    render(
      <MemoryRouter>
        <BaseThemeStorefront
          store={dummyStore}
          categories={dummyCategories}
          products={dummyProducts}
        />
      </MemoryRouter>
    );

    // 1. Verificar se o produto está renderizado
    expect(screen.getByText("Jaqueta Corta Vento Urban Tech")).toBeDefined();

    // 2. Clicar no botão 'Espiar' (Eye icon)
    const quickViewBtn = screen.getByTitle("Espiar Produto");
    expect(quickViewBtn).toBeDefined();
    fireEvent.click(quickViewBtn);

    // 3. Confirmar que o QuickShop Modal abriu com os detalhes
    expect(screen.getByText("Quantidade")).toBeDefined();
    expect(screen.getByText("Impermeável, leve e respirável.")).toBeDefined();

    // 4. Clicar em 'Adicionar à Sacola' dentro do modal
    const addToCartBtn = screen.getByText("Adicionar à Sacola");
    fireEvent.click(addToCartBtn);

    // 5. Verificar se o estado do carrinho foi atualizado
    expect(useCart.getState().getItemCount()).toBe(1);
    expect(useCart.getState().items[0].product.id).toBe("prod-1");
  });

  it("deve renderizar a Seção de Vídeo e Galeria Social do Base Theme", () => {
    render(
      <MemoryRouter>
        <BaseThemeStorefront
          store={dummyStore}
          categories={dummyCategories}
          products={dummyProducts}
        />
      </MemoryRouter>
    );

    // Verificar Seção de Vídeo
    expect(screen.getByText("Conheça Nossa Coleção")).toBeDefined();

    // Verificar Galeria Social / Instagram
    expect(screen.getByText("Galeria Social")).toBeDefined();
    expect(screen.getByText("@urbanstyle")).toBeDefined();
  });

  it("deve abrir a busca e menu mobile ao clicar no ícone de menu", () => {
    const { container } = render(
      <MemoryRouter>
        <BaseThemeStorefront
          store={dummyStore}
          categories={dummyCategories}
          products={dummyProducts}
        />
      </MemoryRouter>
    );

    // Encontrar botão de menu mobile
    const menuButtons = container.querySelectorAll("button");
    const hamburgerBtn = Array.from(menuButtons).find((b) => b.querySelector("svg.lucide-menu"));
    expect(hamburgerBtn).toBeDefined();

    if (hamburgerBtn) {
      fireEvent.click(hamburgerBtn);
      // Drawer deve estar aberto com busca mobile
      expect(screen.getByPlaceholderText("Buscar produtos...")).toBeDefined();
    }
  });
});
