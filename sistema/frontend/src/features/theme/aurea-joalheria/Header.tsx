import { useState } from "react";
import { ShoppingBag, Heart, Search, Menu, X } from "lucide-react";

export interface ThemeCategory {
  id: string;
  name: string;
}

// Mesmo formato de ThemeColors do Aura Maison (store_theme_configs.config.colors
// — ver skills/theme-contract.md seção 3). Cada tema decide como aplicar essas
// duas cores dentro da própria identidade visual.
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

const GOLD = "#e5b869";

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

  const primary = colors?.primary || GOLD;
  const accent = colors?.accentPromotion || "#00e5a3";

  const handleCategoryClick = (categoryName: string) => {
    onSelectCategory(categoryName);
    setMobileMenuOpen(false);
    document.getElementById("catalogo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e0e12]/95 backdrop-blur-md border-b border-[rgba(229,184,105,0.16)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: mobile menu + search */}
          <div className="flex items-center gap-3 lg:gap-6 flex-1 justify-start">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full border border-[rgba(229,184,105,0.28)] flex items-center justify-center text-[#e5b869] hover:border-[#e5b869] transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="relative hidden md:block w-52 lg:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar no catálogo..."
                className="w-full bg-[#14141a] text-[#dedee6] placeholder-[#8c8c9a] text-xs rounded-full pl-9 pr-4 py-2.5 border border-[rgba(229,184,105,0.16)] focus:outline-none focus:border-[#e5b869] transition-all"
              />
              <Search className="w-4 h-4 text-[#8c8c9a] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* CENTER: round gold-ring logo + store name */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group flex flex-col items-center gap-2.5 focus:outline-none"
            >
              <div
                className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center transition-all transform group-hover:scale-105"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #14141a, #050506)",
                  border: `2px solid ${primary}`,
                  boxShadow: `0 0 22px rgba(229,184,105,0.18)`,
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={storeName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span
                    className="font-heading text-2xl sm:text-3xl font-bold leading-none select-none"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #faebb7 0%, #e5b869 50%, #9e7529 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {initialsOf(storeName)}
                  </span>
                )}
              </div>
              <span className="block font-heading text-sm sm:text-base font-bold tracking-[0.3em] text-white uppercase">
                {storeName}
              </span>
            </a>
          </div>

          {/* RIGHT: search (mobile) + wishlist + cart */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="md:hidden w-10 h-10 rounded-full border border-[rgba(229,184,105,0.28)] flex items-center justify-center text-[#e5b869] hover:border-[#e5b869] transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenWishlist}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[rgba(229,184,105,0.28)] bg-[#14141a] flex items-center justify-center text-[#e5b869] hover:border-[#e5b869] hover:-translate-y-0.5 transition-all"
              aria-label="Lista de Desejos"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accent }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[rgba(229,184,105,0.28)] bg-[#14141a] flex items-center justify-center text-[#e5b869] hover:border-[#e5b869] hover:-translate-y-0.5 transition-all"
              aria-label="Sacola de Compras"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primary }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {isSearchExpanded && (
          <div className="mt-3 pt-3 border-t border-[rgba(229,184,105,0.16)] md:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar no catálogo..."
                autoFocus
                className="w-full bg-[#14141a] text-[#dedee6] placeholder-[#8c8c9a] text-xs rounded-full pl-9 pr-8 py-2.5 border border-[rgba(229,184,105,0.16)] focus:outline-none focus:border-[#e5b869]"
              />
              <Search className="w-4 h-4 text-[#8c8c9a] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Categorias reais da loja (Fase 3) — nunca hardcoded */}
      {categories.length > 0 && (
        <nav className="bg-black/30 border-t border-[rgba(229,184,105,0.16)] px-4 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-5 sm:gap-7 text-[11px] whitespace-nowrap">
            <button
              onClick={() => handleCategoryClick("")}
              className="uppercase tracking-[0.2em] font-medium transition-colors"
              style={{ color: selectedCategory === "" ? primary : "#8c8c9a" }}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className="uppercase tracking-[0.2em] font-medium transition-colors"
                style={{ color: selectedCategory === cat.name ? primary : "#8c8c9a" }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm flex">
          <div className="bg-[#0e0e12] w-4/5 max-w-sm h-full p-6 flex flex-col shadow-2xl overflow-y-auto border-r border-[rgba(229,184,105,0.16)]">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(229,184,105,0.16)]">
              <span className="font-heading font-bold text-white tracking-[0.2em] uppercase text-sm">{storeName}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full text-[#8c8c9a] hover:text-[#e5b869]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              <button
                onClick={() => handleCategoryClick("")}
                className="w-full text-left py-2 px-3 rounded-lg text-xs uppercase tracking-widest"
                style={selectedCategory === "" ? { color: "#050506", backgroundColor: primary, fontWeight: 700 } : { color: "#dedee6" }}
              >
                Todos os produtos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="w-full text-left py-2 px-3 rounded-lg text-xs uppercase tracking-widest"
                  style={selectedCategory === cat.name ? { color: "#050506", backgroundColor: primary, fontWeight: 700 } : { color: "#dedee6" }}
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
