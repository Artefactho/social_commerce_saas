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
  return (
    <section id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#EAE2D3]">
        <div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
            {selectedCategory === "" ? "Catálogo Completo" : selectedCategory}
          </h2>
        </div>
        <span className="text-xs font-medium bg-[#F0EAE0] text-stone-700 px-3 py-1.5 rounded-full border border-[#DFD5C2] shrink-0">
          <strong>{products.length}</strong> {products.length === 1 ? "item disponível" : "itens disponíveis"}
        </span>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          <button
            onClick={() => onSelectCategory("")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
              selectedCategory === ""
                ? "text-amber-200 border-transparent shadow-md scale-105"
                : "bg-white text-stone-700 border-[#E5DAC8] hover:border-stone-400 hover:bg-[#FAF6F0]"
            }`}
            style={selectedCategory === "" ? { backgroundColor: colors?.primary || "#1c1917" } : undefined}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
                selectedCategory === cat.name
                  ? "text-amber-200 border-transparent shadow-md scale-105"
                  : "bg-white text-stone-700 border-[#E5DAC8] hover:border-stone-400 hover:bg-[#FAF6F0]"
              }`}
              style={selectedCategory === cat.name ? { backgroundColor: colors?.primary || "#1c1917" } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-[#FAF7F2] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-[#E8DFCF] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs bg-white text-stone-800 placeholder-stone-400 pl-9 pr-8 py-2 rounded-xl border border-[#D8CCB8] focus:outline-none focus:border-stone-800"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#D8CCB8]">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs font-semibold text-stone-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="featured">Mais Relevantes</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="name">Ordem Alfabética</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-[#FAF7F2] rounded-3xl p-12 text-center border border-[#E8DFCF] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EFE8DC] flex items-center justify-center mx-auto text-stone-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-stone-900">Nenhum produto encontrado</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
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
