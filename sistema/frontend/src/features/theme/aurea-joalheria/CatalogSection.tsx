import { Search, ArrowUpDown } from "lucide-react";
import { Product } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { ThemeCategory, ThemeColors } from "./Header";

export type SortOption = "featured" | "price-asc" | "price-desc" | "name";

interface CatalogSectionProps {
  products: Product[];
  categories: ThemeCategory[];
  selectedCategory: string; // "" = todas
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  onQuickView: (product: Product) => void;
  colors?: ThemeColors;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  onQuickView,
  colors,
}) => {
  const primary = colors?.primary || "#e5b869";

  return (
    <section id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[rgba(229,184,105,0.16)]">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
            {selectedCategory === "" ? "Catálogo Completo" : selectedCategory}
          </h2>
        </div>
        <span className="text-xs font-medium bg-[#14141a] text-[#dedee6] px-3 py-1.5 rounded-full border border-[rgba(229,184,105,0.16)] shrink-0">
          <strong className="text-[#e5b869]">{products.length}</strong>{" "}
          {products.length === 1 ? "item disponível" : "itens disponíveis"}
        </span>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          <button
            onClick={() => onSelectCategory("")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all border"
            style={
              selectedCategory === ""
                ? { backgroundColor: primary, color: "#050506", borderColor: primary }
                : { backgroundColor: "#14141a", color: "#dedee6", borderColor: "rgba(229,184,105,0.16)" }
            }
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all border"
              style={
                selectedCategory === cat.name
                  ? { backgroundColor: primary, color: "#050506", borderColor: primary }
                  : { backgroundColor: "#14141a", color: "#dedee6", borderColor: "rgba(229,184,105,0.16)" }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-[#0e0e12] p-3 sm:p-4 rounded-2xl border border-[rgba(229,184,105,0.16)] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs bg-[#14141a] text-[#dedee6] placeholder-[#8c8c9a] pl-9 pr-8 py-2.5 rounded-xl border border-[rgba(229,184,105,0.16)] focus:outline-none focus:border-[#e5b869]"
          />
          <Search className="w-4 h-4 text-[#8c8c9a] absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 bg-[#14141a] px-3 py-2 rounded-xl border border-[rgba(229,184,105,0.16)]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#8c8c9a]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs font-semibold text-[#dedee6] bg-transparent focus:outline-none cursor-pointer"
          >
            <option className="bg-[#14141a]" value="featured">Mais Relevantes</option>
            <option className="bg-[#14141a]" value="price-asc">Menor Preço</option>
            <option className="bg-[#14141a]" value="price-desc">Maior Preço</option>
            <option className="bg-[#14141a]" value="name">Ordem Alfabética</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-[#0e0e12] rounded-3xl p-12 text-center border border-[rgba(229,184,105,0.16)] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#14141a] flex items-center justify-center mx-auto text-[#8c8c9a]">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-white">Nenhum produto encontrado</h3>
          <p className="text-xs text-[#8c8c9a] max-w-sm mx-auto">
            Tente remover filtros ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={wishlistIds.includes(product.id)}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </section>
  );
};
