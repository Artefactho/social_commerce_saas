import { useState } from "react";
import { ShoppingBag, Heart, Search, Menu, X } from "lucide-react";

export interface ThemeCategory {
  id: string;
  name: string;
}

// Cores editáveis por loja (Dashboard aba "Configurações"), guardadas em
// store_theme_configs.config.colors (skills/theme-contract.md seção 3) — nunca em
// stores.primary_color/secondary_color (colunas legadas, sem consumidor).
export interface ThemeColors {
  primary?: string;
  accentPromotion?: string;
}

interface HeaderProps {
  storeName: string;
  logoUrl?: string | null;
  categories: ThemeCategory[];
  selectedCategory: string; // "" = todas
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  colors?: ThemeColors;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "L";

export const Header: React.FC<HeaderProps> = ({
  storeName,
  logoUrl,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  colors,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleCategoryClick = (categoryName: string) => {
    onSelectCategory(categoryName);
    setMobileMenuOpen(false);
    document.getElementById("catalogo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E1D5] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: mobile menu + search */}
          <div className="flex items-center gap-3 lg:gap-6 flex-1 justify-start">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-stone-700 hover:bg-[#F0EBE1] transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="relative hidden md:block w-52 lg:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar no catálogo..."
                className="w-full bg-[#F3EDE2] text-stone-800 placeholder-stone-400 text-xs rounded-full pl-9 pr-4 py-2 border border-[#E4DBCB] focus:outline-none focus:border-stone-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* CENTER: round logo/monogram + store name */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group flex flex-col items-center focus:outline-none"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#FAF6F0] via-[#F2ECE0] to-[#E5DBCB] p-0.5 shadow-md group-hover:shadow-lg transition-all transform group-hover:scale-105 border border-[#D5C7B2]">
                <div className="w-full h-full rounded-full border border-dashed border-[#B8A388] flex items-center justify-center bg-[#FAF8F5] overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={storeName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-stone-900 leading-none select-none">
                      {initialsOf(storeName)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center mt-1">
                <span className="block font-heading text-base sm:text-lg font-bold tracking-[0.15em] text-stone-900 uppercase">
                  {storeName}
                </span>
              </div>
            </a>
          </div>

          {/* RIGHT: search (mobile) + wishlist + cart */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="md:hidden p-2 rounded-full text-stone-700 hover:bg-[#F0EBE1] transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenWishlist}
              className="relative p-2.5 rounded-full bg-[#F3EDE2] text-stone-700 hover:text-rose-700 hover:bg-[#EBE2D3] border border-[#E3D9C7] transition-all"
              aria-label="Lista de Desejos"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#FAF8F5]"
                  style={colors?.accentPromotion ? { backgroundColor: colors.accentPromotion } : { backgroundColor: "#E11D48" }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 hover:opacity-90 text-[#FAF8F5] px-3.5 py-2 rounded-full transition-all"
              style={{ backgroundColor: colors?.primary || "#1F1C19" }}
              aria-label="Sacola de Compras"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-stone-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors?.accentPromotion || "#FBBF24" }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium tracking-wide">
                Sacola {cartCount > 0 ? `(${cartCount})` : ""}
              </span>
            </button>
          </div>
        </div>

        {isSearchExpanded && (
          <div className="mt-2.5 pt-2 pb-1 border-t border-[#E8E1D5] md:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar no catálogo..."
                autoFocus
                className="w-full bg-[#F3EDE2] text-stone-800 placeholder-stone-500 text-xs rounded-full pl-9 pr-8 py-2.5 border border-[#DFD5C2] focus:outline-none focus:border-stone-500"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Categorias reais da loja (Fase 3) — nunca hardcoded */}
      {categories.length > 0 && (
        <nav className="bg-[#F2ECE1]/80 border-t border-[#E8E1D5] px-4 py-1.5 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs whitespace-nowrap">
            <button
              onClick={() => handleCategoryClick("")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategory === "" ? "text-amber-200" : "text-stone-700 hover:bg-stone-200/50"
              }`}
              style={selectedCategory === "" ? { backgroundColor: colors?.primary || "#1c1917" } : undefined}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.name ? "text-amber-200" : "text-stone-700 hover:bg-stone-200/50"
                }`}
                style={selectedCategory === cat.name ? { backgroundColor: colors?.primary || "#1c1917" } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-stone-900/60 backdrop-blur-sm flex">
          <div className="bg-[#FAF8F5] w-4/5 max-w-sm h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D5]">
              <span className="font-heading font-bold text-stone-900 tracking-wide">{storeName}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full text-stone-500 hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              <button
                onClick={() => handleCategoryClick("")}
                className={`w-full text-left py-1.5 px-3 rounded-lg text-xs ${
                  selectedCategory === "" ? "bg-amber-100/80 font-bold text-stone-900" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                Todos os produtos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-xs ${
                    selectedCategory === cat.name ? "bg-amber-100/80 font-bold text-stone-900" : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
