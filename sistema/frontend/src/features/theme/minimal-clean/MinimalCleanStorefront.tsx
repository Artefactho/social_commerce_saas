import React, { useState } from "react";
import { StorefrontThemeProps, ThemeProduct } from "@/types/theme";
import { ShoppingBag, Search, Filter, Star, Heart, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const MinimalCleanStorefront: React.FC<StorefrontThemeProps> = ({
  store,
  categories,
  products,
  colors,
}) => {
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<ThemeProduct | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.collection.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: "var(--theme-background, #FFFFFF)",
        color: "var(--theme-text, #18181B)",
        fontFamily: "var(--theme-font-body, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* Top Banner */}
      <div className="bg-zinc-900 text-white text-xs py-2 text-center font-medium tracking-wide">
        ✨ Frete expresso para todo o Brasil • Parcele em até 12x
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
            )}
            <span className="text-2xl font-bold tracking-tight uppercase">{store.name}</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`hover:text-black transition-colors ${selectedCategory === "all" ? "text-black font-semibold" : ""}`}
            >
              Todos os Produtos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`hover:text-black transition-colors ${selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "text-black font-semibold" : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative p-2.5 hover:bg-zinc-100 rounded-full transition-colors"
              onClick={() => navigate("/checkout")}
              aria-label="Carrinho"
            >
              <ShoppingBag className="w-5 h-5 text-zinc-800" />
              {getItemCount() > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-zinc-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-[420px] md:h-[520px] bg-zinc-100 overflow-hidden flex items-center justify-center">
        {store.banner_url ? (
          <img src={store.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80"
            alt="Banner Default"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
            Nova Coleção
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{store.name}</h1>
          <p className="text-zinc-200 text-sm md:text-base font-light max-w-lg mx-auto">
            Design minimalista, produtos selecionados e experiência de compra rápida.
          </p>
        </div>
      </section>

      {/* Main Catalog */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 pb-6 border-b border-zinc-100">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>
          <div className="text-xs font-medium text-zinc-500">
            Mostrando {filteredProducts.length} produtos
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-zinc-400 text-lg">Nenhum produto encontrado.</p>
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="text-xs font-semibold text-zinc-900 underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                className="group flex flex-col justify-between"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 mb-4">
                  <img
                    src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => {
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images[0] || "",
                        product_type: product.product_type,
                      }, store.slug);
                    }}
                    className="absolute bottom-3 left-3 right-3 bg-zinc-900 text-white text-xs font-semibold py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg text-center"
                  >
                    Adicionar à Sacola
                  </button>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{product.collection}</span>
                  <h3 className="font-semibold text-sm text-zinc-900 line-clamp-1 mt-0.5">{product.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-base text-zinc-900">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">12x sem juros</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xl font-bold uppercase tracking-tight">{store.name}</span>
            <p className="text-xs text-zinc-500">© 2026 {store.name}. Todos os direitos reservados.</p>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-zinc-600">
            <span>Privacidade</span>
            <span>Termos de Uso</span>
            <span>Atendimento</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
