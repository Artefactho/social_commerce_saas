import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { Product } from "@/data/products";
import { TopBanner } from "./TopBanner";
import { Header, ThemeCategory, ThemeColors } from "./Header";
import { HeroCatalogBanner } from "./HeroCatalogBanner";
import { FeaturesBar } from "./FeaturesBar";
import { CatalogSection, SortOption } from "./CatalogSection";
import { Footer } from "./Footer";
import { ProductQuickViewModal } from "./ProductQuickViewModal";
import { CartDrawer } from "./CartDrawer";
import { WishlistDrawer } from "./WishlistDrawer";

interface StoreInfo {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  banner_url?: string | null;
}

interface AureaJoalheriaStorefrontProps {
  store: StoreInfo;
  categories: ThemeCategory[];
  products: Product[];
  colors?: ThemeColors;
}

const FONT_LINK_ID = "aurea-joalheria-fonts";

// Tipografia própria do tema (Cinzel para títulos, Montserrat para corpo),
// carregada só quando este tema está montado — não mexe em --font-heading/
// --font-sans globais (usados pelo resto do app: dashboard, landing, Aura
// Maison). Ver skills/theme-contract.md, adendo "Como adaptar um novo
// template" para o motivo dessa escolha.
function useThemeFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// Orquestrador do tema Aurea Joalheria, escrito seguindo o mesmo padrão do
// Aura Maison (Fase 4): consome dados reais do Commerce Core (store/
// categories/products, já buscados por PublicStore.tsx) e usa os hooks
// reais de carrinho/wishlist (useCart/useWishlist) — nenhum estado local
// isolado, nenhum conteúdo hardcoded do template de referência
// ("Aurea Joalheria", gemini-code-1787034988017.html). Checkout é sempre o
// /checkout real, nunca duplicado aqui.
export const AureaJoalheriaStorefront: React.FC<AureaJoalheriaStorefrontProps> = ({
  store,
  categories,
  products,
  colors,
}) => {
  useThemeFonts();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory && p.collection !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // featured: mantém ordem recebida (mais recentes primeiro)
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product, quantity = 1) => {
    cart.addItem(product, store.slug, quantity);
    toast.success(`${product.name} adicionado à sacola!`);
  };

  const handleToggleWishlist = (product: Product) => {
    if (wishlist.isInWishlist(product.id)) {
      wishlist.removeItem(product.id);
      toast.info("Removido dos favoritos");
    } else {
      wishlist.addItem(product);
      toast.success("Salvo nos favoritos");
    }
  };

  const handleMoveToCart = (product: Product) => {
    handleAddToCart(product);
    wishlist.removeItem(product.id);
  };

  const wishlistIds = wishlist.items.map((p) => p.id);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: "var(--theme-background, #050506)",
        color: "var(--theme-text, #dedee6)",
        fontFamily: "var(--theme-font-body, 'Montserrat', sans-serif)",
      }}
    >
      <style>{`
        .aurea-joalheria-root .font-heading { font-family: 'Cinzel', serif; }
      `}</style>
      <div className="aurea-joalheria-root flex flex-col flex-1">
        <TopBanner />

        <Header
          storeName={store.name}
          logoUrl={store.logo_url}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={cart.getItemCount()}
          wishlistCount={wishlist.items.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          colors={colors}
        />

        <main className="flex-1">
          <HeroCatalogBanner
            storeName={store.name}
            bannerUrl={store.banner_url}
            onExploreClick={() => document.getElementById("catalogo-section")?.scrollIntoView({ behavior: "smooth" })}
            colors={colors}
          />

          <FeaturesBar />

          <CatalogSection
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onQuickView={setQuickViewProduct}
            colors={colors}
          />
        </main>

        <Footer storeName={store.name} categories={categories} onSelectCategory={setSelectedCategory} />

        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart.items}
          onUpdateQuantity={cart.updateQuantity}
          onRemoveItem={cart.removeItem}
          subtotal={cart.getSubtotal()}
          onGoToCheckout={() => {
            setIsCartOpen(false);
            navigate("/checkout");
          }}
        />

        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          items={wishlist.items}
          onRemove={(product) => wishlist.removeItem(product.id)}
          onMoveToCart={handleMoveToCart}
        />
      </div>
    </div>
  );
};
